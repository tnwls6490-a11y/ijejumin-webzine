/* 이제주민 · site.js (모든 페이지 공용) */
/* ---------- Google 태그 관리자 (GTM-NR6G6B9M, 사용자 요청 2026-10-23) ----------
   Google 안내는 <head>에 바로 넣는 것이지만, 공통 기준(스크립트는 site.js 하나, 페이지 안 스크립트 금지)에 맞춰 여기서 불러온다.
   site.js는 페이지 끝에서 읽히므로 head에 둘 때보다 조금 늦게 시작한다. 코드는 Google이 준 그대로 */
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NR6G6B9M');

/* ---------- 언어판 (한국어·영어·일본어, 2026-10-25) ----------
   스크립트가 화면에 쓰는 글(버튼 이름·안내)을 페이지 언어(<html lang>)에 맞춘다. wzT('한국어', 'English', '日本語') */
var wzLang = (document.documentElement.getAttribute('lang') || 'ko').slice(0, 2);
function wzT(ko, en, ja) { return wzLang === 'en' ? en : wzLang === 'ja' ? ja : ko; }

/* ---------- 언어를 바꿔도 보던 자리에서 이어 보기 (사용자 요청 2026-10-28) ----------
   전에는 KO·EN·JA를 누르면 다른 언어 같은 페이지의 맨 위(서브메인은 비행기 창)부터 다시 시작했다.
   이제 누르는 순간 보고 있던 자리를 이 탭에만(sessionStorage) 적어 두고, 새 페이지가 열리면 그 자리로 바로 옮긴다.
   - 세 언어 페이지는 HTML 짜임이 같아(글만 다름) '몇 번째 칸의 몇 % 지점'으로 같은 자리를 찾는다
   - 화면에 붙어 있는(sticky) 무대(인터뷰·엽서)는 높이가 언어와 상관없어, 무대를 감싼 칸에서 몇 px 내려왔는지로 찾는다
   - 서브메인 첫 화면: 비행기 창이면 새 페이지도 비행기 창, 제주 화면이면 제주 화면에서 바로 (첫 화면 블록의 introMode)
   - 지금 언어 버튼은 아무 일도 하지 않는다 (전에는 같은 페이지를 처음부터 다시 열었다)
   - 다른 페이지로 가는 버튼(나의 제주찾기 → 다른 언어 서브메인)과 마을 테스트(테스트 안에서 언어를 바꿈)는 그대로 */
