import Script from "next/script";

/**
 * Load static WebMCP registration as early as possible.
 * Also keep a tiny inline boot so detection works if the external file is slow.
 */
export function WebMcpBootstrap() {
  return (
    <>
      <Script src="/webmcp-register.js" strategy="beforeInteractive" />
      <Script id="webmcp-inline-boot" strategy="beforeInteractive">{`
(function(){
  function tryReg(){
    if(!navigator.modelContext) return false;
    try {
      var s=document.createElement('script');
      s.src='/webmcp-register.js';
      s.async=false;
      document.documentElement.appendChild(s);
      return true;
    } catch(e) { return false; }
  }
  if(!tryReg()){
    var n=0,id=setInterval(function(){ if(tryReg()||++n>40) clearInterval(id); }, 50);
  }
})();
`}</Script>
    </>
  );
}
