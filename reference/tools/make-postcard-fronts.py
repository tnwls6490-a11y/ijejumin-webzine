"""엽서 앞면 그림 20장(SVG)을 만든다. 시안('그래픽 패턴형')처럼 크림 종이 위에 납작한 색면 그림.
가운데(글자 자리)는 비워 두고, 왼쪽 꽃·열매, 오른쪽 색면과 우표, 아래쪽 장소 풍경만 엽서마다 다르게 한다.
make_fronts.py <out_dir>
"""
import math, os, random, sys

W, H = 614, 377          # 시안 엽서와 같은 비율
HZ = 262                 # 수평선 높이

C = dict(
    cream='#F3E4CE', orange='#F59A3C', orange2='#F8AE5A', dorange='#E7772E', coral='#EE6A3F', sun='#F0582A',
    navy='#1E4F7E', blue='#2D6BA2', sea='#4A84B6', sea2='#2F6697', sky='#A9D4F5', pale='#CFE3F0',
    turq='#5BBDB4', mint='#8CCBB7', leaf='#2E5E4E', leaf2='#3F7A5C', olive='#6F8F4E', island='#33503F',
    yellow='#F2C744', red='#D9442E', white='#FBF6EC', basalt='#2C2C30', sand='#EBD3AC', grey='#9C9488',
    purple='#7B78C2', lilac='#A9A6E0', tan='#C9A174', brown='#8A5A3B', far='#9DB4C4',
)


def smooth(points, close=False):
    """점들을 지나는 부드러운 곡선 (캣멀-롬 → 베지어)"""
    p = points
    d = f'M{p[0][0]:.1f},{p[0][1]:.1f}'
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i > 0 else p[i]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + (' Z' if close else '')


def land(top, color, base=HZ + 1, extra=''):
    """수평선 위로 솟은 섬·산 (윗선 점들 → 아래는 수평선)"""
    d = smooth(top) + f' L{top[-1][0]},{base} L{top[0][0]},{base} Z'
    return f'<path d="{d}" fill="{color}"{extra}/>'


def foam(y, x0, x1, step=14, amp=3, color=None, width=2, op=.85):
    d = f'M{x0},{y}'
    x = x0
    while x < x1:
        d += f' q{step / 2},{-amp} {step},0'
        x += step
    return f'<path d="{d}" fill="none" stroke="{color or C["white"]}" stroke-width="{width}" stroke-linecap="round" opacity="{op}"/>'


def sea(top=None, bottom=None, y=HZ, foams=True):
    top = top or C['sea']; bottom = bottom or C['sea2']
    s = (f'<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/>'
         f'<stop offset="1" stop-color="{bottom}"/></linearGradient>'
         f'<rect x="0" y="{y}" width="{W}" height="{H - y}" fill="url(#sea)"/>'
         f'<rect x="0" y="{y}" width="{W}" height="1.5" fill="{C["white"]}" opacity=".35"/>')
    if foams:
        s += foam(y + 30, 230, 420, 16, 2.5, op=.5, width=1.6) + foam(y + 52, 260, 520, 18, 3, op=.75)
        s += foam(y + 74, 300, 560, 20, 3.5, op=.9, width=2.4)
    return s


def frame_waves(left=True, right=True, color=None, color2=None):
    """시안처럼 왼쪽 아래 큰 남색 물결, 오른쪽 아래 작은 물결"""
    color = color or C['navy']; color2 = color2 or C['blue']
    s = ''
    if left:
        s += f'<path d="{smooth([(-5, 250), (40, 236), (110, 252), (170, 290), (215, 340), (250, 382)])} L-5,382 Z" fill="{color}"/>'
    if right:
        s += f'<path d="{smooth([(619, 240), (585, 248), (548, 272), (520, 300), (500, 330)])} L619,330 Z" fill="{color2}" opacity=".95"/>'
    return s


