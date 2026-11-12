/* =========================================================
   KBT Inc. — interactions
   GSAP + ScrollTrigger + Lenis, Canvas hero background
   ========================================================= */
(function () {
  'use strict';

  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var body = document.body;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  if (!hasGSAP) {
    root.classList.add('no-intro');
  } else if (hasST) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.25,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4
    });
    if (hasGSAP) {
      if (hasST) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var rafLoop = function (time) { lenis.raf(time); requestAnimationFrame(rafLoop); };
      requestAnimationFrame(rafLoop);
    }
  }

  function lockScroll(lock) {
    if (lenis) { lock ? lenis.stop() : lenis.start(); }
    body.classList.toggle('is-locked', lock);
  }

  function scrollToTarget(target) {
    var headerOffset = -64;
    if (lenis) {
      lenis.scrollTo(target, { offset: headerOffset, duration: 1.6 });
    } else {
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      var y = el ? el.getBoundingClientRect().top + window.pageYOffset + headerOffset : 0;
      window.scrollTo({ top: target === 0 ? 0 : y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ---------------- Header ---------------- */
  var header = document.getElementById('header');
  function onScrollHeader() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > 40);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------- Anchor links ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(href === '#top' ? 0 : target);
    });
  });

  /* ---------------- Mobile menu ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  function closeMenu() {
    if (!body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    lockScroll(false);
  }
  menuBtn.addEventListener('click', function () {
    var open = !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileNav.setAttribute('aria-hidden', String(!open));
    lockScroll(open);
    if (open && hasGSAP) {
      gsap.fromTo(mobileNav.querySelectorAll('li'), { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out', delay: 0.1 });
    }
  });

  /* =========================================================
     Hero canvas — kabuto geometry + particles of light
     ========================================================= */
  var canvas = document.getElementById('heroCanvas');
  var heroSection = document.getElementById('hero');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1, ox = 0, oy = 0, S = 0;
  var particles = [];
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var scrollP = 0;
  var heroVisible = true;
  var GOLD = '197,160,89';
  var WHITE = '247,247,245';

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = heroSection.clientWidth;
    H = heroSection.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var mobile = W < 768;
    ox = mobile ? W * 0.5 : W * 0.72;
    oy = mobile ? H * 0.3 : H * 0.56;
    S = Math.min(W * (mobile ? 0.38 : 0.3), H * 0.36);
    var count = Math.min(240, Math.floor((W * H) / 7000));
    particles = [];
    for (var i = 0; i < count; i++) particles.push(makeParticle(true));
  }

  function makeParticle(scatter) {
    var a = Math.random() * Math.PI * 2;
    var r = scatter ? Math.random() * Math.max(W, H) * 0.8 : Math.random() * S * 0.2;
    return {
      a: a,
      r: r,
      v: 0.08 + Math.random() * 0.35,
      size: 0.3 + Math.random() * 1.4,
      depth: 0.2 + Math.random() * 0.8,
      gold: Math.random() < 0.45,
      phase: Math.random() * Math.PI * 2,
      tw: 0.5 + Math.random() * 1.5
    };
  }

  // Normalized kabuto geometry (unit space; y up = negative)
  function drawKabuto(t) {
    var breathe = 1 + Math.sin(t * 0.0006) * 0.012;
    var tiltX = mouse.x * 0.04;
    var tiltY = mouse.y * 0.03;
    var k = S * breathe;

    ctx.save();
    ctx.translate(ox + mouse.x * 18, oy + mouse.y * 14 - scrollP * 80);
    ctx.rotate(tiltX * 0.5);
    ctx.lineCap = 'round';

    // Bowl (hachi) — nested arcs
    for (var i = 0; i < 6; i++) {
      var f = 1 - i * 0.13;
      ctx.beginPath();
      ctx.moveTo(-0.62 * k * f, 0.18 * k);
      ctx.bezierCurveTo(-0.62 * k * f, -0.38 * k * f + tiltY * k * 0.1, -0.3 * k * f, -0.56 * k * f, 0, -0.56 * k * f);
      ctx.bezierCurveTo(0.3 * k * f, -0.56 * k * f, 0.62 * k * f, -0.38 * k * f - tiltY * k * 0.1, 0.62 * k * f, 0.18 * k);
      ctx.strokeStyle = 'rgba(' + WHITE + ',' + (0.11 - i * 0.014) + ')';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // Ribs (suji) — radial lines on the bowl
    for (var j = -6; j <= 6; j++) {
      var p = j / 6;
      ctx.beginPath();
      ctx.moveTo(0, -0.56 * k);
      ctx.quadraticCurveTo(p * 0.48 * k, -0.48 * k, p * 0.62 * k, 0.18 * k);
      ctx.strokeStyle = 'rgba(' + WHITE + ',0.045)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Brim (shikoro) — layered plates
    for (var m = 0; m < 4; m++) {
      var y0 = 0.18 * k + m * 0.085 * k;
      var w0 = 0.78 * k + m * 0.08 * k;
      ctx.beginPath();
      ctx.moveTo(-w0, y0);
      ctx.quadraticCurveTo(0, y0 + 0.16 * k, w0, y0);
      ctx.strokeStyle = 'rgba(' + WHITE + ',' + (0.1 - m * 0.018) + ')';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // Kuwagata (crescent horns) — gold, with flowing dash
    var dash = (t * 0.02) % 400;
    ctx.setLineDash([240, 160]);
    ctx.lineDashOffset = -dash;
    for (var s = -1; s <= 1; s += 2) {
      for (var n = 0; n < 3; n++) {
        var g = 1 + n * 0.06;
        ctx.beginPath();
        ctx.moveTo(0, -0.56 * k);
        ctx.bezierCurveTo(s * 0.22 * k * g, -1.0 * k * g, s * 0.75 * k * g, -1.12 * k * g, s * 1.02 * k * g, -0.86 * k * g);
        ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.55 - n * 0.17) + ')';
        ctx.lineWidth = n === 0 ? 1 : 0.6;
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Crest jewel
    var glow = ctx.createRadialGradient(0, -0.56 * k, 0, 0, -0.56 * k, 0.12 * k);
    glow.addColorStop(0, 'rgba(' + GOLD + ',0.55)');
    glow.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -0.56 * k, 0.12 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(' + GOLD + ',0.95)';
    ctx.beginPath();
    ctx.arc(0, -0.56 * k, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Streams of light flowing from Japan to the world
  function drawStreams(t) {
    ctx.save();
    ctx.translate(mouse.x * 10, mouse.y * 8 - scrollP * 50);
    for (var i = 0; i < 7; i++) {
      var ang = -Math.PI * 0.95 + i * 0.28 + Math.sin(t * 0.0002 + i) * 0.04;
      var len = Math.max(W, H) * 1.1;
      var ex = ox + Math.cos(ang) * len;
      var ey = oy + Math.sin(ang) * len * 0.6 + H * 0.25;
      var cx1 = ox + Math.cos(ang + 0.5) * len * 0.3;
      var cy1 = oy + Math.sin(ang + 0.5) * len * 0.2 + Math.sin(t * 0.0004 + i * 2) * 30;
      var grad = ctx.createLinearGradient(ox, oy, ex, ey);
      grad.addColorStop(0, 'rgba(' + GOLD + ',0.0)');
      grad.addColorStop(0.15, 'rgba(' + GOLD + ',0.16)');
      grad.addColorStop(1, 'rgba(' + GOLD + ',0)');
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(cx1, cy1, ex, ey);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = -(t * 0.015 + i * 20);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawParticles(t) {
    var maxR = Math.max(W, H) * 0.9;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.r += p.v * (1 + scrollP * 2);
      p.a += 0.00025 * p.depth;
      if (p.r > maxR) { particles[i] = makeParticle(false); continue; }
      var wob = Math.sin(t * 0.001 * p.tw + p.phase) * 6 * p.depth;
      var x = ox + Math.cos(p.a) * p.r + wob + mouse.x * 40 * p.depth;
      var y = oy + Math.sin(p.a) * p.r * 0.72 + Math.cos(t * 0.0008 + p.phase) * 4 + mouse.y * 30 * p.depth - scrollP * 140 * p.depth;
      var life = Math.min(1, p.r / (S * 0.3)) * (1 - p.r / maxR);
      var twinkle = 0.55 + 0.45 * Math.sin(t * 0.002 * p.tw + p.phase);
      var alpha = life * twinkle * (p.gold ? 0.85 : 0.6);
      if (alpha < 0.02) continue;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (p.gold ? GOLD : WHITE) + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }
  }

  var canvasAlpha = 1;
  function frame(t) {
    requestAnimationFrame(frame);
    if (!heroVisible) return;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = canvasAlpha * (1 - scrollP * 0.7);
    drawStreams(t);
    drawKabuto(t);
    drawParticles(t);
    ctx.globalAlpha = 1;
  }

  function startCanvas() {
    resize();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    window.addEventListener('pointermove', function (e) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('scroll', function () {
      scrollP = Math.min(1, Math.max(0, (window.pageYOffset || 0) / (H || 1)));
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(heroSection);
    }
    if (reduceMotion) {
      // Static render
      drawStreams(0); drawKabuto(0); drawParticles(0);
    } else {
      requestAnimationFrame(frame);
    }
  }
  startCanvas();

  /* =========================================================
     Intro + hero entrance
     ========================================================= */
  function heroEntrance(delay) {
    if (!hasGSAP) return;
    var tl = gsap.timeline({ delay: delay || 0 });
    tl.fromTo('.hero-title .line-inner', { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out' })
      .fromTo('.hero-fade', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '-=1.1')
      .fromTo('#header', { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }, '-=1.2');
    return tl;
  }

  function runIntro() {
    var intro = document.getElementById('intro');
    if (!hasGSAP) return;
    gsap.set('.hero-title .line-inner', { yPercent: 110 });
    gsap.set('.hero-fade', { opacity: 0 });
    gsap.set('#header', { opacity: 0 });

    if (reduceMotion) {
      intro.remove();
      gsap.set('.hero-title .line-inner', { yPercent: 0 });
      gsap.set('.hero-fade, #header', { opacity: 1 });
      return;
    }

    lockScroll(true);
    window.scrollTo(0, 0);
    var tl = gsap.timeline({
      onComplete: function () { intro.remove(); lockScroll(false); if (hasST) ScrollTrigger.refresh(); }
    });
    tl.fromTo('.intro-char', { yPercent: 100, opacity: 0, filter: 'blur(6px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.08, ease: 'expo.out' })
      .to('.intro-line', { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 0.15)
      .fromTo('.intro-sub', { opacity: 0, letterSpacing: '0.8em' }, { opacity: 1, letterSpacing: '0.5em', duration: 0.7, ease: 'power2.out' }, 0.35)
      .to('.intro-inner', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' }, 1.05)
      .to('.intro-top', { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, 1.15)
      .to('.intro-bottom', { yPercent: 100, duration: 0.9, ease: 'expo.inOut' }, 1.15)
      .fromTo('#heroCanvas', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'expo.out' }, 1.15)
      .add(heroEntrance(), 1.45);
  }

  /* =========================================================
     Scroll animations
     ========================================================= */
  function scrollAnimations() {
    if (!hasST || reduceMotion) return;

    // Headings emerging through a mask
    gsap.utils.toArray('.mask-reveal').forEach(function (el) {
      gsap.fromTo(el.firstElementChild,
        { yPercent: 105, clipPath: 'inset(100% 0% 0% 0%)' },
        { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    // Text blocks, stagger by batch
    gsap.set('.reveal-up', { opacity: 0, y: 40 });
    ScrollTrigger.batch('.reveal-up', {
      start: 'top 88%',
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', overwrite: true });
      }
    });

    // Business cards
    gsap.fromTo('.biz-card', { opacity: 0, y: 70 },
      { opacity: 1, y: 0, duration: 1.3, stagger: 0.15, ease: 'expo.out',
        scrollTrigger: { trigger: '.business-grid', start: 'top 80%' } });

    // Kabuto line drawing in Philosophy
    var paths = document.querySelectorAll('.kabuto-figure .draw');
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(paths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.08, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.kabuto-figure', start: 'top 85%' } });

    gsap.fromTo('.gold-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.gold-rule', start: 'top 90%' } });

    // Global band — parallax marquee + route drawing
    gsap.fromTo('.marquee-track', { xPercent: 0 }, { xPercent: -30, ease: 'none',
      scrollTrigger: { trigger: '#global', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.marquee', { yPercent: -30 }, { yPercent: -70, ease: 'none',
      scrollTrigger: { trigger: '#global', start: 'top bottom', end: 'bottom top', scrub: true } });

    var routes = document.querySelectorAll('#routeMap .route');
    routes.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(routes, { strokeDashoffset: 0, duration: 2, stagger: 0.25, ease: 'power3.inOut',
      scrollTrigger: { trigger: '#routeMap', start: 'top 75%' } });
    gsap.from('#routeMap .node, #routeMap .map-label', { opacity: 0, duration: 1, stagger: 0.08, delay: 0.6,
      scrollTrigger: { trigger: '#routeMap', start: 'top 75%' } });
  }

  /* ---------------- Card hover glow position ---------------- */
  document.querySelectorAll('.biz-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* =========================================================
     Contact form
     ========================================================= */
  var form = document.getElementById('contactForm');
  var done = document.getElementById('formDone');
  var errorEl = form.querySelector('.form-error');

  // Web3Forms → info@kbt-inc.jp
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var loadedAt = Date.now();
  var COOLDOWN_MS = 60 * 1000;

  function resetCaptcha() { if (window.hcaptcha) { try { window.hcaptcha.reset(); } catch (_) {} } }
  function urlCount(v) { return (v.match(/https?:\/\/|www\./gi) || []).length; }

  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field');
    if (f) f.classList.remove('is-invalid');
    errorEl.textContent = '';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';

    // Honeypot: 人間には見えない欄にチェックがあれば bot → 成功したふりをして何も送らない
    if (form.botcheck.checked) { showDone(); return; }

    var invalid = [];
    form.querySelectorAll('[required]').forEach(function (input) {
      var v = input.type === 'checkbox' ? '' : input.value.trim();
      var ok;
      if (input.type === 'checkbox') ok = input.checked;
      else if (input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      else if (input.name === 'message') ok = v.length >= 10 && urlCount(v) <= 2;
      else ok = v !== '';
      var field = input.closest('.field');
      var fieldOk = input.type === 'checkbox'
        ? Array.prototype.every.call(field.querySelectorAll('input[type=checkbox][required]'), function (c) { return c.checked; })
        : ok;
      field.classList.toggle('is-invalid', !fieldOk);
      if (!ok) invalid.push(input);
    });
    if (invalid.length) {
      errorEl.textContent = '必須項目を正しくご入力ください（お問い合わせ内容は10文字以上・URLは2件まで）。';
      invalid[0].focus();
      return;
    }

    // ページを開いてから極端に早い送信は自動入力とみなす
    if (Date.now() - loadedAt < 4000) { errorEl.textContent = '入力内容をご確認のうえ、もう一度送信してください。'; return; }

    // 連続送信の防止（同じブラウザから60秒以内）
    var last = 0;
    try { last = Number(localStorage.getItem('kbt_contact_sent_at')) || 0; } catch (_) {}
    if (Date.now() - last < COOLDOWN_MS) { errorEl.textContent = '先ほど送信済みです。しばらく時間をおいてから再度お試しください。'; return; }

    var key = form.access_key.value;
    if (!key || key.indexOf('YOUR_') === 0) {
      errorEl.textContent = '現在フォームの準備中です。恐れ入りますが時間をおいて再度お試しください。';
      console.warn('Web3Forms access key is not set.');
      return;
    }

    var tokenEl = form.querySelector('[name="h-captcha-response"]');
    if (!tokenEl || !tokenEl.value) { errorEl.textContent = '「私はロボットではありません」の確認を完了してください。'; return; }

    var topicEl = form.elements.topic;
    form.subject.value = '【KBT お問い合わせ】' + (topicEl ? topicEl.value : 'その他') + ' - ' + form.elements.name.value.trim() + '様';

    var btn = form.querySelector('.submit-btn');
    btn.classList.add('is-sending');
    btn.querySelector('.label').textContent = 'SENDING…';

    fetch(ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data.success) throw new Error(data.message || 'send failed');
        });
      })
      .then(function () {
        try { localStorage.setItem('kbt_contact_sent_at', String(Date.now())); } catch (_) {}
        showDone();
        resetCaptcha();
      })
      .catch(function () {
        errorEl.textContent = '送信に失敗しました。お手数ですが時間をおいて再度お試しください。';
        resetCaptcha();
      })
      .finally(function () {
        btn.classList.remove('is-sending');
        btn.querySelector('.label').textContent = 'SEND MESSAGE';
      });
  });

  function showDone() {
    if (!hasGSAP) { form.hidden = true; done.hidden = false; return; }
    gsap.to(form, { opacity: 0, y: -20, duration: 0.6, ease: 'expo.in', onComplete: function () {
      form.hidden = true;
      done.hidden = false;
      var tl = gsap.timeline();
      tl.set(done, { opacity: 1 })
        .to('.done-mark circle', { strokeDashoffset: 0, duration: 1.2, ease: 'expo.inOut' })
        .to('.done-mark path', { strokeDashoffset: 0, duration: 0.7, ease: 'expo.out' }, '-=0.4')
        .fromTo('.done-en, .done-jp, #formReset', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'expo.out' }, '-=0.5');
      if (hasST) ScrollTrigger.refresh();
    } });
  }

  document.getElementById('formReset').addEventListener('click', function () {
    form.reset();
    done.hidden = true;
    form.hidden = false;
    if (hasGSAP) {
      gsap.set('.done-mark circle', { strokeDashoffset: 227 });
      gsap.set('.done-mark path', { strokeDashoffset: 50 });
      gsap.fromTo(form, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' });
    }
  });

  /* =========================================================
     Privacy modal
     ========================================================= */
  var modal = document.getElementById('privacyModal');
  var openBtn = document.getElementById('privacyOpen');
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    lockScroll(true);
    modal.querySelector('.modal-panel').scrollTop = 0;
    if (hasGSAP) {
      gsap.to(modal.querySelector('.modal-backdrop'), { opacity: 1, duration: 0.6, ease: 'power2.out' });
      gsap.fromTo(modal.querySelector('.modal-panel'), { opacity: 0, y: 40, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' });
      gsap.fromTo(modal.querySelectorAll('.policy > *'), { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.02, ease: 'expo.out', delay: 0.15 });
    } else {
      modal.querySelector('.modal-backdrop').style.opacity = 1;
      modal.querySelector('.modal-panel').style.opacity = 1;
    }
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    var finish = function () { modal.hidden = true; lockScroll(false); if (lastFocus) lastFocus.focus(); };
    if (hasGSAP) {
      gsap.to(modal.querySelector('.modal-panel'), { opacity: 0, y: 20, duration: 0.4, ease: 'power2.in' });
      gsap.to(modal.querySelector('.modal-backdrop'), { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: finish });
    } else { finish(); }
  }

  openBtn.addEventListener('click', openModal);
  document.querySelectorAll('.privacy-inline').forEach(function (b) { b.addEventListener('click', openModal); });
  modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeMenu(); }
    if (e.key === 'Tab' && !modal.hidden) {
      var f = modal.querySelectorAll('button, a[href]');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- Boot ---------------- */
  runIntro();
  scrollAnimations();
})();
