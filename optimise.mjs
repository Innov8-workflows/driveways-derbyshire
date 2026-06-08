// Image optimisation pipeline for Driveways Derbyshire
// Run: node optimise.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const OUT = 'assets/img';
mkdirSync(OUT, { recursive: true });
sharp.cache(false);

// Map source -> semantic name
const HEROES = [
  { src: 'hero.png',  name: 'hero-1', label: 'block paving' },
  { src: 'hero2.png', name: 'hero-2', label: 'tarmac' },
  { src: 'hero3.png', name: 'hero-3', label: 'gravel' },
];

const WIDTHS = [1600, 800];

async function buildHero({ src, name }) {
  for (const w of WIDTHS) {
    const base = sharp(src).resize({ width: w, withoutEnlargement: true });
    await base.clone().webp({ quality: 74 }).toFile(`${OUT}/${name}-${w}.webp`);
    await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/${name}-${w}.jpg`);
  }
  console.log('hero done:', name);
}

// Before/after reveal pairs.
//  ba-1 = REAL matched pair (before01/after01) — genuine same-property transformation, no treatment.
//  ba-2 = representative pair (treated "before" generated from a finished shot).
async function buildBeforeAfter() {
  const W = 1280, H = 760;
  const fit = src => sharp(src).resize({ width: W, height: H, fit: 'cover', position: 'centre' });

  // 1) Genuine before/after — same house, real photos
  for (const side of ['before', 'after']) {
    const srcFile = side === 'before' ? 'before01.png' : 'after01.png';
    await fit(srcFile).webp({ quality: 80 }).toFile(`${OUT}/ba-1-${side}.webp`);
    await fit(srcFile).jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}/ba-1-${side}.jpg`);
  }

  // 2) Representative pair (block paving) with generated weathered "before"
  // Weathered/neglected look: faded grey-green wash + mossy mottling + soft vignette
  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <radialGradient id="v" cx="50%" cy="42%" r="78%">
           <stop offset="58%" stop-color="rgba(0,0,0,0)"/>
           <stop offset="100%" stop-color="rgba(38,40,30,0.42)"/>
         </radialGradient>
       </defs>
       <rect width="100%" height="100%" fill="rgba(122,126,104,0.30)"/>
       <g fill="rgba(84,94,70,0.26)">
         <ellipse cx="${W*0.30}" cy="${H*0.74}" rx="${W*0.22}" ry="${H*0.16}"/>
         <ellipse cx="${W*0.68}" cy="${H*0.82}" rx="${W*0.26}" ry="${H*0.14}"/>
         <ellipse cx="${W*0.50}" cy="${H*0.60}" rx="${W*0.30}" ry="${H*0.12}"/>
         <ellipse cx="${W*0.14}" cy="${H*0.55}" rx="${W*0.12}" ry="${H*0.10}"/>
       </g>
       <rect width="100%" height="100%" fill="rgba(248,244,228,0.10)"/>
       <rect width="100%" height="100%" fill="url(#v)"/>
     </svg>`
  );
  const rep = [{ src: 'hero.png', name: 'ba-2' }]; // block paving
  for (const p of rep) {
    await fit(p.src).webp({ quality: 78 }).toFile(`${OUT}/${p.name}-after.webp`);
    await fit(p.src).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/${p.name}-after.jpg`);
    // before = faded, sun-bleached, mossy/neglected treatment
    const beforeBuf = await fit(p.src)
      .modulate({ saturation: 0.26, brightness: 1.05 })
      .linear(0.80, 14)
      .blur(1.5)
      .composite([{ input: overlay, blend: 'over' }])
      .toBuffer();
    await sharp(beforeBuf).webp({ quality: 72 }).toFile(`${OUT}/${p.name}-before.webp`);
    await sharp(beforeBuf).jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${p.name}-before.jpg`);
  }
  console.log('before/after done (1 real + 1 representative)');
}

// Transparent logo mark (knock out near-white background)
async function buildLogo() {
  const { data, info } = await sharp('logo.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 238 && g > 238 && b > 238) data[i + 3] = 0;
  }
  const trans = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  await trans.clone().trim({ threshold: 1 }).resize({ width: 640 }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-mark.png`);
  // White-cream chip version not needed; footer uses a light chip.
  console.log('logo done');
}

// Favicons from the DD monogram (upper-centre region of the wordmark)
async function buildFavicons() {
  // crop the monogram: roughly centred horizontally, upper band
  const meta = await sharp('logo.png').metadata();
  const cw = Math.round(meta.width * 0.42);
  const ch = Math.round(meta.height * 0.50);
  const left = Math.round((meta.width - cw) / 2);
  const top = Math.round(meta.height * 0.035);
  // make white transparent on the crop
  const cropped = await sharp('logo.png').extract({ left, top, width: cw, height: ch }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = cropped;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 238 && g > 238 && b > 238) data[i + 3] = 0;
  }
  const markBuf = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const markTrimmed = await sharp(markBuf).trim({ threshold: 1 }).png().toBuffer();
  for (const size of [32, 180, 512]) {
    const pad = Math.round(size * 0.14);
    await sharp({ create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } })
      .composite([{ input: await sharp(markTrimmed).resize({ width: size - pad * 2, height: size - pad * 2, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), gravity: 'centre' }])
      .png().toFile(`${OUT}/favicon-${size}.png`);
  }
  console.log('favicons done');
}

// Open Graph share image 1200x630
async function buildOG() {
  const W = 1200, H = 630;
  const bg = await sharp('hero2.png').resize({ width: W, height: H, fit: 'cover', position: 'centre' })
    .modulate({ brightness: 0.92 }).toBuffer();
  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
           <stop offset="0%" stop-color="rgba(20,24,27,0.92)"/>
           <stop offset="60%" stop-color="rgba(20,24,27,0.55)"/>
           <stop offset="100%" stop-color="rgba(20,24,27,0.25)"/>
         </linearGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
       <rect x="64" y="470" width="64" height="6" rx="3" fill="#c2a05c"/>
       <text x="64" y="430" font-family="Arial, sans-serif" font-size="74" font-weight="800" fill="#ffffff">Driveways Derbyshire</text>
       <text x="64" y="520" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="#e7e3d8">Block Paving &#183; Resin &#183; Tarmac &#183; Gravel</text>
       <text x="64" y="566" font-family="Arial, sans-serif" font-size="28" font-weight="500" fill="#c2a05c">Free quotes across Derbyshire &#183; Fully insured &#183; 10-year guarantee</text>
     </svg>`
  );
  await sharp(bg).composite([{ input: overlay, blend: 'over' }]).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/og-image.jpg`);
  console.log('og done');
}

await Promise.all([...HEROES.map(buildHero), buildBeforeAfter(), buildLogo(), buildFavicons(), buildOG()]);
console.log('ALL DONE');
