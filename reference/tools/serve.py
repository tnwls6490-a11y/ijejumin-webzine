# 미리보기 서버: public/ 폴더를 띄운다 (python -m http.server와 같고, 캐시만 끈다).
# 휴대폰(카카오톡 앱 안 브라우저)이 같은 이름으로 바꾼 사진을 예전 것으로 보여 주지 않게,
# 열 때마다 서버에 바뀌었는지 묻게 한다 (Cache-Control: no-cache, 안 바뀌었으면 304로 빠르게 끝난다).
# 실행: python reference/tools/serve.py 8737
import contextlib
import functools
import http.server
import socket
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


class DualStackServer(http.server.ThreadingHTTPServer):
    # localhost(::1)와 와이파이 주소(192.168...) 둘 다 받는다
    address_family = socket.AF_INET6

    def server_bind(self):
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8737
    handler = functools.partial(NoCacheHandler, directory='public')
    with DualStackServer(('::', port), handler) as httpd:
        print(f'Serving public/ on port {port} (no-cache)', flush=True)
        httpd.serve_forever()
