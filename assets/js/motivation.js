(() => {
  const grid = document.getElementById('motivationGrid');
  if (!grid) return;

  const PHRASES = [
    'Ты справишься', 'Двигайся дальше', 'Маленькие шаги — каждый день',
    'Смелость — это действие', 'Выше голову', 'Становись лучше на 1%',
    'Вперёд, несмотря ни на что', 'Просто начни', 'Трудности временны',
    'Фокус на главном', 'Доводи до конца', 'Верить и делать',
    'Стань опорой себе', 'Твоя скорость — твоя', 'Дисциплина = свобода',
    'Сравнивай с собой', 'Ошибки — путь к росту', 'Каждый день — шанс',
    'Думай ясно, действуй просто', 'Не сдавайся', 'Спокойно и уверенно',
    'Выбирай лучшее действие', 'Сделай сегодня', 'Учись постоянно',
    'Время — тебе союзник', 'Уверенность — из практики', 'Сила в привычках',
    'Начинай с малого', 'Путь — это процесс', 'Будь добрее к себе',
    'Поднимай планку', 'Создавай ценность', 'Энергия в движении',
    'Делай чуть больше', 'Соберись', 'Вдох — и вперёд',
    'Лучшее впереди', 'Ты не один', 'Сделай первый шаг',
    'Сегодня — важнее всего', 'Смело экспериментируй', 'Тихая настойчивость',
    'Сохраняй спокойствие', 'Выдержка — ключ', 'Расти через действие',
    'Прогресс > перфекционизм', 'Будь последовательным', 'Сохраняй ритм',
    'Лёгкость в важном', 'Улыбнись и продолжай'
  ];

  const PALETTES = [
    { bg: '#0f1427', a: '#f4f6fb', b: '#6ea8fe', c: '#ffd666' },
    { bg: '#111425', a: '#e8ecf7', b: '#8ad6ff', c: '#ffb870' },
    { bg: '#0e1222', a: '#f5f7ff', b: '#9fe2bf', c: '#ffc785' }
  ];

  function seededRand(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function makeSVGCard(text, idx) {
    const pal = PALETTES[idx % PALETTES.length];
    const seed = idx + 1;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 500');
    svg.setAttribute('class', 'm-card__svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', text);

    // Background soft wash
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', '400'); bg.setAttribute('height', '500');
    bg.setAttribute('fill', 'transparent');
    svg.appendChild(bg);

    // Subtle shapes — minimalist lines and forms
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke-linecap', 'round');
    g.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(g);

    const strokeA = pal.a, strokeB = pal.b, strokeC = pal.c;

    // Mountain / path
    const path = document.createElementNS(svgNS, 'path');
    const p1x = 30 + seededRand(seed) * 60;
    const p2x = 180 + seededRand(seed + 1) * 40;
    const p3x = 350 - seededRand(seed + 2) * 60;
    const p = `M ${p1x} 320 Q 110 240 ${p2x} 280 T ${p3x} 300`;
    path.setAttribute('d', p);
    path.setAttribute('stroke', strokeB);
    path.setAttribute('stroke-width', '4');
    g.appendChild(path);

    // Rising sun / moon
    const circle = document.createElementNS(svgNS, 'circle');
    const cx = 80 + seededRand(seed + 3) * 240;
    const cy = 150 + seededRand(seed + 4) * 40;
    const r = 20 + Math.floor(seededRand(seed + 5) * 16);
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(r));
    circle.setAttribute('stroke', strokeC);
    circle.setAttribute('stroke-width', '5');
    circle.setAttribute('fill', 'none');
    g.appendChild(circle);

    // Guiding arrow / direction
    const arrow = document.createElementNS(svgNS, 'path');
    const ax = 280 + seededRand(seed + 6) * 70;
    const ay = 120 + seededRand(seed + 7) * 60;
    const arrowPath = `M ${ax - 30} ${ay} L ${ax} ${ay} M ${ax - 8} ${ay - 8} L ${ax} ${ay} L ${ax - 8} ${ay + 8}`;
    arrow.setAttribute('d', arrowPath);
    arrow.setAttribute('stroke', strokeA);
    arrow.setAttribute('stroke-width', '4');
    g.appendChild(arrow);

    // Quote text as SVG tspans (wrapped)
    const txt = document.createElementNS(svgNS, 'text');
    txt.setAttribute('x', '24');
    txt.setAttribute('y', '380');
    txt.setAttribute('fill', strokeA);
    txt.setAttribute('font-size', '20');
    txt.setAttribute('font-family', 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial');

    const lines = wrapText(text, 24, 352, 20, 28);
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', '24');
      tspan.setAttribute('dy', i === 0 ? '0' : '28');
      tspan.textContent = line;
      txt.appendChild(tspan);
    });
    svg.appendChild(txt);

    return svg;
  }

  function wrapText(text, x, maxWidth, fontSize, lineHeight) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    function measure(s) {
      // Approximate measure by character count; monospace-ish for simplicity
      return s.length * (fontSize * 0.55);
    }
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (measure(test) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.slice(0, 4); // cap to 4 lines to keep minimal
  }

  function render() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 50; i++) {
      const card = document.createElement('figure');
      card.className = 'm-card';
      const phrase = PHRASES[i % PHRASES.length];
      const svg = makeSVGCard(phrase, i);
      card.appendChild(svg);
      const figcap = document.createElement('figcaption');
      figcap.className = 'm-card__meta';
      figcap.textContent = phrase;
      card.appendChild(figcap);
      frag.appendChild(card);
    }
    grid.appendChild(frag);
  }

  render();
})();

