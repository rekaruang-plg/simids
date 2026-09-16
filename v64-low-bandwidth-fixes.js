(()=>{
  const SUPABASE_URL='https://ntdqqzqgkylxixivkmrp.supabase.co';
  const PUBLIC_KEY='sb_publishable_QeWv7cMl3JCrHWBN0m5cQA_IN0Tbk_w';
  const originalFollowup=window.SimidsBackend?.followupPage;
  if(originalFollowup){
    window.SimidsBackend.followupPage=async args=>{
      const hamlet=String(args?.hamlet||'').trim();
      if(!hamlet)return originalFollowup(args);
      let session=null;
      try{session=JSON.parse(sessionStorage.getItem('simids-auth')||'null')}catch{}
      const token=session?.access_token;
      if(!token)return originalFollowup(args);
      const village=args?.village==='all'||args?.village===''?null:args?.village;
      const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/simids_followup_page`,{
        method:'POST',
        headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          p_village:village,
          p_status:args?.status==='all'?null:String(args?.status||''),
          p_warning_days:Number(args?.warningDays)||30,
          p_page:Math.max(1,Number(args?.page)||1),
          p_page_size:Math.min(100,Math.max(1,Number(args?.pageSize)||50)),
          p_hamlet:hamlet
        })
      });
      if(!response.ok){let msg=`HTTP ${response.status}`;try{const e=await response.json();msg=e?.message||e?.hint||msg}catch{}throw new Error(msg)}
      return response.json();
    };
  }

  const download=(data,name,type)=>{const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
  const today=()=>new Date().toISOString().slice(0,10);
  const overlay=(show,label='Menyiapkan data…')=>{
    let el=document.getElementById('simidsHeavyActionOverlay');
    if(!show){el?.remove();return}
    if(!el){el=document.createElement('div');el.id='simidsHeavyActionOverlay';el.style.cssText='position:fixed;inset:0;background:#f8fafce8;z-index:26000;display:grid;place-items:center;padding:24px';el.innerHTML='<div style="background:#fff;border:1px solid #dbe5e3;border-radius:18px;padding:22px 26px;text-align:center;max-width:360px"><b id="simidsHeavyActionTitle" style="display:block;font-size:18px;margin-bottom:6px"></b><small style="color:#64748b">Aksi ini memang membutuhkan data lengkap dan hanya dilakukan saat diminta.</small></div>';document.body.appendChild(el)}
    document.getElementById('simidsHeavyActionTitle').textContent=label;
  };

  document.addEventListener('click',async e=>{
    if(!e.target.closest('#downloadBackupBtn'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const state=window.SIMIDS_INITIAL||{};
    overlay(true,'Menyiapkan backup lengkap…');
    try{
      if(!state.fullEvents)await window.SimidsBackend.loadFullScope(state,state.scope||state.settings?.focusVillage||'');
      download(JSON.stringify(window.SIMIDS_INITIAL,null,2),`SiMIDS_Backup_${today()}.json`,'application/json');
    }catch(err){alert('Backup gagal disiapkan: '+(err?.message||err))}
    finally{overlay(false)}
  },true);
})();
