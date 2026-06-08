// Generates assets/video/hero.mp4 — a cinematic "Ken Burns" slideshow (slow zoom + crossfades)
// from the hero photos. Requires ffmpeg on PATH.  Run:  node make-hero-video.mjs
import { execFileSync } from 'child_process';
import { mkdirSync } from 'fs';

mkdirSync('assets/video', { recursive: true });

const imgs = ['hero.png', 'hero2.png', 'hero3.png']; // shown in order, 6s each
const SECS = 6, FADE = 1;
const inputs = imgs.flatMap(f => ['-framerate', '30', '-loop', '1', '-t', String(SECS), '-i', f]);

// per-image slow zoom-in, normalised to 1080p
const kb = 'scale=2600:-2,zoompan=z=zoom+0.0007:d=1:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):s=1920x1080:fps=30,setsar=1,format=yuv420p';

// build the crossfade chain
let chain = imgs.map((_, i) => `[${i}:v]${kb}[v${i}]`);
let last = 'v0', off = SECS - FADE;
for (let i = 1; i < imgs.length; i++) {
  const out = i === imgs.length - 1 ? 'v' : `x${i}`;
  chain.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${off}[${out}]`);
  last = out; off += SECS - FADE;
}
const fc = chain.join(';');

execFileSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error', ...inputs,
  '-filter_complex', fc, '-map', '[v]',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-crf', '26', '-preset', 'medium', '-movflags', '+faststart', '-an', '-r', '30',
  'assets/video/hero.mp4'
], { stdio: 'inherit' });

console.log('Wrote assets/video/hero.mp4');
