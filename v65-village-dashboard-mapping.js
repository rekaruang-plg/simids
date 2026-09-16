(()=>{
  let scheduled=false;
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};
  function patch(){
    scheduled=false;
    const page=document.getElementById('page-village-dashboard');
    if(!page)return;
    page.querySelectorAll('.village-kpi span').forEach(el=>{
      if(el.textContent.trim()==='Anak dalam 12 desa')setText(el,'Anak dalam 15 desa');
    });
    const quality=document.getElementById('villageDashQuality');
    if(quality&&!quality.hidden&&/di luar 12 desa master/i.test(quality.textContent||'')){
      const m=(quality.textContent||'').match(/([\d.]+)\s+anak/i);
      const n=m?m[1]:'Data';
      quality.innerHTML=`<b>Data di luar peta desa:</b> ${n} anak tidak masuk agregasi 15 desa resmi. Ini dapat berupa anak yang berdomisili di luar Kecamatan Tanjung Lago atau desa yang belum diketahui; datanya tetap tersimpan di SiMIDS.`;
    }
    page.querySelectorAll('.village-risk-card.nodata').forEach(card=>{
      setText(card.querySelector('.risk-pill'),'Belum ada data');
      setText(card.querySelector('.village-risk-rate'),'—');
      const small=card.querySelectorAll('small');
      setText(small[0],'Belum ada anak kohort pada desa ini');
      setText(small[1],'Tidak dihitung sebagai risiko rendah/tinggi');
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
