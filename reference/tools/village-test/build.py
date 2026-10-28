# 마을 테스트 아티팩트(index.html) → 웹진 서브페이지로 옮긴다
#   - articles/jeju-village-test.html (공통 머리·헤더·푸터 + 테스트 마크업)
#   - vt.css (style.css 끝에 붙일 블록: 모든 규칙을 .vt 안으로 묶음)
#   - vt.js  (site.js 끝에 붙일 블록: #vt가 있는 페이지에서만 동작)
# 실행: py -I build.py <아티팩트 html> <public 폴더> <출력 폴더>
import sys, re, os
sys.stdout.reconfigure(encoding='utf-8')
SRC, PUB, OUT = sys.argv[1:4]
L = open(SRC, encoding='utf-8').read().split('\n')
IMG = '../images/village-test/'

def rep(s, a, b, count=1):
    n = s.count(a)
    assert n == count, ('바꿀 글이 %d번 있음(기대 %d): %r' % (n, count, a[:80]))
    return s.replace(a, b)

def pose(s):
    return s.replace('poseA_', 'pose-a-').replace('poseB_', 'pose-b-')

RENAME = ['reveal', 'hero', 'progress', 'spots', 'topbar']   # 웹진 클래스와 겹치는 이름 → vt-
def ren_css(s):
    return re.sub(r'\.(%s)\b' % '|'.join(RENAME), lambda m: '.vt-' + m.group(1), s)

# ---------------------------------------------------------------- CSS
css_src = '\n'.join(L[9:279])          # 10~279줄
css_src = re.sub(r'/\*.*?\*/', '', css_src, flags=re.S)   # 영어 주석은 빼고, 블록 머리에 한국어 설명을 단다

