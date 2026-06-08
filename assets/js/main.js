/* ==========================================================================
   Driveways Derbyshire — interactions
   ========================================================================== */
(function () {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- header scroll state + to-top ---------- */
  const header = $('.header');
  const toTop = $('.to-top');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 12);
    if (toTop) toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- mobile menu ---------- */
  const body = document.body;
  const openMenu = () => body.classList.add('menu-open');
  const closeMenu = () => body.classList.remove('menu-open');
  $('.nav-toggle')?.addEventListener('click', () => body.classList.toggle('menu-open'));
  $('.nav-overlay')?.addEventListener('click', closeMenu);
  $$('.nav-panel a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- scrollspy ---------- */
  const navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length) {
    const map = navLinks.map(a => ({ a, sec: $(a.getAttribute('href')) })).filter(o => o.sec);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = '#' + en.target.id;
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach(o => spy.observe(o.sec));
  }

  /* ---------- scroll reveal ---------- */
  const revealEls = $$('.reveal');
  if (revealEls.length) {
    if (reduce) { revealEls.forEach(el => el.classList.add('in')); }
    else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ---------- Stat count-up ---------- */
  const counters = $$('.stat__num');
  if (counters.length) {
    const fmt = (n, dec) => {
      const parts = n.toFixed(dec).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');   // thousands separator
      return parts.join('.');
    };
    const runCount = el => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      if (isNaN(target)) return;   // count-up runs even under reduced-motion (explicitly requested)
      const dur = 1700, ease = t => 1 - Math.pow(1 - t, 3);   // ease-out: fast, then settles
      let start = null;
      const step = ts => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = fmt(target * ease(p), dec);
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target, dec);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { runCount(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- HERO slider ---------- */
  const hero = $('.hero');
  if (hero) {
    const slides = $$('.hero__slide', hero);
    const dotsWrap = $('.hero__dots', hero);
    let i = slides.findIndex(s => s.classList.contains('is-active'));
    if (i < 0) i = 0;
    let timer;
    const dots = slides.map((_, idx) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
      b.addEventListener('click', () => { go(idx); restart(); });
      dotsWrap?.appendChild(b);
      return b;
    });
    const go = n => {
      slides[i].classList.remove('is-active'); dots[i]?.classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active'); dots[i]?.classList.add('is-active');
    };
    const next = () => go(i + 1), prev = () => go(i - 1);
    go(i);
    const start = () => { if (slides.length > 1) timer = setInterval(next, 6000); };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };
    $('.hero__next', hero)?.addEventListener('click', () => { next(); restart(); });
    $('.hero__prev', hero)?.addEventListener('click', () => { prev(); restart(); });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  }

  /* ---------- BEFORE / AFTER reveal sliders ---------- */
  $$('.ba').forEach(ba => {
    const before = $('.ba__before', ba);
    const handle = $('.ba__handle', ba);
    let dragging = false;
    const apply = pct => {
      pct = Math.max(2, Math.min(98, pct));
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    };
    const set = clientX => {
      const r = ba.getBoundingClientRect();
      apply(((clientX - r.left) / r.width) * 100);
    };
    const down = e => { dragging = true; ba.classList.add('dragging'); set((e.touches ? e.touches[0] : e).clientX); };
    const move = e => { if (!dragging) return; set((e.touches ? e.touches[0] : e).clientX); };
    const up = () => { dragging = false; ba.classList.remove('dragging'); };
    ba.addEventListener('mousedown', down);
    ba.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    // keyboard
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '100'); handle.setAttribute('aria-valuenow', '50');
    handle.addEventListener('keydown', e => {
      const cur = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft') { apply(cur - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { apply(cur + 4); e.preventDefault(); }
    });
  });

  /* ---------- REVIEWS slider ---------- */
  const reviews = $('.reviews');
  if (reviews) {
    const track = $('.reviews__track', reviews);
    const cards = $$('.review-card', track);
    const dotsWrap = $('.reviews__dots', reviews);
    let idx = 0, timer;
    const dots = cards.map((_, n) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Review ' + (n + 1));
      b.addEventListener('click', () => { goTo(n); restart(); });
      dotsWrap?.appendChild(b); return b;
    });
    const goTo = n => {
      idx = (n + cards.length) % cards.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === idx));
    };
    const next = () => goTo(idx + 1), prev = () => goTo(idx - 1);
    goTo(0);
    const start = () => { timer = setInterval(next, 5500); };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };
    $('.reviews .next')?.addEventListener('click', () => { next(); restart(); });
    $('.reviews .prev')?.addEventListener('click', () => { prev(); restart(); });
    reviews.addEventListener('mouseenter', stop);
    reviews.addEventListener('mouseleave', start);
    // swipe
    let sx = 0, dx = 0, swiping = false;
    const vp = $('.reviews__viewport', reviews);
    vp.addEventListener('touchstart', e => { sx = e.touches[0].clientX; swiping = true; stop(); }, { passive: true });
    vp.addEventListener('touchmove', e => { if (swiping) dx = e.touches[0].clientX - sx; }, { passive: true });
    vp.addEventListener('touchend', () => {
      if (Math.abs(dx) > 45) (dx < 0 ? next() : prev());
      dx = 0; swiping = false; start();
    });
    start();
  }

  /* ---------- GALLERY lightbox ---------- */
  const lb = $('.lightbox');
  if (lb) {
    const items = $$('.gallery__item');
    const img = $('.lightbox img', lb);
    const cap = $('.lightbox__cap', lb);
    let cur = 0;
    const srcs = items.map(it => ({ src: it.dataset.full || $('img', it)?.src, cap: it.dataset.caption || '' }));
    const show = n => { cur = (n + srcs.length) % srcs.length; img.src = srcs[cur].src; cap.textContent = srcs[cur].cap; };
    const open = n => { show(n); lb.classList.add('open'); body.style.overflow = 'hidden'; };
    const close = () => { lb.classList.remove('open'); body.style.overflow = ''; };
    items.forEach((it, n) => it.addEventListener('click', () => open(n)));
    $('.lightbox__close', lb)?.addEventListener('click', close);
    $('.lightbox__next', lb)?.addEventListener('click', () => show(cur + 1));
    $('.lightbox__prev', lb)?.addEventListener('click', () => show(cur - 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item);
    const a = $('.faq-a', item);
    q?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      $$('.faq-item.open').forEach(o => { o.classList.remove('open'); $('.faq-a', o).style.maxHeight = null; q?.setAttribute('aria-expanded', 'false'); });
      if (!isOpen) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; q.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Optional videos (auto-activate only if a clip is present) ---------- */
  function tryVideo(video, onReady) {
    if (!video) return;            // muted ambient video plays regardless of reduced-motion
    const src = video.dataset.src;
    if (!src) return;
    // Load the <video> directly (no HEAD pre-check — that was fragile). If the file
    // is missing the element fires 'error' and we simply keep the fallback (slider / tile-lay).
    video.addEventListener('canplay', () => {
      const p = video.play();
      if (p && p.then) p.then(onReady).catch(() => {}); // autoplay blocked → keep the fallback
      else onReady();
    }, { once: true });
    video.src = src;
    video.load();
  }
  // hero background video
  tryVideo($('.hero__video'), () => $('.hero__videowrap')?.classList.add('is-ready'));

  /* ---------- Featured "build-up" transformations (tile-lay and/or video) ---------- */
  $$('.buildup__stage').forEach(stage => {
    const grid = $('.buildup__grid', stage);
    const after = stage.dataset.after;
    // CSS tile-lay animation — only when a grid + source image are present
    if (grid && after) {
      let cols = parseInt(stage.dataset.cols || '16', 10);
      let rows = parseInt(stage.dataset.rows || '9', 10);
      if (window.innerWidth < 620) { cols = Math.round(cols * 0.7); rows = Math.round(rows * 0.78); }
      grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
      grid.style.gridTemplateRows = `repeat(${rows},1fr)`;
      const bgSize = `${cols * 100}% ${rows * 100}%`;
      const SWEEP = 1.4;
      const denomC = (cols - 1) || 1, denomR = (rows - 1) || 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = document.createElement('div');
          t.className = 'buildup__tile';
          t.style.backgroundImage = `url("${after}")`;
          t.style.backgroundSize = bgSize;
          t.style.backgroundPosition = `${(c / denomC) * 100}% ${(r / denomR) * 100}%`;
          const up = (rows - 1 - r) / denomR;   // bottom row (the road) lays first
          const lean = c / denomC;              // slight left→right sweep
          const delay = (up * 0.82 + lean * 0.18) * SWEEP + Math.random() * 0.08;
          t.style.setProperty('--d', delay.toFixed(3) + 's');
          grid.appendChild(t);
        }
      }
      if (reduce) {
        stage.classList.add('no-anim', 'played');
      } else {
        const play = () => {
          stage.classList.add('resetting');
          stage.classList.remove('is-building', 'played');
          void stage.offsetWidth;
          stage.classList.remove('resetting');
          void stage.offsetWidth;
          stage.classList.add('is-building');
          setTimeout(() => stage.classList.add('played'), (SWEEP + 0.7) * 1000);
        };
        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(e => { if (e.isIntersecting) { play(); obs.unobserve(stage); } });
        }, { threshold: 0.35 });
        io.observe(stage);
        $('.buildup__replay', stage)?.addEventListener('click', play);
      }
    }
    // drop-in video for this stage (replaces the animation / poster), scroll-triggered
    tryVideo($('.buildup__video', stage), () => {
      stage.classList.add('has-video');
      const v = $('.buildup__video', stage);
      const vio = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
      }), { threshold: 0.3 });
      vio.observe(v);
    });
  });

  /* ---------- CONTACT form (Web3Forms) ---------- */
  const form = $('#quote-form');
  if (form) {
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    const btnText = btn?.textContent;
    const setStatus = (type, msg) => {
      status.className = 'form-status show ' + type;
      status.innerHTML = (type === 'ok'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>') + '<span>' + msg + '</span>';
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.querySelector('.hp')?.value) return; // honeypot
      const key = form.dataset.accessKey || '';
      btn.disabled = true; btn.textContent = 'Sending…';
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        // Demo mode while no real Web3Forms key is set
        if (!key || key.startsWith('YOUR_')) {
          await new Promise(r => setTimeout(r, 700));
          setStatus('ok', 'Thanks! Your request has been received — we’ll be in touch shortly. (Demo mode: add your Web3Forms key to receive real submissions.)');
          form.reset();
        } else {
          const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ access_key: key, subject: 'New driveway quote request — Driveways Derbyshire', ...data })
          });
          const out = await res.json();
          if (out.success) { setStatus('ok', 'Thank you! Your free quote request has been sent — we’ll be in touch shortly.'); form.reset(); }
          else throw new Error(out.message || 'failed');
        }
      } catch (err) {
        setStatus('err', 'Sorry, something went wrong. Please call us on the number above and we’ll sort it straight away.');
      } finally {
        btn.disabled = false; btn.textContent = btnText;
      }
    });
  }
})();