# ---------- 왼쪽 꽃·열매 ----------
def leaf(cx, cy, length, width, angle, color):
    a = math.radians(angle)
    dx, dy = math.cos(a) * length / 2, math.sin(a) * length / 2
    nx, ny = -math.sin(a) * width / 2, math.cos(a) * width / 2
    p0 = (cx - dx, cy - dy); p1 = (cx + dx, cy + dy)
    return (f'<path d="M{p0[0]:.1f},{p0[1]:.1f} Q{cx + nx:.1f},{cy + ny:.1f} {p1[0]:.1f},{p1[1]:.1f} '
            f'Q{cx - nx:.1f},{cy - ny:.1f} {p0[0]:.1f},{p0[1]:.1f} Z" fill="{color}"/>')


def m_tangerine():
    return (f'<path d="M-4,-4 L58,-4 Q46,40 -4,52 Z" fill="{C["blue"]}"/>'
            + leaf(78, 52, 84, 40, -42, C['leaf']) + leaf(74, 150, 80, 36, -28, C['leaf2'])
            + f'<circle cx="20" cy="108" r="62" fill="{C["orange"]}"/><circle cx="6" cy="230" r="58" fill="{C["orange2"]}"/>'
            + leaf(84, 198, 70, 30, -38, C['leaf']) + f'<circle cx="36" cy="104" r="4.5" fill="{C["dorange"]}"/>'
            + f'<circle cx="26" cy="226" r="4" fill="{C["dorange"]}"/>')


def m_camellia():
    s = (leaf(46, 36, 86, 36, 30, C['leaf']) + leaf(86, 112, 84, 34, -35, C['leaf2']) + leaf(36, 200, 84, 34, 20, C['leaf'])
         + leaf(92, 238, 70, 28, -50, C['leaf2']))
    for cx, cy, r in ((26, 100, 38), (74, 176, 30), (8, 262, 30)):
        for k in range(5):
            a = math.radians(k * 72 - 90)
            s += f'<circle cx="{cx + math.cos(a) * r * .55:.1f}" cy="{cy + math.sin(a) * r * .55:.1f}" r="{r * .55:.1f}" fill="{C["red"]}"/>'
        s += f'<circle cx="{cx}" cy="{cy}" r="{r * .32:.1f}" fill="{C["yellow"]}"/>'
    return s


def m_canola():
    rnd = random.Random(4)
    s = ''
    for x0, top in ((18, 40), (48, 70), (82, 110), (8, 150), (40, 185)):
        s += f'<path d="M{x0},{300} Q{x0 + 6},{(300 + top) / 2} {x0 + 2},{top}" stroke="{C["olive"]}" stroke-width="3" fill="none"/>'
        s += leaf(x0 + 12, top + 70, 34, 12, -50, C['olive'])
        for _ in range(9):
            s += f'<circle cx="{x0 + rnd.uniform(-14, 16):.1f}" cy="{top + rnd.uniform(-12, 22):.1f}" r="{rnd.uniform(5, 8):.1f}" fill="{C["yellow"]}"/>'
    return s


def m_eulalia():
    s = ''
    for x0, top, bend in ((14, 50, 26), (44, 80, 30), (78, 120, 24), (6, 160, 18)):
        s += f'<path d="M{x0 - 10},{300} Q{x0},{(300 + top) / 2} {x0 + bend},{top}" stroke="{C["brown"]}" stroke-width="2.4" fill="none"/>'
        for k in range(6):
            s += leaf(x0 + bend - 4 + k * 3, top + 8 + k * 9, 30, 9, -60 + k * 6, C['tan'])
    return s


def m_hydrangea():
    rnd = random.Random(9)
    s = leaf(70, 70, 64, 30, -30, C['leaf']) + leaf(76, 180, 60, 28, 25, C['leaf2'])
    for cx, cy, r, col in ((24, 92, 56, C['lilac']), (14, 214, 50, C['blue']), (64, 150, 32, C['purple'])):
        s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}" opacity=".9"/>'
        for _ in range(int(r / 3)):
            a = rnd.uniform(0, 6.28); rr = rnd.uniform(0, r * .8)
            x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr
            s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.2" fill="{C["white"]}" opacity=".55"/>'
    return s


