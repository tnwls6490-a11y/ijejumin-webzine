/* 이제주민 · site.js (모든 페이지 공용) */
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
    /* 휴대폰: 메뉴가 한 줄에 안 들어가면 들어갈 만큼 글자를 줄인다 (양옆 여백은 그대로 두고 글자 폭만 계산) */
    function fitNav() {
      if (!nav) return;
      nav.style.removeProperty('--nav-fit');
      if (!narrowQuery || !narrowQuery.matches) return;
      var links = nav.children, text = 0, pad = 0;
      for (var i = 0; i < links.length; i++) {
        var cs = getComputedStyle(links[i]);
        var p = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        pad += p;
        text += links[i].offsetWidth - p;
      }
      var room = nav.clientWidth - pad - (parseFloat(getComputedStyle(nav).columnGap) || 0) * (links.length - 1);
      if (text > room) nav.style.setProperty('--nav-fit', (room / text * 0.98).toFixed(3));
    }
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
       1) 높이 고정: 카카오톡 같은 앱 안 브라우저는 스크롤할 때 위아래 막대가 나왔다 들어가며 화면 높이가 바뀐다.
          그때마다 무대가 줄었다 늘면 글자가 겹치니, 지금까지 본 가장 낮은 높이로 무대를 고정한다 (폭이 바뀌면 다시 잰다)
       2) 아래 이름 버튼이 몇 줄로 놓였는지(글자 크기에 따라 달라짐) 재서, 그만큼 위 글자·버튼을 띄운다
       3) 그래도 제목과 설명이 겹치면(낮은 화면, 휴대폰 글자 크기 설정) 이름 버튼을 숨기고 번호를 줄인다(is-tight).
          그래도 겹치면 제목을 줄인다(is-tighter). 넘기기는 좌우 화살표로 한다 */
    var chipsBox = section.querySelector('.people__chips');
    var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
    var lockW = 0, lockH = 0;
    function setChipsH() {
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
      stage.classList.remove('is-tight', 'is-tighter');
      if (!narrowQuery || !narrowQuery.matches) {
        section.style.removeProperty('--people-vh');
        section.style.removeProperty('--chips-h');
        lockW = 0;
        return;
      }
      var w = window.innerWidth, h = window.innerHeight;
      if (w !== lockW) { lockW = w; lockH = h; } else lockH = Math.min(lockH, h);
      section.style.setProperty('--people-vh', lockH + 'px');
      setChipsH();
      if (!crowded()) return;
      stage.classList.add('is-tight');
      setChipsH();
      if (crowded()) stage.classList.add('is-tighter');
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
    var world = section.querySelector('.pick__world');
    var finalCard = section.querySelector('.pick__final');
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

    function target() {
      var r = section.getBoundingClientRect();
      var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 0;
      var pad = parseFloat(getComputedStyle(section).paddingTop) || 0;   // 인터뷰 화면과의 여백
      var len = section.offsetHeight - pad - stage.offsetHeight - 200;   // 마지막 200px은 다 모인 카드에 머문다
      return clamp((hdr - r.top - pad) / Math.max(len, 1), 0, 1);
    }
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
      var dropY = (.09 * sink - .07 * introOut * (1 - flip)) * window.innerHeight - Math.sin(flip * Math.PI) * .04 * window.innerHeight;
      var cw0 = cards[0].offsetWidth || 1;
      var grow = finalCard ? finalCard.offsetWidth / (cw0 * 1.55) : 1;   // 묶음 → 엽서 한 장 크기
      var half = clamp(ang / 90, 0, 1);
      world.style.transform = m > .5 ? 'translateY(' + dropY.toFixed(1) + 'px) rotateY(' + Math.min(ang, 90).toFixed(2) + 'deg) scale(' + ((1 + (grow - 1) * half * .85) * (1 - .1 * sink)).toFixed(3) + ')' : '';
      world.style.opacity = (1 - .35 * sink).toFixed(3);
      world.style.visibility = fin ? 'hidden' : '';
      section.style.setProperty('--fin', fin);
      section.style.setProperty('--fy', dropY.toFixed(1) + 'px');
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
      var R = clamp(W * .36, cw * 1.8, 580);       // 반지름이 클수록 좌우로 카드 사이가 넓어진다
      var span = Math.max(H * 1.4, cw * 7);                 // 나선의 높이 (화면 위아래로 살짝 넘친다)
      /* 나선의 축은 똑바로 세운다 (기울이지 않음) */
      var tx = 0, tz = 0;
      var cx = Math.cos(tx), sx = Math.sin(tx), cz = Math.cos(tz), sz = Math.sin(tz);
      for (var i = 0; i < n; i++) {
        var it = items[i];
        var ang = it.a + spin;
        var x = Math.sin(ang) * R, z = Math.cos(ang) * R;
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
        var X = x2 * k + fanX, Y = y2 * k + fanY, Z = (z1 - R * .35) * k - i * .5 * m;
        var deg = ((ang * 180 / Math.PI) % 360 + 540) % 360 - 180;   // 바깥을 향한 각도 (-180~180)
        it.el.style.transform = 'translate3d(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px,' + Z.toFixed(1) + 'px) rotateZ(' + (tz * 180 / Math.PI).toFixed(2) + 'deg) rotateX(' + (tx * 180 / Math.PI).toFixed(2) + 'deg) rotateY(' + (deg * k).toFixed(2) + 'deg) rotateZ(' + fanR.toFixed(2) + 'deg) scale(' + (1 + .55 * m).toFixed(3) + ')';
        it.el.style.opacity = (edge + (1 - edge) * m).toFixed(3);
        it.el.style.setProperty('--shade', ((1 - Math.cos(ang)) / 2 * .42 * k).toFixed(3));
        var back = it.note && Math.abs(deg * k) > 90;        // 뒤돌아 있는 흰 카드는 글자를 숨긴다
        if (back !== it.back) { it.el.classList.toggle('is-back', back); it.back = back; }
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
    var popInner = pop.querySelector('.pick-pop__inner');
    var opener = null;
    world.addEventListener('click', function (e) {
      var card = e.target.closest('.pcard');
      if (!card) return;
      if (dragged) { dragged = false; return; }               // 돌리려고 끈 것은 누른 것으로 치지 않는다
      opener = card;
      var type = (card.className.match(/pcard--([a-z]+)/) || [])[1] || '';
      popCard.className = 'pick-pop__card ' + (type === 'note' ? 'is-note' : 'pcard pcard--' + type);
      var name = card.getAttribute('data-name');
      popTitle.textContent = '한마디 ' + card.getAttribute('data-no') + (name && name !== '한마디' ? ' · ' + name : '');
      isOpen = true;
      pop.showModal();
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
      resetBtn.textContent = undo ? '되돌리기' : '기록 지우기';
    }
    function syncExpand() {
      var someClosed = Array.prototype.some.call(groups, function (g) { return !g.open; });
      expandBtn.textContent = someClosed ? '모두 펼치기' : '모두 접기';
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
    shade.setAttribute('aria-label', open ? '창문 가리개 닫기' : '창문 가리개 열기');
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

  /* 스크롤 → 창 속으로 빨려 들어가기
     짧은 스크롤(휠 2~3번)로 목표 진행도가 정해지고, 화면은 그 목표를 부드럽게 따라가며
     약 2초 동안 창 → 구름 → 제주로 이어서 빨려 들어간다. 위로 스크롤하면 거꾸로 돌아간다 */
  var shownP = 0, lastTs = null;
  function targetP() {
    var rect = intro.getBoundingClientRect();
    /* 도착 뒤 350px은 제주 화면에 머무는 구간이라 진행도에서 뺀다 */
    var span = rect.height - stage.offsetHeight - 350 - window.innerHeight;
    /* 상단 바·헤더를 지나는 스크롤부터 진행도에 넣는다 (페이지 맨 위 = 0) */
    var startTop = rect.top + window.scrollY;
    var total = span + startTop;
    return total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;
  }
  function update(ts) {
    ticking = false;
    var target = targetP();
    var dt = (ts && lastTs !== null) ? clamp((ts - lastTs) / 1000, 0, 0.1) : 1 / 60;
    lastTs = ts || null;
    if (reduced()) shownP = target;
    else shownP += (target - shownP) * (1 - Math.exp(-dt / 0.7));
    if (Math.abs(target - shownP) < 0.0008) { shownP = target; lastTs = null; }
    else requestUpdate();
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

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () { measure(); requestUpdate(); });
  if (reduceQuery && reduceQuery.addEventListener) reduceQuery.addEventListener('change', requestUpdate);
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
    var state = d && d.event === "onStateChange" ? d.info : d && d.info && d.info.playerState;
    if (typeof state !== "number") return;
    document.querySelectorAll(".video-card.is-playing iframe").forEach(function (f) {
      if (f.contentWindow === e.source) f.ytState = state;
    });
  });

  /* 9. 영상 카드: 누르면 그 자리에서 바로 재생 (스크립트가 없거나 재생이 안 되면 YouTube로 이동) */
  document.querySelectorAll(".video-card[data-video-id]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var cap = card.querySelector(".video-card-cap");
      var title = cap ? cap.textContent.replace(/\s*·\s*YouTube에서 보기\s*$/, "") : "";
      var box = document.createElement("div");
      box.className = card.className + " is-playing";
      if (card.id) box.id = card.id;
      var thumb = document.createElement("div");
      thumb.className = "video-card-thumb";
      var frame = document.createElement("iframe");
      frame.src = YT_ORIGIN + "/embed/" + encodeURIComponent(card.getAttribute("data-video-id")) + "?autoplay=1&rel=0&enablejsapi=1" +
        (/^https?:$/.test(location.protocol) ? "&origin=" + encodeURIComponent(location.origin) : "");
      frame.addEventListener("load", function () { ytSend(frame, { event: "listening", id: 1, channel: "widget" }); });
      frame.title = title || "인터뷰 영상";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      thumb.appendChild(frame);
      var link = document.createElement("a");
      link.className = "video-card-cap";
      link.href = card.href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = cap ? cap.textContent : "YouTube에서 보기";
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
      frame.focus();
      if (pip) {
        var pipClose = document.createElement("button");
        pipClose.type = "button";
        pipClose.className = "video-pip-close";
        pipClose.setAttribute("aria-label", "작은 영상 닫기");
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
          pipExpand.setAttribute("aria-label", on ? "작은 창으로 줄이기" : "영상 크게 보기");
        };
        setLarge(false);
        pipExpand.addEventListener("click", function () { setLarge(!box.classList.contains("is-pip-large")); });
        stage.addEventListener("click", function (e) { if (e.target === stage) setLarge(false); });
        var onKey = function (e) {
          if (e.key === "Escape" && box.classList.contains("is-pip-large")) setLarge(false);
        };
        document.addEventListener("keydown", onKey);
        var io = new IntersectionObserver(function (entries) {
          var away = !entries[0].isIntersecting;
          box.classList.toggle("is-pip", away);
          if (!away) setLarge(false);
        }, { threshold: 0.1 });
        io.observe(stage);
        pipClose.addEventListener("click", function () {
          io.disconnect();
          document.removeEventListener("keydown", onKey);
          box.classList.remove("is-pip", "is-pip-large");
          box.replaceWith(card);
        });
      }
    });
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
      modal.setAttribute("aria-label", "쇼츠 재생");
      modal.hidden = true;
      var box = document.createElement("div");
      box.className = "video-modal-box";
      closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "video-modal-close";
      closeBtn.setAttribute("aria-label", "영상 닫기");
      closeBtn.textContent = "✕";
      frameBox = document.createElement("div");
      frameBox.className = "video-modal-frame";
      link = document.createElement("a");
      link.className = "video-modal-link";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "YouTube에서 보기";
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
      frame.title = "이제주민 쇼츠";
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
        link.textContent = "인터뷰 원문 보러 가기";
      } else {
        link.href = card.href;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "YouTube에서 보기";
      }
      lastCard = card;
      /* 재생 중인 본문 영상(작은 창 포함)은 잠시 멈추고, 쇼츠 창을 닫으면 이어서 재생 */
      pausedFrames = [];
      document.querySelectorAll(".video-card.is-pip-large").forEach(function (b) {
        var small = b.querySelector(".video-pip-expand");
        if (small) small.click();
      });
      document.querySelectorAll(".video-card.is-playing iframe").forEach(function (f) {
        if (f.ytState === 1 || f.ytState === 3 || f.ytState === undefined) { ytCommand(f, "pauseVideo"); pausedFrames.push(f); }
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
