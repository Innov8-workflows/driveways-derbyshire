# Driveways Derbyshire

A fast, conversion-focused, lead-generation website for the **Driveways Derbyshire** brand
(block paving, resin, tarmac & gravel driveways across Derbyshire).

Static site — `index.html` + `faq.html` + `assets/`. No framework, no build step required to host it.

---

## 📋 Go-live checklist (placeholders to replace)

Everything below is a placeholder. Do a project-wide find & replace, then you're live.

| What | Current placeholder | Where |
|------|--------------------|-------|
| **Phone (display)** | `07700 900 482` | `index.html`, `faq.html` (header, hero, CTAs, footer) |
| **Phone (tel: link)** | `+447700900482` | same files |
| **WhatsApp** | `447700900482` | contact section `wa.me/...` link |
| **Email** | `quotes@driveways-derbyshire.co.uk` | contact + footer + schema |
| **Domain / URLs** | `https://driveways-derbyshire.co.uk/` | `<link canonical>`, Open Graph, JSON-LD |
| **Form delivery** | `YOUR_WEB3FORMS_ACCESS_KEY` | `data-access-key` on `#quote-form` |
| **Owner name** | `[Owner Name]` | About section |
| **Owner / team photo** | logo placeholder frame | About section (`.about-portrait`) |
| **Reviews** | 5 sample testimonials + `4.9` rating | Reviews section — *replace with genuine Google reviews before going live* |
| **Accreditation badges** | generic SVG badges | Trust + footer — swap for real logos you actually hold (Checkatrade, TrustMark, etc.) |
| **Social links** | `#` | footer Facebook/Instagram |
| **Stats** | `15+ yrs`, `1,200+`, `4.9★` | "Why choose us" — set to true figures |

> The phone number uses Ofcom's reserved "fictional" range (07700 900xxx) so it can never
> ring a real person by accident. Swap in your real tracking number.

### Lead capture form
The quote form posts to [Web3Forms](https://web3forms.com) (free). Until you add a real
`access_key` it runs in **demo mode** (shows the success message without sending). To go live:
1. Get a free access key at web3forms.com (enter the inbox you want leads to land in).
2. Replace `YOUR_WEB3FORMS_ACCESS_KEY` in `index.html`.

---

## 🖥️ Preview locally
```bash
node server.js          # serves the site at http://localhost:4173
```

## 🚀 Deploy
It's a static site — upload these to any host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, cPanel):
```
index.html  faq.html  assets/
```
`server.js`, `optimise.mjs`, `package.json` and `node_modules/` are dev-only and don't need uploading.

## 🖼️ Images
Source images live at the project root (`hero.png`, `hero2.png`, `hero3.png`, `logo.png`).
`optimise.mjs` turns them into the web-ready WebP/JPG sets, the transparent logo, favicons,
the before/after pairs and the OG image in `assets/img/`. To regenerate after swapping a source:
```bash
npm install      # one-time (installs sharp)
node optimise.mjs
```
The first before/after slider uses a **real matched pair** — `before01.png` / `after01.png`
(same property). To add more real pairs, drop them in the root and extend the `buildBeforeAfter()`
mapping in `optimise.mjs`, then re-run it. The second slider is a representative example.

## 🎬 Hero video & animated before/after
The site has two optional, drop-in video slots (both **fall back gracefully** if no file is present):

| File | Effect | Fallback if missing |
|------|--------|---------------------|
| `assets/video/hero.mp4` | Plays muted/looping behind the hero headline | The rotating image slider |
| `assets/video/transformation.mp4` | Replaces the featured before/after animation, scroll-triggered play | The CSS "tile-lay" animation |

There's nothing to wire up — drop a file in and reload. Keep them **muted-friendly, ~1080p, MP4 (H.264), under ~5 MB** for the hero (page speed matters for ranking).

**A hero video is already included** (`assets/video/hero.mp4`, ~3.6 MB) — a Ken Burns slideshow of the three hero photos, generated with ffmpeg. To regenerate it (e.g. after swapping the hero images):
```bash
node make-hero-video.mjs      # requires ffmpeg on PATH
```
> **Testing video locally:** open the site via the dev server (`node server.js` → http://localhost:4173), **not** by double-clicking `index.html`. Browsers block `<video>`/range requests on `file://`. The dev server now supports byte-range requests so video plays correctly. The hero video autoplays for everyone; the decorative scroll animation still respects `prefers-reduced-motion`.

**The "build-up" animation** (Before & After section) is pure CSS/JS — it slices the finished-drive
photo into a grid and lays the tiles in from the road up to the house on scroll, with a **Replay** button.
Tweak `data-cols` / `data-rows` on `.buildup__stage` for finer/coarser "bricks." To get the slicker
*real* version, generate a before→after clip (Kling / Luma / Runway — first-frame + last-frame) and
drop it in as `transformation.mp4`.

---

## Section structure (home)
Navbar → Hero (rotating slider) → Trust signals → Services → Before & After (reveal sliders) →
Project gallery (lightbox) → Why choose us → Reviews (autoroll carousel) → About / Meet the owner →
Areas covered → Process → Contact form → Final CTA → Footer. FAQ lives on its own page (`faq.html`).
