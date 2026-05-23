(function(){
  const PAGEVIEW_ENDPOINT = 'https://gre-auth.goenka-aditya-kol.workers.dev/analytics/view';
  const EVENT_ENDPOINT    = 'https://gre-auth.goenka-aditya-kol.workers.dev/analytics/event';
  const STORAGE_KEY = 'gqp_anon_visitor_id';

  function visitorId(){
    try{
      let id = localStorage.getItem(STORAGE_KEY);
      if(!id){
        id = crypto && crypto.randomUUID ? crypto.randomUUID() : 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    }catch(e){
      return 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  }

  function track(){
    const payload = {
      site: 'grequantpro',
      visitorId: visitorId(),
      path: location.pathname,
      title: document.title,
      referrer: document.referrer ? document.referrer.slice(0, 240) : ''
    };
    try{
      fetch(PAGEVIEW_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function(){});
    }catch(e){}
  }

  // Custom event tracking — call window.GQP.track('event_name', { ...props })
  function trackEvent(eventName, props){
    try{
      fetch(EVENT_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          site: 'grequantpro',
          visitorId: visitorId(),
          event: String(eventName || 'unknown').slice(0, 60),
          path: location.pathname,
          props: props || {},
          ts: new Date().toISOString()
        }),
        keepalive: true
      }).catch(function(){});
    }catch(e){}
  }

  // Expose globally so events_common.js and any page can call window.GQP.track()
  window.GQP = window.GQP || {};
  window.GQP.track = trackEvent;

  if(document.readyState === 'complete') track();
  else window.addEventListener('load', track, {once:true});
})();
