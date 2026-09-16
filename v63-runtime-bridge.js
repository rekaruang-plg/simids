(()=>{
  const backend=window.SimidsBackend;
  if(!backend?.hydrateChild)return;
  const hydrate=backend.hydrateChild.bind(backend);
  backend.hydrateChild=async(...args)=>{
    const result=await hydrate(...args);
    if(typeof window.indexEvents==='function')window.indexEvents();
    return result;
  };
})();
