# 증명 탐정 사무소 (고1 수학 증명 게임)

배포 주소: https://ssomath.vercel.app (Vercel 프로젝트 `proof-detective`)

## 배포 흐름
- 이 저장소는 Vercel과 GitHub로 연결되어 있다. `main`에 푸시하면 Vercel이 자동으로 프로덕션 배포한다. 다른 브랜치는 미리보기 배포만 된다.
- 수정과 확인을 마치면 `main`에 커밋하고 `git push origin main`까지 한다.
- 푸시 후 배포 상태는 Vercel API로 확인한다. 환경에 `api.vercel.com`용 Bearer 시크릿이 등록되어 있어서 `curl https://api.vercel.com/...`에 토큰이 자동으로 붙는다.
  - 팀 ID `team_nkFAcaky37xX6lSmLI9zX5CS`, 프로젝트 ID `prj_4wJhDFkgGs30UB5zeFlShIzxHSV9`
  - 예: `curl -sS "https://api.vercel.com/v6/deployments?projectId=prj_4wJhDFkgGs30UB5zeFlShIzxHSV9&teamId=team_nkFAcaky37xX6lSmLI9zX5CS&limit=3"`

## 파일
- `index.html`: 게임 전체 (단일 HTML)
- `claude-shim.js`: `window.claude.use('sample')`를 `/api/claude` 호출로 바꿔 주는 연결 스크립트
- `api/claude.js`: Anthropic API 중계 서버. 키는 Vercel 환경 변수 `ANTHROPIC_API_KEY`에만 있다.

## 지켜야 할 것
- `index.html`의 `<title>` 아래 `<script src="claude-shim.js"></script>` 줄을 지우지 않는다. 지우면 AI 괴도 연결이 끊긴다.
- 사건 비밀 정답(CASES의 `key`)은 HTML에 넣지 않는다. 정답은 `api/claude.js`의 `CASE_KEYS`에 있고, HTML 프롬프트의 `[[CASE_KEY:c1]]` 자리표시를 서버가 채운다.
- Claude 채팅에서 고친 새 버전 HTML을 받아 반영할 때는 위 두 가지를 다시 적용한다. 새 버전에는 보통 shim 줄이 없고 `key`가 들어 있다.
- 구글 설문지 제출, 끌어서 놓기, 컷신, 목소리 코드는 요청이 없으면 건드리지 않는다.

## 확인 방법
- 로컬: `python3 -m http.server`로 띄우고 Playwright로 연다. `/api/claude`는 로컬에 없으므로 테스트에서 가로채거나 가짜 응답을 준다.
- 배포 후: 상단 배지가 'AI 괴도 연결됨'인지, 페이지 소스에 사건 정답 문장이 없는지 확인한다.
