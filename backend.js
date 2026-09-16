/* Supabase SDK is vendored at a pinned version. Only a public key belongs here. */
(() => {
  const client = supabase.createClient('https://ntdqqzqgkylxixivkmrp.supabase.co',
    'sb_publishable_QeWv7cMl3JCrHWBN0m5cQA_IN0Tbk_w', {
      auth: { storage: sessionStorage, storageKey: 'simids-auth', persistSession: true }
    });
  const maps = {
    children: ['simids_children', { parentName:'parent_name', registeredAt:'registered_at' },
      'id,name,dob,sex,village,hamlet,posyandu,nik,parentName,phone,address,province,district,subdistrict,puskesmas,registeredAt'],
    events: ['simids_immunizations', {childId:'child_id',vaccineId:'vaccine_code',date:'immunization_date',inputDate:'input_date',servicePlace:'service_place',nextDueDate:'next_due_date',batch:'batch_number'},
      'id,childId,vaccineId,date,inputDate,servicePlace,nextDueDate,batch,notes,validated,provider'],
    followups: ['simids_followups',{childId:'child_id',date:'followup_date'},'id,childId,date,outcome,notes'],
    education: ['simids_education',{date:'activity_date',type:'activity_type'},'id,date,type,village,hamlet,participants,topic,notes'],
    assessments: ['simids_assessments',{name:'respondent_name',type:'respondent_type',date:'assessment_date',pre:'pre_score',post:'post_score'},'id,name,type,village,date,pre,post']
  };
  const actions = {save_child:'children',save_immunization:'events',validate_event:'events',save_followup:'followups',save_education:'education',save_assessment:'assessments'};
  const INTERNAL_LOGIN_DOMAIN='simids.example.com';
  let baseline, access, scopePromise=null;

  function unpack(key,row) {
    const [,mapping,fields]=maps[key], out={};
    fields.split(',').forEach(k=>out[k]=row?.[mapping[k]||k]??'');
    out.updatedAt=row?.updated_at;
    if(key==='events') { out.createdAt=row?.created_at?.slice?.(0,10)||out.date; out.sourceImport=row?.source_import; }
    return out;
  }
  function pack(key,row) {
    const [,mapping,fields]=maps[key], out={};
    fields.split(',').forEach(k=>out[mapping[k]||k]=row[k]===''||row[k]===undefined?null:row[k]);
    return out;
  }
  const camel=k=>k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
  const loginEmail=value=>{
    const id=String(value||'').trim().toLowerCase();
    return id.includes('@')?id:`${id}@${INTERNAL_LOGIN_DOMAIN}`;
  };
  const normalizedVillage=value=>value==='all'||value===''||value==null?null:String(value).trim();

  function applyTargets(target,payload) {
    const byVillage=new Map((payload.targets||[]).map(t=>[
      t.village,
      {name:t.village,...Object.fromEntries(Object.entries(t).filter(([k])=>!['village','updated_at'].includes(k)).map(([k,v])=>[camel(k),k==='verified'?v:(t.verified?v:0)]))}
    ]));
    (payload.villages||[]).forEach(v=>{if(v&&!byVillage.has(v))byVillage.set(v,{name:v})});
    target.targets=[...byVillage.values()].sort((a,b)=>a.name.localeCompare(b.name));
  }

  async function getAccess() {
    if(access)return access;
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new Error('Silakan masuk kembali.');
    const {data,error}=await client.from('simids_user_access').select('user_id,role,village,active').eq('user_id',user.id).eq('active',true).maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Akun belum diberi akses SiMIDS. Hubungi administrator.');
    access=data;
    return data;
  }

  async function fetchBootstrap(village,warningDays=30) {
    const {data,error}=await client.rpc('simids_bootstrap',{p_village:normalizedVillage(village),p_warning_days:Number(warningDays)||30});
    if(error)throw error;
    if(!data||typeof data!=='object')throw new Error('Ringkasan SiMIDS tidak dapat dimuat.');
    if(data.access)access={role:data.access.role,village:data.access.village,active:true};
    return data;
  }

  async function fetchFullScope(village) {
    const {data,error}=await client.rpc('simids_load_scope',{p_village:normalizedVillage(village)});
    if(error)throw error;
    if(!data||typeof data!=='object')throw new Error('Data SiMIDS tidak dapat dimuat.');
    return data;
  }

  function settingsFor(target,focusVillage) {
    const settings=target.settings||{
      role:access?.role==='admin'?'puskesmas':(access?.role||'kader'),
      puskesmas:'Puskesmas Tanjung Lago',
      year:new Date().getFullYear(),
      focusVillage:focusVillage||access?.village||'TANJUNGLAGO',
      warningDays:30
    };
    settings.role=access?.role==='admin'?'puskesmas':(access?.role||settings.role||'kader');
    if(focusVillage&&focusVillage!=='all')settings.focusVillage=focusVillage;
    return settings;
  }

  function applyBootstrap(state,payload,{focusVillage}={}) {
    const target=state||{};
    const scope=payload.scope||focusVillage||access?.village||'TANJUNGLAGO';
    target.settings=settingsFor(target,scope==='all'?focusVillage:scope);
    target.authRole=access?.role||payload.access?.role||'kader';
    target.audit=target.audit||[];
    target.children=[];target.events=[];target.followups=[];target.education=[];target.assessments=[];
    target.summary=payload.summary||{};
    target.recentEvents=payload.recent_events||[];
    target.servicePlaces=(payload.service_places||[]).filter(Boolean);
    applyTargets(target,payload);
    if(!target.targets.some(x=>x.name===target.settings.focusVillage)&&target.targets.length)target.settings.focusVillage=target.targets[0].name;
    target.scope=scope;
    target.lowBandwidth=true;
    baseline=structuredClone(target);
    window.SIMIDS_INITIAL=target;
    return target;
  }

  function applyFullPayload(state,payload,{focusVillage}={}) {
    const target=state||{};
    const scope=payload.scope||focusVillage||'all';
    target.settings=settingsFor(target,scope==='all'?focusVillage:scope);
    target.authRole=access?.role||'kader';target.audit=target.audit||[];
    for(const key of Object.keys(maps))target[key]=(payload[key]||[]).map(row=>unpack(key,row));
    const byId=new Map((payload.idls||[]).map(x=>[x.child_id,x]));
    target.children.forEach(c=>{const i=byId.get(c.id);if(i)Object.assign(c,{idlDate:i.idl_date||'',idlInputDate:i.input_date||'',idlPlace:i.service_place||'',idlPkm:i.forming_puskesmas||'',idlStatus:i.status||''})});
    applyTargets(target,payload);
    target.scope=scope;target.lowBandwidth=false;
    target.servicePlaces=[...new Set([...target.events.map(e=>e.servicePlace),...target.children.map(c=>c.posyandu)].filter(Boolean))].sort();
    baseline=structuredClone(target);window.SIMIDS_INITIAL=target;return target;
  }

  async function load() {
    const focus=access?.village||'TANJUNGLAGO';
    const payload=await fetchBootstrap(focus,30);
    const resolved=payload.scope==='all'?(access?.village||focus):payload.scope;
    return applyBootstrap(null,payload,{focusVillage:resolved});
  }

  async function loadScope(state,village) {
    if(scopePromise)return scopePromise;
    scopePromise=(async()=>{
      const current=state||window.SIMIDS_INITIAL||{};
      const warning=current.settings?.warningDays||30;
      const payload=await fetchBootstrap(village,warning);
      const nextFocus=payload.scope==='all'?(current.settings?.focusVillage||access?.village||'TANJUNGLAGO'):payload.scope;
      return applyBootstrap(current,payload,{focusVillage:nextFocus});
    })();
    try{return await scopePromise}finally{scopePromise=null}
  }

  async function loadFullScope(state,village) {
    if(!access)await getAccess();
    const payload=await fetchFullScope(village);
    const current=state||window.SIMIDS_INITIAL||{};
    const nextFocus=payload.scope==='all'?(current.settings?.focusVillage||access?.village||'TANJUNGLAGO'):payload.scope;
    return applyFullPayload(current,payload,{focusVillage:nextFocus});
  }

  async function loadChildrenPage({village='all',search='',page=1,pageSize=25}={}) {
    const safePage=Math.max(1,Number(page)||1),safeSize=Math.min(100,Math.max(1,Number(pageSize)||25));
    const {data,error}=await client.rpc('simids_children_page',{p_village:normalizedVillage(village),p_search:String(search||'').trim()||null,p_page:safePage,p_page_size:safeSize});
    if(error)throw error;
    if(!data||typeof data!=='object')throw new Error('Halaman data anak tidak dapat dimuat.');
    return {
      children:(data.children||[]).map(row=>({
        ...unpack('children',row),immunizationCount:Number(row.immunization_count||0),lastVaccine:row.last_vaccine||'',lastImmunizationDate:row.last_immunization_date||'',
        nextDueDate:row.next_due_date||'',hasMr2:!!row.has_mr2,riskStatus:row.risk_status||'ok'
      })),
      total:Number(data.total||0),page:Number(data.page||safePage),pageSize:Number(data.page_size||safeSize),pages:Number(data.pages||1),scope:data.scope||normalizedVillage(village)||'all'
    };
  }

  async function hydrateChild(state,childId) {
    const target=state||window.SIMIDS_INITIAL;
    if(!target)throw new Error('Aplikasi belum siap.');
    const {data,error}=await client.rpc('simids_child_detail',{p_child_id:childId});
    if(error)throw error;
    if(!data?.child)throw new Error('Data anak tidak ditemukan.');
    const child=unpack('children',data.child),idl=data.idl;
    if(idl)Object.assign(child,{idlDate:idl.idl_date||'',idlInputDate:idl.input_date||'',idlPlace:idl.service_place||'',idlPkm:idl.forming_puskesmas||'',idlStatus:idl.status||''});
    const ix=target.children.findIndex(x=>x.id===child.id);if(ix>=0)target.children[ix]=child;else target.children.push(child);
    target.events=target.events.filter(x=>x.childId!==child.id).concat((data.events||[]).map(row=>unpack('events',row)));
    target.followups=target.followups.filter(x=>x.childId!==child.id).concat((data.followups||[]).map(row=>unpack('followups',row)));
    target.servicePlaces=[...new Set([...(target.servicePlaces||[]),child.posyandu,...target.events.filter(x=>x.childId===child.id).map(x=>x.servicePlace)].filter(Boolean))].sort();
    baseline=structuredClone(target);window.SIMIDS_INITIAL=target;return child;
  }

  async function loadRiskPage({village,status='all',hamlet='',page=1,pageSize=25,warningDays=30}={}) {
    const {data,error}=await client.rpc('simids_risk_page',{p_village:normalizedVillage(village),p_status:status||null,p_hamlet:hamlet||null,p_page:Math.max(1,Number(page)||1),p_page_size:Math.min(50,Math.max(1,Number(pageSize)||25)),p_warning_days:Number(warningDays)||30});
    if(error)throw error;return data||{};
  }

  async function loadReport({village,year,month}={}) {
    const {data,error}=await client.rpc('simids_report_summary',{p_village:normalizedVillage(village),p_year:Number(year)||new Date().getFullYear(),p_month:Number(month)||new Date().getMonth()+1});
    if(error)throw error;return data||{};
  }

  async function loadDashboard({village,vaccine='MR2',warningDays=30}={}) {
    const {data,error}=await client.rpc('simids_dashboard_summary',{p_village:normalizedVillage(village),p_vaccine:vaccine||'MR2',p_warning_days:Number(warningDays)||30});
    if(error)throw error;return data||{};
  }

  async function loadActivities(state,village) {
    const target=state||window.SIMIDS_INITIAL;if(!target)throw new Error('Aplikasi belum siap.');
    const {data,error}=await client.rpc('simids_activity_bundle',{p_village:normalizedVillage(village)});if(error)throw error;
    target.education=(data?.education||[]).map(row=>unpack('education',row));target.assessments=(data?.assessments||[]).map(row=>unpack('assessments',row));
    baseline=structuredClone(target);window.SIMIDS_INITIAL=target;return data||{};
  }

  async function validateEvent(eventId) {
    const {data,error}=await client.from('simids_immunizations').update({validated:true}).eq('id',eventId).select().single();if(error)throw error;
    const target=window.SIMIDS_INITIAL;if(target){const e=target.events.find(x=>x.id===eventId);if(e)Object.assign(e,unpack('events',data));baseline=structuredClone(target)}
    return data;
  }

  async function adminUsers(action='list',payload={}) {
    if(!access)await getAccess();
    if(access.role!=='admin')throw new Error('Hanya administrator SiMIDS yang dapat mengelola akun.');
    const {data,error}=await client.functions.invoke('simids-admin-users',{body:{action,...payload}});
    if(error) {
      let message=error.message||'Permintaan pengelolaan akun gagal.';
      try {const details=await error.context?.json?.();if(details?.error)message=details.error}catch{}
      throw new Error(message);
    }
    if(data?.error)throw new Error(data.error);return data||{};
  }

  async function save(state,action) {
    if(!navigator.onLine)throw new Error('Tidak ada koneksi. Data belum tersimpan; coba lagi setelah tersambung.');
    const key=actions[action];
    if(action==='save_settings') {state.settings.role=access.role==='admin'?'puskesmas':access.role;baseline.settings=structuredClone(state.settings);return}
    if(!key)throw new Error('Operasi ini tidak tersedia pada database produksi.');
    const old=new Map((baseline[key]||[]).map(x=>[x.id,x]));
    const changed=state[key].filter(x=>JSON.stringify(pack(key,x))!==JSON.stringify(old.has(x.id)?pack(key,old.get(x.id)):null));
    if(changed.length!==1)throw new Error('Simpan satu catatan setiap kali. Muat ulang sebelum mencoba lagi.');
    const row=changed[0],before=old.get(row.id),payload=pack(key,row);let query;
    if(before) {const prev=pack(key,before),delta=Object.fromEntries(Object.entries(payload).filter(([k,v])=>k!=='id'&&v!==prev[k]));query=client.from(maps[key][0]).update(delta).eq('id',row.id);if(before.updatedAt)query=query.eq('updated_at',before.updatedAt)}
    else query=client.from(maps[key][0]).insert(payload);
    const {data,error}=await query.select().single();
    if(error)throw new Error(error.code==='23505'?'Catatan ini sudah ada. Muat ulang data sebelum mencoba lagi.':error.code==='PGRST116'?'Data berubah di perangkat lain atau akses ditolak. Muat ulang dahulu.':error.message);
    Object.assign(row,unpack(key,data));baseline[key]=structuredClone(state[key]);
  }

  async function login() {
    for(const key of ['simids_tanjung_lago_v6d','simids_tanjung_lago_v5','simids_tanjung_lago_v4','simids_tanjung_lago_v3','simids_tanjung_lago_v2'])localStorage.removeItem(key);
    const {data:{session}}=await client.auth.getSession();
    if(session){try{return await load()}catch(e){await client.auth.signOut()}}
    document.body.innerHTML=`<main class="boot"><form id="loginForm" style="max-width:360px;width:100%;text-align:left"><b>Masuk SiMIDS</b><p>Gunakan akun petugas yang sudah diberi akses.</p><label>Email / Username<input type="text" id="loginEmail" autocomplete="username" placeholder="contoh: kader.tanjung1" required></label><label>Kata sandi<input type="password" id="loginPassword" autocomplete="current-password" required></label><button id="loginSubmit">Masuk</button><p id="loginStatus" aria-live="polite"></p><p id="loginError" role="alert"></p><small>Akun petugas internal tidak memerlukan konfirmasi email.</small></form></main>`;
    const style=document.createElement('style');style.textContent='#loginForm input,#loginForm button{box-sizing:border-box;display:block;width:100%;padding:14px;margin:8px 0 20px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}#loginForm button{background:#087f73;color:white;cursor:pointer}#loginStatus{color:#64748b;min-height:1.2em}#loginError{color:#b91c1c}';document.head.appendChild(style);
    return new Promise(resolve=>document.getElementById('loginForm').addEventListener('submit',async e=>{
      e.preventDefault();const button=document.getElementById('loginSubmit');button.disabled=true;const errorBox=document.getElementById('loginError'),statusBox=document.getElementById('loginStatus');errorBox.textContent='';statusBox.textContent='Memeriksa akun…';
      try {const identity=document.getElementById('loginEmail').value;const {error}=await client.auth.signInWithPassword({email:loginEmail(identity),password:document.getElementById('loginPassword').value});if(error)throw new Error('Username/email atau kata sandi tidak sesuai, atau layanan belum bisa dihubungi.');button.textContent='Memuat…';statusBox.textContent='Login berhasil. Menyiapkan ringkasan…';resolve(await load())}
      catch(error){statusBox.textContent='';errorBox.textContent=error.message;await client.auth.signOut();button.disabled=false;button.textContent='Masuk'}
    }));
  }

  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&window.SIMIDS_READY)location.reload()});
  window.SimidsBackend={login,load,loadScope,loadFullScope,loadChildrenPage,hydrateChild,loadRiskPage,loadReport,loadDashboard,loadActivities,validateEvent,save,adminUsers,
    authRole:()=>access?.role||null,
    rollback:()=>{const copy=structuredClone(baseline);window.SIMIDS_INITIAL=copy;return copy},
    logout:async()=>{await client.auth.signOut();location.reload()}
  };
})();