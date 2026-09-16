const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

function harness({assigned=true}={}) {
 const tables={simids_user_access:assigned?[{user_id:'user',role:'admin',active:true}]:[],simids_children:Array.from({length:1001},(_,i)=>({id:String(i).padStart(4,'0'),name:'Synthetic child '+i,village:'TEST',sex:'L',dob:'2025-01-01',updated_at:'v1'})),simids_immunizations:[],simids_followups:[],simids_assessments:[],simids_education:[],simids_idl:[{child_id:'0000',service_place:'Original IDL place'}],simids_targets:[{village:'TEST',local_surviving_male:999,verified:false}]};
 const calls=[];let fail=false;
 const client={auth:{getUser:async()=>({data:{user:{id:'user'}}}),getSession:async()=>({data:{session:{}}}),onAuthStateChange:()=>{},signOut:async()=>{}},from(table){
   let filters=[],start=0,end=999,limitCount=null,orderKey=null,op='read',payload;
   const q={select(){return q},order(k){orderKey=k;return q},range(a,b){start=a;end=b;return q},limit(n){limitCount=n;return q},eq(k,v){filters.push([k,v,'eq']);return q},gt(k,v){filters.push([k,v,'gt']);return q},insert(x){op='insert';payload=x;return q},update(x){op='update';payload=x;return q},single(){return run(true)},maybeSingle(){return run(true)},then(resolve,reject){return run().then(resolve,reject)}};
   async function run(single=false){calls.push({table,op,start,end,limitCount,orderKey,filters:filters.map(x=>[...x]),payload});if(fail&&op!=='read')return {error:{message:'connection failed'}};
     let rows=tables[table].filter(r=>filters.every(([k,v,kind])=>kind==='gt'?r[k]>v:r[k]===v));
     if(orderKey)rows=[...rows].sort((a,b)=>String(a[orderKey]).localeCompare(String(b[orderKey])));
     if(op==='insert'){rows=[{...payload,updated_at:'v2'}];tables[table].push(rows[0])}
     if(op==='update'){if(!rows.length)return {error:{code:'PGRST116'}};Object.assign(rows[0],payload,{updated_at:'v2'})}
     if(single)return {data:rows[0]||null,error:null};
     return {data:limitCount===null?rows.slice(start,end+1):rows.slice(0,limitCount),error:null};
   }return q;
 }};
 const ctx={supabase:{createClient:()=>client},sessionStorage:{},localStorage:{removeItem(){}},navigator:{onLine:true},window:{},structuredClone,location:{reload(){}},console};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../backend.js'),'utf8'),ctx);
 return {api:ctx.window.SimidsBackend,calls,tables,ctx,setFail:v=>fail=v};
}
test('load pages beyond Supabase 1000-row limit with keyset pagination and preserve IDL source; unverified targets excluded',async()=>{
 const h=harness(),s=await h.api.load();assert.equal(s.children.length,1001);assert.equal(s.children[0].idlPlace,'Original IDL place');assert.equal(s.targets[0].localSurvivingMale,0);assert(h.calls.some(c=>c.table==='simids_children'&&c.filters.some(([,v,kind])=>kind==='gt'&&v==='0999')));
});
test('one changed row is updated; source fields and other children untouched',async()=>{
 const h=harness(),s=await h.api.load();s.children[0].name='Changed';await h.api.save(s,'save_child');const writes=h.calls.filter(c=>c.op!=='read');assert.equal(writes.length,1);assert.deepEqual(JSON.parse(JSON.stringify(writes[0].payload)),{name:'Changed'});assert.equal(s.children[0].updatedAt,'v2');
});
test('failed write and offline state never report success; rollback available',async()=>{
 const h=harness(),s=await h.api.load();s.children[0].name='Unsaved';h.setFail(true);await assert.rejects(h.api.save(s,'save_child'),/connection failed/);assert.equal(h.api.rollback().children[0].name,'Synthetic child 0');h.ctx.navigator.onLine=false;await assert.rejects(h.api.save(s,'save_child'),/Tidak ada koneksi/);
});
test('unauthorized account denied before any health data query',async()=>{
 const h=harness({assigned:false});await assert.rejects(h.api.load(),/belum diberi akses/);assert(!h.calls.some(c=>c.table==='simids_children'));
});
test('stale updated_at conflict is surfaced, not overwritten',async()=>{
 const h=harness(),s=await h.api.load();h.tables.simids_children[0].updated_at='v3';s.children[0].name='Stale edit';await assert.rejects(h.api.save(s,'save_child'),/berubah di perangkat lain/);assert.equal(h.tables.simids_children[0].name,'Synthetic child 0');
});
