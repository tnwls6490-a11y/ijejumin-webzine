# 한경 웹진 공통 기준

> 모든 팀 웹진이 같이 지키는 최소 기준이다. 팀이 고치지 않는다.

## 1. 기술
- 페이지마다 HTML 파일 한 장. HTML과 CSS로만 만든다 (스크립트는 `js/site.js` 하나)
- CSS 파일은 `css/style.css` 하나. Tailwind · Bootstrap 같은 CSS 프레임워크와 React · Vue는 쓰지 않는다
- DB · 로그인 · 입력 폼을 만들지 않는다
- 소리 있는 영상은 YouTube에 올리고 주소로 연결한다

## 2. 경로 · 주소 · 파일
```
public/              → lxwebzine.hankyung.com/teamN/
├── index.html       서브메인
├── articles/        상세페이지 (기사 한 편 = html 한 장)
├── images/          사진 + credits.txt
├── media/           무음 클립 · 배경음악 + credits.txt
├── css/style.css
└── js/site.js
```
- 상대 경로만 쓴다. `/`로 시작하는 경로는 쓰지 않는다. 폴더 대신 `index.html`까지 쓴다
  - 서브메인에서 웹진메인: `../index.html` · 상세페이지에서 서브메인: `../index.html`, 웹진메인: `../../index.html`
- 파일 이름은 영문 소문자 · 숫자 · 하이픈만 쓴다
- 광고 · 공유에는 실제 주소 `lxwebzine.hankyung.com/teamN/`만 쓴다 (테스트 주소 금지)

## 3. 디자인
- 모든 페이지가 `style.css` 하나를 같이 쓴다. 페이지 안에 `<style>`이나 `style="…"`를 쓰지 않는다
- 같은 역할은 모든 페이지에서 같은 모양이다. 한 페이지만 다르게 만들지 않는다
- 휴대폰(360px)부터 맞추고 PC(1280px)까지 넓힌다. 가로 스크롤이 생기지 않는다
- 누르는 요소 높이 44px 이상, 본문 글자 16px 이상, 명도 대비 4.5:1 이상

## 4. 공통 틀 (상단 바 · 헤더 · 메뉴 · 푸터)
- 서브메인과 모든 상세페이지, PC와 휴대폰에서 같다. 아래 코드를 경로 앞부분(`./`, `../`)만 바꿔 그대로 쓴다
- 상단 바 "한경 웹진 메인으로"는 고치지 않는다
- 휴대폰에서 메뉴를 ☰(햄버거)로 숨기거나 빼지 않는다
- 헤더를 사진 위에 겹치지 않는다

서브메인
```html
<div class="topbar"><div class="container"><a href="../index.html">한경 웹진 메인으로</a></div></div>
<header class="wz-header"><div class="container"><a class="wz-name" href="./index.html">{웹진 이름}</a><span class="wz-tagline">{한 줄 소개}</span><nav class="wz-nav" aria-label="카테고리"><a href="./index.html#cat-1">{카테고리1}</a><a href="./index.html#cat-2">{카테고리2}</a><a href="./index.html#cat-3">{카테고리3}</a></nav></div></header>
```
상세페이지
```html
<div class="topbar"><div class="container"><a href="../../index.html">한경 웹진 메인으로</a></div></div>
<header class="wz-header"><div class="container"><a class="wz-name" href="../index.html">{웹진 이름}</a><span class="wz-tagline">{한 줄 소개}</span><nav class="wz-nav" aria-label="카테고리"><a href="../index.html#cat-1">{카테고리1}</a><a href="../index.html#cat-2">{카테고리2}</a><a href="../index.html#cat-3">{카테고리3}</a></nav></div></header>
```
푸터 (모든 페이지 같음)
```html
<footer class="site-footer"><div class="container"><span>{웹진 이름} · 한경 웹진</span><a href="#">개인정보처리방침</a></div></footer>
```

## 5. 사진 · 영상 · 음악
- 직접 찍었거나 사용 허락이 분명한 것만 쓴다. 워터마크가 있거나 출처를 모르는 사진은 쓰지 않는다
- 사람이 나오면 초상권 동의를 받는다
- 원본보다 크게 늘리지 않는다. 사진마다 대체 텍스트(alt)를 쓴다

| 쓰는 곳 | 비율 | 크기 | 용량 |
|---|---|---|---|
| 서브메인 첫 화면 PC / 휴대폰 | 16:9 / 4:5 | 1600×900 / 1080×1350 | 500KB 이하 |
| 공유 미리보기 | 1.91:1 | 1200×630 | 300KB 이하 |
| 기사 사진 | 16:9 · 4:5 · 9:16 | 1600×900 · 1080×1350 · 1080×1920 | 300KB 이하 |

- 무음 클립은 MP4 15초 · 8MB 이하, 배경음악은 MP3 3MB 이하. 배경음악은 자동 재생하지 않는다
- 직접 찍지 않은 사진 · 영상 · 음악은 `credits.txt`에 `파일 이름 | 출처 | 라이선스 | 원본 주소`로 적는다. 출처 없는 음악은 쓰지 않는다

## 6. 머리말
- 페이지마다 `<title>` · `description` · 공유 미리보기(OG) · 대표 주소(canonical)를 넣는다
- og:image와 canonical은 실제 주소 전체(`https://lxwebzine.hankyung.com/teamN/…`)로 쓴다

## 7. 글
- 원고에 없는 사실은 쓰지 않는다
- 협찬 · 광고 글은 "광고"라고 표시한다
