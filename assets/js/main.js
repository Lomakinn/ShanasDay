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
  const hero = document.querySelector('.hero');
  const volumeWrap = document.getElementById('musicVolumeWrap');
  const volumeInput = document.getElementById('musicVolume');
  const volumeValue = document.getElementById('musicVolumeValue');
  // Bonus video config and persistent state
  const BONUS_SRC = 'assets/videos/bonus/bonus.mp4';
  const BONUS_UNLOCK_KEY = 'bonusUnlocked';
  const WATCHED_KEY = 'watchedVideosV1';
  const CELEBRATE_KEY = 'celebrationShownV1';
  const docEl = document.documentElement;
  let firstVisit = false;
  try { firstVisit = localStorage.getItem(CELEBRATE_KEY) !== 'true'; } catch(_) { firstVisit = false; }
  let watchedSet;
  try {
    const raw = localStorage.getItem(WATCHED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    watchedSet = new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    watchedSet = new Set();
  }
  let bonusBtn = null;

  // Background music
  const AUDIO_SRC = 'assets/audio/music.mp3';
  const bgAudio = new Audio();
  bgAudio.src = AUDIO_SRC;
  bgAudio.loop = true;
  bgAudio.preload = 'metadata';
  bgAudio.volume = 0.2; // default 20%
  let wasPlayingBeforeModal = false;
  bgAudio.addEventListener('error', () => {
    if (musicToggle) musicToggle.style.display = 'none';
    if (volumeWrap) volumeWrap.style.display = 'none';
  }, { once: true });

  // Volume slider wiring
  if (volumeInput && volumeValue) {
    // Reflect default value from audio
    const init = Math.round((bgAudio.volume || 0) * 100);
    volumeInput.value = String(init);
    volumeValue.textContent = `${init}%`;
    volumeInput.addEventListener('input', () => {
      const v = Math.max(0, Math.min(100, parseInt(volumeInput.value || '0', 10)));
      bgAudio.volume = v / 100;
      volumeValue.textContent = `${v}%`;
    });
  }

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

  function saveWatched() {
    try { localStorage.setItem(WATCHED_KEY, JSON.stringify(Array.from(watchedSet))); } catch(_) {}
  }

  function ensureBonusButton() {
    if (bonusBtn) return bonusBtn;
    const actions = document.querySelector('.hero__actions');
    if (!actions) return null;
    const btn = document.createElement('button');
    btn.id = 'bonusBtn';
    btn.className = 'music-toggle';
    btn.type = 'button';
    btn.title = 'Бонусное видео';
    const icon = document.createElement('span');
    icon.className = 'music-toggle__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '★';
    const text = document.createElement('span');
    text.className = 'music-toggle__text';
    text.textContent = 'Бонусное видео';
    btn.appendChild(icon);
    btn.appendChild(text);
    btn.addEventListener('click', () => {
      // Open bonus in modal without enabling navigation
      currentIndex = -1;
      openModal(BONUS_SRC, 'Бонусное видео');
      updateNavState();
    });
    actions.appendChild(btn);
    bonusBtn = btn;
    return btn;
  }

  function isAllWatched() {
    if (!items.length) return false;
    let count = 0;
    for (const it of items) {
      if (watchedSet.has(it.video)) count++;
    }
    return count >= items.length;
  }

  function updateBonusVisibility() {
    const unlocked = localStorage.getItem(BONUS_UNLOCK_KEY) === 'true';
    if (unlocked) {
      ensureBonusButton();
      return;
    }
    if (isAllWatched()) {
      try { localStorage.setItem(BONUS_UNLOCK_KEY, 'true'); } catch(_) {}
      ensureBonusButton();
    }
  }

  // First-visit subtle celebration: floating balloons + small fireworks
  function triggerCelebration() {
    try {
      if (localStorage.getItem(CELEBRATE_KEY) === 'true') return;
      const wrap = document.createElement('div');
      wrap.className = 'celebration';
      const frag = document.createDocumentFragment();
      // Balloons
      const BALLOONS = 8;
      for (let i = 0; i < BALLOONS; i++) {
        const b = document.createElement('span');
        b.className = 'balloon';
        b.textContent = '🎈';
        const x = 8 + Math.random() * 84; // 8%..92%
        const dur = 9 + Math.random() * 5; // 9..14s
        const delay = Math.random() * 1.5; // 0..1.5s
        b.style.setProperty('--x', x + '%');
        b.style.setProperty('--dur', dur + 's');
        b.style.setProperty('--delay', delay + 's');
        if (Math.random() < 0.4) b.style.opacity = '0.75';
        frag.appendChild(b);
      }
      // Fireworks (very subtle, 2-3 tiny bursts)
      const FIREWORKS = 5;
      for (let i = 0; i < FIREWORKS; i++) {
        const f = document.createElement('span');
        f.className = 'firework';
        const x = 15 + Math.random() * 70; // 15%..85%
        const y = 20 + Math.random() * 40; // 20%..60%
        const hue = Math.floor(Math.random() * 360) + 'deg';
        const delay = 0.4 + i * 0.45 + Math.random() * 0.3; // staggered quicker
        const dur = 1.1 + Math.random() * 0.6;
        f.style.setProperty('--x', x + '%');
        f.style.setProperty('--y', y + '%');
        f.style.setProperty('--hue', hue);
        f.style.setProperty('--delay', delay + 's');
        f.style.setProperty('--dur', dur + 's');
        frag.appendChild(f);
      }
      wrap.appendChild(frag);
      document.body.appendChild(wrap);
      // Sequential reveal: hero then gallery, while celebration continues
      if (hero) {
        setTimeout(() => { hero.classList.remove('is-seq-hidden'); }, 1200);
        // Reveal actions, then gently transition header to top
        setTimeout(() => { hero.classList.remove('is-pre'); }, 2000);
        // Fade out, switch layout, fade in to avoid jump
        setTimeout(() => { hero.classList.add('is-fade-out'); }, 3000);
        setTimeout(() => { hero.classList.remove('is-centered'); hero.classList.remove('is-fade-out'); }, 3550);
      }
      if (gallery) {
        // 4s delay before video grid shows
        setTimeout(() => { gallery.classList.remove('is-seq-hidden'); }, 4000);
      }
      // Auto-remove after max duration
      setTimeout(() => { wrap.remove(); }, 15000);
      try { localStorage.setItem(CELEBRATE_KEY, 'true'); } catch(_) {}
    } catch (_) {}
  }

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

  // Auto-play next video when current ends
  video.addEventListener('ended', () => {
    // Mark current as watched
    if (currentIndex >= 0 && currentIndex < items.length) {
      const src = items[currentIndex]?.video;
      if (src) {
        watchedSet.add(src);
        saveWatched();
        updateBonusVisibility();
      }
    }
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      openByIndex(currentIndex + 1);
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
      shuffleArray(list);
      renderTiles(list);
      gallery.querySelectorAll('[data-sample="true"]').forEach(n => n.remove());
      items = buildItemsFromDOM();
      // Re-evaluate bonus unlock after manifest load
      updateBonusVisibility();
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

  // Fisher–Yates shuffle
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Shuffle existing DOM tiles (used when manifest is absent)
  function shuffleGalleryDOM() {
    const tiles = Array.from(gallery.querySelectorAll('.tile'));
    if (!tiles.length) return;
    shuffleArray(tiles);
    const frag = document.createDocumentFragment();
    tiles.forEach(t => frag.appendChild(t));
    gallery.appendChild(frag);
  }

  // Initial sequence setup to avoid flashes
  (function initSequenceSetup(){
    if (firstVisit) {
      hero && hero.classList.add('is-seq-hidden', 'is-centered', 'is-pre');
      gallery && gallery.classList.add('is-seq-hidden');
    } else {
      hero && hero.classList.remove('is-seq-hidden', 'is-centered', 'is-pre');
      gallery && gallery.classList.remove('is-seq-hidden');
    }
    // Remove preload class as soon as initial state is set
    docEl && docEl.classList.remove('preload');
  })();

  // Randomize existing tiles order on initial load
  shuffleGalleryDOM();
  items = buildItemsFromDOM();
  // If bonus already unlocked, show button; otherwise check progress
  updateBonusVisibility();
  // First-visit sequence: hide sections and run celebration
  try { if (firstVisit) { triggerCelebration(); } } catch (_) {}
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
