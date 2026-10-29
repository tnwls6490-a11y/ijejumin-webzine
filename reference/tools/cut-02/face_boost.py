# 백록마케팅 누끼: 얼굴 둘레만 부드럽게 밝힌다 (몸·오토바이는 그대로). 색은 새 사진, 모양은 mask-final
# 사용: py -I face_boost.py <새 사진> <mask-final.png> <저장할 cut.webp> <배율>
import sys
import numpy as np
from PIL import Image
src, mpath, out, k = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
photo = Image.open(src).convert('RGB').resize((1600, 900), Image.LANCZOS)
alpha = Image.open(mpath).convert('L').resize((1600, 900), Image.LANCZOS)
rgb = np.asarray(photo).astype(np.float32)
H, W = rgb.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy, rx, ry = 898.0, 252.0, 44.0, 54.0          # 얼굴(이마~턱) 가운데·반지름
r = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
w = np.clip((1.6 - r) / 0.6, 0, 1)                  # 얼굴 안은 1, 반지름 1~1.6배 사이에서 부드럽게 0으로
w = w * w * (3 - 2 * w)
gain = 1 + (k - 1) * w
rgb2 = np.clip(rgb * gain[..., None], 0, 255).astype(np.uint8)
cut = Image.fromarray(rgb2); cut.putalpha(alpha)
cut.save(out, 'WEBP', quality=86, method=6)
print(out, 'ok', 'gain max', round(float(gain.max()), 3))