var wzPlace = (function () {
  'use strict';
  var KEY = 'ijejumin.langPlace';
  var BLOCK = 'section, article, header, footer, nav, aside, div, p, h1, h2, h3, h4, h5, ul, ol, li, dl, dt, dd, figure, figcaption, blockquote, table, tr, img, picture, iframe, video, button';
  var api = { introMode: null };
  function file(path) { return path.split('/').pop() || 'index.html'; }
  function blocks() {
    return Array.prototype.filter.call(document.querySelectorAll('main *, .wz-outro *, .site-footer *'), function (el) { return el.matches(BLOCK); });
  }
  function sig(el) { return el.tagName + '.' + (el.classList[0] || ''); }
  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }   // 움직임(transform)을 뺀 원래 자리
  function maxY() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
  /* 화면 위에 붙어 있는 줄: 헤더, 인터뷰 기사는 그 아래 목록 줄(.ivnav)까지 (2026-10-29) */
  function bars() {
    return ['.wz-header', '.ivnav'].map(function (s) { return document.querySelector(s); }).filter(function (el) {
      return el && (el.matches('.wz-header') || getComputedStyle(el).position === 'sticky');
    });
  }

  function save(link) {
    var mode = api.introMode ? api.introMode() : null;
    if (mode === 'top' || (!mode && window.scrollY < 1)) return;   // 맨 위(비행기 창)면 새 페이지도 맨 위에서
    var rec = { file: file(link.pathname), t: Date.now(), mode: mode, r: window.scrollY / maxY() };
    if (!mode) {
      var ln = bars().reduce(function (b, el) { return Math.max(b, el.getBoundingClientRect().bottom); }, 0) + 1;   // 헤더(기사는 목록 줄) 바로 아래 줄
      var list = blocks(), hits = [];
      for (var i = 0; i < list.length; i++) {
        var r = list[i].getBoundingClientRect();
        if (r.height > 0 && r.top <= ln && r.bottom > ln) hits.push(i);
      }
      /* 그 줄에 걸친 가장 안쪽 칸 (화면에 고정된 것은 건너뛰고, 붙어 있는 무대 안이면 무대를 감싼 칸) */
      for (var k = hits.length - 1; k >= 0; k--) {
        var el = list[hits[k]], stick = null, fixed = false;
        for (var n = el; n && n !== document.body; n = n.parentElement) {
          var p = getComputedStyle(n).position;
          if (p === 'fixed') { fixed = true; break; }
          if (p === 'sticky') stick = n;
        }
        if (fixed) continue;
        var y0 = window.scrollY + ln;
        if (stick) { el = stick.parentElement; if (list.indexOf(el) < 0) break; rec.px = y0 - docTop(el); }
        else if (el.offsetHeight > 0) rec.f = (y0 - docTop(el)) / el.offsetHeight;
        else rec.px = y0 - docTop(el);
        rec.i = list.indexOf(el); rec.sig = sig(el);
        break;
      }
    }
    try { window.sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) { /* 저장이 막힌 브라우저: 전처럼 처음부터 */ }
  }

  /* 이 페이지 앞으로 적어 둔 자리 (한 번 읽으면 지운다. 30초 넘은 것·다른 페이지 것은 버린다) */
  api.take = function () {
    var rec = null;
    try { rec = JSON.parse(window.sessionStorage.getItem(KEY)); window.sessionStorage.removeItem(KEY); } catch (e) { return null; }
    if (!rec || rec.file !== file(window.location.pathname) || !(Date.now() - rec.t < 30000)) return null;
    return rec;
  };
  /* 적어 둔 자리로 가려면 스크롤할 위치 */
  api.y = function (rec) {
    var y = (rec.r || 0) * maxY();
    if (rec.i != null) {
      var list = blocks(), el = list[rec.i];
      for (var d = 1; (!el || sig(el) !== rec.sig) && d <= 30; d++) {   // 짜임이 조금 달라도 가까운 같은 칸을 찾는다
        el = list[rec.i - d] && sig(list[rec.i - d]) === rec.sig ? list[rec.i - d] : list[rec.i + d];
      }
      if (el && sig(el) === rec.sig) {
        var cover = bars().reduce(function (s, b) { return s + b.offsetHeight; }, 0);
        y = docTop(el) + (rec.px != null ? rec.px : rec.f * el.offsetHeight) - cover - 1;
      }
    }
    return Math.max(0, Math.min(maxY(), Math.round(y)));
  };
  /* 지금 한 번, 글꼴·사진을 다 불러온 뒤 한 번 더 맞춘다 (그사이 직접 스크롤하면 그만) */
  api.follow = function (fn) {
    var touched = false;
    ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
      window.addEventListener(type, function () { touched = true; }, { once: true, passive: true });
    });
    function run() { if (!touched) fn(); }
    run();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
    window.addEventListener('load', run);
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.wz-lang a[hreflang]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (document.getElementById('vt')) return;
    if (a.getAttribute('aria-current') === 'true') { e.preventDefault(); return; }
    if (file(a.pathname) === file(window.location.pathname)) save(a);
  });
  return api;
})();

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- 고정 헤더 높이 (--hdr-h) ----------
     첫 화면과 인터뷰 무대가 헤더 바로 아래에서 시작하도록 헤더 높이를 잰다 */
  (function () {
    var header = document.querySelector('.wz-header');
    if (!header) return;
    var nav = header.querySelector('.wz-nav');
    var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
    /* 휴대폰: 메뉴가 한 줄에 안 들어가면 들어갈 만큼 글자를 줄인다 (양옆 여백은 그대로 두고 글자 폭만 계산)
       13px(15px의 0.87배)보다 작게는 줄이지 않고, 그래도 넘치면 줄을 옆으로 밀어 넘긴다 (오른쪽 끝 흐림은 is-more) */
    var NAV_MIN_FIT = 0.87;
    function navMore() {
      if (!nav) return;
      nav.classList.toggle('is-more', nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2);
    }
    function fitNav() {
      if (!nav) return;
      nav.style.removeProperty('--nav-fit');
      if (narrowQuery && narrowQuery.matches) {
        var links = nav.querySelectorAll(':scope > a, :scope > .wz-drop > a'), text = 0, pad = 0;   // 펼침 메뉴 속 기사 4편은 휴대폰에서 안 보이므로 빼고 잰다
        for (var i = 0; i < links.length; i++) {
          var cs = getComputedStyle(links[i]);
          var p = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
          pad += p;
          text += links[i].offsetWidth - p;
        }
        var room = nav.clientWidth - pad - (parseFloat(getComputedStyle(nav).columnGap) || 0) * (links.length - 1);
        /* 줄이는 한계는 '실제로 보이는 글자 13px'. 휴대폰에서 글자를 키워 두면(카톡 '가가') 같은 15px 글자가 더 크게 보여,
           그만큼 더 줄여도 13px보다 작아지지 않는다 (2026-10-28. 전에는 늘 0.87배까지만 줄여 카톡에서 메뉴가 옆으로 넘쳤다) */
        var shown = parseFloat(getComputedStyle(nav).fontSize) || 15;
        var minFit = Math.min(NAV_MIN_FIT, 13 / shown);
        if (text > room) nav.style.setProperty('--nav-fit', Math.max(minFit, room / text * 0.98).toFixed(3));
      }
      navMore();
    }
    if (nav) nav.addEventListener('scroll', navMore, { passive: true });
    /* 인터뷰 기사는 헤더 아래 목록 줄(.ivnav)도 붙어 있어(2026-10-29), 위를 가리는 높이(--hdr-h)에 그 줄까지 더한다.
       목록 줄이 붙을 자리는 헤더 높이(--wz-hdr) */
    var ivnav = document.querySelector('.ivnav');
    function setH() {
      fitNav();
      var root = document.documentElement, h = header.offsetHeight;
      root.style.setProperty('--wz-hdr', h + 'px');
      root.style.setProperty('--hdr-h', h + (ivnav ? ivnav.offsetHeight : 0) + 'px');
    }
    setH();
    window.addEventListener('resize', setH);
    window.addEventListener('load', setH);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setH);
  })();

  /* ---------- 다음 화면이 아래에서 올라와 퍼지기 (.rise) ---------- */
  (function () {
    var rises = document.querySelectorAll('.rise');
    if (!rises.length) return;
    var items = Array.prototype.map.call(rises, function (el) {
      var prev = el.previousElementSibling;
      while (prev && !/SECTION|DIV/.test(prev.tagName)) prev = prev.previousElementSibling;
      /* 어둡게 하는 값은 가리개(.under-dim) 하나에만 넣는다. 감싼 칸에 넣으면 장면마다 첫 화면 요소 67개의 스타일을 다시 계산했다 */
      return { el: el, dim: prev ? prev.querySelector('.under-dim') : null };
    });
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight || 1;
      for (var i = 0; i < items.length; i++) {
        var top = items[i].el.getBoundingClientRect().top;
        var e = Math.min(1, Math.max(0, 1 - top / vh));
        var eased = 1 - Math.pow(1 - e, 2);
        items[i].el.style.setProperty('--enter', eased.toFixed(4));
        if (items[i].dim) items[i].dim.style.setProperty('--under', e.toFixed(3));
      }
    }
    function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  })();

  /* ---------- 01 이주민 인터뷰: 옆으로 넘기는 슬라이드 ---------- */
  (function () {
    var section = document.querySelector('.people');
    if (!section) return;
    var stage = section.querySelector('.people__stage');
    var persons = section.querySelectorAll('.person');
    var chips = section.querySelectorAll('.people__chip');
    var prevBtn = section.querySelector('.people__arrow--prev');
    var nextBtn = section.querySelector('.people__arrow--next');
    var n = persons.length;
    var current = -1;

    function setSide(el, side) {
      el.classList.toggle('is-left', side < 0);
      el.classList.toggle('is-right', side > 0);
    }

    function show(i, dir) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === current) return;
      if (dir === undefined) dir = i > current ? 1 : -1;
      var incoming = persons[i];
      /* 들어올 슬라이드를 들어올 쪽에 미리 놓는다 (애니메이션 없이) */
      incoming.classList.add('no-anim');
      incoming.classList.remove('is-active');
      setSide(incoming, current < 0 ? 0 : dir);
      void incoming.offsetWidth;
      incoming.classList.remove('no-anim');

      for (var k = 0; k < n; k++) {
        if (k === i) continue;
        persons[k].classList.remove('is-active');
        persons[k].setAttribute('aria-hidden', 'true');
        if (k === current) setSide(persons[k], -dir);
      }
      incoming.classList.add('is-active');
      incoming.removeAttribute('aria-hidden');
      setSide(incoming, 0);

      for (var c = 0; c < chips.length; c++) chips[c].setAttribute('aria-pressed', c === i ? 'true' : 'false');
      /* 이름 버튼 줄이 옆으로 넘어가는 화면(영어판 좁은 휴대폰)에서는 지금 사람 버튼이 보이게 줄을 옮긴다 */
      var box = chips[i] && chips[i].parentNode;
      if (box && box.scrollWidth > box.clientWidth + 1) {
        var cl = chips[i].getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft, cr = cl + chips[i].offsetWidth;
        if (cl < box.scrollLeft) box.scrollLeft = cl - 8;
        else if (cr > box.scrollLeft + box.clientWidth) box.scrollLeft = cr - box.clientWidth + 28;
      }
      stage.setAttribute('data-tone', incoming.getAttribute('data-tone') || 'sky');
      if (prevBtn) prevBtn.disabled = i === 0;
      if (nextBtn) nextBtn.disabled = i === n - 1;
      current = i;
    }

    /* ---------- 스크롤로 넘기기 ----------
       무대가 화면에 붙어 있는 동안의 스크롤 거리를 사람 수만큼 나눠, 그 칸에 해당하는 사람을 보여 준다.
       버튼 · 이름 · 밀기로 넘기면 그 사람의 칸으로 스크롤도 같이 옮긴다 */
    function range() {
      var rect = section.getBoundingClientRect();
      var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 0;
      /* 마지막 150px은 마지막 사람에 머무는 구간이라 뺀다 */
      var len = section.offsetHeight - stage.offsetHeight - 150;
      return { pos: hdr - rect.top, len: Math.max(len, 1), top: rect.top + window.scrollY - hdr };
    }
    var navTo = null, navY = 0, navTimer = 0;
    function fromScroll() {
      var r = range();
      if (navTo !== null && Math.abs(window.scrollY - navY) < 3) navTo = null;
      if (navTo !== null) return;              // 버튼으로 옮기는 중에는 지나가는 사람을 건너뛴다
      var seg = r.len / n;
      var i = Math.max(0, Math.min(n - 1, Math.floor(r.pos / seg)));
      if (i !== current) show(i);
    }
    function go(i, dir) {
      i = Math.max(0, Math.min(n - 1, i));
      show(i, dir);
      var r = range();
      var inside = r.pos >= -2 && r.pos <= r.len;
      if (!inside) return;                     // 무대가 화면에 붙어 있을 때만 스크롤을 맞춘다
      var y = Math.round(r.top + (i + 0.5) * (r.len / n));
      navTo = i; navY = y;
      window.clearTimeout(navTimer);
      navTimer = window.setTimeout(function () { navTo = null; }, 1500);
      window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
    function reduceMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    var scrollTick = false;
    window.addEventListener('scroll', function () {
      if (scrollTick) return; scrollTick = true;
      window.requestAnimationFrame(function () { scrollTick = false; fromScroll(); });
    }, { passive: true });
    window.addEventListener('resize', fromScroll);

    /* 버튼 */
    if (prevBtn) prevBtn.addEventListener('click', function () { go(current - 1, -1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1, 1); });
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () { go(parseInt(this.getAttribute('data-go'), 10) || 0); });
    }

    /* 키보드: 섹션 안에서 ← → */
    section.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(current - 1, -1); }
      else if (e.key === 'ArrowRight') { go(current + 1, 1); }
    });

    /* 손가락 · 마우스로 밀어서 넘기기 */
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest && e.target.closest('a, button')) return;
      drag = { x: e.clientX, y: e.clientY, dx: 0, active: false, id: e.pointerId };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }  // 세로 스크롤
        if (Math.abs(dx) < 8) return;
        drag.active = true;
        stage.classList.add('is-dragging');
        if (stage.setPointerCapture) stage.setPointerCapture(drag.id);
      }
      drag.dx = dx;
      var edge = (current === 0 && dx > 0) || (current === n - 1 && dx < 0) ? 0.35 : 1;
      stage.style.setProperty('--pull', Math.max(-1, Math.min(1, dx / stage.clientWidth * 2 * edge)).toFixed(3));
    });
    function endDrag() {
      if (!drag) return;
      var dx = drag.dx, was = drag.active;
      drag = null;
      stage.classList.remove('is-dragging');
      stage.style.setProperty('--pull', '0');
      if (!was) return;
      var limit = Math.min(90, stage.clientWidth * 0.15);
      if (dx < -limit) go(current + 1, 1);
      else if (dx > limit) go(current - 1, -1);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('click', function (e) { if (Math.abs(e.detail) && stage.classList.contains('is-dragging')) e.preventDefault(); }, true);

    /* ---------- 휴대폰 배치 맞추기 ----------
       1) 아래 이름 버튼이 몇 줄로 놓였는지(글자 크기에 따라 달라짐) 재서, 그만큼 위 글자·버튼을 띄운다
       2) 카카오톡 같은 앱 안 브라우저는 스크롤할 때 위아래 막대가 나왔다 들어가며 화면 높이가 바뀐다.
          무대는 지금 높이를 따르되, 글자를 얼마나 줄일지는 지금까지 본 가장 낮은 높이에서 한 번 정한다
          (스크롤할 때마다 글자 크기가 오락가락하지 않게. 폭이 바뀌면 다시 잰다)
       3) 그 높이에서 제목과 설명이 겹치면(낮은 화면, 휴대폰 글자 크기 설정) 번호·제목을 줄인다(is-tight),
          그래도 겹치면 더 줄인다(is-tighter). 이름 버튼은 숨기지 않는다 */
    var chipsBox = section.querySelector('.people__chips');
    var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
    var lockW = 0, minH = 0;
    /* 이름은 '·'로 잇는다. 줄이 바뀌면 그 줄 맨 앞 이름의 '·'는 숨긴다 */
    function markRows() {
      for (var c = 1; c < chips.length; c++) chips[c].classList.toggle('is-row-start', chips[c].offsetTop !== chips[c - 1].offsetTop);
    }
    function setChipsH() {
      markRows();
      section.style.setProperty('--chips-h', ((chipsBox ? chipsBox.offsetHeight : 0) + 8) + 'px');
    }
    function crowded() {
      for (var i = 0; i < n; i++) {
        var front = persons[i].querySelector('.person__front');
        var desc = persons[i].querySelector('.person__desc');
        if (front && desc && front.getBoundingClientRect().bottom + 8 > desc.getBoundingClientRect().top) return true;
      }
      return false;
    }
    function layoutMobile() {
      stage.classList.remove('is-tight', 'is-tighter', 'is-tightest');
      section.style.removeProperty('--people-vh');
      if (!narrowQuery || !narrowQuery.matches) {
        section.style.removeProperty('--chips-h');
        lockW = 0;
        markRows();
        return;
      }
      var w = window.innerWidth, h = window.innerHeight;
      if (w !== lockW) { lockW = w; minH = h; } else minH = Math.min(minH, h);
      /* 가장 낮은 높이로 잠깐 바꿔서 재고(화면에 그려지기 전), 다시 지금 높이로 돌린다 */
      section.style.setProperty('--people-vh', minH + 'px');
      setChipsH();
      if (crowded()) {
        stage.classList.add('is-tight');
        setChipsH();
        if (crowded()) {
          stage.classList.add('is-tighter');
          setChipsH();
          if (crowded()) stage.classList.add('is-tightest');   // 카톡 막대가 보이는 312×520 같은 아주 낮은 화면 (설명이 네 줄일 때)
        }
      }
      section.style.removeProperty('--people-vh');
      setChipsH();
    }
    window.addEventListener('resize', layoutMobile);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutMobile);

    /* 인물 누끼를 다 불러온 슬라이드만 뒤 제목의 주황 선을 보인다 (CSS is-cut-ready).
       인터넷이 느리면 누끼가 배경 사진보다 늦게 떠서, 그 사이 선이 인물 앞에 보였다 (사용자 요청 2026-10-26) */
    Array.prototype.forEach.call(persons, function (el) {
      var cut = el.querySelector('.person__cut');
      if (!cut) return;
      function ready() { el.classList.add('is-cut-ready'); }
      if (cut.complete && cut.naturalWidth) ready();
      else cut.addEventListener('load', ready);
    });

    section.classList.add('is-ready');
    layoutMobile();
    for (var k = 0; k < n; k++) { persons[k].classList.add('no-anim'); setSide(persons[k], 1); }
    show(0, 1);
    fromScroll();
    window.requestAnimationFrame(function () {
      for (var k = 0; k < n; k++) persons[k].classList.remove('no-anim');
    });
  })();

  /* ---------- 커서를 바라보는 인물 (.person-turn) ----------
     3D 모델을 좌우·위아래 각도별로 찍은 사진 묶음.
     파일 이름: data-src + r{줄}-c{칸 두 자리}.webp
       칸(c): 좌우 각도, 가운데 칸이 기본 모습 (data-cols)
       줄(r): 위아래 각도, 0번 줄이 머리 위에서 내려다본 모습, 마지막 줄이 발 쪽에서 올려다본 모습 (data-rows)
     마우스 커서가 있는 쪽으로 몸을 돌린다. 커서가 위에 있으면 내려다본 각도, 아래에 있으면 올려다본 각도.
     움직임은 '부드럽게 감속하며 멈추는' 방식 하나만 쓴다 (출렁임·기울기 없음).
     제목 글자는 움직이지 않는다. 마우스가 없는 휴대폰에서는 기본 모습 근처에서 천천히 둘러본다. */
  (function () {
    var boxes = document.querySelectorAll('.person-turn');
    if (!boxes.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    /* 목표값으로 미끄러지듯 다가가는 계산 (멈출 때 자연스럽게 느려지고 지나치지 않는다) */
    function smoothDamp(cur, target, state, smoothTime, dt) {
      var omega = 2 / smoothTime, x = omega * dt;
      var exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      var change = cur - target;
      var temp = (state.v + omega * change) * dt;
      state.v = (state.v - omega * temp) * exp;
      var out = target + (change + temp) * exp;
      if ((target - cur > 0) === (out > target)) { out = target; state.v = 0; }
      return out;
    }

    var mouseX = null, mouseY = null;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') { mouseX = e.clientX; mouseY = e.clientY; }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { mouseX = mouseY = null; });
    window.addEventListener('blur', function () { mouseX = mouseY = null; });

    Array.prototype.forEach.call(boxes, function (box) {
      var img = box.querySelector('.person-turn__img');
      var src = box.getAttribute('data-src');
      var cols = parseInt(box.getAttribute('data-cols'), 10) || 1;
      var rows = parseInt(box.getAttribute('data-rows'), 10) || 1;
      var midC = (cols - 1) / 2, midR = (rows - 1) / 2;
      var host = box.closest ? box.closest('.person') : null;
      var c = midC, r = midR, vc = { v: 0 }, vr = { v: 0 };
      var frames = {}, loaded = false, shown = '';

      function name(row, col) { return 'r' + row + '-c' + pad(col); }

      /* 페이지가 다 뜬 뒤 모든 각도를 미리 불러온다 */
      function preload() {
        var need = rows * cols, done = 0;
        for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
          var im = new Image();
          im.onload = im.onerror = function () { if (++done === need) loaded = true; };
          im.src = src + name(y, x) + '.webp';
          frames[name(y, x)] = im;
        }
      }
      if (document.readyState === 'complete') preload();
      else window.addEventListener('load', preload);

      function show(row, col) {
        var key = name(clamp(Math.round(row), 0, rows - 1), clamp(Math.round(col), 0, cols - 1));
        if (key === shown) return;
        shown = key;
        img.src = frames[key] ? frames[key].src : src + key + '.webp';
      }

      var lastTs = null;
      function tick(ts) {
        window.requestAnimationFrame(tick);
        var active = !host || host.classList.contains('is-active');
        if (!loaded || !active) { lastTs = ts; return; }
        var dt = lastTs === null ? 1 / 60 : clamp((ts - lastTs) / 1000, 1 / 240, 0.05);
        lastTs = ts;

        /* 바라볼 각도 */
        var tc = midC, tr = midR;
        if (mouseX !== null) {
          var b = box.getBoundingClientRect();
          var dx = (mouseX - (b.left + b.width / 2)) / Math.max(window.innerWidth * 0.45, 1);
          var dy = (mouseY - (b.top + b.height * 0.35)) / Math.max(window.innerHeight * 0.5, 1);
          tc = midC + clamp(dx, -1, 1) * midC;
          tr = midR + clamp(dy, -1, 1) * midR;      // 커서가 위 → 0번 줄(내려다봄)
        } else if (noHover && !reduce) {
          tc = midC + Math.sin(ts / 3600) * midC * 0.4;
          tr = midR + Math.sin(ts / 4700) * midR * 0.4;
        }

        if (reduce) { c = tc; r = tr; }
        else {
          c = smoothDamp(c, tc, vc, 0.45, dt);      // 좌우: 약 0.45초에 걸쳐 도착
          r = smoothDamp(r, tr, vr, 0.55, dt);      // 위아래: 조금 더 느긋하게
        }
        show(r, c);
      }
      window.requestAnimationFrame(tick);
    });
  })();

  /* ---------- 02 제주생존한마디: 스프링처럼 휘감겨 도는 카드 → 한 장으로 ----------
     카드 24장이 보이지 않는 나선(스프링)을 따라 아래에서 위로 약 2바퀴 감겨 있고, 나선이 천천히 돈다.
     카드에 마우스를 올리면 느려지고, 누르면 그 카드가 팝업으로 크게 뜬다.
     스크롤하면 가운데로 모여(--merge 0→1) 겹쳐지고, 다 모이면 '제주생존한마디' 카드 한 장만 남는다 */
  (function () {
    var section = document.querySelector('.pick');
    if (!section) return;
    var stage = section.querySelector('.pick__stage');
    var cardsBox = section.querySelector('.pick__cards');
    var world = section.querySelector('.pick__world');
    var finalCard = section.querySelector('.pick__final');
    var cover = section.querySelector('.pick__cover');       // 다 모이면 맨 위에 오는 로고 엽서
    var cards = Array.prototype.slice.call(section.querySelectorAll('.pcard'));
    var pop = section.querySelector('.pick-pop');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var n = cards.length;
    var TURNS = 2;                                           // 나선이 감긴 바퀴 수 (정수여야 맨 위 카드가 맨 아래로 이어질 때 모양이 맞는다)
    var items = cards.map(function (el, i) {
      return { el: el, a: i / n * TURNS * Math.PI * 2, h0: i / n, note: el.classList.contains('pcard--note'), back: false };
    });
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function smooth(a, b, x) { var u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }

    var spin = 0, speed = 1, shown = 0, last = null, visible = false, hover = false, isOpen = false;
    var aim = { x: 0, y: 0 }, lean = { x: 0, y: 0 };        // 엽서 무대 위 마우스 위치(-1~1)와, 그 위치를 천천히 따라가는 나선의 기울기
    var drag = null, vel = 0, dragged = false;

    /* 마우스·손가락으로 좌우로 잡아 돌리기 (위아래로 밀면 평소처럼 스크롤) */
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (section.classList.contains('is-merging')) return;
      dragged = false;
      drag = { x: e.clientX, y: e.clientY, last: e.clientX, t: performance.now(), active: false, id: e.pointerId };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 6) return;
        drag.active = true;
        stage.classList.add('is-grabbing');
        if (stage.setPointerCapture) stage.setPointerCapture(drag.id);
      }
      var now = performance.now();
      var d = (e.clientX - drag.last) * (2.4 / Math.max(stage.clientWidth, 1));   // 화면 폭만큼 밀면 약 0.4바퀴
      spin += d;
      vel = d / Math.max((now - drag.t) / 1000, 1 / 120);
      drag.last = e.clientX; drag.t = now;
    });
    function endDrag() {
      if (!drag) return;
      if (drag.active) { dragged = true; vel = clamp(vel, -3, 3); }
      if (performance.now() - drag.t > 80) vel = 0;          // 멈췄다 놓으면 그대로 멈춘다
      drag = null;
      stage.classList.remove('is-grabbing');
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    world.addEventListener('pointerover', function (e) { if (e.target.closest('.pcard')) hover = true; });
    world.addEventListener('pointerout', function (e) { if (e.target.closest('.pcard')) hover = false; });
    /* 마우스를 올리면 나선 전체가 커서 쪽으로 살짝 돌아보듯 기운다 (손가락·움직임 줄이기 설정에서는 그대로) */
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || reduce) return;
      var r = stage.getBoundingClientRect();
      aim.x = clamp((e.clientX - r.left) / Math.max(r.width, 1) * 2 - 1, -1, 1);
      aim.y = clamp((e.clientY - r.top) / Math.max(r.height, 1) * 2 - 1, -1, 1);
    });
    stage.addEventListener('pointerleave', function () { aim.x = 0; aim.y = 0; });

    function geom() {
      var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 0;
      var cs = getComputedStyle(section);
      var pad = parseFloat(cs.paddingTop) || 0;      // 인터뷰 화면과의 여백
      var tail = parseFloat(cs.paddingBottom) || 0;  // 무대가 끝난 뒤 이어지는 검정
      var len = section.offsetHeight - pad - tail - stage.offsetHeight - 200;   // 마지막 200px은 다 모인 카드에 머문다
      return { top: section.getBoundingClientRect().top, hdr: hdr, pad: pad, len: Math.max(len, 1) };
    }
    function target() {
      var g = geom();
      return clamp((g.hdr - g.top - g.pad) / g.len, 0, 1);
    }
    function progressY(p) {   // 진행 p가 되는 스크롤 위치 (target()을 거꾸로)
      var g = geom();
      return window.scrollY + g.top - g.hdr + g.pad + p * g.len;
    }
    /* 뒷면 엽서가 무대 아래로 넘치거나 아래 스크롤 표시(.pick__next)와 겹치면(낮은 휴대폰 화면) 뒤집히면서 그만큼 위로 올린다 */
    var lift = 0;
    var nextCue = section.querySelector('.pick__next');
    function measureLift() {
      if (!finalCard) return;
      var h = finalCard.offsetHeight, c = finalCard.offsetTop;   // c: 엽서 가운데 높이 (translate -50% 전)
      var room = 12;                                              // 엽서 아래로 비워 둘 높이
      if (nextCue) room += nextCue.offsetHeight + (parseFloat(getComputedStyle(nextCue).bottom) || 0);
      lift = clamp(c + h / 2 + room - stage.clientHeight, 0, Math.max(0, c - h / 2 - 8));
    }
    measureLift();
    window.addEventListener('resize', measureLift);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLift);
    /* 한 줄 글 맞추기 (2026-10-28): 좁은 휴대폰(312px)이나 글자를 키운 휴대폰(카톡 '가가')에서 큰 제목 'VOICES OF JEJU'와
       아래 안내 두 줄('옆으로 넘겨 보세요' 등)이 화면보다 길어지면 들어갈 만큼 글자를 줄인다 (style.css --en-fit·--hint-fit-t·--hint-fit-s, 보통은 1) */
    var enTitle = section.querySelector('.pick__en');
    var hintBox = section.querySelector('.pick__hint');
    function fitText() {
      var room = stage.clientWidth - 32;   // 양옆 16px 여백
      if (enTitle) {
        enTitle.style.removeProperty('--en-fit');
        var w = enTitle.getBoundingClientRect().width;
        if (w > room) enTitle.style.setProperty('--en-fit', Math.max(0.5, room / w * 0.98).toFixed(3));
      }
      if (hintBox) {
        var icon = hintBox.querySelector('.pick__hint-icon');
        var textRoom = room - (icon ? icon.getBoundingClientRect().width : 0) - (parseFloat(getComputedStyle(hintBox).columnGap) || 0);
        [['.pick__hint-title', '--hint-fit-t'], ['.pick__hint-sub', '--hint-fit-s']].forEach(function (p) {
          var el = hintBox.querySelector(p[0]);
          if (!el) return;
          el.style.removeProperty(p[1]);
          if (el.scrollWidth > textRoom) el.style.setProperty(p[1], Math.max(0.55, textRoom / el.scrollWidth * 0.98).toFixed(3));
        });
      }
    }
    fitText();
    window.addEventListener('resize', fitText);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);
    /* 페이지를 연 뒤 글자 크기를 바꾸면(카톡 '가가') resize가 안 와서, 글 칸 크기가 바뀌면 다시 잰다 */
    if ('ResizeObserver' in window) {
      var fitRo = new ResizeObserver(function () { fitText(); });
      Array.prototype.forEach.call(section.querySelectorAll('.pick__en, .pick__hint-title, .pick__hint-sub'), function (el) { fitRo.observe(el); });
    }
    function frame(ts) {
      window.requestAnimationFrame(frame);
      if (!visible) { last = null; return; }
      var dt = last === null ? 1 / 60 : clamp((ts - last) / 1000, 0, .1);
      last = ts;
      var t = target();
      /* 스크롤을 천천히 따라온다. 뒤집기를 저절로 넘길 때(flipSnap)는 그 시간표의 진행을 그대로 쓴다 */
      shown = reduce ? t : flipSnap && flipSnap.p !== null ? flipSnap.p : shown + (t - shown) * (1 - Math.exp(-dt / .6));
      /* ① 0~0.4: 카드가 가운데로 모인다  ② 0.34~0.78: 소개 글  ③ 0.8~: 모인 카드 한 장 */
      /* ① 0~0.34: 엽서가 천천히 가운데로 모여 한 장처럼 겹친다
         ② 0.31~0.49: 소개 글이 아래에서 떠오르며 엽서 위를 덮는다 (위아래가 그라데이션으로 흐려진 띠)
            0.49~0.63: 소개 글이 화면 가운데에 머문다 (읽는 시간)
         ③ 0.63~0.81: 소개 글이 천천히 위로 올라가 지나가고, 가려졌던 엽서가 다시 드러난다
         ④ 0.74~0.94: 한 장으로 겹친 엽서가 글 아래에서 뒤집히며 내려와 '제주생존한마디' 엽서 뒷면이 된다 */
      var m = ease(clamp(shown / .34, 0, 1)), k = 1 - m;
      var introIn = clamp((shown - .31) / .18, 0, 1);
      var introOut = clamp((shown - .63) / .18, 0, 1);
      var intro = introIn * (1 - introOut);
      var flip = smooth(.78, .95, shown), ang = 180 * flip;   // 엽서 뒤집기 0 → 180도
      var fin = ang >= 90 ? 1 : 0;                          // 반쯤(옆모습) 돌았을 때 앞면 묶음 → 뒷면 엽서로 바뀐다
      section.style.setProperty('--in', introIn.toFixed(3));
      section.style.setProperty('--out', introOut.toFixed(3));
      section.style.setProperty('--outfade', smooth(.7, 1, introOut).toFixed(3));
      /* 모인 엽서는 글이 떠오를 때 글 아래로 살짝 가라앉았다가(작아지고 어두워짐),
         글이 지나가면 떠올라 뒤집히며 제자리로 내려온다 */
      var sink = introIn * (1 - introOut);
      var dropY = (.09 * sink - .07 * introOut * (1 - flip)) * window.innerHeight - Math.sin(flip * Math.PI) * .04 * window.innerHeight - lift * flip;
      /* 엽서가 모이는 자리는 나선 가운데보다 무대 높이의 2.5%만큼 위 (사용자 요청 "진짜 살짝만 위로").
         모이면서 올라가고, 뒤집히는 동안 마지막 엽서 자리로 돌아온다 */
      var rise = .025 * stage.clientHeight * m * (1 - flip);
      var cw0 = cards[0].offsetWidth || 1;
      var grow = finalCard ? finalCard.offsetWidth / (cw0 * 1.55) : 1;   // 묶음 → 엽서 한 장 크기
      var half = clamp(ang / 90, 0, 1);
      world.style.transform = m > .5 ? 'translateY(' + dropY.toFixed(1) + 'px) rotateY(' + Math.min(ang, 90).toFixed(2) + 'deg) scale(' + ((1 + (grow - 1) * half * .85) * (1 - .1 * sink)).toFixed(3) + ')' : '';
      /* 뒷면 엽서가 나오면 앞면 묶음은 90도로 옆으로 선 채(폭 0이라 보이지 않음) 그대로 둔다.
         전에는 visibility: hidden으로 숨겼는데, 위로 올려 다시 보일 때 엽서 20장을 새로 그리느라 화면이 0.1~0.2초 멈췄다가 확 따라잡았다 (2026-10-27).
         그동안 엽서 버튼을 누르거나 키보드로 고를 수 없게 inert를 건다 */
      world.style.opacity = (1 - .35 * sink).toFixed(3);
      if (world.inert !== !!fin) world.inert = !!fin;
      section.style.setProperty('--fin', fin);
      section.style.setProperty('--fy', (dropY - rise).toFixed(1) + 'px');
      section.style.setProperty('--fr', (ang - 180).toFixed(2));
      section.style.setProperty('--fs', (.85 + .15 * clamp((ang - 90) / 90, 0, 1)).toFixed(3));
      section.classList.toggle('is-intro', intro > .5);
      /* 마우스를 올리거나 팝업이 열리면 멈추듯 느려진다 */
      var want = isOpen ? 0 : (hover ? .12 : 1);
      speed += (want - speed) * (1 - Math.exp(-dt / .25));
      if (drag && drag.active) { /* 손으로 잡고 있는 동안은 손을 따라만 돈다 */ }
      else {
        if (!reduce) spin += dt * .09 * speed * (1 - m * .85);   // 천천히 저절로 돈다
        spin += vel * dt;                                        // 손을 놓은 뒤 남은 힘으로 조금 더 돌다 멈춘다
        vel *= Math.exp(-dt / .7);
      }
      var W = stage.clientWidth, H = stage.clientHeight;
      var cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
      /* 엽서끼리 한 3D 공간을 같이 쓰면, 모이는 동안 비스듬한 엽서들이 서로를 뚫고 지나가 깨져 보인다.
         그래서 엽서마다 원근을 따로 주고(.pick__cards와 같은 거리·같은 시점 높이), 앞에 있는 엽서가 위에 그려지게 순서를 매긴다 */
      var cs = getComputedStyle(cardsBox);
      var persp = parseFloat(cs.perspective) || 1100;
      var vy = (parseFloat(cs.perspectiveOrigin.split(' ')[1]) || cardsBox.clientHeight * .45) - world.offsetTop;
      var view = 'translateY(' + vy.toFixed(1) + 'px) perspective(' + persp + 'px) translateY(' + (-vy).toFixed(1) + 'px) ';
      var R = clamp(W * .36, cw * 1.8, 580);       // 반지름이 클수록 좌우로 카드 사이가 넓어진다
      var span = Math.max(H * 1.4, cw * 7);                 // 나선의 높이 (화면 위아래로 살짝 넘친다)
      /* 나선의 축은 똑바로 서 있다가, 마우스를 올리면 커서 쪽으로 각도가 천천히 옮겨 간다 (0.5초에 걸쳐 따라감).
         좌우: 나선이 커서 쪽으로 최대 약 11도 돌아본다 · 위아래: 앞쪽이 커서 쪽으로 최대 약 5도 기운다. 엽서가 모이는 동안은 다시 똑바로
         (위아래를 잠깐 2.5도로 줄였다가 사용자 요청으로 되돌렸다) */
      var follow = 1 - Math.exp(-dt / .5);
      lean.x += (aim.x * k - lean.x) * follow;
      lean.y += (aim.y * k - lean.y) * follow;
      var yaw = lean.x * .2;
      var tx = -lean.y * .09, tz = 0;
      var cx = Math.cos(tx), sx = Math.sin(tx), cz = Math.cos(tz), sz = Math.sin(tz);
      for (var i = 0; i < n; i++) {
        var it = items[i];
        var th = it.a + spin + yaw;   // 나선 위 각도 (위의 뒤집기 각도 ang과 이름이 겹치지 않게)
        var x = Math.sin(th) * R, z = Math.cos(th) * R;
        /* 나선 모양은 제자리에 두고, 카드가 나선을 따라 흘러간다 (돌려도 중심 높이가 바뀌지 않음).
           맨 위로 올라간 카드는 맨 아래에서 다시 나온다 */
        var hh = it.h0 + spin / (TURNS * Math.PI * 2);
        hh = hh - Math.floor(hh) - .5;                       // -0.5 ~ 0.5
        var y = -hh * span;
        var edge = clamp((.5 - Math.abs(hh)) / .07, 0, 1);    // 위아래 끝에서는 흐려졌다가 다시 나타난다
        /* 기울이기: X축 → Z축 */
        var y1 = y * cx - z * sx, z1 = y * sx + z * cx;
        var x2 = x * cz - y1 * sz, y2 = x * sz + y1 * cz;
        /* 모였을 때: 부채꼴로 살짝 엇갈려 쌓인 엽서 묶음 */
        var fanR = 0, fanX = 0, fanY = 0;   // 모였을 때 한 장처럼 딱 맞게 겹친다
        var X = x2 * k + fanX, Y = y2 * k + fanY - rise, Z = (z1 - R * .35) * k - i * .5 * m;
        var deg = ((th * 180 / Math.PI) % 360 + 540) % 360 - 180;   // 바깥을 향한 각도 (-180~180)
        it.el.style.zIndex = 1000 + Math.round(Z * 4);   // 모인 묶음(0.5px 간격)도 앞뒤가 갈리게
        it.el.style.transform = view + 'translate3d(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px,' + Z.toFixed(1) + 'px) rotateZ(' + (tz * 180 / Math.PI).toFixed(2) + 'deg) rotateX(' + (tx * 180 / Math.PI).toFixed(2) + 'deg) rotateY(' + (deg * k).toFixed(2) + 'deg) rotateZ(' + fanR.toFixed(2) + 'deg) scale(' + (1 + .55 * m).toFixed(3) + ')';
        it.el.style.opacity = (edge + (1 - edge) * m).toFixed(3);
        it.el.style.setProperty('--shade', ((1 - Math.cos(th)) / 2 * .42 * k).toFixed(3));
        var back = Math.abs(deg * k) > 90;                   // 뒤돌아 있는 엽서는 글자(장소 이름)를 숨긴다
        if (back !== it.back) { it.el.classList.toggle('is-back', back); it.back = back; }
      }
      /* 엽서가 거의 다 모이면 이제주민 로고 엽서가 아래에서 살짝 떠오르며 맨 위에 덮인다 */
      if (cover) {
        var cv = smooth(.8, 1, m);
        cover.style.visibility = cv > 0 ? 'visible' : 'hidden';
        cover.style.opacity = cv.toFixed(3);
        cover.style.zIndex = 9000;
        cover.style.transform = view + 'translate3d(0,' + ((1 - cv) * 28 - rise).toFixed(1) + 'px,2px) scale(' + (1 + .55 * m).toFixed(3) + ')';
      }
      section.style.setProperty('--merge', m.toFixed(3));
      section.classList.toggle('is-merging', m > .35);
      section.classList.toggle('is-merged', ang > 150);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '200px 0px' }).observe(section);
    } else { visible = true; }
    window.requestAnimationFrame(frame);

    /* 엽서 뒤집기는 스크롤 한 번이면 끝까지 저절로 넘어간다 (사용자 요청 2026-10-27. 전에는 스크롤한 만큼 조금씩 뒤집혔다).
       소개 글이 반쯤 올라간 뒤(진행 FLIP_FROM 이후) 손으로 아래로 조금 내리면 엽서가 다 뒤집힐 때까지 저절로 진행한다.
       다 뒤집힌 엽서에서 위로 올리면 같은 방식으로 뒤집기 전(FLIP_BACK)으로 돌아간다. 뒤집기 구간은 진행 F_A~F_B (frame의 flip)
       손으로 스크롤할 때만(휠·손가락·키보드) 움직이고, 메뉴처럼 저절로 스크롤할 때·움직임 줄이기 설정·팝업이 열려 있을 때는 하지 않는다.
       움직이는 동안과, 끝난 뒤 같은 휠 흐름(트랙패드 관성)이 이어지는 동안은 휠·손가락 스크롤을 막는다 (첫 화면·인터뷰 화면 넘기기와 같음)
       속도: 처음엔 스크롤을 1.4초 동안 저절로 옮기고 그 위치대로 뒤집었는데, 스크롤 곡선과 뒤집기 곡선이 겹쳐
       가운데서 확 빨라졌다(가장 빠를 때 초당 500~750도. 사용자 말 "너무 갑자기 빨라지는 느낌"). 그래서 시간표를 직접 짠다:
       ① 남은 소개 글이 고른 속도로 마저 올라가고(F_A까지) ② 엽서가 TURN_MS 동안 천천히 돌기 시작해 고르게 돌고 천천히 멈춘다
       (각도가 사인 곡선, 가장 빠를 때 초당 약 240도). ①의 속도는 ②가 시작할 때 진행 속도와 같아 이음매에서 멈칫하지 않는다.
       스크롤 위치는 그 진행에 맞춰 옮겨 둘 뿐이다 (무대가 화면에 붙어 있어 스크롤 위치는 보이지 않는다) */
    var TURN_MS = 1200, FLIP_FROM = .72, FLIP_TO = .97, FLIP_BACK = .76;
    var F_A = .78, F_B = .95;                                                  // frame의 smooth(.78, .95, shown)
    var LEAD_V = (F_B - F_A) * Math.PI / (2 * Math.sqrt(3)) / TURN_MS;      // ②가 시작할 때 진행 속도 (1ms당)
    function unsmooth(y) { return .5 - Math.sin(Math.asin(1 - 2 * clamp(y, 0, 1)) / 3); }   // smooth(0, 1, x) = y가 되는 x
    function turnP(u) { return F_A + (F_B - F_A) * unsmooth((1 - Math.cos(Math.PI * u)) / 2); }   // 도는 시간 u(0~1)일 때의 진행
    function flipPlan(dir) {
      var p0 = shown, u0 = Math.acos(1 - 2 * smooth(F_A, F_B, p0)) / Math.PI;   // 지금 뒤집힌 만큼이면 도는 시간 어디쯤인지
      var segs = [];
      if (dir > 0) {
        if (p0 < F_A) segs.push({ ms: (F_A - p0) / LEAD_V, at: function (v) { return p0 + (F_A - p0) * v; } });
        segs.push({ ms: TURN_MS * (1 - u0), at: function (v) { return turnP(u0 + (1 - u0) * v); } });
      } else {
        segs.push({ ms: TURN_MS * u0, at: function (v) { return turnP(u0 * (1 - v)); } });
        var a = Math.min(p0, F_A);
        if (a > FLIP_BACK) segs.push({ ms: 2 * (a - FLIP_BACK) / LEAD_V, at: function (v) { return a - (a - FLIP_BACK) * (1 - (1 - v) * (1 - v)); } });   // 소개 글이 내려오다 천천히 멈춘다
      }
      return segs;
    }
    var flipSnap = null, flipUserAt = -1e9, flipLastY = window.scrollY, flipHoldWheel = false, flipLastWheel = 0;
    var root = document.documentElement;
    function flipStep(ts) {
      if (!flipSnap) return;
      if (flipSnap.start === null) flipSnap.start = ts;
      var left = ts - flipSnap.start, p = shown, done = true;
      for (var i = 0; i < flipSnap.segs.length; i++) {
        var s = flipSnap.segs[i];
        if (left < s.ms) { p = s.at(left / s.ms); done = false; break; }
        left -= s.ms;
        p = s.at(1);
      }
      flipSnap.p = p;
      window.scrollTo(0, Math.round(progressY(done ? flipSnap.end : p)));
      if (!done) { window.requestAnimationFrame(flipStep); return; }
      shown = p;
      flipSnap = null;
      root.style.scrollBehavior = '';
      flipLastY = window.scrollY;
    }
    function startFlip(dir) {
      root.style.scrollBehavior = 'auto';   // 한 칸씩 바로 옮기도록 (html의 부드러운 스크롤을 잠깐 끈다)
      flipSnap = { segs: flipPlan(dir), end: dir > 0 ? FLIP_TO : FLIP_BACK, start: null, p: null };
      window.requestAnimationFrame(flipStep);
    }
    function flipCheck() {
      var y = window.scrollY, dy = y - flipLastY;
      flipLastY = y;
      if (flipSnap || reduce || isOpen) return;
      if (performance.now() - flipUserAt > 350) return;              // 사람이 직접 스크롤할 때만
      var t = target();
      if (dy > 0 && t > FLIP_FROM && t < FLIP_TO - .01) startFlip(1);
      else if (dy < 0 && t > FLIP_BACK + .03 && t < FLIP_TO - .01) startFlip(-1);
    }
    function flipMarkUser() { flipUserAt = performance.now(); }
    window.addEventListener('wheel', flipMarkUser, { passive: true });
    window.addEventListener('touchmove', flipMarkUser, { passive: true });
    window.addEventListener('keydown', function (e) { if (/^(ArrowDown|ArrowUp|PageDown|PageUp| |Spacebar)$/.test(e.key)) flipMarkUser(); });
    window.addEventListener('scroll', flipCheck, { passive: true });
    function flipHold(e) {
      var now = performance.now();
      if (flipSnap) { e.preventDefault(); flipHoldWheel = true; flipLastWheel = now; return; }
      if (flipHoldWheel && e.type === 'wheel') {
        if (now - flipLastWheel < 160) { e.preventDefault(); flipLastWheel = now; return; }
        flipHoldWheel = false;
      }
    }
    window.addEventListener('wheel', flipHold, { passive: false });
    window.addEventListener('touchmove', flipHold, { passive: false });

    /* ---------- 카드 팝업 ---------- */
    if (!pop || !pop.showModal) return;                     // 팝업을 못 여는 아주 오래된 브라우저는 그냥 둔다
    var popCard = pop.querySelector('.pick-pop__card');
    var popTitle = pop.querySelector('.pick-pop__title');
    var popNo = pop.querySelector('.pick-pop__no');
    var popWhy = pop.querySelector('.pick-pop__why');
    var popWord = pop.querySelector('.pick-pop__word-text');
    var popInner = pop.querySelector('.pick-pop__inner');
    var popPhoto = null;                                     // 팝업 그림면의 장소 사진 (엽서 앞면에는 없고 팝업에서만 보인다)
    var opener = null;
    world.addEventListener('click', function (e) {
      var card = e.target.closest('.pcard');
      if (!card) return;
      if (dragged) { dragged = false; return; }               // 돌리려고 끈 것은 누른 것으로 치지 않는다
      opener = card;
      var type = (card.className.match(/pcard--([a-z]+)/) || [])[1] || '';
      popCard.className = 'pick-pop__card ' + (type === 'note' ? 'is-note' : 'pcard pcard--' + type);
      /* 사진은 누를 때마다 새로 만든다 (주소만 바꾸면 새 사진이 올 때까지 앞 엽서의 사진이 잠깐 남는다). 오기 전에는 무늬가 보인다 */
      if (popPhoto) popCard.removeChild(popPhoto);
      popPhoto = null;
      var photo = card.getAttribute('data-photo');
      if (photo) {
        popPhoto = document.createElement('img');
        popPhoto.className = 'pick-pop__photo';
        popPhoto.decoding = 'async';
        popPhoto.alt = card.getAttribute('data-photo-alt') || '';
        popPhoto.src = photo;
        popCard.appendChild(popPhoto);
      }
      /* 글쓰는 면의 우표: 누른 엽서 그림의 우표를 그대로 보여 준다 (CSS가 그림에서 우표 자리만 잘라 보임) */
      var art = window.getComputedStyle(card).backgroundImage;
      if (art && art !== 'none') pop.style.setProperty('--stamp-img', art); else pop.style.removeProperty('--stamp-img');
      pop.setAttribute('data-design', (card.className.match(/pcard--d\d+/) || [''])[0]);
      /* 엽서에 담긴 설문 내용(장소 · 추천 이유 · 한마디)을 팝업에 옮긴다 */
      popNo.textContent = card.getAttribute('data-no') || '';
      popTitle.textContent = card.getAttribute('data-place') || '';
      popWhy.textContent = card.getAttribute('data-why') || '';
      popWord.textContent = card.getAttribute('data-word') || '';
      isOpen = true;
      pop.showModal();
      popInner.scrollTop = 0;
      /* 누른 카드 자리에서 화면 가운데로 커지며 나온다 */
      var a = card.getBoundingClientRect(), b = popInner.getBoundingClientRect();
      if (!reduce && b.width) {
        pop.style.setProperty('--fx', (a.left + a.width / 2 - (b.left + b.width / 2)).toFixed(0) + 'px');
        pop.style.setProperty('--fy', (a.top + a.height / 2 - (b.top + b.height / 2)).toFixed(0) + 'px');
        pop.style.setProperty('--fs', Math.max(.15, a.width / b.width).toFixed(3));
        pop.classList.add('is-from');
        void popInner.offsetWidth;
        pop.classList.remove('is-from');
      }
    });
    pop.querySelector('.pick-pop__close').addEventListener('click', function () { pop.close(); });
    pop.addEventListener('click', function (e) { if (e.target === pop) pop.close(); });   // 바깥(어두운 곳)을 누르면 닫힘
    pop.addEventListener('close', function () {
      isOpen = false;
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
  })();

  /* ---------- 상세 '나의 제주찾기': 살고 싶은 동네 (동네 고르기 + 명소 카드 넘기기) ---------- */
  (function () {
    var section = document.querySelector('.towns');
    if (!section) return;
    var btns = section.querySelectorAll('.towns__btn');
    var panels = section.querySelectorAll('.town');
    var prevBtn = section.querySelector('.towns__arrow--prev');
    var nextBtn = section.querySelector('.towns__arrow--next');
    var status = section.querySelector('.towns__status');
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var current = 0;
    var ticking = false;

    function track() { return panels[current].querySelector('.spots'); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    /* i번째 카드가 목록 맨 앞 자리(앞 여백 바로 뒤)에 오는 스크롤 위치 */
    function cardLeft(list, i) { return list.children[i].offsetLeft - parseFloat(window.getComputedStyle(list).paddingLeft); }
    /* 지금 화면에 다 보이는 카드들 (첫 번호 ~ 끝 번호) */
    function visible(list) {
      var first = -1, last = -1;
      for (var i = 0; i < list.children.length; i++) {
        var left = list.children[i].offsetLeft - list.scrollLeft;
        if (left >= -2 && left + list.children[i].offsetWidth <= list.clientWidth + 2) {
          if (first < 0) first = i;
          last = i;
        }
      }
      if (first < 0) {   // 다 보이는 카드가 없으면 맨 앞에 가장 가까운 카드
        first = 0;
        for (var j = 1; j < list.children.length; j++) {
          if (Math.abs(cardLeft(list, j) - list.scrollLeft) < Math.abs(cardLeft(list, first) - list.scrollLeft)) first = j;
        }
        last = first;
      }
      return { first: first, last: last };
    }

    function update() {
      ticking = false;
      var list = track();
      var v = visible(list);
      var max = list.scrollWidth - list.clientWidth;
      prevBtn.disabled = list.scrollLeft <= 2;
      nextBtn.disabled = list.scrollLeft >= max - 2;
      status.textContent = v.first === v.last
        ? pad(v.first + 1) + ' / ' + pad(list.children.length) + ' · ' + list.children[v.first].querySelector('.spot__name').textContent
        : pad(v.first + 1) + '–' + pad(v.last + 1) + ' / ' + pad(list.children.length);
    }
    function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }

    function go(step) {
      var list = track();
      var i = Math.max(0, Math.min(list.children.length - 1, visible(list).first + step));
      list.scrollTo({ left: cardLeft(list, i), behavior: reduce ? 'auto' : 'smooth' });
    }

    function select(i) {
      if (i === current) return;
      panels[current].classList.remove('is-active');
      btns[current].setAttribute('aria-pressed', 'false');
      current = i;
      panels[i].classList.add('is-active');
      btns[i].setAttribute('aria-pressed', 'true');
      track().scrollLeft = 0;   // 동네를 바꾸면 첫 번째 카드부터
      update();
    }

    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { select(Number(b.getAttribute('data-town'))); });
    });
    Array.prototype.forEach.call(panels, function (p) {
      p.querySelector('.spots').addEventListener('scroll', request, { passive: true });
    });
    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
    window.addEventListener('resize', request);
    update();

    /* PC: 명소 카드 줄을 마우스로 잡고 끌어 넘긴다 (사용자 요청 2026-10-26. 손가락 화면은 원래 밀어서 넘어간다).
       조금(5px) 넘게 움직였을 때부터 끌기로 보고, 놓으면 가까운 카드 앞에 맞춰 멈춘다(15% 넘게 끌면 그 방향 다음 카드).
       끌고 난 뒤의 클릭은 막아, 끌다가 '지도에서 위치 찾기' 링크가 열리지 않게 한다. 그냥 누르면 링크는 그대로 열린다 */
    var drag = null, dragged = false;
    Array.prototype.forEach.call(panels, function (p) {
      var list = p.querySelector('.spots');
      list.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        drag = { list: list, id: e.pointerId, x: e.clientX, left: list.scrollLeft, from: visible(list).first, moved: false };
        dragged = false;
      });
      list.addEventListener('pointermove', function (e) {
        if (!drag || drag.list !== list) return;
        var dx = e.clientX - drag.x;
        if (!drag.moved) {
          if (Math.abs(dx) < 5) return;
          drag.moved = true;
          list.classList.add('is-dragging');
          list.setPointerCapture(drag.id);
        }
        list.scrollLeft = drag.left - dx;
      });
      function endDrag() {
        if (!drag || drag.list !== list) return;
        var d = drag;
        drag = null;
        if (!d.moved) return;
        dragged = true;
        var step = list.children.length > 1 ? list.children[1].offsetLeft - list.children[0].offsetLeft : list.clientWidth;
        var moved = (list.scrollLeft - d.left) / step;
        var n = Math.round(moved);
        if (n === 0 && Math.abs(moved) > 0.15) n = moved > 0 ? 1 : -1;
        var i = Math.max(0, Math.min(list.children.length - 1, d.from + n));
        /* 카드 맞춤(scroll-snap)은 다 넘어간 뒤에 다시 켠다. 바로 켜면 놓은 자리에서 가장 가까운 카드로 먼저 붙어 버린다
           (그래서 얼마나 끌었는지도 끌기 표시를 지우기 전에 잰다) */
        list.classList.add('is-settling');
        list.classList.remove('is-dragging');
        list.scrollTo({ left: cardLeft(list, i), behavior: reduce ? 'auto' : 'smooth' });
        var settled = function () { list.classList.remove('is-settling'); list.removeEventListener('scrollend', settled); };
        list.addEventListener('scrollend', settled);
        window.setTimeout(settled, 800);   // scrollend를 모르는 브라우저
      }
      list.addEventListener('pointerup', endDrag);
      list.addEventListener('pointercancel', endDrag);
      list.addEventListener('click', function (e) {
        if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
      }, true);
      list.addEventListener('dragstart', function (e) { e.preventDefault(); });   // 사진·링크를 끌어 옮기는 브라우저 기본 동작 끔
    });

    /* 처음 그릴 때는 동네 10곳이 다 펼쳐져 있다가 여기서 하나만 남는다. 그래서 메인 카드로 #checklist·#policy에 들어오면
       브라우저가 먼저 내려간 자리가 어긋난다. 동네를 정리한 뒤 그 자리로 다시 맞춘다 (다 불러온 뒤 한 번 더, 그사이 직접 스크롤하면 그만둔다) */
    /* 마을 테스트 결과의 '대표 명소 보러가기'는 #town-1 ~ #town-10(테스트 결과와 같은 순서)으로 온다:
       그 동네를 골라 둔 뒤 아래에서 그 자리로 맞춘다 (2026-10-27) */
    var townHash = /^#town-(\d+)$/.exec(window.location.hash);
    if (townHash && panels[townHash[1] - 1]) select(townHash[1] - 1);
    var target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    var touched = false;
    function jump() {
      if (touched) return;
      var root = document.documentElement;
      root.style.scrollBehavior = 'auto';   // 부드럽게 흐르지 않고 바로
      target.scrollIntoView();
      root.style.scrollBehavior = '';
    }
    ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
      window.addEventListener(type, function () { touched = true; }, { once: true, passive: true });
    });
    jump();
    window.addEventListener('load', jump);
  })();

  /* ---------- 상세 '나의 제주찾기': 제주살이 체크리스트 (이 브라우저에만 저장, 서버로 보내지 않음) ---------- */
  (function () {
    var section = document.querySelector('.check');
    if (!section) return;
    var KEY = 'ijejumin.checklist.v1';
    var items = section.querySelectorAll('.check__item');
    var groups = section.querySelectorAll('.check__group');
    var board = section.querySelector('.check__board');
    var doneEl = section.querySelector('.check__done');
    var expandBtn = section.querySelector('[data-check-expand]');
    var downBtn = section.querySelector('[data-check-download]');
    var state = load();

    function load() {
      try {
        var s = JSON.parse(window.localStorage.getItem(KEY));
        return s && typeof s === 'object' ? s : {};
      } catch (e) { return {}; }
    }
    function save() {
      try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장이 막힌 브라우저: 화면에서만 표시한다 */ }
    }
    function render() {
      var done = 0;
      Array.prototype.forEach.call(items, function (b) {
        var on = !!state[b.getAttribute('data-check')];
        b.setAttribute('aria-pressed', String(on));
        if (on) done++;
      });
      Array.prototype.forEach.call(groups, function (g) {
        g.querySelector('.check__group-count').textContent =
          g.querySelectorAll('.check__item[aria-pressed="true"]').length + ' / ' + g.querySelectorAll('.check__item').length;
      });
      doneEl.textContent = done;
      board.style.setProperty('--done', (done / items.length).toFixed(3));
    }
    function syncExpand() {
      var someClosed = Array.prototype.some.call(groups, function (g) { return !g.open; });
      expandBtn.textContent = someClosed ? wzT('모두 펼치기', 'Expand all', 'すべて開く') : wzT('모두 접기', 'Collapse all', 'すべて閉じる');
    }

    section.addEventListener('click', function (e) {
      var b = e.target.closest('.check__item');
      if (!b) return;
      var id = b.getAttribute('data-check');
      if (state[id]) delete state[id]; else state[id] = 1;
      save();
      render();
    });

    /* 결과 다운로드 (사용자 요청 2026-10-29, 전에는 '기록 지우기'): 지금 표시한 내용을 그림(PNG) 한 장으로 그려 내려받는다.
       누른 그 자리에서 기다림 없이 그려야 아이폰 공유 시트('이미지 저장')가 열린다.
       카톡 같은 앱 안 브라우저는 파일 저장을 막아, 그림을 화면에 띄워 길게 눌러 저장하게 한다 (마을 테스트와 같은 방식) */
    var IN_APP = /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|NAVER\(inapp|Line\/|DaumApps|everytimeApp|BAND\/|MicroMessenger|Weibo/i.test(navigator.userAgent || '');
    var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 줄 나누기: 띄어쓰기에서 나누고, 한 낱말이 한 줄보다 길면(띄어쓰기 없는 일본어) 글자에서 나눈다. 。、 같은 문장부호는 줄 앞에 오지 않게
    function wrapText(ctx, text, max) {
      var lines = [], line = '';
      text.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (ctx.measureText(line + tok).width <= max) { line += tok; return; }
        if (line.trim()) { lines.push(line.trim()); line = ''; tok = tok.replace(/^\s+/, ''); }
        while (tok && ctx.measureText(tok).width > max) {
          var n = tok.length;
          while (n > 1 && ctx.measureText(tok.slice(0, n)).width > max) n--;
          if (n < tok.length && /[。、，．）」』ー・？！]/.test(tok.charAt(n))) n++;
          lines.push(tok.slice(0, n)); tok = tok.slice(n);
        }
        line = tok;
      });
      if (line.trim()) lines.push(line.trim());
      return lines;
    }
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    // 그림: 웹진 이름·제목·확인 수·날짜·막대, 그 아래 주제 6개(항목마다 확인 표시). 높이는 한 번 재고 나서 그린다
    function drawResult() {
      var W = 1080, P = 72, IW = W - P * 2, CP = 36;
      var family = getComputedStyle(document.body).fontFamily;
      var lang = document.documentElement.lang || 'ko';
      var done = section.querySelectorAll('.check__item[aria-pressed="true"]').length;
      var rest = section.querySelector('.check__count').textContent.replace(/^\s*\d+\s*/, '');
      var date = new Date().toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
      var c = document.createElement('canvas'), ctx = c.getContext('2d');
      function font(size, weight) { ctx.font = weight + ' ' + size + 'px ' + family; }
      function text(t, x, y, color) { ctx.fillStyle = color; ctx.fillText(t, x, y); }
      function layout(draw) {
        var y = P, textX = P + CP + 34 + 20, textW = IW - CP * 2 - 34 - 20;
        ctx.textBaseline = 'top';
        if (draw) { ctx.fillStyle = '#F7F3EC'; ctx.fillRect(0, 0, W, c.height); }
        font(28, 800); if (draw) text(wzT('이제주민 · 나의 제주찾기', 'ejejumin · Find My Jeju', 'ejejumin · 私の済州探し'), P, y, '#B4410C');
        y += 48;
        font(60, 800); if (draw) text(section.querySelector('.cat__title').textContent, P, y, '#12233A');
        y += 86;
        ctx.textBaseline = 'alphabetic';
        font(96, 800); var nw = ctx.measureText(String(done)).width;
        if (draw) text(String(done), P, y + 88, '#A8380A');
        font(40, 700); if (draw) text(rest, P + nw + 14, y + 88, '#12233A');
        ctx.textBaseline = 'top';
        y += 112;
        if (draw) {
          ctx.fillStyle = 'rgba(18, 35, 58, .1)'; roundRect(ctx, P, y, IW, 16, 8); ctx.fill();
          if (done) { ctx.fillStyle = '#F97316'; roundRect(ctx, P, y, Math.max(16, IW * done / items.length), 16, 8); ctx.fill(); }
        }
        y += 40;
        font(26, 400);
        var notes = [wzT(date + ' 기준', 'As of ' + date, date + '時点')].concat(wrapText(ctx, section.querySelector('.check__note').textContent, IW));
        notes.forEach(function (l) { if (draw) text(l, P, y, '#3E4A59'); y += 40; });
        y += 32;
        Array.prototype.forEach.call(groups, function (g) {
          var rows = Array.prototype.map.call(g.querySelectorAll('.check__item'), function (b) {
            font(30, 400);
            return { on: b.getAttribute('aria-pressed') === 'true', lines: wrapText(ctx, b.querySelector('.check__text').textContent, textW) };
          });
          var h = CP + 52 + 20;
          rows.forEach(function (r) { h += Math.max(r.lines.length * 44, 44) + 16; });
          h += CP - 16;
          if (draw) {
            ctx.fillStyle = '#FFFFFF'; roundRect(ctx, P, y, IW, h, 24); ctx.fill();
            var hx = P + CP;
            font(28, 800); text(g.querySelector('.check__group-no').textContent, hx, y + CP + 8, '#B4410C');
            hx += ctx.measureText(g.querySelector('.check__group-no').textContent).width + 16;
            font(36, 800); text(g.querySelector('.check__group-title').textContent, hx, y + CP + 2, '#12233A');
            font(28, 800); ctx.textAlign = 'right'; text(g.querySelector('.check__group-count').textContent, P + IW - CP, y + CP + 8, '#5B5246'); ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(18, 35, 58, .12)'; ctx.fillRect(P + CP, y + CP + 56, IW - CP * 2, 2);
          }
          var ry = y + CP + 52 + 20;
          rows.forEach(function (r) {
            if (draw) {
              var bx = P + CP, by = ry + 5;
              roundRect(ctx, bx, by, 34, 34, 8);
              if (r.on) {
                ctx.fillStyle = '#F97316'; ctx.fill();
                ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath(); ctx.moveTo(bx + 8, by + 18); ctx.lineTo(bx + 15, by + 25); ctx.lineTo(bx + 27, by + 10); ctx.stroke();
              } else {
                ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.strokeStyle = '#8A93A0'; ctx.lineWidth = 3; ctx.stroke();
              }
              font(30, r.on ? 700 : 400);
              r.lines.forEach(function (l, i) { text(l, textX, ry + 2 + i * 44, '#12233A'); });
            }
            ry += Math.max(r.lines.length * 44, 44) + 16;
          });
          y += h + 20;
        });
        y += 12;
        font(24, 400); if (draw) text('lxwebzine.hankyung.com/2026-1/team3', P, y, '#5B5246');
        return y + 34 + P;
      }
      c.width = W; c.height = 10;
      var H = layout(false);
      c.height = H;
      layout(true);
      return c;
    }
    function dataToBlob(url) {
      var bin = atob(url.split(',')[1]), u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return new Blob([u], { type: 'image/png' });
    }
    // 앱 안 브라우저: 그림만 화면에 띄워 길게 눌러 저장
    function showShot(url) {
      var dlg = section.querySelector('.check-shot');
      if (!dlg) {
        dlg = document.createElement('dialog');
        dlg.className = 'check-shot';
        dlg.innerHTML = '<img class="check-shot__img" alt=""><p class="check-shot__msg"></p><button class="check-shot__close" type="button"></button>';
        section.appendChild(dlg);
        dlg.querySelector('.check-shot__close').addEventListener('click', function () {
          if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
        });
      }
      dlg.setAttribute('aria-label', wzT('체크리스트 결과 그림', 'Checklist result image', 'チェックリストの結果画像'));
      var img = dlg.querySelector('.check-shot__img');
      img.src = url;
      img.alt = wzT('나의 제주살이 체크리스트 결과', 'My Jeju living checklist results', '私の済州暮らしチェックリストの結果');
      dlg.querySelector('.check-shot__msg').textContent = wzT('그림을 길게 눌러 저장해 주세요', 'Press and hold the image to save it', '画像を長押しして保存してください');
      dlg.querySelector('.check-shot__close').textContent = wzT('닫기', 'Close', '閉じる');
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    downBtn.addEventListener('click', function () {
      var url;
      try { url = drawResult().toDataURL('image/png'); } catch (e) { return; }
      var d = new Date();
      var name = 'ijejumin-checklist-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.png';
      if (IN_APP) { showShot(url); return; }
      if (IS_IOS && navigator.canShare) {
        var file = null;
        try { file = new File([dataToBlob(url)], name, { type: 'image/png' }); } catch (e) { /* 아주 옛 브라우저 */ }
        if (file && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file] }).catch(function (e) { if (!e || e.name !== 'AbortError') showShot(url); });
          return;
        }
      }
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    });
    expandBtn.addEventListener('click', function () {
      var open = Array.prototype.some.call(groups, function (g) { return !g.open; });
      Array.prototype.forEach.call(groups, function (g) { g.open = open; });
      syncExpand();
    });
    Array.prototype.forEach.call(groups, function (g) { g.addEventListener('toggle', syncExpand); });
    render();
    syncExpand();
  })();

  /* ---------- 서브메인 첫 화면: 비행기 창 ---------- */
  var intro = document.querySelector('.intro');
  if (!intro) return;

  var stage = intro.querySelector('.intro__stage');
  var pane = intro.querySelector('.porthole__pane');
  var shade = intro.querySelector('.shade');
  var word = intro.querySelector('.jeju__word');
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  var isOpen = false;
  var maxZoom = 10;
  var dims = { w: 1, h: 1, vw: 1, vh: 1 };
  var ticking = false;

  /* 구름 층: 깊이(z)가 다른 층들 사이를 카메라가 앞으로 날아간다 */
  var layers = Array.prototype.map.call(intro.querySelectorAll('.fly__layer'), function (el) {
    return {
      el: el,
      z: parseFloat(el.getAttribute('data-z')) || 1,
      x: parseFloat(el.getAttribute('data-x')) || 0,
      y: parseFloat(el.getAttribute('data-y')) || 0,
      flip: el.hasAttribute('data-flip') ? -1 : 1,
      shown: false
    };
  });
  var FLY_END = 2.6;   // 마지막 층을 지나는 카메라 위치

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  function placeLayers(cam, enabled) {
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      var d = L.z - cam;
      var visible = enabled && d > 0.03 && d < 1.35;
      if (!visible) {
        if (L.shown) { L.el.style.visibility = 'hidden'; L.el.style.opacity = '0'; L.shown = false; }
        continue;
      }
      var k = 0.34 / d;                                  // 가까울수록 커진다
      var o = smooth(1.35, 0.85, d) * smooth(0.03, 0.24, d);
      L.el.style.visibility = 'visible';
      L.el.style.opacity = o.toFixed(3);
      L.el.style.transform =
        'translate(-50%, -50%) translate(' + (L.x * k).toFixed(2) + 'vw, ' + (L.y * k).toFixed(2) + 'vh) ' +
        'scale(' + (k * L.flip).toFixed(4) + ', ' + k.toFixed(4) + ')';
      L.shown = true;
    }
  }
  function reduced() { return !!(reduceQuery && reduceQuery.matches); }
  function setVar(name, value) { stage.style.setProperty(name, value); }

  /* 가리개 */
  function setShade(value) { setVar('--shade', value.toFixed(3)); }

  function setOpen(open) {
    isOpen = open;
    setShade(open ? 1 : 0);
    stage.classList.toggle('is-open', open);
    shade.setAttribute('aria-pressed', open ? 'true' : 'false');
    shade.setAttribute('aria-label', open ? wzT('창문 가리개 닫기', 'Close the window shade', '窓のシェードを閉じる') : wzT('창문 가리개 열기', 'Open the window shade', '窓のシェードを開ける'));
  }

  var drag = null;
  var suppressClick = false;
  var lastPointer = '';   // 마지막으로 누른 것: 'touch'(손가락)·'mouse'·'pen'. 키보드로 누르면 그대로 남지 않게 click 뒤에 지운다

  /* 가리개를 연 뒤 창 속 하늘을 손가락으로 위로 밀거나(스크롤) 누르면 제주로 들어간다 (사용자 요청 2026-10-27).
     창 유리 자리 전체가 가리개 버튼이고 손가락 스크롤을 막아 두어(touch-action: none), 전에는 하늘을 밀면 가리개만 끌리고
     누르면 가리개가 다시 닫혔다. 아래로 끌면 지금처럼 가리개를 내려 닫는다. 마우스·키보드로 누르면 전처럼 열고 닫는다 */
  function goIn() {
    if (shownP > 0 || run) return;
    markUser();                 // 손으로 출발한 것으로 보고, 빨려 들어가는 동안 페이지를 제자리에 붙잡는다 (holdPlace)
    jumpTo(marks().rest);       // 첫 화면 위 40px로 옮기면 그 스크롤로 빨려 들어가기가 시작된다
  }

  shade.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    lastPointer = e.pointerType || '';
    drag = { y: e.clientY, start: isOpen ? 1 : 0, value: isOpen ? 1 : 0, moved: false };
    if (shade.setPointerCapture) shade.setPointerCapture(e.pointerId);
  });

  shade.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 6) return;
    if (!drag.moved && drag.start === 1 && dy < 0) {   // 열린 창에서 위로 밀기 = 스크롤해서 들어가기
      drag = null; suppressClick = true;
      goIn();
      return;
    }
    if (!drag.moved) { drag.moved = true; stage.classList.add('is-dragging'); }
    var travel = shade.offsetHeight * 0.9061;
    drag.value = clamp(drag.start - dy / travel, 0, 1);
    setShade(drag.value);
  });

  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      stage.classList.remove('is-dragging');
      suppressClick = true;
      var target = Math.abs(drag.value - drag.start) > 0.25 ? !(drag.start === 1) : drag.start === 1;
      setOpen(target);
    }
    drag = null;
  }
  shade.addEventListener('pointerup', endDrag);
  shade.addEventListener('pointercancel', endDrag);

  shade.addEventListener('click', function () {
    var touched = lastPointer === 'touch' || lastPointer === 'pen';
    lastPointer = '';
    if (suppressClick) { suppressClick = false; return; }
    if (isOpen && touched) { goIn(); return; }   // 휴대폰: 열린 창 속 하늘을 누르면 들어간다
    setOpen(!isOpen);
  });

  /* 창 크기에 맞춰 화면을 다 덮을 만큼의 확대 배율 계산 */
  function measure() {
    var w = pane.offsetWidth || 1;
    var h = pane.offsetHeight || 1;
    var vw = stage.clientWidth;
    var vh = stage.clientHeight;
    dims = { w: w, h: h, vw: vw, vh: vh };
    maxZoom = 1.45 * Math.max(vw / (0.6 * w), vh / (0.6 * h));
    /* 큰 글자 "이제,주민": 휴대폰에서 글자 크기를 키워 두면 화면 밖으로 넘치고 분화구에 더 가려진다.
       원래 폭(휴대폰에서 화면의 약 80%)을 넘으면 그만큼 줄인다 (보통은 1) */
    if (word) setVar('--word-fit', Math.min(1, 0.84 * vw / (word.offsetWidth || 1)).toFixed(4));
    /* 세로 화면: 아래 글(.landing__foot)을 사진 바로 아래로 올린다 (사용자 요청 2026-10-27, style.css의 --foot-lift).
       사진 아래 끝 = 72px + 화면 폭의 110% (style.css .jeju 세로 화면 규칙과 같은 수). 글 칸 위 끝을 사진 아래 끝에 맞춘다
       (처음엔 사진 아래쪽 흐려지는 6%만큼 겹쳤는데, 사용자 요청 "살짝 더 내려줘"로 겹치지 않게. 360px 화면에서 약 24px 내려감) */
    var foot = intro.querySelector('.landing__foot');
    if (foot) {
      var lift = 0;
      if (window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches) {
        lift = Math.max(0, foot.offsetTop - (72 + 1.1 * vw));
      }
      setVar('--foot-lift', lift.toFixed(1) + 'px');
    }
    /* 휴대폰에서 글자를 키워 두면(카톡 '가가' 등) 비행기 창 안내 문구 캡슐이 화면보다 길어져 글자가 넘쳤다 (일본어, 2026-10-27).
       한 줄에 안 들어가면 들어갈 만큼 글자를 줄인다 (style.css .intro__hint의 --hint-fit, 보통은 1) */
    Array.prototype.forEach.call(intro.querySelectorAll('.intro__hint'), function (h) {
      h.style.removeProperty('--hint-fit');
      if (h.scrollWidth > h.clientWidth + 1) {
        var cs = getComputedStyle(h), pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        h.style.setProperty('--hint-fit', Math.max(0.6, (h.clientWidth - pad) / (h.scrollWidth - pad) * 0.98).toFixed(3));
      }
      /* 실제 높이: 글자만 키우면 CSS의 1.6em은 키우기 전 크기로 계산돼 캡슐이 위 언어 버튼에 겹쳤다 (style.css --hint-h) */
      h.style.setProperty('--hint-h', h.offsetHeight + 'px');
    });
    /* 제주 화면 윗줄 문구가 두 줄로 접히면(휴대폰 영어, 글자를 키운 휴대폰의 일본어) 로고 아래 끝 높이의 가는 선이 둘째 줄을 가로질렀다.
       문구 아래 끝이 선 자리까지 내려오면 선을 문구 바로 아래로 내린다 (style.css .landing__top::after의 --line-top) */
    var topRow = intro.querySelector('.landing__top'), tagline = intro.querySelector('.landing__tagline'), logo = intro.querySelector('.landing__logo');
    if (topRow && tagline && logo) {
      topRow.style.removeProperty('--line-top');
      var lineAt = logo.offsetHeight * 0.9 - 1;   // style.css 기본 자리와 같다
      var tagBottom = tagline.getBoundingClientRect().bottom - topRow.getBoundingClientRect().top;
      if (tagBottom > lineAt - 2) topRow.style.setProperty('--line-top', Math.round(tagBottom + 4) + 'px');
    }
  }

  /* 스크롤 → 창 속으로 빨려 들어가기 (사용자 요청: 한 번에 빨려 들어가듯이, 2026-10-22)
     조금이라도(8px) 내리면 스크롤 양과 상관없이 약 2.4초 동안 창 → 구름 → 제주까지 한 번에 재생한다.
     맨 위로 돌아오면 같은 방식으로 거꾸로 돌아간다. 재생하는 동안은 휠·손가락 스크롤을 잠깐 막아 끝까지 이어지게 한다 */
  var RUN_MS = 2400;
  var shownP = 0;
  var run = null;   // 지금 재생 중인 움직임 { from, to, start, dur }
  function targetP() {
    var startTop = intro.getBoundingClientRect().top + window.scrollY;   // 상단 바·헤더를 지난 곳부터 (페이지 맨 위 = 0)
    return window.scrollY - startTop > 8 ? 1 : 0;
  }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  /* 제주 화면에 닿으면 곧 올라올 인터뷰 화면의 지금 사람 사진·누끼를 미리 풀어 둔다.
     안 풀어 두면 인터뷰 화면이 올라오기 시작하는 첫 장면에서 사진을 푸느라 0.1초쯤 멈췄다 (사용자 요청 "한번에 깔끔하게", 2026-10-28) */
  function warmNext() {
    if (!after) return;
    Array.prototype.forEach.call(after.querySelectorAll('.is-active img'), function (img) {
      if (img.decode) img.decode().catch(function () {});
    });
  }
  function coveredUp() {   // 다음 섹션 위 끝이 헤더 아래까지 올라와 첫 화면을 다 가렸다
    if (!after) return false;
    var hh = parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 0;
    return after.getBoundingClientRect().top <= hh + 1;
  }
  function update(ts) {
    ticking = false;
    var target = targetP();
    var now = ts || performance.now();
    if (reduced()) { shownP = target; run = null; }
    else if (shownP !== target && (!run || run.to !== target)) {
      /* 첫 화면이 다음 섹션(인터뷰 화면)에 다 가려져 안 보이면 연출 없이 바로 끝 상태로 (주소 #cat-1 등으로 들어올 때, 2026-10-27) */
      if (coveredUp()) { shownP = target; run = null; }
      else run = { from: shownP, to: target, start: now, dur: RUN_MS * Math.abs(target - shownP) + 1 };
    }
    if (run) {
      var k = clamp((now - run.start) / run.dur, 0, 1);
      shownP = run.from + (run.to - run.from) * easeInOut(k);
      if (k >= 1) { shownP = run.to; if (run.to === 1) { restY = window.scrollY; warmNext(); } run = null; holding = false; }   // 제주 화면에 도착한 자리를 기억한다 (아래 '인터뷰 화면 한 번에')
      else requestUpdate();
    }
    var p = shownP;

    if (p > 0.02 && !isOpen) setOpen(true);

    var t = clamp(p / 0.30, 0, 1);              // 창을 통과하는 구간
    var fly = clamp((p - 0.04) / 0.62, 0, 1);    // 구름 속을 날아가는 구간
    var l = clamp((p - 0.60) / 0.18, 0, 1);      // 큰 글자가 떠오르는 구간
    var ui = clamp((p - 0.76) / 0.12, 0, 1);     // 소개 문구·버튼

    /* 구름 속 하얀 안개: 차오르다가 걷힌다 */
    var mist = smooth(0.24, 0.42, p) * (1 - smooth(0.50, 0.68, p));
    /* 섬 아래 안개 */
    var ground = smooth(0.46, 0.58, p) * (1 - smooth(0.64, 0.82, p));
    /* 섬: 구름을 빠져나오며 아래로 내려가는 느낌 */
    var descend = smooth(0.44, 0.90, p);

    if (reduced()) {
      setVar('--zoom', '1');
      setVar('--scene', '1');
      stage.classList.add('is-reduced');
      stage.classList.toggle('is-through', p > 0.2);
      placeLayers(0, false);
      mist = smooth(0.1, 0.2, p) * (1 - smooth(0.25, 0.4, p));
    } else {
      setVar('--zoom', Math.pow(maxZoom, Math.pow(t, 1.7)).toFixed(4));
      setVar('--scene', (1.18 - 0.18 * descend).toFixed(4));
      stage.classList.remove('is-reduced');
      stage.classList.toggle('is-through', t >= 1);
      placeLayers(fly * FLY_END, true);
    }
    var zoomNow = reduced() ? 1 : Math.pow(maxZoom, Math.pow(t, 1.7));
    /* 창밖 사진은 창과 같이 커져서 항상 유리 자리를 꽉 채운다 */
    setVar('--photo-scale', (zoomNow * (1 + 0.08 * t)).toFixed(4));
    setVar('--photo-out', smooth(0.10, 0.24, p).toFixed(3));
    setVar('--reveal', (reduced() ? smooth(0.15, 0.25, p) : smooth(0.40, 0.48, p)).toFixed(3));
    setVar('--mist', (mist * 0.96).toFixed(3));
    setVar('--ground', ground.toFixed(3));
    setVar('--land', l.toFixed(3));
    setVar('--ui', ui.toFixed(3));
    stage.classList.toggle('is-moving', p > 0.01);
    stage.classList.toggle('is-landed', ui > 0.6);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  /* 처음엔 애니메이션 없이 닫힌 상태로 시작 */
  stage.classList.add('is-dragging');
  setOpen(false);
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () { stage.classList.remove('is-dragging'); });
  });
  measure();
  update();
  /* 큰 글자 글꼴이 늦게 들어오면 폭이 달라지니 한 번 더 잰다 */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  /* 페이지를 연 뒤에 글자 크기를 바꿔도(카톡 '가가') 화면 크기는 그대로라 resize가 안 온다. 글이 든 칸의 크기가 바뀌면 다시 잰다 */
  if ('ResizeObserver' in window) {
    var textRo = new ResizeObserver(function () { measure(); });
    Array.prototype.forEach.call(intro.querySelectorAll('.landing__tagline, .intro__hint'), function (el) { textRo.observe(el); });
  }

  /* 첫 화면(비행기 창 → 제주)을 보는 동안은 헤더를 위로 숨긴다.
     다음 화면(인터뷰)이 아래에서 올라와 헤더 자리에 닿기 직전(헤더 높이만큼 남았을 때)부터
     스크롤에 맞춰 헤더가 내려온다. 그래서 헤더가 제주 사진 위에 오래 겹치지 않는다 */
  var root = document.documentElement;
  var after = intro.nextElementSibling;
  /* 숨길 높이는 헤더에만 넣는다. html에 넣으면 헤더가 내려오는 장면마다 페이지 전체(요소 480여 개) 스타일을 다시 계산해 버벅였다 (2026-10-28) */
  var hdrEl = document.querySelector('.wz-header') || root;
  function syncHeader() {
    var hh = parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 0;
    var top = after ? after.getBoundingClientRect().top : intro.getBoundingClientRect().bottom;
    hdrEl.style.setProperty('--hdr-hide', clamp(top - hh, 0, hh).toFixed(1) + 'px');
  }
  root.classList.add('has-intro');
  syncHeader();

  /* 제주 화면 → 인터뷰 화면: 스크롤하면 인터뷰 화면이 한 번에 쓱 올라온다 (사용자 요청 "한번에 슉 뜨는 걸로, 너무 빠르지 않게", 2026-10-23)
     제주 화면에 도착한 뒤 아래로 조금(24px) 내리면, 인터뷰 화면이 올라오기 시작하는 곳으로 바로 옮긴 다음(제주 화면은 그대로라 티가 안 난다)
     SNAP_MS(1.2초) 동안 인터뷰 화면이 다 올라온 곳(헤더 아래)까지 저절로 스크롤한다. 인터뷰 첫 화면에서 위로 올리면 같은 방식으로 제주 화면으로 돌아간다.
     손으로 스크롤할 때만(휠·손가락·키보드) 움직이고, 메뉴·맨 위로 버튼처럼 저절로 스크롤할 때는 끼어들지 않는다. 움직임 줄이기 설정이면 하지 않는다.
     (전에는 스크롤한 만큼 조금씩 올라왔다) */
  var SNAP_MS = 1200;
  var snap = null;            // 지금 재생 중인 저절로 스크롤 { from, to, then, start }
  var restY = null;           // 제주 화면에 머무는 자리 (도착한 곳)
  var userAt = -1e9;          // 사람이 마지막으로 스크롤한 때
  var lastY = window.scrollY;
  function pageY(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function marks() {
    var hh = parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 0;
    var y = pageY(after);
    return { rise: y - window.innerHeight, full: y - hh, rest: pageY(intro) + 40 };
  }
  function snapStep(ts) {
    if (!snap) return;
    if (snap.start === null) snap.start = ts;
    var k = clamp((ts - snap.start) / SNAP_MS, 0, 1);
    window.scrollTo(0, snap.from + (snap.to - snap.from) * easeInOut(k));
    if (k < 1) { window.requestAnimationFrame(snapStep); return; }
    var then = snap.then;
    snap = null;
    if (then !== null) { window.scrollTo(0, then); restY = then; }
    root.style.scrollBehavior = '';
    lastY = window.scrollY;
  }
  function startSnap(from, to, then) {
    root.style.scrollBehavior = 'auto';   // 한 칸씩 바로 옮기도록 (html의 부드러운 스크롤을 잠깐 끈다)
    window.scrollTo(0, from);
    snap = { from: from, to: to, then: then, start: null };
    window.requestAnimationFrame(snapStep);
  }
  function snapCheck() {
    var y = window.scrollY, dy = y - lastY;
    lastY = y;
    if (snap || run || shownP !== 1 || reduced() || !after) return;
    if (performance.now() - userAt > 350) return;                    // 사람이 직접 스크롤할 때만
    var m = marks();
    var rest = restY === null ? m.rest : restY;
    if (dy > 0 && y > rest + 24 && y < m.full - 2) startSnap(Math.max(y, m.rise), m.full, null);   // 아래로: 인터뷰 화면이 올라온다
    else if (dy < 0 && y > m.rise && y < m.full - 24) startSnap(y, m.rise, m.rest);                // 위로: 제주 화면으로 돌아간다
  }
  function markUser() { userAt = performance.now(); }
  window.addEventListener('wheel', markUser, { passive: true });
  window.addEventListener('touchmove', markUser, { passive: true });
  window.addEventListener('keydown', function (e) { if (/^(ArrowDown|ArrowUp|PageDown|PageUp| |Spacebar)$/.test(e.key)) markUser(); });

  /* 비행기 창 → 제주로 빨려 들어가는 동안은 페이지를 제자리(m.rest)에 붙잡아 둔다 (사용자 요청 "순서에 맞게 올라오게", 2026-10-26)
     휠을 세게 굴리거나 손가락으로 튕기면 페이지가 한 번에 수백~수천 px 내려가, 창문 위로 인터뷰 화면이 먼저 올라왔다.
     연출 화면은 위에 붙어 있어(sticky) 그 사이 어디에 있든 똑같이 보이므로, 더 내려간 만큼 되돌려도 티가 나지 않는다.
     손으로 스크롤해 출발할 때만 붙잡는다. 주소(#cat-1 등)나 메뉴를 따라 저절로 내려갈 때는 그대로 둔다 */
  var holding = false;
  function jumpTo(y) {
    root.style.scrollBehavior = 'auto';   // html의 부드러운 스크롤 대신 바로 옮긴다
    try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (err) { window.scrollTo(0, y); }
    if (!snap) root.style.scrollBehavior = '';
  }
  function holdPlace() {
    if (reduced() || !after || targetP() !== 1 || (shownP === 1 && !run)) { holding = false; return; }
    if (!holding) {
      if ((run && run.to === 1) || performance.now() - userAt > 350) return;   // 이미 저절로 출발했거나, 사람이 스크롤한 게 아니면
      holding = true;
    }
    var cap = marks().rest;
    if (window.scrollY > cap) jumpTo(cap);
  }

  window.addEventListener('scroll', function () { holdPlace(); syncHeader(); requestUpdate(); snapCheck(); }, { passive: true });
  window.addEventListener('resize', function () { measure(); syncHeader(); requestUpdate(); });
  if (reduceQuery && reduceQuery.addEventListener) reduceQuery.addEventListener('change', requestUpdate);
  /* 제주로 빨려 들어가는 동안, 인터뷰 화면이 저절로 올라오는(내려가는) 동안은 휠·손가락 스크롤을 막는다.
     끝난 뒤에도 같은 휠 흐름(트랙패드 관성)이 이어지는 동안은 계속 막아, 남은 힘으로 다음 화면까지 넘어가지 않게 한다 (휠이 0.16초 쉬면 풀린다) */
  var holdWheel = false, lastWheel = 0;
  function holdScroll(e) {
    var now = performance.now();
    if ((run && run.to === 1) || snap) { e.preventDefault(); holdWheel = true; lastWheel = now; return; }
    /* 비행기 창(제주에 닿기 전)에서 아래로 굴린 첫 휠은 페이지를 그만큼 내리지 않고, 제자리로만 옮겨 빨려 들어가기를 시작한다 */
    if (e.type === 'wheel' && e.deltaY > 0 && !e.ctrlKey && shownP < 1 && !reduced() && after && window.scrollY < marks().rest) {
      e.preventDefault(); holdWheel = true; lastWheel = now; jumpTo(marks().rest); return;
    }
    if (holdWheel && e.type === 'wheel') {
      if (now - lastWheel < 160) { e.preventDefault(); lastWheel = now; return; }
      holdWheel = false;
    }
  }
  window.addEventListener('wheel', holdScroll, { passive: false });
  window.addEventListener('touchmove', holdScroll, { passive: false });

  /* 상세페이지 헤더 메뉴(../index.html#cat-1·#cat-2·#cat-3)로 돌아오면 비행기 창 없이 그 섹션에서 바로 시작한다 (사용자 요청 2026-10-27).
     전에는 서브메인이 맨 위(비행기 창)에서 열린 뒤 html의 부드러운 스크롤로 0.5~1.3초 동안 창 → 구름 → 제주를 지나 내려갔다.
     이 스크립트는 첫 화면을 그리기 전에 돈다(같은 사이트 안 이동이라 브라우저가 앞 페이지를 잠깐 들고 있다). 그래서 여기서 그 자리로 바로 옮기면
     창문이 그려지지 않는다. 창 → 제주 연출은 화면 밖이라 재생하지 않고 바로 끝 상태로 둔다 (update의 coveredUp).
     글꼴·사진이 늦게 들어와 자리가 밀릴 수 있어 다 불러온 뒤 한 번 더 맞춘다 (그사이 직접 스크롤하면 그만둔다).
     브라우저도 다 불러온 뒤 같은 자리로 스크롤하므로, 그때까지는 부드러운 스크롤을 꺼 둔다 */
  /* 다른 언어 서브메인에서 언어 버튼으로 왔으면 보던 자리에서 바로 시작한다 (맨 위 '언어를 바꿔도 보던 자리에서', 2026-10-28)
     비행기 창이었으면 그대로 처음부터, 제주 화면이었으면 비행기 창 → 제주 연출 없이 제주 화면에서, 그 아래 섹션이면 그 자리에서 */
  wzPlace.introMode = function () {
    if (run ? run.to === 0 : shownP === 0) return 'top';
    return after && window.scrollY < marks().full - 2 ? 'landed' : null;
  };
  var langPlace = wzPlace.take();
  var entry = !langPlace && window.location.hash && document.getElementById(window.location.hash.slice(1));
  if (langPlace || (entry && !intro.contains(entry))) {
    var entryTouched = false;
    var placeEntry = function () {
      if (entryTouched) return;
      var hh = parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 0;
      if (langPlace && langPlace.mode === 'landed') {
        jumpTo(marks().rest);
        shownP = 1; run = null; restY = window.scrollY;
        warmNext();
      } else jumpTo(langPlace ? wzPlace.y(langPlace) : Math.max(0, pageY(entry) - hh));
      root.style.scrollBehavior = 'auto';
      lastY = window.scrollY;
      syncHeader(); update();
    };
    ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
      window.addEventListener(type, function () { entryTouched = true; }, { once: true, passive: true });
    });
    placeEntry();
    window.addEventListener('load', function () {
      placeEntry();
      window.setTimeout(function () { if (!snap) root.style.scrollBehavior = ''; }, 600);
    });
  }
})();

