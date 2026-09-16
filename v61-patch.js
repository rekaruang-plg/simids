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
    .simids-user-admin{margin-bottom:18px}
    .simids-user-note{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px 14px;margin-bottom:16px;color:#166534}
    .simids-user-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .simids-user-grid .full{grid-column:1/-1}
    .simids-user-grid label{display:block;font-weight:700;margin-bottom:6px}
    .simids-user-grid input,.simids-user-grid select,.simids-user-row input,.simids-user-row select{box-sizing:border-box;width:100%;min-height:46px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font:inherit}
    .simids-user-status{min-height:22px;margin:10px 0;color:#475569}
    .simids-user-status.good{color:#166534}.simids-user-status.bad{color:#b91c1c}
    .simids-user-list{display:grid;gap:12px;margin-top:16px}
    .simids-user-row{border:1px solid #dbe5e3;border-radius:14px;padding:14px;background:#fbfdfd;display:grid;grid-template-columns:minmax(180px,1.3fr) minmax(130px,.8fr) minmax(150px,1fr) auto;gap:10px;align-items:end}
    .simids-user-who b{display:block;font-size:16px}.simids-user-who small{display:block;color:#64748b;margin-top:4px;word-break:break-word}
    .simids-user-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .simids-user-active{display:flex!important;align-items:center;gap:8px;font-weight:700;margin-top:8px}.simids-user-active input{width:18px!important;min-height:18px!important}
    .simids-user-field small{display:block;color:#64748b;margin-top:5px}
    .simids-user-password-help{color:#64748b;margin-top:4px;font-size:12px}
    @media(max-width:820px){
      .notification-button{width:48px!important}
      .role-control{padding-left:0;border:0;background:transparent}
      .role-control select{max-width:132px!important;min-height:48px!important}
      .simids-user-grid{grid-template-columns:1fr}.simids-user-grid .full{grid-column:auto}
      .simids-user-row{grid-template-columns:1fr}.simids-user-actions{align-items:stretch}.simids-user-actions button{flex:1}
    }
  `;
  const style=document.createElement('style');
  style.id='simids-v61-ux-patch';
  style.textContent=css;
  document.head.appendChild(style);

  const PAGE_SIZE=50;
  let childPage=1,scopeBusy=false,adminUsersBusy=false,adminUsersLoaded=false,adminVillages=[];
  const scopeSelectIds=new Set(['childVillageFilter','riskVillageFilter','reportVillageFilter','settingFocusVillage']);
  const escHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

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
      el.innerHTML='<option value="">Pilih / cari pos imunisasi</option>'+places.map(x=>`<option value="${escHtml(x)}">${escHtml(x)}</option>`).join('');
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

  function roleNeedsVillage(role){return role==='kader'||role==='bidan'}
  function roleLabel(role){return ({kader:'Kader',bidan:'Bidan',puskesmas:'Puskesmas',admin:'Administrator'})[role]||role}
  function villageOptions(value=''){
    const options=['<option value="">Pilih desa</option>',...adminVillages.map(v=>`<option value="${escHtml(v)}" ${v===value?'selected':''}>${escHtml(v)}</option>`)];
    return options.join('');
  }
  function setAdminStatus(message,type=''){
    const el=document.getElementById('simidsAdminUserStatus');if(!el)return;
    el.className='simids-user-status'+(type?` ${type}`:'');el.textContent=message||'';
  }
  function syncVillageAvailability(container,role){
    const village=container?.querySelector('[data-admin-village],#simidsNewUserVillage');if(!village)return;
    const needed=roleNeedsVillage(role);village.disabled=!needed;if(!needed)village.value='';
    const help=village.parentElement?.querySelector('small');if(help)help.textContent=needed?'Wajib untuk kader/bidan.':'Tidak diperlukan untuk peran ini.';
  }

  function renderAdminUsers(users=[]){
    const list=document.getElementById('simidsAdminUserList');if(!list)return;
    if(!users.length){list.innerHTML='<div class="empty">Belum ada akun petugas.</div>';return}
    list.innerHTML=users.map(u=>{
      const login=u.internal_login?(u.username||''):(u.email||u.username||'');
      const roles=['kader','bidan','puskesmas','admin'].map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${roleLabel(r)}</option>`).join('');
      return `<div class="simids-user-row" data-admin-user="${escHtml(u.user_id)}">
        <div class="simids-user-who">
          <b>${escHtml(u.display_name||u.username||'Petugas')}</b>
          <small>Login: <strong>${escHtml(login)}</strong>${u.internal_login?' • tanpa konfirmasi email':''}</small>
          <label class="simids-user-active"><input type="checkbox" data-admin-active ${u.active?'checked':''}> Akun aktif</label>
        </div>
        <div class="simids-user-field"><label>Peran</label><select data-admin-role>${roles}</select></div>
        <div class="simids-user-field"><label>Desa penugasan</label><select data-admin-village>${villageOptions(u.village||'')}</select><small>${roleNeedsVillage(u.role)?'Wajib untuk kader/bidan.':'Tidak diperlukan untuk peran ini.'}</small></div>
        <div class="simids-user-actions"><button class="btn primary" type="button" data-admin-save>Simpan akses</button><button class="btn secondary" type="button" data-admin-reset>Reset sandi</button></div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-admin-user]').forEach(row=>syncVillageAvailability(row,row.querySelector('[data-admin-role]')?.value));
  }

  async function reloadAdminUsers(){
    if(adminUsersBusy)return;
    adminUsersBusy=true;setAdminStatus('Memuat akun petugas…');
    try{
      const data=await window.SimidsBackend.adminUsers('list');
      adminVillages=(data.villages||[]).filter(Boolean);
      const newVillage=document.getElementById('simidsNewUserVillage');
      if(newVillage){const cur=newVillage.value;newVillage.innerHTML=villageOptions(cur);if([...newVillage.options].some(o=>o.value===cur))newVillage.value=cur}
      renderAdminUsers(data.users||[]);setAdminStatus(`${(data.users||[]).length} akun petugas ditemukan.`,'good');
    }catch(error){console.error(error);setAdminStatus(error?.message||'Akun petugas gagal dimuat.','bad')}
    finally{adminUsersBusy=false}
  }

  function initAdminUsers(){
    if(adminUsersLoaded||currentState()?.authRole!=='admin'||!window.SimidsBackend?.adminUsers)return;
    const page=document.getElementById('page-settings');if(!page)return;
    adminUsersLoaded=true;
    const panel=document.createElement('div');panel.id='simidsAdminUserPanel';panel.className='card simids-user-admin';
    panel.innerHTML=`
      <div class="card-head responsive"><div><span class="section-kicker">AKSES PETUGAS</span><h2>Manajemen Akun Kader & Petugas</h2><p>Buat username sendiri. Tidak perlu alamat email asli dan tidak ada konfirmasi email.</p></div><button class="btn secondary" type="button" id="simidsRefreshUsers">Muat ulang</button></div>
      <div class="simids-user-note"><b>Login internal:</b> petugas cukup memakai username + kata sandi. Sistem menyimpan alamat internal teknis secara otomatis dan tidak mengirim email.</div>
      <form id="simidsCreateUserForm" class="simids-user-grid">
        <div><label for="simidsNewUsername">Username *</label><input id="simidsNewUsername" autocomplete="off" placeholder="contoh: kader.tanjung1" required><div class="simids-user-password-help">3–40 karakter, huruf kecil/angka/titik/_/-.</div></div>
        <div><label for="simidsNewDisplayName">Nama petugas *</label><input id="simidsNewDisplayName" autocomplete="off" placeholder="Nama kader / bidan" required></div>
        <div><label for="simidsNewRole">Peran *</label><select id="simidsNewRole"><option value="kader">Kader</option><option value="bidan">Bidan</option><option value="puskesmas">Puskesmas</option><option value="admin">Administrator</option></select></div>
        <div><label for="simidsNewUserVillage">Desa penugasan</label><select id="simidsNewUserVillage"><option value="">Memuat desa…</option></select><small>Wajib untuk kader/bidan.</small></div>
        <div class="full"><label for="simidsNewPassword">Kata sandi awal *</label><input id="simidsNewPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Minimal 8 karakter" required></div>
        <div class="full"><button class="btn primary large" type="submit" id="simidsCreateUserBtn">＋ Buat Akun & Beri Akses</button></div>
      </form>
      <div id="simidsAdminUserStatus" class="simids-user-status" aria-live="polite"></div>
      <div class="card-head"><div><h3>Akun yang sudah diberi akses</h3><p>Peran, desa, status aktif, dan kata sandi dapat dikelola dari sini.</p></div></div>
      <div id="simidsAdminUserList" class="simids-user-list"><div class="empty">Memuat akun…</div></div>`;
    const title=page.querySelector('.page-title');if(title)title.after(panel);else page.prepend(panel);

    document.getElementById('simidsNewRole')?.addEventListener('change',e=>syncVillageAvailability(panel,e.target.value));
    syncVillageAvailability(panel,document.getElementById('simidsNewRole')?.value||'kader');
    document.getElementById('simidsRefreshUsers')?.addEventListener('click',reloadAdminUsers);
    document.getElementById('simidsCreateUserForm')?.addEventListener('submit',async e=>{
      e.preventDefault();if(adminUsersBusy)return;
      const username=document.getElementById('simidsNewUsername').value.trim().toLowerCase();
      const display_name=document.getElementById('simidsNewDisplayName').value.trim();
      const role=document.getElementById('simidsNewRole').value;
      const village=document.getElementById('simidsNewUserVillage').value;
      const password=document.getElementById('simidsNewPassword').value;
      adminUsersBusy=true;setAdminStatus('Membuat akun petugas…');
      const button=document.getElementById('simidsCreateUserBtn');if(button)button.disabled=true;
      try{
        await window.SimidsBackend.adminUsers('create',{username,display_name,role,village,password});
        setAdminStatus(`Akun ${username} berhasil dibuat. Petugas dapat langsung login tanpa konfirmasi email.`,'good');
        e.target.reset();document.getElementById('simidsNewRole').value='kader';syncVillageAvailability(panel,'kader');
      }catch(error){console.error(error);setAdminStatus(error?.message||'Akun gagal dibuat.','bad')}
      finally{adminUsersBusy=false;if(button)button.disabled=false}
      await reloadAdminUsers();
    });

    panel.addEventListener('change',e=>{
      if(e.target.matches('[data-admin-role]'))syncVillageAvailability(e.target.closest('[data-admin-user]'),e.target.value);
    });
    panel.addEventListener('click',async e=>{
      const row=e.target.closest('[data-admin-user]');if(!row||adminUsersBusy)return;
      const user_id=row.dataset.adminUser;
      if(e.target.closest('[data-admin-save]')){
        const role=row.querySelector('[data-admin-role]').value;
        const village=row.querySelector('[data-admin-village]').value;
        const active=row.querySelector('[data-admin-active]').checked;
        const display_name=row.querySelector('.simids-user-who b').textContent.trim();
        adminUsersBusy=true;setAdminStatus('Menyimpan akses…');
        try{await window.SimidsBackend.adminUsers('update',{user_id,role,village,active,display_name});setAdminStatus('Akses petugas berhasil diperbarui.','good')}
        catch(error){console.error(error);setAdminStatus(error?.message||'Akses gagal diperbarui.','bad')}
        finally{adminUsersBusy=false}
        await reloadAdminUsers();
      }
      if(e.target.closest('[data-admin-reset]')){
        const password=prompt('Masukkan kata sandi baru (minimal 8 karakter):');if(password===null)return;
        adminUsersBusy=true;setAdminStatus('Mengganti kata sandi…');
        try{await window.SimidsBackend.adminUsers('reset_password',{user_id,password});setAdminStatus('Kata sandi berhasil diganti.','good')}
        catch(error){console.error(error);setAdminStatus(error?.message||'Kata sandi gagal diganti.','bad')}
        finally{adminUsersBusy=false}
      }
    });
    reloadAdminUsers();
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
    refreshServicePlaces();updateScopeBadge();watchChildren();initAdminUsers();
  };
  apply();
})();
