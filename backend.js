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
  let baseline, access;
  function unpack(key,row) {
    const [,mapping,fields]=maps[key], out={};
    fields.split(',').forEach(k=>out[k]=row[mapping[k]||k]??'');
    out.updatedAt=row.updated_at;
    if(key==='events') { out.createdAt=row.created_at?.slice(0,10)||out.date; out.sourceImport=row.source_import; }
    return out;
  }
  function pack(key,row) {
    const [,mapping,fields]=maps[key], out={};
    fields.split(',').forEach(k=>out[mapping[k]||k]=row[k]===''||row[k]===undefined?null:row[k]);
    return out;
  }
  async function all(table,order='id') {
    const rows=[];
    let cursor=null;
    for(;;) {
      let query=client.from(table).select('*').order(order).limit(1000);
      if(cursor!==null)query=query.gt(order,cursor);
      const {data,error}=await query;
      if(error)throw error;
      rows.push(...data);
      if(data.length<1000)return rows;
      cursor=data[data.length-1]?.[order];
      if(cursor===null||cursor===undefined)throw new Error(`Kolom ${order} tidak dapat dipakai untuk pagination.`);
    }
  }
  async function load() {
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new Error('Silakan masuk kembali.');
    const {data,error}=await client.from('simids_user_access').select('*').eq('user_id',user.id).eq('active',true).maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Akun belum diberi akses SiMIDS. Hubungi administrator.');
    access=data;
    const keys=Object.keys(maps);
    const result=await Promise.all(keys.map(k=>all(maps[k][0])));
    const state={settings:{role:access.role==='admin'?'puskesmas':access.role,puskesmas:'Puskesmas Tanjung Lago',year:new Date().getFullYear(),focusVillage:access.village||'TANJUNGLAGO',warningDays:30},audit:[]};
    keys.forEach((key,i)=>state[key]=result[i].map(row=>unpack(key,row)));
    const idls=await all('simids_idl','child_id');
    const byId=new Map(idls.map(x=>[x.child_id,x]));
    state.children.forEach(c=>{const i=byId.get(c.id);if(i)Object.assign(c,{idlDate:i.idl_date||'',idlInputDate:i.input_date||'',idlPlace:i.service_place||'',idlPkm:i.forming_puskesmas||'',idlStatus:i.status||''})});
    const targets=await all('simids_targets','village');
    const camel=k=>k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
    const byVillage=new Map(targets.map(t=>[t.village,{name:t.village,...Object.fromEntries(Object.entries(t).filter(([k])=>!['village','updated_at'].includes(k)).map(([k,v])=>[camel(k),k==='verified'?v:(t.verified?v:0)]))}]));
    state.children.forEach(c=>{if(!byVillage.has(c.village))byVillage.set(c.village,{name:c.village})});
    state.targets=[...byVillage.values()].sort((a,b)=>a.name.localeCompare(b.name));
    if(!byVillage.has(state.settings.focusVillage))state.settings.focusVillage=state.targets[0]?.name||'';
    baseline=structuredClone(state);
    return state;
  }
  async function save(state,action) {
    if(!navigator.onLine)throw new Error('Tidak ada koneksi. Data belum tersimpan; coba lagi setelah tersambung.');
    const key=actions[action];
    if(action==='save_settings') {
      // Display filters only; permissions are always read from the access table.
      state.settings.role=access.role==='admin'?'puskesmas':access.role;
      baseline.settings=structuredClone(state.settings);return;
    }
    if(!key)throw new Error('Operasi ini tidak tersedia pada database produksi.');
    const old=new Map(baseline[key].map(x=>[x.id,x]));
    const changed=state[key].filter(x=>JSON.stringify(pack(key,x))!==JSON.stringify(old.has(x.id)?pack(key,old.get(x.id)):null));
    if(changed.length!==1)throw new Error('Simpan satu catatan setiap kali. Muat ulang sebelum mencoba lagi.');
    const row=changed[0],before=old.get(row.id), payload=pack(key,row);
    let query;
    if(before) {
      const prev=pack(key,before),delta=Object.fromEntries(Object.entries(payload).filter(([k,v])=>k!=='id'&&v!==prev[k]));
      query=client.from(maps[key][0]).update(delta).eq('id',row.id);
      if(before.updatedAt)query=query.eq('updated_at',before.updatedAt);
    } else query=client.from(maps[key][0]).insert(payload);
    const {data,error}=await query.select().single();
    if(error)throw new Error(error.code==='23505'?'Catatan ini sudah ada. Muat ulang data sebelum mencoba lagi.':error.code==='PGRST116'?'Data berubah di perangkat lain atau akses ditolak. Muat ulang dahulu.':error.message);
    Object.assign(row,unpack(key,data));
    baseline[key]=structuredClone(state[key]);
  }
  async function login() {
    for(const key of ['simids_tanjung_lago_v6d','simids_tanjung_lago_v5','simids_tanjung_lago_v4','simids_tanjung_lago_v3','simids_tanjung_lago_v2'])localStorage.removeItem(key);
    const {data:{session}}=await client.auth.getSession();
    if(session) {try{return await load()}catch(e){await client.auth.signOut();}}
    document.body.innerHTML=`<main class="boot"><form id="loginForm" style="max-width:360px;width:100%;text-align:left"><b>Masuk SiMIDS</b><p>Gunakan akun petugas yang sudah diberi akses.</p><label>Email<input type="email" id="loginEmail" autocomplete="username" required></label><label>Kata sandi<input type="password" id="loginPassword" autocomplete="current-password" required></label><button id="loginSubmit">Masuk</button><p id="loginError" role="alert"></p><small>Data anak hanya dapat diakses petugas berizin.</small></form></main>`;
    const style=document.createElement('style');style.textContent='#loginForm input,#loginForm button{box-sizing:border-box;display:block;width:100%;padding:14px;margin:8px 0 20px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}#loginForm button{background:#087f73;color:white;cursor:pointer}#loginError{color:#b91c1c}';document.head.appendChild(style);
    return new Promise(resolve=>document.getElementById('loginForm').addEventListener('submit',async e=>{
      e.preventDefault();const button=document.getElementById('loginSubmit');button.disabled=true;
      const errorBox=document.getElementById('loginError');errorBox.textContent='';
      try {
        const {error}=await client.auth.signInWithPassword({email:document.getElementById('loginEmail').value.trim(),password:document.getElementById('loginPassword').value});
        if(error)throw new Error('Email atau kata sandi tidak sesuai, atau layanan belum bisa dihubungi.');
        resolve(await load());
      } catch(error){errorBox.textContent=error.message;await client.auth.signOut();button.disabled=false;}
    }));
  }
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&window.SIMIDS_READY)location.reload()});
  window.SimidsBackend={login,load,save,rollback:()=>structuredClone(baseline),logout:async()=>{await client.auth.signOut();location.reload()}};
})();