/* ---------- 맨 위로 버튼 (.to-top, 모든 페이지 공용) ----------
   페이지 아래쪽(끝까지 남은 길이가 화면 1.6개 이하)부터 오른쪽 아래에 나타나 스크롤을 따라다닌다 (사용자가 준 레퍼런스, 2026-10-23).
   주황 푸터 위로도 따라 내려가고, 맨 아래 공통 푸터 줄(.site-footer)이 올라오면 그만큼 올려(--lift) 그 줄 위에서 멈춘다.
   (처음엔 주황 푸터 위 끝에서 멈췄는데, 사용자 요청 "푸터 위로도 올라올 수 있게"로 바꿈) 누르면 맨 위로 부드럽게 올라간다 */
(function () {
  'use strict';
  var btn = document.querySelector('.to-top');
  if (!btn) return;
  var foot = document.querySelector('.site-footer');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var left = document.documentElement.scrollHeight - (window.scrollY + vh);   // 페이지 끝까지 남은 길이
    btn.classList.toggle('is-shown', left < vh * 1.6);
    var lift = 0;
    if (foot) {
      var gap = parseFloat(getComputedStyle(btn).bottom) || 0;     // 화면 아래와 버튼 사이
      lift = Math.max(0, (vh - gap) - (foot.getBoundingClientRect().top - 12));   // 맨 아래 줄 위 선에서 12px 위
    }
    btn.style.setProperty('--lift', lift.toFixed(0) + 'px');
  }
  function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  update();
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    btn.blur();
  });
})();


