import { useEffect, useState } from 'react'

const page = `${import.meta.env.BASE_URL}about-ahmed/index.html`
export default function About() {
  const [status, setStatus] = useState('loading')
  const [attempt, retry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    // SPA hosts may serve the main app with status 200 for a missing HTML file.
    fetch(`${import.meta.env.BASE_URL}about-ahmed/manifest.json`, {signal: controller.signal, cache: 'no-cache'})
      .then(async r => { if (!r.ok || (await r.json()).entry !== 'index.html') throw Error(); setStatus('ready') })
      .catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => controller.abort()
  }, [attempt])
  return <section aria-labelledby="about-title" dir="rtl">
    <h1 id="about-title" className="mb-4 text-2xl font-bold">عن أحمد</h1>
    {status==='ready' ? <iframe title="تجربة لاندو نوريس التفاعلية" src={page} sandbox="allow-scripts allow-pointer-lock" referrerPolicy="no-referrer" className="block w-full rounded-2xl border-0 bg-black" style={{height:'max(28rem, calc(100dvh - 9rem))'}} /> : status==='loading' ? <p role="status">جارٍ تحميل التجربة…</p> : <div role="status"><p>تعذّر تحميل ملفات العرض.</p><button className="mt-3 underline" onClick={()=>retry(i=>i+1)}>إعادة المحاولة</button></div>}
  </section>
}
