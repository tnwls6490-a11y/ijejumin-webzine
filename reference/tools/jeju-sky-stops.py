# 서브메인 제주 화면, 세로 화면용 하늘 그러데이션 색 멈춤점 계산 (style.css의 세로 화면 .scene__inner 배경. 2026-10-30)
# 사용: py -I reference/tools/jeju-sky-stops.py public/images/jeju-seongsan-4.jpg  → 나온 줄을 그 배경 linear-gradient에 붙인다
# 모양은 웹진 이미지 4:5(540×675 화면)에서 고른 곡선: 맨 위 C0 → 사진 하늘이 다 나타나는 곳까지 (y / 160px)^1.6 로 옅어짐. 화면 폭과 상관없게 두 칸으로 나눴다
# A: 화면 위 0~72px (px 고정)  B: 사진이 흐려지며 나타나는 구간 72px ~ 72px + 16.29vw (사진 높이 110vw의 14.81%)
import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image
SRC = Image.open(sys.argv[1]).convert('RGB')
C0 = (18, 96, 170); DIM = (6, 22, 44); FADE = 88 / 594   # 0.1481
def photo(f):
    r = min(744, max(0, int(f * 745)))
    c = SRC.crop((406, r, 1084, r + 1)).resize((1, 1), Image.BOX).getpixel((0, 0))
    a = .12 + (.06 - .12) * min(1, max(0, f / .30))
    return tuple(cc * (1 - a) + d * a for cc, d in zip(c, DIM))
CE = photo(FADE)
def t540(y): return (y / 160) ** 1.6       # 이미지(540px 화면)에서 고른 곡선
tA = t540(72)
def T_A(s): t = tA * s ** 1.6; return tuple(a + (b - a) * t for a, b in zip(C0, CE))
def T_B(u): t = t540(72 + 88 * u); return tuple(a + (b - a) * t for a, b in zip(C0, CE))
fmt = lambda c: 'rgb(%d, %d, %d)' % tuple(max(0, min(255, round(v))) for v in c)
out = []
for s in (0, .25, .5, .75):
    out.append('%s %gpx' % (fmt(T_A(s)), round(72 * s, 1)))
for u in (0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1):
    T = T_B(u)
    if u <= .85:
        P = photo(u * FADE); F = tuple((tt - u * p) / (1 - u) for tt, p in zip(T, P))
    else: F = T
    raw = tuple(round(v) for v in F)
    pos = '72px' if u == 0 else 'calc(72px + %gvw)' % round(16.29 * u, 2)
    out.append('%s %s' % (fmt(F), pos))
    print(u, 'T', tuple(round(v) for v in T), 'F', raw, file=sys.stderr)
print(',\n'.join(out))
