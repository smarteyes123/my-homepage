/* ============================================================
   Smart Eyes — 共通スクリプト
   全ページで読み込む。ページ固有の処理は各 HTML の <script> に置く。

   <body> の data 属性で挙動を変える:
     data-lang-src   言語ファイルのパス。{lang} が置換される。
                     既定 "lang/{lang}.json"
                     賃貸フォームだけ "rental-form-{lang}.json"
     data-meta-title  document.title に使うキー。既定 "meta.title"
     data-meta-desc   meta[name=description] に使うキー。既定 "meta.description"

   ページ側から使えるもの:
     SmartEyes.t(key, fallback)   現在の言語の文言を取る
     SmartEyes.onLanguage(fn)     言語適用後に呼ばれる(初回含む)
     SmartEyes.lang               現在の言語コード

   ⚠️ このファイルは 5 ページ共通。触る前に全ページで確認すること。
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var LANGS = {
    ja: '日本語', ko: '한국어', zh: '简体中文', 'zh-Hant': '繁體中文',
    en: 'English', vi: 'Tiếng Việt', ne: 'नेपाली'
  };
  // 狭い端末用の短縮表記
  var SHORT = { ja:'JA', ko:'KO', zh:'简', 'zh-Hant':'繁', en:'EN', vi:'VI', ne:'ने' };

  var cfg = document.body.dataset;
  var SRC        = cfg.langSrc   || 'lang/{lang}.json';
  var META_TITLE = cfg.metaTitle || 'meta.title';
  var META_DESC  = cfg.metaDesc  || 'meta.description';

  var cache = {};
  var listeners = [];
  var current = 'ja';
  var FALLBACK = 'ja';

  function dig(path, data) {
    return path.split('.').reduce(function (o, k) {
      return (o === null || o === undefined) ? undefined : o[k];
    }, data);
  }

  function load(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(SRC.replace('{lang}', lang))
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        cache[lang] = data;
        try {
          localStorage.setItem('smarteyes_lang_' + lang, JSON.stringify(data));
        } catch (e) {}
        return data;
      })
      .catch(function (err) {
        // ネットワークが死んでいても、前回読んだものがあれば表示は保てる
        try {
          var c = localStorage.getItem('smarteyes_lang_' + lang);
          if (c) return (cache[lang] = JSON.parse(c));
        } catch (e) {}
        if (lang !== FALLBACK) return load(FALLBACK);
        throw err;
      });
  }

  function detect() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS[q]) return q;
    try {
      var saved = localStorage.getItem('smarteyes_preferred_lang');
      if (saved && LANGS[saved]) return saved;
    } catch (e) {}
    var navLangs = navigator.languages || [navigator.language || 'ja'];
    for (var i = 0; i < navLangs.length; i++) {
      var c = String(navLangs[i]).toLowerCase();
      if (c.indexOf('zh-tw') === 0 || c.indexOf('hant') > -1) return 'zh-Hant';
      if (c.indexOf('zh') === 0) return 'zh';
      if (c.indexOf('ja') === 0) return 'ja';
      if (c.indexOf('ko') === 0) return 'ko';
      if (c.indexOf('vi') === 0) return 'vi';
      if (c.indexOf('ne') === 0) return 'ne';
      if (c.indexOf('en') === 0) return 'en';
    }
    return FALLBACK;
  }

  function t(key, fallback) {
    var data = cache[current];
    var v = data ? dig(key, data) : undefined;
    return v === undefined ? fallback : v;
  }

  function apply(lang) {
    return load(lang).then(function (data) {
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var v = dig(el.getAttribute('data-i18n'), data);
        if (v === undefined) return;
        if (el.hasAttribute('placeholder')) el.placeholder = v;
        else el.textContent = v;
      });
      // placeholder を本文とは別に指定したい場合
      document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
        var v = dig(el.getAttribute('data-i18n-ph'), data);
        if (v !== undefined) el.placeholder = v;
      });

      var title = dig(META_TITLE, data);
      if (title) document.title = title;
      var desc = dig(META_DESC, data);
      var md = document.querySelector('meta[name="description"]');
      if (desc && md) md.setAttribute('content', desc);

      document.documentElement.lang = lang;
      current = SmartEyes.lang = lang;
      try { localStorage.setItem('smarteyes_preferred_lang', lang); } catch (e) {}

      syncSwitcher();
      fixFooterYear();
      listeners.forEach(function (fn) { try { fn(lang, data); } catch (e) { console.warn(e); } });
    }).catch(function (err) {
      // 文言が読めなくても HTML の既定文(日本語)がそのまま残る
      console.warn('language load failed:', err);
    });
  }

  function syncSwitcher() {
    var label = document.getElementById('langLabel');
    var short = document.getElementById('langShort');
    if (label) label.textContent = LANGS[current];
    if (short) short.textContent = SHORT[current];
    document.querySelectorAll('#langMenu button').forEach(function (b) {
      var on = b.dataset.lang === current;
      b.setAttribute('aria-current', on ? 'true' : 'false');
      var tick = b.querySelector('.tick');
      if (tick) tick.textContent = on ? '✓' : '';
    });
  }

  function buildSwitcher() {
    var btn  = document.getElementById('langBtn');
    var menu = document.getElementById('langMenu');
    if (!btn || !menu) return;

    Object.keys(LANGS).forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = code;
      b.setAttribute('role', 'menuitem');
      var tick = document.createElement('span');
      tick.className = 'tick';
      var name = document.createElement('span');
      name.textContent = LANGS[code];
      b.appendChild(tick);
      b.appendChild(name);
      b.addEventListener('click', function () { apply(code); close(); });
      menu.appendChild(b);
    });

    function open()  { menu.classList.add('open');    btn.setAttribute('aria-expanded', 'true'); }
    function close() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('open')) close(); else open();
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function mobileNav() {
    var b = document.getElementById('burger');
    var d = document.getElementById('drawer');
    if (!b || !d) return;
    function close() { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }
    b.addEventListener('click', function () {
      var open = d.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('resize', function () { if (innerWidth > 820) close(); });
  }

  function scrollFx() {
    var hdr = document.querySelector('.hdr');
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle('stuck', scrollY > 8); };
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    var items = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // 年号は毎年手で直さない。語順は言語ごとに違うので数字だけ差し替える。
  function fixFooterYear() {
    var y = new Date().getFullYear();
    document.querySelectorAll('.js-year').forEach(function (el) { el.textContent = y; });
    document.querySelectorAll('[data-year-fix]').forEach(function (el) {
      el.textContent = el.textContent.replace(/20\d{2}/, y);
    });
  }

  // 背景写真。人物の顔が写っているもの・白飛びして白文字が乗らないもの・
  // ほぼ同一カットの重複を除いた 8 枚から選ぶ。
  var HERO_POOL = [13, 18, 22, 23, 25, 26, 28, 35];
  function heroImage() {
    document.querySelectorAll('[data-hero-img]').forEach(function (img) {
      var n = HERO_POOL[Math.floor(Math.random() * HERO_POOL.length)];
      img.addEventListener('load', function () { img.classList.add('on'); }, { once: true });
      // 読めなくても紺の下地が残るので、崩れずに文字は読める
      img.addEventListener('error', function () { img.remove(); }, { once: true });
      img.src = 'img/' + n + '.JPEG';
    });
  }

  var SmartEyes = window.SmartEyes = {
    lang: current,
    t: t,
    onLanguage: function (fn) { listeners.push(fn); },
    apply: apply,
    HERO_POOL: HERO_POOL
  };

  buildSwitcher();
  mobileNav();
  scrollFx();
  heroImage();
  fixFooterYear();
  apply(detect());
})();
