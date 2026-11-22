import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BrandLogo from '../brand/BrandLogo.jsx'
import { atRest, register, spring, step, tune } from '../../motion/springs.js'

/* ══ كتاب القصص — صفحات بتتقلب بالماوس ═══════════════════════════════
   كتاب عربي (الكعب في النص، والقراءة من اليمين): الصفحات اللي لسه
   ماتقرتش على الشمال، وكل ورقة بتتلف حوالين الكعب لليمين.
   - اسحب ركن الصفحة بالماوس (أو بصباعك) والورقة بتمشي مع إيدك وبتتظلّل
     وهي بتترفع، وسيبها: لو عدّت النص بتكمّل، لو لأ بترجع مكانها.
   - دوسة على الصفحة الشمال = اللي بعدها، اليمين = اللي قبلها.
   - الماوس جنب الركن بيرفع طرف الورقة شوية كأنها بتدعوك تقلب.
   - الأسهم في الكيبورد، والفهرس بيوديك للقصة على طول.
   - على الموبايل: صفحة واحدة في المرة بنفس حركة التقليب.
   كل ورقة ليها وش (على الشمال قبل ما تتقلب) وضهر (على اليمين بعدها). */

const MOBILE = '(max-width: 760px)'
const REDUCE = '(prefers-reduced-motion: reduce)'
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
// قلب الورقة: spring من غير ارتداد تقريباً (الورق مابيرتدش)، بيكمّل بسرعة الإيد
const PAGE_SPRING = [150, 23]
// Apple: مكان الوقوف المتوقع من السرعة (decelerationRate 0.995)
const project = (v) => ((v / 1000) * 0.995) / (1 - 0.995)

function useMedia(q) {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const fn = () => setOn(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [q])
  return on
}

/* ── الصفحات ── */
function Cover({ title, subtitle }) {
  return (
    <div className="fb-cover">
      <div className="fb-cover-frame">
        <BrandLogo variant="glass" title="قاسمز" className="fb-cover-logo" />
        <h3 className="fb-cover-title">{title}</h3>
        <p className="fb-cover-sub">{subtitle}</p>
        <span className="fb-cover-orn" aria-hidden="true">
          ✦
        </span>
      </div>
      <i className="fb-cover-sheen" aria-hidden="true" />
    </div>
  )
}

function BackCover() {
  return (
    <div className="fb-cover fb-cover-back">
      <div className="fb-cover-back-body">
        <p className="fb-cover-blurb">
          حكايات قصيرة مكتوبة بعين الكاميرا — من ورا الكواليس، ومن آخر النهار.
        </p>
        <BrandLogo variant="glass" title="قاسمز" className="fb-cover-logo fb-cover-logo-sm" />
      </div>
      <i className="fb-cover-sheen" aria-hidden="true" />
    </div>
  )
}

/* جوّه الغلاف: القماش من الناحية التانية + ورق الأطراف */
function InsideCover({ side }) {
  return (
    <div className={`fb-inside fb-inside-${side}`} aria-hidden="true">
      <div className="fb-inside-paper" />
    </div>
  )
}

function Epigraph() {
  return (
    <div className="fb-paper fb-center">
      <p className="fb-epigraph">«كل لقطة وراها حكاية، وكل حكاية مستنية حد يبص كويس.»</p>
      <p className="fb-small">— قاسم</p>
    </div>
  )
}

function TitlePage({ title, author }) {
  return (
    <div className="fb-paper fb-center">
      <p className="fb-kicker">مجموعة قصصية</p>
      <h3 className="fb-title-page">{title}</h3>
      <p className="fb-author">{author}</p>
      <span className="fb-rule" aria-hidden="true" />
      <p className="fb-small">مكتوبة بلغة الصورة قبل ما تبقى كلام.</p>
    </div>
  )
}

