# 로고 엽서(.pick__cover) 배경: 맑은 하늘과 뭉게구름 그림을 만든다 (사용자 시안을 본떠, 사진처럼 보이게)
# 1) 구름을 둥근 봉우리(반구) 여러 개로 짜고, 이음매가 생기지 않게 부드럽게 합친다(소프트맥스)
# 2) 봉우리 가장자리는 잔 무늬로 살짝 흩뜨려 솜처럼 만들고
# 3) 왼쪽 위 햇빛으로 밝은 면·그늘을, 봉우리 사이 틈과 구름 밑면은 회청색으로 칠한다
# 실행: py reference/tools/make-cover-sky.py public/images/postcard-cover-sky.webp
import sys
import numpy as np
from PIL import Image

W, H = 1228, 754          # 엽서 그림 비율(614×377)의 두 배
S = 2.0                   # 아래 좌표(614×377 기준)를 픽셀로
rng = np.random.default_rng(5)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def fbm(octaves=6, base=6, gain=.55):
    """여러 크기의 무작위 무늬를 겹친 잔 결 (0~1)"""
    total = np.zeros((H, W), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        cells = base * (2 ** o)
        g = rng.random((max(2, int(cells * H / W)), cells)).astype(np.float32)
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        total += amp * (np.asarray(img, np.float32) / 255)
        norm += amp
        amp *= gain
    return total / norm


def blur(a, r):
    """가우시안 흐림 (가로·세로 따로). 가장자리는 거울처럼 이어 붙여 그림 끝에 줄이 생기지 않게"""
    if r <= 0:
        return a
    p = int(3 * r)
    x = np.arange(-p, p + 1)
    k = np.exp(-(x * x) / (2 * r * r)).astype(np.float32); k /= k.sum()
    a = np.pad(a, p, mode='reflect')
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 1, a)
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 0, a)
    return a[p:-p, p:-p]


# ---------- 하늘 ----------
t = (yy / H)[..., None]
top, bottom = np.array([136, 199, 243], np.float32), np.array([214, 237, 251], np.float32)
sky = top * (1 - t ** 1.15) + bottom * (t ** 1.15)

# ---------- 구름 봉우리 (x, y, 반지름) — 614×377 기준 ----------
puffs = [
    # 왼쪽 아래: 낮고 넓은 무리
    (40, 336, 78), (124, 352, 60), (186, 370, 40),
    (18, 262, 44), (70, 250, 42), (120, 280, 38), (160, 312, 32), (202, 342, 26), (232, 366, 20),
    (44, 226, 24), (96, 234, 22), (142, 260, 19), (180, 292, 17), (216, 324, 15),
    # 오른쪽: 높이 솟은 탑
    (566, 334, 92), (482, 364, 56), (636, 300, 82),
    (582, 242, 64), (522, 262, 46), (634, 212, 56),
    (576, 164, 46), (536, 188, 34), (614, 152, 42),
    (560, 120, 27), (596, 122, 25), (530, 150, 21), (506, 216, 25), (484, 262, 23), (464, 304, 22), (446, 340, 20), (428, 368, 16),
]

warp = fbm(5, 6, .55) - .5      # 봉우리 가장자리를 울퉁불퉁하게
fine = fbm(6, 30, .6) - .5      # 솜 같은 잔 결
K = .07                         # 합치는 부드러움 (작을수록 봉우리 사이가 매끈)
acc = np.zeros((H, W), np.float64)
for (px, py, r) in puffs:
    rr = r * S
    d = np.sqrt((xx - px * S) ** 2 + (yy - py * S) ** 2) / rr
    d = d * (1 + .14 * warp + .05 * fine)
    h = np.sqrt(np.clip(1 - d * d, 0, 1)) * rr
    acc += np.where(h > 0, np.exp(K * h), 0)
hf = np.where(acc > 0, np.log(np.maximum(acc, 1e-9)) / K, 0).astype(np.float32)
hf = np.maximum(hf, 0)

# ---------- 모양(투명도): 가장자리를 솜처럼 부드럽게 ----------
alpha = np.clip(hf / (5 * S) + .35 * fine, 0, 1)
alpha = blur(alpha, 1.3)
alpha = alpha * alpha * (3 - 2 * alpha)

# ---------- 빛과 그늘 ----------
hs = blur(hf, 2.2)
gy, gx = np.gradient(hs)
lx, ly, lz = -.50, -.68, .54
nz = np.full_like(hs, .9)
nl = np.sqrt(gx * gx + gy * gy + nz * nz)
lam = np.clip((-gx * lx - gy * ly + nz * lz) / nl, 0, 1)
crev = np.clip((blur(hf, 12) - hf) / (10 * S), 0, 1)              # 봉우리 사이 틈
mask = alpha > .5
topy = np.where(mask.any(axis=0), mask.argmax(axis=0), H).astype(np.float32)
depth = np.clip((yy - topy[None, :]) / (200 * S), 0, 1)             # 구름 윗끝에서 내려갈수록
mottle = fbm(5, 12, .55) - .5                                       # 구름 속 은은한 얼룩
light = .36 + .76 * lam - .36 * crev - .26 * depth + .06 * fine + .14 * mottle
light = np.clip(light, 0, 1)

lit = np.array([255, 253, 246], np.float32)
mid = np.array([234, 239, 245], np.float32)
dark = np.array([168, 188, 210], np.float32)
l3 = light[..., None]
cloud = np.where(l3 > .55, mid + (lit - mid) * ((l3 - .55) / .45), dark + (mid - dark) * (l3 / .55))
thin = (1 - np.clip(hf / (14 * S), 0, 1))[..., None]                # 가장자리는 하늘빛이 살짝 비친다
cloud = cloud * (1 - .25 * thin) + sky * (.25 * thin)

# ---------- 높은 하늘 새털구름·아래 아지랑이 ----------
wisp = np.exp(-((yy - 62 * S) / (14 * S)) ** 2) * np.clip(fbm(5, 5) - .5, 0, 1) * 1.4
wisp += np.exp(-((yy - 30 * S) / (9 * S)) ** 2) * np.clip(fbm(5, 7) - .55, 0, 1) * 1.2
wisp = blur(wisp, 4) * .5
haze = blur(np.clip((yy / H - .82) * 3.2, 0, 1) * (fbm(4, 3) * .6 + .4), 8) * .28

out = sky
out = out * (1 - wisp[..., None]) + 252 * wisp[..., None]
out = out * (1 - haze[..., None]) + 248 * haze[..., None]
out = out * (1 - alpha[..., None]) + cloud * alpha[..., None]
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB')
dst = sys.argv[1] if len(sys.argv) > 1 else 'postcard-cover-sky.webp'
img.save(dst, quality=88, method=6)
print('saved', dst, img.size)
