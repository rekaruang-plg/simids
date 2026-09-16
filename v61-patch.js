(()=>{
  const css=`
    .notification-button{min-height:48px!important}
    .role-control{background:#f8faf9;border:1px solid #e4ebe8;border-radius:14px;padding-left:10px}
    .role-control>span{font-weight:800;color:#64716d}
    .role-control select{min-height:48px!important}
    .mobile-menu{min-height:48px!important}
    .mini-btn{min-height:44px!important;padding:10px 12px!important}
    .close-btn{width:48px!important;height:48px!important;border-radius:14px!important}
    .picker-sheet-head{grid-template-columns:1fr 48px!important}
    .picker-tab{min-height:48px!important}
    .optional-box summary{min-height:44px;display:flex;align-items:center}
    .link-btn{min-height:44px;padding:8px 10px!important;border-radius:10px}
    .bottom-nav-btn{min-height:56px}
    .simids-scope-overlay{position:fixed;inset:0;background:#f8fafce8;z-index:20000;display:grid;place-items:center;padding:24px}
    .simids-scope-box{background:#fff;border:1px solid #dbe5e3;border-radius:18px;padding:22px 26px;box-shadow:0 12px 40px #1f29371f;text-align:center;max-width:360px}
    .simids-scope-box b{display:block;font-size:18px;margin-bottom:6px}.simids-scope-box small{color:#64748b}
    .simids-pager{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0 4px;flex-wrap:wrap}
    .simids-pager button{min-height:42px;padding:8px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font-weight:700;cursor:pointer}
    .simids-pager button:disabled{opacity:.45;cursor:default}.simids-pager span{color:#64748b;font-weight:700}
    @media(max-width:820px){
      .notification-button{width:48px!important}
      .role-control{padding-left:0;border:0;background:transparent}
      .role-control select{max-width:132px!important;min-height:48px!important}
    }
  `;
  const style=document.createElement('style');
  style.id='simids-v61-ux-patch';
  style.textContent=css;
  document.head.appendChild(style);

  const PAGE_SIZE=50;
  let childPage=1,scopeBusy=false;
  const scopeSelectIds=new Set(['childVillageFilter','riskVillageFilter','reportVillageFilter','settingFocusVillage']);

  function loading(show,label='Memuat data…'){
    let el=document.getElementById('simidsScopeOverlay');
    if(show){
      if(!el){
        el=document.createElement('div');el.id='simidsScopeOverlay';el.className='simids-scope-overlay';
        el.innerHTML='<div class="simids-scope-box"><b id="simidsScopeTitle">Memuat data…</b><small>Data hanya diambil saat dibutuhkan agar aplikasi tetap ringan.</small></div>';
        document.body.appendChild(el);
      }
      const title=document.getElementById('simidsScopeTitle');if(title)title.textContent=label;
    }else el?.remove();
  }

  function currentState(){return window.SIMIDS_INITIAL||null}
  function currentScope(){return currentState()?.scope||currentState()?.settings?.focusVillage||''}

  function refreshServicePlaces(){
    const state=currentState();if(!state)return;
    const places=[...new Set([...(state.servicePlaces||[]),...(state.children||[]).map(x=>x.posyandu),...(state.events||[]).map(x=>x.servicePlace)].filter(Boolean))].sort();
    ['childPosyandu','eventServicePlace'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      const cur=el.value;
      el.innerHTML='<option value="">Pilih / cari pos imunisasi</option>'+places.map(x=>`<option value="${String(x).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}">${String(x).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}</option>`).join('');
      if([...el.options].some(o=>o.value===cur))el.value=cur;
    });
  }

  function alignScopeFilters(scope){
    const value=scope==='all'?'all':scope;
    ['childVillageFilter','riskVillageFilter','reportVillageFilter'].forEach(id=>{
      const el=document.getElementById(id);if(el&&[...el.options].some(o=>o.value===value))el.value=value;
    });
    const setting=document.getElementById('settingFocusVillage');
    if(setting&&scope!=='all'&&[...setting.options].some(o=>o.value===scope))setting.value=scope;
  }

  function updateScopeBadge(){
    const state=currentState(),badge=document.getElementById('connectionBadge');if(!state||!badge)return;
    const scope=state.scope==='all'?'Semua desa':state.scope;
    badge.title=`Data aktif: ${scope} • ${(state.children||[]).length} anak • ${(state.events||[]).length} imunisasi`;
  }

  async function switchScope(value){
    if(scopeBusy||!window.SimidsBackend?.loadScope)return;
    const requested=value==='all'?'all':String(value||'').trim();
    if(!requested)return;
    const active=currentScope();
    if((requested==='all'&&active==='all')||(requested!=='all'&&String(active).toUpperCase()===requested.toUpperCase()))return;
    scopeBusy=true;loading(true,requested==='all'?'Memuat semua desa…':`Memuat ${requested}…`);
    try{
      await window.SimidsBackend.loadScope(currentState(),requested);
      if(typeof window.indexEvents==='function')window.indexEvents();
      if(typeof window.renderAll==='function')window.renderAll();
      alignScopeFilters(requested);
      refreshServicePlaces();updateScopeBadge();childPage=1;applyChildPagination();
    }catch(error){
      console.error(error);alert('Data belum dapat dimuat: '+(error?.message||error));
      alignScopeFilters(currentScope());
    }finally{loading(false);scopeBusy=false}
  }

  document.addEventListener('change',e=>{
    const el=e.target;
    if(el&&scopeSelectIds.has(el.id))switchScope(el.value);
  },true);

  function applyChildPagination(){
    const list=document.getElementById('childrenCards');if(!list)return;
    const cards=[...list.children].filter(x=>!x.classList.contains('simids-pager'));
    let pager=document.getElementById('simidsChildrenPager');
    if(cards.length<=PAGE_SIZE){cards.forEach(x=>x.hidden=false);pager?.remove();return}
    const pages=Math.ceil(cards.length/PAGE_SIZE);childPage=Math.min(Math.max(1,childPage),pages);
    cards.forEach((x,i)=>x.hidden=!(i>=(childPage-1)*PAGE_SIZE&&i<childPage*PAGE_SIZE));
    if(!pager){pager=document.createElement('div');pager.id='simidsChildrenPager';pager.className='simids-pager';list.after(pager)}
    pager.innerHTML=`<button type="button" data-child-page="prev" ${childPage===1?'disabled':''}>‹ Sebelumnya</button><span>Halaman ${childPage} / ${pages} • ${cards.length} anak</span><button type="button" data-child-page="next" ${childPage===pages?'disabled':''}>Berikutnya ›</button>`;
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-child-page]');if(!b)return;
    childPage+=b.dataset.childPage==='next'?1:-1;applyChildPagination();
    document.getElementById('childrenCards')?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  function watchChildren(){
    const list=document.getElementById('childrenCards');if(!list)return;
    const obs=new MutationObserver(()=>{childPage=1;queueMicrotask(applyChildPagination)});
    obs.observe(list,{childList:true});applyChildPagination();
  }

  let tries=0;
  const apply=()=>{
    const role=document.getElementById('roleSelect');
    if(!role){if(tries++<120)setTimeout(apply,50);return}

    const label=role.closest('.role-control');
    const labelText=label?.querySelector(':scope > span');
    if(labelText)labelText.textContent='Peran';
    if(label){label.title='Hak akses ditentukan administrator'}
    role.setAttribute('aria-label','Peran petugas');
    const names={kader:'Kader',bidan:'Bidan',puskesmas:'Puskesmas'};
    [...role.options].forEach(o=>{if(names[o.value])o.textContent=names[o.value]});

    const sideSmall=document.querySelector('.side-intro small');
    if(sideSmall)sideSmall.textContent='Masuk sebagai';

    const note=document.querySelector('.kohort-source-note');
    if(note){
      const b=note.querySelector('b'),sm=note.querySelector('small');
      if(b)b.textContent='Sesuai data anak & imunisasi yang biasa dipakai';
      if(sm)sm.textContent='NIK, nama anak, tanggal lahir, jenis kelamin, orang tua, wilayah, dan Puskesmas tetap tersimpan. Sistem menyusun kolom laporan secara otomatis.';
    }

    const placeHelp=document.querySelector('.service-place-step .choice-step-head small');
    if(placeHelp)placeHelp.textContent='Otomatis memakai Posyandu anak bila sudah ada. Data ini akan masuk ke laporan.';

    const focus=currentState()?.settings?.focusVillage;
    if(focus){alignScopeFilters(focus);if(typeof window.renderAll==='function')window.renderAll();alignScopeFilters(focus)}
    refreshServicePlaces();updateScopeBadge();watchChildren();
  };
  apply();
})();
