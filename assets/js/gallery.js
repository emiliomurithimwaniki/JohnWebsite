(function(){
  const grid = document.getElementById('galleryGrid');
  const filtersEl = document.getElementById('galleryFilters');
  const searchEl = document.getElementById('gallerySearch');
  if (!grid) return;

  // Keep last fetched items in memory for client-side filtering
  let latestItems = [];

  function renderSkeleton(count = 6){
    const frag = document.createDocumentFragment();
    for (let i=0;i<count;i++){
      const sk = document.createElement('div');
      sk.className = 'skeleton-card';
      sk.innerHTML = `
        <div class="skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      `;
      frag.appendChild(sk);
    }
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  function card(item){
    const div = document.createElement('div');
    div.className = 'gallery-card';
    div.dataset.image = item.imageUrl || '';
    div.dataset.title = item.title || '';
    div.dataset.desc = item.description || '';
    div.setAttribute('tabindex','0');
    div.innerHTML = `
      <div class="gallery-thumb">
        <img src="${item.imageUrl}" alt="${item.title || 'Gallery item'}" loading="lazy" />
        <div class="gallery-overlay"><h4 style="margin:0">${item.title || ''}</h4></div>
      </div>
      <div class="gallery-card-body">
        <h3>${item.title || ''}</h3>
        <p>${item.description || ''}</p>
      </div>
    `;
    return div;
  }

  function render(list){
    grid.innerHTML = '';
    if (!list.length){
      grid.innerHTML = '<p>No items yet. Check back soon.</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(d => frag.appendChild(card(d)));
    grid.appendChild(frag);
  }

  function start(){
    const db = window.fb && window.fb.db;
    if (!db) return;

    const params = new URLSearchParams(location.search);
    let activeCat = (params.get('category') || '').toLowerCase();
    let query = (params.get('q') || '').trim();
    if (searchEl) searchEl.value = query;

    function normalize(val){
      return String(val || '')
        .toLowerCase()
        .replace(/\s+/g,'-')
        .replace(/[^a-z0-9\-]/g,'');
    }
    function matchesCategory(item, cat){
      if (!cat) return true;
      const c1 = normalize(item.category);
      const tags = Array.isArray(item.tags) ? item.tags.map(normalize) : [];
      const cats = Array.isArray(item.categories) ? item.categories.map(normalize) : [];
      return c1 === cat || tags.includes(cat) || cats.includes(cat);
    }

    function matchesQuery(item, q){
      if (!q) return true;
      const s = q.toLowerCase();
      const hay = [
        item.title || '',
        item.description || '',
        item.category || '',
        ...(Array.isArray(item.tags) ? item.tags : []),
        ...(Array.isArray(item.categories) ? item.categories : []),
      ].join(' ').toLowerCase();
      return hay.includes(s);
    }

    function toLabel(slug){
      if (!slug) return 'View All';
      return slug.replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase());
    }

    function buildCategories(items){
      const set = new Set();
      items.forEach(it=>{
        const c1 = normalize(it.category);
        if (c1) set.add(c1);
        const tags = Array.isArray(it.tags) ? it.tags.map(normalize) : [];
        const cats = Array.isArray(it.categories) ? it.categories.map(normalize) : [];
        [...tags, ...cats].forEach(s=>{ if (s) set.add(s); });
      });
      return Array.from(set).sort();
    }

    function renderFilters(categories){
      if (!filtersEl) return;
      // Keep the first button (View All) and regenerate the rest
      const existingAll = filtersEl.querySelector('button.pill[data-cat=""]');
      filtersEl.innerHTML = '';
      const allBtn = existingAll || document.createElement('button');
      allBtn.className = 'pill';
      allBtn.dataset.cat = '';
      allBtn.textContent = 'View All';
      filtersEl.appendChild(allBtn);
      categories.forEach(slug=>{
        const btn = document.createElement('button');
        btn.className = 'pill';
        btn.dataset.cat = slug;
        btn.textContent = toLabel(slug);
        filtersEl.appendChild(btn);
      });
      // activate
      [...filtersEl.querySelectorAll('.pill')].forEach(b=>{
        b.classList.toggle('active', (b.dataset.cat||'') === (activeCat||''));
      });
    }

    function setActive(cat){
      activeCat = cat || '';
      // Update URL without reload
      const url = new URL(location.href);
      if (activeCat) url.searchParams.set('category', activeCat);
      else url.searchParams.delete('category');
      history.replaceState(null, '', url);
      // Update active pill
      if (filtersEl){
        [...filtersEl.querySelectorAll('.pill')].forEach(b=>{
          b.classList.toggle('active', (b.dataset.cat||'') === (activeCat||''));
        });
      }
    }

    function applyFilters(){
      const filtered = latestItems
        .filter(it => matchesCategory(it, activeCat))
        .filter(it => matchesQuery(it, query));
      // Keep query in URL
      const url = new URL(location.href);
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      render(filtered);
    }

    // Lightbox elements
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbTitle = document.getElementById('lbTitle');
    const lbDesc = document.getElementById('lbDesc');
    const lbClose = document.getElementById('lbClose');

    function openLB(img, title, desc){
      if (!lb) return;
      lbImg && (lbImg.src = img || '');
      lbTitle && (lbTitle.textContent = title || '');
      lbDesc && (lbDesc.textContent = desc || '');
      lb.classList.add('open');
      lb.setAttribute('aria-hidden','false');
    }
    function closeLB(){
      if (!lb) return;
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden','true');
      if (lbImg) lbImg.src = '';
    }

    // Open from card click or Enter key
    grid.addEventListener('click', (e)=>{
      const el = e.target.closest('.gallery-card');
      if (!el) return;
      openLB(el.dataset.image, el.dataset.title, el.dataset.desc);
    });
    grid.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter'){
        const el = e.target.closest('.gallery-card');
        if (el) openLB(el.dataset.image, el.dataset.title, el.dataset.desc);
      }
    });
    lbClose && lbClose.addEventListener('click', closeLB);
    lb && lb.addEventListener('click', (e)=>{ if (e.target === lb) closeLB(); });
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeLB(); });

    // Initial skeleton while loading
    renderSkeleton(8);

    db.collection('gallery')
      .orderBy('createdAt','desc')
      .onSnapshot(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        latestItems = items;
        if (filtersEl){
          const cats = buildCategories(items);
          renderFilters(cats);
        }
        applyFilters();
      }, err => {
        console.error(err);
        grid.innerHTML = '<p>Failed to load gallery.</p>';
      });

    // Handle filter clicks
    if (filtersEl){
      filtersEl.addEventListener('click', (e)=>{
        const btn = e.target.closest('.pill');
        if (!btn) return;
        const cat = btn.dataset.cat || '';
        setActive(cat);
        // Re-filter current items without waiting for new snapshot
        // We'll query the DOM cache via latest snapshot by re-triggering render via a quick read
        // Client-side filter using cached items
        applyFilters();
      });
    }

    // Search field: debounce and filter client-side
    if (searchEl){
      let t;
      const onChange = ()=>{
        query = (searchEl.value || '').trim();
        applyFilters();
      };
      const debounced = ()=>{
        clearTimeout(t);
        t = setTimeout(onChange, 200);
      };
      searchEl.addEventListener('input', debounced);
      searchEl.addEventListener('keydown', (e)=>{
        if (e.key === 'Escape'){
          searchEl.value = '';
          query = '';
          applyFilters();
        }
        if (e.key === 'Enter'){
          e.preventDefault();
          onChange();
        }
      });
    }
  }

  if (window.fb && window.fb.db) start();
  else window.addEventListener('fb-ready', start, { once: true });
})();
