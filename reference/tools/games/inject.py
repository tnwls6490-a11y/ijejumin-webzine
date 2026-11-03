# 마을 테스트 페이지 게임 글(언어별 사전)을 site.js에 넣는다
#   reference/tools/games/i18n/{ko,en,ja,zh}.json → public/js/site.js '게임 고르기 블록'의 const GAME_I18N = {...};
# 게임 글을 고칠 때는 이 JSON을 고치고: py -I reference/tools/games/inject.py public/js/site.js
#   네 언어 파일은 짜임(열쇠·배열 길이)이 ko.json과 같아야 한다. 밸런스 게임·실화냐 첫 화면 글을 바꿨으면 fonts.py도 다시 (글꼴 주소 ?v=N 올리기)
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'i18n')
SITE = sys.argv[1]
s = open(SITE, encoding='utf-8', newline='').read()
key = 'const GAME_I18N = '
a = s.index(key) + len(key)
_, n = json.JSONDecoder().raw_decode(s[a:])

def shape(o):
    if isinstance(o, dict): return {k: shape(v) for k, v in o.items()}
    if isinstance(o, list): return [shape(v) for v in o]
    return 's'
data = {}
for l in ('ko', 'en', 'ja', 'zh'):
    data[l] = json.load(open(os.path.join(D, l + '.json'), encoding='utf-8'))
    assert shape(data[l]) == shape(data['ko']), l + '.json 짜임이 ko.json과 다르다'
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
if s[a:a + n] == blob: print('바뀐 글 없음'); sys.exit()
s = s[:a] + blob + s[a + n:]
open(SITE, 'w', encoding='utf-8', newline='').write(s)
print('넣음', len(blob.encode('utf-8')), 'bytes')