/* =========================================================================
   이주민 인터뷰 기사 (articles/*.html) 전용 스크립트
   - 위쪽 서브메인 스크립트와 변수 이름이 섞이지 않도록 따로 감싸 두었습니다.
   - 해당 요소가 없는 페이지(서브메인 등)에서는 아무 일도 하지 않습니다.
   ========================================================================= */
/* 이제주민 · 한경 웹진 — 공통 스크립트 (이 파일 하나만 사용)
   스크립트가 꺼져 있어도 모든 내용과 링크는 그대로 보이고 작동한다. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 0. 글자 하나씩 움직일 제목: 글자를 span으로 나누고, 읽기 도구에는 원래 문장을 전달 */
  if (!reduceMotion) {
    document.querySelectorAll(".split").forEach(function (el) {
      var text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.textContent = "";
      Array.prototype.forEach.call(text, function (ch) {
        var s = document.createElement("span");
        s.className = "char";
        s.setAttribute("aria-hidden", "true");
        s.textContent = ch;
        el.appendChild(s);
      });
    });
  }

  /* 1. 서브메인 지도: 목록 항목에 올리면 같은 번호 핀 강조 */
  var stops = document.querySelectorAll(".stops a[data-stop]");
  function setActive(num) {
    document.querySelectorAll(".map-pin, .stops a").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-stop") === num);
    });
  }
  stops.forEach(function (link) {
    var num = link.getAttribute("data-stop");
    link.addEventListener("mouseenter", function () { setActive(num); });
    link.addEventListener("focus", function () { setActive(num); });
    link.addEventListener("mouseleave", function () { setActive(null); });
    link.addEventListener("blur", function () { setActive(null); });
  });

  /* 2. 강조 문장(.typing): 화면에 들어오면 문장 전체가 한 번에 떠오른다 (사용자 요청 2026-10-27).
     전에는 한 글자씩 써지는 타이핑 연출이었다. 클래스 이름 typing은 그때 이름을 그대로 둔다 */
  var typings = Array.prototype.slice.call(document.querySelectorAll(".typing"));

  /* 3. 스크롤하면 나타나기 (강조 문장도 같이) */
  var watched = Array.prototype.slice.call(document.querySelectorAll(".reveal")).concat(typings);
  if ("IntersectionObserver" in window && watched.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* 5. 쇼츠 넘기기: 카드가 한 줄을 넘칠 때만 화살표를 보여주고, 끝에 닿으면 흐리게 */
  document.querySelectorAll(".shorts-wrap").forEach(function (wrap) {
    var track = wrap.querySelector(".reels");
    var nav = wrap.querySelector(".reels-nav");
    if (!track || !nav) return;
    var prev = nav.querySelector('[data-dir="-1"]');
    var next = nav.querySelector('[data-dir="1"]');

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      nav.hidden = max <= 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    }
    nav.querySelectorAll(".reels-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = Number(btn.getAttribute("data-dir"));
        track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* 6. 지도 커서 반응: 커서를 따라 빛이 움직이고, 가까운 마을·불빛이 밝아짐
     (SVG 원의 위치 속성만 바꾸고 페이지에 style을 쓰지 않음) */
  document.querySelectorAll(".map, .places-map").forEach(function (box) {
    var svg = box.querySelector(".map-layer");
    var glow = svg && svg.querySelector(".map-glow");
    if (!svg || !glow || !svg.createSVGPoint) return;
    var targets = Array.prototype.map.call(box.querySelectorAll(".map-town, .map-pin, .place-pin"), function (el) {
      var c = el.querySelector(".town-dot, .light-dot");
      return c ? { el: el, x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) } : null;
    }).filter(Boolean);
    var pt = svg.createSVGPoint(), frame = 0, last = null;

    function update() {
      frame = 0;
      var ctm = svg.getScreenCTM();
      if (!ctm || !last) return;
      pt.x = last.x; pt.y = last.y;
      var p = pt.matrixTransform(ctm.inverse());
      glow.setAttribute("cx", p.x.toFixed(1));
      glow.setAttribute("cy", p.y.toFixed(1));
      targets.forEach(function (t) {
        t.el.classList.toggle("is-near", Math.hypot(t.x - p.x, t.y - p.y) < 110);
      });
    }
    box.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      last = { x: e.clientX, y: e.clientY };
      box.classList.add("is-pointer");
      if (!frame) frame = requestAnimationFrame(update);
    });
    box.addEventListener("pointerleave", function () {
      box.classList.remove("is-pointer");
      targets.forEach(function (t) { t.el.classList.remove("is-near"); });
    });
  });

  /* 7. 섬 프레임 슬라이드: 버튼·점·화살표 키·마우스 끌기로 넘기고, 아래 설명을 바꿈 */
  document.querySelectorAll(".isle").forEach(function (box) {
    var track = box.querySelector(".isle-track");
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(box.querySelectorAll(".isle-dot"));
    var cap = box.querySelector(".isle-caption");
    var n = slides.length, current = 0, raf = 0, drag = null;
    function pad(v) { return (v < 10 ? "0" : "") + v; }
    function go(i, instant) {
      i = (i + n) % n;
      track.scrollTo({ left: i * track.clientWidth, behavior: instant || reduceMotion ? "auto" : "smooth" });
    }
    function render(i) {
      if (i === current || !slides[i]) return;
      current = i;
      slides.forEach(function (s, k) { s.classList.toggle("is-current", k === i); });
      dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); });
      cap.querySelector(".isle-cap-num").textContent = pad(i + 1) + ".";
      cap.querySelector(".isle-cap-name").textContent = slides[i].getAttribute("data-name");
      cap.querySelector(".isle-cap-sub").textContent = slides[i].getAttribute("data-sub");
      cap.querySelector(".isle-cap-desc").textContent = slides[i].getAttribute("data-desc");
      var credit = cap.querySelector(".isle-cap-credit");
      if (credit) credit.textContent = slides[i].getAttribute("data-credit") || "";
      cap.classList.remove("is-changing"); void cap.offsetWidth; cap.classList.add("is-changing");
    }
    track.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; render(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))); });
    }, { passive: true });
    box.querySelectorAll(".isle-nav").forEach(function (b) {
      b.addEventListener("click", function () { go(current + Number(b.getAttribute("data-dir"))); });
    });
    dots.forEach(function (d) { d.addEventListener("click", function () { go(Number(d.getAttribute("data-i"))); }); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
    });
    window.addEventListener("resize", function () { go(current, true); });
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft };
      track.classList.add("is-dragging");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", function (e) { if (drag) track.scrollLeft = drag.left - (e.clientX - drag.x); });
    function endDrag() {
      if (!drag) return;
      var dx = track.scrollLeft - drag.left, w = track.clientWidth, start = Math.round(drag.left / w);
      drag = null;
      track.classList.remove("is-dragging");
      var target = Math.abs(dx) > w * 0.15 ? start + (dx > 0 ? 1 : -1) : start;
      go(Math.max(0, Math.min(n - 1, target)));
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
  });

  /* 8. 인터뷰 탭: 휴대폰에서 지금 보고 있는 페이지 탭이 보이도록 줄을 옮김 */
  document.querySelectorAll(".ivnav .container").forEach(function (row) {
    var cur = row.querySelector('[aria-current="page"]');
    if (cur && row.scrollWidth > row.clientWidth) row.scrollLeft = cur.offsetLeft - row.offsetLeft - 16;
  });

  /* 4. 추천 장소: 지도 핀을 누르면 팝업으로 설명 (스크립트가 없으면 아래 목록으로 이동) */
  document.querySelectorAll(".places").forEach(function (box) {
    var popup = box.querySelector(".place-popup");
    var body = popup && popup.querySelector(".place-popup-body");
    var closeBtn = popup && popup.querySelector(".popup-close");
    if (!popup || !body) return;
    var lastPin = null;

    function close() {
      popup.hidden = true;
      box.querySelectorAll(".is-active").forEach(function (el) { el.classList.remove("is-active"); });
      if (lastPin) lastPin.focus();
    }
    function open(pin) {
      var id = (pin.getAttribute("href") || "").replace("#", "");
      var item = id && document.getElementById(id);
      if (!item) return;
      box.querySelectorAll(".is-active").forEach(function (el) { el.classList.remove("is-active"); });
      pin.classList.add("is-active");
      item.classList.add("is-active");
      body.innerHTML = "";
      var title = item.querySelector("h3"), tag = item.querySelector(".place-tag");
      if (tag) body.appendChild(tag.cloneNode(true));
      if (title) body.appendChild(title.cloneNode(true));
      item.querySelectorAll("p").forEach(function (p) { body.appendChild(p.cloneNode(true)); });
      popup.hidden = false;
      lastPin = pin;
      closeBtn.focus();
    }
    box.querySelectorAll(".place-pin").forEach(function (pin) {
      pin.addEventListener("click", function (e) { e.preventDefault(); open(pin); });
    });
    closeBtn.addEventListener("click", close);
    popup.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  });

  /* 유튜브 플레이어에 명령을 보내고(일시정지·재생), 지금 재생 중인지 기억함. 쇼츠 창을 열 때 본문 영상을 잠시 멈추는 데 씀 */
  var YT_ORIGIN = "https://www.youtube-nocookie.com";
  function ytSend(frame, data) {
    if (frame && frame.contentWindow) frame.contentWindow.postMessage(JSON.stringify(data), YT_ORIGIN);
  }
  function ytCommand(frame, func) { ytSend(frame, { event: "command", func: func, args: "" }); }
  window.addEventListener("message", function (e) {
    if (e.origin !== YT_ORIGIN) return;
    var d;
    try { d = JSON.parse(e.data); } catch (err) { return; }
    if (!d) return;
    var info = d.info && typeof d.info === "object" ? d.info : {};
    var state = d.event === "onStateChange" ? d.info : info.playerState;
    if (typeof state !== "number") state = null;
    document.querySelectorAll(".video-card.is-playing iframe").forEach(function (f) {
      if (f.contentWindow !== e.source) return;
      if (state !== null) f.ytState = state;
      if (typeof info.muted === "boolean") f.ytMuted = info.muted;   // 소리를 껐는지 (소리 아이콘을 누르면 바뀐다)
      if (f.onYt) f.onYt(state);
    });
  });

  /* 9. 영상 카드: 페이지를 열면 그 자리에 바로 YouTube 플레이어를 보여 주고, 재생 버튼을 한 번 누르면 바로 재생 (사용자 요청 2026-10-23)
     전에는 썸네일 카드를 먼저 보여 주고 누르면 플레이어를 불러왔는데, 휴대폰에서는 플레이어가 멈춘 채 떠서 한 번 더 눌러야 했다
     스크롤해서 영상이 화면에 반쯤 들어오면 소리 없이 저절로 재생한다 (사용자 요청 2026-10-23, 아래 sync)
     (스크립트가 없으면 카드는 YouTube로 가는 링크로 남는다) */
  document.querySelectorAll(".video-card[data-video-id]").forEach(function (card) {
    var cap = card.querySelector(".video-card-cap");
    var title = cap ? cap.textContent.replace(/\s*·\s*(YouTube에서 보기|Watch on YouTube|YouTubeで見る)\s*$/, "") : "";
    var box = document.createElement("div");
    box.className = card.className + " is-playing";
    if (card.id) box.id = card.id;
    var thumb = document.createElement("div");
    thumb.className = "video-card-thumb";
    var frame = document.createElement("iframe");
    frame.src = YT_ORIGIN + "/embed/" + encodeURIComponent(card.getAttribute("data-video-id")) + "?rel=0&playsinline=1&enablejsapi=1" +
      (/^https?:$/.test(location.protocol) ? "&origin=" + encodeURIComponent(location.origin) : "");
    frame.addEventListener("load", function () { ytSend(frame, { event: "listening", id: 1, channel: "widget" }); });
    frame.title = title || wzT("인터뷰 영상", "Interview video", "インタビュー動画");
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute("loading", "lazy");
    thumb.appendChild(frame);
    var link = document.createElement("a");
    link.className = "video-card-cap";
    link.href = card.href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = cap ? cap.textContent : wzT("YouTube에서 보기", "Watch on YouTube", "YouTubeで見る");
    var pip = card.hasAttribute("data-pip") && "IntersectionObserver" in window;
    if (pip) {
      /* 영상 자리(stage)는 제자리에 남겨 두고, 영상 틀만 화면 오른쪽 아래로 옮겨 따라다니게 함 (영상이 다시 로드되지 않음) */
      var stage = document.createElement("div");
      stage.className = "video-card-stage";
      stage.appendChild(thumb);
      box.appendChild(stage);
    } else {
      box.appendChild(thumb);
    }
    box.appendChild(link);
    card.replaceWith(box);

    /* 저절로 재생: 영상 자리가 화면에 반 이상 보이면 소리 없이 틀고, 거의 다 벗어나면 멈춘다
       - 브라우저가 소리 있는 자동 재생을 막아서 소리 없이 튼다. 플레이어의 소리 아이콘을 누르면 소리가 나온다
       - 보고 있던 영상(engaged)은 화면 밖으로 나가도 멈추지 않고 오른쪽 아래 작은 창으로 따라온다. 소리가 꺼져 있어도 된다
         보고 있던 영상 = 화면 안에서 3초 넘게 재생됐거나(WATCH_MS), 직접 누른(재생·소리 켜기·플레이어를 누름) 영상 (사용자 요청 2026-10-23)
         그냥 스쳐 지나가면(3초 안 되게 재생) 멈춘다
       - 직접 멈추거나 끝까지 보면 다시 저절로 틀지 않는다. 움직임 줄이기 설정이면 처음부터 저절로 틀지 않는다
       - 브라우저가 소리 없는 자동 재생까지 막으면(카톡 등 앱 안 브라우저) 소리를 다시 켜 두어, 재생 버튼을 누르면 소리와 함께 나온다 */
    var WATCH_MS = 3000;
    var ready = false, seen = 0, engaged = false, ourPause = 0, autoPlaying = false, autoTimer = 0, watchFrom = 0;
    var stopped = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var isPlaying = function () { return frame.ytState === 1 || frame.ytState === 3; };
    var syncPip = function () {};
    /* 화면 안에서 재생이 이어진 시간을 잰다. 3초를 넘기고 멈추거나 벗어나면 보고 있던 영상 */
    var watchTick = function () {
      var on = isPlaying() && seen >= 0.1;
      if (on && !watchFrom) watchFrom = Date.now();
      if (!on && watchFrom) {
        if (Date.now() - watchFrom >= WATCH_MS) engaged = true;
        watchFrom = 0;
      }
    };
    var sync = function () {
      if (!ready) return;
      watchTick();
      if (seen >= 0.5 && !stopped && !isPlaying() && !autoPlaying) {
        autoPlaying = true;
        ytCommand(frame, "mute");
        ytCommand(frame, "playVideo");
        clearTimeout(autoTimer);
        autoTimer = setTimeout(function () {
          if (!autoPlaying || isPlaying()) return;
          autoPlaying = false;   // 브라우저가 막았다: 소리를 되돌려 두고 더는 저절로 틀지 않는다
          stopped = true;
          ytCommand(frame, "unMute");
        }, 4000);
      } else if (seen < 0.1 && isPlaying() && !engaged) {
        ourPause = Date.now();
        ytCommand(frame, "pauseVideo");
      }
      syncPip();
    };
    frame.onYt = function (state) {
      if (state === 1) {
        if (autoPlaying) autoPlaying = false;   // 저절로 튼 재생이 시작됐다
        else engaged = true;                    // 직접 틀었다
        stopped = false;
      }
      if (state === 2 && Date.now() - ourPause > 1500) stopped = true;   // 직접 멈췄다 (스크롤로 멈춘 것은 빼고)
      if (state === 0) { stopped = true; engaged = false; }   // 끝까지 봤다
      if (isPlaying() && frame.ytMuted === false) engaged = true;   // 소리를 켰다
      watchTick();
      if (!ready) { ready = true; sync(); } else syncPip();
    };
    /* 플레이어 안을 누르면(재생·소리·자막 버튼 등) 페이지가 포커스를 잃고 포커스가 플레이어로 간다 → 직접 누른 영상 */
    window.addEventListener("blur", function () {
      setTimeout(function () {
        if (document.activeElement === frame) { engaged = true; syncPip(); }
      }, 0);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        seen = entries[0].isIntersecting ? entries[0].intersectionRatio : 0;
        sync();
      }, { threshold: [0, 0.1, 0.5] }).observe(pip ? stage : thumb);
    }

    if (pip) {
      var pipClose = document.createElement("button");
      pipClose.type = "button";
      pipClose.className = "video-pip-close";
      pipClose.setAttribute("aria-label", wzT("작은 영상 닫기", "Close mini player", "ミニプレーヤーを閉じる"));
      pipClose.textContent = "✕";
      thumb.appendChild(pipClose);
      /* 작은 창에서 영상 자리까지 내려가지 않고 화면 가운데로 크게 키워 보기 (같은 영상이라 끊기지 않음) */
      var pipExpand = document.createElement("button");
      pipExpand.type = "button";
      pipExpand.className = "video-pip-expand";
      thumb.appendChild(pipExpand);
      var setLarge = function (on) {
        box.classList.toggle("is-pip-large", on);
        pipExpand.textContent = on ? "⤡" : "⤢";
        pipExpand.setAttribute("aria-label", on ? wzT("작은 창으로 줄이기", "Shrink to mini player", "小さくする") : wzT("영상 크게 보기", "Enlarge video", "動画を大きく見る"));
      };
      setLarge(false);
      pipExpand.addEventListener("click", function () { setLarge(!box.classList.contains("is-pip-large")); });
      stage.addEventListener("click", function (e) { if (e.target === stage) setLarge(false); });
      var onKey = function (e) {
        if (e.key === "Escape" && box.classList.contains("is-pip-large")) setLarge(false);
      };
      document.addEventListener("keydown", onKey);
      /* 작은 창은 보고 있던 영상(engaged)만, 영상 자리가 화면 밖으로 나가면 뜬다 (스쳐 지나간 영상은 그냥 멈춘다) */
      syncPip = function () {
        var on = seen < 0.1 && engaged;
        box.classList.toggle("is-pip", on);
        if (!on) setLarge(false);
      };
      /* 작은 창 닫기: 영상을 멈추고 제자리로 돌려놓는다. 다시 틀면 작은 창도 다시 뜬다 */
      pipClose.addEventListener("click", function () {
        ytCommand(frame, "pauseVideo");
        stopped = true;
        engaged = false;
        watchFrom = 0;
        syncPip();
      });
    }
  });

  /* 10. 쇼츠 카드: 누르면 같은 페이지 위에 창이 떠서 바로 재생 (스크립트가 없거나 주소에 영상 번호가 없으면 YouTube로 이동) */
  (function () {
    var cards = document.querySelectorAll(".reels a[href]");
    if (!cards.length) return;
    var modal = null, frameBox, closeBtn, link, lastCard = null, pausedFrames = [];

    function videoId(href) {
      var m = /^https:\/\/(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:shorts\/|watch\?v=))([\w-]{11})/.exec(href);
      return m ? m[1] : "";
    }
    function build() {
      modal = document.createElement("div");
      modal.className = "video-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", wzT("쇼츠 재생", "Play short", "ショート動画を再生"));
      modal.hidden = true;
      var box = document.createElement("div");
      box.className = "video-modal-box";
      closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "video-modal-close";
      closeBtn.setAttribute("aria-label", wzT("영상 닫기", "Close video", "動画を閉じる"));
      closeBtn.textContent = "✕";
      frameBox = document.createElement("div");
      frameBox.className = "video-modal-frame";
      link = document.createElement("a");
      link.className = "video-modal-link";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = wzT("YouTube에서 보기", "Watch on YouTube", "YouTubeで見る");
      box.appendChild(closeBtn);
      box.appendChild(frameBox);
      box.appendChild(link);
      modal.appendChild(box);
      document.body.appendChild(modal);
      closeBtn.addEventListener("click", close);
      modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
      modal.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { close(); return; }
        if (e.key !== "Tab") return;
        var first = closeBtn, last = link;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
    function open(card, id) {
      if (!modal) build();
      frameBox.textContent = "";
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
      frame.title = wzT("이제주민 쇼츠", "ejejumin shorts", "ejejumin ショート動画");
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frameBox.appendChild(frame);
      /* 창 아래 버튼: 그 인터뷰이의 웹진 원고 페이지로 (원고 주소가 없는 카드는 YouTube로) */
      var article = card.getAttribute("data-article");
      if (article) {
        link.href = article;
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.textContent = wzT("인터뷰 원문 보러 가기", "Read the full interview", "インタビュー全文を読む");
      } else {
        link.href = card.href;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = wzT("YouTube에서 보기", "Watch on YouTube", "YouTubeで見る");
      }
      lastCard = card;
      /* 재생 중인 본문 영상(작은 창 포함)은 잠시 멈추고, 쇼츠 창을 닫으면 이어서 재생 */
      pausedFrames = [];
      document.querySelectorAll(".video-card.is-pip-large").forEach(function (b) {
        var small = b.querySelector(".video-pip-expand");
        if (small) small.click();
      });
      document.querySelectorAll(".video-card.is-playing iframe").forEach(function (f) {
        /* 재생 중(1)·불러오는 중(3)인 것만. 본문 영상은 처음부터 플레이어로 떠 있어서, 재생한 적 없는 영상을 닫을 때 저절로 틀지 않게 한다 */
        if (f.ytState === 1 || f.ytState === 3) { ytCommand(f, "pauseVideo"); pausedFrames.push(f); }
      });
      modal.hidden = false;
      document.documentElement.classList.add("is-modal-open");
      closeBtn.focus();
    }
    function close() {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      frameBox.textContent = "";
      document.documentElement.classList.remove("is-modal-open");
      pausedFrames.forEach(function (f) { if (document.contains(f)) ytCommand(f, "playVideo"); });
      pausedFrames = [];
      if (lastCard) lastCard.focus();
    }
    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        var id = videoId(card.href);
        if (!id) return;
        e.preventDefault();
        open(card, id);
      });
    });
  })();
})();

