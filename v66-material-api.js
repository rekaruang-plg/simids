(()=>{
  const BUCKET='simids-education-materials';
  let c=null;
  function client(){
    if(c)return c;
    c=supabase.createClient('https://ntdqqzqgkylxixivkmrp.supabase.co','sb_publishable_QeWv7cMl3JCrHWBN0m5cQA_IN0Tbk_w',{auth:{storage:sessionStorage,storageKey:'simids-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    return c;
  }
  const safeName=name=>String(name||'materi').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-120);
  async function list(){const {data,error}=await client().from('simids_education_materials').select('id,title,category,description,file_name,storage_path,mime_type,size_bytes,created_at').eq('active',true).order('created_at',{ascending:false});if(error)throw error;return data||[]}
  async function upload({title,category,description,file}){const {data:{user},error:userError}=await client().auth.getUser();if(userError||!user)throw userError||new Error('Sesi login tidak ditemukan.');const path=`materials/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error:up}=await client().storage.from(BUCKET).upload(path,file,{upsert:false,cacheControl:'3600',contentType:file.type||'application/octet-stream'});if(up)throw up;const {error:ins}=await client().from('simids_education_materials').insert({title:String(title||'').trim(),category,description:String(description||'').trim()||null,file_name:file.name,storage_path:path,mime_type:file.type||'application/octet-stream',size_bytes:file.size,created_by:user.id});if(ins){await client().storage.from(BUCKET).remove([path]);throw ins}}
  async function open(id,rows){const m=(rows||[]).find(x=>x.id===id);if(!m)return;const tab=window.open('about:blank','_blank');try{const {data,error}=await client().storage.from(BUCKET).createSignedUrl(m.storage_path,3600);if(error)throw error;if(tab)tab.location.href=data.signedUrl;else location.href=data.signedUrl}catch(e){tab?.close();throw e}}
  async function remove(m){const {error}=await client().from('simids_education_materials').update({active:false}).eq('id',m.id);if(error)throw error;const {error:storageError}=await client().storage.from(BUCKET).remove([m.storage_path]);if(storageError)console.warn(storageError)}
  window.SimidsMaterialAPI={list,upload,open,remove};
})();
