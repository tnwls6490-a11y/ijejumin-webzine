# 밸런스 게임 글꼴: 게임에 쓰는 글자만 Google Fonts(text= 기능)에서 받아 woff2로 (Bagel Fat One·Jua, SIL OFL 1.1)
# 밸런스 게임 글(문항·엔딩)을 바꾸면 다시 돌린다. 새 글자는 기기 글꼴로 보인다
# 실행: py -I reference/tools/games/fonts.py public/js/site.js public/css/fonts
#   (site.js '게임 고르기 블록'의 '밸런스 게임: 문항' ~ '제주살이, 실화냐? (rq-block.js)' 사이 글자를 모은다)
# 같은 이름으로 바꾸면 style.css의 글꼴 주소 끝에 ?v=N을 붙인다 (휴대폰 캐시)
import sys, re, urllib.parse, urllib.request, os
sys.stdout.reconfigure(encoding='utf-8')
SRC, OUT = sys.argv[1], sys.argv[2]
js = open(SRC, encoding='utf-8').read()
part = js[js.index('밸런스 게임: 문항'):js.index('제주살이, 실화냐? (rq-block.js)')]
chars = set()
for ch in part:
    o = ord(ch)
    if 0xAC00 <= o <= 0xD7A3 or 0x20 <= o <= 0x7E or ch in '‘’“”…·—–→←↓↗↻×✓':
        chars.add(ch)
text = ''.join(sorted(chars))
print('글자 수', len(text), '(한글', sum(1 for c in text if 0xAC00 <= ord(c) <= 0xD7A3), ')')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
for fam, name in (('Bagel Fat One', 'balance-bagel'), ('Jua', 'balance-jua')):
    url = 'https://fonts.googleapis.com/css2?family=' + fam.replace(' ', '+') + '&text=' + urllib.parse.quote(text) + '&display=swap'
    css = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read().decode('utf-8')
    srcs = re.findall(r'url\((https://[^)]+)\) format\(\'woff2\'\)', css)
    assert len(srcs) == 1, (fam, css[:300])
    data = urllib.request.urlopen(urllib.request.Request(srcs[0], headers={'User-Agent': UA})).read()
    open(os.path.join(OUT, name + '.woff2'), 'wb').write(data)
    print(fam, len(data), 'bytes')