function Contents({ tales, onJump }) {
  return (
    <div className="fb-paper">
      <p className="fb-kicker">الفهرس</p>
      <ol className="fb-toc">
        {tales.map((t, i) => (
          <li key={t.id}>
            <button type="button" onClick={(e) => onJump(e, i)} data-noflip>
              <span className="fb-toc-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="fb-toc-t">{t.title}</span>
              <span className="fb-toc-dots" aria-hidden="true" />
              <span className="fb-toc-p">{4 + i * 2}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="fb-hint">اسحب ركن الصفحة أو دوس عليها علشان تقلب ←</p>
    </div>
  )
}

function TaleImage({ tale, n, page }) {
  return (
    <div className="fb-paper fb-plate">
      <p className="fb-chapter">الفصل {n}</p>
      <div className="fb-plate-img">
        <img src={tale.cover} alt="" loading="lazy" draggable="false" />
      </div>
      <p className="fb-plate-cap">{tale.title}</p>
      <span className="fb-folio">{page}</span>
    </div>
  )
}

function TaleText({ tale, page }) {
  const paras = tale.body?.length ? tale.body : [tale.excerpt]
  return (
    <div className="fb-paper">
      <h3 className="fb-tale-title">{tale.title}</h3>
      <div className="fb-tale-body">
        {paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="fb-tale-note">— {tale.author}</p>
      <span className="fb-folio">{page}</span>
    </div>
  )
}

function Closing() {
  return (
    <div className="fb-paper fb-center">
      <p className="fb-kicker">آخر الكتاب</p>
      <h3 className="fb-title-page">وفي قصص جاية</h3>
      <p className="fb-small">كل ما تتكتب قصة جديدة، الكتاب ده بيزيد ورقة.</p>
    </div>
  )
}

function Endpaper() {
  return <div className="fb-paper fb-endpaper" aria-hidden="true" />
}

export default function FlipBook({ tales, title = 'قصص قاسم', author = 'أحمد قاسم' }) {
  const mobile = useMedia(MOBILE)
  const reduce = useMedia(REDUCE)
  const bookRef = useRef(null)
  const leafRefs = useRef([])
  const anim = useRef({ raf: 0, drag: null, peek: null })
  const [current, setCurrentState] = useState(0) // عدد الأوراق المقلوبة
  const [stack, setStack] = useState(0) // بيعيد ترتيب الطبقات بعد أي حركة
  const currentRef = useRef(0)
  currentRef.current = current
  const setCurrent = useCallback((n) => {
    currentRef.current = n
    setCurrentState(n)
    setStack((x) => x + 1)
  }, [])

  const jumpRef = useRef(() => {})
  const onJump = useCallback((e, i) => {
    e.stopPropagation()
    jumpRef.current(i)
  }, [])

  // ترتيب الصفحات (يمين ثم شمال في كل فرشة)
  const pages = useMemo(() => {
    /* كل ورقة = وش (شمال قبل القلب) + ضهر (يمين بعده):
       الغلاف | جوّه الغلاف — العنوان | الفهرس — الإهداء | صورة القصة —
       نص القصة | صورة اللي بعدها … — الختام | جوّه الغلاف الخلفي — الغلاف الخلفي
       فكل قصة بتيجي في فرشة واحدة: الصورة يمين والنص شمال. */
    const list = [
      <Cover key="cover" title={title} subtitle={author} />,
      <InsideCover key="in-front" side="front" />,
      <TitlePage key="title" title={title} author={author} />,
      <Contents key="toc" tales={tales} onJump={onJump} />,
      <Epigraph key="epi" />,
    ]
    tales.forEach((t, i) => {
      list.push(<TaleImage key={t.id + 'i'} tale={t} n={i + 1} page={4 + i * 2} />)
      list.push(<TaleText key={t.id + 't'} tale={t} page={5 + i * 2} />)
    })
    list.push(<Closing key="closing" />)
    if (list.length % 2) list.push(<Endpaper key="end" />)
    list.push(<InsideCover key="in-back" side="back" />, <BackCover key="back" />)
    return list
  }, [tales, title, author, onJump])

  // الأوراق: على الديسكتوب كل ورقة صفحتين، على الموبايل صفحة واحدة
  const leaves = useMemo(() => {
    if (mobile) return pages.map((p) => ({ front: p, back: <InsideCover side="back" /> }))
    const out = []
    for (let i = 0; i < pages.length; i += 2)
      out.push({ front: pages[i], back: pages[i + 1] ?? <Endpaper /> })
    return out
  }, [pages, mobile])
  const N = leaves.length

  // الفهرس: رقم القصة → عدد الأوراق اللي لازم تتقلب
  jumpRef.current = (i) => {
    const pageIdx = 5 + i * 2 // صفحة الصورة (ضهر ورقة → يمين الفرشة)
    const target = mobile ? pageIdx : (pageIdx + 1) / 2
    flipTo(target)
  }

  useEffect(() => {
    if (currentRef.current > N) setCurrent(N)
  }, [N, setCurrent])

  /* زاوية كل ورقة: 0 = مقفولة على الشمال، 180 = مقلوبة على اليمين */
  const paint = useCallback((i, deg) => {
    const el = leafRefs.current[i]
    if (!el) return
    const a = clamp(deg, 0, 180)
    el.style.transform = `rotateY(${a}deg)`
    const lift = Math.sin((a * Math.PI) / 180)
    el.style.setProperty('--lift', lift.toFixed(3))
    el.style.setProperty('--side', a > 90 ? '1' : '0')
    el.dataset.moving = a > 0.5 && a < 179.5 ? 'true' : ''
  }, [])

  // ترتيب الطبقات + الزوايا لما الحالة تتغير
  useLayoutEffect(() => {
    leaves.forEach((_, i) => {
      const el = leafRefs.current[i]
      if (!el) return
      const flipped = i < current
      el.style.zIndex = flipped ? String(i + 1) : String(N - i + 1)
      paint(i, flipped ? 180 : 0)
    })
    // الكتاب المقفول بيتحرك للنص
    const book = bookRef.current
    if (book)
      book.dataset.state = mobile
        ? 'open'
        : current === 0
          ? 'closed'
          : current === N
            ? 'end'
            : 'open'
  }, [current, stack, leaves, N, paint, mobile])

  /* قلب ورقة لحد زاوية: spring بيبدأ من الزاوية الحالية وبسرعة الإيد
     (من غير قفزة لو اتمسكت تاني في نص الحركة) */
  const animate = useCallback(
    (i, from, to, done, v0 = 0) => {
      anim.current.finish?.()
      const el = leafRefs.current[i]
      if (el) {
        el.style.zIndex = String(N + 5)
        delete el.dataset.peek
      }
      if (reduce) {
        paint(i, to)
        done?.()
        return
      }
      const sp = spring(from, PAGE_SPRING)
      sp.t = to
      sp.v = v0
      tune(sp, PAGE_SPRING)
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        paint(i, to)
        unreg()
        anim.current.finish = null
        anim.current.unreg = null
        done?.()
      }
      const unreg = register({
        frame: (dt) => step(sp, dt),
        render: () => {
          if (finished) return
          paint(i, sp.x)
          if (atRest(sp, 0.05)) finish()
        },
        idle: () => finished,
      })
      anim.current.finish = finish
      // إمساك الورقة في نص الحركة: نوقف الـspring من غير ما نكمّل
      anim.current.unreg = () => {
        finished = true
        unreg()
        anim.current.finish = null
        anim.current.unreg = null
      }
    },
    [N, paint, reduce],
  )

  const next = useCallback(() => {
    anim.current.finish?.()
    const c = currentRef.current
    if (c >= N || anim.current.drag) return
    animate(c, 0, 180, () => setCurrent(c + 1))
  }, [N, animate, setCurrent])

  const prev = useCallback(() => {
    anim.current.finish?.()
    const c = currentRef.current
    if (c <= 0 || anim.current.drag) return
    animate(c - 1, 180, 0, () => setCurrent(c - 1))
  }, [animate, setCurrent])

  // للفهرس: يقلب ورقة ورا ورقة بسرعة لحد الهدف
  const flipTo = (target) => {
    const go = () => {
      const c = currentRef.current
      if (c === target) return
      if (c < target)
        animate(c, 0, 180, () => {
          setCurrent(c + 1)
          setTimeout(go, 40)
        })
      else
        animate(c - 1, 180, 0, () => {
          setCurrent(c - 1)
          setTimeout(go, 40)
        })
    }
    go()
  }

  /* ── السحب بالماوس ── */
  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('[data-noflip]')) return
    const book = bookRef.current
    const r = book.getBoundingClientRect()
    const half = mobile ? r.width : r.width / 2
    const leftSide = mobile ? true : e.clientX < r.left + r.width / 2
    const c = currentRef.current
    // الشمال = نقلب لقدّام، اليمين = نرجع (على الموبايل: يمين الصفحة = رجوع)
    let dir = leftSide ? 1 : -1
    if (mobile) dir = e.clientX < r.left + r.width * 0.6 ? 1 : -1
    if ((dir === 1 && c >= N) || (dir === -1 && c <= 0)) return
    anim.current.finish?.()
    anim.current.peek = null
    leafRefs.current.forEach((el) => el && delete el.dataset.peek)
    const i = dir === 1 ? c : c - 1
    const el = leafRefs.current[i]
    if (el) el.style.zIndex = String(N + 5)
    anim.current.drag = {
      i,
      dir,
      x0: e.clientX,
      half,
      moved: false,
      deg: dir === 1 ? 0 : 180,
      t: performance.now(),
      v: 0,
    }
    book.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    const d = anim.current.drag
    const book = bookRef.current
    if (!d) {
      // تلميح: طرف الورقة بيترفع لما الماوس يقرب من الركن
      if (e.pointerType !== 'mouse' || reduce) return
      const r = book.getBoundingClientRect()
      const c = currentRef.current
      const nearLeft = e.clientX - r.left < r.width * (mobile ? 0.2 : 0.12) && c < N
      const want = nearLeft ? c : null
      if (want !== anim.current.peek && !anim.current.finish) {
        // التلميح بس اللي عليه transition ناعمة (data-peek)، القلب نفسه spring
        const setPeek = (i, deg) => {
          const el = leafRefs.current[i]
          if (el) el.dataset.peek = 'true'
          paint(i, deg)
        }
        if (anim.current.peek !== null) setPeek(anim.current.peek, 0)
        anim.current.peek = want
        if (want !== null) setPeek(want, 12)
      }
      return
    }
    const dx = e.clientX - d.x0
    if (Math.abs(dx) > 4) d.moved = true
    // السحب لليمين بيقلب لقدّام (الورقة رايحة ناحية اليمين)
    const span = d.half * (mobile ? 1.1 : 1.25)
    const p = clamp((d.dir === 1 ? dx : -dx) / span, 0, 1)
    const deg = d.dir === 1 ? p * 180 : 180 - p * 180
    const now = performance.now()
    d.v = (deg - d.deg) / Math.max(1, now - d.t)
    d.deg = deg
    d.t = now
    paint(d.i, deg)
  }

  const onPointerUp = () => {
    const d = anim.current.drag
    if (!d) return
    anim.current.drag = null
    const c = currentRef.current
    if (!d.moved) {
      // دوسة من غير سحب = قلب عادي
      paint(d.i, d.dir === 1 ? 0 : 180)
      if (d.dir === 1) next()
      else prev()
      return
    }
    // Apple: نختار الوجهة من مكان الوقوف المتوقع (السرعة)، ونسلّم السرعة للـspring
    const vDeg = d.v * 1000 // درجة/ثانية
    const landing = d.deg + project(vDeg)
    const toEnd = landing > 90
    const target = toEnd ? 180 : 0
    const nextCurrent = d.dir === 1 ? (toEnd ? c + 1 : c) : toEnd ? c : c - 1
    animate(d.i, d.deg, target, () => setCurrent(nextCurrent), vDeg)
  }

  const onPointerLeave = () => {
    if (anim.current.peek !== null && !anim.current.drag) {
      paint(anim.current.peek, 0)
      anim.current.peek = null
    }
  }

  // الكيبورد: في العربي السهم الشمال = الصفحة اللي بعدها
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'PageDown') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
      e.preventDefault()
      prev()
    } else if (e.key === 'Home') {
      e.preventDefault()
      flipTo(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      flipTo(N)
    }
  }

  useEffect(() => () => anim.current.unreg?.(), [])

  const label = mobile
    ? `صفحة ${Math.min(current + 1, N)} من ${N}`
    : `فرشة ${current + 1} من ${N + 1}`

  return (
    <div className="fb-wrap" data-mobile={mobile ? 'true' : undefined}>
      <div
        ref={bookRef}
        className="fb-book"
        role="region"
        aria-roledescription="كتاب"
        aria-label={`${title} — ${label}. اسحب الصفحة أو استخدم الأسهم علشان تقلب`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
      >
        <div className="fb-block fb-block-right" aria-hidden="true" />
        <div className="fb-block fb-block-left" aria-hidden="true" />
        {leaves.map((leaf, i) => (
          <div
            key={i}
            ref={(el) => (leafRefs.current[i] = el)}
            className="fb-leaf"
            aria-hidden={mobile ? i !== current : !(i === current || i === current - 1)}
          >
            <div className="fb-face fb-front">
              {leaf.front}
              <i className="fb-shade" aria-hidden="true" />
            </div>
            <div className="fb-face fb-back">
              {leaf.back}
              <i className="fb-shade" aria-hidden="true" />
            </div>
          </div>
        ))}
        <i className="fb-spine" aria-hidden="true" />
      </div>

      <div className="fb-controls">
        <button type="button" onClick={prev} disabled={current === 0} aria-label="الصفحة اللي فاتت">
          <ChevronRight aria-hidden="true" />
        </button>
        <span className="fb-count" aria-live="polite">
          {label}
        </span>
        <button type="button" onClick={next} disabled={current >= N} aria-label="الصفحة اللي بعدها">
          <ChevronLeft aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
