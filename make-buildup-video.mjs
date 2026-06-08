// Renders the "brick-lay" before->after transformation as a real MP4 (no AI tools).
// Slices the AFTER photo into a grid and reveals the tiles bottom-up over the BEFORE photo.
// Requires sharp + ffmpeg.  Run:  node make-buildup-video.mjs
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

const W = 1280, H = 760, COLS = 18, ROWS = 10, FPS = 30;
const BEFORE = 'assets/img/ba-2-before.jpg', AFTER = 'assets/img/ba-2-after.jpg';
const HOLD_BEFORE = 0.5, SWEEP = 2.0, FADE = 0.16, HOLD_AFTER = 1.8;
const TOTAL = HOLD_BEFORE + SWEEP + FADE + HOLD_AFTER;
const FRAMES = Math.round(TOTAL * FPS);
sharp.cache(false);

// per-tile "land" time: sweep from the bottom (road) up to the house, slight L->R lean + jitter
const denomC = (COLS - 1) || 1, denomR = (ROWS - 1) || 1;
const jitter = (c, r) => (((Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1) + 1) % 1;
const tiles = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const up = (ROWS - 1 - r) / denomR, lean = c / denomC;
  tiles.push({ c, r, land: HOLD_BEFORE + (up * 0.82 + lean * 0.18) * SWEEP + jitter(c, r) * 0.12 });
}

const tmp = '._frames';
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const afterRGB = await sharp(AFTER).resize(W, H, { fit: 'cover' }).removeAlpha().raw().toBuffer();
const beforeBuf = await sharp(BEFORE).resize(W, H, { fit: 'cover' }).jpeg().toBuffer();
const tw = W / COLS, th = H / ROWS;

for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  let rects = '';
  for (const til of tiles) {
    const a = Math.max(0, Math.min(1, (t - til.land) / FADE));
    if (a <= 0) continue;
    rects += `<rect x="${(til.c * tw).toFixed(2)}" y="${(til.r * th).toFixed(2)}" width="${(tw + 1).toFixed(2)}" height="${(th + 1).toFixed(2)}" fill="#fff" fill-opacity="${a.toFixed(3)}"/>`;
  }
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000"/>${rects}</svg>`;
  const mask = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer();
  const afterAlpha = await sharp(afterRGB, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const frame = await sharp(beforeBuf).composite([{ input: afterAlpha, blend: 'over' }]).jpeg({ quality: 90 }).toBuffer();
  writeFileSync(`${tmp}/f${String(f).padStart(4, '0')}.jpg`, frame);
}

execFileSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${tmp}/f%04d.jpg`,
  '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '23',
  '-preset', 'medium', '-movflags', '+faststart', 'assets/video/transformation.mp4'
], { stdio: 'inherit' });

rmSync(tmp, { recursive: true, force: true });
console.log('wrote assets/video/transformation.mp4 (' + FRAMES + ' frames)');
