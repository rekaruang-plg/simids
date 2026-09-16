(()=>{
  let scheduled=false;
  function patch(){
    scheduled=false;
    const page=document.getElementById('page-village-dashboard');
    if(!page)return;
    page.querySelectorAll('.village-kpi span').forEach(el=>{
      if(el.textContent.trim()==='Anak dalam 12 desa')el.textContent='Anak dalam 15 desa';
    });
    const quality=document.getElementById('villageDashQuality');
    if(quality&&!quality.hidden&&/di luar 12 desa master/i.test(quality.textContent||'')){
      const m=(quality.textContent||'').match(/([\d.]+)\s+anak/i);
      const n=m?m[1]:'Data';
      quality.innerHTML=`<b>Data di luar peta desa:</b> ${n} anak tidak masuk agregasi 15 desa resmi. Ini dapat berupa anak yang berdomisili di luar Kecamatan Tanjung Lago atau desa yang belum diketahui; datanya tetap tersimpan di SiMIDS.`;
    }
    page.querySelectorAll('.village-risk-card.nodata').forEach(card=>{
      const pill=card.querySelector('.risk-pill');if(pill)pill.textContent='Belum ada data';
      const rate=card.querySelector('.village-risk-rate');if(rate)rate.textContent='—';
      const small=card.querySelectorAll('small');
      if(small[0])small[0].textContent='Belum ada anak kohort pada desa ini';
      if(small[1])small[1].textContent='Tidak dihitung sebagai risiko rendah/tinggi';
    });
  }
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(patch)}
  function init(){
    const page=document.getElementById('page-village-dashboard');
    if(!page){setTimeout(init,100);return}
    patch();
    new MutationObserver(schedule).observe(page,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
  }
  init();
})();