/* ---------- 기사 인물 소개 네 칸(휴대폰): 줄마다 글이 긴 칸을 더 넓게 (사용자가 준 시안, 2026-10-28) ----------
   두 칸씩 두 줄. 칸마다 한 줄로 썼을 때의 폭을 재서, 둘 다 들어가면 남는 폭을 반씩 더하고, 모자라면 그 비율로 나눈다.
   다만 짧은 칸도 이름(떠나온 곳 등)이 한 줄에 들어갈 만큼은 남긴다 (줄의 절반까지). 스크립트가 없으면 반반 */
(function () {
  'use strict';
  var lists = document.querySelectorAll('.hotspots');
  if (!lists.length || !window.matchMedia) return;
  var mq = window.matchMedia('(max-width: 899px)');
  function w(el) { return el.getBoundingClientRect().width; }
  function fit() {
    Array.prototype.forEach.call(lists, function (dl) {
      var cards = Array.prototype.slice.call(dl.children);
      cards.forEach(function (c) { c.style.removeProperty('flex'); });
      if (!mq.matches || cards.length < 2) return;
      dl.classList.add('is-fit-max');                // 한 줄로 썼을 때
      var want = cards.map(w);
      var label = cards.map(function (c) { return c.firstElementChild ? w(c.firstElementChild) : 0; });
      var text = cards.map(function (c) { return Math.max.apply(null, Array.prototype.map.call(c.children, w)); });
      dl.classList.remove('is-fit-max');
      dl.classList.add('is-fit-min');                // 가장 좁게 (가장 긴 낱말)
      var word = cards.map(function (c) { return c.lastElementChild ? w(c.lastElementChild) : 0; });
      var labelWord = cards.map(function (c) { return c.firstElementChild ? w(c.firstElementChild) : 0; });
      dl.classList.remove('is-fit-min');
      var gap = parseFloat(getComputedStyle(dl).columnGap) || 0;
      var room = dl.clientWidth - gap;
      function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
      for (var r = 0; r + 1 < cards.length; r += 2) {
        var ids = [r, r + 1];
        var nice = ids.map(function (i) { return want[i] - text[i] + Math.max(label[i], word[i]); });   // 이름은 한 줄, 값은 낱말이 안 잘리게
        var must = ids.map(function (i) { return want[i] - text[i] + Math.max(labelWord[i], word[i]); });   // 낱말만 안 잘리게
        var a = want[r], b = want[r + 1], wa;
        if (a + b <= room) wa = a + (room - a - b) / 2;
        else if (nice[0] + nice[1] <= room) wa = clamp(room * a / (a + b), nice[0], room - nice[1]);
        else if (must[0] + must[1] <= room) wa = clamp(room * nice[0] / (nice[0] + nice[1]), must[0], room - must[1]);
        else {   // 아주 좁은 화면·글자 확대: 둘이 나란히면 낱말이 잘려, 그 줄은 한 칸씩 폭 가득
          cards[r].style.flex = cards[r + 1].style.flex = '1 1 100%';
          continue;
        }
        wa = Math.floor(wa);
        cards[r].style.flex = '0 0 ' + wa + 'px';
        cards[r + 1].style.flex = '1 1 ' + (room - wa - 1) + 'px';   // 나머지 (한 줄에 꼭 둘)
      }
    });
  }
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
})();

/* ---------- 나의 제주찾기 정책 카드 쪽 넘기기 (사용자가 준 시안, 2026-10-29) ----------
   한 쪽에 두 줄(PC 4칸 × 2 = 8장, 600~899px 3칸 × 2, 휴대폰 2칸 × 2). 카드 아래 '‹ 1 2 ›'로 넘긴다.
   줄 수가 화면 폭에 따라 바뀌면 지금 보던 첫 카드가 들어 있는 쪽으로 맞춘다. 스크립트가 없으면 13장이 다 보인다 */
(function () {
  'use strict';
  var grid = document.querySelector('.policy-grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.children);
  var arrow = function (d) { return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
  var pager = document.createElement('nav');
  pager.className = 'policy-pager';
  pager.setAttribute('aria-label', wzT('정책 카드 쪽', 'Policy card pages', '政策カードのページ'));
  grid.insertAdjacentElement('afterend', pager);
  var page = 0, per = 8, first = 0;
  function cols() { return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1; }
  function render() {
    var pages = Math.max(1, Math.ceil(cards.length / per));
    page = Math.min(page, pages - 1);
    cards.forEach(function (c, i) { c.hidden = i < page * per || i >= (page + 1) * per; });
    first = page * per;
    var h = '<button type="button" data-go="prev" aria-label="' + wzT('이전 쪽', 'Previous page', '前のページ') + '"' + (page === 0 ? ' disabled' : '') + '>' + arrow('M14.5 5.5 8 12l6.5 6.5') + '</button>';
    for (var i = 0; i < pages; i++) {
      h += '<button type="button" data-go="' + i + '" aria-label="' + wzT((i + 1) + '쪽', 'Page ' + (i + 1), (i + 1) + 'ページ') + '"' + (i === page ? ' aria-current="page"' : '') + '>' + (i + 1) + '</button>';
    }
    h += '<button type="button" data-go="next" aria-label="' + wzT('다음 쪽', 'Next page', '次のページ') + '"' + (page >= pages - 1 ? ' disabled' : '') + '>' + arrow('M9.5 5.5 16 12l-6.5 6.5') + '</button>';
    pager.innerHTML = h;
    pager.hidden = pages < 2;
  }
  function fit() {
    var n = cols() * 2;
    if (n === per && pager.childElementCount) return;
    per = n; page = Math.floor(first / per); render();
  }
  pager.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var go = b.getAttribute('data-go');
    page = go === 'prev' ? page - 1 : go === 'next' ? page + 1 : parseInt(go, 10);
    render();
    var keep = pager.querySelector('[data-go="' + go + '"]');   // 눌렀던 버튼에 손가락·키보드 자리를 남긴다
    if (keep && !keep.disabled) keep.focus(); else if (pager.querySelector('[aria-current]')) pager.querySelector('[aria-current]').focus();
    var top = grid.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top - 120, behavior: 'smooth' });   // 카드 줄 위가 화면 밖이면 보이게
  });
  fit();
  window.addEventListener('resize', fit);
})();

/* ===== 마을 테스트 블록 시작 (scratchpad build.py가 만든다) ===== */
/* =========================================================
   나는 제주 어디 주민? (마을 테스트, articles/jeju-village-test.html)
   사용자가 만든 테스트 아티팩트의 스크립트를 웹진 안으로 옮김 (사용자 요청 2026-10-27). 질문·점수·결과 글은 아티팩트 그대로
   바꾼 것:
   - #vt(테스트 칸)가 있는 페이지에서만 동작하고, 찾는 범위도 테스트 칸 안으로 (웹진 헤더·푸터는 건드리지 않음)
   - 그림 주소 images/village-test/ (파일 이름은 영문 소문자·하이픈: poseA_01 → pose-a-01, title_en → title-en)
   - 언어(한국어·English·日本語·中文)는 테스트 칸의 lang만 바꾼다. 웹진 헤더 KO·EN·JA는 그 언어 웹진 페이지(articles/·en/articles/·ja/articles/, frames.py)로 간다(?lang=)
   - '대표 명소 보러가기'는 '나의 제주찾기' 해당 동네(#town-N)로 간다 (전에는 '웹진 준비 중' 안내)
   - 공유 주소는 실제 웹진 주소. claude.ai 전용 저장 창과 언어별 Google Fonts 불러오기는 뺐다
   - 아티팩트의 style="…"는 클래스로 (style.css 맨 뒤 .vt 블록)
   ========================================================= */
