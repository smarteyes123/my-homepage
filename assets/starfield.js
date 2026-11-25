// 2026-11-25｜Qwen3.8-27B（Claude Opus 5.5 规格・审查）｜首页首屏星空背景(canvas)。reduced-motion 时不启动,保留照片
(function () {
  'use strict';

  var heroMedia = document.querySelector('.hero-media');
  if (!heroMedia) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var probe = document.createElement('canvas');
  if (!probe.getContext || !probe.getContext('2d')) return;

  var hero = document.querySelector('.hero');
  var img = heroMedia.querySelector('img[data-hero-img]');
  if (img && img.parentNode) img.parentNode.removeChild(img);
  heroMedia.classList.add('has-stars');

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  heroMedia.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var stars = [];
  var running = false;
  var rafId = 0;
  var frames = 0;
  var costBuf = [];
  var avgMs = 0;
  var mx = 0, my = 0;
  var meteor = null;
  var meteorTimer = 0;
  var lastT = 0;
  var heroVisible = true;

  var WHITE = [255, 255, 255];
  var GOLD = [220, 188, 85];

  function makeGlow(rgb) {
    var c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',1)');
    grad.addColorStop(0.3, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.35)');
    grad.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  var glowWhite = makeGlow(WHITE);
  var glowGold = makeGlow(GOLD);

  var LAYERS = [
    { frac: 0.55, speed: 0.04, rMin: 0.5, rMax: 1.1, base: 0.5, depth: 0.15 },
    { frac: 0.30, speed: 0.09, rMin: 0.9, rMax: 1.6, base: 0.7, depth: 0.35 },
    { frac: 0.15, speed: 0.16, rMin: 1.3, rMax: 2.3, base: 0.9, depth: 0.7 }
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function buildStars() {
    var total = Math.round(Math.min(220, Math.max(60, W * H / 4600)));
    stars = [];
    var i, layer, count, s, gold;
    for (i = 0; i < LAYERS.length; i++) {
      layer = LAYERS[i];
      count = Math.round(total * layer.frac);
      for (var k = 0; k < count; k++) {
        gold = Math.random() < 0.1;
        s = {
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(layer.rMin, layer.rMax),
          base: layer.base * rand(0.7, 1.1),
          phase: Math.random() * Math.PI * 2,
          tw: rand(0.4, 1.4),
          speed: layer.speed,
          depth: layer.depth,
          gold: gold
        };
        stars.push(s);
      }
    }
  }

  function resize() {
    var rect = heroMedia.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mx = W / 2;
    my = H / 2;
    buildStars();
  }

  function spawnMeteor() {
    var ang = rand(20, 40) * Math.PI / 180;
    var dirx = Math.cos(ang);
    var diry = Math.sin(ang);
    var speed = rand(8, 13);
    var tail = rand(140, 260);
    var sx = rand(0, W * 0.5);
    var sy = rand(0, H * 0.35);
    meteor = {
      x: sx, y: sy,
      vx: dirx * speed, vy: diry * speed,
      tail: tail,
      life: 1,
      decay: rand(0.012, 0.02)
    };
  }

  function draw(t) {
    var t0 = performance.now();
    ctx.clearRect(0, 0, W, H);

    var i, s, tw, alpha, g, px, py;
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      s.x += s.speed;
      if (s.x > W + 5) {
        s.x = -5;
        s.y = Math.random() * H;
      }
      tw = Math.sin(frames * 0.03 * s.tw + s.phase) * 0.35 + 0.65;
      alpha = Math.min(1, s.base * tw);
      g = s.r * 3.5;
      px = s.x + (mx - W / 2) * 0.02 * s.depth;
      py = s.y + (my - H / 2) * 0.02 * s.depth;
      ctx.globalAlpha = alpha;
      ctx.drawImage(s.gold ? glowGold : glowWhite, px - g, py - g, g * 2, g * 2);
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.gold ? 'rgb(220,188,85)' : 'rgb(255,255,255)';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (meteor) {
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.life -= meteor.decay;
      if (meteor.life <= 0 || meteor.x > W + 5 || meteor.y > H + 5) {
        meteor = null;
      } else {
        var tx = meteor.x - meteor.vx / Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy) * meteor.tail;
        var ty = meteor.y - meteor.vy / Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy) * meteor.tail;
        var lg = ctx.createLinearGradient(meteor.x, meteor.y, tx, ty);
        lg.addColorStop(0, 'rgba(255,255,255,' + meteor.life + ')');
        lg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    frames++;
    var cost = performance.now() - t0;
    costBuf.push(cost);
    if (costBuf.length > 120) costBuf.shift();
    var sum = 0;
    for (i = 0; i < costBuf.length; i++) sum += costBuf[i];
    avgMs = costBuf.length ? sum / costBuf.length : 0;
    window.__starfield.running = running;
    window.__starfield.frames = frames;
    window.__starfield.stars = stars.length;
    window.__starfield.avgMs = avgMs;
  }

  function loop(t) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    if (t - lastT >= 600) {
      lastT = t;
      if (!meteor && Math.random() < 0.15) spawnMeteor();
    }
    draw(t);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    if (!running) return;
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  window.__starfield = { running: false, frames: 0, stars: 0, avgMs: 0 };

  resize();

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizeTimer = 0; resize(); }, 150);
  });

  if (hero) {
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var rect = heroMedia.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    });
    hero.addEventListener('pointerleave', function () {
      mx = W / 2;
      my = H / 2;
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (heroVisible) start();
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        heroVisible = entries[i].isIntersecting;
        if (heroVisible) start();
        else stop();
      }
    }, { threshold: 0 });
    io.observe(heroMedia);
  } else {
    start();
  }
})();