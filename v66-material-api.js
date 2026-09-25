(()=>{
  const PROJECT_ID='ntdqqzqgkylxixivkmrp';
  const PROJECT_URL=`https://${PROJECT_ID}.supabase.co`;
  const STORAGE_URL=`https://${PROJECT_ID}.storage.supabase.co`;
  const PUBLISHABLE_KEY='sb_publishable_QeWv7cMl3JCrHWBN0m5cQA_IN0Tbk_w';
  const BUCKET='simids-education-materials';
  const TUS_ENDPOINT=`${STORAGE_URL}/storage/v1/upload/resumable`;
  const CHUNK_SIZE=6*1024*1024;
  const STATE_PREFIX='simids-material-upload:';
  const STATE_TTL=23*60*60*1000;
  let c=null;

  function client(){
    if(c)return c;
    c=supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{storage:sessionStorage,storageKey:'simids-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    return c;
  }

  const safeName=name=>String(name||'materi').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-120);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const pct=(done,total)=>Math.max(0,Math.min(100,Math.round((Number(done||0)/Math.max(1,Number(total||1)))*100)));
  function b64(value){const bytes=new TextEncoder().encode(String(value??''));let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin)}
  function stateKey(userId,file){return STATE_PREFIX+[userId,file.name,file.size,file.lastModified,file.type||''].join('|')}
  function readState(key){try{const x=JSON.parse(localStorage.getItem(key)||'null');if(!x||!x.url||!x.path||Date.now()-Number(x.savedAt||0)>STATE_TTL){localStorage.removeItem(key);return null}return x}catch{localStorage.removeItem(key);return null}}
  function saveState(key,value){try{localStorage.setItem(key,JSON.stringify({...value,savedAt:Date.now()}))}catch{}}
  function clearState(key){try{localStorage.removeItem(key)}catch{}}

  async function authHeaders(extra={}){
    const {data:{session},error}=await client().auth.getSession();
    if(error||!session?.access_token)throw error||new Error('Sesi login tidak ditemukan.');
    return {authorization:`Bearer ${session.access_token}`,apikey:PUBLISHABLE_KEY,'Tus-Resumable':'1.0.0',...extra};
  }

  async function remoteOffset(url,fileSize){
    try{
      const res=await fetch(url,{method:'HEAD',headers:await authHeaders()});
      if(!res.ok)return null;
      const length=Number(res.headers.get('Upload-Length')||fileSize);
      const offset=Number(res.headers.get('Upload-Offset')||0);
      if(length!==Number(fileSize)||!Number.isFinite(offset)||offset<0||offset>fileSize)return null;
      return offset;
    }catch{return null}
  }

  async function createUpload(path,file,key){
    const metadata=[
      ['bucketName',BUCKET],
      ['objectName',path],
      ['contentType',file.type||'application/octet-stream'],
      ['cacheControl','3600']
    ].map(([k,v])=>`${k} ${b64(v)}`).join(',');
    const res=await fetch(TUS_ENDPOINT,{
      method:'POST',
      headers:await authHeaders({'Upload-Length':String(file.size),'Upload-Metadata':metadata})
    });
    if(!res.ok){const body=await res.text().catch(()=>'' );if(res.status===413)throw new Error('Ukuran file melewati batas Storage Supabase proyek saat ini. Proyek ini masih Free, sehingga batas global maksimal 50 MB. Untuk file hingga 300 MB perlu upgrade Supabase ke Pro lalu set Global file size limit minimal 300 MB.');throw new Error(`Gagal memulai upload video/file (HTTP ${res.status})${body?': '+body.trim():''}.`);}
    const location=res.headers.get('Location');
    if(!location)throw new Error('Server upload tidak mengembalikan alamat lanjutan.');
    const url=new URL(location,TUS_ENDPOINT+'/').href;
    saveState(key,{url,path});
    return {url,offset:0,resumed:false};
  }

  async function resumableUpload({file,path,key,onProgress}){
    let state=readState(key),url=null,offset=0,resumed=false;
    if(state?.path===path){
      const found=await remoteOffset(state.url,file.size);
      if(found!==null){url=state.url;offset=found;resumed=found>0}
      else clearState(key);
    }
    if(!url){
      const created=await createUpload(path,file,key);
      url=created.url;offset=created.offset;resumed=false;
    }
    onProgress?.({uploaded:offset,total:file.size,percent:pct(offset,file.size),resumed});

    const retryDelays=[1000,2000,4000,8000,12000];
    let retry=0;
    while(offset<file.size){
      const end=Math.min(offset+CHUNK_SIZE,file.size);
      const chunk=file.slice(offset,end);
      try{
        const res=await fetch(url,{
          method:'PATCH',
          headers:await authHeaders({'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'}),
          body:chunk
        });
        if(!res.ok)throw new Error(`HTTP ${res.status}`);
        const serverOffset=Number(res.headers.get('Upload-Offset'));
        offset=Number.isFinite(serverOffset)&&serverOffset>=end?serverOffset:end;
        retry=0;
        saveState(key,{url,path});
        onProgress?.({uploaded:offset,total:file.size,percent:pct(offset,file.size),resumed});
      }catch(err){
        if(retry>=retryDelays.length){
          const e=new Error('Upload terputus. Pilih file yang sama lalu tekan Upload Materi lagi untuk melanjutkan dari progres terakhir.');
          e.cause=err;
          throw e;
        }
        await wait(retryDelays[retry++]);
        const found=await remoteOffset(url,file.size);
        if(found===null){
          clearState(key);
          const created=await createUpload(path,file,key);
          url=created.url;offset=0;resumed=false;
        }else{
          offset=found;
          resumed=offset>0;
        }
        onProgress?.({uploaded:offset,total:file.size,percent:pct(offset,file.size),resumed:true,retrying:true});
      }
    }
  }

  async function list(){const {data,error}=await client().from('simids_education_materials').select('id,title,category,description,file_name,storage_path,mime_type,size_bytes,created_at').eq('active',true).order('created_at',{ascending:false});if(error)throw error;return data||[]}

  async function upload({title,category,description,file,onProgress}){
    const {data:{session},error:sessionError}=await client().auth.getSession();
    const user=session?.user;
    if(sessionError||!user)throw sessionError||new Error('Sesi login tidak ditemukan.');

    const key=stateKey(user.id,file);
    const saved=readState(key);
    const path=saved?.path||`materials/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName(file.name)}`;

    await resumableUpload({file,path,key,onProgress});

    const {data:existing,error:existingError}=await client().from('simids_education_materials').select('id').eq('storage_path',path).maybeSingle();
    if(existingError)throw existingError;
    if(!existing){
      const {error:ins}=await client().from('simids_education_materials').insert({
        title:String(title||'').trim(),
        category,
        description:String(description||'').trim()||null,
        file_name:file.name,
        storage_path:path,
        mime_type:file.type||'application/octet-stream',
        size_bytes:file.size,
        created_by:user.id
      });
      if(ins)throw new Error('File sudah terunggah, tetapi data materi belum tersimpan. Tekan Upload Materi lagi dengan file yang sama untuk melanjutkan tanpa mengunggah dari awal. '+(ins.message||''));
    }
    clearState(key);
    onProgress?.({uploaded:file.size,total:file.size,percent:100,resumed:Boolean(saved)});
  }

  async function open(id,rows){const m=(rows||[]).find(x=>x.id===id);if(!m)return;const tab=window.open('about:blank','_blank');try{const {data,error}=await client().storage.from(BUCKET).createSignedUrl(m.storage_path,3600);if(error)throw error;if(tab)tab.location.href=data.signedUrl;else location.href=data.signedUrl}catch(e){tab?.close();throw e}}
  async function remove(m){const {error}=await client().from('simids_education_materials').update({active:false}).eq('id',m.id);if(error)throw error;const {error:storageError}=await client().storage.from(BUCKET).remove([m.storage_path]);if(storageError)console.warn(storageError)}
  window.SimidsMaterialAPI={list,upload,open,remove};
})();
