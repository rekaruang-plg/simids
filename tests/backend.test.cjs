const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

function harness({assigned=true}={}) {
 const kids=[
   ...Array.from({length:50},(_,i)=>({id:'T'+String(i).padStart(3,'0'),name:'Tanjung child '+i,village:'TANJUNGLAGO',sex:'L',dob:'2025-01-01',parent_name:'Parent '+i,updated_at:'v1'})),
   ...Array.from({length:10},(_,i)=>({id:'O'+String(i).padStart(3,'0'),name:'Other child '+i,village:'OTHER',sex:'P',dob:'2025-02-01',parent_name:'Other parent '+i,updated_at:'v1'}))
 ];
 const tables={
   simids_user_access:assigned?[{user_id:'user',role:'admin',village:null,active:true}]:[],
   simids_children:kids,
   simids_immunizations:[
     {id:'E1',child_id:'T000',vaccine_code:'BCG',immunization_date:'2025-01-10',validated:true,source_import:true,updated_at:'v1'},
     {id:'E2',child_id:'O000',vaccine_code:'MR1',immunization_date:'2025-03-10',validated:true,source_import:true,updated_at:'v1'}
   ],
   simids_followups:[],simids_assessments:[],simids_education:[],
   simids_idl:[{child_id:'T000',service_place:'Original IDL place'}],
   simids_targets:[{village:'TANJUNGLAGO',local_surviving_male:999,verified:false},{village:'OTHER',verified:false}]
 };
 const calls=[];let fail=false;
 function childrenFor(village){return tables.simids_children.filter(c=>!village||c.village===village)}
 function bootstrap(village){
   const scope=village||'all',children=childrenFor(village);
   return {access:{role:'admin',village:null},scope,summary:{children_count:children.length,reminder_count:children.length,mr2_count:0},recent_events:[],service_places:[],targets:tables.simids_targets,villages:['TANJUNGLAGO','OTHER'],children:[],events:[],idls:[],followups:[],education:[],assessments:[]};
 }
 function fullScope(village){
   const children=childrenFor(village),ids=new Set(children.map(c=>c.id));
   return {children,events:tables.simids_immunizations.filter(e=>ids.has(e.child_id)),idls:tables.simids_idl.filter(e=>ids.has(e.child_id)),followups:[],education:[],assessments:[],targets:tables.simids_targets,villages:['TANJUNGLAGO','OTHER'],scope:village||'all'};
 }
 const client={
   auth:{getUser:async()=>({data:{user:{id:'user'}}}),getSession:async()=>({data:{session:{}}}),onAuthStateChange:()=>{},signOut:async()=>{}},
   rpc:async(name,args={})=>{
     calls.push({rpc:name,args});
     if(name==='simids_bootstrap')return assigned?{data:bootstrap(args.p_village||null),error:null}:{data:null,error:{message:'SiMIDS access not assigned'}};
     if(name==='simids_children_page'){
       const all=childrenFor(args.p_village||null),q=String(args.p_search||'').toLowerCase(),filtered=q?all.filter(c=>(c.name+' '+c.parent_name).toLowerCase().includes(q)):all,page=args.p_page||1,size=args.p_page_size||25,start=(page-1)*size;
       return {data:{children:filtered.slice(start,start+size).map(c=>({...c,immunization_count:tables.simids_immunizations.filter(e=>e.child_id===c.id).length,last_vaccine:tables.simids_immunizations.find(e=>e.child_id===c.id)?.vaccine_code||null,last_immunization_date:tables.simids_immunizations.find(e=>e.child_id===c.id)?.immunization_date||null})),total:filtered.length,page,page_size:size,pages:Math.max(1,Math.ceil(filtered.length/size)),scope:args.p_village||'all'},error:null};
     }
     if(name==='simids_child_detail'){
       const child=tables.simids_children.find(c=>c.id===args.p_child_id);
       return {data:{child,events:tables.simids_immunizations.filter(e=>e.child_id===args.p_child_id),idl:tables.simids_idl.find(x=>x.child_id===args.p_child_id)||null,followups:[]},error:null};
     }
     if(name==='simids_load_scope')return {data:fullScope(args.p_village||null),error:null};
     if(name==='simids_risk_page')return {data:{scope:args.p_village||'all',summary:{overdue:0,due:0,mr2:50,total:50},hamlets:[],rows:[],total:50,page:1,page_size:25,pages:2},error:null};
     if(name==='simids_report_summary')return {data:{scope:args.p_village||'all',counts:[],followup_summary:{total:0,visited:0,immunized:0}},error:null};
     if(name==='simids_dashboard_summary')return {data:{scope:args.p_village||'all',children_count:50,trend:[],validation_queue:[]},error:null};
     if(name==='simids_activity_bundle')return {data:{scope:args.p_village||'all',education:[],assessments:[]},error:null};
     throw new Error('unexpected rpc '+name);
   },
   from(table){
     let filters=[],op='read',payload;
     const q={select(){return q},eq(k,v){filters.push([k,v]);return q},insert(x){op='insert';payload=x;return q},update(x){op='update';payload=x;return q},single(){return run(true)},maybeSingle(){return run(true)},then(resolve,reject){return run().then(resolve,reject)}};
     async function run(single=false){
       calls.push({table,op,filters:filters.map(x=>[...x]),payload});
       if(fail&&op!=='read')return {error:{message:'connection failed'}};
       let rows=(tables[table]||[]).filter(r=>filters.every(([k,v])=>r[k]===v));
       if(op==='insert'){rows=[{...payload,updated_at:'v2'}];tables[table].push(rows[0])}
       if(op==='update'){
         if(!rows.length)return {error:{code:'PGRST116'}};
         Object.assign(rows[0],payload,{updated_at:'v2'});
       }
       if(single)return {data:rows[0]||null,error:null};
       return {data:rows,error:null};
     }
     return q;
   },
   functions:{invoke:async()=>({data:{users:[],villages:[]},error:null})}
 };
 const ctx={supabase:{createClient:()=>client},sessionStorage:{},localStorage:{removeItem(){}},navigator:{onLine:true},window:{},structuredClone,location:{reload(){}},console,document:{body:{innerHTML:''},head:{appendChild(){}},createElement(){return {style:{},appendChild(){}}},getElementById(){return null}}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../backend.js'),'utf8'),ctx);
 return {api:ctx.window.SimidsBackend,calls,tables,ctx,setFail:v=>fail=v};
}

test('login uses lightweight bootstrap and does not download child/event arrays',async()=>{
 const h=harness(),s=await h.api.load();
 assert.equal(s.scope,'TANJUNGLAGO');
 assert.equal(s.summary.children_count,50);
 assert.equal(s.children.length,0);
 assert.equal(s.events.length,0);
 assert.equal(h.calls.filter(c=>c.rpc==='simids_bootstrap').length,1);
 assert.equal(h.calls.filter(c=>c.rpc==='simids_load_scope').length,0);
});

test('changing focus uses another lightweight bootstrap',async()=>{
 const h=harness(),s=await h.api.load();
 await h.api.loadScope(s,'OTHER');
 assert.equal(s.scope,'OTHER');
 assert.equal(s.settings.focusVillage,'OTHER');
 assert.equal(s.summary.children_count,10);
 assert.equal(s.children.length,0);
 assert.equal(h.calls.filter(c=>c.rpc==='simids_bootstrap').length,2);
});

test('children are paginated and one child detail is hydrated only on demand',async()=>{
 const h=harness(),s=await h.api.load();
 const page=await h.api.loadChildrenPage({village:'TANJUNGLAGO',page:1,pageSize:25});
 assert.equal(page.children.length,25);
 assert.equal(page.total,50);
 assert.equal(s.children.length,0);
 const child=await h.api.hydrateChild(s,'T000');
 assert.equal(child.name,'Tanjung child 0');
 assert.equal(s.children.length,1);
 assert.equal(s.events.length,1);
 assert.equal(s.children[0].idlPlace,'Original IDL place');
});

test('one hydrated changed row is updated without touching other data',async()=>{
 const h=harness(),s=await h.api.load();
 await h.api.hydrateChild(s,'T000');
 s.children[0].name='Changed';
 await h.api.save(s,'save_child');
 const writes=h.calls.filter(c=>c.op&&c.op!=='read');
 assert.equal(writes.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(writes[0].payload)),{name:'Changed'});
 assert.equal(s.children[0].updatedAt,'v2');
});

test('failed write and offline state never report success; rollback available',async()=>{
 const h=harness(),s=await h.api.load();
 await h.api.hydrateChild(s,'T000');
 s.children[0].name='Unsaved';h.setFail(true);
 await assert.rejects(h.api.save(s,'save_child'),/connection failed/);
 assert.equal(h.api.rollback().children[0].name,'Tanjung child 0');
 h.ctx.navigator.onLine=false;
 await assert.rejects(h.api.save(s,'save_child'),/Tidak ada koneksi/);
});

test('unauthorized account is rejected by bootstrap',async()=>{
 const h=harness({assigned:false});
 await assert.rejects(h.api.load(),/SiMIDS access not assigned/);
 assert.equal(h.calls.filter(c=>c.rpc==='simids_load_scope').length,0);
});

test('stale updated_at conflict is surfaced, not overwritten',async()=>{
 const h=harness(),s=await h.api.load();
 await h.api.hydrateChild(s,'T000');
 h.tables.simids_children[0].updated_at='v3';
 s.children[0].name='Stale edit';
 await assert.rejects(h.api.save(s,'save_child'),/berubah di perangkat lain/);
 assert.equal(h.tables.simids_children[0].name,'Tanjung child 0');
});
