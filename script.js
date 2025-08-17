// John Plumber Plumbing Services - Scripts


// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('primaryNav');
navToggle?.addEventListener('click', () => {
  const opened = nav?.classList.toggle('open');
  navToggle.classList.toggle('open', !!opened);
  navToggle.setAttribute('aria-expanded', String(!!opened));
});

// Smooth close nav on link click (mobile)
nav?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded','false');
  });
});

// Lightbox for gallery
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('#galleryGrid img').forEach(img =>{
  img.addEventListener('click', () =>{
    if (!lightbox) return;
    lightbox.setAttribute('aria-hidden','false');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || 'Gallery image';
    lightboxCaption.textContent = img.dataset.caption || '';
  });
});

lightboxClose?.addEventListener('click', ()=> lightbox?.setAttribute('aria-hidden','true'));
lightbox?.addEventListener('click', (e)=>{
  if (e.target === lightbox) lightbox.setAttribute('aria-hidden','true');
});

document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') lightbox?.setAttribute('aria-hidden','true');
});

// Forms: client-side validation and messaging
function serializeForm(form){
  return [...new FormData(form).entries()].reduce((acc,[k,v])=>{acc[k]=v;return acc;},{});
}

function showMsg(el, text, ok=true){
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#065f46' : '#9b1c1c';
}

// Quote form (supports Formspree)
const quoteForm = document.getElementById('quoteForm');
const quoteMsg = document.getElementById('quoteMsg');
quoteForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.checkValidity()){
    form.reportValidity();
    return;
  }
  // Basic honeypot check
  if (form.querySelector('[name="_gotcha"]').value) return;

  const data = serializeForm(form);

  // Also send via WhatsApp immediately (to avoid popup blockers)
  try {
    const waNumber = '254707047674';
    const waMsg = [
      'New Quote Request - John Plumber',
      `Name: ${data.name || ''}`,
      `Email: ${data.email || ''}`,
      `Phone: ${data.phone || ''}`,
      `Service: ${data.service || ''}`,
      `Preferred Date: ${data.preferred_date || ''}`,
      `Description: ${data.message || ''}`
    ].join('\n');
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;
    window.open(waUrl, '_blank', 'noopener');
  } catch(_) {
    // no-op; WhatsApp open failure shouldn't block email flow
  }

  try{
    // If an action URL is present (Formspree, FormSubmit, etc.), send it; otherwise simulate
    const action = form.getAttribute('action');
    if (action && /^https?:/i.test(action)){
      const res = await fetch(action, { method:'POST', headers:{ 'Accept':'application/json' }, body:new FormData(form) });
      if (res.ok){
        showMsg(quoteMsg, 'Thanks! Your request was sent. We will get back to you shortly.');
        form.reset();
      } else {
        showMsg(quoteMsg, 'There was an issue sending your request. Please email johnkiamati@gmail.com.', false);
      }
    } else {
      showMsg(quoteMsg, 'Thanks! Your request was recorded. We will contact you shortly.');
      form.reset();
    }
  }catch(err){
    showMsg(quoteMsg, 'Network error. Please try again or email us directly.', false);
  }
});

// Booking form (simulate submission + alert)
const bookingForm = document.getElementById('bookingForm');
const bookingMsg = document.getElementById('bookingMsg');
bookingForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.checkValidity()){
    form.reportValidity();
    return;
  }
  if (form.querySelector('[name="company"]').value) return; // honeypot

  const data = serializeForm(form);
  try{
    const action = form.getAttribute('action');
    if (action && /^https?:/i.test(action)){
      const res = await fetch(action, { method:'POST', headers:{ 'Accept':'application/json' }, body:new FormData(form) });
      if (res.ok){
        alert("Booking confirmed – we'll contact you soon!");
        showMsg(bookingMsg, 'Booking confirmed – we\'ll contact you soon!');
        form.reset();
      } else {
        showMsg(bookingMsg, 'There was an issue sending your booking. Please email johnkiamati@gmail.com.', false);
      }
    } else {
      alert("Booking confirmed – we'll contact you soon!");
      showMsg(bookingMsg, 'Booking confirmed – we\'ll contact you soon!');
      form.reset();
    }
  }catch(err){
    showMsg(bookingMsg, 'Network error. Please try again or email us directly.', false);
  }
});

// Back to top button
const backBtn = document.getElementById('backToTop');
window.addEventListener('scroll', ()=>{
  if (window.scrollY > 500) backBtn?.classList.add('show');
  else backBtn?.classList.remove('show');
});
backBtn?.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

// Glass header scroll state + parallax hero
(() => {
  const header = document.querySelector('.header');
  const mediaContainer = document.querySelector('.hero__media');
  let parallaxEl = mediaContainer?.querySelector('img.parallax');

  // Replace image with video
  if (parallaxEl && mediaContainer) {
    const video = document.createElement('video');
    video.src = 'https://assets.mixkit.co/videos/preview/mixkit-plumber-fixing-a-sink-pipe-50492-large.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.className = 'parallax';
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.borderRadius = '18px';
    mediaContainer.innerHTML = ''; // Clear the container
    mediaContainer.appendChild(video);
    parallaxEl = video; // The video is now the parallax element
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;

  if (prefersReduced || !header) return;

  const handleScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    if (parallaxEl) {
      const scrollY = window.scrollY;
      parallaxEl.style.transform = `translateY(${scrollY * 0.3}px)`;
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });
})();

// Auto-close mobile nav on link click
document.querySelectorAll('.nav__link').forEach(a => {
  a.addEventListener('click', () => {
    const nav = document.querySelector('.nav');
    if (nav?.classList.contains('open')) {
      nav.classList.remove('open');
      navToggle?.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

// Scroll spy for active nav link
(() => {
  const links = Array.from(document.querySelectorAll('.nav__link'));
  const map = new Map();
  links.forEach(l => {
    const id = l.getAttribute('href')?.replace('#','');
    if (!id) return;
    const sec = id === 'home' ? document.querySelector('.header') : document.getElementById(id);
    if (sec) map.set(sec, l);
  });
  if (!map.size) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = map.get(entry.target);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('nav__link--active'));
        link.classList.add('nav__link--active');
      }
    });
  }, { root: null, threshold: 0.5 });
  map.forEach((_, sec) => observer.observe(sec));
})();

// Reveal on scroll animations (IntersectionObserver)
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Immediately show content for accessibility
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

// Dynamic year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Theme toggle (light/dark)
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const key = 'theme-preference';
  const getSystem = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const apply = (mode) => {
    const theme = mode === 'system' ? getSystem() : mode;
    root.setAttribute('data-theme', theme);
    if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
  };
  const saved = localStorage.getItem(key);
  apply(saved || 'system');

  // React to system changes if using system
  const sys = window.matchMedia('(prefers-color-scheme: dark)');
  sys.addEventListener?.('change', () => {
    const cur = localStorage.getItem(key) || 'system';
    if (cur === 'system') apply('system');
  });

  btn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || getSystem();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(key, next);
    apply(next);
  });
})();

// Auto-focus contact map to user's current region (with graceful fallback)
(() => {
  const mapFrame = document.querySelector('.contact__map iframe');
  if (!mapFrame || !('geolocation' in navigator)) return;

  const setMapTo = (lat, lon, zoom = 12) => {
    const url = `https://www.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;
    mapFrame.src = url;
  };

  // Request current position; if blocked or fails, keep default Kenya map
  try {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          setMapTo(latitude, longitude);
        }
      },
      () => {/* keep default */},
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 600000 }
    );
  } catch (_) {
    // ignore; fallback to default src
  }
})();
