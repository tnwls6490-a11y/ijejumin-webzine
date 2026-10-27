# 공유 미리보기 og-village-test.jpg (1200×630): 테스트 첫 화면처럼 흐린 바다 사진 + 흰 안개 위에 제목 그림과 가리키는 하르방
import sys
from PIL import Image, ImageFilter, ImageDraw
P = sys.argv[1]
W, H = 1200, 630
bg = Image.open(P + '/images/find-test-bg.jpg').convert('RGB')
s = max(W / bg.width, H / bg.height) * 1.04
bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.LANCZOS)
x, y = (bg.width - W) // 2, int((bg.height - H) * .3)
bg = bg.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(3.5))
bg = Image.blend(bg, Image.new('RGB', (W, H), (255, 255, 255)), .24)
title = Image.open(P + '/images/village-test/title.webp').convert('RGBA')
tw = 760; title = title.resize((tw, round(title.height * tw / title.width)), Image.LANCZOS)
bg.paste(title, (W - tw - 60, (H - title.height) // 2 - 10), title)
har = Image.open(P + '/images/village-test/pose-a-06.webp').convert('RGBA')
hh = 470; har = har.resize((round(har.width * hh / har.height), hh), Image.LANCZOS)
bg.paste(har, (60, H - hh - 50), har)
bg.save(P + '/images/og-village-test.jpg', quality=86, optimize=True, progressive=True)
print(bg.size)