def m_palm():
    s = ''
    for ang, ln in ((-60, 120), (-30, 130), (0, 120), (28, 110), (55, 95)):
        a = math.radians(ang)
        x1, y1 = -10 + math.cos(a) * ln, 110 + math.sin(a) * ln
        s += f'<path d="M-10,110 Q{(x1 - 10) / 2 + 10:.1f},{(y1 + 110) / 2 - 18:.1f} {x1:.1f},{y1:.1f}" stroke="{C["leaf2"]}" stroke-width="3" fill="none"/>'
        for k in range(1, 8):
            t = k / 8
            px, py = -10 + (x1 + 10) * t, 110 + (y1 - 110) * t - math.sin(t * math.pi) * 9
            s += leaf(px + 6, py + 8, 26 * (1 - t * .5), 8, ang + 60, C['leaf'])
    return s


MOTIF = dict(tangerine=m_tangerine, camellia=m_camellia, canola=m_canola, eulalia=m_eulalia, hydrangea=m_hydrangea, palm=m_palm)


# ---------- 오른쪽 색면 ----------
def accent(kind, color):
    if kind == 'bird':     # 시안의 주황 면
        return f'<path d="M410,68 Q446,40 486,46 L614,46 L614,250 L462,250 L462,108 Q440,92 410,96 Z" fill="{color}"/>'
    if kind == 'arch':
        return f'<path d="M466,250 L466,90 Q466,40 520,40 L614,40 L614,250 Z" fill="{color}"/>'
    if kind == 'circle':
        return f'<circle cx="566" cy="150" r="104" fill="{color}"/>'
    if kind == 'wave':
        return f'<path d="M614,36 L500,36 Q456,60 480,110 Q504,160 468,206 Q456,230 476,252 L614,252 Z" fill="{color}"/>'
    return ''


