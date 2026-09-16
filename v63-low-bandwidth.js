(()=>{
  const PAGE_SIZE=50;
  const REPORT_VACCINES=[
    ['HB0_24','HB0 (<24 Jam)'],['HB0_1_7','HB0 (1-7 Hari)'],['HB0_TOTAL','HB0 (Total)'],['BCG','BCG'],['OPV1','OPV-1'],['DPT_HB_HIB1','DPT/HB-Hib-1'],['HEXA1','DPT/HB-Hib-IPV (Heksavalen)-1'],['OPV2','OPV-2'],['PCV1','Pneumokokus-1'],['ROTA1','Rotavirus-1'],['DPT_HB_HIB2','DPT/HB-Hib-2'],['HEXA2','DPT/HB-Hib-IPV (Heksavalen)-2'],['OPV3','OPV-3'],['PCV2','Pneumokokus-2'],['DPT_HB_HIB3','DPT/HB-Hib-3'],['HEXA3','DPT/HB-Hib-IPV (Heksavalen)-3'],['OPV4','OPV-4'],['IPV1','IPV-1'],['ROTA2','Rotavirus-2'],['ROTA3','Rotavirus-3'],['MR1','Campak-Rubella (MR)-1'],['IPV2','IPV-2'],['IPV3','IPV-3 (Khusus DIY)'],['IBL','Imunisasi Bayi Lengkap']
  ];
  const VAX_LABEL=Object.fromEntries(REPORT_VACCINES);
  Object.assign(VAX_LABEL,{HB0:'HB0',MR2:'Campak-Rubella (MR)-2'});
  let ready=false,oldShowPage=null,childSearchTimer=null;
  let reportSeq=0,lastReport=null,lastReportContext=null;
  let dashboardSeq=0,followSeq=0,followPage=1,followHamlet='';
  const historyLoading=new Map();

  const stateNow=()=>window.SIMIDS_INITIAL||{};
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pct=(n,d)=>d?Math.round(Number(n||0)/Number(d)*1000)/10:0;
  const fmt=v=>{if(!v)return'-';const d=new Date(String(v).slice(0,10)+'T00:00:00');return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})};
  const diffDays=v=>v?Math.floor((new Date()-new Date(String(v).slice(0,10)+'T00:00:00'))/86400000):null;
  const vaccineLabel=id=>VAX_LABEL[id]||String(id||'-').replaceAll('_','-');
  const activePage=()=>document.querySelector('.page.active')?.id?.replace(/^page-/,'')||'home';

  function overlay(show,label='Memuat data…'){
    let el=document.getElementById('simidsLowBandwidthOverlay');
    if(!show){el?.remove();return}
    if(!el){el=document.createElement('div');el.id='simidsLowBandwidthOverlay';el.style.cssText='position:fixed;inset:0;background:#f8fafce8;z-index:25000;display:grid;place-items:center;padding:24px';el.innerHTML='<div style="background:#fff;border:1px solid #dbe5e3;border-radius:18px;padding:22px 26px;box-shadow:0 12px 40px #1f29371f;text-align:center;max-width:360px"><b id="simidsLowBandwidthTitle" style="display:block;font-size:18px;margin-bottom:6px"></b><small style="color:#64748b">Mengambil hanya data yang dibutuhkan.</small></div>';document.body.appendChild(el)}
    document.getElementById('simidsLowBandwidthTitle').textContent=label;
  }

  function riskLite(child){
    const s=stateNow();
    const due=child.latestDueDate||'';
    const d=diffDays(due);
    if(due&&d>0)return{status:'overdue',label:`Jadwal lewat ${d} hari`,due};
    if(due&&d>=-Number(s.settings?.warningDays||30))return{status:'due',label:'Jadwal sudah dekat',due};
    if(child.hasMr2!==true)return{status:'mr2',label:'MR-2 belum tercatat',due};
    return{status:'ok',label:'Terpantau',due};
  }

  async function ensureChildHistory(id,{showOverlay=false}={}){
    const s=stateNow();
    if(!id||s.fullEvents||s.loadedChildHistories?.[id])return;
    if(historyLoading.has(id))return historyLoading.get(id);
    const p=(async()=>{
      if(showOverlay)overlay(true,'Memuat riwayat anak…');
      try{
        await window.SimidsBackend.loadChildHistory(s,id);
        window.indexEvents?.();
        refreshChildSummaries();
      }finally{if(showOverlay)overlay(false);historyLoading.delete(id)}
    })();
    historyLoading.set(id,p);return p;
  }

  function refreshChildSummaries(){
    const s=stateNow(),map=new Map((s.children||[]).map(c=>[c.id,c])),root=document.getElementById('childrenCards');if(!root)return;
    root.querySelectorAll('.record-card').forEach(card=>{
      const trigger=card.querySelector('[data-quick-immunize]');if(!trigger)return;
      const c=map.get(trigger.dataset.quickImmunize),main=card.querySelector('.record-main');if(!c||!main)return;
      let summary=main.querySelector('.simids-history-summary');
      if(!summary){summary=document.createElement('small');summary.className='simids-history-summary';main.appendChild(summary)}
      const n=Number(c.immunizationCount||0);
      summary.classList.toggle('empty',!n);
      summary.textContent=n?`✓ ${n} riwayat imunisasi tercatat • terakhir ${vaccineLabel(c.lastVaccine)} (${fmt(c.lastImmunizationDate)})`:'Belum ada riwayat imunisasi tercatat';
    });
  }

  function renderHomeLite(){
    const s=stateNow(),focus=s.settings?.focusVillage,kids=(s.children||[]).filter(c=>!focus||c.village===focus),risks=kids.map(riskLite);
    const over=risks.filter(r=>r.status==='overdue').length,due=risks.filter(r=>r.status==='due').length,mr2=kids.filter(c=>c.hasMr2===true).length,unvalidated=Number(s.unvalidatedCount??kids.reduce((a,c)=>a+Number(c.unvalidatedCount||0),0));
    const todayText=document.getElementById('todayText');if(todayText)todayText.textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const gt=document.getElementById('greetingText');if(gt){const h=new Date().getHours(),g=h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';gt.textContent=(g+' • KADER POSYANDU').toUpperCase()}
    const hs=document.getElementById('homeSummary');if(hs)hs.innerHTML=[['Anak terdaftar',kids.length],['Jadwal lewat',over],['Jadwal dekat',due],['Cakupan MR-2',pct(mr2,kids.length)+'%']].map(([l,v])=>`<div class="summary-box"><b>${v}</b><span>${l}</span></div>`).join('');
    const total=over+due,banner=document.getElementById('homeReminderBanner');
    if(banner){banner.classList.toggle('safe',!total);banner.innerHTML=total?`<div class="reminder-banner-icon">🔔</div><div class="reminder-banner-copy"><b>${over?`${over} anak perlu segera dihubungi`:''}${over&&due?' • ':''}${due?`${due} jadwal sudah dekat`:''}</b><span>Tekan tombol untuk membuka daftar dan pesan WhatsApp yang sudah disiapkan.</span></div><button class="btn light" id="homeOpenReminder">Lihat pengingat</button>`:`<div class="reminder-banner-icon">✓</div><div class="reminder-banner-copy"><b>Tidak ada pengingat mendesak hari ini</b><span>Silakan lanjutkan pencatatan pelayanan rutin.</span></div><button class="btn secondary" data-jump="immunization">Catat imunisasi</button>`}
    const tasks=[];if(over)tasks.push([`${over} anak jadwalnya sudah lewat`,'Hubungi orang tua terlebih dahulu','followup']);if(due)tasks.push([`${due} anak jadwalnya sudah dekat`,'Beri pengingat sebelum jadwal terlewat','followup']);if(unvalidated&&s.settings?.role!=='kader')tasks.push([`${unvalidated} input menunggu validasi`,'Periksa input kader','dashboard']);if(!tasks.length)tasks.push(['Semua pengingat sudah aman','Lanjutkan pencatatan pelayanan rutin','immunization']);
    const tt=document.getElementById('todayTasks');if(tt)tt.innerHTML=tasks.map(([a,b,p],i)=>`<div class="task-item"><div><b>${i+1}. ${esc(a)}</b><small>${esc(b)}</small></div><button class="mini-btn primary" data-jump="${p}">Buka</button></div>`).join('');
    window.updateReminderBadges?.();
  }

  function targetAggregate(items){
    const keys=['pusdatinBirthMale','pusdatinBirthFemale','pusdatinSurvivingMale','pusdatinSurvivingFemale','localBirthMale','localBirthFemale','localSurvivingMale','localSurvivingFemale'];
    const out={name:'TOTAL',verified:items.length>0&&items.every(t=>t.verified)};keys.forEach(k=>out[k]=items.reduce((a,t)=>a+Number(t[k]||0),0));return out;
  }
  function targetFor(village){const s=stateNow();return village==='all'?targetAggregate(s.targets||[]):(s.targets||[]).find(t=>t.name===village)||{name:village,verified:false}}
  function targetHtml(t){if(!t?.verified)return '<div class="info-box">Sasaran resmi belum diverifikasi. Jumlah pelayanan ditampilkan; persentase sasaran belum tersedia.</div>';return [['Pusdatin • Bayi Baru Lahir',t.pusdatinBirthMale,t.pusdatinBirthFemale],['Pusdatin • Surviving Infants',t.pusdatinSurvivingMale,t.pusdatinSurvivingFemale],['Sasaran Daerah • Bayi Baru Lahir',t.localBirthMale,t.localBirthFemale],['Sasaran Daerah • Surviving Infants',t.localSurvivingMale,t.localSurvivingFemale]].map(([l,m,f])=>`<div class="report-target-card"><span>${l}</span><div><b>${Number(m||0)+Number(f||0)}</b><small>L ${Number(m||0)} • P ${Number(f||0)}</small></div></div>`).join('')}

  function reportCountMap(data){const m=new Map();for(const r of data.counts||[])m.set(`${r.village}|${r.vaccine_code}|${r.sex}`,Number(r.n||0));return m}
  function reportStat(map,village,code,target){const key=village==='all'?'__ALL__':village,m=map.get(`${key}|${code}|L`)||0,f=map.get(`${key}|${code}|P`)||0,dm=target?.verified?Number(target.localSurvivingMale||0):0,df=target?.verified?Number(target.localSurvivingFemale||0):0;return{m,f,n:m+f,pm:dm?pct(m,dm):'—',pf:df?pct(f,df):'—',pn:dm+df?pct(m+f,dm+df):'—'}}
  function excelHeader(){return `<thead><tr class="excel-h1"><th rowspan="3">NO</th><th rowspan="3">PUSKESMAS</th><th rowspan="3">DESA</th><th colspan="6">SASARAN PUSDATIN</th><th colspan="6">SASARAN DAERAH</th><th colspan="${REPORT_VACCINES.length*6}">HASIL IMUNISASI BAYI</th></tr><tr class="excel-h2"><th colspan="3">BAYI BARU LAHIR</th><th colspan="3">SURVIVING INFANTS</th><th colspan="3">BAYI BARU LAHIR</th><th colspan="3">SURVIVING INFANTS</th>${REPORT_VACCINES.map(v=>`<th colspan="6">${esc(v[1])}</th>`).join('')}</tr><tr class="excel-h3">${'<th>L</th><th>P</th><th>JUMLAH</th>'.repeat(4)}${REPORT_VACCINES.map(()=>'<th># L</th><th>%</th><th># P</th><th>%</th><th># JML</th><th>%</th>').join('')}</tr></thead>`}
  function reportExcelRow(map,target,index,total=false){const s=stateNow(),village=total?'all':target.name,vals=[total?'TOTAL':index+1,s.settings?.puskesmas||'Puskesmas Tanjung Lago',total?'TOTAL':target.name,target.pusdatinBirthMale||0,target.pusdatinBirthFemale||0,Number(target.pusdatinBirthMale||0)+Number(target.pusdatinBirthFemale||0),target.pusdatinSurvivingMale||0,target.pusdatinSurvivingFemale||0,Number(target.pusdatinSurvivingMale||0)+Number(target.pusdatinSurvivingFemale||0),target.localBirthMale||0,target.localBirthFemale||0,Number(target.localBirthMale||0)+Number(target.localBirthFemale||0),target.localSurvivingMale||0,target.localSurvivingFemale||0,Number(target.localSurvivingMale||0)+Number(target.localSurvivingFemale||0)];if(!target.verified)for(let i=3;i<15;i++)vals[i]='—';for(const [id] of REPORT_VACCINES){const r=reportStat(map,village,id,target);vals.push(r.m,r.pm,r.f,r.pf,r.n,r.pn)}return vals}

  async function loadReport(){
    if(!ready||!window.SimidsBackend?.reportSummary)return;
    const seq=++reportSeq,s=stateNow(),village=document.getElementById('reportVillageFilter')?.value||s.scope||s.settings?.focusVillage||'all',month=Number(document.getElementById('reportMonthFilter')?.value||new Date().getMonth()+1),year=Number(s.settings?.year||new Date().getFullYear());
    const meta=document.getElementById('reportMeta');if(meta)meta.innerHTML='<span class="meta-chip">Memuat ringkasan dari server…</span>';
    try{
      const data=await window.SimidsBackend.reportSummary({village,year,month});if(seq!==reportSeq)return;
      lastReport=data;lastReportContext={village,month,year};renderReportRemote(data,lastReportContext);
    }catch(err){console.error(err);if(meta)meta.innerHTML=`<span class="meta-chip">Gagal memuat: ${esc(err.message||err)}</span>`}
  }
  function renderReportRemote(data,ctx){
    const map=reportCountMap(data),target=targetFor(ctx.village),meta=document.getElementById('reportMeta');
    if(meta)meta.innerHTML=`<span class="meta-chip">Wilayah: <b>${ctx.village==='all'?'Semua desa':esc(ctx.village)}</b></span><span class="meta-chip">Sampai bulan: <b>${ctx.month}</b></span><span class="meta-chip">Tahun: <b>${ctx.year}</b></span><span class="meta-chip">Mode: <b>ringkasan server</b></span>`;
    const ts=document.getElementById('reportTargetSummary');if(ts)ts.innerHTML=targetHtml(target);
    const body=document.getElementById('reportTableBody');if(body)body.innerHTML=REPORT_VACCINES.map(([id,label])=>{const r=reportStat(map,ctx.village,id,target);return `<tr><td>${esc(label)}</td><td>${r.m}</td><td>${r.pm}${r.pm==='—'?'':'%'}</td><td>${r.f}</td><td>${r.pf}${r.pf==='—'?'':'%'}</td><td>${r.n}</td><td>${r.pn}${r.pn==='—'?'':'%'}</td></tr>`}).join('');
    const table=document.getElementById('excelReportTable');if(table){const selected=ctx.village==='all'?(stateNow().targets||[]):(stateNow().targets||[]).filter(t=>t.name===ctx.village);let rows=selected.map((t,i)=>reportExcelRow(map,t,i,false));if(ctx.village==='all')rows.push(reportExcelRow(map,targetAggregate(stateNow().targets||[]),0,true));table.innerHTML=excelHeader()+`<tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>`}
    const f=data.followup_summary||data.followups||{},fr=document.getElementById('followupReport');if(fr)fr.innerHTML=`Total catatan tindak lanjut: <b>${Number(f.total||0)}</b> • dikunjungi: <b>${Number(f.visited||0)}</b> • tercatat sudah diimunisasi setelah tindak lanjut: <b>${Number(f.immunized||0)}</b>.`;
  }

  function csvCell(v){if(typeof v==='string'&&/^[=+@\-\t\r]/.test(v))v="'"+v;return `"${String(v??'').replace(/"/g,'""')}"`}
  function download(data,name,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
  function exportReportRemote(){if(!lastReport||!lastReportContext)return loadReport();const map=reportCountMap(lastReport),ctx=lastReportContext,targets=ctx.village==='all'?(stateNow().targets||[]):(stateNow().targets||[]).filter(t=>t.name===ctx.village);const rows=targets.map((t,i)=>reportExcelRow(map,t,i,false));if(ctx.village==='all')rows.push(reportExcelRow(map,targetAggregate(stateNow().targets||[]),0,true));const h1=['NO','PUSKESMAS','DESA','SASARAN PUSDATIN','','','','','','SASARAN DAERAH','','','','','','HASIL IMUNISASI BAYI',...Array(Math.max(0,REPORT_VACCINES.length*6-1)).fill('')],h2=['','','','BAYI BARU LAHIR','','','SURVIVING INFANTS','','','BAYI BARU LAHIR','','','SURVIVING INFANTS','','',...REPORT_VACCINES.flatMap(v=>[v[1],'','','','',''])],h3=['','','','L','P','JUMLAH','L','P','JUMLAH','L','P','JUMLAH','L','P','JUMLAH',...REPORT_VACCINES.flatMap(()=>['# L','%','# P','%','# JML','%'])];download('\ufeff'+[h1,h2,h3,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n'),`SiMIDS_Format_Excel_${ctx.village}_${ctx.year}_${String(ctx.month).padStart(2,'0')}.csv`,'text/csv;charset=utf-8')}

  async function loadDashboard(){
    if(!ready||!window.SimidsBackend?.dashboardSummary)return;
    const seq=++dashboardSeq,s=stateNow(),vaccine=document.getElementById('trendVaccineSelect')?.value||'MR2',village=s.scope||s.settings?.focusVillage||'';
    const k=document.getElementById('programKpis');if(k)k.innerHTML='<div class="empty">Memuat dashboard ringkas…</div>';
    try{const data=await window.SimidsBackend.dashboardSummary({village,vaccine,warningDays:s.settings?.warningDays||30});if(seq!==dashboardSeq)return;renderDashboardRemote(data,vaccine)}catch(err){console.error(err);if(k)k.innerHTML=`<div class="empty">Dashboard gagal dimuat: ${esc(err.message||err)}</div>`}
  }
  function renderDashboardRemote(d,vaccine){
    const n=Number(d.children_count||0),mr1=Number(d.mr1_count||0),mr2=Number(d.mr2_count||0),bcg=Number(d.bcg_count||0),ibl=Number(d.ibl_count||0),over=Number(d.overdue_count||0),unv=Number(d.unvalidated_count||0),a=d.assessment||{},p=d.proposal||{};
    const k=document.getElementById('programKpis');if(k)k.innerHTML=[['Anak terdaftar',n],['MR-1',pct(mr1,n)+'%'],['MR-2',pct(mr2,n)+'%'],['Perlu sweeping',over],['Menunggu validasi',unv]].map(([l,v])=>`<div class="kpi-card"><b>${v}</b><span>${l}</span></div>`).join('');
    const bars=document.getElementById('coverageBars');if(bars)bars.innerHTML=[['BCG',bcg],['MR1',mr1],['MR2',mr2],['IBL',ibl]].map(([id,count])=>{const pc=pct(count,n);return `<div class="coverage-row"><div class="top"><span>${esc(vaccineLabel(id))}</span><b>${pc}%</b></div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,pc)}%"></div></div></div>`}).join('');
    const pre=Number(a.pre||0),post=Number(a.post||0),improve=pre?(post-pre)/pre*100:0,delay=d.latest_validated_date?diffDays(d.latest_validated_date):999;
    const targets=[['Pre-test ibu balita','≥90 responden',Number(p.ibu_assessed||0)>=90],['Penyuluhan ibu balita','≥100 peserta & 4 dusun',Number(p.edu_participants||0)>=100&&Number(p.edu_hamlets||0)>=4],['Kader lulus operasional','≥7 dari 8 kader, nilai ≥70',Number(p.trained_kader||0)>=7],['Kohort masuk sistem','187 balita',n>=187],['Sweeping MR-2','≥22 anak',Number(p.swept||0)>=22],['Peningkatan pengetahuan','≥30%',improve>=30],['Keterlambatan data','≤7 hari',delay<=7],['Cakupan MR-2 akhir','≥85%',pct(mr2,n)>=85]];
    const pt=document.getElementById('proposalTargets');if(pt)pt.innerHTML=targets.map(([x,y,ok])=>`<div class="target-card"><b>${esc(x)}</b><small>${esc(y)}</small><div class="target-status"><span class="tag ${ok?'good':'warn'}">${ok?'Tercapai':'Belum tercapai'}</span></div></div>`).join('');
    const q=d.validation_queue||[],vq=document.getElementById('validationQueue');if(vq)vq.innerHTML=q.length?q.map(e=>`<div class="record-card"><div class="record-main"><b>${esc(e.child_name||'-')} — ${esc(vaccineLabel(e.vaccine_code))}</b><small>${fmt(e.immunization_date)} • ${esc(e.hamlet||'')}</small></div><div class="record-actions"><button class="mini-btn good" data-remote-validate="${esc(e.id)}" data-remote-child="${esc(e.child_id)}">✓ Validasi</button></div></div>`).join(''):'<div class="empty">Tidak ada data menunggu validasi.</div>';
    renderTrendRemote(d.trend||[],n,vaccine);
  }
  function renderTrendRemote(rows,total,vaccine){const el=document.getElementById('weeklyTrend');if(!el)return;const points=rows.map(r=>({date:String(r.date).slice(0,10),count:Number(r.count||0),p:pct(Number(r.count||0),total)}));if(!points.length){el.innerHTML='<div class="empty">Belum ada data tren.</div>';return}const W=720,H=255,L=44,R=18,T=22,B=45,pw=W-L-R,ph=H-T-B,x=i=>L+(points.length===1?0:i*(pw/(points.length-1))),y=v=>T+(100-Math.max(0,Math.min(100,v)))/100*ph,poly=points.map((p,i)=>`${x(i)},${y(p.p)}`).join(' '),grid=[0,25,50,75,100];el.innerHTML=`<div class="trend-chart-wrap"><svg class="trend-svg" viewBox="0 0 ${W} ${H}">${grid.map(g=>`<line x1="${L}" y1="${y(g)}" x2="${W-R}" y2="${y(g)}" class="trend-grid"/><text x="${L-8}" y="${y(g)+4}" text-anchor="end" class="trend-axis">${g}%</text>`).join('')}<polyline points="${poly}" class="trend-line"/>${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.p)}" r="5" class="trend-dot"/><text x="${x(i)}" y="${Math.max(15,y(p.p)-11)}" text-anchor="middle" class="trend-value">${p.p}%</text><text x="${x(i)}" y="${H-16}" text-anchor="middle" class="trend-date">${new Date(p.date+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</text>`).join('')}</svg></div>`;const sum=document.getElementById('trendSummary');if(sum){const first=points[0]?.p||0,last=points.at(-1)?.p||0,d=Math.round((last-first)*10)/10;sum.innerHTML=`<span><b>${esc(vaccineLabel(vaccine))}</b></span><span>Awal periode <b>${first}%</b></span><span>Sekarang <b>${last}%</b></span><span>Perubahan <b>${d>0?'+':''}${d}%</b></span><small>Ringkasan dihitung di server agar hemat data.</small>`}}

  async function loadFollowup(){
    if(!ready||!window.SimidsBackend?.followupPage)return;
    const seq=++followSeq,s=stateNow(),village=document.getElementById('riskVillageFilter')?.value||s.scope||s.settings?.focusVillage||'all',status=document.getElementById('riskStatusFilter')?.value||'all';
    const list=document.getElementById('followupList');if(list)list.innerHTML='<div class="empty">Memuat daftar pengingat…</div>';
    try{const data=await window.SimidsBackend.followupPage({village,status,warningDays:s.settings?.warningDays||30,page:followPage,pageSize:PAGE_SIZE,hamlet:followHamlet});if(seq!==followSeq)return;renderFollowupRemote(data)}catch(err){console.error(err);if(list)list.innerHTML=`<div class="empty">Pengingat gagal dimuat: ${esc(err.message||err)}</div>`}
  }
  function wa(child,status,due){let ph=String(child.phone||'').replace(/\D/g,'');if(ph.startsWith('0'))ph='62'+ph.slice(1);if(ph&&!ph.startsWith('62'))ph='62'+ph;if(!ph)return'';const msg=`Assalamu'alaikum ${child.parent_name||'Bapak/Ibu'}. Kami dari Posyandu mengingatkan ${status==='overdue'?'jadwal imunisasi yang sudah terlewat':status==='due'?'jadwal imunisasi yang sudah dekat':'kelengkapan imunisasi MR-2'} untuk ${child.name}${due?' pada '+fmt(due):''}. Mohon konfirmasi apakah dapat hadir ke Posyandu / layanan imunisasi. Terima kasih.`;return `https://wa.me/${ph}?text=${encodeURIComponent(msg)}`}
  function renderFollowupRemote(d){const sm=d.summary||{},rs=document.getElementById('riskSummary');if(rs)rs.innerHTML=[['Segera hubungi',Number(sm.overdue||0)],['Jadwal dekat',Number(sm.due||0)],['MR-2 belum tercatat',Number(sm.mr2||0)]].map(([l,v])=>`<div class="risk-box"><b>${v}</b><span>${l}</span></div>`).join('');const map=document.getElementById('riskMap'),hs=d.hamlets||[];if(map){map.className=`risk-map ${hs.length===4?'risk-map-four':''}`;map.innerHTML=hs.length?hs.map((h,i)=>{const score=Number(h.overdue||0)*3+Number(h.due||0)*2+Number(h.mr2||0),lvl=(Number(h.overdue||0)>=2||score>=6)?'high':score>=2?'medium':'low';return `<button type="button" class="risk-zone ${lvl} ${followHamlet===h.hamlet?'selected':''} zone-${(i%4)+1}" data-remote-hamlet="${esc(h.hamlet)}"><span class="risk-zone-name">${esc(h.hamlet)}</span><strong>${Number(h.total||0)}</strong><span class="risk-zone-status">${lvl==='high'?'Prioritas tinggi':lvl==='medium'?'Perlu perhatian':'Risiko lebih rendah'}</span><small>${Number(h.overdue||0)} lewat • ${Number(h.due||0)} dekat • ${Number(h.mr2||0)} MR-2</small></button>`}).join(''):'<div class="empty">Belum ada risiko yang perlu dipetakan.</div>'}const active=document.getElementById('riskHamletActive');if(active)active.innerHTML=followHamlet?`Menampilkan daftar dari <b>${esc(followHamlet)}</b> <button type="button" class="link-btn" data-remote-hamlet-reset>× Tampilkan semua</button>`:'Sentuh salah satu dusun pada peta untuk memfilter daftar anak.';const list=document.getElementById('followupList'),rows=d.rows||[];if(list)list.innerHTML=rows.length?rows.map(c=>{const link=wa(c,c.risk_status,c.latest_due);return `<div class="record-card"><div class="record-main"><b>${esc(c.name)} <span class="tag ${c.risk_status==='overdue'?'danger':c.risk_status==='due'?'warn':'neutral'}">${c.risk_status==='overdue'?'Jadwal lewat':c.risk_status==='due'?'Jadwal dekat':'MR-2 belum tercatat'}</span></b><small>${esc(c.parent_name||'-')} • ${esc(c.hamlet||'-')}${c.latest_due?` • Jadwal: ${fmt(c.latest_due)}`:''}${c.last_followup_date?`<br>Terakhir: ${esc(c.last_followup_outcome||'Tindak lanjut')} (${fmt(c.last_followup_date)})`:''}</small></div><div class="record-actions">${link?`<a class="mini-btn wa-btn" href="${link}" target="_blank" rel="noopener">💬 WhatsApp</a>`:'<span class="tag neutral">No. WA belum diisi</span>'}<button class="mini-btn primary" data-remote-followup="${esc(c.id)}" data-remote-name="${esc(c.name)}" data-remote-parent="${esc(c.parent_name||'')}">✓ Catat hasil</button></div></div>`}).join(''):'<div class="empty">Tidak ada anak pada filter ini.</div>';document.getElementById('simidsFollowPager')?.remove();if(Number(d.pages||1)>1&&list){const p=document.createElement('div');p.id='simidsFollowPager';p.className='simids-pager';p.innerHTML=`<button type="button" data-follow-page="prev" ${Number(d.page)<=1?'disabled':''}>‹ Sebelumnya</button><span>Halaman ${Number(d.page)} / ${Number(d.pages)} • ${Number(d.total)} anak</span><button type="button" data-follow-page="next" ${Number(d.page)>=Number(d.pages)?'disabled':''}>Berikutnya ›</button>`;list.after(p)}}

  function renderPage(name){
    if(!ready)return;
    if(name==='home')return renderHomeLite();
    if(name==='children'){window.renderChildren?.();setTimeout(refreshChildSummaries,0);return}
    if(name==='immunization'){window.renderSelectedChild?.();window.renderRecentEvents?.();window.syncImmunizationPickerLabels?.();window.renderImmunizationReview?.();return}
    if(name==='followup')return loadFollowup();
    if(name==='education')return window.renderEducation?.();
    if(name==='dashboard')return loadDashboard();
    if(name==='report')return loadReport();
    if(name==='settings')return window.renderSettings?.();
  }

  function patchApp(){
    if(ready||!window.SIMIDS_READY||!window.renderAll||!window.showPage){setTimeout(patchApp,40);return}
    ready=true;
    window.risk=riskLite;
    window.renderHome=renderHomeLite;
    oldShowPage=window.showPage.bind(window);
    window.showPage=function(name){oldShowPage(name);renderPage(name)};
    window.renderAll=function(){
      window.indexEvents?.();window.fillServicePlaces?.();['childVillage','eduVillage','assessmentVillage','settingFocusVillage'].forEach(id=>window.fillVillage?.(id));['childVillageFilter','riskVillageFilter','reportVillageFilter'].forEach(id=>window.fillVillage?.(id,true));window.fillChild?.();window.fillVaccines?.();window.renderRole?.();window.updateConnection?.();window.refreshSearchableButtons?.();window.syncImmunizationPickerLabels?.();window.updateReminderBadges?.();renderPage(activePage());
    };
    const s=stateNow();['riskVillageFilter','reportVillageFilter'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value==='all'&&s.scope&&s.scope!=='all'&&[...el.options].some(o=>o.value===s.scope))el.value=s.scope});
    const c=document.getElementById('childrenCards');if(c)new MutationObserver(()=>queueMicrotask(refreshChildSummaries)).observe(c,{childList:true,subtree:false});
    renderHomeLite();refreshChildSummaries();
  }

  // Register before v61/app handlers (v63 is loaded first) so heavy all-scope requests never fire.
  document.addEventListener('change',e=>{
    const id=e.target?.id;
    if(id==='reportVillageFilter'||id==='reportMonthFilter'){e.stopImmediatePropagation();if(ready)loadReport();return}
    if(id==='riskVillageFilter'||id==='riskStatusFilter'){e.stopImmediatePropagation();followPage=1;followHamlet='';if(ready)loadFollowup();return}
    if(id==='trendVaccineSelect'){e.stopImmediatePropagation();if(ready)loadDashboard();return}
    if(id==='eventChild'&&ready){const childId=e.target.value;if(childId&&!stateNow().fullEvents&&!stateNow().loadedChildHistories?.[childId])setTimeout(async()=>{try{await ensureChildHistory(childId);window.indexEvents?.();e.target.dispatchEvent(new Event('change',{bubbles:true}))}catch(err){console.error(err)}},0)}
  },true);

  document.addEventListener('input',e=>{
    if(!ready||e.target?.id!=='childSearch')return;
    const filter=document.getElementById('childVillageFilter');if(filter?.value==='all')return;
    e.stopImmediatePropagation();clearTimeout(childSearchTimer);childSearchTimer=setTimeout(()=>{window.renderChildren?.();refreshChildSummaries()},250);
  },true);

  document.addEventListener('click',async e=>{
    if(!ready)return;
    const history=e.target.closest('[data-history-child]');
    if(history&&!stateNow().fullEvents&&!stateNow().loadedChildHistories?.[history.dataset.historyChild]){e.preventDefault();e.stopImmediatePropagation();const id=history.dataset.historyChild;try{await ensureChildHistory(id,{showOverlay:true});window.showPage('immunization');const sel=document.getElementById('eventChild');if(sel){sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}))}}catch(err){alert('Riwayat belum dapat dimuat: '+(err.message||err))}return}
    const openV=e.target.closest('#openVaccinePicker');if(openV){const id=document.getElementById('eventChild')?.value;if(id&&!stateNow().fullEvents&&!stateNow().loadedChildHistories?.[id]){e.preventDefault();e.stopImmediatePropagation();try{await ensureChildHistory(id,{showOverlay:true});window.indexEvents?.();window.renderSelectedChild?.();window.openVaccinePicker?.()}catch(err){alert('Riwayat anak belum dapat dimuat: '+(err.message||err))}return}}
    const fp=e.target.closest('[data-follow-page]');if(fp){e.preventDefault();e.stopImmediatePropagation();followPage+=fp.dataset.followPage==='next'?1:-1;followPage=Math.max(1,followPage);loadFollowup();return}
    const hm=e.target.closest('[data-remote-hamlet]');if(hm){e.preventDefault();e.stopImmediatePropagation();followHamlet=followHamlet===hm.dataset.remoteHamlet?'':hm.dataset.remoteHamlet;followPage=1;loadFollowup();return}
    if(e.target.closest('[data-remote-hamlet-reset]')){e.preventDefault();e.stopImmediatePropagation();followHamlet='';followPage=1;loadFollowup();return}
    const fu=e.target.closest('[data-remote-followup]');if(fu){e.preventDefault();e.stopImmediatePropagation();document.getElementById('followupChildId').value=fu.dataset.remoteFollowup;document.getElementById('followupChildName').textContent=`${fu.dataset.remoteName||'-'} • ${fu.dataset.remoteParent||'-'}`;document.getElementById('followupDate').value=new Date().toISOString().slice(0,10);document.getElementById('followupNotes').value='';document.getElementById('followupModal').classList.add('open');return}
    const val=e.target.closest('[data-remote-validate]');if(val){e.preventDefault();e.stopImmediatePropagation();overlay(true,'Memvalidasi catatan…');try{const s=stateNow(),childId=val.dataset.remoteChild;await ensureChildHistory(childId);window.indexEvents?.();const ev=(s.events||[]).find(x=>x.id===val.dataset.remoteValidate);if(!ev)throw new Error('Catatan tidak ditemukan.');ev.validated=true;await window.SimidsBackend.save(s,'validate_event');s.unvalidatedCount=Math.max(0,Number(s.unvalidatedCount||0)-1);await loadDashboard()}catch(err){alert('Validasi gagal: '+(err.message||err))}finally{overlay(false)}return}
    if(e.target.closest('#exportReportBtn')){e.preventDefault();e.stopImmediatePropagation();exportReportRemote();return}
    const ind=e.target.closest('#exportIndividualCsvBtn');if(ind){e.preventDefault();e.stopImmediatePropagation();overlay(true,'Menyiapkan ekspor kohort…');try{const s=stateNow();if(!s.fullEvents){await window.SimidsBackend.loadFullScope(s,s.scope);window.indexEvents?.()}window.exportIndividualKohort?.()}catch(err){alert('Ekspor gagal: '+(err.message||err))}finally{overlay(false)}return}
  },true);

  patchApp();
})();