(function () {
var vtRoot = document.getElementById('vt');
if (!vtRoot) return;
/* 그림 폴더: 한국어 페이지(articles/)와 영어·일본어 페이지(en|ja/articles/)는 깊이가 달라, 테스트 칸 로고 그림 주소에서 얻는다 (2026-10-28) */
const VT_LOGO = vtRoot.querySelector('.logo');
const IMG = (VT_LOGO ? VT_LOGO.getAttribute('src') : '../images/village-test/logo.webp').replace(/logo\.webp$/, '');
/* 이 페이지의 언어 (영어·일본어 웹진 페이지는 그 언어로 테스트를 연다) */
const PAGE_LANG = (document.documentElement.getAttribute('lang') || 'ko').slice(0, 2);
/* ===================== content ===================== */
const TOPICS = ['i-flag', 'i-people', 'i-car', 'i-coin', 'i-sun'];

// each option: [label, short label for the summary chips, { region: points }]
const QUESTIONS = [
  { q: '이번 한 달, 제주에 가는<br>가장 큰 이유는?', pose: 'pose-a-04', talk: '쉬러 온 사람과 일하러 온 사람의<br>제주는 달라!',
    opts: [
      ['일에서 벗어나 푹 쉬고 싶어', '푹 쉬기', { pyoseon: 3, gujwa: 2, andeok: 2, jungsangan: 1 }],
      ['노트북 들고 일하면서 지낼래', '워케이션', { hamdeok: 3, wondosim: 2, shinjeju: 1, aewol: 1 }],
      ['이주 전에 미리 살아보고 싶어', '이주 연습', { seogwipo: 3, shinjeju: 3 }],
      ['여행보다 천천히 제주를 느끼고 싶어', '느린 여행', { hallim: 3, aewol: 2, gujwa: 1 }],
      ['취미나 프로젝트에 푹 빠지고 싶어', '몰입', { jungsangan: 3, andeok: 2, gujwa: 1 }],
    ] },
  { q: '이번 한 달,<br>누구와 함께하나요?', pose: 'pose-a-07', talk: '누구와 오느냐에 따라<br>완전 달라!',
    opts: [
      ['혼자', '혼자', { wondosim: 2, hamdeok: 1, seogwipo: 1, gujwa: 1 }],
      ['연인·친구와', '연인·친구', { aewol: 3, hallim: 2, hamdeok: 1 }],
      ['아이와 함께', '아이와', { shinjeju: 3, seogwipo: 1, hamdeok: 1 }],
      ['반려동물과 함께', '반려동물', { jungsangan: 3, andeok: 2, gujwa: 1 }],
      ['부모님·가족과', '가족', { pyoseon: 2, shinjeju: 1, aewol: 1 }],
    ] },
  { q: '한 달 동안<br>나의 이동수단은?', pose: 'pose-a-03', talk: '바다 앞 집이어도<br>장 보러 40분이면…?',
    opts: [
      ['자차를 가져간다', '자차', { jungsangan: 2, andeok: 2, pyoseon: 2, gujwa: 1, hallim: 1 }],
      ['렌터카를 빌린다', '렌터카', { jungsangan: 2, andeok: 2, pyoseon: 2, gujwa: 1, hallim: 1 }],
      ['버스 같은 대중교통', '대중교통', { wondosim: 3, shinjeju: 3, seogwipo: 3, hamdeok: 1, jungsangan: -5, andeok: -2, pyoseon: -1, gujwa: -1, hallim: -1 }],
      ['자전거·두 발이면 충분', '도보·자전거', { wondosim: 3, seogwipo: 2, hamdeok: 2, jungsangan: -5, andeok: -2, pyoseon: -1 }],
      ['아직 생각 안 해봤어', '이동 미정', {}],
    ] },
  { q: '한 달 예산,<br>어디에 더 쓰고 싶나요?', pose: 'pose-b-07', talk: '월세만 보고 ‘생각보다 싸네?’<br>하면 안 됨!',
    opts: [
      ['마트·병원 가까운 생활 편의', '생활 편의', { shinjeju: 3, wondosim: 2 }],
      ['바다가 보이는 숙소', '바다 뷰', { aewol: 3, hamdeok: 2, hallim: 2 }],
      ['넓고 조용한 독채', '조용한 독채', { andeok: 3, jungsangan: 2, pyoseon: 2 }],
      ['맛집·카페 탐방', '맛집·카페', { aewol: 3, gujwa: 2, wondosim: 1 }],
      ['최대한 아껴서 오래 머물기', '알뜰하게', {}],
    ] },
  { q: '내가 꿈꾸는<br>제주의 하루는?', pose: 'pose-a-10', talk: '이게 정해지면<br>동네 고르기가 쉬워져!', weight: 1.5,
    opts: [
      ['아침마다 바다 산책', '바다 산책', { hallim: 3, hamdeok: 2, gujwa: 2, pyoseon: 1 }],
      ['카페에서 일하며 지내기', '카페 작업', { hamdeok: 3, wondosim: 2, aewol: 2 }],
      ['조용한 마을에서 느리게', '느린 마을', { pyoseon: 3, gujwa: 3, andeok: 2 }],
      ['맛집·전시 찾아다니기', '맛집·전시', { wondosim: 3, shinjeju: 3, seogwipo: 1 }],
      ['오름·올레길·숲 걷기', '오름·숲', { jungsangan: 3, andeok: 2, seogwipo: 1 }],
      ['시장 구경, 현지 사람들과 어울리기', '시장·현지', { seogwipo: 3, wondosim: 1, gujwa: 1 }],
    ] },
];

// clockwise from Jeju City; also the tie-break order of last resort
const ORDER = ['shinjeju', 'wondosim', 'hamdeok', 'gujwa', 'pyoseon', 'seogwipo', 'andeok', 'hallim', 'aewol', 'jungsangan'];

const RESULTS = {
  shinjeju: { type: '든든한 생활 인프라파', region: '신제주 주민', area: '제주시 노형·연동 · 공항 쪽', icon: 'i-family', pose: 'pose-a-08',
    line: '필요한 건 다 가까이, 그래야 마음이 편하지', talk: '공항도 마트도 가까우니 든든하지!', stats: [2, 2, 5, 5, 2],
    kw: ['생활 편의가 1순위인 실속파', '아이와 함께여도 걱정 없는 동선', '공항이 가까워 육지 오가기 편함', '마트·병원·학원이 가까운 생활권', '맛집과 카페도 골라 가는 재미'],
    day: ['동네 공원 한 바퀴 산책', '마트·병원 동선 걱정 없이 장보기', '연동 맛집 골목에서 저녁 한 끼'],
    tip: '숙소는 <b>아이 동선(병원·마트·놀이터)</b>을 기준으로 고르면 한 달이 편해요.' },
  wondosim: { type: '골목 산책 뚜벅이', region: '원도심 주민', area: '제주시 원도심 · 삼도·일도·탑동', icon: 'i-bus', pose: 'pose-a-10',
    line: '차 없어도 괜찮아, 걷는 만큼 제주가 보이니까', talk: '버스 타고 어디든 가볼까?', stats: [2, 3, 4, 5, 1],
    kw: ['차 없이도 다닐 만한 생활권', '오래된 골목과 시장 구경', '전시·책방·카페 탐방', '탑동 바닷가 산책', '혼자여도 심심할 틈 없음'],
    day: ['탑동 바닷길 따라 산책', '골목 책방과 카페 구경', '동문시장에서 저녁거리 사기'],
    tip: '숙소를 고를 때 <b>가까운 버스 정류장과 노선</b>부터 확인하세요.' },
  hamdeok: { type: '바다 앞 워케이셔너', region: '함덕 주민', area: '제주시 조천읍 함덕', icon: 'i-laptop', pose: 'pose-a-05',
    line: '일은 노트북으로, 휴식은 바다로', talk: '오늘 회의는 바다 앞 카페에서!', stats: [3, 5, 3, 3, 3],
    kw: ['일과 휴식의 균형을 챙기는 타입', '바다 앞 카페에서 노트북 펴기', '공항 오가기 편한 동쪽 바다', '에메랄드빛 해변 산책', '평일엔 집중, 주말엔 동쪽 여행'],
    day: ['함덕 해변에서 아침 산책', '바다 보이는 카페에서 일하기', '서우봉 산책로에서 노을 보기'],
    tip: '성수기엔 해변이 붐벼요. <b>일할 카페를 미리 몇 곳</b> 찜해두세요.' },
  gujwa: { type: '느린 바닷마을 주민', region: '구좌 주민', area: '구좌읍 세화·종달·월정', icon: 'i-leaf', pose: 'pose-b-06',
    line: '급할 거 없는 동네에서, 나도 천천히', talk: '여긴 시간이 천천히 흘러~', stats: [4, 5, 2, 2, 4],
    kw: ['조용한 바닷가 마을 감성', '작은 소품샵·책방 구경', '돌담길 산책이 일상', '관광지보다 동네 생활', '혼자만의 시간을 좋아함'],
    day: ['세화 바닷가 따라 산책', '작은 소품샵과 책방 구경', '돌담길 지나 마을 식당에서 저녁'],
    tip: '마을 가게는 <b>일찍 문 닫는 곳</b>도 많아요. 저녁 장보기는 미리!' },
  pyoseon: { type: '느긋한 쉼표형', region: '표선·남원 주민', area: '서귀포시 표선면·남원읍', icon: 'i-sun', pose: 'pose-a-02',
    line: '아무것도 안 해도 되는 하루가 제일 좋아', talk: '오늘 일정? 노을 보기 하나!', stats: [5, 4, 2, 2, 4],
    kw: ['쉬는 게 이번 한 달의 목표', '넓은 백사장과 조용한 바다', '관광객이 적은 편인 한적함', '차 타고 가끔 근교 나들이', '넓은 숙소에서 느긋하게'],
    day: ['넓은 표선 해변 산책', '숙소에서 낮잠과 책 한 권', '남원 바닷길 따라 천천히 걷기'],
    tip: '큰 마트·병원은 <b>차로 가는 걸 기준</b>으로 계획하세요.' },
  seogwipo: { type: '따뜻한 남쪽 생활러', region: '서귀포 시내 주민', area: '서귀포시 시내', icon: 'i-house', pose: 'pose-a-07',
    line: '제주살이 연습은 따뜻한 남쪽 시내에서', talk: '남쪽은 바람도 따뜻해!', stats: [3, 4, 4, 4, 4],
    kw: ['이주 전 ‘진짜 생활’ 체험파', '시장과 골목이 있는 동네', '걸어서 즐기는 바닷가 산책길', '올레길과 폭포가 가까움', '따뜻한 남쪽 날씨'],
    day: ['바닷가 산책길에서 하루 시작', '이중섭거리 골목 산책', '매일올레시장에서 저녁 장보기'],
    tip: '한라산 너머 남쪽이라 <b>공항 오가는 시간</b>을 꼭 계산해두세요.' },
  andeok: { type: '한적한 서남쪽 은둔러', region: '안덕·대정 주민', area: '서귀포시 안덕면·대정읍', icon: 'i-sanbang', pose: 'pose-b-05',
    line: '바다도 오름도, 조용한 시간에 독차지', talk: '쉿, 여긴 나만 아는 동네야', stats: [4, 4, 2, 2, 5],
    kw: ['한적함과 자연, 둘 다 포기 못 함', '산방산·송악산이 보이는 풍경', '오름과 바다를 번갈아 산책', '북적이는 곳은 피하고 싶음', '모슬포 항구 동네의 생활감'],
    day: ['송악산 둘레길 걷기', '산방산 보이는 카페에서 쉬기', '모슬포 항구 근처에서 저녁'],
    tip: '서남쪽 끝이라 제주시까지 꽤 멀어요. <b>공항 가는 날은 여유 있게!</b>' },
  hallim: { type: '에메랄드 바다 산책러', region: '한림 주민', area: '한림읍 협재·금능', icon: 'i-wave', pose: 'pose-b-03',
    line: '매일 아침 바다 색을 확인하는 게 하루의 시작', talk: '오늘 바다 색 봤어? 완전 에메랄드!', stats: [3, 5, 2, 2, 4],
    kw: ['아침 바다 산책이 루틴', '투명한 에메랄드빛 바다', '비양도가 보이는 풍경', '여행보다 느린 여행', '서쪽 노을까지 덤'],
    day: ['협재·금능 바다 색 보며 산책', '근처 오름 하나 오르기', '비양도 너머로 지는 노을 보기'],
    tip: '여름 성수기엔 해변이 북적여요. 한적함을 원하면 <b>이른 아침 산책</b>을 추천!' },
  aewol: { type: '노을 카페 감성러', region: '애월 주민', area: '제주시 애월읍', icon: 'i-cup', pose: 'pose-b-02',
    line: '하루의 끝은 무조건 노을 보이는 카페에서', talk: '노을 시간엔 무조건 카페로!', stats: [2, 5, 3, 2, 3],
    kw: ['바다 뷰 카페 탐방이 일상', '해안도로 드라이브', '연인·친구와 감성 한 달', '사진 찍기 좋은 순간이 많음', '노을 시간엔 일정 비워두기'],
    day: ['해안도로 따라 드라이브', '바다 보이는 카페에서 여유', '한담 해안산책로에서 노을'],
    tip: '카페 거리 주변은 주말에 붐벼요. 숙소는 <b>살짝 안쪽 마을</b>도 같이 찾아보세요.' },
  jungsangan: { type: '오름·숲 탐험가', region: '중산간 주민', area: '송당·가시리·교래 등 중산간 마을', icon: 'i-mountain', pose: 'pose-a-01',
    line: '바다보다 숲, 파도 소리보다 바람 소리', talk: '오름 하나 더 가볼까?', stats: [5, 1, 1, 1, 5],
    kw: ['오름 오르기가 취미', '숲길·목장 풍경 속 생활', '반려동물과 산책하기 좋은 여유', '조용히 집중하는 시간', '차는 필수, 대신 풍경은 독점'],
    day: ['가까운 오름 하나 오르기', '숲길 따라 천천히 걷기', '불빛 적은 마을에서 별 보기'],
    tip: '차 없이는 생활이 어려워요. <b>장보기·병원 동선</b>을 꼭 미리 확인하세요.' },
};
const SECOND_LABEL = '이런 동네도 잘 맞아요';
const INSTAGRAM = 'https://www.instagram.com/e_jeju.min/';
// On its own site the page shares its own address; inside claude.ai it shares the artifact link.
// 웹진 안 페이지라 늘 자기 주소로 공유한다. 공유에는 실제 주소만 쓴다 (공통 기준: 테스트 주소 금지)
const STANDALONE = true;
// 언어별 페이지가 있어(2026-10-28) 이 페이지의 실제 주소(canonical)로 공유한다
const SHARE_URL = (document.querySelector('link[rel="canonical"]') || {}).href || 'https://lxwebzine.hankyung.com/2026-1/team3/articles/jeju-village-test.html';
// 동네별 '대표 명소' 웹진 페이지 주소. 비어 있으면 '준비 중' 안내가 떠요
// 웹진 '나의 제주찾기'의 살고 싶은 동네 10곳과 순서가 같다 (#town-1 ~ #town-10, 2026-10-27)
const PLACE_PAGES = { shinjeju: './find-my-jeju.html#town-1', wondosim: './find-my-jeju.html#town-2', hamdeok: './find-my-jeju.html#town-3', gujwa: './find-my-jeju.html#town-4', pyoseon: './find-my-jeju.html#town-5',
  seogwipo: './find-my-jeju.html#town-6', andeok: './find-my-jeju.html#town-7', hallim: './find-my-jeju.html#town-8', aewol: './find-my-jeju.html#town-9', jungsangan: './find-my-jeju.html#town-10' };
// Visit / start / share / save counts go to Google Analytics on the Vercel site only
// (build_deploy.py adds the tag; claude.ai blocks it, so there this does nothing).
function track(name, params = {}) { try { if (window.gtag) gtag('event', name, params); } catch (e) { /* counting must never break the page */ } }
const saved = (key, method) => track('save_image', { region: koPlace(key), method });

/* ===================== languages ===================== */
// Korean is the original. Other languages only swap the words; scores, poses and icons stay shared.
const LANGS = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };
// 아티팩트는 언어를 고르면 Google Fonts에서 그 언어 글꼴을 불러왔다. 웹진은 style.css 하나만 쓰므로 불러오지 않고 기기 글꼴로 보인다
const LANG_FONTS = {};
const CANVAS_FONTS = {   // display, body, handwriting, hareubang's talk
  ko: ['"Bagel Fat One", "Jua", sans-serif', '"Gmarket", "Apple SD Gothic Neo", sans-serif', '"Nanum Pen Script", cursive', '"Jua", sans-serif'],
  ja: ['"Mochiy Pop One", sans-serif', '"Zen Maru Gothic", sans-serif', '"Yusei Magic", cursive', '"Kiwi Maru", sans-serif'],
};
// the Korean fonts carry their own Latin letters, except the handwriting, whose are too thin
CANVAS_FONTS.en = [CANVAS_FONTS.ko[0], CANVAS_FONTS.ko[1], '"Caveat", cursive', CANVAS_FONTS.ko[3]];
CANVAS_FONTS.zh = ['"ZCOOL KuaiLe", sans-serif', '"Noto Sans SC", sans-serif', '"ZCOOL KuaiLe", sans-serif', '"ZCOOL KuaiLe", sans-serif'];
const UI = {
  ko: {
    docTitle: '나는 제주 어디 주민?', toTop: '처음 화면으로', home: '홈', share: '공유',
    kicker: '제주 한 달 살기 동네 테스트', sub: '질문 5개로 찾는, 나에게 맞는 제주 동네', go: '테스트 시작하기',
    meta: '약 30초 · 제주 동네 10곳 중 하나', pointAlt: '손가락으로 가리키는 하르방', bubble: '숙소부터 찾기 전에,<br>어떻게 살고 싶은지부터!',
    back: '← 이전', loading: '하르방이 동네를<br>고르는 중…',
    rheadMine: '당신에게 맞는 제주 동네는', rheadOther: '제주 동네 주민 유형', myAnswers: '내 답변', harubangAlt: '하르방',
    secStats: '하르방 체감 지수', secKw: '이런 당신에게 딱', secDay: '이 동네에서의 하루', dayLabels: ['아침', '오후', '저녁'],
    tip: '현실 팁', stamp: '나는 제주 어디 주민? × 이제주민', stats: ['조용함', '바다', '생활 편의', '대중교통', '자연'],
    meterAria: (l, n) => `${l} ${n}점 / 5점`, quote: x => `“${x}”`,
    saveLabel: p => `이미지 저장 & ${p} 대표 명소 보러가기`, soonSmall: '(웹진은 지금 준비 중이에요)',
    shareBtn: '친구에게 공유하기', restart: '다시 하기', backMine: '내 결과로 돌아가기', tryToo: '나도 테스트하기',
    beta: '베타 버전 · 동네 정보는 이제주민 팀이 검수하고 있어요.',
    allBackMine: '← 내 결과', allBackHome: '← 처음으로', allHead: '제주 동네 주민 10가지',
    soon: '이제주민 웹진은 지금 준비 중이에요.\n조금만 기다려 주세요!',
    moving: p => `‘${p}’ 대표 명소 페이지로 이동할게요!`,
    savedWebzine: p => `이미지를 저장했어요! ‘${p}’ 대표 명소는 이제주민 웹진에서 볼 수 있어요.`,
    making: '이미지 만드는 중…', makeFail: '이미지를 만들지 못했어요. 다시 한 번 눌러 주세요.',
    saveOpen: '저장 창이 이미 열려 있어요. 잠시 후 다시 눌러 주세요.',
    copied: '공유 문구를 복사했어요! 카톡이나 DM에 붙여넣어 친구에게 보내 주세요.',
    shareMine: r => `나는 ‘${r.region}’(${r.type}) 나왔어! 너는 제주 어디 주민일까?\n질문 5개로 찾는 제주 한 달 살기 동네 테스트`,
    shareGeneric: '나는 제주 어디 주민? 질문 5개로 찾는 제주 한 달 살기 동네 테스트',
    sheetAria: '결과 이미지 저장', myImgAlt: '나의 결과 이미지', capline: '이미지를 꾹 눌러 저장하거나<br>지금 화면을 캡처해 주세요 📸',
    sheetGo: p => `${p} 대표 명소 보러가기 →`, close: '닫기', copyAria: '공유 문구 복사',
    copyHelp: '아래 문구를 길게 눌러 전체 선택 → 복사한 뒤<br>카톡이나 DM에 붙여넣어 주세요',
    imgFooter: '제주 한 달 살기 동네 테스트 · @e_jeju.min',
    file: r => `나는제주어디주민_${r.region.replace(/[\s·]/g, '')}.png`,
  },
  ja: {
    docTitle: 'わたしは済州のどこの住民？', toTop: 'トップへ', home: 'ホーム', share: 'シェア',
    kicker: '済州1ヶ月暮らし 住む町診断', sub: '5つの質問でわかる、<br>わたしに合う済州の町', go: '診断スタート',
    meta: '約30秒 · 済州の10エリアから1つ', pointAlt: '指さすトルハルバン', bubble: '宿探しの前に、<br>暮らし方から！',
    back: '← 戻る', loading: 'トルハルバンが町を<br>選んでいます…',
    rheadMine: 'あなたに合う済州の町は', rheadOther: '済州の町 住民タイプ', myAnswers: 'あなたの回答', harubangAlt: 'トルハルバン',
    secStats: 'トルハルバン体感メーター', secKw: 'こんなあなたにぴったり', secDay: 'この町での1日', dayLabels: ['朝', '午後', '夜'],
    tip: 'リアルなヒント', stamp: 'わたしは済州のどこの住民？ × イジェジュミン', stats: ['静けさ', '海', '利便性', '公共交通', '自然'],
    meterAria: (l, n) => `${l} ${n} / 5`, quote: x => `「${x}」`,
    saveLabel: p => `画像を保存 & ${p}の名所を見る`, soonSmall: '(ウェブマガジンは準備中です)',
    shareBtn: '友だちにシェアする', restart: 'もう一度診断する', backMine: '自分の結果に戻る', tryToo: 'わたしも診断する',
    beta: 'ベータ版 · 町の情報はイジェジュミン編集部が確認中です。',
    allBackMine: '← 自分の結果', allBackHome: '← トップへ', allHead: '済州の住民タイプ 全10種',
    soon: 'イジェジュミンのウェブマガジンは現在準備中です。もう少しお待ちください！',
    moving: p => `「${p}」の名所ページへ移動します！`,
    savedWebzine: p => `画像を保存しました！「${p}」の名所はイジェジュミンのウェブマガジンで見られます。`,
    making: '画像を作成中…', makeFail: '画像を作成できませんでした。もう一度押してください。',
    saveOpen: '保存画面がすでに開いています。少ししてからもう一度押してください。',
    copied: 'シェア用の文章をコピーしました！LINEやDMに貼り付けて友だちに送ってください。',
    shareMine: r => `わたしは「${r.region}」(${r.type})だった！あなたは済州のどこの住民？\n5つの質問でわかる 済州1ヶ月暮らし 住む町診断`,
    shareGeneric: 'わたしは済州のどこの住民？ 5つの質問でわかる 済州1ヶ月暮らし 住む町診断',
    sheetAria: '結果画像を保存', myImgAlt: 'わたしの結果画像', capline: '画像を長押しして保存するか、<br>この画面をスクショしてください 📸',
    sheetGo: p => `${p}の名所を見る →`, close: '閉じる', copyAria: 'シェア文をコピー',
    copyHelp: '下の文章を長押しで全選択 → コピーして<br>LINEやDMに貼り付けてください',
    imgFooter: '済州1ヶ月暮らし 住む町診断 · @e_jeju.min',
    file: r => `済州住む町診断_${r.place.replace(/[\s·・]/g, '')}.png`,
  },
  en: {
    docTitle: 'Which Jeju Local Are You?', toTop: 'Back to start', home: 'Home', share: 'Share',
    kicker: 'A Month in Jeju · Neighborhood Quiz', sub: 'Find your Jeju neighborhood<br>in just 5 questions', go: 'Start the quiz',
    meta: 'About 30 sec · 1 of 10 neighborhoods', pointAlt: 'Hareubang pointing', bubble: 'Pick a lifestyle<br>before a room!',
    back: '← Back', loading: 'Hareubang is picking<br>your neighborhood…',
    rheadMine: 'Your Jeju neighborhood is', rheadOther: 'Jeju local type', myAnswers: 'Your answers', harubangAlt: 'Hareubang',
    secStats: 'Hareubang’s vibe meter', secKw: 'Perfect for you', secDay: 'A day in this neighborhood', dayLabels: ['Morning', 'Afternoon', 'Evening'],
    tip: 'Reality check', stamp: 'Which Jeju Local Are You? × @e_jeju.min', stats: ['Quiet', 'Ocean', 'Amenities', 'Transit', 'Nature'],
    meterAria: (l, n) => `${l} ${n} out of 5`, quote: x => `“${x}”`,
    saveLabel: p => `Save image & see top spots in ${p}`, soonSmall: '(Our webzine is coming soon)',
    shareBtn: 'Share with friends', restart: 'Take it again', backMine: 'Back to my result', tryToo: 'Try it yourself',
    beta: 'Beta · Our team is still checking the neighborhood info.',
    allBackMine: '← My result', allBackHome: '← Start', allHead: 'All 10 Jeju local types',
    soon: 'The e_jeju.min webzine is coming soon.\nStay tuned!',
    moving: p => `Taking you to the top spots in ${p}!`,
    savedWebzine: p => `Image saved! Find the top spots in ${p} on the e_jeju.min webzine.`,
    making: 'Creating image…', makeFail: 'Couldn’t create the image. Please tap again.',
    saveOpen: 'The save window is already open. Please try again in a moment.',
    copied: 'Share message copied! Paste it into a chat or DM to send it to friends.',
    shareMine: r => `I got “${r.region}” (${r.type})! Which Jeju local are you?\nFind your Jeju neighborhood for a one-month stay in 5 questions`,
    shareGeneric: 'Which Jeju Local Are You? Find your Jeju neighborhood for a one-month stay in 5 questions',
    sheetAria: 'Save result image', myImgAlt: 'My result image', capline: 'Press and hold the image to save,<br>or take a screenshot 📸',
    sheetGo: p => `See top spots in ${p} →`, close: 'Close', copyAria: 'Copy share message',
    copyHelp: 'Press and hold the text below, select all and copy,<br>then paste it into a chat or DM',
    imgFooter: 'A Month in Jeju · Neighborhood Quiz · @e_jeju.min',
    file: r => `which-jeju-local_${r.region.toLowerCase().replace(/ local$/, '').replace(/[^a-z]+/g, '-')}.png`,
  },
  zh: {
    docTitle: '我适合住在济州哪里？', toTop: '回到首页', home: '首页', share: '分享',
    kicker: '济州旅居一个月 · 街区测试', sub: '5个问题，<br>找到适合你的济州街区', go: '开始测试',
    meta: '约30秒 · 济州10个街区中的一个', pointAlt: '指着前方的石头爷爷', bubble: '找住处之前，<br>先想想怎么生活！',
    back: '← 上一题', loading: '石头爷爷正在<br>帮你挑街区…',
    rheadMine: '最适合你的济州街区是', rheadOther: '济州街区居民类型', myAnswers: '你的回答', harubangAlt: '石头爷爷',
    secStats: '石头爷爷体感指数', secKw: '这样的你最合适', secDay: '在这里的一天', dayLabels: ['早上', '下午', '晚上'],
    tip: '实用贴士', stamp: '我适合住在济州哪里？ × @e_jeju.min', stats: ['安静', '海景', '生活便利', '公共交通', '自然'],
    meterAria: (l, n) => `${l} ${n}/5`, quote: x => `“${x}”`,
    saveLabel: p => `保存图片 & 去看${p}代表景点`, soonSmall: '（网络杂志正在准备中）',
    shareBtn: '分享给朋友', restart: '再测一次', backMine: '回到我的结果', tryToo: '我也来测测',
    beta: '测试版 · 街区信息正在由 e_jeju.min 团队核实中。',
    allBackMine: '← 我的结果', allBackHome: '← 首页', allHead: '济州街区居民 10种类型',
    soon: 'e_jeju.min 网络杂志正在准备中，敬请期待！',
    moving: p => `即将前往${p}代表景点页面！`,
    savedWebzine: p => `图片已保存！${p}的代表景点可以在 e_jeju.min 网络杂志查看。`,
    making: '图片生成中…', makeFail: '图片生成失败，请再点一次。',
    saveOpen: '保存窗口已经打开了，请稍后再试。',
    copied: '分享文案已复制！粘贴到微信或私信发给朋友吧。',
    shareMine: r => `我的结果是“${r.region}”（${r.type}）！你适合住在济州哪里？\n5个问题，找到最适合你在济州旅居一个月的地方。`,
    shareGeneric: '我适合住在济州哪里？5个问题，找到最适合你在济州旅居一个月的地方。',
    sheetAria: '保存结果图片', myImgAlt: '我的结果图片', capline: '长按图片保存，<br>或者直接截图 📸',
    sheetGo: p => `去看${p}代表景点 →`, close: '关闭', copyAria: '复制分享文案',
    copyHelp: '长按下方文字全选并复制，<br>再粘贴到微信或私信',
    imgFooter: '济州旅居一个月 · 街区测试 · @e_jeju.min',
    file: r => `我适合住在济州哪里_${r.place.replace(/[\s·・]/g, '')}.png`,
  },
};

const CONTENT = {
  ja: {
    // same order as QUESTIONS and their opts: [label, short label for the summary chips]
    questions: [
      { q: 'このひと月、済州へ行く<br>いちばんの理由は？', talk: '休みに来た人と働きに来た人の<br>済州は違うよ！',
        opts: [['仕事を離れてゆっくり休みたい', '休息'], ['ノートPCで働きながら過ごしたい', 'ワーケーション'], ['移住前にお試しで暮らしたい', '移住のお試し'],
               ['観光よりゆっくり済州を味わいたい', 'スロー旅'], ['趣味やプロジェクトに没頭したい', '没頭']] },
      { q: '今回のひと月、<br>誰と過ごしますか？', talk: '誰と来るかで<br>まったく違うよ！',
        opts: [['ひとりで', 'ひとり'], ['恋人・友だちと', '恋人・友だち'], ['子どもと一緒に', '子連れ'], ['ペットと一緒に', 'ペット'], ['両親・家族と', '家族']] },
      { q: 'ひと月の間、<br>移動手段は？', talk: '海の前の家でも<br>買い物に40分かかったら…？',
        opts: [['マイカーを持っていく', 'マイカー'], ['レンタカーを借りる', 'レンタカー'], ['バスなどの公共交通', '公共交通'],
               ['自転車と徒歩で十分', '徒歩・自転車'], ['まだ考えていない', '移動は未定']] },
      { q: 'ひと月の予算、<br>何にもっと使いたい？', talk: '家賃だけ見て「思ったより安い！」<br>って決めちゃダメ！',
        opts: [['スーパーや病院が近い便利さ', '利便性'], ['海が見える宿', 'オーシャンビュー'], ['広くて静かな一棟貸し', '静かな一棟貸し'],
               ['グルメ・カフェめぐり', 'グルメ・カフェ'], ['できるだけ節約して長く滞在', '節約']] },
      { q: 'あなたが夢見る<br>済州の1日は？', talk: 'これが決まれば<br>町選びがラクになるよ！',
        opts: [['毎朝、海辺を散歩', '海辺さんぽ'], ['カフェで仕事しながら過ごす', 'カフェ作業'], ['静かな村でのんびり', 'のんびり村'],
               ['グルメや展示めぐり', 'グルメ・展示'], ['火山の丘「オルム」やオルレの遊歩道、森を歩く', 'オルム・森'], ['市場めぐりや地元の人との交流', '市場・地元']] },
    ],
    // place: the short name used in buttons ("咸徳の名所を見る")
    results: {
      shinjeju: { type: '安心の生活インフラ派', region: '新済州住民', place: '新済州', area: '済州市 老衡・蓮洞（ノヒョン・ヨンドン）· 空港周辺',
        line: '必要なものは全部近くに。<br>それが一番の安心', talk: '空港もスーパーも<br>近くて安心！',
        kw: ['生活の便利さが最優先の実用派', '子連れでも安心の動線', '空港が近く、韓国本土との行き来もラク', 'スーパー・病院・塾が近い生活圏', 'グルメやカフェも選び放題'],
        day: ['近所の公園をひとまわり散歩', 'スーパーも病院も近くて買い物がラク', '蓮洞のグルメ通りで夕ごはん'],
        tip: '宿は<b>子どもの動線（病院・スーパー・遊び場）</b>を基準に選ぶと、ひと月がぐっとラクに。' },
      wondosim: { type: '路地さんぽの徒歩派', region: '旧市街住民', place: '旧市街', area: '済州市 旧市街 · 三徒・一徒・塔洞（タプトン）',
        line: '車がなくても大丈夫。<br>歩いた分だけ済州が見えるから', talk: 'バスに乗って<br>どこへでも行ってみる？',
        kw: ['車がなくても暮らせる生活圏', '古い路地と市場めぐり', '展示・本屋・カフェ探し', '塔洞の海辺を散歩', 'ひとりでも退屈しない'],
        day: ['塔洞の海沿いを散歩', '路地の本屋とカフェめぐり', '東門市場で夕ごはんの買い出し'],
        tip: '宿を選ぶときは<b>近くのバス停と路線</b>から確認しましょう。' },
      hamdeok: { type: '海辺のワーケーショナー', region: '咸徳住民', place: '咸徳', area: '済州市 朝天邑 咸徳（ハムドク）',
        line: '仕事はノートPCで、<br>休みは海で', talk: '今日の会議は<br>海の見えるカフェで！',
        kw: ['仕事と休みのバランス重視', '海辺のカフェでノートPCを開く', '空港への行き来もラクな東側の海', 'エメラルド色のビーチを散歩', '平日は集中、週末は東側を旅'],
        day: ['咸徳ビーチで朝さんぽ', '海の見えるカフェで仕事', '犀牛峰（ソウボン）の遊歩道で夕焼け'],
        tip: 'ハイシーズンはビーチが混みます。<b>仕事用のカフェを何軒か</b>見つけておきましょう。' },
      gujwa: { type: 'のんびり海辺の村人', region: '旧左住民', place: '旧左', area: '旧左邑 細花・終達・月汀（セファ・チョンダル・ウォルジョン）',
        line: '急ぐことのない町で、<br>わたしもゆっくり', talk: 'ここは時間が<br>ゆっくり流れるよ〜',
        kw: ['静かな海辺の村の雰囲気', '小さな雑貨屋・本屋めぐり', '石垣の道を散歩するのが日課', '観光地より町の暮らし', 'ひとりの時間が好き'],
        day: ['細花の海沿いを散歩', '小さな雑貨屋と本屋めぐり', '石垣の道を通って村の食堂で夕ごはん'],
        tip: '村のお店は<b>早く閉まるところ</b>も多いです。夕方の買い物は早めに！' },
      pyoseon: { type: 'ゆったり一休み派', region: '表善・南元住民', place: '表善・南元', area: '西帰浦市 表善面・南元邑（ピョソン・ナムウォン）',
        line: '何もしなくていい1日が、<br>いちばん好き', talk: '今日の予定？<br>夕焼けを見ることだけ！',
        kw: ['休むことが今回のひと月の目標', '広い砂浜と静かな海', '観光客が比較的少ない静けさ', 'ときどき車で近場におでかけ', '広い宿でのんびり'],
        day: ['広い表善ビーチを散歩', '宿で昼寝と読書', '南元の海沿いをゆっくり歩く'],
        tip: '大きなスーパーや病院は<b>車で行く前提</b>で計画しましょう。' },
      seogwipo: { type: 'あったか南の暮らし派', region: '西帰浦市内住民', place: '西帰浦市内', area: '西帰浦市 市内（ソギポ）',
        line: '済州暮らしの練習は、<br>あたたかい南の街で', talk: '南は風も<br>あたたかいよ！',
        kw: ['移住前に「本物の暮らし」を体験', '市場と路地のある町', '歩いて楽しめる海辺の散歩道', 'オルレと滝がすぐそば', 'あたたかい南の気候'],
        day: ['海辺の散歩道で1日をスタート', '李仲燮（イ・ジュンソプ）通りを散歩', '毎日オルレ市場で夕食の買い出し'],
        tip: '漢拏山（ハルラサン）の南側なので、<b>空港までの移動時間</b>を必ず計算しておきましょう。' },
      andeok: { type: '静かな南西の隠れ家派', region: '安徳・大静住民', place: '安徳・大静', area: '西帰浦市 安徳面・大静邑（アンドク・テジョン）',
        line: '海もオルムも、<br>静かな時間をひとり占め', talk: 'しーっ、ここは<br>わたしだけが知ってる町',
        kw: ['静けさも自然もゆずれない', '山房山・松岳山が見える風景', 'オルムと海を交互にお散歩', 'にぎやかな場所は避けたい', '摹瑟浦（モスルポ）港町の暮らし'],
        day: ['松岳山の周遊路を歩く', '山房山が見えるカフェでひと休み', '摹瑟浦港の近くで夕ごはん'],
        tip: '南西の端なので済州市まではかなり遠いです。<b>空港に行く日は余裕をもって！</b>' },
      hallim: { type: 'エメラルドの海さんぽ派', region: '翰林住民', place: '翰林', area: '翰林邑 挟才・金陵（ヒョプチェ・クムヌン）',
        line: '毎朝、海の色を確かめるのが<br>1日の始まり', talk: '今日の海の色見た？<br>完全にエメラルド！',
        kw: ['朝の海辺さんぽがルーティン', '透き通ったエメラルド色の海', '飛揚島（ピヤンド）が見える風景', '旅行よりゆっくりな旅', '西側の夕焼けもおまけ'],
        day: ['挟才・金陵の海の色を見ながら散歩', '近くのオルムにひとつ登る', '飛揚島の向こうに沈む夕日を見る'],
        tip: '夏のハイシーズンはビーチがにぎわいます。静かに過ごしたいなら<b>早朝の散歩</b>がおすすめ！' },
      aewol: { type: '夕焼けカフェ好き', region: '涯月住民', place: '涯月', area: '済州市 涯月邑（エウォル）',
        line: '1日の終わりは、<br>必ず夕焼けの見えるカフェで', talk: '夕焼けの時間は<br>絶対カフェへ！',
        kw: ['海が見えるカフェめぐりが日課', '海岸道路をドライブ', '恋人・友だちとエモいひと月', '写真映えする瞬間がいっぱい', '夕焼けの時間は予定を空ける'],
        day: ['海岸道路沿いをドライブ', '海の見えるカフェでのんびり', '漢潭（ハンダム）海岸遊歩道で夕焼け'],
        tip: 'カフェ通りの周辺は週末に混みます。宿は<b>少し内陸の村</b>も一緒に探してみて。' },
      jungsangan: { type: 'オルム・森の探検家', region: '中山間住民', place: '中山間', area: '松堂・加時里・橋来など 中山間の村（ソンダン・カシリ・キョレ）',
        line: '海より森、<br>波の音より風の音', talk: 'もうひとつ<br>オルムに登ってみる？',
        kw: ['オルム登りが趣味', '森の道と牧場の風景の中で暮らす', 'ペットとの散歩にぴったり', '静かに集中できる時間', '車は必須、そのぶん景色はひとり占め'],
        day: ['近くのオルムにひとつ登る', '森の道をゆっくり歩く', '明かりの少ない村で星を見る'],
        tip: '車がないと暮らすのは難しいです。<b>買い物や病院への動線</b>を必ず事前に確認しましょう。' },
    },
  },
  en: {
    questions: [
      { q: 'What’s your #1 reason<br>for a month in Jeju?', talk: 'Here to rest or to work?<br>It’s a different Jeju!',
        opts: [['To get away from work and fully rest', 'Rest'], ['To work from my laptop here', 'Workation'], ['To try living here before moving', 'Trial move'],
               ['To feel Jeju slowly, not just sightsee', 'Slow travel'], ['To dive into a hobby or project', 'Deep focus']] },
      { q: 'Who’s joining you<br>this month?', talk: 'It all depends on<br>who you come with!',
        opts: [['Just me', 'Solo'], ['My partner or friends', 'Partner/friends'], ['My kids', 'With kids'], ['My pet', 'With pet'], ['My parents or family', 'Family']] },
      { q: 'How will you<br>get around?', talk: 'Even by the ocean… what if groceries<br>are 40 minutes away?',
        opts: [['Bringing my own car', 'Own car'], ['Renting a car', 'Rental car'], ['Buses and public transit', 'Transit'],
               ['A bike or my own two feet', 'Walk/bike'], ['Haven’t thought about it yet', 'Not sure yet']] },
      { q: 'Where would you rather<br>spend your budget?', talk: 'Don’t just look at the rent<br>and think “So cheap!”',
        opts: [['Near groceries and hospitals', 'Convenience'], ['A place with an ocean view', 'Ocean view'], ['A spacious, quiet whole-house rental', 'Entire house'],
               ['Exploring restaurants and cafés', 'Food & cafés'], ['Spending less so I can stay longer', 'Budget stay']] },
      { q: 'What does your dream<br>day in Jeju look like?', talk: 'Once you know this,<br>picking a neighborhood is easy!',
        opts: [['A walk by the sea every morning', 'Sea walks'], ['Working from cafés', 'Café work'], ['Slow days in a quiet village', 'Slow village'],
               ['Hunting for good food and exhibitions', 'Food & art'], ['Hiking volcanic hills, Olle trails & forests', 'Hills & forests'], ['Browsing markets, meeting locals', 'Markets & locals']] },
    ],
    results: {
      shinjeju: { type: 'Everything-Nearby Type', region: 'Shin-Jeju Local', place: 'Shin-Jeju', area: 'Nohyeong & Yeon-dong, Jeju City · near the airport',
        line: 'Everything close by = peace of mind', talk: 'Airport and stores close by.<br>So reassuring!',
        kw: ['Practical, convenience first', 'Stress-free routines with kids', 'Easy flights to mainland Korea', 'Stores, clinics & cram schools', 'Lots of restaurants & cafés'],
        day: ['A loop around the neighborhood park', 'Easy errands to stores and clinics', 'Dinner on a Yeon-dong food street'],
        tip: 'Choose your stay around <b>your kids’ routes (hospital, grocery, playground)</b> and the month gets much easier.' },
      wondosim: { type: 'Alley-Walking Explorer', region: 'Old Town Local', place: 'Old Town', area: 'Old downtown Jeju City · Samdo, Ildo, Tapdong',
        line: 'No car? No problem. Walk more, see more.', talk: 'Shall we hop on a bus<br>and go anywhere?',
        kw: ['Livable without a car', 'Old alleys and local markets', 'Exhibitions, bookshops & cafés', 'Seaside walks in Tapdong', 'Never bored, even solo'],
        day: ['A walk along the Tapdong seafront', 'Browsing alley bookshops and cafés', 'Picking up dinner at Dongmun Market'],
        tip: 'When choosing a stay, check <b>the nearest bus stops and routes</b> first.' },
      hamdeok: { type: 'Beachfront Workcationer', region: 'Hamdeok Local', place: 'Hamdeok', area: 'Hamdeok, Jocheon-eup, Jeju City',
        line: 'Work on the laptop, rest by the sea', talk: 'Today’s meeting is at<br>a beachfront café!',
        kw: ['Balancing work and rest', 'Laptop open at a seaside café', 'East coast, easy airport access', 'Beach walks beside emerald waters', 'Weekday focus, weekend trips'],
        day: ['A morning walk on Hamdeok Beach', 'Working at a café with a sea view', 'Sunset on the Seoubong trail'],
        tip: 'The beach gets crowded in peak season. <b>Pick a few cafés to work from</b> in advance.' },
      gujwa: { type: 'Slow Seaside Villager', region: 'Gujwa Local', place: 'Gujwa', area: 'Gujwa-eup · Sehwa, Jongdal, Woljeong',
        line: 'No rush here, so I slow down too', talk: 'Time flows slowly<br>around here~',
        kw: ['Quiet seaside village vibes', 'Little gift shops & bookstores', 'Daily walks by stone walls', 'Village life over tourist spots', 'Loves time alone'],
        day: ['A walk along the Sehwa coast', 'Browsing small shops and bookstores', 'Dinner at a village diner past the stone walls'],
        tip: 'Many village shops <b>close early</b>. Do your evening grocery run ahead of time!' },
      pyoseon: { type: 'Take-a-Breather Type', region: 'Pyoseon & Namwon Local', place: 'Pyoseon & Namwon', area: 'Pyoseon-myeon & Namwon-eup, Seogwipo',
        line: 'My favorite day? One with nothing to do', talk: 'Today’s plan?<br>Just watching the sunset!',
        kw: ['Resting is the goal this month', 'Wide sandy beaches, calm sea', 'Fewer tourists, more quiet', 'Occasional drives nearby', 'Lazy days in a roomy stay'],
        day: ['A walk on wide Pyoseon Beach', 'Naps and a good book at your stay', 'A slow stroll along the Namwon coast'],
        tip: 'Plan on <b>driving to big supermarkets and hospitals</b>.' },
      seogwipo: { type: 'Warm Southern Settler', region: 'Seogwipo Downtown Local', place: 'Downtown Seogwipo', area: 'Downtown Seogwipo',
        line: 'Practicing island life in the warm south', talk: 'Even the wind is<br>warmer down south!',
        kw: ['Trying real life before moving', 'Markets and cozy alleys', 'Seaside paths on foot', 'Olle trails & waterfalls nearby', 'Warm southern weather'],
        day: ['Starting the day on a seaside path', 'A stroll down Lee Jung-seop Street', 'Dinner shopping at Maeil Olle Market'],
        tip: 'You’re south of Hallasan, so <b>factor in the trip to the airport</b>.' },
      andeok: { type: 'Quiet Southwest Hideaway', region: 'Andeok & Daejeong Local', place: 'Andeok & Daejeong', area: 'Andeok-myeon & Daejeong-eup, Seogwipo',
        line: 'The sea and volcanic hills, all to myself', talk: 'Shh, this is my<br>secret neighborhood',
        kw: ['Won’t give up quiet or nature', 'Views of Sanbangsan & Songaksan', 'Walks on volcanic hills and by the sea', 'Avoids crowded places', 'Harbor-town life in Moseulpo'],
        day: ['A walk on the Songaksan trail', 'Unwinding at a café facing Sanbangsan', 'Dinner near Moseulpo Harbor'],
        tip: 'It’s the far southwest, so Jeju City is a long way off. <b>Leave plenty of time on airport days!</b>' },
      hallim: { type: 'Emerald Sea Stroller', region: 'Hallim Local', place: 'Hallim', area: 'Hallim-eup · Hyeopjae, Geumneung',
        line: 'Each day starts with the color of the sea', talk: 'Seen the sea today?<br>Total emerald!',
        kw: ['Morning beach walks on repeat', 'Clear, emerald-green water', 'Views of Biyangdo Island', 'Slower than a typical trip', 'West-coast sunsets as a bonus'],
        day: ['A walk by the Hyeopjae and Geumneung water', 'Hiking up a nearby volcanic hill', 'Sunset beyond Biyangdo Island'],
        tip: 'Beaches get busy in summer. For some quiet, try <b>an early-morning walk</b>!' },
      aewol: { type: 'Sunset Café Lover', region: 'Aewol Local', place: 'Aewol', area: 'Aewol-eup, Jeju City',
        line: 'Every day ends at a sunset café', talk: 'Sunset time means<br>café time!',
        kw: ['Ocean-view café hopping', 'Coastal road drives', 'Scenic dates and friend trips', 'So many photo moments', 'Keeps sunset hours free'],
        day: ['A drive along the coastal road', 'Relaxing at a café with a sea view', 'Sunset on the Handam coastal walk'],
        tip: 'The café strip gets busy on weekends. Also look for stays <b>in villages a bit inland</b>.' },
      jungsangan: { type: 'Volcanic Hill & Forest Explorer', region: 'Inland Village Local', place: 'the inland villages', area: 'Songdang, Gasi-ri & Gyorae, between the coast and Hallasan',
        line: 'Forest over sea, wind over waves', talk: 'Shall we hike up<br>one more volcanic hill?',
        kw: ['Volcanic hill hikes as a hobby', 'Life among forests & pastures', 'Great for walks with your pet', 'Quiet time to focus', 'Car required, views all yours'],
        day: ['Hiking up a nearby volcanic hill', 'A slow walk along forest trails', 'Stargazing in a village with few lights'],
        tip: 'Life here is hard without a car. <b>Check your routes to groceries and clinics</b> in advance.' },
    },
  },
  zh: {
    questions: [
      { q: '这一个月去济州，<br>最主要的原因是？', talk: '来休息的人和来工作的人，<br>看到的济州不一样！',
        opts: [['想摆脱工作，好好休息', '休息'], ['带着笔记本边工作边生活', '旅居办公'], ['移居前想先试住一下', '试住'],
               ['比起旅游，想慢慢感受济州', '慢旅行'], ['想沉浸在爱好或项目里', '沉浸']] },
      { q: '这一个月，<br>和谁一起？', talk: '和谁一起来，<br>完全不一样！',
        opts: [['一个人', '独自'], ['和恋人·朋友', '恋人·朋友'], ['带孩子', '带娃'], ['带宠物', '宠物'], ['和父母·家人', '家人']] },
      { q: '这一个月，<br>你怎么出行？', talk: '就算住在海边，<br>买菜要40分钟的话…？',
        opts: [['开自己的车', '自驾'], ['租车', '租车'], ['公交等公共交通', '公共交通'],
               ['骑车或走路就够了', '步行·骑车'], ['还没想好', '还没想好']] },
      { q: '一个月的预算，<br>更想花在哪儿？', talk: '只看房租就觉得“好便宜”？<br>可不行哦！',
        opts: [['离超市·医院近，生活方便', '生活便利'], ['能看到海的住处', '海景'], ['宽敞安静的独栋', '安静独栋'],
               ['探店·逛咖啡馆', '美食·咖啡'], ['尽量省钱，住得更久', '省钱']] },
      { q: '你梦想中的<br>济州一天是？', talk: '这个定下来，<br>选街区就容易了！',
        opts: [['每天早上去海边散步', '海边散步'], ['在咖啡馆边工作边生活', '咖啡馆办公'], ['在安静的村子里慢慢过', '慢村生活'],
               ['寻找美食和展览', '美食·展览'], ['爬火山丘、走偶来小路和森林', '火山丘·森林'], ['逛市场，和当地人打成一片', '市场·当地']] },
    ],
    results: {
      shinjeju: { type: '安心生活设施派', region: '新济州居民', place: '新济州', area: '济州市 老衡洞·莲洞 · 机场附近',
        line: '需要的都在身边，<br>心里才踏实', talk: '机场、超市都很近，<br>超安心！',
        kw: ['生活便利第一的务实派', '带孩子出行也方便', '离机场近，往返韩国本土很方便', '超市·医院·补习班都在附近', '美食咖啡任你挑'],
        day: ['在小区公园绕一圈散步', '超市、医院都在附近，日常采购很方便', '在莲洞美食街吃晚饭'],
        tip: '选住处时，先看看<b>带孩子去医院、超市和游乐场是否方便</b>，这一个月会轻松很多。' },
      wondosim: { type: '小巷散步步行派', region: '老城区居民', place: '老城区', area: '济州市 老城区 · 三徒·一徒·塔洞',
        line: '没车也没关系，<br>走得越多，看到的济州越多', talk: '坐上公交，<br>随便去哪儿逛逛？',
        kw: ['没车也能生活的街区', '逛老巷子和市场', '探访展览·书店·咖啡馆', '塔洞海边散步', '一个人也不无聊'],
        day: ['沿着塔洞海边散步', '逛巷子里的书店和咖啡馆', '在东门市场买晚饭'],
        tip: '选住处时，先确认<b>附近的公交站和线路</b>。' },
      hamdeok: { type: '海边旅居办公族', region: '咸德居民', place: '咸德', area: '济州市 朝天邑 咸德',
        line: '工作交给笔记本，<br>休息交给大海', talk: '今天的会议<br>在海边咖啡馆开！',
        kw: ['重视工作与休息的平衡', '在海边咖啡馆打开笔记本', '往返机场方便的东部海边', '在翡翠色海滩散步', '工作日专注，周末东部游'],
        day: ['在咸德海滩晨间散步', '在看得见海的咖啡馆工作', '在犀牛峰步道看日落'],
        tip: '旺季海滩人很多，<b>提前收藏几家能办公的咖啡馆</b>吧。' },
      gujwa: { type: '慢节奏海边村民', region: '旧左居民', place: '旧左', area: '旧左邑 细花·终达·月汀',
        line: '在不慌不忙的村子里，<br>我也慢下来', talk: '这里的时间<br>过得很慢～',
        kw: ['安静的海边小村氛围', '逛小杂货店和书店', '石墙小路散步是日常', '比起景点更爱村里生活', '喜欢独处的时光'],
        day: ['沿着细花海边散步', '逛小杂货店和书店', '穿过石墙小路，在村里小馆吃晚饭'],
        tip: '村里很多店<b>关门很早</b>，晚上要买的东西记得提前买！' },
      pyoseon: { type: '悠闲休止符型', region: '表善·南元居民', place: '表善·南元', area: '西归浦市 表善面·南元邑',
        line: '什么都不用做的一天，<br>最好', talk: '今天的安排？<br>只有看日落！',
        kw: ['这个月的目标就是休息', '宽阔沙滩和安静的海', '游客相对较少的清静', '偶尔开车去周边转转', '在宽敞的住处慢悠悠'],
        day: ['在宽阔的表善海滩散步', '在住处午睡、看本书', '沿着南元海边慢慢走'],
        tip: '大超市和医院，要<b>按开车去来规划</b>。' },
      seogwipo: { type: '温暖南部生活家', region: '西归浦市区居民', place: '西归浦市区', area: '西归浦市 市区',
        line: '济州生活的练习，<br>就在温暖的南部市区', talk: '南边的风<br>都是暖的！',
        kw: ['移居前体验“真实生活”', '有市场和小巷的街区', '步行就能享受的海边步道', '偶来小路和瀑布都很近', '温暖的南部天气'],
        day: ['在海边步道开始一天', '逛李仲燮街的小巷', '在每日偶来市场买晚饭'],
        tip: '这里在汉拿山南边，<b>往返机场的时间</b>一定要算好。' },
      andeok: { type: '清静西南隐居派', region: '安德·大静居民', place: '安德·大静', area: '西归浦市 安德面·大静邑',
        line: '大海和火山丘，<br>在安静时光里独享', talk: '嘘，这是<br>只有我知道的地方',
        kw: ['清静和自然都不想放弃', '能看到山房山·松岳山的风景', '时而漫步火山丘，时而沿海散步', '想避开热闹的地方', '摹瑟浦港口小镇的生活感'],
        day: ['走松岳山环山步道', '在看得见山房山的咖啡馆休息', '在摹瑟浦港附近吃晚饭'],
        tip: '这里在西南端，到济州市挺远的。<b>去机场那天要留足时间！</b>' },
      hallim: { type: '翡翠海边散步家', region: '翰林居民', place: '翰林', area: '翰林邑 挟才·金陵',
        line: '每天早上看看海的颜色，<br>一天就开始了', talk: '今天看海了吗？<br>完全是翡翠色！',
        kw: ['早上海边散步是日常', '清澈的翡翠色大海', '能看到飞扬岛的风景', '比旅行更慢的旅行', '还附赠西边的日落'],
        day: ['看着挟才·金陵的海水散步', '爬一座附近的火山丘', '看太阳在飞扬岛后面落下'],
        tip: '夏季旺季海滩很热闹，想要清静推荐<b>清晨散步</b>！' },
      aewol: { type: '日落咖啡馆文艺派', region: '涯月居民', place: '涯月', area: '济州市 涯月邑',
        line: '一天的结尾，<br>一定要在看得见日落的咖啡馆', talk: '日落时间<br>一定要去咖啡馆！',
        kw: ['逛海景咖啡馆是日常', '沿着海岸公路兜风', '和恋人·朋友的文艺一个月', '好出片的瞬间特别多', '日落时间留空不排事'],
        day: ['沿着海岸公路兜风', '在看得见海的咖啡馆放空', '在汉潭海岸步道看日落'],
        tip: '咖啡街周边周末人多，住处也可以找找<b>稍微靠内陆的村子</b>。' },
      jungsangan: { type: '火山丘·森林探险家', region: '山间村落居民', place: '山间村落', area: '松堂、加时里、桥来等位于海岸与汉拿山之间的内陆村落',
        line: '比起大海更爱森林，<br>比起海浪声更爱风声', talk: '要不要<br>再爬一座火山丘？',
        kw: ['爱好是爬火山丘', '生活在林间小路和牧场风景里', '适合带宠物散步', '安静专注的时光', '车是必需品，风景独享'],
        day: ['爬一座附近的火山丘', '沿着林间小路慢慢走', '在灯光稀少的村子看星星'],
        tip: '没有车，日常生活会很不方便。一定要<b>提前确认买菜和去医院的路线及交通方式</b>。' },
    },
  },
};

// ?lang=ja in the link wins, then the visitor's last choice, then the phone's own language
// (Korean, Japanese or Chinese as set; any other language gets English)
function detectLang() {
  try { const q = new URLSearchParams(location.search).get('lang'); if (LANGS[q]) return q; } catch (e) { /* no query */ }
  if (PAGE_LANG !== 'ko' && LANGS[PAGE_LANG]) return PAGE_LANG;   // 영어·일본어 웹진 페이지
  try { const s = localStorage.getItem('ijejumin.villageTest.lang'); if (LANGS[s]) return s; } catch (e) { /* storage blocked */ }
  const nav = (navigator.language || 'ko').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : nav.startsWith('ja') ? 'ja' : nav.startsWith('zh') ? 'zh' : 'en';
}
let LANG = detectLang();
function t(k, ...a) {
  const v = k in UI[LANG] ? UI[LANG][k] : UI.ko[k];
  return typeof v === 'function' ? v(...a) : v;
}
// the question / result in the current language
function Q(i) {
  const base = QUESTIONS[i], tr = CONTENT[LANG] && CONTENT[LANG].questions[i];
  return tr ? { ...base, q: tr.q, talk: tr.talk, opts: base.opts.map((o, j) => [tr.opts[j][0], tr.opts[j][1], o[2]]) } : base;
}
function R(key) {
  const base = RESULTS[key], tr = CONTENT[LANG] && CONTENT[LANG].results[key];
  return tr ? { ...base, ...tr } : { ...base, place: base.region.replace(' 주민', '') };
}
function loadLangFonts(l) {
  if (!LANG_FONTS[l] || document.getElementById('font-' + l)) return;
  const k = document.createElement('link'); k.id = 'font-' + l; k.rel = 'stylesheet'; k.href = LANG_FONTS[l];
  document.head.appendChild(k);
}

let cur = null;   // the result on screen, so a language switch can redraw it
function applyStatic() {
  vtRoot.lang = LANG === 'zh' ? 'zh-CN' : LANG;   // Simplified Chinese glyphs (웹진 페이지 전체가 아니라 테스트 칸에만)
  loadLangFonts(LANG);
  // 웹진 헤더의 KO·EN·JA 중 지금 언어에 흰 동그라미 (중국어는 없음)
  document.querySelectorAll('.wz-lang a').forEach(a => { if (a.getAttribute('hreflang') === LANG) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  vtRoot.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  vtRoot.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  vtRoot.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  vtRoot.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = t(el.dataset.i18nAlt); });
  const ti = $('titleimg'), src = LANG === 'ko' ? IMG + 'title.webp' : `${IMG}title-${LANG}.webp`;
  if (ti.getAttribute('src') !== src) ti.src = src;
  ti.alt = t('docTitle');
  $('langmenu').innerHTML = Object.entries(LANGS).map(([k, n]) =>
    `<button type="button" role="menuitemradio" lang="${k}" aria-checked="${k === LANG}" data-act="setlang" data-lang="${k}">${n}</button>`).join('');
  fitHeader();
}
// Keep the header on one line: on narrow phones the home pill shows only its icon, then the pills sit closer together.
function fitHeader() {
  const h = vtRoot.querySelector('.hdr');
  h.classList.remove('c1', 'c2');
  for (const c of ['c1', 'c2']) {
    if (h.scrollWidth <= h.clientWidth + 1) return;
    h.classList.add(c);
  }
}
window.addEventListener('resize', fitHeader);
function closeLangMenu() { $('langmenu').hidden = true; $('langbtn').setAttribute('aria-expanded', 'false'); }
function toggleLangMenu() {
  const m = $('langmenu'); m.hidden = !m.hidden;
  $('langbtn').setAttribute('aria-expanded', String(!m.hidden));
}
function setLang(l) {
  closeLangMenu();
  if (!LANGS[l] || l === LANG) return;
  LANG = l;
  try { localStorage.setItem('ijejumin.villageTest.lang', l); } catch (e) { /* storage blocked */ }
  if (STANDALONE) {
    try {
      const u = new URL(location.href);
      if (l === PAGE_LANG) u.searchParams.delete('lang'); else u.searchParams.set('lang', l);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* the address is a convenience only */ }
  }
  track('language', { lang: l });
  applyStatic();
  if (!$('quiz').hidden) renderQuestion();
  else if (!$('result').hidden && cur) renderResult(cur.key, cur.isMine);
  else if (!$('all').hidden) renderAll();
}
document.addEventListener('click', e => { if (!$('langmenu').hidden && !e.target.closest('.langwrap')) closeLangMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLangMenu(); });

/* ===================== scoring ===================== */
// answers: array of option indexes, one per question
function score(answers) {
  const total = Object.fromEntries(ORDER.map(k => [k, 0]));
  const byQ = QUESTIONS.map(() => Object.fromEntries(ORDER.map(k => [k, 0])));
  answers.forEach((ai, qi) => {
    const q = QUESTIONS[qi], pts = q.opts[ai][2], w = q.weight || 1;
    for (const [k, v] of Object.entries(pts)) { total[k] += v * w; byQ[qi][k] += v; }
  });
  // ties: the 'daily life' answer first, then mobility, then companions, then map order
  const rank = ORDER.slice().sort((a, b) =>
    total[b] - total[a] || byQ[4][b] - byQ[4][a] || byQ[2][b] - byQ[2][a] || byQ[1][b] - byQ[1][a] || ORDER.indexOf(a) - ORDER.indexOf(b));
  return { rank, total };
}

/* ===================== torn paper ===================== */
function tear(el) {
  const bg = el.querySelector('.pbg'); if (!bg) return;
  const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
  let seed = [...(el.dataset.seed || 'x')].reduce((s, c) => s + c.charCodeAt(0), 7);
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const pts = [], step = 13, J = 5;
  const edge = (x0, y0, x1, y1, ix, iy) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 0; i < n; i++) {
      const t = i / n, j = rnd() * J + (rnd() < .07 ? rnd() * 5 : 0);
      pts.push(`${(x0 + (x1 - x0) * t + ix * j).toFixed(1)}px ${(y0 + (y1 - y0) * t + iy * j).toFixed(1)}px`);
    }
  };
  edge(0, 0, w, 0, 0, 1); edge(w, 0, w, h, -1, 0); edge(w, h, 0, h, 0, -1); edge(0, h, 0, 0, 1, 0);
  bg.style.clipPath = `polygon(${pts.join(',')})`;
}
const paperRO = new ResizeObserver(es => es.forEach(e => tear(e.target)));
function papers(root) {
  root.querySelectorAll('.paper').forEach(p => {
    if (!p.querySelector(':scope > .pshadow')) p.insertAdjacentHTML('afterbegin', '<div class="pshadow"><div class="pbg"></div></div>');
    tear(p); paperRO.observe(p);
  });
}

