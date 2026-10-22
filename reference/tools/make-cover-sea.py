# 로고 엽서(.pick__cover) 배경: 수채화 느낌의 제주 바다 그림 (사용자 시안을 본떠 그림)
# 옅은 하늘, 수평선 아래 파란 바다와 앞쪽 흰 물거품, 오른쪽 검은 현무암 바위 위 흰 등대, 왼쪽 하늘의 갈매기 세 마리
# 가운데(로고·글자 자리)는 비워 둔다
# 실행: py reference/tools/make-cover-sea.py public/images/postcard-cover-sea.webp
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1228, 754          # 엽서 비율(614×377)의 두 배
rng = np.random.default_rng(3)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def noise(cx, cy, octaves=4, gain=.5):
    """cx×cy 칸 무작위 값을 부드럽게 키운 무늬를 여러 크기로 겹친 것 (0~1)"""
    total = np.zeros((H, W), np.float32); amp = 1.0; norm = 0.0
    for o in range(octaves):
        g = rng.random((max(2, int(cy * 2 ** o)), max(2, int(cx * 2 ** o)))).astype(np.float32)
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        total += amp * np.asarray(img, np.float32) / 255; norm += amp; amp *= gain
    return total / norm


def blur(a, r):
    return np.asarray(Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def lerp(a, b, t):
    return a + (b - a) * t


def col(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


HZ = int(H * .655)                    # 수평선 높이 (글자 '살러 왔다, 살아남기'가 수평선 아래 밝은 바다 위에 오도록)

# ---------- 하늘: 위는 맑은 하늘색, 수평선 쪽으로 옅게. 수채 얼룩 ----------
t = np.clip(yy / HZ, 0, 1)[..., None]
img = lerp(col('#B4D6F0'), col('#EEF6F9'), t ** .85)
blot = noise(5, 3, 4)[..., None]
img = img + (blot - .5) * 22 * np.array([1, .8, .5])
# 수평선 위 옅은 빛
img = img + np.exp(-((yy - HZ) / (H * .06)) ** 2)[..., None] * 8

# ---------- 바다: 수평선 쪽은 짙은 파랑, 앞으로 올수록 옅고 밝게. 가로 붓질 ----------
st = np.clip((yy - HZ) / (H - HZ), 0, 1)[..., None]
sea = lerp(col('#4A8CC9'), col('#A6D0EC'), st ** .9)
streak = noise(3, 46, 4, .55)[..., None]
sea = sea + (streak - .5) * (14 + 30 * st) * np.array([.9, .85, .7])
# 가운데 수평선 근처 햇빛 반사: 글자('살러 왔다, 살아남기')가 놓이는 자리라 밝게 해서 잘 읽히게
glare = np.exp(-((xx - .5 * W) / (.30 * W)) ** 2) * np.exp(-((yy - HZ - .08 * H) / (.11 * H)) ** 2)
glare = glare * (.85 + .3 * (streak[..., 0] - .5))
sea = lerp(sea, col('#F4F9FC'), np.clip(glare * .9, 0, 1)[..., None])
img = np.where((yy >= HZ)[..., None], sea, img)
img[HZ - 1:HZ + 1] = img[HZ - 1:HZ + 1] * .92

# ---------- 물거품: 앞쪽(아래) 물가에 흰 물결 줄 ----------
near = np.clip((yy - (HZ + .10 * H)) / (H - HZ - .10 * H), 0, 1)
fn = noise(4, 70, 3, .5)
bands = np.clip(1 - np.abs(fn - .5) / (.03 + .08 * near), 0, 1) * near ** .8   # 가는 물결 줄
froth = np.clip((noise(10, 30, 4, .6) - (.66 - .4 * near)) * 4, 0, 1) * near ** 1.3
foam = np.clip(bands * .9 + froth, 0, 1)
foam = blur(foam, 1.0)
img = img * (1 - foam[..., None] * .9) + 252 * foam[..., None] * .9

# ---------- 바위: 오른쪽 아래 둥근 현무암 덩어리 (뒤 → 앞 순서로, 하나씩 빛을 받게) ----------
noise_fine = noise(120, 74, 2, .5)                  # 돌 표면의 잔 구멍 느낌
boulders = [  # (중심 x, 중심 y, 가로 반지름, 세로 반지름) — 비율
    (.86, .705, .085, .06), (.95, .66, .07, .09), (1.02, .72, .07, .12),
    (.79, .76, .06, .06), (.90, .78, .08, .08), (.99, .84, .08, .09),
    (.72, .86, .07, .07), (.83, .88, .09, .08), (.94, .93, .09, .08),
    (.64, .95, .07, .05), (.75, .98, .09, .06), (.88, 1.0, .10, .06), (1.0, 1.0, .08, .07),
]
tex = noise(40, 24, 4, .6)
lump = noise(9, 6, 3, .5)                          # 큰 울퉁불퉁함
dark, mid, light = col('#1B2029'), col('#363E4D'), col('#6F7A8C')
for (cx, cy, rx, ry) in sorted(boulders, key=lambda b: b[1]):
    X, Y = cx * W, cy * H; RX, RY = rx * W, ry * H
    # 울퉁불퉁한 테두리
    e = ((xx - X) / RX) ** 2 + ((yy - Y) / RY) ** 2
    e = e * (1 + .55 * (lump - .5) + .16 * (tex - .5))
    m = np.clip((1 - e) * 6, 0, 1)
    if m.max() == 0:
        continue
    # 빛: 왼쪽 위 밝은 점에서 멀수록 어둡게
    hx, hy = X - RX * .35, Y - RY * .45
    dist = np.sqrt(((xx - hx) / RX) ** 2 + ((yy - hy) / RY) ** 2)
    s = np.clip(1 - dist / 1.35, 0, 1)
    c = np.where((s > .5)[..., None], lerp(mid, light, np.clip((s - .5) / .5, 0, 1)[..., None] ** 1.4), lerp(dark, mid, (s / .5)[..., None]))
    c = c + (tex[..., None] - .5) * 70 + (noise_fine[..., None] - .5) * 30
    edge = np.clip((e - .75) * 3, 0, 1)[..., None]            # 테두리는 더 어둡게 (덩어리 사이 구분)
    c = c * (1 - .35 * edge)
    img = img * (1 - m[..., None]) + c * m[..., None]

# 바위에 부딪히는 물보라 (바위 아래쪽 물가에)
spl = Image.new('L', (W, H), 0); dsp = ImageDraw.Draw(spl)
for _ in range(40):
    x = rng.uniform(.58, .70) * W; y = rng.uniform(.95, 1.0) * H; r = rng.uniform(4, 10)
    dsp.ellipse([x - r * 1.4, y - r * .6, x + r * 1.4, y + r * .6], fill=int(rng.uniform(140, 255)))
spl = np.asarray(spl.filter(ImageFilter.GaussianBlur(4)), np.float32)[..., None] / 255
img = img * (1 - spl * .85) + 250 * spl * .85

# ---------- 등대: 맨 위 바위 위에 ----------
base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
lh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lh)
bx, by = .858 * W, .675 * H                 # 바닥 가운데 (바위에 묻히게)
tw_b, tw_t, top_y = .056 * W, .038 * W, .385 * H
ink = (52, 60, 76, 255)
dl.polygon([(bx - tw_b / 2, by), (bx + tw_b / 2, by), (bx + tw_t / 2, top_y), (bx - tw_t / 2, top_y)], fill=(249, 248, 244, 255))
dl.polygon([(bx + tw_b * .14, by), (bx + tw_b / 2, by), (bx + tw_t / 2, top_y), (bx + tw_t * .14, top_y)], fill=(212, 221, 232, 255))
dl.rectangle([bx - tw_t * .9, top_y - .012 * H, bx + tw_t * .9, top_y], fill=ink)               # 전망대 바닥
for k in range(8):                                                                                   # 난간
    x = bx - tw_t * .85 + k * (tw_t * 1.7 / 7)
    dl.line([(x, top_y - .012 * H), (x, top_y - .036 * H)], fill=ink, width=2)
dl.line([(bx - tw_t * .9, top_y - .036 * H), (bx + tw_t * .9, top_y - .036 * H)], fill=ink, width=3)
lt, lb = top_y - .09 * H, top_y - .012 * H                                                           # 등불 칸
dl.rectangle([bx - tw_t * .46, lt, bx + tw_t * .46, lb], fill=ink)
dl.rectangle([bx - tw_t * .3, lt + .013 * H, bx + tw_t * .3, lb - .012 * H], fill=(238, 232, 206, 255))
dl.pieslice([bx - tw_t * .56, lt - .046 * H, bx + tw_t * .56, lt + .02 * H], 180, 360, fill=ink)  # 지붕
dl.line([(bx, lt - .03 * H), (bx, lt - .062 * H)], fill=ink, width=3)
for fy in (.475, .56):                                                                               # 창
    dl.rectangle([bx - .005 * W, fy * H, bx + .005 * W, fy * H + .022 * H], fill=(78, 90, 108, 255))
base.alpha_composite(lh.filter(ImageFilter.GaussianBlur(.5)))
# 등대 아래를 앞쪽 바위가 살짝 덮게 다시 칠한다 (등대가 바위 위에 서 있도록)
front = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
fm = np.zeros((H, W), np.float32)
X, Y, RX, RY = .86 * W, .705 * H, .085 * W, .06 * H
fm = np.clip((1 - (((xx - X) / RX) ** 2 + ((yy - Y) / RY) ** 2)) * 6, 0, 1) * (yy > by - 14)
front.putalpha(Image.fromarray((fm * 255).astype(np.uint8)))
base.alpha_composite(front)

# ---------- 갈매기 세 마리 (왼쪽 하늘) ----------
dg = ImageDraw.Draw(base)
for (gx, gy, s) in ((.15, .43, 1.0), (.22, .37, .82), (.27, .46, .7)):
    x, y, w = gx * W, gy * H, 32 * s
    wd = max(3, int(5 * s))
    dg.arc([x - w, y - w * .45, x, y + w * .45], 200, 330, fill=(92, 112, 140, 255), width=wd)
    dg.arc([x, y - w * .45, x + w, y + w * .45], 210, 340, fill=(92, 112, 140, 255), width=wd)

# ---------- 종이 결: 수채화처럼 ----------
out = np.asarray(base.convert('RGB'), np.float32)
paper = noise(160, 100, 2, .5)[..., None]
out = out * (.97 + .045 * paper)
out = np.asarray(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.5)), np.uint8)
dst = sys.argv[1] if len(sys.argv) > 1 else 'postcard-cover-sea.webp'
Image.fromarray(out).save(dst, quality=88, method=6)
print('saved', dst)
