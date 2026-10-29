# 마을 테스트의 영어·일본어 웹진 페이지를 만든다 (2026-10-28)
#   public/en/articles/jeju-village-test.html, public/ja/articles/jeju-village-test.html
# 한국어 페이지(public/articles/jeju-village-test.html, build.py가 만든다)를 바탕으로
#   - 머리 정보(제목·설명·주소·hreflang)와 경로(한 칸 깊다)를 바꾸고
#   - 상단 바·헤더·푸터·맨 위로 버튼은 그 언어 기사(emily.html)의 것을 쓰고
#   - 테스트 칸 안 기본 글자(data-i18n …)는 그 언어 글로 미리 채운다 (스크립트가 늦게 돌아도 한국어가 비치지 않게)
# 한국어 페이지에도 hreflang을 넣고, 헤더 KO·EN·JA를 세 언어 페이지로 잇는다.
# 미리보기 서버(8737)가 켜져 있어야 한다 (테스트 글을 그 언어로 띄워 읽어 온다)
#   사용: py -I reference/tools/village-test/frames.py public
import sys, os, re, html
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

PUB = sys.argv[1] if len(sys.argv) > 1 else 'public'
BASE = 'https://lxwebzine.hankyung.com/2026-1/team3/'
KO_PATH = os.path.join(PUB, 'articles', 'jeju-village-test.html')
TEXT = {
    'en': {
        'title': 'Which Jeju neighborhood suits me? A one-month Jeju stay neighborhood test | ejejumin · Hankyung Webzine',
        'desc': 'Find the Jeju neighborhood that suits you for a one-month stay in 5 questions. Out of 10 Jeju neighborhoods, see the one that fits you and what a day there looks like.',
        'site': 'ejejumin · Hankyung Webzine',
        'h1': 'Which Jeju Local Are You? A one-month Jeju stay neighborhood test',
        'noscript': 'Please turn on JavaScript to take the test.',
        'sheetnext': 'See top spots →',   # 결과를 저장할 때 스크립트가 동네 이름을 넣어 바꾼다 (UI.en.sheetGo)
        'locale': 'en_US', 'alt_locales': ['ko_KR', 'ja_JP'],
    },
    'ja': {
        'title': 'わたしに合う済州の町はどこ？ 済州1ヶ月暮らし 住む町診断 | ejejumin · 韓経ウェブジン',
        'desc': '5つの質問でわかる、わたしに合う済州1ヶ月暮らしの町。済州の10の町の中から、あなたに合う町と、その町での1日を紹介します。',
        'site': 'ejejumin · 韓経ウェブジン',
        'h1': 'わたしは済州のどこの住民？ 済州1ヶ月暮らし 住む町診断',
        'noscript': 'テストをするにはJavaScriptをオンにしてください。',
        'sheetnext': '名所を見る →',   # 결과를 저장할 때 스크립트가 동네 이름을 넣어 바꾼다 (UI.ja.sheetGo)
        'locale': 'ja_JP', 'alt_locales': ['ko_KR', 'en_US'],
    },
}


def rep(s, a, b, count=1):
    assert s.count(a) == count, (a[:80], s.count(a))
    return s.replace(a, b)


def alternates():
    return ('<link rel="alternate" hreflang="ko" href="%sarticles/jeju-village-test.html">\n'
            '<link rel="alternate" hreflang="en" href="%sen/articles/jeju-village-test.html">\n'
            '<link rel="alternate" hreflang="ja" href="%sja/articles/jeju-village-test.html">\n'
            '<link rel="alternate" hreflang="x-default" href="%sarticles/jeju-village-test.html">\n') % (BASE, BASE, BASE, BASE)


def lang_nav(here):
    """헤더 KO·EN·JA: 세 언어 테스트 페이지로 (here: 이 페이지 언어)"""
    href = {
        'ko': {'ko': './jeju-village-test.html?lang=ko', 'en': '../en/articles/jeju-village-test.html?lang=en', 'ja': '../ja/articles/jeju-village-test.html?lang=ja'},
        'en': {'ko': '../../articles/jeju-village-test.html?lang=ko', 'en': './jeju-village-test.html?lang=en', 'ja': '../../ja/articles/jeju-village-test.html?lang=ja'},
        'ja': {'ko': '../../articles/jeju-village-test.html?lang=ko', 'en': '../../en/articles/jeju-village-test.html?lang=en', 'ja': './jeju-village-test.html?lang=ja'},
    }[here]
    names = {'ko': '한국어', 'en': 'English', 'ja': '日本語'}
    return ''.join('<a href="%s" lang="%s" hreflang="%s" aria-label="%s"%s>%s</a>' % (
        href[l], l, l, names[l], ' aria-current="true"' if l == here else '', l.upper()) for l in ['ko', 'en', 'ja'])