/* ===================== screens ===================== */
const $ = id => document.getElementById(id);
const icon = (id) => `<svg class="icon" viewBox="0 0 48 48" aria-hidden="true"><use href="#${id}"/></svg>`;
const img = (pose, alt = '') => `<img src="${IMG}${pose}.webp" alt="${alt}" decoding="async">`;
let answers = [], qi = 0, mine = null;
const PRELOADED = [...new Set([...QUESTIONS.map(q => q.pose), 'pose-b-08', ...ORDER.map(k => RESULTS[k].pose)])]
  .map(p => { const i = new Image(); i.src = `${IMG}${p}.webp`; return i; });

function show(id) {
  ['start', 'quiz', 'loading', 'result', 'all'].forEach(s => { $(s).hidden = s !== id; });
  $('bgphoto').hidden = id !== 'start';
  $('homebtn').classList.toggle('on', id === 'start');
  $('app').classList.toggle('fit', ['start', 'quiz', 'loading'].includes(id));
  window.scrollTo(0, 0);
  const el = $(id); el.classList.remove('vt-reveal'); void el.offsetWidth; el.classList.add('vt-reveal');
  papers(el);
}

function renderQuestion() {
  const q = Q(qi);
  $('progress').innerHTML = TOPICS.map((t, i) =>
    `<span class="chip${i === qi ? ' on' : i < qi ? ' done' : ''}">${icon(t)}</span>`).join('');
  $('qcard').innerHTML = `<span class="qno">Q${qi + 1}<span class="qno-of"> / ${QUESTIONS.length}</span></span><h2 class="qtext">${q.q}</h2>`;
  $('qcard').dataset.seed = 'q' + qi;
  $('opts').innerHTML = q.opts.map((o, i) =>
    `<button class="opt${answers[qi] === i ? ' picked' : ''}" type="button" id="opt-${qi}-${i}" data-i="${i}"><span class="box" aria-hidden="true"></span><span>${o[0]}</span></button>`).join('');
  $('qtalk').innerHTML = `${img(q.pose)}<div class="bubble">${q.talk}</div>`;
  show('quiz');
}

