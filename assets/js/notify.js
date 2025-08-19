(function(){
  // Configure EmailJS here. Fill these in from your EmailJS dashboard.
  // Public key example: "12AbC3..."
  const EMAILJS_PUBLIC_KEY = 'XvEX6--VhiqZ5GODv';
  const EMAILJS_SERVICE_ID = 'service_b4khhes';
  const BUSINESS_SENDER_NAME = 'John Plumber';
  const BUSINESS_EMAIL = 'Johnplumber011@gmail.com';
  const BUSINESS_PHONE = '+254 707 047 674';
  const EMAILJS_TEMPLATES = {
    received: 'template_m5kyzl9', // Contact Us (temp: used for order received)
    pending:  'template_6w3bdas', // Welcome (temp: used for order processing)
    complete: ''  // TODO: paste Template ID for "order completed"
  };

  function configured(){
    return !!(window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID);
  }

  function ensureInit(){
    try{
      if (configured() && !ensureInit.did){
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        ensureInit.did = true;
      }
    }catch(e){ console.warn('EmailJS init failed', e); }
  }

  function isEmail(v){ return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(v||'')); }

  async function send(type, toEmail, vars){
    if (!isEmail(toEmail)) return { ok:false, reason:'not-an-email' };
    if (!configured()){
      console.warn('EmailJS not configured. Skipping email for', type, toEmail);
      return { ok:false, reason:'not-configured' };
    }
    const templateId = EMAILJS_TEMPLATES[type];
    if (!templateId){
      console.warn('Template ID missing for', type);
      return { ok:false, reason:'template-missing' };
    }
    ensureInit();
    const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
    const params = Object.assign({
      to_email: toEmail,
      from_name: BUSINESS_SENDER_NAME,
      reply_to: BUSINESS_EMAIL,
      business_email: BUSINESS_EMAIL,
      business_phone: BUSINESS_PHONE,
      website_name: BUSINESS_SENDER_NAME,
      website_url: origin,
      website_icon_url: origin ? (origin + '/assets/images/logo.svg') : ''
    }, vars || {});
    try{
      await window.emailjs.send(EMAILJS_SERVICE_ID, templateId, params);
      return { ok:true };
    }catch(err){
      console.error('EmailJS send failed', err);
      return { ok:false, reason: err?.message || String(err) };
    }
  }

  window.emailNotify = {
    sendReceived: (toEmail, data) => send('received', toEmail, data),
    sendPending:  (toEmail, data) => send('pending',  toEmail, data),
    sendComplete: (toEmail, data) => send('complete', toEmail, data),
    isConfigured: configured
  };
})();
