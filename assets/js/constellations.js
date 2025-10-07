(() => {
  const canvas = document.getElementById('sky');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  const CFG = {
    sets: 6,           // сколько разных созвездий в цикле
    starsPerSet: 28,   // количество звёзд в одном наборе
    edgesPerStar: 2,   // количество связей с ближайшими соседями
    cycleMs: 12000,    // время показа одного набора
    fadeMs: 800,       // длительность плавной смены
    colorStar: 'rgba(255,255,255,0.9)',
    colorEdge: 'rgba(255,255,255,0.25)',
    starMin: 0.8,
    starMax: 1.8,
  };

  let W = 0, H = 0;
  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    W = Math.floor(w * dpr);
    H = Math.floor(h * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  resize();
  window.addEventListener('resize', () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    resize();
  });

  // Вектор утилиты
  const rand = (a, b) => a + Math.random() * (b - a);

  function generateSet(seed) {
    // Слабо зависимый от seed генератор
    const rnd = mulberry32(seed >>> 0);
    const stars = Array.from({ length: CFG.starsPerSet }, () => ({
      x: rnd() * W,
      y: rnd() * H,
      r: rand(CFG.starMin, CFG.starMax) * dpr,
      tw: 0.6 + rnd() * 0.8, // скорость мерцания
      ph: rnd() * Math.PI * 2,
    }));
    // Найти ближайших соседей для ребёр
    const edges = [];
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const dists = stars.map((t, j) => ({ j, d: i === j ? Infinity : (s.x - t.x) ** 2 + (s.y - t.y) ** 2 }));
      dists.sort((a, b) => a.d - b.d);
      for (let k = 0; k < CFG.edgesPerStar; k++) {
        const j = dists[k].j;
        if (j > i) edges.push([i, j]);
      }
    }
    return { stars, edges };
  }

  // Простой детерминированный PRNG
  function mulberry32(a) {
    return function() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Подготовка наборов
  const sets = [];
  for (let i = 0; i < CFG.sets; i++) sets.push(generateSet((Date.now() & 0xffff) + i * 12345));
  let idx = 0;
  let nextAt = performance.now() + CFG.cycleMs;
  let fadeStart = -1;
  let prevIdx = -1;

  function drawSet(set, alpha = 1) {
    if (!set) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Рёбра
    ctx.strokeStyle = CFG.colorEdge;
    ctx.lineWidth = 1 * dpr;
    set.edges.forEach(([a, b]) => {
      const s = set.stars[a], t = set.stars[b];
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    });
    // Звёзды с лёгким мерцанием
    ctx.fillStyle = CFG.colorStar;
    const t = performance.now() / 1000;
    set.stars.forEach((s) => {
      const pulse = 0.7 + 0.3 * Math.sin(t * s.tw + s.ph);
      const r = s.r * pulse;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function tick(now) {
    ctx.clearRect(0, 0, W, H);

    // Анимация плавной смены
    if (now >= nextAt) {
      prevIdx = idx;
      idx = (idx + 1) % sets.length;
      nextAt = now + CFG.cycleMs;
      fadeStart = now;
    }

    const fadeProgress = fadeStart >= 0 ? Math.min(1, (now - fadeStart) / CFG.fadeMs) : 1;
    const cur = sets[idx];
    const prev = prevIdx >= 0 ? sets[prevIdx] : null;

    if (prev && fadeProgress < 1) {
      drawSet(prev, 1 - fadeProgress);
      drawSet(cur, fadeProgress);
    } else {
      drawSet(cur, 1);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

