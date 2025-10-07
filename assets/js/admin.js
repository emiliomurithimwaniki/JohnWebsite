(function(){
  function start(){
    const fb = window.fb;
    if (!fb) return;

    // Default Cloudinary credentials (update these with your real values)
    const CLOUDINARY_DEFAULTS = {
      cloudName: 'dgugpjs3y',
      preset: 'johnplumber'
    };

    // Auth guard
    fb.onAuth(async user => {
      if (!user){ location.href = 'admin-login.html'; return; }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn){ logoutBtn.addEventListener('click', ()=> fb.authSignOut()); }

    // Tabs: show one admin section at a time via hash
    (function initTabs(){
      const sections = Array.from(document.querySelectorAll('.tab-section'));
      if (!sections.length) return; // nothing to do
      const menuLinks = Array.from(document.querySelectorAll('.admin-menu a[href^="#"], .admin-nav a[href^="#"]'));

      function normalizeHash(h){
        if (!h) return '#upload';
        if (h.charAt(0) !== '#') return '#' + h;
        return h;
      }

      function activate(hash){
        const h = normalizeHash(hash);
        const id = h.slice(1);
        // toggle sections
        sections.forEach(sec => {
          if (sec.id === id) sec.classList.add('active');
          else sec.classList.remove('active');
        });
        // toggle link active state
        menuLinks.forEach(a => {
          const href = a.getAttribute('href');
          if (!href || href.charAt(0) !== '#') return;
          if (normalizeHash(href) === h) a.classList.add('active');
          else a.classList.remove('active');
        });
      }

      // click handling (allow default anchor behavior to set hash)
      menuLinks.forEach(a => {
        a.addEventListener('click', (e)=>{
          const href = a.getAttribute('href') || '';
          if (href.startsWith('#')){
            // allow hash change, then activate when event fires
            // but also activate immediately for snappier UX
            activate(href);
          }
        });
      });

      window.addEventListener('hashchange', ()=> activate(location.hash));
      // initial
      activate(location.hash || '#upload');
    })();

    // Mobile sidebar toggle (off-canvas)
    (function initMobileSidebar(){
      const toggle = document.getElementById('adminMenuToggle');
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('adminOverlay');
      if (!toggle || !sidebar || !overlay) return;

      function open(){
        sidebar.classList.add('open');
        sidebar.setAttribute('aria-hidden','false');
        overlay.classList.add('show');
        overlay.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded','true');
      }
      function close(){
        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden','true');
        overlay.classList.remove('show');
        overlay.setAttribute('hidden','');
        toggle.setAttribute('aria-expanded','false');
      }
      function toggleMenu(){
        if (sidebar.classList.contains('open')) close(); else open();
      }

      toggle.addEventListener('click', toggleMenu);
      overlay.addEventListener('click', close);
      document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') close(); });
      // Close after selecting a menu link (mobile)
      sidebar.addEventListener('click', (e)=>{
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (a) close();
      });
    })();

    // EmailJS Test Panel (?test=1)
    try{
      const params = new URLSearchParams(location.search);
      if (params.get('test') === '1'){
        const panel = document.createElement('div');
        panel.style.cssText = 'margin:16px;padding:12px;border:1px dashed #b3c5ff;border-radius:8px;background:#f8faff;';
        panel.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong>EmailJS Test Panel</strong>
            <small class="muted">Origin: ${location.origin}</small>
          </div>
          <div style="margin-top:8px;font-size:13px;">
            Status: <code id="ejStatus">checking...</code>
          </div>
          <form id="ejForm" style="display:grid;grid-template-columns:1fr 150px 120px;gap:8px;align-items:center;margin-top:8px;">
            <input id="ejTo" type="email" placeholder="to_email (recipient)" required style="padding:8px 10px;border:1px solid #d7dcef;border-radius:6px;" />
            <select id="ejType" style="padding:8px 10px;border:1px solid #d7dcef;border-radius:6px;">
              <option value="received">Received</option>
              <option value="pending">Processing</option>
              <option value="complete">Completed</option>
            </select>
            <button class="btn small" type="submit">Send Test</button>
          </form>
          <div id="ejMsg" class="muted" style="margin-top:6px;"></div>
        `;
        const target = document.querySelector('main') || document.body;
        target.prepend(panel);
        const ejStatus = panel.querySelector('#ejStatus');
        const ejForm = panel.querySelector('#ejForm');
        const ejTo = panel.querySelector('#ejTo');
        const ejType = panel.querySelector('#ejType');
        const ejMsg = panel.querySelector('#ejMsg');
        const configured = !!(window.emailNotify && window.emailNotify.isConfigured && window.emailNotify.isConfigured());
        ejStatus.textContent = configured ? 'configured' : 'NOT configured';
        ejStatus.style.color = configured ? '#147300' : '#b00020';

        ejForm.addEventListener('submit', async (e)=>{
          e.preventDefault();
          ejMsg.textContent = 'Sending...';
          const to = ejTo.value.trim();
          const type = ejType.value;
          const vars = {
            customer_name: 'Test User',
            service: 'Test Service',
            description: 'This is a test email sent from the admin test panel.'
          };
          try{
            if (!window.emailNotify || !window.emailNotify.isConfigured || !window.emailNotify.isConfigured()){
              ejMsg.textContent = 'EmailJS not configured. Check keys, templates and allowed origins.';
              return;
            }
            let res;
            if (type === 'received' && window.emailNotify.sendReceived){
              res = await window.emailNotify.sendReceived(to, vars);
            } else if (type === 'pending' && window.emailNotify.sendPending){
              res = await window.emailNotify.sendPending(to, vars);
            } else if (type === 'complete' && window.emailNotify.sendComplete){
              res = await window.emailNotify.sendComplete(to, vars);
            } else {
              ejMsg.textContent = 'Selected email type is not available.';
              return;
            }
            ejMsg.textContent = res && res.ok ? 'Email sent. Check EmailJS → Email History.' : ('Failed: ' + (res && res.reason || 'Unknown error'));
          }catch(err){
            ejMsg.textContent = 'Failed: ' + (err && err.message || String(err));
          }
        });
      }
    }catch{}

    // Upload gallery
    const uploadForm = document.getElementById('uploadForm');
    const uploadMsg = document.getElementById('uploadMsg');
    if (uploadForm){
      uploadForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const title = document.getElementById('gTitle').value.trim();
        const description = document.getElementById('gDesc').value.trim();
        const category = document.getElementById('gCategory')?.value.trim();
        const tagsRaw = document.getElementById('gTags')?.value || '';
        const tags = tagsRaw.split(',').map(s=>s.trim()).filter(Boolean);
        const urlInput = document.getElementById('gUrl').value.trim();
        if (!title || !description){ uploadMsg.textContent = 'Enter title and description.'; return; }
        if (!category){ uploadMsg.textContent = 'Please select a category.'; return; }

        // Build list of image URLs to save
        let urls = [];
        if (typeof captureQueue !== 'undefined' && captureQueue.length){
          urls = [...captureQueue];
        } else if (urlInput){
          try{ new URL(urlInput); }catch{ uploadMsg.textContent = 'Invalid Image URL.'; return; }
          urls = [urlInput];
        } else {
          uploadMsg.textContent = 'Add at least one photo: capture/confirm or provide an Image URL.';
          return;
        }

        uploadMsg.textContent = `Saving ${urls.length} photo${urls.length>1?'s':''}...`;
        try{
          const batchAdds = urls.map(u => fb.db.collection('gallery').add({
            title,
            description,
            imageUrl: u,
            category,
            tags,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }));
          await Promise.all(batchAdds);
          // Reset form and queue
          uploadForm.reset();
          if (typeof captureQueue !== 'undefined'){ captureQueue.length = 0; }
          if (typeof renderQueue === 'function') renderQueue();
          if (metaFields) metaFields.style.display = 'none';
          if (cameraStatus) cameraStatus.textContent = '';
          if (cameraPreview){ cameraPreview.removeAttribute('src'); cameraPreview.style.display='none'; }
          uploadMsg.textContent = `Uploaded ${urls.length} photo${urls.length>1?'s':''}.`;
        }catch(err){
          uploadMsg.textContent = err.message || 'Save failed';
        }
      });
    }

    // Cloudinary quick upload (with drag & drop and progress)
    const cloudUploadBtn = document.getElementById('cloudUploadBtn');
    const copyGUrlBtn = document.getElementById('copyGUrlBtn');
    const cloudUploadMsg = document.getElementById('cloudUploadMsg');
    const cloudDropzone = document.getElementById('cloudDropzone');
    const cloudProgress = document.getElementById('cloudProgress');
    const openCameraBtn = document.getElementById('openCameraBtn');
    const cameraInput = document.getElementById('cameraInput');
    const pickFileBtn = document.getElementById('pickFileBtn');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraStatus = document.getElementById('cameraStatus');
    const captureCtas = document.getElementById('captureCtas');
    const confirmCaptureBtn = document.getElementById('confirmCaptureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const photoQueueEl = document.getElementById('photoQueue');
    const metaFields = document.getElementById('metaFields');
    const queueCount = document.getElementById('queueCount');
    // Modal elements
    const cloudModal = document.getElementById('cloudModal');
    const openCloudModalBtn = document.getElementById('openCloudModalBtn');
    const closeCloudModalBtn = document.getElementById('closeCloudModalBtn');

    function openCloudModal(){
      if (!cloudModal) return;
      cloudModal.classList.add('show');
      cloudModal.setAttribute('aria-hidden','false');
    }
    function closeCloudModal(){
      if (!cloudModal) return;
      cloudModal.classList.remove('show');
      cloudModal.setAttribute('aria-hidden','true');
    }
    if (openCloudModalBtn) openCloudModalBtn.addEventListener('click', openCloudModal);
    if (closeCloudModalBtn) closeCloudModalBtn.addEventListener('click', closeCloudModal);
    if (cloudModal){
      cloudModal.addEventListener('click', (e)=>{
        const t = e.target;
        if (t && t.classList && t.classList.contains('modal-overlay')) closeCloudModal();
      });
      document.addEventListener('keydown', (e)=>{
        if (e.key === 'Escape') closeCloudModal();
      });
    }

    function setUrlAndCopy(url){
      const gUrl = document.getElementById('gUrl');
      if (gUrl) gUrl.value = url;
      if (cloudUploadMsg) cloudUploadMsg.textContent = 'Uploaded. URL copied to clipboard.';
      if (navigator.clipboard && url){
        navigator.clipboard.writeText(url).catch(()=>{});
      }
    }

    function uploadToCloudinary(file, cloudName, preset){
      return new Promise((resolve, reject)=>{
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', preset);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (e)=>{
          if (e.lengthComputable && cloudProgress){
            const pct = Math.round((e.loaded / e.total) * 100);
            cloudProgress.textContent = `Progress: ${pct}%`;
          }
        };
        xhr.onerror = ()=> {
          const msg = `Network error during upload`;
          reject(new Error(msg));
        };
        xhr.onload = ()=>{
          const status = xhr.status;
          const body = (xhr.responseText || '').slice(0, 500);
          if (status >= 200 && status < 300){
            try{
              const res = JSON.parse(xhr.responseText || '{}');
              const url = res.secure_url || res.url;
              if (!url) return reject(new Error('Upload succeeded but URL missing in response'));
              resolve(url);
            }catch(err){
              reject(new Error(`Failed to parse response: ${err?.message || err}`));
            }
          } else {
            // Try to parse Cloudinary error
            let reason = '';
            try{
              const j = JSON.parse(xhr.responseText || '{}');
              reason = j.error?.message || '';
            }catch{}
            let hint = '';
            if (status === 401){
              hint = '\nHint: Enable Unsigned uploading in Cloudinary (Settings → Security), confirm cloud name is correct, and ensure the preset is Unsigned.';
            }
            reject(new Error(`Upload failed (HTTP ${status}) ${reason ? '- ' + reason : ''}${hint}\n${body}`));
          }
        };
        xhr.send(form);
      });
    }

    function getCloudCreds(){
      const cloudName = (document.getElementById('cloudName')?.value || '').trim();
      const preset = (document.getElementById('cloudPreset')?.value || '').trim();
      return { cloudName, preset };
    }

    // Prefill Cloudinary fields from localStorage and persist on change
    const cloudNameEl = document.getElementById('cloudName');
    const cloudPresetEl = document.getElementById('cloudPreset');
    try{
      const saved = JSON.parse(localStorage.getItem('cloudinaryCreds') || '{}');
      // Prefer saved, otherwise fall back to defaults
      const cn = saved.cloudName || CLOUDINARY_DEFAULTS.cloudName || '';
      const pr = saved.preset || CLOUDINARY_DEFAULTS.preset || '';
      if (cloudNameEl) cloudNameEl.value = cn;
      if (cloudPresetEl) cloudPresetEl.value = pr;
      // Persist the chosen values so future loads use them
      localStorage.setItem('cloudinaryCreds', JSON.stringify({ cloudName: cn, preset: pr }));
    }catch{}
    function saveCloudCreds(){
      try{
        const creds = getCloudCreds();
        localStorage.setItem('cloudinaryCreds', JSON.stringify(creds));
      }catch{}
    }
    if (cloudNameEl) cloudNameEl.addEventListener('change', saveCloudCreds);
    if (cloudPresetEl) cloudPresetEl.addEventListener('change', saveCloudCreds);

    if (cloudUploadBtn){
      cloudUploadBtn.addEventListener('click', async ()=>{
        const { cloudName, preset } = getCloudCreds();
        if (!cloudName || !preset){
          cloudUploadMsg.textContent = 'Provide Cloud name and Unsigned preset.';
          return;
        }
        const picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*';
        // reset value each time to ensure change fires even if same file chosen
        picker.value = '';
        picker.onchange = async (ev)=>{
          const file = ev.target.files && ev.target.files[0];
          if (!file){ return; }
          cloudUploadMsg.textContent = 'Uploading to Cloudinary...';
          try{
            const url = await uploadToCloudinary(file, cloudName, preset);
            setUrlAndCopy(url);
          }catch(err){
            cloudUploadMsg.textContent = (err && err.message) ? err.message : 'Cloudinary upload failed';
          }
        };
        picker.click();
      });
    }

    if (cloudDropzone){
      ['dragenter','dragover'].forEach(ev=> cloudDropzone.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); cloudDropzone.classList.add('dragover'); }));
      ;['dragleave','dragend','drop'].forEach(ev=> cloudDropzone.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); cloudDropzone.classList.remove('dragover'); }));
      cloudDropzone.addEventListener('drop', async (e)=>{
        const { cloudName, preset } = getCloudCreds();
        if (!cloudName || !preset){ cloudUploadMsg.textContent = 'Enter Cloud name and unsigned upload preset.'; return; }
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        cloudUploadMsg.textContent = 'Uploading to Cloudinary...';
        try{
          const url = await uploadToCloudinary(file, cloudName, preset);
          setUrlAndCopy(url);
        }catch(err){
          cloudUploadMsg.textContent = (err && err.message) ? err.message : 'Cloudinary upload failed';
        }
      });
    }

    // Capture-first flow state
    const captureQueue = [];
    let pendingFile = null;

    function renderQueue(){
      if (!photoQueueEl) return;
      if (!captureQueue.length){ photoQueueEl.innerHTML = '<small class="muted">No photos queued yet.</small>'; return; }
      photoQueueEl.innerHTML = captureQueue.map((u,i)=>`<div class="qitem"><img src="${u}" alt="q${i}"/><button type="button" data-i="${i}" class="qremove btn btn-outline small">Remove</button></div>`).join('');
      photoQueueEl.querySelectorAll('.qremove').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const i = Number(btn.getAttribute('data-i'));
          if (!Number.isNaN(i)){
            captureQueue.splice(i,1);
            renderQueue();
          }
        });
      });
      // Show meta fields when at least 1 photo is queued
      if (metaFields && captureQueue.length>0){ metaFields.style.display = ''; }
      if (queueCount){ queueCount.textContent = String(captureQueue.length); }
    }

    function setPendingFile(file){
      pendingFile = file || null;
      if (cameraPreview){
        if (pendingFile){
          try{ cameraPreview.src = URL.createObjectURL(pendingFile); cameraPreview.style.display='block'; }catch{}
        } else {
          cameraPreview.removeAttribute('src');
          cameraPreview.style.display='none';
        }
      }
      if (captureCtas) captureCtas.style.display = pendingFile ? '' : 'none';
      if (cameraStatus) cameraStatus.textContent = pendingFile ? 'Review the preview, then confirm or retake.' : '';
    }

    async function confirmPending(){
      if (!pendingFile) return;
      const { cloudName, preset } = getCloudCreds();
      const targetMsg = cloudUploadMsg || uploadMsg;
      if (!cloudName || !preset){
        if (targetMsg) targetMsg.textContent = 'Provide Cloud name and Unsigned preset before confirming.';
        return;
      }
      if (cameraStatus) cameraStatus.textContent = 'Uploading...';
      try{
        const url = await uploadToCloudinary(pendingFile, cloudName, preset);
        captureQueue.push(url);
        renderQueue();
        setPendingFile(null);
        if (cameraStatus) cameraStatus.textContent = 'Added to queue.';
        // also reflect in Image URL with last item for convenience
        setUrlAndCopy(url);
      }catch(err){
        if (cameraStatus) cameraStatus.textContent = (err && err.message) ? err.message : 'Upload failed';
      }
    }

    // Open camera
    if (openCameraBtn && cameraInput){
      openCameraBtn.addEventListener('click', ()=>{ cameraInput.value=''; cameraInput.click(); });
      cameraInput.addEventListener('change', (e)=>{
        const f = e.target && e.target.files && e.target.files[0];
        if (f) setPendingFile(f);
      });
    }
    // Pick from files (no immediate upload)
    if (pickFileBtn){
      pickFileBtn.addEventListener('click', ()=>{
        const input = document.createElement('input');
        input.type='file'; input.accept='image/*';
        input.addEventListener('change', ev=>{
          const f = ev.target && ev.target.files && ev.target.files[0];
          if (f) setPendingFile(f);
        });
        input.click();
      });
    }
    if (confirmCaptureBtn) confirmCaptureBtn.addEventListener('click', confirmPending);
    if (retakeBtn) retakeBtn.addEventListener('click', ()=> setPendingFile(null));
    renderQueue();

    if (copyGUrlBtn){
      copyGUrlBtn.addEventListener('click', async ()=>{
        const val = document.getElementById('gUrl')?.value || '';
        if (!val){ cloudUploadMsg.textContent = 'Nothing to copy yet.'; return; }
        try{
          await navigator.clipboard.writeText(val);
          cloudUploadMsg.textContent = 'Copied to clipboard.';
        }catch{
          cloudUploadMsg.textContent = 'Copy failed. Manually select and copy the URL.';
        }
      });
    }

    // Manage Gallery: list, edit, delete
    const adminGallery = document.getElementById('adminGallery');
    const editModal = document.getElementById('editGalleryModal');
    const closeEditGalleryModalBtn = document.getElementById('closeEditGalleryModalBtn');
    const saveGalleryEditBtn = document.getElementById('saveGalleryEditBtn');
    const egId = document.getElementById('egId');
    const egTitle = document.getElementById('egTitle');
    const egDesc = document.getElementById('egDesc');
    const egCategory = document.getElementById('egCategory');
    const egTags = document.getElementById('egTags');
    const egUrl = document.getElementById('egUrl');

    function openEditModal(item){
      if (!editModal) return;
      egId.value = item.id || '';
      egTitle.value = item.title || '';
      egDesc.value = item.description || '';
      egCategory.value = item.category || '';
      egTags.value = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
      egUrl.value = item.url || item.imageUrl || '';
      editModal.classList.add('show');
      editModal.setAttribute('aria-hidden','false');
    }
    function closeEditModal(){
      if (!editModal) return;
      editModal.classList.remove('show');
      editModal.setAttribute('aria-hidden','true');
    }
    if (closeEditGalleryModalBtn) closeEditGalleryModalBtn.addEventListener('click', closeEditModal);
    if (editModal){
      editModal.addEventListener('click', (e)=>{
        if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) closeEditModal();
      });
      document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeEditModal(); });
    }

    function renderAdminGalleryList(items){
      if (!adminGallery) return;
      if (!items.length){ adminGallery.innerHTML = '<p class="muted">No gallery items found.</p>'; return; }
      const rows = items.map(it => {
        const thumb = it.url || it.imageUrl || '';
        const safeTitle = (it.title || '').replace(/</g,'&lt;');
        const safeCat = (it.category || '').replace(/</g,'&lt;');
        return `
          <div class="row" style="display:grid;grid-template-columns:64px 1fr auto auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #eef1f5">
            <img src="${thumb}" alt="thumb" style="width:64px;height:48px;object-fit:cover;border-radius:6px;background:#f3f4f6" onerror="this.style.display='none'" />
            <div>
              <div style="font-weight:600">${safeTitle || '(Untitled)'} </div>
              <div class="muted" style="font-size:12px">${safeCat}</div>
            </div>
            <button class="btn small" data-action="edit" data-id="${it.id}">Edit</button>
            <button class="btn small btn-outline" data-action="delete" data-id="${it.id}">Delete</button>
          </div>
        `;
      }).join('');
      adminGallery.innerHTML = rows;
    }

    // Subscribe to Firestore gallery for admin manage list
    if (adminGallery && fb && fb.db){
      fb.db.collection('gallery').orderBy('createdAt','desc').onSnapshot(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAdminGalleryList(items);
      });
      adminGallery.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (!id || !action) return;
        const ref = fb.db.collection('gallery').doc(id);
        if (action === 'edit'){
          const doc = await ref.get();
          if (doc.exists){ openEditModal({ id, ...doc.data() }); }
          return;
        }
        if (action === 'delete'){
          const ok = confirm('Delete this photo? This cannot be undone.');
          if (!ok) return;
          try{
            await ref.delete();
          }catch(err){ alert('Delete failed: ' + (err?.message || err)); }
        }
      });
    }

    if (saveGalleryEditBtn){
      saveGalleryEditBtn.addEventListener('click', async ()=>{
        const id = egId.value.trim();
        if (!id) return closeEditModal();
        const payload = {
          title: egTitle.value.trim(),
          description: egDesc.value.trim(),
          category: egCategory.value.trim(),
          url: egUrl.value.trim()
        };
        const tags = egTags.value.trim();
        if (tags){ payload.tags = tags.split(',').map(t=>t.trim()).filter(Boolean); }
        try{
          await fb.db.collection('gallery').doc(id).update(payload);
          closeEditModal();
        }catch(err){ alert('Update failed: ' + (err?.message || err)); }
      });
    }
    // Orders list
    const ordersList = document.getElementById('adminOrders');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
    const omName = document.getElementById('omName');
    const omContact = document.getElementById('omContact');
    const omService = document.getElementById('omService');
    const omDate = document.getElementById('omDate');
    const omDesc = document.getElementById('omDesc');
    const omStatus = document.getElementById('omStatus');
    const omSetUnattended = document.getElementById('omSetUnattended');
    const omSetPending = document.getElementById('omSetPending');
    const omSetComplete = document.getElementById('omSetComplete');

    function openOrderModal(){ if (orderModal){ orderModal.classList.add('show'); orderModal.setAttribute('aria-hidden','false'); } }
    function closeOrderModal(){ if (orderModal){ orderModal.classList.remove('show'); orderModal.setAttribute('aria-hidden','true'); } }
    if (closeOrderModalBtn) closeOrderModalBtn.addEventListener('click', closeOrderModal);
    if (orderModal){
      orderModal.addEventListener('click', (e)=>{ if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) closeOrderModal(); });
      document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeOrderModal(); });
    }

    if (ordersList){
      const header = document.createElement('div');
      header.className = 'row header';
      header.innerHTML = '<div>Name & Contact</div><div>Service</div><div>Date</div><div>Status</div>';
      ordersList.appendChild(header);

      // Loading placeholder
      const loading = document.createElement('div');
      loading.className = 'row';
      loading.innerHTML = '<div class="muted">Loading...</div><div></div><div></div>';
      ordersList.appendChild(loading);

      fb.db.collection('orders').orderBy('createdAt','desc').onSnapshot(snap =>{
        // Clear previous rows except header
        ordersList.querySelectorAll('.row:not(.header)').forEach(el=>el.remove());

        if (snap.empty){
          const empty = document.createElement('div');
          empty.className = 'row';
          empty.innerHTML = '<div class="muted">No orders yet.</div><div></div><div></div><div></div>';
          ordersList.appendChild(empty);
          return;
        }

        snap.forEach(doc =>{
          const d = doc.data();
          const row = document.createElement('div');
          row.className = 'row';
          row.setAttribute('data-id', doc.id);
          // cache useful fields for notifications
          if (d.name) row.setAttribute('data-name', d.name);
          if (d.contact) row.setAttribute('data-contact', d.contact);
          if (d.service) row.setAttribute('data-service', d.service);
          if (d.description) row.setAttribute('data-description', d.description);
          const date = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : '';
          const status = (d.status || 'unattended').toLowerCase();
          const select = `<select class="status-select" data-id="${doc.id}">
              <option value="unattended" ${status==='unattended'?'selected':''}>Unattended</option>
              <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
              <option value="complete" ${status==='complete'?'selected':''}>Complete</option>
            </select>
            <button class="btn btn-outline small view-order" data-id="${doc.id}">View</button>`;
          row.innerHTML = `
            <div><strong>${(d.name||'')}</strong><br><small>${(d.contact||'')}</small></div>
            <div>${(d.service||'')}</div>
            <div>${date}</div>
            <div>${select}</div>
          `;
          ordersList.appendChild(row);
        });
      }, err => {
        console.error('Orders listener error:', err);
        ordersList.querySelectorAll('.row:not(.header)').forEach(el=>el.remove());
        const row = document.createElement('div');
        row.className = 'row';
        let readable = err && (err.message || err.code) || 'Failed to load orders';
        if (/Missing or insufficient permissions|permission-denied/i.test(readable)){
          readable = 'Cannot load orders due to Firestore security rules (permission denied).';
        }
        
        row.innerHTML = `<div class="muted">${readable}</div><div></div><div></div><div></div>`;
        ordersList.appendChild(row);
      });

      // Inline status change
      ordersList.addEventListener('change', async (e)=>{
        const sel = e.target.closest && e.target.closest('select.status-select');
        if (!sel) return;
        const id = sel.getAttribute('data-id');
        const val = sel.value;
        if (!id) return;
        try{
          await fb.db.collection('orders').doc(id).update({ status: val });
          // send email if configured and contact is an email
          const row = ordersList.querySelector(`.row[data-id="${id}"]`);
          const contact = row && row.getAttribute('data-contact');
          const name = row && row.getAttribute('data-name');
          const service = row && row.getAttribute('data-service');
          const description = row && row.getAttribute('data-description');
          const isEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(contact||''));
          if (window.emailNotify && window.emailNotify.isConfigured && window.emailNotify.isConfigured() && isEmail){
            if (val === 'pending' && window.emailNotify.sendPending){
              window.emailNotify.sendPending(contact, { customer_name: name, service, description });
            } else if (val === 'complete' && window.emailNotify.sendComplete){
              window.emailNotify.sendComplete(contact, { customer_name: name, service, description });
            }
          }
        }
        catch(err){ alert('Failed to update status: ' + (err?.message || err)); }
      });

      // View modal open
      ordersList.addEventListener('click', async (e)=>{
        const btn = e.target.closest && e.target.closest('button.view-order');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;
        try{
          const doc = await fb.db.collection('orders').doc(id).get();
          if (!doc.exists) return;
          const d = doc.data();
          if (omName) omName.textContent = d.name || '';
          if (omContact) omContact.textContent = d.contact || '';
          if (omService) omService.textContent = d.service || '';
          if (omDesc) omDesc.textContent = d.description || '';
          if (omDate) omDate.textContent = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : '';
          if (omStatus) omStatus.textContent = (d.status || 'unattended').toUpperCase();
          orderModal.setAttribute('data-id', id);
          openOrderModal();
        }catch(err){ alert('Failed to open order: ' + (err?.message || err)); }
      });

      // Modal status quick actions
      async function setStatus(val){
        const id = orderModal && orderModal.getAttribute('data-id');
        if (!id) return;
        try{
          await fb.db.collection('orders').doc(id).update({ status: val });
          if (omStatus) omStatus.textContent = val.toUpperCase();
          // send email
          const row = ordersList && ordersList.querySelector(`.row[data-id="${id}"]`);
          const contact = row && row.getAttribute('data-contact');
          const name = row && row.getAttribute('data-name');
          const service = row && row.getAttribute('data-service');
          const description = row && row.getAttribute('data-description');
          const isEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(contact||''));
          if (window.emailNotify && window.emailNotify.isConfigured && window.emailNotify.isConfigured() && isEmail){
            if (val === 'pending' && window.emailNotify.sendPending){
              window.emailNotify.sendPending(contact, { customer_name: name, service, description });
            } else if (val === 'complete' && window.emailNotify.sendComplete){
              window.emailNotify.sendComplete(contact, { customer_name: name, service, description });
            }
          }
        }catch(err){ alert('Failed to update status: ' + (err?.message || err)); }
      }
      if (omSetUnattended) omSetUnattended.addEventListener('click', ()=> setStatus('unattended'));
      if (omSetPending) omSetPending.addEventListener('click', ()=> setStatus('pending'));
      if (omSetComplete) omSetComplete.addEventListener('click', ()=> setStatus('complete'));
    }

    // Reviews manage
    const adminReviews = document.getElementById('adminReviews');
    if (adminReviews){
      const header = document.createElement('div');
      header.className = 'row header';
      header.style.gridTemplateColumns = '2fr 1fr 120px';
      header.innerHTML = '<div>Review</div><div>Rating</div><div>Action</div>';
      adminReviews.appendChild(header);

      const renderRow = (id, d)=>{
        const row = document.createElement('div');
        row.className = 'row';
        row.style.gridTemplateColumns = '2fr 1fr 120px';
        row.innerHTML = `<div><strong>${(d.name||'')}</strong><br><small>${(d.comment||'')}</small></div><div>${d.rating||''}</div><div><button class="btn btn-outline small" data-id="${id}">Delete</button></div>`;
        row.querySelector('button').addEventListener('click', async ()=>{
          if (!confirm('Delete this review?')) return;
          try{ await fb.db.collection('reviews').doc(id).delete(); }
          catch(err){ alert(err.message || 'Delete failed'); }
        });
        return row;
      };

      fb.db.collection('reviews').orderBy('createdAt','desc').onSnapshot(snap =>{
        adminReviews.querySelectorAll('.row:not(.header)').forEach(el=>el.remove());
        snap.forEach(doc => adminReviews.appendChild(renderRow(doc.id, doc.data())));
      });
    }
  }

  if (window.fb) start();
  else window.addEventListener('fb-ready', start, { once: true });
})();
