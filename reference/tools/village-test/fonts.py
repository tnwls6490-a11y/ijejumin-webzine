# 마을 테스트 글꼴: G마켓 산스는 아티팩트 안 base64를 꺼내고,
# Bagel Fat One·Jua·Nanum Pen Script는 테스트에 쓰는 글자만 Google Fonts(text= 기능)에서 받아 woff2로 저장한다
# 실행: py -I fonts.py <아티팩트 html> <public/css/fonts 폴더>
import sys, re, base64, urllib.parse, urllib.request, os
sys.stdout.reconfigure(encoding='utf-8')
SRC, OUT = sys.argv[1], sys.argv[2]
lines = open(SRC, encoding='utf-8').read().split('\n')

# 1) G마켓 산스 (500·700): 8·9번째 줄의 data:font/woff;base64
for ln, w in ((8, 500), (9, 700)):
    m = re.search(r"data:font/woff;base64,([A-Za-z0-9+/=]+)", lines[ln - 1])
    data = base64.b64decode(m.group(1))
    open(os.path.join(OUT, 'vt-gmarket-%d.woff' % w), 'wb').write(data)
    print('Gmarket', w, len(data), 'bytes')

# 2) 쓰는 글자: 페이지·스크립트(글꼴 base64 줄 제외)의 한글 + 영문·숫자·문장부호
body = '\n'.join(l for i, l in enumerate(lines) if i not in (7, 8))
extra = '자바스크립트를 켜야 테스트를 할 수 있어요. 나는 제주 어디 주민? 이제주민 한경 웹진'
chars = set()
for ch in body + extra:
    o = ord(ch)
    if 0xAC00 <= o <= 0xD7A3 or 0x20 <= o <= 0x7E or ch in '‘’“”…·—–→←×✓「」、。！？':
        chars.add(ch)
text = ''.join(sorted(chars))
print('글자 수', len(text), '(한글', sum(1 for c in text if 0xAC00 <= ord(c) <= 0xD7A3), ')')
open(os.path.join(os.path.dirname(__file__), 'chars.txt'), 'w', encoding='utf-8').write(text)

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
for fam, name in (('Bagel Fat One', 'vt-bagel-fat-one'), ('Jua', 'vt-jua'), ('Nanum Pen Script', 'vt-nanum-pen')):
    url = 'https://fonts.googleapis.com/css2?family=' + fam.replace(' ', '+') + '&text=' + urllib.parse.quote(text) + '&display=swap'
    css = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read().decode('utf-8')
    srcs = re.findall(r'url\((https://[^)]+)\) format\(\'woff2\'\)', css)
    assert len(srcs) == 1, (fam, css[:300])
    data = urllib.request.urlopen(urllib.request.Request(srcs[0], headers={'User-Agent': UA})).read()
    open(os.path.join(OUT, name + '.woff2'), 'wb').write(data)
    print(fam, len(data), 'bytes')
