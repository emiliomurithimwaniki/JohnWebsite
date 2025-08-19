(function(){
  const form = document.getElementById('quoteForm');
  const msg = document.getElementById('quoteMsg');
  if (!form) return;

  function wire(db){
    function isEmail(v){ return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(v); }
    function isPhone(v){ return /^(\+\d{7,15}|\d{7,15})$/.test(v.replace(/\s|-/g,'')); }

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('qName').value.trim();
      const contact = document.getElementById('qContact').value.trim();
      const service = document.getElementById('qService').value;
      const description = document.getElementById('qDesc').value.trim();

      if (name.length < 2){ msg.textContent = 'Please enter your full name.'; return; }
      if (!(isEmail(contact) || isPhone(contact))){ msg.textContent = 'Enter a valid phone or email.'; return; }
      if (!service){ msg.textContent = 'Select a service.'; return; }
      if (description.length < 5){ msg.textContent = 'Please describe the request.'; return; }
      const btn = form.querySelector('button[type="submit"]');
      if (btn){ btn.disabled = true; btn.textContent = 'Submitting...'; }
      msg.textContent = '';
      try{
        await db.collection('orders').add({ name, contact, service, description, status:'unattended', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        form.reset();
        if (btn){ btn.disabled = false; btn.textContent = 'Submit Request'; }
        msg.textContent = 'Request submitted. We will contact you shortly.';
        // Fire-and-forget email notification (order received)
        try{
          if (window.emailNotify && window.emailNotify.sendReceived && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(contact)){
            window.emailNotify.sendReceived(contact, {
              customer_name: name,
              service: service,
              description: description
            });
          }
        }catch(e){ console.warn('Email notify (received) failed:', e); }
      }catch(err){
        console.error('Quote submit failed:', err);
        if (btn){ btn.disabled = false; btn.textContent = 'Submit Request'; }
        let readable = err && (err.message || err.code) || 'Failed to submit request';
        if (/Missing or insufficient permissions|permission-denied/i.test(readable)){
          readable = 'Submission blocked by database rules (permission denied). Please enable writes to the "orders" collection for unauthenticated users or this website.';
        }
        const fallback = ' If the issue persists, email us at Johnplumber011@gmail.com.';
        msg.textContent = readable + fallback;
      }
    });
  }

  // If Firebase is ready now, wire immediately; otherwise wait for fb-ready event
  if (window.fb && window.fb.db){
    wire(window.fb.db);
  } else {
    if (msg) msg.textContent = 'Preparing form...';
    window.addEventListener('fb-ready', ()=>{
      if (window.fb && window.fb.db){
        msg.textContent = '';
        wire(window.fb.db);
      } else {
        msg.textContent = 'Unable to submit right now. Database not ready.';
      }
    }, { once: true });
  }

})();
