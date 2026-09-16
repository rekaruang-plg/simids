(()=>{
  const state=()=>window.SIMIDS_INITIAL||{};
  const role=()=>state().authRole||state().settings?.role||'kader';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function addStyle(){
    if(document.getElementById('simids-mobile-first-style'))return;
    const s=document.createElement('style');
    s.id='simids-mobile-first-style';
    s.textContent=`
      .mobile-training-shortcut{display:none}
      @media(max-width:820px){
        html{scroll-behavior:auto}
        body{background:#f5f7f6;padding-bottom:76px}
        .app-header,.mobile-bottom-nav,.side-nav,.modal{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
        .app-header{height:62px;padding:6px 10px;background:#fff}
        .brand-mark{width:38px;height:38px;border-radius:12px;font-size:1.15rem;box-shadow:none}
        .brand-copy strong{font-size:1rem}.header-right{gap:5px}
        #actualRoleChip{padding:6px 8px;font-size:.67rem;white-space:nowrap}
        .notification-button{width:38px;height:38px;border-radius:12px}
        .main-content{padding:10px 10px 16px}
        .mobile-menu{margin:0 0 9px;padding:8px 10px;min-height:40px;background:#fff}
        .page.active{animation:none}
        .card,.quick-card,.welcome-card{box-shadow:none}
        .welcome-card{padding:14px 15px;border-radius:17px;margin-bottom:10px;gap:7px;background:#eaf8f5;color:#123d38;border:1px solid #cfe9e3}
        .welcome-card:after{display:none}
        .welcome-card .eyebrow{color:#087f73;font-size:.61rem}
        .welcome-card h1{font-size:1.2rem;line-height:1.22;margin-top:2px}
        .welcome-card p{display:none}
        .date-pill{background:#fff;border:1px solid #d7e8e4;color:#51615d;padding:6px 8px;border-radius:10px;font-size:.65rem;white-space:normal}
        .reminder-banner{margin-bottom:12px;border-radius:15px;padding:11px;gap:10px}
        .reminder-banner-copy b{font-size:.84rem}.reminder-banner-copy span{font-size:.7rem;line-height:1.35}
        .reminder-banner .btn{min-height:44px}
        .section-heading{margin:0 1px 8px}.section-heading h2{font-size:1rem}.section-kicker{font-size:.6rem}
        .quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px}
        .quick-card{min-height:78px;border-radius:15px;padding:11px;grid-template-columns:40px 1fr;gap:9px}
        .quick-card.primary{grid-column:1/-1;min-height:82px;background:#effaf7}
        .quick-card:nth-child(4){grid-column:1/-1;min-height:66px}
        .quick-icon{width:40px;height:40px;border-radius:12px;font-size:1.2rem}
        .quick-card b{font-size:.86rem}.quick-card small{font-size:.66rem;margin-top:2px;line-height:1.25}
        .quick-card:nth-child(2) small,.quick-card:nth-child(3) small{display:none}
        .quick-card .arrow{display:none}.quick-badge{min-width:26px;height:26px;font-size:.68rem;position:absolute;right:9px;top:9px}
        .mobile-training-shortcut{display:flex;width:100%;align-items:center;justify-content:space-between;gap:10px;border:1px dashed #bddbd5;background:#f8fcfb;color:#315b55;border-radius:13px;padding:9px 11px;margin:0 0 11px;min-height:44px;font:inherit;text-align:left}
        .mobile-training-shortcut b{font-size:.77rem}.mobile-training-shortcut small{font-size:.64rem;color:#6b7c77;display:block}
        #page-home.active{display:flex;flex-direction:column}
        #page-home .welcome-card{order:1}#page-home .reminder-banner{order:2}#page-home .section-heading{order:3}#page-home .quick-grid{order:4}#page-home .mobile-training-shortcut{order:5}#page-home .soft-card{order:6}#page-home .summary-strip{order:7}
        #page-home .soft-card{padding:14px;margin-bottom:10px}#page-home .soft-card .card-head{margin-bottom:9px}#page-home .soft-card .card-head p{display:none}
        #page-home .task-item{padding:10px 11px;border-radius:12px}#page-home .task-item b{font-size:.79rem}#page-home .task-item small{font-size:.68rem}
        #page-home .task-item .mini-btn{min-height:42px}
        .summary-strip{gap:7px;margin-bottom:9px}.summary-box{min-height:70px;padding:10px 11px;border-radius:13px}.summary-box b{font-size:1.2rem}.summary-box span{font-size:.65rem;line-height:1.25}
        .mobile-bottom-nav{height:68px;padding:5px 6px calc(5px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -3px 12px rgba(31,62,55,.05)}
        .bottom-nav-btn{min-width:0;min-height:52px}.bottom-nav-btn>span{font-size:1.02rem}.bottom-nav-btn b{font-size:.57rem;line-height:1.1}
        .bottom-nav-btn.center>span{width:40px;height:40px;border-radius:13px;margin-top:-11px;box-shadow:0 4px 12px rgba(8,127,115,.18)}
        .side-nav{top:62px}
        .record-card{content-visibility:auto;contain-intrinsic-size:86px}
        .record-card,.picker-option{box-shadow:none!important}
        .record-actions .mini-btn,.record-actions a.mini-btn{min-height:46px}
        .btn,.mini-btn,.picker-button,.bottom-nav-btn,.nav-btn{touch-action:manipulation}
        #simidsOfflineQueueBadge:not([hidden]){display:flex!important;position:fixed;left:10px;right:10px;bottom:76px;z-index:70;justify-content:center;border:1px solid #f1d49b;box-shadow:0 5px 16px rgba(0,0,0,.08);background:#fff7e8}
        #connectionBadge.warn{display:flex!important;position:fixed;left:10px;right:10px;bottom:76px;z-index:69;justify-content:center;border:1px solid #f1d49b;background:#fff7e8;box-shadow:0 5px 16px rgba(0,0,0,.08)}
        #connectionBadge.warn+#simidsOfflineQueueBadge:not([hidden]){bottom:112px}
        .picker-sheet{box-shadow:0 -8px 24px rgba(20,55,50,.16)}
      }
      @media(max-width:350px){
        #actualRoleChip{display:none}
        .quick-grid{grid-template-columns:1fr}
        .quick-card.primary,.quick-card:nth-child(4){grid-column:auto}
        .quick-card:nth-child(2) small,.quick-card:nth-child(3) small{display:block}
        .summary-strip{grid-template-columns:1fr 1fr}
      }
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
    `;
    document.head.appendChild(s);
  }

  function patchLabels(){
    const mobileMenu=document.getElementById('mobileMenuBtn');if(mobileMenu)mobileMenu.textContent='☰ Lainnya';
    const bottomEducation=document.querySelector('.mobile-bottom-nav [data-page="education"] b');if(bottomEducation)bottomEducation.textContent='Materi';
    const sideEducation=document.querySelector('.side-menu [data-page="education"] b');if(sideEducation)sideEducation.textContent='Materi Edukasi';
    const q=document.querySelector('.quick-card[data-jump="education"]');if(q){const b=q.querySelector('b'),sm=q.querySelector('small');if(b)b.textContent='Materi Edukasi';if(sm)sm.textContent='Buka panduan dan materi saat dibutuhkan'}
  }

  function patchKaderHome(){
    if(role()!=='kader')return;
    const home=document.getElementById('page-home');if(!home)return;
    const village=state().scope&&state().scope!=='all'?state().scope:(state().settings?.focusVillage||'Desa penugasan');
    const title=home.querySelector('.welcome-card h1');if(title)title.textContent='Siap mencatat pelayanan hari ini?';
    const copy=home.querySelector('.welcome-card p');if(copy)copy.textContent=`${village} • data akan disimpan sesuai penugasan akun.`;
    const heading=home.querySelector('.section-heading h2');if(heading)heading.textContent='Pilih pekerjaan';
    if(!home.querySelector('.mobile-training-shortcut')){
      const quick=home.querySelector('.quick-grid');
      if(quick){const b=document.createElement('button');b.type='button';b.className='mobile-training-shortcut';b.dataset.jump='training';b.innerHTML='<span><b>◎ Mode Latihan</b><small>Coba alur pencatatan tanpa masuk database asli</small></span><span>›</span>';quick.after(b)}
    }
  }

  function patchDailyTasks(){
    if(role()!=='kader')return;
    const head=document.querySelector('#page-home .soft-card .card-head h2');if(head)head.textContent='Yang perlu dilakukan';
  }

  function apply(){addStyle();patchLabels();patchKaderHome();patchDailyTasks()}
  function ready(){if(!window.SIMIDS_READY||!document.querySelector('.mobile-bottom-nav')){setTimeout(ready,100);return}apply();setTimeout(apply,500)}
  ready();
})();