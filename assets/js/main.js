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

  // About media: gallery image carousel
  const imgCarousel = document.querySelector('.about .img-carousel');
  if (imgCarousel){
    const track = imgCarousel.querySelector('.icar-track');
    const prev = imgCarousel.querySelector('.icar-prev');
    const next = imgCarousel.querySelector('.icar-next');
    const autoMs = parseInt(imgCarousel.getAttribute('data-auto')||'0',10);
    let index = 0; let slides = [];

    function renderDots(){
      let dots = imgCarousel.querySelector('.icar-dots');
      if (!dots){
        dots = document.createElement('div'); dots.className = 'icar-dots';
        imgCarousel.appendChild(dots);
      }
      dots.innerHTML = '';
      slides.forEach((_,i)=>{
        const d = document.createElement('div');
        d.className = 'icar-dot' + (i===index?' active':'');
        d.addEventListener('click', ()=>go(i));
        dots.appendChild(d);
      });
    }

    function go(i){
      if (!slides.length || !track) return;
      index = (i + slides.length) % slides.length;
      const target = slides[index];
      track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
      renderDots();
    }

    function populate(items){
      if (!track || !Array.isArray(items)) return;
      const html = items.map(it=>{
        const url = it.imageUrl || it.url || '';
        if (!url) return '';
        return `<div class="icar-slide"><img src="${url}" alt="Gallery image" loading="lazy"/></div>`;
      }).join('');
      if (!html){ return; }
      track.innerHTML = html;
      slides = Array.from(track.querySelectorAll('.icar-slide'));
      index = 0; go(0);
    }

    // Fetch gallery images (latest first)
    function fetchGallery(){
      const db = window.fb && window.fb.db;
      if (!db) return;
      db.collection('gallery')
        .orderBy('createdAt','desc')
        .limit(20)
        .get()
        .then(snap=>{
          const items = snap.docs.map(d=>({ id:d.id, ...d.data() }));
          populate(items);
        })
        .catch(console.error);
    }
    if (window.fb && window.fb.db) fetchGallery();
    else window.addEventListener('fb-ready', fetchGallery, { once:true });

    prev && prev.addEventListener('click', ()=>go(index-1));
    next && next.addEventListener('click', ()=>go(index+1));
    if (autoMs){ setInterval(()=>go(index+1), autoMs); }

    // Basic touch swipe
    let startX = 0, isDown = false;
    track && track.addEventListener('touchstart', (e)=>{ isDown=true; startX = e.touches[0].clientX; }, {passive:true});
    track && track.addEventListener('touchend', (e)=>{ if(!isDown) return; isDown=false; const dx = (e.changedTouches[0].clientX - startX); if (Math.abs(dx) > 40){ dx<0 ? go(index+1) : go(index-1); } }, {passive:true});
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

  // Enhanced scroll animations
  const animatedEls = document.querySelectorAll('.animate-on-scroll');
  if ('IntersectionObserver' in window && animatedEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedEls.forEach(el => {
      observer.observe(el);
    });
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

  // FAQ accordion
  const faqButtons = document.querySelectorAll('.faq .faq-q');
  if (faqButtons && faqButtons.length){
    faqButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const item = btn.closest('.faq-item');
        if (!item) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        item.classList.toggle('open', !expanded);
      });
    });
  }

  // Testimonials carousel (populated by real reviews if available)
  const carousel = document.querySelector('.testimonials .carousel');
  if (carousel){
    const track = carousel.querySelector('.carousel-track');
    let cards = carousel.querySelectorAll('.tcard');
    const prev = carousel.querySelector('.carousel-nav.prev');
    const next = carousel.querySelector('.carousel-nav.next');
    let index = 0;

    function go(i){
      if (!track || !cards.length) return;
      index = (i + cards.length) % cards.length;
      const target = cards[index];
      track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }

    function sanitize(t){ return String(t||'').replace(/[<>&]/g,''); }
    function stars(n){
      const full = '★★★★★'.slice(0, Math.max(0, Math.min(5, Number(n)||0)));
      const empty = '☆☆☆☆☆'.slice(0, 5 - full.length);
      return `${full}${empty}`;
    }
    function renderReviews(items){
      if (!track) return;
      if (!items || !items.length) return; // keep existing fallback
      const html = items.map(r => `
        <article class="tcard">
          <div class="rating" aria-label="Rating ${sanitize(r.rating)} out of 5">${stars(r.rating)}</div>
          <p>“${sanitize(r.comment)}”</p>
          <div class="tmeta">— ${sanitize(r.name||'Anonymous')}</div>
        </article>
      `).join('');
      track.innerHTML = html;
      cards = track.querySelectorAll('.tcard');
      index = 0;
      go(0);
    }

    // Fetch latest reviews for homepage (simple order by date to avoid index issues)
    function fetchReviews(){
      const db = window.fb && window.fb.db;
      if (!db) return;
      db.collection('reviews')
        .orderBy('createdAt','desc')
        .limit(10)
        .get()
        .then(snap => {
          const items = snap.docs.map(d => ({ id:d.id, ...d.data() }))
            .filter(r => (r.comment||'').trim().length >= 5);
          renderReviews(items);
        })
        .catch(console.error);
    }

    if (window.fb && window.fb.db) fetchReviews();
    else window.addEventListener('fb-ready', fetchReviews, { once: true });

    prev && prev.addEventListener('click', ()=>go(index-1));
    next && next.addEventListener('click', ()=>go(index+1));
    const auto = parseInt(carousel.getAttribute('data-auto')||'0',10);
    if (auto){
      setInterval(()=>go(index+1), auto);
    }
  }
// Typing animation
  const typingTextEl = document.getElementById('typing-text');
  if (typingTextEl) {
    const words = ["Services", "Repairs", "Installations", "Solutions"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      typingTextEl.textContent = currentWord.substring(0, charIndex);

      let typeSpeed = isDeleting ? 100 : 200;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000; // Pause at end of word
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500; // Pause before typing new word
      }

      setTimeout(type, typeSpeed);
    }

    type();
  }
})();