def read_i18n(pg, lang):
    """그 언어로 띄운 테스트 첫 화면에서 data-i18n 글을 읽어 온다"""
    pg.goto('http://localhost:8737/articles/jeju-village-test.html?lang=' + lang)
    pg.wait_for_timeout(800)
    return pg.evaluate("""() => { const v = document.getElementById('vt'), out = { text: {}, html: {}, aria: {}, alt: {}, title: '' };
      v.querySelectorAll('[data-i18n]').forEach(e => { if (!(e.dataset.i18n in out.text)) out.text[e.dataset.i18n] = e.textContent; });
      v.querySelectorAll('[data-i18n-html]').forEach(e => { if (!(e.dataset.i18nHtml in out.html)) out.html[e.dataset.i18nHtml] = e.innerHTML; });
      v.querySelectorAll('[data-i18n-aria]').forEach(e => { if (!(e.dataset.i18nAria in out.aria)) out.aria[e.dataset.i18nAria] = e.getAttribute('aria-label'); });
      v.querySelectorAll('[data-i18n-alt]').forEach(e => { if (!(e.dataset.i18nAlt in out.alt)) out.alt[e.dataset.i18nAlt] = e.alt; });
      out.title = document.getElementById('titleimg').alt;
      localStorage.removeItem('ijejumin.villageTest.lang');
      return out; }""")


def fill_vt(vt, m):
    """테스트 칸 마크업의 기본 글자를 그 언어 글로"""
    def tag_attr(tag, name, value):
        return re.sub(r'(\b%s=")[^"]*(")' % name, lambda x: x.group(1) + html.escape(value, quote=True) + x.group(2), tag, count=1)

    def one(mo):
        tag = mo.group(0)
        k = re.search(r'data-i18n-aria="([^"]+)"', tag)
        if k and k.group(1) in m['aria']: tag = tag_attr(tag, 'aria-label', m['aria'][k.group(1)])
        k = re.search(r'data-i18n-alt="([^"]+)"', tag)
        if k and k.group(1) in m['alt']: tag = tag_attr(tag, 'alt', m['alt'][k.group(1)])
        return tag
    vt = re.sub(r'<[a-z][^>]*data-i18n-(?:aria|alt)="[^"]+"[^>]*>', one, vt)
    vt = re.sub(r'(<([a-z]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)',
                lambda x: x.group(1) + (html.escape(m['text'][x.group(3)], quote=False) if x.group(3) in m['text'] else x.group(4)), vt)
    vt = re.sub(r'(<([a-z]+)\b[^>]*\bdata-i18n-html="([^"]+)"[^>]*>)(.*?)(</\2>)',
                lambda x: x.group(1) + (m['html'][x.group(3)] if x.group(3) in m['html'] else x.group(4)) + x.group(5), vt, flags=re.S)
    vt = re.sub(r'(<img class="title" id="titleimg" [^>]*alt=")[^"]*(")', lambda x: x.group(1) + html.escape(m['title'], quote=True) + x.group(2), vt)
    vt = vt.replace('alt="이제주민"', 'alt="ejejumin"')
    return vt


ko = open(KO_PATH, encoding='utf-8').read()

# 한국어 페이지: hreflang 넣기, 헤더 KO·EN·JA를 세 언어 페이지로 (다시 돌려도 같은 결과)
if 'hreflang="en" href=' not in ko:
    ko = rep(ko, '<link rel="canonical" href="%sarticles/jeju-village-test.html">\n' % BASE,
             '<link rel="canonical" href="%sarticles/jeju-village-test.html">\n' % BASE + alternates())
