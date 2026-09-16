(()=>{
  const URL='https://ntdqqzqgkylxixivkmrp.supabase.co';
  const KEY='sb_publishable_QeWv7cMl3JCrHWBN0m5cQA_IN0Tbk_w';
  let dashboardClient=null;
  const client=()=>dashboardClient||(dashboardClient=supabase.createClient(URL,KEY,{auth:{storage:sessionStorage,storageKey:'simids-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
  let initialized=false,busy=false,channel=null,refreshTimer=null,stale=false,officialVillages=[];
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pct=n=>Number(n||0).toLocaleString('id-ID',{maximumFractionDigits:1});
  const fmtTime=v=>{const d=v?new Date(v):new Date();return Number.isNaN(d.getTime())?'baru saja':d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})};
  const role=()=>window.SIMIDS_INITIAL?.authRole||'kader';
  const state=()=>window.SIMIDS_INITIAL||{};

  function addStyle(){
    if(document.getElementById('simids-village-dashboard-style'))return;
    const style=document.createElement('style');style.id='simids-village-dashboard-style';style.textContent=`
      .village-dash-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.village-dash-toolbar select{min-width:190px;min-height:44px;padding:9px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font:inherit}
      .live-chip{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:#ecfdf5;color:#166534;font-weight:800;font-size:12px}.live-chip.wait{background:#fff7ed;color:#9a3412}.live-dot{width:8px;height:8px;border-radius:50%;background:currentColor}
      .village-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}.village-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:15px}.village-kpi b{display:block;font-size:25px;line-height:1.1}.village-kpi span{display:block;color:#64748b;font-size:12px;margin-top:5px}
      .village-map-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.village-risk-card{border:1px solid #dbe5e3;border-radius:14px;padding:14px;background:#fff;text-align:left;cursor:pointer}.village-risk-card:hover{transform:translateY(-1px)}.village-risk-card.high{border-left:6px solid #b91c1c}.village-risk-card.medium{border-left:6px solid #d97706}.village-risk-card.low{border-left:6px solid #15803d}.village-risk-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.village-risk-head b{font-size:14px}.risk-pill{font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;background:#f1f5f9}.village-risk-rate{font-size:28px;font-weight:900;margin:10px 0 3px}.village-risk-card small{display:block;color:#64748b;line-height:1.45}
      .missing-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.missing-row{border:1px solid #e2e8f0;border-radius:12px;padding:12px}.missing-row-top{display:flex;justify-content:space-between;gap:10px}.missing-row-top b:last-child{font-size:18px}.missing-row small{display:block;color:#64748b;margin-top:3px}.missing-track{height:7px;background:#eef2f7;border-radius:999px;margin-top:9px;overflow:hidden}.missing-fill{height:100%;background:currentColor;border-radius:999px}.missing-row{color:#0f766e}.dash-note{padding:11px 13px;border:1px solid #dbe7e5;background:#f8fbfa;border-radius:12px;color:#475569;font-size:13px;line-height:1.45;margin-top:12px}
      .village-empty{padding:24px;text-align:center;color:#64748b}.dashboard-refreshing{opacity:.62;pointer-events:none}
      @media(max-width:900px){.village-kpis{grid-template-columns:repeat(2,1fr)}.village-map-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){.village-map-grid,.missing-grid{grid-template-columns:1fr}.village-kpis{grid-template-columns:1fr 1fr}.village-dash-toolbar{align-items:stretch}.village-dash-toolbar select,.village-dash-toolbar button{width:100%}}
    `;document.head.appendChild(style);
  }

  function injectPage(){
    if(document.getElementById('page-village-dashboard'))return true;
    const menu=document.querySelector('.side-menu'),main=document.querySelector('.main-content');if(!menu||!main)return false;
    const dashboardBtn=menu.querySelector('[data-page="dashboard"]');
    const btn=document.createElement('button');btn.className='nav-btn advanced-nav';btn.dataset.page='village-dashboard';btn.innerHTML='<span>▦</span><b>Dashboard Imunisasi Desa</b>';
    if(role()==='kader')btn.style.display='none';
    dashboardBtn?.insertAdjacentElement('afterend',btn);
    const page=document.createElement('section');page.className='page';page.id='page-village-dashboard';page.innerHTML=`
      <div class="page-title"><div><span class="section-kicker">MONITORING DESA</span><h1>Dashboard Imunisasi Desa</h1><p>Peta risiko per desa dan jumlah anak yang belum memiliki catatan imunisasi per jenis. Tidak memakai dusun.</p></div></div>
      <div class="card"><div class="card-head responsive"><div><span class="section-kicker">DATA LANGSUNG</span><h2>Ringkasan Imunisasi</h2><p>Dashboard memperbarui angka otomatis saat data anak atau imunisasi berubah.</p></div><div class="village-dash-toolbar"><select id="villageDashFilter"></select><button class="btn secondary" id="villageDashRefresh" type="button">↻ Perbarui</button><span class="live-chip wait" id="villageDashLive"><i class="live-dot"></i><span>Menghubungkan real-time…</span></span></div></div><div id="villageDashKpis" class="village-kpis"></div><div id="villageDashQuality" class="dash-note" hidden></div></div>
      <div class="card"><div class="card-head"><div><span class="section-kicker">PETA RISIKO DESA</span><h2>Prioritas Desa</h2><p>Skematik berdasarkan kelengkapan catatan 18 jenis imunisasi. Bukan peta batas geografis dan tidak memakai data dusun.</p></div></div><div class="risk-map-legend"><span><i class="legend-dot high"></i> Risiko tinggi</span><span><i class="legend-dot medium"></i> Perlu perhatian</span><span><i class="legend-dot low"></i> Lebih rendah</span></div><div id="villageRiskGrid" class="village-map-grid"></div></div>
      <div class="card"><div class="card-head"><div><span class="section-kicker">BELUM IMUNISASI</span><h2>Jumlah Anak per Jenis Imunisasi</h2><p>Jumlah anak terdaftar yang belum memiliki catatan untuk masing-masing jenis imunisasi.</p></div></div><div id="vaccineMissingGrid" class="missing-grid"></div><div class="dash-note"><b>Catatan interpretasi:</b> angka “belum” berarti belum ada catatan imunisasi tersebut di SiMIDS. Dashboard ini untuk monitoring operasional dan tidak menentukan apakah suatu vaksin sudah jatuh tempo secara klinis.</div></div>`;
    const report=document.getElementById('page-report');if(report)report.before(page);else main.appendChild(page);
    return true;
  }

  function fillFilter(){
    const el=document.getElementById('villageDashFilter');if(!el)return;
    const s=state(),auth=role(),current=el.value;
    if(auth==='admin'||auth==='puskesmas')el.innerHTML='<option value="all">Semua desa</option>'+officialVillages.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    else {const assigned=s.scope&&s.scope!=='all'?s.scope:(s.settings?.focusVillage||'');el.innerHTML=`<option value="${esc(assigned)}">${esc(assigned)}</option>`}
    if([...el.options].some(o=>o.value===current))el.value=current;
  }

  function setLive(text,waiting=false){const el=document.getElementById('villageDashLive');if(!el)return;el.classList.toggle('wait',waiting);const span=el.querySelector('span');if(span)span.textContent=text}

  function render(data){
    const wrap=document.getElementById('page-village-dashboard');if(!wrap)return;
    const kpis=document.getElementById('villageDashKpis');
    const villages=data.villages||[],vaccines=data.vaccines||[];
    const filter=document.getElementById('villageDashFilter');
    if((filter?.value||'all')==='all'&&villages.length>1){officialVillages=[...new Set(villages.map(v=>v.village).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));fillFilter();if(filter)filter.value='all'}
    const high=villages.filter(v=>v.risk_level==='high').length;
    const childLabel=(data.scope||'all')==='all'?'Anak dalam 12 desa':'Anak di desa';
    kpis.innerHTML=[[childLabel,Number(data.total_children||0).toLocaleString('id-ID')],['Desa risiko tinggi',high],['Menunggu validasi',Number(data.pending_validation||0).toLocaleString('id-ID')],['Jenis imunisasi',vaccines.length]].map(([l,v])=>`<div class="village-kpi"><b>${v}</b><span>${l}</span></div>`).join('');
    const quality=document.getElementById('villageDashQuality'),unmapped=Number(data.unmapped_children||0);
    if(quality){quality.hidden=!unmapped;quality.innerHTML=unmapped?`<b>Perlu cek kualitas data:</b> ${unmapped.toLocaleString('id-ID')} anak memiliki nilai desa di luar 12 desa master, sehingga tidak dimasukkan ke peta risiko desa ini.`:''}
    const map=document.getElementById('villageRiskGrid');
    map.innerHTML=villages.length?villages.map(v=>{const label=v.risk_level==='high'?'Tinggi':v.risk_level==='medium'?'Perhatian':'Lebih rendah',worst=v.worst_vaccine||{};return `<button type="button" class="village-risk-card ${esc(v.risk_level)}" data-village-risk="${esc(v.village)}"><div class="village-risk-head"><b>${esc(v.village)}</b><span class="risk-pill">${label}</span></div><div class="village-risk-rate">${pct(v.missing_rate)}%</div><small>${Number(v.total_children||0).toLocaleString('id-ID')} anak • ${Number(v.incomplete_children||0).toLocaleString('id-ID')} belum lengkap</small><small>Paling banyak belum: <b>${esc(worst.label||'-')}</b> (${Number(worst.missing||0).toLocaleString('id-ID')} anak)</small></button>`}).join(''):'<div class="village-empty">Belum ada data desa.</div>';
    const missing=document.getElementById('vaccineMissingGrid');
    missing.innerHTML=vaccines.length?vaccines.map(v=>`<div class="missing-row"><div class="missing-row-top"><b>${esc(v.label)}</b><b>${Number(v.missing_children||0).toLocaleString('id-ID')}</b></div><small>${pct(v.missing_percent)}% dari ${Number(v.total_children||0).toLocaleString('id-ID')} anak belum tercatat • sudah tercatat ${Number(v.recorded_children||0).toLocaleString('id-ID')}</small><div class="missing-track"><div class="missing-fill" style="width:${Math.min(100,Number(v.missing_percent||0))}%"></div></div></div>`).join(''):'<div class="village-empty">Belum ada data imunisasi.</div>';
    setLive(`Real-time aktif • diperbarui ${fmtTime(data.generated_at)}`,false);stale=false;
  }

  async function loadDashboard({silent=false}={}){
    if(busy)return;busy=true;const page=document.getElementById('page-village-dashboard');page?.classList.add('dashboard-refreshing');
    if(!silent)setLive('Memuat ringkasan…',true);
    try{
      const village=document.getElementById('villageDashFilter')?.value||'all';
      const {data,error}=await client().rpc('simids_village_immunization_dashboard',{p_village:village==='all'?null:village});
      if(error)throw error;render(data||{});
    }catch(err){console.error(err);setLive('Gagal memperbarui • tekan Perbarui',true)}
    finally{busy=false;page?.classList.remove('dashboard-refreshing')}
  }

  function scheduleRealtime(){
    stale=true;setLive('Ada update baru • memperbarui…',true);clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{if(document.getElementById('page-village-dashboard')?.classList.contains('active'))loadDashboard({silent:true})},550);
  }

  function startRealtime(){
    if(channel)return;
    channel=client().channel('simids-village-dashboard-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'simids_children'},scheduleRealtime)
      .on('postgres_changes',{event:'*',schema:'public',table:'simids_immunizations'},scheduleRealtime)
      .subscribe(status=>{if(status==='SUBSCRIBED')setLive('Real-time aktif',false);else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')setLive('Real-time terputus • gunakan Perbarui',true)});
  }

  function bind(){
    document.getElementById('villageDashRefresh')?.addEventListener('click',()=>loadDashboard());
    document.getElementById('villageDashFilter')?.addEventListener('change',()=>loadDashboard());
    document.getElementById('villageRiskGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-village-risk]'),f=document.getElementById('villageDashFilter');if(!b||!f||![...f.options].some(o=>o.value===b.dataset.villageRisk))return;f.value=b.dataset.villageRisk;loadDashboard()});
    document.addEventListener('click',e=>{const nav=e.target.closest('[data-page],[data-jump]');const target=nav?.dataset.page||nav?.dataset.jump;if(target==='village-dashboard')setTimeout(()=>{fillFilter();startRealtime();if(stale||!document.querySelector('#villageDashKpis .village-kpi'))loadDashboard()},0)},true);
  }

  function init(){if(initialized)return;if(!injectPage()){setTimeout(init,80);return}initialized=true;addStyle();fillFilter();bind()}
  init();
})();
