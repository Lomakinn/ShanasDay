#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const root = process.cwd();
const videosDir = path.join(root, 'assets', 'videos');
const photosDir = path.join(root, 'assets', 'photos');

const VIDEO_EXT = ['.mp4', '.webm', '.ogv', '.mov', '.m4v'];

function toWebPath(p) { return p.split(path.sep).join('/'); }

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} exited with ${code}: ${err || out}`));
    });
    child.on('error', reject);
  });
}

async function hasBinary(bin) {
  try {
    await run(bin, ['-version']);
    return true;
  } catch {
    return false;
  }
}

async function getDurationSeconds(inputPath) {
  try {
    const { out } = await run('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ]);
    const sec = parseFloat(out.trim());
    return isFinite(sec) && sec > 0 ? sec : null;
  } catch {
    return null;
  }
}

async function generatePoster(inputPath, outputPath) {
  const duration = await getDurationSeconds(inputPath);
  // fallback to 5s if duration unknown
  const midpoint = duration ? Math.max(0, Math.floor(duration / 2)) : 5;
  const args = [
    '-y',
    '-ss', String(midpoint),
    '-i', inputPath,
    '-frames:v', '1',
    // quality and reasonable size for grid
    '-vf', "scale='min(800,iw)':-2",
    '-q:v', '2',
    outputPath,
  ];
  await run('ffmpeg', args);
}

async function main() {
  const okFfmpeg = await hasBinary('ffmpeg');
  const okFfprobe = await hasBinary('ffprobe');
  if (!okFfmpeg || !okFfprobe) {
    console.error('ffmpeg/ffprobe не найдены в PATH. Установите ffmpeg и повторите.');
    process.exit(2);
  }

  await fs.mkdir(videosDir, { recursive: true });
  await fs.mkdir(photosDir, { recursive: true });

  const files = await fs.readdir(videosDir);
  const videos = files.filter(f => VIDEO_EXT.includes(path.extname(f).toLowerCase()) && !f.startsWith('.'));
  if (!videos.length) {
    console.log('Нет видеофайлов в assets/videos');
    return;
  }

  let made = 0, skipped = 0, failed = 0;
  for (const vf of videos) {
    const stem = vf.replace(/\.[^.]+$/, '');
    const out = path.join(photosDir, `${stem}.jpg`);
    try {
      // Skip if exists
      await fs.access(out).then(() => { skipped++; return Promise.reject('exists'); }).catch(e => { if (e !== 'exists') throw e; });
      if (skipped && skipped > 0) continue; // already counted
    } catch {}

    try {
      await generatePoster(path.join(videosDir, vf), out);
      made++;
      console.log(`✔ Превью: ${toWebPath(path.relative(root, out))}`);
    } catch (err) {
      failed++;
      console.error(`✖ Не удалось создать превью для ${vf}: ${err.message}`);
    }
  }

  console.log(`Готово. Создано: ${made}, пропущено: ${skipped}, ошибок: ${failed}`);
  console.log('Теперь обновите манифест: node scripts/build-manifest.mjs');
}

main().catch((e) => { console.error(e); process.exit(1); });