function pick(i) {
  answers[qi] = i;
  $('opts').querySelectorAll('.opt').forEach(b => b.classList.toggle('picked', +b.dataset.i === i));
  setTimeout(() => {
    if (qi < QUESTIONS.length - 1) { qi++; renderQuestion(); }
    else {
      show('loading');
      setTimeout(() => { mine = score(answers); track('test_complete', { region: koPlace(mine.rank[0]) }); renderResult(mine.rank[0], true); }, 1500);
    }
  }, 260);
}

function meters(stats) {
  return `<dl class="meters">${t('stats').map((l, i) =>
    `<dt>${l}</dt><dd aria-label="${t('meterAria', l, stats[i])}">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= stats[i] ? 'f' : ''}"></i>`).join('')}</dd>`).join('')}</dl>`;
}

function renderResult(key, isMine) {
  const r = R(key);
  cur = { key, isMine };
  $('result').innerHTML = `
    <p class="rhead">${isMine ? t('rheadMine') : t('rheadOther')}</p>
    ${isMine ? `<div class="answers" aria-label="${t('myAnswers')}">${answers.map((a, i) =>
        (i === Math.ceil(answers.length / 2) ? '<i class="br"></i>' : '') + `<span>${Q(i).opts[a][1]}</span>`).join('')}</div>` : ''}
    <article class="paper rcard" data-seed="${key}">
      <div class="rtop">
        <span class="typepill"><span class="chip">${icon(r.icon)}</span>${r.type}</span>
        <h2 class="region">${r.region}<small>${r.area}</small></h2>
        <p class="oneliner">${t('quote', r.line)}</p>
      </div>
      <div class="rtalk">${img(r.pose, t('harubangAlt'))}<div class="bubble">${r.talk}</div></div>
      <section class="sec"><h3>${t('secStats')}</h3>${meters(r.stats)}</section>
      <section class="sec"><h3>${t('secKw')}</h3><ul class="kw">${r.kw.map(k => `<li>${k}</li>`).join('')}</ul></section>
      <section class="sec"><h3>${t('secDay')}</h3><div class="day">${t('dayLabels').map((d, i) => `<b>${d}</b><span>${r.day[i]}</span>`).join('')}</div></section>
      <p class="tip"><b>${t('tip')}</b> · ${r.tip}</p>
      <p class="stamp">${t('stamp')}</p>
    </article>
    ${(() => {   // one tap: save the image first, then move to the webzine as soon as the save has started
      const inner = `<span class="l1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 V15 M7 10.5 L12 15.5 L17 10.5"/><path d="M4 17 V20 H20 V17"/></svg><span class="lbl">${t('saveLabel', r.place).replace('&', '&amp;')}</span></span>`;
      return PLACE_PAGES[key]
        ? `<button class="cta save combo" type="button" data-act="save" data-key="${key}">${inner}</button>`
        : `<button class="cta save combo" type="button" data-act="save" data-key="${key}">${inner}<small>${t('soonSmall')}</small></button>`;
    })()}
    <button class="cta yellow combo" type="button" data-act="share"><span class="l1"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-share"/></svg><span>${t('shareBtn')}</span></span></button>
    ${isMine ? `<button class="cta blue" type="button" data-act="restart">${t('restart')}</button>` : ''}
    ${isMine ? '' : (mine ? `<button class="cta ghost" type="button" data-act="mine">${t('backMine')}</button>` : `<button class="cta" type="button" data-act="restart">${t('tryToo')}</button>`)}
    <p class="beta">${t('beta')}</p>`;
  show('result');
  fitChips();
  try { history.replaceState(null, '', '#' + key); } catch (e) { /* hash is a convenience only */ }
  setTimeout(() => prepareImage(key).promise.catch(() => {}), 250);
}

// Keep the answer chips on one line: shrink the text down to 11px; if that is still too wide, break 3/2.
function fitChips() {
  const box = document.querySelector('#result .answers'); if (!box) return;
  box.classList.remove('two');
  for (let fs = 13; fs >= 11; fs -= 0.5) {
    box.style.setProperty('--chip-fs', fs + 'px');
    if (box.scrollWidth <= box.clientWidth + 1) return;
  }
  box.style.setProperty('--chip-fs', '13px');
  box.classList.add('two');
}
window.addEventListener('resize', () => { if (!$('result').hidden) fitChips(); });

function renderAll() {
  const myKey = mine ? mine.rank[0] : null;
  $('all').innerHTML = `
    <div class="vt-topbar is-plain"><button class="back" type="button" data-act="${myKey ? 'mine' : 'home'}">${myKey ? t('allBackMine') : t('allBackHome')}</button></div>
    <p class="rhead">${t('allHead')}</p>
    <div class="grid">${ORDER.map(k => { const r = R(k); return `
      <button class="tile${k === myKey ? ' mine' : ''}" type="button" data-act="view" data-key="${k}">
        <img src="${IMG}${r.pose}.webp" alt="" loading="lazy"><small>${r.type}</small><b>${r.region}</b>
      </button>`; }).join('')}</div>
    <button class="cta" type="button" data-act="restart">${mine ? t('restart') : t('go')}</button>`;
  show('all');
}

/* ===================== events ===================== */
$('go').addEventListener('click', () => { track('test_start', { via: 'home' }); answers = []; qi = 0; renderQuestion(); });
$('back').addEventListener('click', () => { if (qi > 0) { qi--; renderQuestion(); } else show('start'); });
$('opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) pick(+b.dataset.i); });
vtRoot.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'restart') { track('test_start', { via: mine ? 'retry' : 'friend_result' }); answers = []; qi = 0; mine = null; renderQuestion(); }
  else if (act === 'all') renderAll();
  else if (act === 'view') renderResult(b.dataset.key, mine && b.dataset.key === mine.rank[0]);
  else if (act === 'mine' && mine) renderResult(mine.rank[0], true);
  else if (act === 'home') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} show('start'); }
  else if (act === 'save') saveImage(b);
  else if (act === 'soon') toast(t('soon'), 4200);
  else if (act === 'lang') toggleLangMenu();
  else if (act === 'setlang') setLang(b.dataset.lang);
  else if (act === 'closesheet') closeSheet();
  else if (act === 'sheetgo') sheetGo();
  else if (act === 'spots') toast(t('soon'), 4200);
  else if (act === 'share') shareTest();
  else if (act === 'closecopy') $('copybox').hidden = true;
});

/* ===================== share ===================== */
// Clipboard copy must start inside the click handler; if the frame refuses it, show the text to copy by hand.
function copyText(text, okMsg, done = () => {}) {
  const fallback = () => { $('copytext').value = text; $('copybox').hidden = false; setTimeout(() => $('copytext').select(), 50); done('copy_box'); };
  try {
    navigator.clipboard.writeText(text).then(() => { toast(okMsg); done('copy'); }, fallback);
  } catch (e) { fallback(); }
}
function shareTest() {
  const onResult = !$('result').hidden && mine;
  const r = onResult ? R(mine.rank[0]) : null;
  const msg = r ? t('shareMine', r) : t('shareGeneric');
  const url = STANDALONE && LANG !== 'ko' ? `${SHARE_URL}?lang=${LANG}` : SHARE_URL;   // friends open it in the same language
  const text = `${msg} 👉 ${url}`;
  const copied = t('copied');
  const touch = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);   // PC: copying the link beats the Windows share dialog
  // counted only once it went through (an app was picked, or the text was copied); closing the share sheet is not a share
  const sent = method => track('share', { method, screen: ['start', 'quiz', 'result'].find(s => !$(s).hidden) || 'other' });
  if (STANDALONE && navigator.share && !IN_APP && touch) {   // the phone's own share sheet (KakaoTalk, Instagram DM, messages…)
    navigator.share({ title: t('docTitle'), text: msg, url })
      .then(() => sent('share_sheet'), e => { if (!e || e.name !== 'AbortError') copyText(text, copied, sent); });
    return;
  }
  copyText(text, copied, sent);
}

/* ===================== result image ===================== */
// Inside claude.ai the viewer's own save prompt handles the file; anywhere else we show the image to long-press.
// (claude.ai 안에서만 쓰던 저장 창은 웹진에 없다)
const downloads = null;
const waitDownloads = () => Promise.resolve();

let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}
function placeName(key) { return R(key).place; }   // hoisted: renderResult may run before this line
function koPlace(key) { return RESULTS[key].region.replace(' 주민', ''); }   // analytics stay in Korean whatever the language
// After the image is saved: go on to the neighbourhood's spots page in the webzine (when it exists).
// wait: only as long as the save needs (0 after the iPhone share sheet; a moment after a download starts,
// because leaving the page too early cancels a download that has not begun).
function afterSaved(key, wait = 0) {
  const url = PLACE_PAGES[key];
  if (!url) { toast(t('soon'), 4200); return; }
  if (STANDALONE) { toast(t('moving', placeName(key))); setTimeout(() => location.assign(url), wait); }
  else toast(t('savedWebzine', placeName(key)), 4200);
}
let pendingKey = null;
const toDataURL = blob => new Promise((ok, bad) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = bad; f.readAsDataURL(blob); });
function closeSheet() {
  $('sheet').hidden = true;
  pendingKey = null;   // × just closes; only the orange button moves on
}
function sheetGo() {
  const k = pendingKey;
  closeSheet();
  if (k) afterSaved(k);
}
function showCapture(dataUrl, key) {
  pendingKey = key || null;
  if (key) saved(key, 'capture_screen');   // in-app browsers: the image is shown to screenshot
  $('sheetnext').textContent = key ? t('sheetGo', placeName(key)) : t('close');
  $('sheetimg').src = dataUrl; $('sheet').hidden = false;
}
async function showCaptureOf(blob, key) { showCapture(await toDataURL(blob), key); }

// In-app browsers (KakaoTalk, Instagram, Facebook, Naver, Line…) block saving files, so they get the capture screen.
const IN_APP = /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|NAVER\(inapp|Line\/|DaumApps|everytimeApp|BAND\/|MicroMessenger|Weibo/i.test(navigator.userAgent || '');
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const imgCache = {};
const cacheKey = key => LANG + ':' + key;   // one image per language
function prepareImage(key) {
  const ck = cacheKey(key);
  if (!imgCache[ck]) {
    const c = { blob: null };
    // keep a data: URL too: unlike a blob: URL it survives leaving the page, so the download is not cancelled
    c.promise = drawResultImage(key).then(async b => { c.blob = b; c.dataUrl = await toDataURL(b); return b; });
    c.promise.catch(() => { delete imgCache[ck]; });
    imgCache[ck] = c;
  }
  return imgCache[ck];
}
// Standalone site: iPhone -> share sheet ('이미지 저장' puts it in Photos); Android / PC -> ordinary download.
function nativeSave(blob, name, key) {
  let file = null;
  try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { /* very old browsers */ }
  if (IS_IOS && file && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] }).then(() => { saved(key, 'ios_share'); afterSaved(key); }, e => {
      if (e && e.name === 'AbortError') afterSaved(key);   // closed the share sheet without saving: still go on
      else showCaptureOf(blob, key);
    });
    return;
  }
  const c = imgCache[cacheKey(key)], data = c && c.dataUrl;
  const url = data || URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  saved(key, 'download');
  if (!data) setTimeout(() => URL.revokeObjectURL(url), 5000);
  afterSaved(key, data ? 400 : 1200);
}

// Save straight away where the viewer can; where saving is blocked (e.g. inside KakaoTalk or Instagram),
// show the image alone on screen so it can be captured.
async function saveImage(btn) {
  const key = btn.dataset.key, label = btn.querySelector('.lbl') || btn.querySelector('span'), old = label.textContent;
  const name = t('file', R(key));
  const c = prepareImage(key);
  if (STANDALONE) {
    if (c.blob) { if (IN_APP) showCaptureOf(c.blob, key); else nativeSave(c.blob, name, key); return; }   // no await: keeps the tap's permission
    btn.disabled = true; label.textContent = t('making');
    try { const blob = await c.promise; if (IN_APP) showCaptureOf(blob, key); else nativeSave(blob, name, key); }
    catch (e) { toast(t('makeFail')); }
    finally { btn.disabled = false; label.textContent = old; }
    return;
  }
  btn.disabled = true; label.textContent = t('making');
  try {
    const [blob] = await Promise.all([c.promise, waitDownloads()]);
    if (downloads) {
      try {
        const res = await downloads.save({ filename: name, data: blob });
        if (res && res.status === 'saved') { afterSaved(key); return; }
      } catch (e) {
        const code = e && e.code;
        if (code === 'declined') return;
        if (code === 'rate_limited') { toast(t('saveOpen')); return; }
      }
    }
    showCapture(await toDataURL(blob), key);
  } catch (e) {
    toast(t('makeFail'));
  } finally { btn.disabled = false; label.textContent = old; }
}

const loadImg = src => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function torn(g, x, y, w, h, seedStr) {
  let seed = [...seedStr].reduce((a, c) => a + c.charCodeAt(0), 11);
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const pts = [];
  const edge = (x0, y0, x1, y1, ix, iy) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 16));
    for (let i = 0; i < n; i++) {
      const t = i / n, j = rnd() * 8 + (rnd() < .07 ? rnd() * 8 : 0);
      pts.push([x0 + (x1 - x0) * t + ix * j, y0 + (y1 - y0) * t + iy * j]);
    }
  };
  edge(x, y, x + w, y, 0, 1); edge(x + w, y, x + w, y + h, -1, 0); edge(x + w, y + h, x, y + h, 0, -1); edge(x, y + h, x, y, 1, 0);
  g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
}
// shrink the font until the text fits maxW, then draw it
function fit(g, text, x, y, maxW, size, pattern) {
  let s = size; g.font = pattern.replace('{s}', s);
  while (g.measureText(text).width > maxW && s > 12) { s -= 2; g.font = pattern.replace('{s}', s); }
  g.fillText(text, x, y);
}
// Pieces a line may break between: Korean and English break at spaces; Japanese and Chinese have none, so they go by words
// (or single characters on old browsers). Closing punctuation (、。！」…) never starts a line.
const GLUE = /^[、。，．！？!?）」』〜～…ー・,.：；”]/;
const spaced = () => !['ja', 'zh'].includes(LANG);
function tokens(text) {
  if (spaced()) return text.split(/(\s+)/).filter(Boolean);
  try { return [...new Intl.Segmenter(LANG, { granularity: 'word' }).segment(text)].map(x => x.segment); }
  catch (e) { return [...text]; }
}
function wrapWords(g, text, maxW) {
  const lines = []; let line = '';
  for (const w of tokens(text)) {
    const next = line + w;
    if (g.measureText(next).width <= maxW || !line.trim() || GLUE.test(w)) line = next;
    else { lines.push(line.trimEnd()); line = w.trimStart(); }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

async function drawResultImage(key) {
  const r = R(key), [DISP, BODY, HAND, TALK] = CANVAS_FONTS[LANG] || CANVAS_FONTS.ko;
  const title = t('docTitle'), talk = r.talk.split('<br>'), line = t('quote', r.line.replace(/<br>/g, spaced() ? ' ' : ''));
  // web fonts arrive in pieces by character range, so ask for exactly the characters this image uses
  const used = [title, r.type, r.region, r.area, line, ...talk, t('secStats'), t('secKw'), ...t('stats'), ...r.kw,
    t('tip'), r.tip.replace(/<\/?b>/g, ''), t('imgFooter'), '· ABC'].join(' ');
  await Promise.all([`400 60px ${DISP}`, `400 40px ${TALK}`, `400 50px ${HAND}`, `500 30px ${BODY}`, `700 30px ${BODY}`]
    .map(f => document.fonts.load(f, used).catch(() => null)));
  const [logo, pose] = await Promise.all([loadImg(IMG + 'logo.webp'), loadImg(`${IMG}${r.pose}.webp`)]);
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');

  // sky, corner, logo, title
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2E93D1'); sky.addColorStop(.42, '#6FB4E6'); sky.addColorStop(1, '#CFE3F3');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(330, 0); g.lineTo(0, 330); g.fill();
  g.drawImage(logo, 34, 30, 96, 96 * logo.height / logo.width);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `400 50px ${DISP}`;
  for (let s = 48; g.measureText(title).width > 800 && s > 30; s -= 2) g.font = `400 ${s}px ${DISP}`;
  g.fillStyle = 'rgba(38,104,185,.55)'; g.fillText(title, W / 2 + 40, 122);
  g.fillStyle = '#fff'; g.fillText(title, W / 2 + 40, 118);

  // torn paper card
  const CX = 64, CY = 170, CW = W - 128, CH = 1095;
  g.save(); g.shadowColor = 'rgba(6,42,85,.3)'; g.shadowBlur = 26; g.shadowOffsetY = 10;
  torn(g, CX, CY, CW, CH, key); g.fillStyle = '#fff'; g.fill(); g.restore();

  // type pill, region, area, one-liner
  g.font = `700 32px ${BODY}`;
  const pw = g.measureText(r.type).width + 64;
  rr(g, W / 2 - pw / 2, 226, pw, 60, 30); g.fillStyle = '#4085E0'; g.fill();
  g.fillStyle = '#fff'; g.fillText(r.type, W / 2, 268);
  g.fillStyle = '#FD7925'; fit(g, r.region, W / 2, 392, 860, 96, `400 {s}px ${DISP}`);
  g.fillStyle = '#5B7FAE'; fit(g, r.area, W / 2, 442, 880, 28, `700 {s}px ${BODY}`);
  g.fillStyle = '#2668B9'; fit(g, line, W / 2, 512, 860, 52, `400 {s}px ${HAND}`);

  // hareubang + bubble
  const ph = 220, pw2 = pose.width * ph / pose.height, hx = 160, hy = 546;
  g.drawImage(pose, hx, hy, pw2, ph);
  g.font = `400 36px ${TALK}`;
  // Korean and English re-wrap the talk to fit; Japanese and Chinese keep their written line breaks (wrapping only a line that is still too long)
  const tl = (spaced() ? [talk.join(' ')] : talk).flatMap(x => wrapWords(g, x, 470)), lh = 48;
  const bw = Math.max(...tl.map(l => g.measureText(l).width)) + 64, bh = tl.length * lh + 40;
  const bx = hx + pw2 + 34, by = hy + ph * .42 - bh / 2;
  rr(g, bx, by, bw, bh, 30); g.fillStyle = '#EEF5FD'; g.fill();
  g.beginPath(); g.moveTo(bx - 22, by + bh / 2); g.lineTo(bx + 2, by + bh / 2 - 13); g.lineTo(bx + 2, by + bh / 2 + 13); g.closePath(); g.fill();
  g.fillStyle = '#2668B9'; g.textAlign = 'left';
  tl.forEach((l, i) => g.fillText(l, bx + 32, by + 20 + lh * (i + 1) - 12));

  // two columns: meters + keywords
  const head = (text, x, y, maxW) => {
    g.fillStyle = '#FD7925'; g.beginPath(); g.arc(x + 8, y - 10, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2668B9'; fit(g, text, x + 26, y, maxW, 30, `700 {s}px ${BODY}`);
  };
  const HEAD_Y = 822, ROW_Y = 876, ROW = 48;
  head(t('secStats'), 124, HEAD_Y, 350);
  t('stats').forEach((l, i) => {
    const y = ROW_Y + i * ROW;
    g.fillStyle = '#5B7FAE'; fit(g, l, 124, y, 140, 27, `500 {s}px ${BODY}`);
    for (let n = 0; n < 5; n++) {
      g.beginPath(); g.arc(288 + n * 38, y - 9, 14, 0, Math.PI * 2);
      g.fillStyle = n < r.stats[i] ? '#FD7925' : '#E3ECF7'; g.fill();
    }
  });
  head(t('secKw'), 520, HEAD_Y, 400);
  r.kw.forEach((k, i) => {
    const y = ROW_Y + i * ROW;
    g.strokeStyle = '#FD7925'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(522, y - 12); g.lineTo(530, y - 4); g.lineTo(545, y - 22); g.stroke();
    g.fillStyle = '#2668B9'; fit(g, k, 558, y, 430, 27, `500 {s}px ${BODY}`);
  });

  // tip box, with the <b> parts in orange
  const runs = [{ t: t('tip') + ' · ', b: true }].concat(
    r.tip.split(/(<b>.*?<\/b>)/).filter(Boolean).map(t => ({ t: t.replace(/<\/?b>/g, ''), b: /^<b>/.test(t) })));
  const TX = 128, TW = W - 256;
  const words = [];
  runs.forEach(rn => tokens(rn.t).forEach(w => words.push({ w, b: rn.b })));
  const layout = TS => {
    const lines = [[]]; let lw = 0;
    words.forEach(o => {
      g.font = `${o.b ? 700 : 500} ${TS}px ${BODY}`;
      const w = g.measureText(o.w).width, cur = lines[lines.length - 1];
      if (lw + w > TW - 44 && cur.length && o.w.trim() && !GLUE.test(o.w)) { lines.push([]); lw = 0; }
      if (!lines[lines.length - 1].length && !o.w.trim()) return;
      lines[lines.length - 1].push({ ...o, width: w }); lw += w;
    });
    return lines;
  };
  // a tip that runs past two lines (longer languages) is set smaller so the box stays inside the card
  let TS = 27, lines = layout(TS);
  while (lines.length > 2 && TS > 23) lines = layout(TS -= 2);
  const TL = Math.round(TS * 1.48);
  const tipH = lines.length * TL + 34, tipY = ROW_Y + 4 * ROW + 40;
  rr(g, TX, tipY, TW, tipH, 20); g.fillStyle = '#FFF5CC'; g.fill();
  lines.forEach((ln, i) => {
    let x = TX + 22;
    ln.forEach(o => {
      g.font = `${o.b ? 700 : 500} ${TS}px ${BODY}`; g.fillStyle = o.b ? '#FD7925' : '#5A4A10';
      g.fillText(o.w, x, tipY + 17 + TL * (i + 1) - 10); x += o.width;
    });
  });

  g.textAlign = 'center'; g.fillStyle = '#2668B9'; g.font = `700 26px ${BODY}`;
  g.fillText(t('imgFooter'), W / 2, H - 34);
  return new Promise((ok, bad) => c.toBlob(b => (b ? ok(b) : bad(new Error('toBlob'))), 'image/png'));
}


applyStatic();
// a shared link like …#pyoseon opens that result directly
const start = location.hash.slice(1);
if (RESULTS[start]) renderResult(start, false); else show('start');
document.fonts && document.fonts.ready.then(() => { vtRoot.querySelectorAll('.paper').forEach(tear); fitHeader(); });
// a newly picked language's fonts arrive later: re-fit the one-line rows when they do
document.fonts && document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => { fitHeader(); if (!$('result').hidden) fitChips(); });
})();
/* ===== 마을 테스트 블록 끝 ===== */

/* ---------- 언어 버튼으로 들어온 기사 등: 보던 자리로 바로 (맨 위 '언어를 바꿔도 보던 자리에서', 2026-10-28) ----------
   서브메인은 첫 화면 블록이 먼저 처리한다. 페이지 스크립트가 다 돈 뒤(동네 접기 등)에 자리를 잰다 */
(function () {
  'use strict';
  var rec = wzPlace.take();
  if (!rec) return;
  var root = document.documentElement;
  root.style.scrollBehavior = 'auto';   // html의 부드러운 스크롤 대신 바로 옮긴다
  wzPlace.follow(function () {
    var y = wzPlace.y(rec);
    try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (err) { window.scrollTo(0, y); }
  });
  window.addEventListener('load', function () { window.setTimeout(function () { root.style.scrollBehavior = ''; }, 600); });
})();
