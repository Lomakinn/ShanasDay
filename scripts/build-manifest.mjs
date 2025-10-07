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

async function main() {
  await fs.mkdir(videosDir, { recursive: true });
  await fs.mkdir(photosDir, { recursive: true });

  const videoFiles = (await fs.readdir(videosDir)).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return VIDEO_EXT.includes(ext) && !f.startsWith('.');
  });

  const photoFiles = new Set((await fs.readdir(photosDir)).filter(f => !f.startsWith('.')));

  const items = videoFiles.map((vf) => {
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

  await fs.writeFile(outFile, JSON.stringify(items, null, 2), 'utf8');
  console.log(`Manifest written: ${toWebPath(path.relative(root, outFile))}`);
  console.log(`Items: ${items.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

