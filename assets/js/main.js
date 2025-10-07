(() => {
  const modal = document.getElementById('modal');
  const closeEls = modal.querySelectorAll('[data-close]');
  const video = document.getElementById('modalVideo');
  const caption = document.getElementById('modalCaption');
  const gallery = document.getElementById('gallery');
  const musicToggle = document.getElementById('musicToggle');
  const randomBtn = document.getElementById('randomBtn');
  const prevBtn = document.querySelector('.modal__nav--prev');
  const nextBtn = document.querySelector('.modal__nav--next');
  const heroQuote = document.getElementById('heroQuote');

  // Background music
  const AUDIO_SRC = 'assets/audio/music.mp3';
  const bgAudio = new Audio();
  bgAudio.src = AUDIO_SRC;
  bgAudio.loop = true;
  bgAudio.preload = 'metadata';
  bgAudio.volume = 0.1; // default 10%
  let wasPlayingBeforeModal = false;
  bgAudio.addEventListener('error', () => {
    if (musicToggle) musicToggle.style.display = 'none';
  }, { once: true });

  if (musicToggle) {
    musicToggle.addEventListener('click', async () => {
      const isPlaying = !bgAudio.paused;
      try {
        if (isPlaying) {
          await bgAudio.pause();
          musicToggle.setAttribute('aria-pressed', 'false');
          musicToggle.querySelector('.music-toggle__icon').textContent = '♪';
          musicToggle.querySelector('.music-toggle__text').textContent = 'Музыка';
        } else {
          await bgAudio.play();
          musicToggle.setAttribute('aria-pressed', 'true');
          musicToggle.querySelector('.music-toggle__icon').textContent = '⏸';
          musicToggle.querySelector('.music-toggle__text').textContent = 'Пауза';
        }
      } catch (_) {}
    });
  }

  let lastActive = null;
  let items = [];
  let currentIndex = -1;

  function tryPlay() {
    try { video.play().catch(() => {}); } catch (_) {}
  }

  function openModal(src, text) {
    lastActive = document.activeElement;
    video.src = src;
    caption.textContent = text || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    const closeBtn = modal.querySelector('.modal__close');
    closeBtn && closeBtn.focus();
    tryPlay();
    wasPlayingBeforeModal = !bgAudio.paused;
    if (wasPlayingBeforeModal) {
      try { bgAudio.pause(); } catch(_) {}
      if (musicToggle) {
        musicToggle.setAttribute('aria-pressed', 'false');
        musicToggle.querySelector('.music-toggle__icon').textContent = '♪';
        musicToggle.querySelector('.music-toggle__text').textContent = 'Музыка';
      }
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    try { video.pause(); } catch (_) {}
    video.removeAttribute('src');
    video.load();
    caption.textContent = '';
    if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
    if (wasPlayingBeforeModal) {
      wasPlayingBeforeModal = false;
      if (musicToggle) {
        musicToggle.setAttribute('aria-pressed', 'true');
        musicToggle.querySelector('.music-toggle__icon').textContent = '⏸';
        musicToggle.querySelector('.music-toggle__text').textContent = 'Пауза';
      }
      bgAudio.play().catch(() => {});
    }
  }

  closeEls.forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    const content = e.currentTarget.querySelector('.modal__content');
    if (!content.contains(e.target)) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      e.preventDefault();
      closeModal();
    }
  });

  gallery.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile || !gallery.contains(tile)) return;
    const src = tile.getAttribute('data-video');
    let idx = items.findIndex(it => it.video === src);
    if (idx < 0) { items = buildItemsFromDOM(); idx = items.findIndex(it => it.video === src); }
    if (idx >= 0) {
      openByIndex(idx);
    } else if (src) {
      openModal(src, (tile.querySelector('img')?.alt) || '');
    }
  });

  async function loadManifest() {
    try {
      const res = await fetch('assets/videos/manifest.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (!list.length) return;
      renderTiles(list);
      gallery.querySelectorAll('[data-sample="true"]').forEach(n => n.remove());
      items = buildItemsFromDOM();
    } catch (_) {}
  }

  function renderTiles(arr) {
    const frag = document.createDocumentFragment();
    arr.forEach((it, idx) => {
      const obj = typeof it === 'string' ? { video: it } : it;
      const videoSrc = obj.video || obj.src || '';
      if (!videoSrc) return;
      const title = obj.title || deriveTitleFromPath(videoSrc) || `Видео ${idx + 1}`;
      const poster = obj.poster || 'assets/photos/sample1.svg';
      const subtitle = obj.subtitle || '';

      const btn = document.createElement('button');
      btn.className = 'tile';
      btn.type = 'button';
      btn.setAttribute('data-video', videoSrc);
      if (subtitle) btn.setAttribute('data-subtitle', subtitle);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = title;
      img.src = poster;
      img.addEventListener('error', () => { img.src = 'assets/photos/sample1.svg'; }, { once: true });

      const label = document.createElement('div');
      label.className = 'tile__label';
      const t1 = document.createElement('span');
      t1.className = 'tile__title';
      t1.textContent = title;
      const t2 = document.createElement('span');
      t2.className = 'tile__subtitle';
      t2.textContent = subtitle;
      if (!subtitle) t2.style.display = 'none';
      label.appendChild(t1);
      label.appendChild(t2);

      btn.appendChild(img);
      btn.appendChild(label);
      frag.appendChild(btn);
    });
    gallery.appendChild(frag);
  }

  function buildItemsFromDOM() {
    const list = [];
    gallery.querySelectorAll('.tile').forEach((tile) => {
      const src = tile.getAttribute('data-video');
      const img = tile.querySelector('img');
      const title = img ? img.getAttribute('alt') : deriveTitleFromPath(src);
      if (src) list.push({ video: src, title });
      // Enhance overlay for static tiles if not present
      if (!tile.querySelector('.tile__label')) {
        enhanceTileOverlay(tile, title, tile.getAttribute('data-subtitle') || '');
      }
    });
    return list;
  }

  function enhanceTileOverlay(tile, title, subtitle) {
    const label = document.createElement('div');
    label.className = 'tile__label';
    const t1 = document.createElement('span');
    t1.className = 'tile__title';
    t1.textContent = title || '';
    const t2 = document.createElement('span');
    t2.className = 'tile__subtitle';
    t2.textContent = subtitle || '';
    if (!subtitle) t2.style.display = 'none';
    label.appendChild(t1);
    label.appendChild(t2);
    tile.appendChild(label);
  }

  function applyVideoByIndex(idx) {
    if (idx < 0 || idx >= items.length) return;
    currentIndex = idx;
    const it = items[idx];
    try { video.pause(); } catch(_) {}
    video.src = it.video;
    caption.textContent = it.title || '';
    tryPlay();
    updateNavState();
  }

  function openByIndex(idx) {
    if (!modal.classList.contains('is-open')) {
      currentIndex = idx;
      const it = items[idx];
      openModal(it.video, it.title);
      updateNavState();
    } else {
      applyVideoByIndex(idx);
    }
  }

  function updateNavState() {
    if (!prevBtn || !nextBtn) return;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;
    prevBtn.disabled = !hasPrev;
    nextBtn.disabled = !hasNext;
  }

  function goPrev() { if (currentIndex > 0) openByIndex(currentIndex - 1); }
  function goNext() { if (currentIndex >= 0 && currentIndex < items.length - 1) openByIndex(currentIndex + 1); }

  prevBtn && prevBtn.addEventListener('click', () => { goPrev(); });
  nextBtn && nextBtn.addEventListener('click', () => { goNext(); });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
  });

  randomBtn && randomBtn.addEventListener('click', () => {
    if (!items.length) items = buildItemsFromDOM();
    if (!items.length) return;
    const idx = Math.floor(Math.random() * items.length);
    openByIndex(idx);
  });

  function deriveTitleFromPath(p) {
    try {
      const base = p.split('/').pop() || p;
      return base.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    } catch { return ''; }
  }

  items = buildItemsFromDOM();
  loadManifest();
  // Rotate quotes smoothly every N ms
  if (heroQuote && Array.isArray(window.QUOTES) && window.QUOTES.length) {
    const QUOTE_INTERVAL = 8000; // ms
    const quotes = window.QUOTES.slice();
    let order = [...quotes.keys()];
    // shuffle
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let ptr = 0;
    function setQuote(idx, animate = false) {
      const text = quotes[idx] || '';
      if (animate) {
        heroQuote.classList.add('is-hidden');
        setTimeout(() => {
          heroQuote.textContent = text;
          heroQuote.classList.remove('is-hidden');
        }, 300);
      } else {
        heroQuote.textContent = text;
      }
    }
    setQuote(order[ptr]);
    setInterval(() => {
      ptr = (ptr + 1) % order.length;
      if (ptr === 0) {
        // reshuffle to keep randomness across cycles
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
      setQuote(order[ptr], true);
    }, QUOTE_INTERVAL);
  }
})();
