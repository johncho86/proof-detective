// claude.ai 아티팩트의 window.claude.use('sample')를 흉내 내는 연결 스크립트.
// 게임 코드는 그대로 두고, 이 파일만 게임 스크립트보다 먼저 불러오면
// AI 요청이 Vercel의 /api/claude 로 가서 항상 'AI 괴도 연결됨' 상태가 된다.
(function () {
  if (window.claude && typeof window.claude.use === 'function') return; // 진짜 아티팩트 안에서는 그대로 둔다
  var ENDPOINT = '/api/claude';

  function toMessages(input) {
    if (typeof input === 'string') return [{ role: 'user', content: input }];
    return input;
  }

  async function call(input, opts) {
    opts = opts || {};
    var r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: toMessages(input), system: opts.system, modelTier: opts.modelTier }),
      signal: opts.signal,
    });
    var data = {};
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw { code: data.code || 'error', message: data.message || ('HTTP ' + r.status) };
    var out = { text: data.text || '', truncated: !!data.truncated };
    if (typeof opts.onText === 'function') {
      try { opts.onText({ text: out.text, delta: out.text }); } catch (e) {}
    }
    return out;
  }

  function parseJSON(text) {
    var t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    try { return JSON.parse(t); } catch (e) {}
    var m = t.match(/[\[{][\s\S]*[\]}]/);
    if (m) return JSON.parse(m[0]);
    throw { code: 'bad_json', message: 'JSON으로 읽을 수 없는 답변' };
  }

  var sample = function (input, opts) { return call(input, opts); };
  sample.json = async function (input, opts) {
    var res = await call(input, opts);
    return parseJSON(res.text);
  };
  sample.limits = async function () { return { images: false }; };

  window.claude = {
    use: function (name) { return Promise.resolve(name === 'sample' ? sample : null); },
  };
})();
