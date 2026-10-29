// Vercel 서버리스 함수: 브라우저 대신 Anthropic API를 호출한다.
// API 키는 Vercel 환경 변수 ANTHROPIC_API_KEY에만 두고, HTML에는 절대 넣지 않는다.

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const QUICK_MODEL = process.env.CLAUDE_QUICK_MODEL || 'claude-haiku-5-5';
const MAX_TOKENS = 1500;          // 한 번 답변의 최대 길이
const MAX_INPUT_CHARS = 20000;    // 너무 긴 요청 차단

// 사건 심문용 비밀 정답. HTML에는 [[CASE_KEY:c1]] 자리표시만 두고, 여기서 채워 넣는다.
const CASE_KEYS = {
  c1: '오류는 1번 줄이다. 결론 ‘m 또는 n은 홀수’의 부정은 ‘m과 n이 모두 짝수’인데 괴도는 ‘m 또는 n이 짝수’라고 썼다. 그래서 괴도의 대우는 거짓이다(반례 m=2, n=3: 서로소인데 m이 짝수). 2번 줄은 슬쩍 둘 다 짝수인 것처럼 썼다. 올바른 대우: ‘m과 n이 모두 짝수이면 m, n은 서로소가 아니다.’\n기준 point: 1번 줄(대우를 세운 줄)을 틀렸다고 지목.\n기준 reason: ‘또는’의 부정은 ‘그리고(모두)’라는 설명, 또는 m=2, n=3처럼 괴도의 대우가 거짓임을 보이는 올바른 반례.\n기준 fix: 올바른 대우 ‘m과 n이 모두 짝수이면 서로소가 아니다’를 제시.',
  c2: '오류는 1번 줄이다. 결론 ‘a = 0이고 b = 0’의 부정은 ‘a ≠ 0 또는 b ≠ 0’인데 괴도는 ‘a ≠ 0이고 b ≠ 0’으로 부정해서 (a ≠ 0, b = 0), (a = 0, b ≠ 0) 두 경우를 놓쳤다. 올바른 증명은 세 경우로 나눠 모두 a² + b² > 0임을 보여 모순을 이끈다.\n기준 point: 1번 줄(결론을 부정한 줄)을 틀렸다고 지목.\n기준 reason: ‘그리고’의 부정은 ‘또는’이라는 설명, 또는 괴도가 놓친 경우(예: a=1, b=0)를 구체적으로 제시.\n기준 fix: 결론의 부정을 ‘a ≠ 0 또는 b ≠ 0’으로 고치거나, 세 경우로 나눠 증명해야 한다고 제시.',
};
const fillCaseKey = text => text.replace(/\[\[CASE_KEY:(c1|c2)\]\]/g, (_, id) => CASE_KEYS[id]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'method_not_allowed', message: 'POST만 허용' });
    return;
  }

  // 같은 사이트(이 Vercel 주소)에서 온 요청만 허용해 남이 키를 쓰지 못하게 한다.
  const allowed = process.env.ALLOWED_ORIGIN; // 예: https://proof-detective.vercel.app
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  const sameHost = origin === `https://${host}` || origin === `http://${host}`;
  if (origin && !sameHost && origin !== allowed) {
    res.status(403).json({ code: 'forbidden_origin', message: '허용되지 않은 주소' });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ code: 'no_key', message: 'ANTHROPIC_API_KEY 환경 변수가 없습니다' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  let messages = body.messages;
  if (typeof messages === 'string') messages = [{ role: 'user', content: messages }];
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ code: 'bad_request', message: 'messages가 필요합니다' });
    return;
  }
  messages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
    .map(m => ({ role: m.role, content: fillCaseKey(String(m.content ?? '')) }));
  if (JSON.stringify(messages).length > MAX_INPUT_CHARS) {
    res.status(413).json({ code: 'too_long', message: '요청이 너무 깁니다' });
    return;
  }

  const payload = {
    model: body.modelTier === 'quick' ? QUICK_MODEL : MODEL,
    max_tokens: MAX_TOKENS,
    messages,
  };
  if (typeof body.system === 'string' && body.system) payload.system = body.system.slice(0, 8000);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      const code = r.status === 429 ? 'rate_limited' : 'api_error';
      res.status(r.status).json({ code, message: data?.error?.message || 'API 오류' });
      return;
    }
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    res.status(200).json({ text, truncated: data.stop_reason === 'max_tokens' });
  } catch (e) {
    res.status(502).json({ code: 'network', message: String(e && e.message || e) });
  }
}
