(()=>{
  const LABELS={HB0:'HB0',HB0_24:'HB0 (<24 Jam)',HB0_1_7:'HB0 (1-7 Hari)',BCG:'BCG',OPV1:'OPV-1',OPV2:'OPV-2',OPV3:'OPV-3',OPV4:'OPV-4',DPT_HB_HIB1:'DPT/HB-Hib-1',DPT_HB_HIB2:'DPT/HB-Hib-2',DPT_HB_HIB3:'DPT/HB-Hib-3',IPV1:'IPV-1',IPV2:'IPV-2',IPV3:'IPV-3',ROTA1:'Rotavirus-1',ROTA2:'Rotavirus-2',ROTA3:'Rotavirus-3',PCV1:'Pneumokokus-1',PCV2:'Pneumokokus-2',MR1:'Campak-Rubella (MR)-1',MR2:'Campak-Rubella (MR)-2',IBL:'Imunisasi Bayi Lengkap'};
  const HISTORY_PAGE_SIZE=8;
  const css=`
    .simids-history-summary{display:block;margin-top:6px;color:#0f766e;font-weight:700}
    .simids-history-summary.empty{color:#64748b;font-weight:600}
    .simids-history-note{margin:10px 0 14px;padding:10px 12px;border:1px solid #dbe7e5;border-radius:12px;background:#f8fbfa;color:#475569;font-size:13px;line-height:1.45}
    .simids-history-details{margin-top:10px;width:100%;border-top:1px solid #dbe7e5;padding-top:9px}
    .simids-history-details summary{cursor:pointer;font-weight:800;color:#0f766e;min-height:34px;display:flex;align-items:center}
    .simids-history-list{display:grid;gap:7px;margin-top:8px}
    .simids-history-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:#f8fafc}
    .simids-history-row b{font-size:13px}.simids-history-row span{font-size:12px;color:#64748b;text-align:right}
    .simids-history-btn{min-height:44px!important}
    .simids-history-pager{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px}
    .simids-history-pager button{min-height:38px;padding:7px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;font-weight:700;cursor:pointer}
    .simids-history-pager button:disabled{opacity:.45;cursor:default}.simids-history-pager span{font-size:12px;color:#64748b;font-weight:700}
  `;
  const style=document.createElement('style');style.id='simids-history-patch-style';style.textContent=css;document.head.appendChild(style);

  const state=()=>window.SIMIDS_INITIAL||{};
  const label=id=>LABELS[id]||String(id||'-').replaceAll('_','-');
  const fmt=v=>{if(!v)return'-';const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?v:d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})};

  let indexedEventsRef=null,indexedEventsLength=-1,eventByChild=new Map();
  function rebuildIndex(){
    const events=state().events||[];
    if(events===indexedEventsRef&&events.length===indexedEventsLength)return;
    indexedEventsRef=events;indexedEventsLength=events.length;eventByChild=new Map();
    for(const e of events){if(!eventByChild.has(e.childId))eventByChild.set(e.childId,[]);eventByChild.get(e.childId).push(e)}
    for(const list of eventByChild.values())list.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  }
  function eventsFor(id){rebuildIndex();return eventByChild.get(id)||[]}

  function addPageNotes(){
    const list=document.getElementById('childrenCards');
    if(list&&!document.getElementById('simidsHistoryMeaning')){
      const note=document.createElement('div');note.id='simidsHistoryMeaning';note.className='simids-history-note';note.innerHTML='<b>Catatan:</b> label “MR-2 belum tercatat” tidak berarti anak belum pernah imunisasi. Jumlah riwayat imunisasi yang sudah ada ditampilkan pada setiap anak.';
      list.parentNode.insertBefore(note,list);
    }
    const risk=document.getElementById('riskSummary');
    if(risk&&!document.getElementById('simidsMr2Meaning')){
      const note=document.createElement('div');note.id='simidsMr2Meaning';note.className='simids-history-note';note.innerHTML='<b>MR-2 belum tercatat</b> hanya berarti belum ada catatan MR-2 di SiMIDS. Status ini bukan penilaian bahwa anak belum pernah mendapat imunisasi lain dan bukan penentuan jadwal medis.';
      risk.insertAdjacentElement('afterend',note);
    }
  }

  function decorateChildren(){
    rebuildIndex();
    const root=document.getElementById('childrenCards');if(!root)return;
    root.querySelectorAll('.record-card').forEach(card=>{
      const trigger=card.querySelector('[data-quick-immunize]');if(!trigger)return;
      const id=trigger.dataset.quickImmunize,ev=eventByChild.get(id)||[],main=card.querySelector('.record-main');if(!main)return;
      let summary=main.querySelector('.simids-history-summary');
      if(!summary){summary=document.createElement('small');summary.className='simids-history-summary';main.appendChild(summary)}
      const last=ev[0],sig=`${ev.length}|${last?.vaccineId||''}|${last?.date||''}`;
      if(summary.dataset.sig!==sig){
        summary.dataset.sig=sig;
        if(ev.length){summary.classList.remove('empty');summary.textContent=`✓ ${ev.length} riwayat imunisasi tercatat • terakhir ${label(last.vaccineId)} (${fmt(last.date)})`}
        else{summary.classList.add('empty');summary.textContent='Belum ada riwayat imunisasi tercatat'}
      }
      const actions=card.querySelector('.record-actions');
      if(actions&&!actions.querySelector('[data-history-child]')){
        const b=document.createElement('button');b.type='button';b.className='mini-btn simids-history-btn';b.dataset.historyChild=id;b.textContent='Riwayat';actions.insertBefore(b,actions.firstChild);
      }
    });
  }

  const historyPage=new Map();
  function selectedSignature(id,ev,page){const first=ev[(page-1)*HISTORY_PAGE_SIZE],last=ev[Math.min(ev.length-1,page*HISTORY_PAGE_SIZE-1)];return `${id}|${ev.length}|${page}|${first?.id||first?.vaccineId||''}:${first?.date||''}|${last?.id||last?.vaccineId||''}:${last?.date||''}`}
  function decorateSelected(force=false){
    rebuildIndex();
    const select=document.getElementById('eventChild'),box=document.getElementById('selectedChildPreview');if(!select||!box)return;
    const id=select.value;
    if(!id){box.querySelector('.simids-history-details')?.remove();return}
    const ev=eventByChild.get(id)||[];
    const pages=Math.max(1,Math.ceil(ev.length/HISTORY_PAGE_SIZE));
    const page=Math.min(Math.max(1,historyPage.get(id)||1),pages);historyPage.set(id,page);
    const sig=selectedSignature(id,ev,page);
    let details=box.querySelector('.simids-history-details');
    if(!force&&details?.dataset.sig===sig)return;
    details?.remove();
    details=document.createElement('details');details.className='simids-history-details';details.dataset.sig=sig;details.open=true;
    const summary=document.createElement('summary');summary.textContent=ev.length?`Riwayat imunisasi (${ev.length})`:'Belum ada riwayat imunisasi';details.appendChild(summary);
    const list=document.createElement('div');list.className='simids-history-list';
    if(ev.length){
      const start=(page-1)*HISTORY_PAGE_SIZE,end=Math.min(start+HISTORY_PAGE_SIZE,ev.length);
      ev.slice(start,end).forEach(e=>{const row=document.createElement('div');row.className='simids-history-row';const b=document.createElement('b');b.textContent=label(e.vaccineId);const s=document.createElement('span');s.textContent=`${fmt(e.date)}${e.servicePlace?' • '+e.servicePlace:''}`;row.append(b,s);list.appendChild(row)});
      if(pages>1){
        const pager=document.createElement('div');pager.className='simids-history-pager';pager.innerHTML=`<button type="button" data-history-page="prev" data-history-id="${id}" ${page===1?'disabled':''}>‹ Sebelumnya</button><span>Halaman ${page} / ${pages} • ${start+1}-${end} dari ${ev.length}</span><button type="button" data-history-page="next" data-history-id="${id}" ${page===pages?'disabled':''}>Berikutnya ›</button>`;list.appendChild(pager)
      }
    }else{const empty=document.createElement('div');empty.className='simids-history-note';empty.textContent='Tidak ada catatan imunisasi untuk anak ini pada data yang sedang aktif.';list.appendChild(empty)}
    details.appendChild(list);box.appendChild(details);
  }

  function openHistory(id){
    historyPage.set(id,1);
    if(typeof window.showPage==='function')window.showPage('immunization');
    const select=document.getElementById('eventChild');if(!select)return;
    if(select.value!==id){select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}))}
    else decorateSelected(true);
    setTimeout(()=>{decorateSelected(true);document.getElementById('selectedChildPreview')?.scrollIntoView({behavior:'smooth',block:'center'})},40);
  }

  document.addEventListener('click',e=>{
    const h=e.target.closest('[data-history-child]');
    if(h){e.preventDefault();openHistory(h.dataset.historyChild);return}
    const p=e.target.closest('[data-history-page]');
    if(p){e.preventDefault();const id=p.dataset.historyId,ev=eventsFor(id),pages=Math.max(1,Math.ceil(ev.length/HISTORY_PAGE_SIZE));let page=historyPage.get(id)||1;page+=p.dataset.historyPage==='next'?1:-1;historyPage.set(id,Math.min(Math.max(1,page),pages));decorateSelected(true);return}
    if(e.target.closest('[data-child-page]'))setTimeout(decorateChildren,0);
  },true);
  document.addEventListener('change',e=>{if(e.target?.id==='eventChild'){const id=e.target.value;if(id)historyPage.set(id,1);setTimeout(()=>decorateSelected(true),0)}},true);

  let scheduled=false;
  const scheduleChildren=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;rebuildIndex();addPageNotes();decorateChildren()})};
  const start=()=>{
    const c=document.getElementById('childrenCards'),s=document.getElementById('selectedChildPreview');
    if(!c||!s){setTimeout(start,80);return}
    new MutationObserver(scheduleChildren).observe(c,{childList:true,subtree:true});
    scheduleChildren();decorateSelected(true);
  };
  start();
})();
