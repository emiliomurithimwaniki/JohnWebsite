(function(){
  const list = document.getElementById('reviewsList');
  const form = document.getElementById('reviewForm');
  const msg = document.getElementById('reviewMsg');
  if (!list || !form) return;

  function stars(n){ return '★★★★★'.slice(0,n) + '☆☆☆☆☆'.slice(0,5-n); }

  function renderItem(r){
    const div = document.createElement('div');
    div.className = 'review-item';
    const safeName = (r.name||'Anonymous').replace(/[<>&]/g,'');
    const safeComment = (r.comment||'').replace(/[<>&]/g,'');
    div.innerHTML = `
      <div class="rating" aria-label="Rating ${r.rating||0} out of 5">${stars(Number(r.rating||0))}</div>
      <strong>${safeName}</strong>
      <p>${safeComment}</p>
    `;
    return div;
  }

  function render(listData){
    list.innerHTML = '';
    if (!listData.length){ list.innerHTML = '<p>No reviews yet.</p>'; return; }
    const frag = document.createDocumentFragment();
    listData.forEach(r => frag.appendChild(renderItem(r)));
    list.appendChild(frag);
  }

  function start(){
    const db = window.fb && window.fb.db;
    if (!db) return;
    db.collection('reviews').orderBy('createdAt','desc').onSnapshot(snap => {
      const items = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      render(items);
    }, err => {
      console.error(err); list.innerHTML = '<p>Failed to load reviews.</p>';
    });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('rName').value.trim();
      const rating = Number(document.getElementById('rRating').value);
      const comment = document.getElementById('rComment').value.trim();

      if (name.length < 2){ msg.textContent = 'Name is too short.'; return; }
      if (!(rating>=1 && rating<=5)){ msg.textContent = 'Select a rating.'; return; }
      if (comment.length < 5){ msg.textContent = 'Comment is too short.'; return; }

      msg.textContent = 'Submitting...';
      try{
        await db.collection('reviews').add({ name, rating, comment, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        form.reset();
        msg.textContent = 'Thanks for your review!';
      }catch(err){
        msg.textContent = err.message || 'Failed to submit review';
      }
    });
  }

  if (window.fb && window.fb.db) start();
  else window.addEventListener('fb-ready', start, { once: true });
})();
