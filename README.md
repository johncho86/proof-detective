# 증명 탐정 사무소 · Vercel 배포 안내

이 폴더를 Vercel에 올리면 4번(반례 판정)과 신상 광고가 항상 AI로 동작합니다.
API 키는 Vercel 서버에만 저장되고, 학생 브라우저에는 보이지 않습니다.

## 폴더 구성

```
proof-detective-vercel/
├─ index.html        ← 게임 (연결 스크립트 한 줄 추가됨)
├─ claude-shim.js    ← AI 연결 스크립트 (수정 불필요)
├─ api/claude.js     ← 키를 숨겨 Anthropic API를 부르는 중계 서버
└─ package.json
```

## 1. 게임 HTML 준비

이미 끝났습니다. `index.html` 은 원래 게임에 `claude-shim.js` 를 불러오는 줄 하나만 `<title>` 아래에 추가한 파일입니다.

## 2. GitHub에 올리기

1. github.com 에서 새 저장소를 만듭니다 (예: `proof-detective`, Private 가능).
2. "uploading an existing file" 을 눌러 이 폴더의 파일을 전부 끌어다 놓고 Commit 합니다.
   (`api` 폴더도 폴더째 끌어다 놓으면 됩니다.)

## 3. Vercel에서 배포

1. vercel.com → **Add New… → Project** → 방금 만든 GitHub 저장소 **Import**.
2. Framework Preset 은 **Other** 그대로 둡니다.
3. **Environment Variables** 에 추가:
   - `ANTHROPIC_API_KEY` = 본인의 Anthropic API 키 (`sk-ant-...`)
4. **Deploy** 를 누릅니다. 1분 뒤 `https://프로젝트이름.vercel.app` 주소가 나옵니다.

이미 배포한 뒤에 키를 넣었다면 **Deployments → … → Redeploy** 를 한 번 눌러야 적용됩니다.

## 4. 확인

배포된 주소를 열었을 때 오른쪽 위 배지가 **"AI 괴도 연결됨"** 이면 성공입니다.
4번에서 반례를 써서 판정을 눌러 보세요.

## 선택 설정 (환경 변수)

| 이름 | 기본값 | 설명 |
|---|---|---|
| `CLAUDE_MODEL` | `claude-sonnet-5-5` | 판정에 쓸 모델 |
| `CLAUDE_QUICK_MODEL` | `claude-haiku-5-5` | 이 게임의 모든 AI 판정에 쓰이는 모델 (게임이 빠른 모드로 요청함) |
| `ALLOWED_ORIGIN` | (없음) | 다른 주소에서 게임을 열 때만 그 주소를 적습니다 |

판정을 더 꼼꼼하게 하려면 `CLAUDE_QUICK_MODEL` 을 `claude-sonnet-5-5` 로 바꾸세요. 비용은 늘어납니다.

## 꼭 해 둘 것

- console.anthropic.com → **Billing / Limits** 에서 월 사용 한도를 정해 두세요.
  중계 서버는 다른 사이트의 요청을 막지만, 주소를 아는 사람이 직접 호출하는 것까지 완전히 막지는 못합니다.
- API 키를 HTML, GitHub 파일, 채팅 등에 붙여 넣지 마세요. Vercel 환경 변수에만 넣습니다.
