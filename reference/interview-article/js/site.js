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
})();