# ---------- 우표 ----------
def stamp(kind, seed):
    x, y, w, h = 500, 24, 86, 116
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{C["white"]}"/>'
    for i in range(0, w + 1, 9):     # 톱니
        s += f'<circle cx="{x + i}" cy="{y}" r="2.6" fill="{C["cream"]}"/><circle cx="{x + i}" cy="{y + h}" r="2.6" fill="{C["cream"]}"/>'
    for j in range(0, h + 1, 9):
        s += f'<circle cx="{x}" cy="{y + j}" r="2.6" fill="{C["cream"]}"/><circle cx="{x + w}" cy="{y + j}" r="2.6" fill="{C["cream"]}"/>'
    ix, iy, iw, ih = x + 8, y + 8, w - 16, h - 16
    s += f'<clipPath id="st"><rect x="{ix}" y="{iy}" width="{iw}" height="{ih}"/></clipPath><g clip-path="url(#st)">'
    mid = iy + ih * .62
    if kind == 'sunset':
        s += (f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="#F7B98A"/><circle cx="{ix + iw / 2}" cy="{mid - 4}" r="22" fill="{C["sun"]}"/>'
              f'<rect x="{ix}" y="{mid}" width="{iw}" height="{ih}" fill="{C["blue"]}"/>' + land([(ix + 10, mid), (ix + 26, mid - 8), (ix + 44, mid - 9), (ix + 58, mid)], C['island'], mid + 1))
    elif kind == 'lighthouse':
        s += (f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="{C["pale"]}"/><rect x="{ix}" y="{mid}" width="{iw}" height="{ih}" fill="{C["blue"]}"/>'
              f'<path d="M{ix + 30},{mid} L{ix + 34},{iy + 22} L{ix + 42},{iy + 22} L{ix + 46},{mid} Z" fill="{C["red"]}"/>'
              f'<rect x="{ix + 32}" y="{iy + 14}" width="12" height="9" fill="{C["white"]}"/><rect x="{ix + 33}" y="{iy + 40}" width="10" height="5" fill="{C["white"]}"/>')
    elif kind == 'halla':
        s += (f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="{C["sky"]}"/>'
              + land([(ix - 4, mid + 6), (ix + 20, mid - 16), (ix + 35, mid - 30), (ix + 52, mid - 24), (ix + 74, mid + 6)], C['leaf2'], iy + ih)
              + f'<path d="M{ix + 27},{mid - 24} Q{ix + 35},{mid - 32} {ix + 46},{mid - 27} L{ix + 42},{mid - 20} L{ix + 34},{mid - 23} L{ix + 30},{mid - 19} Z" fill="{C["white"]}"/>')
    elif kind == 'crater':
        s += (f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="#F9C9A3"/><circle cx="{ix + 52}" cy="{iy + 20}" r="10" fill="{C["sun"]}"/>'
              f'<rect x="{ix}" y="{mid}" width="{iw}" height="{ih}" fill="{C["sea"]}"/>'
              + land([(ix + 6, mid), (ix + 14, mid - 16), (ix + 20, mid - 22), (ix + 44, mid - 22), (ix + 52, mid - 14), (ix + 62, mid)], C['island'], mid + 1))
    elif kind == 'tangerine':
        s += (f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="{C["mint"]}"/><circle cx="{ix + iw / 2}" cy="{iy + ih / 2 + 6}" r="24" fill="{C["orange"]}"/>'
              + leaf(ix + iw / 2 + 10, iy + ih / 2 - 22, 26, 12, -30, C['leaf']))
    elif kind == 'wave':
        s += f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="{C["pale"]}"/>'
        for k, col in enumerate((C['sea'], C['blue'], C['navy'])):
            yy = iy + 40 + k * 18
            s += f'<path d="M{ix - 4},{yy} q10,-14 20,0 t20,0 t20,0 t20,0 L{ix + iw + 4},{iy + ih} L{ix - 4},{iy + ih} Z" fill="{col}"/>'
    elif kind == 'horse':
        s += (f'<rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" fill="{C["pale"]}"/><rect x="{ix}" y="{mid}" width="{iw}" height="{ih}" fill="{C["olive"]}"/>'
              f'<path d="M{ix + 16},{mid + 2} L{ix + 18},{mid - 14} Q{ix + 30},{mid - 22} {ix + 46},{mid - 16} L{ix + 52},{mid - 30} L{ix + 58},{mid - 26} L{ix + 54},{mid - 12} L{ix + 52},{mid + 2} L{ix + 48},{mid + 2} L{ix + 46},{mid - 6} L{ix + 24},{mid - 6} L{ix + 22},{mid + 2} Z" fill="{C["brown"]}"/>')
    s += '</g>'
    # 소인 (물결 줄과 둥근 도장)
    s += (f'<g fill="none" stroke="#6E655B" stroke-width="1.3" opacity=".55">'
          f'<circle cx="{x - 4}" cy="{y + h - 18}" r="26"/><circle cx="{x - 4}" cy="{y + h - 18}" r="20"/>'
          f'<path d="M{x - 40},{y + h + 6} q8,-6 16,0 t16,0 t16,0 t16,0"/><path d="M{x - 40},{y + h + 14} q8,-6 16,0 t16,0 t16,0 t16,0"/></g>')
    return s


# ---------- 아래쪽 장소 풍경 ----------
def far_hills(color=None, y=HZ):
    return land([(150, y), (200, y - 10), (240, y - 14), (290, y - 6), (330, y)], color or C['far'], y + 1, ' opacity=".8"')


def s_island(shape):
    s = sea() + far_hills()
    if shape == 'dome':        # 비양도·섶섬
        s += land([(250, HZ), (292, HZ - 14), (336, HZ - 24), (378, HZ - 26), (416, HZ - 18), (446, HZ - 5), (458, HZ)], C['island'])
    elif shape == 'udo':       # 소가 누운 모양, 오른쪽이 절벽
        s += land([(196, HZ), (250, HZ - 9), (320, HZ - 13), (380, HZ - 16), (418, HZ - 28), (444, HZ - 33), (458, HZ - 26), (468, HZ)], C['island'])
        s += f'<rect x="446" y="{HZ - 44}" width="5" height="14" fill="{C["white"]}"/><rect x="445" y="{HZ - 47}" width="7" height="4" fill="{C["red"]}"/>'
    elif shape == 'flat':      # 가파도: 낮고 평평한 섬 + 뒤로 산방산
        s += land([(140, HZ), (168, HZ - 18), (190, HZ - 22), (212, HZ - 14), (230, HZ)], C['far'], HZ + 1, ' opacity=".9"')
        s += land([(250, HZ), (280, HZ - 6), (360, HZ - 9), (430, HZ - 7), (470, HZ)], C['olive'])
    return s


