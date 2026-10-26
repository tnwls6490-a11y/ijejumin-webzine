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
        if (text > room) nav.style.setProperty('--nav-fit', Math.max(NAV_MIN_FIT, room / text * 0.98).toFixed(3));
      }
      navMore();
    }
    if (nav) nav.addEventListener('scroll', navMore, { passive: true });
    function setH() { fitNav(); document.documentElement.style.setProperty('--hdr-h', header.offsetHeight + 'px'); }
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
      var dim = prev ? prev.querySelector('.under-dim') : null;
      return { el: el, dimHost: dim ? dim.parentNode : null };
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
        if (items[i].dimHost) items[i].dimHost.style.setProperty('--under', e.toFixed(3));
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

    function target() {
      var r = section.getBoundingClientRect();
      var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 0;
      var cs = getComputedStyle(section);
      var pad = parseFloat(cs.paddingTop) || 0;      // 인터뷰 화면과의 여백
      var tail = parseFloat(cs.paddingBottom) || 0;  // 무대가 끝난 뒤 이어지는 검정
      var len = section.offsetHeight - pad - tail - stage.offsetHeight - 200;   // 마지막 200px은 다 모인 카드에 머문다
      return clamp((hdr - r.top - pad) / Math.max(len, 1), 0, 1);
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
    function frame(ts) {
      window.requestAnimationFrame(frame);
      if (!visible) { last = null; return; }
      var dt = last === null ? 1 / 60 : clamp((ts - last) / 1000, 0, .1);
      last = ts;
      var t = target();
      shown = reduce ? t : shown + (t - shown) * (1 - Math.exp(-dt / .6));   // 스크롤을 천천히 따라온다
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
      world.style.opacity = (1 - .35 * sink).toFixed(3);
      world.style.visibility = fin ? 'hidden' : '';
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

    /* 처음 그릴 때는 동네 10곳이 다 펼쳐져 있다가 여기서 하나만 남는다. 그래서 메인 카드로 #checklist·#policy에 들어오면
       브라우저가 먼저 내려간 자리가 어긋난다. 동네를 정리한 뒤 그 자리로 다시 맞춘다 (다 불러온 뒤 한 번 더, 그사이 직접 스크롤하면 그만둔다) */
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
    var resetBtn = section.querySelector('[data-check-reset]');
    var state = load();
    var undo = null;   // 지운 바로 뒤에는 '되돌리기'로 바뀐다

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
      resetBtn.textContent = undo ? wzT('되돌리기', 'Undo', '元に戻す') : wzT('기록 지우기', 'Clear all', '記録を消す');
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
      undo = null;
      save();
      render();
    });
    resetBtn.addEventListener('click', function () {
      if (undo) { state = undo; undo = null; }
      else if (Object.keys(state).length) { undo = state; state = {}; }
      else return;
      save();
      render();
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

  shade.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    drag = { y: e.clientY, start: isOpen ? 1 : 0, value: isOpen ? 1 : 0, moved: false };
    if (shade.setPointerCapture) shade.setPointerCapture(e.pointerId);
  });

  shade.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 6) return;
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
    if (suppressClick) { suppressClick = false; return; }
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
  function update(ts) {
    ticking = false;
    var target = targetP();
    var now = ts || performance.now();
    if (reduced()) { shownP = target; run = null; }
    else if (shownP !== target && (!run || run.to !== target)) {
      run = { from: shownP, to: target, start: now, dur: RUN_MS * Math.abs(target - shownP) + 1 };
    }
    if (run) {
      var k = clamp((now - run.start) / run.dur, 0, 1);
      shownP = run.from + (run.to - run.from) * easeInOut(k);
      if (k >= 1) { shownP = run.to; if (run.to === 1) restY = window.scrollY; run = null; holding = false; }   // 제주 화면에 도착한 자리를 기억한다 (아래 '인터뷰 화면 한 번에')
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

  /* 첫 화면(비행기 창 → 제주)을 보는 동안은 헤더를 위로 숨긴다.
     다음 화면(인터뷰)이 아래에서 올라와 헤더 자리에 닿기 직전(헤더 높이만큼 남았을 때)부터
     스크롤에 맞춰 헤더가 내려온다. 그래서 헤더가 제주 사진 위에 오래 겹치지 않는다 */
  var root = document.documentElement;
  var after = intro.nextElementSibling;
  function syncHeader() {
    var hh = parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 0;
    var top = after ? after.getBoundingClientRect().top : intro.getBoundingClientRect().bottom;
    root.style.setProperty('--hdr-hide', clamp(top - hh, 0, hh).toFixed(1) + 'px');
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

  /* 2. 타이핑 문장: 화면에 들어오면 한 글자씩 (전체 문장은 처음부터 읽기 도구에 전달) */
  function prepareTyping(el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var ghost = document.createElement("span");
    ghost.className = "typing-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = text;
    var live = document.createElement("span");
    live.className = "typing-live";
    live.setAttribute("aria-hidden", "true");
    el.appendChild(ghost);
    el.appendChild(live);
    el._typingText = text;
  }
  function runTyping(el) {
    var text = el._typingText, live = el.querySelector(".typing-live"), i = 0;
    (function step() {
      i += 1;
      live.textContent = text.slice(0, i);
      if (i < text.length) { setTimeout(step, 70); } else { el.classList.add("is-done"); }
    })();
  }
  var typings = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll(".typing"));
  typings.forEach(prepareTyping);

  /* 3. 스크롤하면 나타나기 + 타이핑 시작 */
  var watched = Array.prototype.slice.call(document.querySelectorAll(".reveal")).concat(typings);
  if ("IntersectionObserver" in window && watched.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains("typing")) { runTyping(el); } else { el.classList.add("is-visible"); }
        io.unobserve(el);
      });
    }, { threshold: 0.3 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(function (el) {
      el.classList.add("is-visible");
      if (el._typingText) { el.querySelector(".typing-live").textContent = el._typingText; el.classList.add("is-done"); }
    });
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
