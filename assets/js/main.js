// Global UI behaviors
(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', ()=>{
      nav.classList.toggle('open');
    });
  }

  // Scroll reveal using IntersectionObserver
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      })
    },{threshold:0.15});
    revealEls.forEach(el=>io.observe(el));
  } else {
    // Fallback: show immediately
    revealEls.forEach(el=>el.classList.add('in-view'));
  }

  // Services: show first image from category as background thumbnail
  const serviceCards = document.querySelectorAll('.services .card[data-category]');
  if (serviceCards.length){
    function normalize(val){
      return String(val || '')
        .toLowerCase()
        .replace(/\s+/g,'-')
        .replace(/[^a-z0-9\-]/g,'');
    }
    function matchesCategory(item, cat){
      const c1 = normalize(item.category);
      const tags = Array.isArray(item.tags) ? item.tags.map(normalize) : [];
      const cats = Array.isArray(item.categories) ? item.categories.map(normalize) : [];
      return c1 === cat || tags.includes(cat) || cats.includes(cat);
    }

    function applyBackgrounds(items){
      serviceCards.forEach(card=>{
        const cat = card.getAttribute('data-category');
        if (!cat) return;
        const found = items.find(it => matchesCategory(it, cat));
        if (found && found.imageUrl){
          card.style.backgroundImage = `url('${found.imageUrl}')`;
          card.classList.add('bg-thumb');
        }
      });
    }

    const db = window.fb && window.fb.db;
    if (db){
      db.collection('gallery')
        .orderBy('createdAt','desc')
        .limit(60)
        .get()
        .then(snap=>{
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          applyBackgrounds(items);
        })
        .catch(console.error);
    } else {
      // If Firebase not ready yet, wait for it
      window.addEventListener('fb-ready', ()=>{
        const db2 = window.fb && window.fb.db;
        if (!db2) return;
        db2.collection('gallery')
          .orderBy('createdAt','desc')
          .limit(60)
          .get()
          .then(snap=>{
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            applyBackgrounds(items);
          })
          .catch(console.error);
      }, { once: true });
    }
  }
})();
