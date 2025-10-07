#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const root = process.cwd();
const videosDir = path.join(root, 'assets', 'videos');
const photosDir = path.join(root, 'assets', 'photos');
const outFile = path.join(videosDir, 'manifest.json');

const VIDEO_EXT = ['.mp4', '.webm', '.ogv', '.mov', '.m4v'];
const PHOTO_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'];

function toWebPath(p) {
  return p.split(path.sep).join('/');
}

function normKey(videoPath) {
  if (!videoPath) return '';
  const w = toWebPath(videoPath).trim();
  return w.toLowerCase();
}

async function readExistingManifest() {
  try {
    const raw = await fs.readFile(outFile, 'utf8');
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

async function main() {
  await fs.mkdir(videosDir, { recursive: true });
  await fs.mkdir(photosDir, { recursive: true });

  const videoFiles = (await fs.readdir(videosDir)).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return VIDEO_EXT.includes(ext) && !f.startsWith('.');
  });

  const photoFiles = new Set((await fs.readdir(photosDir)).filter(f => !f.startsWith('.')));

  const newFileItems = videoFiles.map((vf) => {
    const stem = vf.replace(/\.[^.]+$/, '');
    let poster = null;
    for (const ext of PHOTO_EXT) {
      const candidate = stem + ext;
      if (photoFiles.has(candidate)) {
        poster = toWebPath(path.join('assets', 'photos', candidate));
        break;
      }
    }
    return {
      title: stem.replace(/[_-]+/g, ' ').trim(),
      video: toWebPath(path.join('assets', 'videos', vf)),
      poster: poster || toWebPath(path.join('assets', 'photos', 'sample1.svg')),
    };
  });

  // Preserve existing entries (titles/subtitles/posters/extra fields) and append new videos
  const existing = await readExistingManifest();
  const existingMap = new Map(existing.map((it) => [normKey(it && it.video), it]).filter(([k]) => !!k));

  const combined = [...existing];
  for (const it of newFileItems) {
    const key = normKey(it.video);
    if (!existingMap.has(key)) {
      combined.push(it);
    }
  }

  await fs.writeFile(outFile, JSON.stringify(combined, null, 2), 'utf8');
  console.log(`Manifest written: ${toWebPath(path.relative(root, outFile))}`);
  console.log(`Items: ${combined.length} (preserved ${existing.length}, added ${combined.length - existing.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