def split_top(text):
    """맨 바깥 규칙들로 나눈다: (머리, 몸) 목록"""
    out, i, n = [], 0, len(text)
    while i < n:
        j = text.find('{', i)
        if j < 0: break
        head = text[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            if text[k] == '{': depth += 1
            elif text[k] == '}': depth -= 1
            elif text[k] == '"':            # 따옴표 안(data: SVG)의 중괄호는 세지 않는다
                k = text.index('"', k + 1)
            k += 1
        out.append((head, text[j + 1:k - 1]))
        i = k
    return out

def scope_sel(sel):
    parts = []
    for p in [x.strip() for x in sel.split(',')]:
        if p.startswith(':root'):
            p = '.vt' + p[5:]
            p = re.sub(r'^(\.vt(?:\[[^\]]+\]|:lang\([^)]+\))*) body$', r'\1', p)
            parts.append(p)
        elif p == 'body':
            parts.append('.vt')
        elif p == 'body::after':
            parts.append('.vt::after')
        else:
            parts.append('.vt ' + p)
    return ren_css(', '.join(parts))

def fmt_body(b):
    b = ' '.join(x.strip() for x in b.strip().split('\n'))
    return b

rules = []
for head, body in split_top(css_src):
    if head in ('*, *::before, *::after', 'html, body'):
        continue                                   # 아래에서 .vt 안으로 따로 넣는다
    if head.startswith('@keyframes'):
        name = head.split()[1]
        rules.append('@keyframes vt-%s {%s}' % (name, fmt_body(body)))
        continue
    if head.startswith('@media'):
        if 'prefers-reduced-motion' in head:
            rules.append('@media (prefers-reduced-motion: reduce) { .vt *, .vt *::before, .vt *::after { animation: none !important; transition: none !important; } }')
            continue
        raise SystemExit('모르는 @media: ' + head)
    rules.append('%s { %s }' % (scope_sel(head), fmt_body(body)))
css = '\n'.join(rules)

# 웹진 안에 들어가며 바뀌는 것
css = rep(css, '.vt { --sky-top:', '.vt { position: relative; overflow: hidden; --sky-top:')
css = rep(css, 'linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 40%, var(--sky-low) 100%) fixed;',
               'linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 40%, var(--sky-low) 100%);')
css = rep(css, "content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 50;", "content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2;")
css = rep(css, '.vt .bgphoto { position: fixed; inset: 0; z-index: -1; background: var(--sky-mid) url("img/bg.jpg")',
               '.vt .bgphoto { position: absolute; inset: 0; z-index: 0; background: var(--sky-mid) url(../images/find-test-bg.jpg)')
css = rep(css, '.vt .app { position: relative; max-width: 460px; margin: 0 auto; min-height: 100%;',
               '.vt .app { position: relative; z-index: 1; max-width: 460px; margin: 0 auto; min-height: calc(100vh - var(--hdr-h, 0px)); min-height: calc(100svh - var(--hdr-h, 0px));')
css = rep(css, '.vt .app.fit { height: 100%;', '.vt .app.fit { height: calc(100vh - var(--hdr-h, 0px)); height: calc(100svh - var(--hdr-h, 0px));')
css = rep(css, 'animation: hop ', 'animation: vt-hop ')
css = rep(css, 'animation: rise ', 'animation: vt-rise ')
css = rep(css, '.vt .toast { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 60;',
               '.vt .toast { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 1000;')
css = rep(css, '.vt .sheet { position: fixed; inset: 0; z-index: 70;', '.vt .sheet { position: fixed; inset: 0; z-index: 1001;')

HEAD_CSS = '''/* =========================================================
   나는 제주 어디 주민? (마을 테스트, articles/jeju-village-test.html)
   사용자가 만든 테스트 아티팩트(claude.ai/artifact/Qhchi6VWQa5d3jBMB8tCCt)를 웹진 안으로 옮김 (사용자 요청 2026-10-27)
   - 모든 규칙을 .vt 안으로 묶었다. 웹진 클래스와 이름이 겹치는 다섯 개(reveal·hero·progress·spots·topbar)는 vt-를 붙였다
   - 아티팩트는 화면 전체(body)를 썼다 → 헤더 아래 칸(.vt)을 쓴다. 첫 화면·질문 화면은 헤더를 뺀 화면 높이에 꼭 맞춘다(--hdr-h)
   - 저장 화면·안내(.sheet·.toast)는 헤더(z-index 50)보다 위
   - 글꼴: Bagel Fat One·Jua·Nanum Pen Script(SIL OFL 1.1)는 테스트에 쓰는 글자만 Google Fonts에서 받아 css/fonts/에,
     G마켓 산스(Gmarket Sans, 무료 글꼴)는 아티팩트에 들어 있던 것을 꺼내 css/fonts/에 둔다. 이 페이지에서만 내려받는다
   - 영어·일본어·중국어 화면은 아티팩트가 Google Fonts에서 따로 불러오던 글꼴 대신 기기 글꼴로 보인다
   ========================================================= */
@font-face { font-family: "Gmarket"; font-weight: 500; font-display: swap; src: url(fonts/vt-gmarket-500.woff) format("woff"); }
@font-face { font-family: "Gmarket"; font-weight: 700; font-display: swap; src: url(fonts/vt-gmarket-700.woff) format("woff"); }
@font-face { font-family: "Bagel Fat One"; font-weight: 400; font-display: swap; src: url(fonts/vt-bagel-fat-one.woff2) format("woff2"); }
@font-face { font-family: "Jua"; font-weight: 400; font-display: swap; src: url(fonts/vt-jua.woff2) format("woff2"); }
@font-face { font-family: "Nanum Pen Script"; font-weight: 400; font-display: swap; src: url(fonts/vt-nanum-pen.woff2) format("woff2"); }
.vt, .vt *, .vt *::before, .vt *::after { box-sizing: border-box; }
.vt img { max-width: 100%; }
.vt [hidden]:not([hidden=until-found i]) { display: none !important; }
.vt-sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
'''

TAIL_CSS = '''/* 아티팩트에서 style="…"로 넣던 것 (공통 기준: style 속성 금지) */
.vt .qno-of { font-size: 22px; color: var(--muted); }
.vt .qtext, .vt .rhead, .vt .region, .vt .oneliner, .vt .tip, .vt .stamp, .vt .beta { margin: 0; }
.vt .vt-topbar.is-plain { min-height: 0; }
.vt-noscript { margin: 0; padding: 48px 16px; text-align: center; font-size: 17px; color: #fff; }
/* 공통 기준(누르는 요소 높이 44px 이상, 본문 글자 16px 이상)에 맞춰 아티팩트보다 조금 키운 것 */
.vt .pill { min-height: 44px; }
.vt .back { min-height: 44px; font-size: 16px; white-space: nowrap; }
/* 낮은 화면에서 아티팩트는 줄들을 납작하게 줄여 한 화면에 넣었다. 버튼을 44px로 키우니 줄끼리 겹쳐서,
   줄은 줄어들지 않게 하고 넘치는 만큼은 테스트 칸 안에서 스크롤된다 (카톡 312×520 등) */
.vt .app.fit > .hdr, .vt .app.fit .screen > * { flex-shrink: 0; }
.vt .langmenu button { min-height: 44px; }
.vt #sheet .x { width: 44px; height: 44px; }
.vt .app.fit .opt { min-height: clamp(44px, 6.4cqh, 56px); font-size: clamp(16px, 2.1cqh, 17px); }
.vt .kw li, .vt .day span, .vt .tip, .vt .zine p { font-size: 16px; }
'''
open(os.path.join(OUT, 'vt.css'), 'w', encoding='utf-8').write(HEAD_CSS + css + '\n' + TAIL_CSS)

# ---------------------------------------------------------------- 마크업
mk = '\n'.join(L[281:371])            # 282~371줄 (SVG 아이콘 묶음 ~ 공유 문구 상자)
mk = rep(mk, '<svg width="0" height="0" style="position:absolute" aria-hidden="true">', '<svg class="vt-sprite" width="0" height="0" aria-hidden="true">')
mk = rep(mk, '<main class="app" id="app">', '<div class="app" id="app">')
mk = rep(mk, '</main>', '</div>')
mk = rep(mk, '<header class="hdr">', '<div class="hdr">')
mk = rep(mk, '  </header>', '  </div>')
mk = rep(mk, '<!-- shared header: home + share on every screen -->', '<!-- 테스트 위 줄: 처음 화면·공유·언어 -->')
mk = rep(mk, 'src="img/logo.webp" alt="이제주민"', 'src="%slogo.webp" alt="이제주민" width="261" height="285"' % IMG)
mk = rep(mk, 'src="img/title.webp"', 'src="%stitle.webp"' % IMG)
mk = rep(mk, '<div class="hero">', '<div class="vt-hero">')
mk = rep(mk, '<div class="topbar">', '<div class="vt-topbar">')
mk = rep(mk, '<div class="progress" id="progress">', '<div class="vt-progress" id="progress">')
mk = rep(mk, ' style="width:100%"', '')
mk = pose(mk).replace('src="img/', 'src="' + IMG)
assert 'style=' not in mk and 'img/' not in mk.replace(IMG, '')

fm = open(os.path.join(PUB, 'articles', 'find-my-jeju.html'), encoding='utf-8').read().split('\n')
header = next(l for l in fm if l.startswith('<header class="wz-header">'))   # 줄 번호 대신 내용으로 (머리 줄이 늘어도)
# 헤더 KO·EN·JA는 세 언어 테스트 페이지로 (영어·일본어 페이지는 frames.py가 만든다, 2026-10-28)
header = rep(header, '<a href="./find-my-jeju.html" lang="ko" hreflang="ko" aria-label="한국어" aria-current="true">KO</a><a href="../en/articles/find-my-jeju.html" lang="en" hreflang="en" aria-label="English">EN</a><a href="../ja/articles/find-my-jeju.html" lang="ja" hreflang="ja" aria-label="日本語">JA</a>',
             '<a href="./jeju-village-test.html?lang=ko" lang="ko" hreflang="ko" aria-label="한국어" aria-current="true">KO</a><a href="../en/articles/jeju-village-test.html?lang=en" lang="en" hreflang="en" aria-label="English">EN</a><a href="../ja/articles/jeju-village-test.html?lang=ja" lang="ja" hreflang="ja" aria-label="日本語">JA</a>')
s0 = fm.index('<!-- 푸터 위 안내 (모든 페이지 같음, 경로만 ../) -->')
foot = '\n'.join(fm[s0:])

URL = 'https://lxwebzine.hankyung.com/2026-1/team3/articles/jeju-village-test.html'
DESC = '질문 5개로 찾는, 나에게 맞는 제주 한 달 살기 동네. 제주 동네 10곳 가운데 나와 어울리는 동네와 그 동네에서의 하루를 알려 드려요.'
page = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>나는 제주 어디 주민? 제주 한 달 살기 동네 테스트 | 이제, 주민</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="이제, 주민 · 한경 웹진">
<meta property="og:title" content="나는 제주 어디 주민? 제주 한 달 살기 동네 테스트 | 이제, 주민">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://lxwebzine.hankyung.com/2026-1/team3/images/og-village-test.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<link rel="stylesheet" href="../css/style.css">
</head>
<body>
<!-- Google Tag Manager (noscript): 자바스크립트를 끈 사람용. Google 안내의 style="display:none;visibility:hidden" 대신 hidden 속성 (공통 기준: style 속성 금지) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NR6G6B9M" height="0" width="0" hidden></iframe></noscript>
<div class="topbar"><div class="container"><a href="../../index.html">한경 웹진 메인으로</a></div></div>
{header}

<main>
  <!-- 나는 제주 어디 주민? (마을 테스트): 사용자가 만든 아티팩트를 웹진 안으로 옮김 (2026-10-27).
       질문·결과 글은 아티팩트 그대로. 화면은 js/site.js 맨 뒤 '마을 테스트' 블록이 그린다. 모양은 style.css 맨 뒤 .vt 블록 -->
  <section class="vt" id="vt" aria-labelledby="vt-title">
    <h1 class="sr-only" id="vt-title">나는 제주 어디 주민? 제주 한 달 살기 동네 테스트</h1>
    <noscript><p class="vt-noscript">자바스크립트를 켜야 테스트를 할 수 있어요.</p></noscript>
{mk}
  </section>
</main>

{foot}'''.format(desc=DESC, url=URL, header=header, mk='\n'.join('    ' + x if x.strip() else '' for x in mk.split('\n')), foot=foot)
open(os.path.join(PUB, 'articles', 'jeju-village-test.html'), 'w', encoding='utf-8', newline='\n').write(page)

# ---------------------------------------------------------------- 스크립트
js = '\n'.join(L[373:1383])            # <script> 안 (374~1383줄)
js = pose(js)
js = rep(js, "const STANDALONE = window.top === window && /^https?:$/.test(location.protocol);\nconst SHARE_URL = STANDALONE ? location.origin + location.pathname : 'https://claude.ai/artifact/Qhchi6VWQa5d3jBMB8tCCt';",
             "// 웹진 안 페이지라 늘 자기 주소로 공유한다. 공유에는 실제 주소만 쓴다 (공통 기준: 테스트 주소 금지)\nconst STANDALONE = true;\n"
             "// 언어별 페이지가 있어(2026-10-28) 이 페이지의 실제 주소(canonical)로 공유한다\n"
             "const SHARE_URL = (document.querySelector('link[rel=\"canonical\"]') || {}).href || 'https://lxwebzine.hankyung.com/2026-1/team3/articles/jeju-village-test.html';")
# 영어·일본어 웹진 페이지는 그 언어로 연다. 테스트 안에서 언어를 바꾸면 이 페이지 언어가 아닐 때만 주소에 ?lang= (2026-10-28)
js = rep(js, "  try { const q = new URLSearchParams(location.search).get('lang'); if (LANGS[q]) return q; } catch (e) { /* no query */ }\n",
             "  try { const q = new URLSearchParams(location.search).get('lang'); if (LANGS[q]) return q; } catch (e) { /* no query */ }\n"
             "  if (PAGE_LANG !== 'ko' && LANGS[PAGE_LANG]) return PAGE_LANG;   // 영어·일본어 웹진 페이지\n")
js = rep(js, "      if (l === 'ko') u.searchParams.delete('lang'); else u.searchParams.set('lang', l);",
             "      if (l === PAGE_LANG) u.searchParams.delete('lang'); else u.searchParams.set('lang', l);")
js = rep(js, "const PLACE_PAGES = { shinjeju: '', wondosim: '', hamdeok: '', gujwa: '', pyoseon: '', seogwipo: '', andeok: '', hallim: '', aewol: '', jungsangan: '' };",
             "// 웹진 '나의 제주찾기'의 살고 싶은 동네 10곳과 순서가 같다 (#town-1 ~ #town-10, 2026-10-27)\n"
             "const PLACE_PAGES = { shinjeju: './find-my-jeju.html#town-1', wondosim: './find-my-jeju.html#town-2', hamdeok: './find-my-jeju.html#town-3', gujwa: './find-my-jeju.html#town-4', pyoseon: './find-my-jeju.html#town-5',\n"
             "  seogwipo: './find-my-jeju.html#town-6', andeok: './find-my-jeju.html#town-7', hallim: './find-my-jeju.html#town-8', aewol: './find-my-jeju.html#town-9', jungsangan: './find-my-jeju.html#town-10' };")
js = rep(js, "const WEBZINE = '';   // 웹진 주소가 생기면 여기에 넣으면 '바로가기'가 진짜 링크로 바뀌어요\n", "")
js = rep(js, "// TEST: 지금은 동작 확인용으로 전부 네이버. 웹진 주소가 나오면 동네별 주소로 바꾸기\n", "")
js = rep(js, "// 동네별 '대표 명소' 웹진 페이지 주소. 비어 있으면 '준비 중' 안내가 떠요. 예: hamdeok: 'https://…/places/hamdeok'\n", "// 동네별 '대표 명소' 웹진 페이지 주소. 비어 있으면 '준비 중' 안내가 떠요\n")
js = rep(js, """const LANG_FONTS = {   // loaded only when that language is picked
  ja: 'https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Zen+Maru+Gothic:wght@500;700&family=Yusei+Magic&family=Kiwi+Maru:wght@500&display=swap',
  en: 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap',
  zh: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@500;700&display=swap',
};""", """// 아티팩트는 언어를 고르면 Google Fonts에서 그 언어 글꼴을 불러왔다. 웹진은 style.css 하나만 쓰므로 불러오지 않고 기기 글꼴로 보인다
const LANG_FONTS = {};""")
js = rep(js, "try { const s = localStorage.getItem('lang'); if (LANGS[s]) return s; }", "try { const s = localStorage.getItem('ijejumin.villageTest.lang'); if (LANGS[s]) return s; }")
js = rep(js, "try { localStorage.setItem('lang', l); }", "try { localStorage.setItem('ijejumin.villageTest.lang', l); }")
js = rep(js, """  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : LANG;   // Simplified Chinese glyphs
  loadLangFonts(LANG);
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = t(el.dataset.i18nAlt); });
  const ti = $('titleimg'), src = LANG === 'ko' ? 'img/title.webp' : `img/title_${LANG}.webp`;""",
"""  vtRoot.lang = LANG === 'zh' ? 'zh-CN' : LANG;   // Simplified Chinese glyphs (웹진 페이지 전체가 아니라 테스트 칸에만)
  loadLangFonts(LANG);
  // 웹진 헤더의 KO·EN·JA 중 지금 언어에 흰 동그라미 (중국어는 없음)
  document.querySelectorAll('.wz-lang a').forEach(a => { if (a.getAttribute('hreflang') === LANG) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  vtRoot.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  vtRoot.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  vtRoot.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  vtRoot.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = t(el.dataset.i18nAlt); });
  const ti = $('titleimg'), src = LANG === 'ko' ? IMG + 'title.webp' : `${IMG}title-${LANG}.webp`;""")
js = rep(js, "  const h = document.querySelector('.hdr');", "  const h = vtRoot.querySelector('.hdr');")
js = rep(js, "const img = (pose, alt = '') => `<img src=\"img/${pose}.webp\" alt=\"${alt}\" decoding=\"async\">`;",
             "const img = (pose, alt = '') => `<img src=\"${IMG}${pose}.webp\" alt=\"${alt}\" decoding=\"async\">`;")
js = rep(js, ".map(p => { const i = new Image(); i.src = `img/${p}.webp`; return i; });", ".map(p => { const i = new Image(); i.src = `${IMG}${p}.webp`; return i; });")
js = rep(js, "const el = $(id); el.classList.remove('reveal'); void el.offsetWidth; el.classList.add('reveal');",
             "const el = $(id); el.classList.remove('vt-reveal'); void el.offsetWidth; el.classList.add('vt-reveal');")
js = rep(js, '<span class="qno">Q${qi + 1}<span style="font-size:22px;color:var(--muted)"> / ${QUESTIONS.length}</span></span><h2 class="qtext" style="margin:0">${q.q}</h2>',
             '<span class="qno">Q${qi + 1}<span class="qno-of"> / ${QUESTIONS.length}</span></span><h2 class="qtext">${q.q}</h2>')
js = rep(js, '<h1 class="region" style="margin:0">${r.region}<small>${r.area}</small></h1>', '<h2 class="region">${r.region}<small>${r.area}</small></h2>')
js = rep(js, '<div class="topbar" style="min-height:0">', '<div class="vt-topbar is-plain">')
js = rep(js, '<img src="img/${r.pose}.webp" alt="" loading="lazy">', '<img src="${IMG}${r.pose}.webp" alt="" loading="lazy">')
js = js.replace(' style="margin:0"', '')
js = rep(js, "else if (act === 'home') { try { history.replaceState(null, '', '#'); } catch (e) {} show('start'); }",
             "else if (act === 'home') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} show('start'); }")
js = rep(js, "document.addEventListener('click', e => {\n  const b = e.target.closest('[data-act]'); if (!b) return;",
             "vtRoot.addEventListener('click', e => {\n  const b = e.target.closest('[data-act]'); if (!b) return;")
js = rep(js, """let downloads = null;
const downloadsReady = (async () => {
  try { downloads = await window.claude?.use?.('downloads') ?? null; } catch (e) { downloads = null; }
})();
const waitDownloads = () => Promise.race([downloadsReady, new Promise(r => setTimeout(r, 1500))]);""",
"""// (claude.ai 안에서만 쓰던 저장 창은 웹진에 없다)
const downloads = null;
const waitDownloads = () => Promise.resolve();""")
js = rep(js, "const [logo, pose] = await Promise.all([loadImg('img/logo.webp'), loadImg(`img/${r.pose}.webp`)]);",
             "const [logo, pose] = await Promise.all([loadImg(IMG + 'logo.webp'), loadImg(`${IMG}${r.pose}.webp`)]);")
js = rep(js, "document.fonts && document.fonts.ready.then(() => { document.querySelectorAll('.paper').forEach(tear); fitHeader(); });",
             "document.fonts && document.fonts.ready.then(() => { vtRoot.querySelectorAll('.paper').forEach(tear); fitHeader(); });")
assert 'img/' not in js.replace('${IMG}', '').replace("IMG + '", ''), [m for m in re.findall(r".{20}img/.{20}", js)]
assert '?.' not in js and '??' not in js and 'style="' not in js
for w in ("'reveal'", "'topbar'", '"topbar"', 'class="hero', 'class="progress', 'class="spots'):
    assert w not in js, w

JS = '''
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
const IMG = (VT_LOGO ? VT_LOGO.getAttribute('src') : '../images/village-test/logo.webp').replace(/logo\\.webp$/, '');
/* 이 페이지의 언어 (영어·일본어 웹진 페이지는 그 언어로 테스트를 연다) */
const PAGE_LANG = (document.documentElement.getAttribute('lang') || 'ko').slice(0, 2);
''' + js + '\n})();\n'
open(os.path.join(OUT, 'vt.js'), 'w', encoding='utf-8').write(JS)

# ---------------------------------------------------------------- style.css·site.js 끝에 붙이기 (다시 돌리면 표시 사이만 바뀐다)
START, END = '/* ===== 마을 테스트 블록 시작 (scratchpad build.py가 만든다) ===== */', '/* ===== 마을 테스트 블록 끝 ===== */'
def install(path, block):
    s = open(path, encoding='utf-8').read()
    if START in s:
        a, b = s.index(START), s.index(END) + len(END)
        s = s[:a] + START + '\n' + block.strip('\n') + '\n' + END + s[b:]
    else:
        s = s.rstrip('\n') + '\n\n' + START + '\n' + block.strip('\n') + '\n' + END + '\n'
    open(path, 'w', encoding='utf-8', newline='\n').write(s)
install(os.path.join(PUB, 'css', 'style.css'), HEAD_CSS + css + '\n' + TAIL_CSS)
install(os.path.join(PUB, 'js', 'site.js'), JS)
print('CSS', len(HEAD_CSS + css + TAIL_CSS), 'JS', len(JS), 'page', len(page))
