/* ══ Worker قاسم الافتراضي ═══════════════════════════════════════════
   الموقع (GitHub Pages) بيبعت هنا السؤال + فهرس مختصر للموقع، والـ Worker
   بيكلم Claude API بالمفتاح السري وبيرجّع { reply, link }.
   المفتاح متخزّن كـ secret في Cloudflare، عمره ما بيوصل للمتصفح. */

const MODEL = 'claude-sonnet-5-5'
const MAX_INPUT = 600 // أقصى طول لرسالة الزائر

const SYSTEM = `انت «قاسم الافتراضي»: نسخة ذكاء اصطناعي من أحمد قاسم، صانع محتوى مصري (قناة قاسمز).
- اتكلم بالمصري، بجمل قصيرة ودودة، جملتين أو تلاتة بالكتير لأن الرد بيتقري بصوت عالي.
- لو حد سألك انت مين: قول بوضوح إنك نسخة بالذكاء الاصطناعي من أحمد، مش أحمد نفسه.
- رشّح محتوى من فهرس الموقع اللي جاي مع الرسالة بس، وماتألّفش حلقات أو مقالات مش موجودة.
- ماتدّيش آراء سياسية ولا معلومات شخصية عن أحمد غير اللي في الفهرس.
- رد دايماً بـ JSON بس بالشكل ده: {"reply": "...", "link": {"to": "/path", "label": "..."} }
  والـ link اختياري ولازم يكون "to" من الفهرس.`

function cors(origin, allowed) {
  const ok = allowed.split(',').map((s) => s.trim()).includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed.split(',')[0].trim(),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request, env) {
    const headers = cors(request.headers.get('Origin') || '', env.ALLOWED_ORIGINS || '')
    if (request.method === 'OPTIONS') return new Response(null, { headers })
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers })

    let body
    try {
      body = await request.json()
    } catch {
      return new Response('Bad JSON', { status: 400, headers })
    }
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_INPUT) }))
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return new Response('No question', { status: 400, headers })
    }
    // الرسالة الأولى لازم تبقى من المستخدم
    while (messages.length && messages[0].role !== 'user') messages.shift()

    const catalog = JSON.stringify(body.catalog || {}).slice(0, 12000)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.MODEL || MODEL,
        max_tokens: 300,
        system: `${SYSTEM}\n\nفهرس الموقع:\n${catalog}`,
        messages,
      }),
    })
    if (!res.ok) return new Response(JSON.stringify({ error: 'upstream' }), { status: 502, headers })

    const data = await res.json()
    const text = (data.content || []).map((c) => c.text || '').join('').trim()
    let out
    try {
      out = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    } catch {
      out = { reply: text }
    }
    return new Response(JSON.stringify({ reply: String(out.reply || '').slice(0, 800), link: out.link || null }), {
      headers: { ...headers, 'content-type': 'application/json; charset=utf-8' },
    })
  },
}