def s_harbor():                # 구두미포구: 포구 방파제·작은 배·멀리 섬
    s = sea() + land([(330, HZ), (350, HZ - 12), (372, HZ - 16), (392, HZ - 8), (404, HZ)], C['island'])
    s += land([(420, HZ), (432, HZ - 7), (446, HZ - 7), (456, HZ)], C['island'])
    s += f'<path d="M150,{H} L230,300 L420,300 L428,312 L250,318 L190,{H} Z" fill="#D8CFC2"/>'
    for bx, col in ((270, C['white']), (320, C['white']), (360, C['white'])):
        s += f'<path d="M{bx},{292} l26,0 l-5,7 l-17,0 Z" fill="{col}"/><rect x="{bx + 9}" y="{283}" width="8" height="9" fill="{C["blue"]}"/>'
    return s


def s_windmill():              # 신창풍차해안도로: 노을 + 바다 위 풍차
    s = f'<circle cx="300" cy="{HZ}" r="36" fill="{C["coral"]}" opacity=".9"/>' + sea(C['blue'], C['navy'])
    s += f'<path d="M150,{H} Q260,300 520,286" stroke="#5A5048" stroke-width="5" fill="none"/>'
    for i, (x, hgt) in enumerate(((230, 62), (320, 54), (410, 48), (492, 44))):
        top = HZ + 28 - hgt
        s += f'<rect x="{x - 1.6}" y="{top}" width="3.2" height="{hgt}" fill="{C["white"]}"/>'
        for k in range(3):
            a = math.radians(k * 120 + i * 25 - 90)
            s += f'<line x1="{x}" y1="{top}" x2="{x + math.cos(a) * hgt * .42:.1f}" y2="{top + math.sin(a) * hgt * .42:.1f}" stroke="{C["white"]}" stroke-width="2.6" stroke-linecap="round"/>'
    return s


def s_road():                  # 평화로: 오름 사이로 굽은 길, 단풍
    s = land([(120, HZ + 6), (220, HZ - 24), (300, HZ - 34), (380, HZ - 24), (480, HZ + 6)], C['far'], H, ' opacity=".85"')
    s += f'<path d="M0,{H} L0,300 {smooth([(0, 300), (120, 280), (260, 286), (400, 276), (614, 290)])[1:]} L614,{H} Z" fill="{C["leaf2"]}"/>'
    s += f'<path d="M236,{H} C276,330 300,300 300,284 L312,284 C318,300 344,330 384,{H} Z" fill="#6C6A70"/>'
    s += f'<path d="M306,288 L306,296 M307,304 L308,316 M310,326 L312,344 M315,356 L318,{H}" stroke="{C["white"]}" stroke-width="2.4" stroke-linecap="round"/>'
    for cx, cy, r, col in ((220, 292, 26, C['dorange']), (250, 300, 20, C['red']), (420, 290, 26, C['orange']), (452, 300, 18, C['dorange']), (190, 304, 16, C['orange'])):
        s += f'<rect x="{cx - 2}" y="{cy}" width="4" height="24" fill="{C["brown"]}"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}"/>'
    return s


