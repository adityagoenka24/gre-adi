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

  // ── Google Ads integration ──────────────────────────────────────────────────
  // Reads window.GQP_ADS (set by ads-config.js loaded before this script).
  // Dynamically injects gtag.js and wires conversions to our trackEvent calls.
  // No-ops silently if ads-config.js is missing or IDs are still placeholders.
  (function initGoogleAds(){
    var cfg = window.GQP_ADS;
    if(!cfg) return;
    var id = cfg.googleAdsId;
    if(!id || id.indexOf('REPLACE_ME') !== -1) return;

    // Bootstrap dataLayer + gtag shim before the async script loads
    window.dataLayer = window.dataLayer || [];
    if(!window.gtag){
      window.gtag = function(){ window.dataLayer.push(arguments); };
    }
    window.gtag('js', new Date());
    window.gtag('config', id);

    // Inject the gtag.js script
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);

    window.GQP._gadsReady = true;
  })();

  // Internal helper — fires a Google Ads conversion if configured for this event
  function fireGoogleConversion(eventName, extraProps){
    if(!window.GQP._gadsReady) return;
    var cfg = window.GQP_ADS;
    if(!cfg || !cfg.conversions) return;
    var convId = cfg.conversions[eventName];
    if(!convId || convId.indexOf('REPLACE_ME') !== -1) return;
    var payload = { send_to: convId };
    // Attach value/currency for purchase events
    if(eventName === 'purchase_completed' && extraProps && extraProps.plan){
      var val = cfg.values && cfg.values[extraProps.plan];
      if(val){ payload.value = val; payload.currency = cfg.currency || 'INR'; }
    }
    try{ window.gtag('event', 'conversion', payload); }catch(e){}
  }

  // Wrap trackEvent to also fire Google conversion
  var _origTrack = trackEvent;
  trackEvent = function(eventName, props){
    _origTrack(eventName, props);
    fireGoogleConversion(eventName, props);
  };
  window.GQP.track = trackEvent;

  // Delegated click tracker — add data-track="event_name" to any element.
  // Optionally add data-track-from="hero" etc. for context.
  // Example: <a href="..." data-track="buy_pro_clicked" data-track-from="pricing">Buy</a>
  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-track]');
    if(!el) return;
    const eventName = el.getAttribute('data-track');
    const from = el.getAttribute('data-track-from') || '';
    if(eventName) trackEvent(eventName, from ? { from: from } : {});
  }, true); // capture phase so it fires even if element stops propagation

  if(document.readyState === 'complete') track();
  else window.addEventListener('load', track, {once:true});
})();
