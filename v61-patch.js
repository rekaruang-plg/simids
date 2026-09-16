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

  let tries=0;
  const apply=()=>{
    const role=document.getElementById('roleSelect');
    if(!role){if(tries++<80)setTimeout(apply,50);return}

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
  };
  apply();
})();