def s_lighthouse(kinds):       # 이호테우·보목포구: 방파제와 등대
    s = sea() + f'<path d="M340,{HZ + 34} L614,{HZ + 20} L614,{HZ + 44} L350,{HZ + 46} Z" fill="#CFC6BA"/>'
    for i in range(10):
        s += f'<circle cx="{360 + i * 26}" cy="{HZ + 44 - i * 1.2:.1f}" r="9" fill="#BDB3A6"/>'
    for i, col in enumerate(kinds):
        x = 470 + i * 70
        s += (f'<path d="M{x - 10},{HZ + 30} L{x - 6},{HZ - 40} L{x + 6},{HZ - 40} L{x + 10},{HZ + 30} Z" fill="{col}"/>'
              f'<rect x="{x - 9}" y="{HZ - 52}" width="18" height="12" fill="{C["white"] if col != C["white"] else C["red"]}"/>'
              f'<path d="M{x - 11},{HZ - 52} L{x},{HZ - 62} L{x + 11},{HZ - 52} Z" fill="{col}"/>')
    return s


def s_beach(island=False, floats=False, wide=False):
    y = HZ + (12 if wide else 0)
    s = (f'<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C["sea"]}"/>'
         f'<stop offset=".55" stop-color="{C["turq"]}"/><stop offset="1" stop-color="#9AD8CE"/></linearGradient>'
         f'<rect x="0" y="{y}" width="{W}" height="{H - y}" fill="url(#sh)"/>')
    if island:
        s += land([(360, y), (382, y - 12), (402, y - 16), (420, y - 8), (430, y)], C['island'], y + 1)
    s += f'<path d="M0,{H} L0,{y + 64} {smooth([(0, y + 64), (180, y + 74), (360, y + 66), (614, y + 84)])[1:]} L614,{H} Z" fill="{C["sand"]}"/>'
    s += foam(y + 64, 170, 560, 22, 3, op=.9, width=2.4)
    s += f'<path d="M470,{H} Q500,{y + 70} 560,{y + 78} Q600,{y + 84} 614,{y + 74} L614,{H} Z" fill="{C["basalt"]}"/>'
    if floats:                 # 해녀의 테왁
        for fx, fy in ((300, y + 26), (350, y + 40), (410, y + 30)):
            s += f'<circle cx="{fx}" cy="{fy}" r="7" fill="{C["dorange"]}"/><rect x="{fx - 7}" y="{fy - 1}" width="14" height="2" fill="{C["white"]}"/>'
    return s


def s_dolphins():              # 대정 노을해안로: 노을과 돌고래
    s = f'<circle cx="360" cy="{HZ}" r="38" fill="{C["sun"]}" opacity=".85"/>' + sea(C['blue'], C['navy'], foams=False)
    for dx, dy in ((280, 20), (320, 26), (360, 18)):
        s += f'<path d="M{dx},{HZ + dy} q10,-14 22,-6 l4,-6 l1,9 q-12,-4 -27,3 Z" fill="#26323F"/>'
    s += f'<path d="M180,{H} Q220,300 300,306 Q330,312 340,{H} Z" fill="{C["basalt"]}"/>'
    s += foam(300, 200, 330, 12, 4, width=2.6) + foam(290, 230, 300, 10, 5, width=2, op=.7)
    return s


def s_waterfall():             # 엉또폭포: 숲 속 폭포
    s = f'<path d="M260,{H} L268,250 Q300,236 340,242 L352,{H} Z" fill="#4A4743"/>'
    s += f'<rect x="292" y="246" width="30" height="{H - 246}" fill="#DDEEF6"/>'
    for i in range(5):
        s += f'<rect x="{295 + i * 6}" y="250" width="1.6" height="{H - 250}" fill="{C["white"]}"/>'
    rnd = random.Random(3)
    for _ in range(26):
        x = rnd.choice([rnd.uniform(140, 270), rnd.uniform(345, 560)])
        y = rnd.uniform(276, 362); r = rnd.uniform(18, 30)
        s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{rnd.choice([C["leaf"], C["leaf2"], C["olive"]])}"/>'
    s += f'<ellipse cx="307" cy="{H - 6}" rx="70" ry="16" fill="{C["sea"]}"/>'
    return s


