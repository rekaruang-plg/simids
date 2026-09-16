(()=>{
  const SUPABASE_URL='https://ntdqqzqgkylxixivkmrp.supabase.co';
  const KEY='sb_publishable_QeWv7cMl3JCrHWBN0m5cQA_IN0Tbk_w';
  let client=null,initialized=false,reportBusy=false,reportPage=1;
  const getClient=()=>client||(client=supabase.createClient(SUPABASE_URL,KEY,{auth:{storage:sessionStorage,storageKey:'simids-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=n=>Number(n||0).toLocaleString('id-ID');
  const state=()=>window.SIMIDS_INITIAL||{};

  function addStyle(){
    if(document.getElementById('simids-region-report-style'))return;
    const s=document.createElement('style');s.id='simids-region-report-style';s.textContent=`
      .region-filter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.region-filter-grid .wide{grid-column:span 2}.region-filter-grid select,.region-filter-grid input{width:100%;min-height:44px;border:1px solid #d7e2e0;border-radius:10px;padding:9px 11px;background:#fff;font:inherit}.region-filter-actions{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.region-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.region-kpi{border:1px solid #e2e8f0;border-radius:12px;padding:13px;background:#fff}.region-kpi b{display:block;font-size:24px}.region-kpi span{font-size:12px;color:#64748b}.region-table-wrap{overflow:auto}.region-table{width:100%;border-collapse:collapse;min-width:760px}.region-table th,.region-table td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}.region-table th{font-size:12px;color:#475569;background:#f8fafc;position:sticky;top:0}.region-table td{font-size:13px}.region-child-name b{display:block}.region-child-name small{display:block;color:#64748b;margin-top:2px}.region-note{padding:11px 13px;border-radius:10px;background:#f8fbfa;border:1px solid #dbe7e5;color:#475569;font-size:13px}.region-pager{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px}.region-pager button{min-height:40px}.followup-village-note{padding:11px 13px;border:1px solid #dbe7e5;background:#f8fbfa;border-radius:10px;color:#475569;font-size:13px}.hide-program-dashboard{display:none!important}
      @media(max-width:900px){.region-filter-grid{grid-template-columns:repeat(2,1fr)}.region-kpis{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){.region-filter-grid{grid-template-columns:1fr}.region-filter-grid .wide{grid-column:span 1}.region-kpis{grid-template-columns:1fr 1fr}.region-pager{align-items:stretch;flex-direction:column}.region-pager button{width:100%}}
    `;document.head.appendChild(s);
  }

  function hideProgramDashboard(){document.querySelectorAll('[data-page="dashboard"]').forEach(el=>el.classList.add('hide-program-dashboard'))}

  function fillFollowupVillage(){
    const sel=document.getElementById('riskVillageFilter');if(!sel)return;
    const current=sel.value,s=state(),villages=[...new Set((s.targets||[]).map(x=>x.name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id')),role=s.authRole||s.settings?.role||'kader';
    if(role==='admin'||role==='puskesmas')sel.innerHTML='<option value="all">Semua desa</option>'+villages.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    else {const assigned=s.scope&&s.scope!=='all'?s.scope:s.settings?.focusVillage||villages[0]||'';sel.innerHTML=`<option value="${esc(assigned)}">${esc(assigned)}</option>`}
    if([...sel.options].some(o=>o.value===current))sel.value=current;else if([...sel.options].some(o=>o.value===(s.scope||'')))sel.value=s.scope;
  }

  function patchFollowup(){
    const page=document.getElementById('page-followup');if(!page)return;
    const title=page.querySelector('.page-title');if(title)title.innerHTML='<div><span class="section-kicker">PENGINGAT DESA</span><h1>Pengingat & Tindak Lanjut</h1><p>Pilih desa untuk melihat anak yang perlu dihubungi dan mencatat hasil tindak lanjut.</p></div>';
    const card=page.querySelector('.risk-map-card');
    if(card&&!card.dataset.villagePatched){
      const oldVillage=document.getElementById('riskVillageFilter')?.value||'',oldStatus=document.getElementById('riskStatusFilter')?.value||'all';
      card.dataset.villagePatched='1';
      card.innerHTML=`<div class="card-head responsive"><div><span class="section-kicker">FILTER DESA</span><h2>Daftar Pengingat per Desa</h2><p>Tidak memakai peta dusun. Pilih desa dan status pengingat.</p></div><div class="filter-row"><select id="riskVillageFilter"></select><select id="riskStatusFilter"><option value="all">Semua pengingat</option><option value="overdue">Jadwal sudah lewat</option><option value="due">Jadwal dekat</option><option value="mr2">MR-2 belum tercatat</option></select></div></div><div class="followup-village-note">Daftar anak dimuat bertahap 50 anak per halaman agar tetap ringan pada koneksi lambat.</div>`;
      fillFollowupVillage();
      const v=document.getElementById('riskVillageFilter');if(v&&[...v.options].some(o=>o.value===oldVillage))v.value=oldVillage;
      const st=document.getElementById('riskStatusFilter');if(st)st.value=oldStatus;
    } else fillFollowupVillage();
    const listHead=page.querySelector('#followupList')?.closest('.card')?.querySelector('.card-head');
    if(listHead)listHead.innerHTML='<div><span class="section-kicker">DAFTAR ANAK</span><h2>Yang Perlu Dihubungi</h2><p>Daftar mengikuti desa yang dipilih. WhatsApp tetap dikirim manual oleh petugas.</p></div>';
  }

  function reportTemplate(){
    const page=document.getElementById('page-report');if(!page||page.dataset.regionPatched)return;
    page.dataset.regionPatched='1';
    page.innerHTML=`
      <div class="page-title"><div><span class="section-kicker">LAPORAN DATA ANAK</span><h1>Laporan Anak per Daerah</h1><p>Rekap data anak dari kohort berdasarkan Provinsi, Kabupaten/Kota, Kecamatan, dan Desa.</p></div></div>
      <div class="card"><div class="card-head responsive"><div><span class="section-kicker">FILTER WILAYAH</span><h2>Pilih Daerah</h2><p>Data diambil langsung dari Supabase dan mengikuti hak akses akun.</p></div><div class="region-filter-actions"><button class="btn secondary" id="regionResetBtn" type="button">Reset</button><button class="btn primary" id="regionExportBtn" type="button">⬇ Unduh CSV</button></div></div>
        <div class="region-filter-grid"><div><label>Provinsi</label><select id="regionProvince"><option value="">Semua provinsi</option></select></div><div><label>Kabupaten/Kota</label><select id="regionDistrict"><option value="">Semua kabupaten/kota</option></select></div><div><label>Kecamatan</label><select id="regionSubdistrict"><option value="">Semua kecamatan</option></select></div><div><label>Desa</label><select id="regionVillage"><option value="">Semua desa</option></select></div><div class="wide"><label>Cari anak / NIK / orang tua</label><input id="regionSearch" type="search" placeholder="Ketik nama, NIK, orang tua, atau alamat" /></div><div class="region-filter-actions"><button class="btn secondary" id="regionApplyBtn" type="button">Terapkan Filter</button></div></div>
        <div id="regionKpis" class="region-kpis"></div><div id="regionMeta" class="region-note" style="margin-top:12px">Memuat laporan…</div>
      </div>
      <div class="card"><div class="card-head"><div><span class="section-kicker">REKAP PER DAERAH</span><h2>Jumlah Anak per Wilayah</h2><p>Ringkasan sesuai kombinasi wilayah pada data kohort.</p></div></div><div class="region-table-wrap"><table class="region-table"><thead><tr><th>Provinsi</th><th>Kabupaten/Kota</th><th>Kecamatan</th><th>Desa</th><th>L</th><th>P</th><th>Total</th></tr></thead><tbody id="regionAreaBody"></tbody></table></div></div>
      <div class="card"><div class="card-head"><div><span class="section-kicker">DATA ANAK</span><h2>Daftar Anak</h2><p>50 anak per halaman untuk menjaga performa pada koneksi lambat.</p></div></div><div class="region-table-wrap"><table class="region-table"><thead><tr><th>Nama Anak</th><th>JK</th><th>Tanggal Lahir</th><th>Orang Tua</th><th>Wilayah</th><th>Puskesmas / Posyandu</th></tr></thead><tbody id="regionChildBody"></tbody></table></div><div id="regionPager" class="region-pager"></div></div>`;
  }

  function filters(){return{province:document.getElementById('regionProvince')?.value||'',district:document.getElementById('regionDistrict')?.value||'',subdistrict:document.getElementById('regionSubdistrict')?.value||'',village:document.getElementById('regionVillage')?.value||'',search:document.getElementById('regionSearch')?.value.trim()||''}}
  function setOptions(id,items,label,value){const el=document.getElementById(id);if(!el)return;el.innerHTML=`<option value="">${label}</option>`+(items||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');if([...el.options].some(o=>o.value===value))el.value=value}

  function renderReport(data,keep={}){
    const f=data.filters||{};
    setOptions('regionProvince',f.provinces,'Semua provinsi',keep.province||'');
    setOptions('regionDistrict',f.districts,'Semua kabupaten/kota',keep.district||'');
    setOptions('regionSubdistrict',f.subdistricts,'Semua kecamatan',keep.subdistrict||'');
    setOptions('regionVillage',f.villages,'Semua desa',keep.village||'');
    const k=document.getElementById('regionKpis');if(k)k.innerHTML=[['Total anak',data.total],['Laki-laki',data.male],['Perempuan',data.female],['Kombinasi wilayah',(data.areas||[]).length]].map(([l,v])=>`<div class="region-kpi"><b>${num(v)}</b><span>${l}</span></div>`).join('');
    const meta=document.getElementById('regionMeta');if(meta)meta.innerHTML=`Menampilkan <b>${num(data.total)}</b> anak • halaman <b>${num(data.page)}</b> dari <b>${num(data.pages)}</b>. Sumber: data individu kohort yang sudah masuk ke Supabase.`;
    const ab=document.getElementById('regionAreaBody');if(ab)ab.innerHTML=(data.areas||[]).length?(data.areas||[]).map(r=>`<tr><td>${esc(r.province)}</td><td>${esc(r.district)}</td><td>${esc(r.subdistrict)}</td><td>${esc(r.village)}</td><td>${num(r.male)}</td><td>${num(r.female)}</td><td><b>${num(r.total)}</b></td></tr>`).join(''):'<tr><td colspan="7">Tidak ada data pada filter ini.</td></tr>';
    const cb=document.getElementById('regionChildBody');if(cb)cb.innerHTML=(data.children||[]).length?(data.children||[]).map(c=>`<tr><td class="region-child-name"><b>${esc(c.name)}</b><small>NIK: ${esc(c.nik||'-')}</small></td><td>${esc(c.sex||'-')}</td><td>${esc(c.dob||'-')}</td><td>${esc(c.parent_name||'-')}</td><td>${esc(c.province)} • ${esc(c.district)} • ${esc(c.subdistrict)} • <b>${esc(c.village)}</b></td><td>${esc(c.puskesmas||'-')} / ${esc(c.posyandu||'-')}</td></tr>`).join(''):'<tr><td colspan="6">Tidak ada data anak pada filter ini.</td></tr>';
    const p=document.getElementById('regionPager');if(p)p.innerHTML=Number(data.pages||1)>1?`<button class="btn secondary" type="button" data-region-page="prev" ${Number(data.page)<=1?'disabled':''}>‹ Sebelumnya</button><span>Halaman ${num(data.page)} / ${num(data.pages)}</span><button class="btn secondary" type="button" data-region-page="next" ${Number(data.page)>=Number(data.pages)?'disabled':''}>Berikutnya ›</button>`:`<span>1 halaman</span>`;
  }

  async function fetchReport(page=1,pageSize=50){
    const f=filters();
    const {data,error}=await getClient().rpc('simids_child_region_report',{p_province:f.province||null,p_district:f.district||null,p_subdistrict:f.subdistrict||null,p_village:f.village||null,p_search:f.search||null,p_page:page,p_page_size:pageSize});
    if(error)throw error;return{data:data||{},filters:f};
  }

  async function loadReport(page=1){
    if(reportBusy)return;reportBusy=true;reportPage=page;
    const meta=document.getElementById('regionMeta');if(meta)meta.textContent='Memuat laporan dari server…';
    try{const r=await fetchReport(page,50);renderReport(r.data,r.filters)}catch(e){console.error(e);if(meta)meta.textContent='Laporan gagal dimuat: '+(e.message||e)}finally{reportBusy=false}
  }

  function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s}
  async function exportCsv(){
    const btn=document.getElementById('regionExportBtn');if(btn){btn.disabled=true;btn.textContent='Menyiapkan CSV…'}
    try{
      let page=1,all=[],first=null;
      do{const r=await fetchReport(page,2500);first=first||r.data;all.push(...(r.data.children||[]));page++}while(first&&page<=Number(first.pages||1));
      const head=['Nama Anak','NIK','Tanggal Lahir','JK','Nama Orang Tua','Telepon','Alamat','Provinsi','Kabupaten/Kota','Kecamatan','Desa','Puskesmas','Posyandu'];
      const rows=all.map(c=>[c.name,c.nik,c.dob,c.sex,c.parent_name,c.phone,c.address,c.province,c.district,c.subdistrict,c.village,c.puskesmas,c.posyandu]);
      const csv='\ufeff'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=window.URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`laporan-data-anak-per-daerah-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>window.URL.revokeObjectURL(url),1000);
    }catch(e){alert('Ekspor gagal: '+(e.message||e))}finally{if(btn){btn.disabled=false;btn.textContent='⬇ Unduh CSV'}}
  }

  function bind(){
    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-page="report"],[data-jump="report"]');if(nav)setTimeout(()=>loadReport(1),0);
      if(e.target.closest('#regionApplyBtn'))loadReport(1);
      if(e.target.closest('#regionResetBtn')){['regionProvince','regionDistrict','regionSubdistrict','regionVillage','regionSearch'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});loadReport(1)}
      if(e.target.closest('#regionExportBtn'))exportCsv();
      const p=e.target.closest('[data-region-page]');if(p){const next=p.dataset.regionPage==='next'?reportPage+1:Math.max(1,reportPage-1);loadReport(next)}
    },true);
    document.addEventListener('change',e=>{
      const id=e.target?.id;if(!['regionProvince','regionDistrict','regionSubdistrict','regionVillage'].includes(id))return;
      if(id==='regionProvince'){['regionDistrict','regionSubdistrict','regionVillage'].forEach(x=>{const el=document.getElementById(x);if(el)el.value=''})}
      if(id==='regionDistrict'){['regionSubdistrict','regionVillage'].forEach(x=>{const el=document.getElementById(x);if(el)el.value=''})}
      if(id==='regionSubdistrict'){const el=document.getElementById('regionVillage');if(el)el.value=''}
      loadReport(1);
    },true);
    document.addEventListener('keydown',e=>{if(e.target?.id==='regionSearch'&&e.key==='Enter'){e.preventDefault();loadReport(1)}},true);
  }

  function init(){
    if(initialized)return;
    if(!window.SIMIDS_READY||!document.getElementById('page-report')){setTimeout(init,100);return}
    initialized=true;addStyle();hideProgramDashboard();patchFollowup();reportTemplate();bind();
    if(window.SimidsBackend?.reportSummary)window.SimidsBackend.reportSummary=async()=>({counts:[]});
    if(document.getElementById('page-report')?.classList.contains('active'))loadReport(1);
  }
  init();
})();
