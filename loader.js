(async()=>{
const n=window.SIMIDS_CHUNKS,VERSION='20260916-v8';
const get=async url=>{const sep=url.includes('?')?'&':'?';const r=await fetch(`${url}${sep}v=${VERSION}`,{cache:'force-cache'});if(!r.ok)throw new Error(`${url} gagal dimuat (${r.status})`);return r.text()};
const load=async(type,count)=>(await Promise.all(Array.from({length:count},(_,i)=>get(`./chunks/${type}-${i+1}.txt`)))).join('');
try{
 const assetsPromise=Promise.all([load('body',n.body),load('css',n.css),get('./app.js')]);
 const dataPromise=SimidsBackend.login();
 const [initial,[body,css,js]]=await Promise.all([dataPromise,assetsPromise]);
 window.SIMIDS_INITIAL=initial;
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
 document.body.innerHTML=body;
 const script=document.createElement('script');script.textContent=js+'\n//# sourceURL=simids-app.js';document.body.appendChild(script);
}catch(err){console.error(err);document.body.innerHTML=`<div class="boot"><div><b>Gagal memuat aplikasi.</b><small>${String(err.message||err)}</small><br><button onclick="location.reload()" style="margin-top:16px;padding:12px 18px;border:0;border-radius:10px;background:#087f73;color:white;font-weight:700">Coba lagi</button></div></div>`}
})();