def s_sanbang():               # 사계: 산방산과 형제섬
    s = sea() + land([(170, HZ), (198, HZ - 22), (230, HZ - 36), (270, HZ - 35), (296, HZ - 20), (318, HZ)], '#4F5E4A')
    s += land([(410, HZ), (418, HZ - 12), (428, HZ - 14), (436, HZ)], C['island']) + land([(446, HZ), (452, HZ - 8), (462, HZ - 9), (468, HZ)], C['island'])
    return s


def s_songak():                # 송악산: 노을과 절벽
    s = f'<circle cx="280" cy="{HZ}" r="32" fill="{C["coral"]}" opacity=".85"/>' + sea(C['sea'], C['sea2'])
    s += f'<path d="M614,{H} L614,226 {smooth([(614, 226), (540, 222), (470, 232), (410, 250)])[1:]} L440,{H} Z" fill="{C["leaf2"]}"/>'
    s += f'<path d="M410,250 L392,300 L404,{H} L446,{H} L432,300 L440,256 Z" fill="#8A6A4E"/>'
    s += foam(HZ + 70, 340, 400, 12, 4, width=2.4)
    return s


def s_coastpath():             # 해안도로 산책길: 흰 모래·검은 돌·옥빛 바다·길
    s = s_beach()
    s += f'<path d="M0,318 Q160,300 330,318 T614,312" stroke="{C["white"]}" stroke-width="7" fill="none" opacity=".9"/>'
    for bx, by, r in ((120, 340, 14), (150, 352, 10), (410, 344, 12), (440, 356, 9)):
        s += f'<ellipse cx="{bx}" cy="{by}" rx="{r * 1.4}" ry="{r}" fill="{C["basalt"]}"/>'
    return s


def s_oreum():                 # 다랑쉬오름: 겹친 오름과 분화구, 억새
    s = land([(100, HZ + 10), (200, HZ - 18), (270, HZ - 26), (340, HZ - 18), (420, HZ + 10)], C['olive'], H)
    s += f'<ellipse cx="270" cy="{HZ - 21}" rx="32" ry="5" fill="#4F6B3B"/>'
    s += land([(300, HZ + 30), (400, HZ - 4), (470, HZ - 10), (560, HZ + 4), (640, HZ + 30)], C['leaf2'], H)
    s += f'<path d="M0,{H} L0,320 Q300,296 614,330 L614,{H} Z" fill="{C["leaf"]}"/>'
    for x in range(200, 600, 34):
        s += leaf(x, 318, 22, 7, -70, C['tan'])
    return s


def s_udo_cliff():             # 우도: 초록 언덕과 절벽, 작은 등대
    s = sea() + f'<path d="M180,{HZ + 2} {smooth([(180, HZ + 2), (260, HZ - 12), (360, HZ - 18), (440, HZ - 22)])[1:]} L446,{HZ + 30} L180,{HZ + 30} Z" fill="{C["leaf2"]}"/>'
    s += f'<path d="M440,{HZ - 22} L446,{HZ + 30} L472,{HZ + 30} L458,{HZ - 16} Z" fill="#5A4A3E"/>'
    s += f'<rect x="446" y="{HZ - 42}" width="6" height="20" fill="{C["white"]}"/><rect x="445" y="{HZ - 46}" width="8" height="5" fill="{C["red"]}"/>'
    return s


def s_seongsan():              # 성산일출봉: 분화구 봉우리 + 풀밭의 말
    s = sea(foams=False) + land([(260, HZ), (284, HZ - 22), (300, HZ - 34), (322, HZ - 38), (392, HZ - 39), (414, HZ - 34), (430, HZ - 18), (446, HZ)], '#3E5A44')
    s += f'<path d="M302,{HZ - 34} Q356,{HZ - 30} 412,{HZ - 34}" stroke="#2C4434" stroke-width="3" fill="none"/>'
    s += f'<path d="M0,{H} L0,300 Q300,284 614,304 L614,{H} Z" fill="{C["olive"]}"/>'
    x, y = 210, 318
    s += (f'<path d="M{x},{y} L{x + 2},{y - 18} Q{x + 18},{y - 26} {x + 38},{y - 20} L{x + 46},{y - 36} L{x + 54},{y - 32} '
          f'L{x + 48},{y - 16} L{x + 46},{y} L{x + 41},{y} L{x + 39},{y - 9} L{x + 9},{y - 9} L{x + 7},{y} Z" fill="{C["brown"]}"/>')
    return s


