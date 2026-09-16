const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

function harness({assigned=true}={}) {
 const kids=[
   ...Array.from({length:50},(_,i)=>({id:'T'+String(i).padStart(3,'0'),name:'Tanjung child '+i,village:'TANJUNGLAGO',sex:'L',dob:'2025-01-01',updated_at:'v1'})),
   ...Array.from({length:10},(_,i)=>({id:'O'+String(i).padStart(3,'0'),name:'Other child '+i,village:'OTHER',sex:'P',dob:'2025-02-01',updated_at:'v1'}))
 ];
 const tables={
   simids_user_access:assigned?[{user_id:'user',role:'admin',village:null,active:true}]:[],
   simids_children:kids,
   simids_immunizations:[
     {id:'E1',child_id:'T000',vaccine_code:'BCG',immunization_date:'2025-01-10',validated:true,updated_at:'v1'},
     {id:'E2',child_id:'O000',vaccine_code:'MR1',immunization_date:'2025-03-10',validated:true,updated_at:'v1'}
   ],
   simids_followups:[],simids_assessments:[],simids_education:[],
   simids_idl:[{child_id:'T000',service_place:'Original IDL place'}],
   simids_targets:[{village:'TANJUNGLAGO',local_surviving_male:999,verified:false},{village:'OTHER',verified:false}]
 };
 const calls=[];let fail=false;
 function scopePayload(village){
   const all=!village;
   const children=tables.simids_children.filter(c=>all||c.village===village);
   const ids=new Set(children.map(c=>c.id));
   return {
     children,
     events:tables.simids_immunizations.filter(e=>ids.has(e.child_id)),
     idls:tables.simids_idl.filter(e=>ids.has(e.child_id)),
     followups:tables.simids_followups.filter(e=>ids.has(e.child_id)),
     education:tables.simids_education.filter(e=>all||e.village===village),
     assessments:tables.simids_assessments.filter(e=>all||e.village===village),
     targets:tables.simids_targets,
     villages:[...new Set(tables.simids_children.map(c=>c.village))],
     scope:village||'all'
   };
 }
 const client={
   auth:{getUser:async()=>({data:{user:{id:'user'}}}),getSession:async()=>({data:{session:{}}}),onAuthStateChange:()=>{},signOut:async()=>{}},
   rpc:async(name,args)=>{calls.push({rpc:name,args});return {data:scopePayload(args?.p_village||null),error:null}},
   from(table){
     let filters=[],op='read',payload;
     const q={select(){return q},eq(k,v){filters.push([k,v]);return q},insert(x){op='insert';payload=x;return q},update(x){op='update';payload=x;return q},single(){return run(true)},maybeSingle(){return run(true)},then(resolve,reject){return run().then(resolve,reject)}};
     async function run(single=false){
       calls.push({table,op,filters:filters.map(x=>[...x]),payload});
       if(fail&&op!=='read')return {error:{message:'connection failed'}};
       let rows=tables[table].filter(r=>filters.every(([k,v])=>r[k]===v));
       if(op==='insert'){rows=[{...payload,updated_at:'v2'}];tables[table].push(rows[0])}
       if(op==='update'){
         if(!rows.length)return {error:{code:'PGRST116'}};
         Object.assign(rows[0],payload,{updated_at:'v2'});
       }
       if(single)return {data:rows[0]||null,error:null};
       return {data:rows,error:null};
     }
     return q;
   }
 };
 const ctx={supabase:{createClient:()=>client},sessionStorage:{},localStorage:{removeItem(){}},navigator:{onLine:true},window:{},structuredClone,location:{reload(){}},console};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../backend.js'),'utf8'),ctx);
 return {api:ctx.window.SimidsBackend,calls,tables,ctx,setFail:v=>fail=v};
}

test('login loads only the default village through one scope RPC',async()=>{
 const h=harness(),s=await h.api.load();
 assert.equal(s.scope,'TANJUNGLAGO');
 assert.equal(s.children.length,50);
 assert.equal(s.events.length,1);
 assert.equal(s.children[0].idlPlace,'Original IDL place');
 assert.equal(s.targets.find(x=>x.name==='TANJUNGLAGO').localSurvivingMale,0);
 assert.equal(h.calls.filter(c=>c.rpc==='simids_load_scope').length,1);
});

test('loadScope switches village without loading the whole database',async()=>{
 const h=harness(),s=await h.api.load();
 await h.api.loadScope(s,'OTHER');
 assert.equal(s.scope,'OTHER');
 assert.equal(s.settings.focusVillage,'OTHER');
 assert.equal(s.children.length,10);
 assert.equal(s.events.length,1);
 assert(s.children.every(c=>c.village==='OTHER'));
});

test('one changed row is updated; source fields and other children untouched',async()=>{
 const h=harness(),s=await h.api.load();
 s.children[0].name='Changed';
 await h.api.save(s,'save_child');
 const writes=h.calls.filter(c=>c.op&&c.op!=='read');
 assert.equal(writes.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(writes[0].payload)),{name:'Changed'});
 assert.equal(s.children[0].updatedAt,'v2');
});

test('failed write and offline state never report success; rollback available',async()=>{
 const h=harness(),s=await h.api.load();
 s.children[0].name='Unsaved';h.setFail(true);
 await assert.rejects(h.api.save(s,'save_child'),/connection failed/);
 assert.equal(h.api.rollback().children[0].name,'Tanjung child 0');
 h.ctx.navigator.onLine=false;
 await assert.rejects(h.api.save(s,'save_child'),/Tidak ada koneksi/);
});

test('unauthorized account denied before scope RPC',async()=>{
 const h=harness({assigned:false});
 await assert.rejects(h.api.load(),/belum diberi akses/);
 assert.equal(h.calls.filter(c=>c.rpc==='simids_load_scope').length,0);
});

test('stale updated_at conflict is surfaced, not overwritten',async()=>{
 const h=harness(),s=await h.api.load();
 h.tables.simids_children[0].updated_at='v3';
 s.children[0].name='Stale edit';
 await assert.rejects(h.api.save(s,'save_child'),/berubah di perangkat lain/);
 assert.equal(h.tables.simids_children[0].name,'Tanjung child 0');
});
