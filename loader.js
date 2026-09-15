(async()=>{
const n=window.SIMIDS_CHUNKS;
const load=async(type,count)=>{const a=[];for(let i=1;i<=count;i++){const r=await fetch(`./chunks/${type}-${i}.txt`,{cache:'no-store'});if(!r.ok)throw new Error(`${type}-${i} gagal dimuat (${r.status})`);a.push(await r.text())}return a.join('')};
try{
 const [body,css,js]=await Promise.all([load('body',n.body),load('css',n.css),load('js',n.js)]);
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
 document.body.innerHTML=body;
 const script=document.createElement('script');script.textContent=js+'\n//# sourceURL=simids-app.js';document.body.appendChild(script);
}catch(err){console.error(err);document.body.innerHTML=`<div class="boot"><div><b>Gagal memuat aplikasi.</b><small>${String(err.message||err)}</small><br><button onclick="location.reload()" style="margin-top:16px;padding:12px 18px;border:0;border-radius:10px;background:#087f73;color:white;font-weight:700">Coba lagi</button></div></div>`}
})();