SCENES = dict(island=s_island, harbor=s_harbor, windmill=s_windmill, road=s_road, lighthouse=s_lighthouse, beach=s_beach,
              dolphins=s_dolphins, waterfall=s_waterfall, sanbang=s_sanbang, songak=s_songak, coastpath=s_coastpath,
              oreum=s_oreum, udo_cliff=s_udo_cliff, seongsan=s_seongsan)

# 엽서 번호 → (왼쪽 꽃·열매, 오른쪽 색면 모양·색, 우표, 아래 풍경, 풍경 설정, 물결 테두리)
DESIGNS = {
    '01': ('tangerine', 'arch', C['sky'], 'sunset', 'harbor', {}, (True, True)),
    '02': ('camellia', 'bird', C['orange'], 'lighthouse', 'island', {'shape': 'dome'}, (True, True)),
    '03': ('palm', 'circle', C['mint'], 'wave', 'beach', {'island': True}, (False, True)),
    '04': ('eulalia', 'wave', C['orange2'], 'sunset', 'windmill', {}, (True, False)),
    '05': ('canola', 'arch', C['sky'], 'halla', 'road', {}, (False, False)),
    '06': ('hydrangea', 'bird', C['orange'], 'lighthouse', 'lighthouse', {'kinds': [C['red']]}, (True, False)),
    '07': ('tangerine', 'circle', C['mint'], 'wave', 'udo_cliff', {}, (True, True)),
    '08': ('eulalia', 'arch', C['orange'], 'halla', 'oreum', {}, (False, False)),
    '09': ('camellia', 'wave', C['sky'], 'horse', 'lighthouse', {'kinds': [C['red'], C['white']]}, (True, False)),
    '10': ('canola', 'circle', C['coral'], 'sunset', 'sanbang', {}, (True, True)),
    '12': ('hydrangea', 'arch', C['coral'], 'sunset', 'dolphins', {}, (False, True)),
    '13': ('eulalia', 'circle', C['sky'], 'wave', 'coastpath', {}, (False, False)),
    '14': ('tangerine', 'wave', C['mint'], 'lighthouse', 'lighthouse', {'kinds': [C['red']]}, (True, False)),
    '15': ('palm', 'arch', C['orange'], 'sunset', 'beach', {'wide': True}, (False, True)),
    '16': ('camellia', 'circle', C['sky'], 'wave', 'beach', {'floats': True}, (False, True)),
    '17': ('canola', 'wave', C['coral'], 'sunset', 'songak', {}, (True, False)),
    '18': ('eulalia', 'bird', C['mint'], 'crater', 'island', {'shape': 'flat'}, (True, True)),
    '19': ('hydrangea', 'arch', C['mint'], 'halla', 'waterfall', {}, (False, False)),
    '20': ('tangerine', 'circle', C['orange'], 'crater', 'seongsan', {}, (False, True)),
}


def grain(seed):
    return (f'<filter id="gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="{seed}" stitchTiles="stitch"/>'
            '<feColorMatrix type="matrix" values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .25  0 0 0 -1.2 1.05"/></filter>'
            f'<rect width="{W}" height="{H}" filter="url(#gr)" opacity=".14"/>')


def build(no):
    motif, ak, acol, st, scene, opt, (wl, wr) = DESIGNS[no]
    body = (f'<rect width="{W}" height="{H}" fill="{C["cream"]}"/>' + accent(ak, acol) + SCENES[scene](**opt)
            + MOTIF[motif]() + frame_waves(wl, wr) + stamp(st, int(no)) + grain(int(no)))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<defs></defs>{body}</svg>')


if __name__ == '__main__':
    out = sys.argv[1]
    for no in DESIGNS:
        p = os.path.join(out, f'postcard-front-{no}.svg')
        open(p, 'w', encoding='utf-8').write(build(no))
        print(no, os.path.getsize(p))
