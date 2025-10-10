#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const OUT_DIR = path.join('assets', 'motivations');
const COUNT = 50;

const PHRASES = [
  'Ты справишься','Двигайся дальше','Маленькие шаги — каждый день',
  'Смелость — это действие','Выше голову','Становись лучше на 1%',
  'Вперёд, несмотря ни на что','Просто начни','Трудности временны',
  'Фокус на главном','Доводи до конца','Верить и делать',
  'Стань опорой себе','Твоя скорость — твоя','Дисциплина = свобода',
  'Сравнивай с собой','Ошибки — путь к росту','Каждый день — шанс',
  'Думай ясно, действуй просто','Не сдавайся','Спокойно и уверенно',
  'Выбирай лучшее действие','Сделай сегодня','Учись постоянно',
  'Время — тебе союзник','Уверенность — из практики','Сила в привычках',
  'Начинай с малого','Путь — это процесс','Будь добрее к себе',
  'Поднимай планку','Создавай ценность','Энергия в движении',
  'Делай чуть больше','Соберись','Вдох — и вперёд',
  'Лучшее впереди','Ты не один','Сделай первый шаг',
  'Сегодня — важнее всего','Смело экспериментируй','Тихая настойчивость',
  'Сохраняй спокойствие','Выдержка — ключ','Расти через действие',
  'Прогресс > перфекционизм','Будь последовательным','Сохраняй ритм',
  'Лёгкость в важном','Улыбнись и продолжай'
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

function wrapText(text, maxWidth, charW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  const measure = (s) => s.length * charW;
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
  return lines.slice(0, 4);
}

function makeSVG(text, idx) {
  const pal = PALETTES[idx % PALETTES.length];
  const seed = idx + 1;
  const strokeA = pal.a, strokeB = pal.b, strokeC = pal.c;
  const lines = wrapText(text, 352, 11);

  const p1x = 30 + seededRand(seed) * 60;
  const p2x = 180 + seededRand(seed + 1) * 40;
  const p3x = 350 - seededRand(seed + 2) * 60;
  const cx = 80 + seededRand(seed + 3) * 240;
  const cy = 150 + seededRand(seed + 4) * 40;
  const r = 20 + Math.floor(seededRand(seed + 5) * 16);
  const ax = 280 + seededRand(seed + 6) * 70;
  const ay = 120 + seededRand(seed + 7) * 60;

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${escapeXml(text)}">\n`+
  `  <rect x="0" y="0" width="400" height="500" fill="transparent"/>\n`+
  `  <g fill="none" stroke-linecap="round" stroke-linejoin="round">\n`+
  `    <path d="M ${p1x} 320 Q 110 240 ${p2x} 280 T ${p3x} 300" stroke="${strokeB}" stroke-width="4"/>\n`+
  `    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${strokeC}" stroke-width="5" fill="none"/>\n`+
  `    <path d="M ${ax - 30} ${ay} L ${ax} ${ay} M ${ax - 8} ${ay - 8} L ${ax} ${ay} L ${ax - 8} ${ay + 8}" stroke="${strokeA}" stroke-width="4"/>\n`+
  `  </g>\n`+
  `  <text x="24" y="380" fill="${strokeA}" font-size="20" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial">\n`+
  lines.map((ln,i)=>`    <tspan x="24" dy="${i===0?0:28}">${escapeXml(ln)}</tspan>`).join('\n')+`\n`+
  `  </text>\n`+
  `</svg>\n`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const writes = [];
  for (let i = 0; i < COUNT; i++) {
    const idx = i % PHRASES.length;
    const phrase = PHRASES[idx];
    const svg = makeSVG(phrase, i);
    const name = `motivation-${String(i+1).padStart(3,'0')}.svg`;
    const outPath = path.join(OUT_DIR, name);
    writes.push(fs.writeFile(outPath, svg, 'utf8'));
  }
  await Promise.all(writes);
  console.log(`Generated ${COUNT} SVGs in ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