ko = re.sub(r'(<nav class="wz-lang" aria-label="언어 선택">).*?(</nav>)', lambda x: x.group(1) + lang_nav('ko') + x.group(2), ko, count=1)
open(KO_PATH, 'w', encoding='utf-8', newline='').write(ko)

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.route(lambda u: 'googletagmanager' in u or 'google-analytics' in u, lambda r: r.abort())
    maps = {l: read_i18n(pg, l) for l in TEXT}
    b.close()

for lang, T in TEXT.items():
    art = open(os.path.join(PUB, lang, 'articles', 'emily.html'), encoding='utf-8').read()
    topbar = re.search(r'<div class="topbar">.*?</div></div>\n', art).group(0)
    header = re.search(r'<header class="wz-header">.*?</header>', art, re.S).group(0)
    header = header.replace(' aria-current="page"', '')
    header = re.sub(r'(<nav class="wz-lang" aria-label="[^"]*">).*?(</nav>)', lambda x: x.group(1) + lang_nav(lang) + x.group(2), header, count=1)
    a0 = art.index('<!-- 푸터 위 안내')
    a1 = art.index('</a>', art.index('<a class="to-top"')) + len('</a>')
    foot = art[a0:a1]

    s = ko
    s = rep(s, '<html lang="ko">', '<html lang="%s">' % lang)
    s = re.sub(r'<title>.*?</title>', lambda x: '<title>%s</title>' % html.escape(T['title'], quote=False), s, count=1)
    s = re.sub(r'(<meta name="description" content=")[^"]*', lambda x: x.group(1) + html.escape(T['desc']), s, count=1)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda x: x.group(1) + html.escape(T['desc']), s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda x: x.group(1) + html.escape(T['title']), s, count=1)
    s = re.sub(r'(<meta property="og:site_name" content=")[^"]*', lambda x: x.group(1) + html.escape(T['site']), s, count=1)
    s = rep(s, '<link rel="canonical" href="%sarticles/jeju-village-test.html">' % BASE,
            '<link rel="canonical" href="%s%s/articles/jeju-village-test.html">' % (BASE, lang))
    s = rep(s, '<meta property="og:url" content="%sarticles/jeju-village-test.html">' % BASE,
            '<meta property="og:url" content="%s%s/articles/jeju-village-test.html">\n<meta property="og:locale" content="%s">\n%s'
            % (BASE, lang, T['locale'], '\n'.join('<meta property="og:locale:alternate" content="%s">' % x for x in T['alt_locales'])))
    s = rep(s, 'href="../css/style.css"', 'href="../../css/style.css"')
    s = rep(s, 'src="../js/site.js"', 'src="../../js/site.js"')
    s = s.replace('"../images/', '"../../images/')
    s = re.sub(r'<div class="topbar">.*?</div></div>\n', lambda x: topbar, s, count=1)
    s = re.sub(r'<header class="wz-header">.*?</header>', lambda x: header, s, count=1, flags=re.S)
    k0 = s.index('<!-- 푸터 위 안내')
    k1 = s.index('</a>', s.index('<a class="to-top"')) + len('</a>')
    s = s[:k0] + foot + s[k1:]
    v0, v1 = s.index('<section class="vt" id="vt"'), s.index('</section>\n</main>')
    vt = s[v0:v1]
    vt = re.sub(r'(<h1 class="sr-only" id="vt-title">)[^<]*', lambda x: x.group(1) + html.escape(T['h1'], quote=False), vt)
    vt = re.sub(r'(<p class="vt-noscript">)[^<]*', lambda x: x.group(1) + html.escape(T['noscript'], quote=False), vt)
    vt = fill_vt(vt, maps[lang])
    vt = re.sub(r'(<button class="cta" id="sheetnext"[^>]*>)[^<]*', lambda x: x.group(1) + html.escape(T['sheetnext'], quote=False), vt)
    s = s[:v0] + vt + s[v1:]
    out = os.path.join(PUB, lang, 'articles', 'jeju-village-test.html')
    open(out, 'w', encoding='utf-8', newline='').write(s)
    body = re.sub(r'<!--.*?-->', '', s.split('<body>')[1], flags=re.S)
    left = sorted(set(re.findall(r'[가-힣][가-힣 ,·]*', re.sub(r'lang="ko"[^>]*>[^<]*', '', body))))
    print(out, len(s), '남은 한국어:', left)
