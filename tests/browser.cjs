// Synthetic browser integration test. Never uses or writes patient data.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'text/plain');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#loginForm').waitFor();assert(await page.locator('#loginEmail').isVisible());
 await page.screenshot({path:'/tmp/simids-login.png'});
 const user={id:'a2310101-0000-4000-8000-000000000010',email:'synthetic@example.invalid'};
 const tables={simids_user_access:[{user_id:user.id,role:'kader',village:'TEST',active:true}],simids_children:Array.from({length:1001},(_,i)=>({id:`a2310101-0000-4000-8001-${String(i).padStart(12,'0')}`,name:'Synthetic '+String(i).padStart(4,'0'),dob:'2025-01-01',sex:'L',village:'TEST',hamlet:'Dusun Test',parent_name:'Test Parent',province:'Original Province',district:'Original District',subdistrict:'Original Subdistrict',puskesmas:'TEST',updated_at:'2026-01-01T00:00:00Z'})),simids_immunizations:[],simids_followups:[],simids_assessments:[],simids_education:[],simids_idl:[],simids_targets:[]};
 let writes=0,fail=false;
 await page.route('https://ntdqqzqgkylxixivkmrp.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url());let data;
  if(url.pathname.includes('/auth/v1/user'))data=user;
  else if(url.pathname.includes('/auth/v1/logout'))data={};
  else {
   const table=url.pathname.split('/').at(-1);
   if(url.pathname.includes('/rpc/')){
     const body=req.postDataJSON()||{};
     if(['simids_load_bootstrap','simids_load_scope'].includes(table))data={children:tables.simids_children,events:tables.simids_immunizations,followups:[],education:[],assessments:[],idls:[],targets:[{village:'TEST',verified:false}],villages:['TEST'],scope:'TEST',full_events:true};
     else if(table==='simids_children_page')data={children:tables.simids_children.slice(0,50),total:tables.simids_children.length,page:1,page_size:50,pages:21,scope:'TEST'};
     else data={rows:[],children:[],total:0,pages:1};
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});return;
   }
   if(!tables[table])throw new Error('Unexpected request: '+table);
   let rows=tables[table].filter(r=>[...url.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(r[k])===v.slice(3)));
   if(['POST','PATCH','DELETE'].includes(req.method())){
    if(fail){await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'Synthetic save failure'})});return}
    writes++;const body=req.method()==='DELETE'?null:req.postDataJSON();
    if(req.method()==='DELETE'){data=rows[0];tables[table]=tables[table].filter(r=>!rows.includes(r))}
    else if(req.method()==='POST'){const added=(Array.isArray(body)?body:[body]).map(r=>({...r,updated_at:new Date().toISOString()}));tables[table].push(...added);data=Array.isArray(body)?added:added[0]}
    else{Object.assign(rows[0],body,{updated_at:new Date().toISOString()});data=rows[0]}
   }else{const start=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||1000);data=rows.slice(start,start+limit);if(req.headers().accept?.includes('vnd.pgrst.object'))data=data[0]||null}
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 const token='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.synthetic';
 await page.addInitScript(({user,token})=>{sessionStorage.setItem('simids-auth',JSON.stringify({access_token:token,refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));localStorage.setItem('simids_tanjung_lago_reminder_seen',new Date().toISOString().slice(0,10))},{user,token});
 await page.reload();await page.waitForFunction(()=>window.SIMIDS_READY===true,{timeout:30000});
 assert.equal(await page.evaluate(()=>state.children.length),1001);
 assert(await page.locator('#roleSelect').isDisabled());
 await page.evaluate(()=>showPage('children'));await page.locator('[data-edit-child]').first().click();
 await page.locator('#childName').fill('Changed Synthetic');await page.locator('#childForm button[type=submit]').click();
 await page.waitForFunction(()=>!saving);assert.equal(writes,1);assert.equal(tables.simids_children[0].name,'Changed Synthetic');assert.equal(tables.simids_children[0].province,'Original Province');
 fail=true;await page.locator(`[data-edit-child="${tables.simids_children[0].id}"]`).click();await page.locator('#childName').fill('Must not save');
 let alerted=false;page.once('dialog',async d=>{alerted=d.message().includes('Belum tersimpan');await d.accept()});
 await page.locator('#childForm button[type=submit]').click();await page.waitForFunction(()=>!saving);assert(alerted);assert.equal(writes,1);assert.equal(await page.evaluate(()=>state.children[0].name),'Changed Synthetic');

 fail=false;
 await page.locator('#cancelChildEdit').click();
 await page.locator(`[data-quick-immunize="${tables.simids_children[0].id}"]`).click();
 await page.locator('#openVaccinePicker').click();
 await page.locator('[data-pick-vaccine="BCG"]').click();
 await page.locator('[data-pick-vaccine="OPV1"]').click();
 assert.equal(await page.locator('[data-pick-vaccine][aria-pressed="true"]').count(),2);
 await page.locator('[data-pick-vaccine="OPV1"]').click();
 assert.equal(await page.locator('[data-pick-vaccine][aria-pressed="true"]').count(),1);
 await page.locator('[data-pick-vaccine="OPV1"]').click();
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(350);
 await page.screenshot({path:'/tmp/simids-multi-picker.png'});
 const finish=await page.locator('#finishVaccineSelection').boundingBox();assert(finish.y+finish.height<=844,'Picker footer must remain reachable on mobile');
 await page.locator('#finishVaccineSelection').click();
 await page.locator('#eventDate').fill('2026-09-01');
 await page.locator('#eventDate').dispatchEvent('change');
 assert((await page.locator('#immunizationReview').textContent()).includes('BCG, OPV-1'));
 fail=true;page.once('dialog',d=>d.accept());await page.locator('#saveImmunizationBtn').click();await page.waitForFunction(()=>!saving);
 assert.equal(tables.simids_immunizations.length,0);assert.equal(await page.evaluate(()=>selectedVaccines.length),2);
 fail=false;await page.locator('#saveImmunizationBtn').click();await page.waitForFunction(()=>!saving);
 assert.equal(tables.simids_immunizations.length,2);assert.equal(writes,2);
 assert(tables.simids_immunizations.every(r=>r.validated===false&&r.immunization_date==='2026-09-01'));
 await page.evaluate(()=>showPage('children'));
 const childId=tables.simids_children[0].id;
 page.once('dialog',d=>d.dismiss());await page.locator(`[data-delete-child="${childId}"]`).click();assert.equal(tables.simids_children.length,1001);
 page.once('dialog',d=>d.accept());await page.locator(`[data-delete-child="${childId}"]`).click();await page.waitForFunction(()=>!saving);
 assert.equal(tables.simids_children.length,1000);assert.equal(await page.evaluate(()=>state.events.length),0);
 await page.locator('#childVillageFilter').selectOption('all');
 await page.locator('[data-remote-edit]').first().waitFor();await page.locator('[data-remote-edit]').first().click();
 await page.locator('#childFormCard.open').waitFor();assert(await page.locator('#childName').isVisible());
 await page.locator('#cancelChildEdit').click();
 await page.evaluate(()=>showPage('home'));await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(600);await page.screenshot({path:'/tmp/simids-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
 assert.deepEqual(errors,[]);console.log('PASS: kader edit/delete, delete cancellation, remote-list edit, multi-select/deselect, atomic batch save/failure, unvalidated entries, mobile layout; no page errors.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
