# 인터뷰 기사 첫 화면 사진의 위쪽을 부드럽게 늘려, 칸에 채웠을 때 인물이 덜 크게 보이게 한다
# (파랑오브레코즈샵 interview-03-cover.jpg → interview-03-cover-tall.jpg, 2026-10-23)
# 사진 맨 위 몇 줄을 위로 길게 늘려 채우고, 늘린 곳과 이음매를 흐리게 겹친다. 원래 사진은 아래쪽에 그대로 남는다
# 실행: py reference/tools/make-cover-tall.py public/images/interview-03-cover.jpg public/images/interview-03-cover-tall.jpg [늘릴 높이=200]
import sys
import numpy as np
from PIL import Image, ImageFilter

src_path, dst_path = sys.argv[1], sys.argv[2]
EXT = int(sys.argv[3]) if len(sys.argv) > 3 else 200

src = Image.open(src_path).convert('RGB')
W, H = src.size
canvas = Image.new('RGB', (W, H + EXT))
strip = src.crop((0, 0, W, 8)).resize((W, EXT + 40), Image.BICUBIC)   # 맨 위 8줄을 늘린 띠
canvas.paste(strip, (0, 0))
canvas.paste(src, (0, EXT))
blur = canvas.filter(ImageFilter.GaussianBlur(28))
y = np.arange(H + EXT, dtype=np.float32)[:, None]
alpha = np.clip((EXT + 46 - y) / 70, 0, 1) * np.ones((1, W), np.float32)   # 위는 흐림, 이음매 아래 46px까지 서서히 원래 사진
mask = Image.fromarray((alpha * 255).astype(np.uint8))
Image.composite(blur, canvas, mask).save(dst_path, quality=84, optimize=True, progressive=True)
print('saved', dst_path, (W, H + EXT))
