import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import {
  Home,
  Scale,
  History,
  Video,
  BookOpen,
  Radio,
  Film,
  Tv,
  ChevronDown,
  Search,
  ArrowUpLeft,
  Check,
} from 'lucide-react'
import {
  playGlassDropdown,
  playGlassHover,
  playGlassKeystroke,
  playGlassMorph,
  playGlassTap,
} from '../../utils/glassSound.js'
import { prefetchRoute } from '../../utils/liquidGlassEngine.js'
import NavHost from '../ai/NavHost.jsx'
import { GlassLayer } from '../../../1-qassim-liquid-glass.js'
import DaylightThemeSwitch from '../ui/DaylightThemeSwitch.jsx'
import GlassHoverBubble from '../glass/GlassHoverBubble.jsx'
import GlassIcon from '../ui/GlassIcon.jsx'
import { setTheme, useTheme } from '../../utils/theme.js'
import { CloseSpinIcon, MenuMorphIcon } from '../ui/AnimatedIcons.jsx'
// ============================================================================
// إعادة تصميم بأسلوب Apple — مع الحفاظ على الشكل والبنية والروابط والتسميات.
// المراجع:
//  • شريط apple.com الحي: مادة backdrop-filter: saturate(180%) blur(20px)
//    وحافة علوية فاتحة و hairline واحد — انظر .qassimz-apple-nav-shell في
//    src/index.css (التحليل: github.com/tszaks/design-thesis — APPLE_WEB.md).
//  • WWDC25 Session 219 «Meet Liquid Glass»: الزجاج السائل للطبقة الوظيفية
//    العائمة فقط، ولا زجاج فوق زجاج، و«materialize» بدل التلاشي الصريح.
//  • WWDC18 Session 803 «Designing Fluid Interfaces»: النوابض قابلة
//    للمقاطعة وتبدأ من القيمة الظاهرة، damping 1.0 افتراضياً بلا overshoot،
//    والاستجابة على pointer-down لا على release (انظر SKILL.md المرفق).
// التطبيق: نوابض bounce: 0 / duration 0.4، مادة blur(20px) saturate(180%)،
// تصغير 0.97 خلال 100ms على pointer-down لروابط الناڤبار، تتبع -0.01em،
// وسطح صلب عند prefers-reduced-transparency. السلوك الحالي (القوائم،
/// Ctrl+K، مبدّل الثيم، القائمة المحمولة، أصوات glassSound) لم يتغير.
// ============================================================================


const DROPDOWN_CLOSE_DELAY = 360

// فيزياء تحول العناصر الداخلية بسلاسة — بأسلوب Apple (WWDC18 «Designing Fluid
// Interfaces»): نوابض حرجة التخميد افتراضياً (damping 1.0، بلا overshoot) تستأنف
// من القيمة الظاهرة على الشاشة ويمكن مقاطعتها وإعادة توجيهها في أي لحظة.
// في Framer Motion تُترجم إلى bounce: 0 مع duration 0.4 (انظر SKILL.md).
// كل تغيير في حجم الكبسولة (التصغير مع السكرول، فتح البحث) بيمشي على نفس
// النابض ده كـFLIP (transform بس) — مفيش max-width/width بيتحرك فمفيش تقطيع
const NAV_LAYOUT_SPRING = { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }

const morphSpring = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
}

// فيزياء انزلاق الكبسولة الزجاجية الموحدة (مشتركة بين النوف بار وقائمة الفِردِكت)
const tabSlideSpring = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
}

// فيزياء Spring Dropdown لقائمة اقتراحات البحث
const dropdownHeightSpring = {
  type: 'spring',
  bounce: 0,
  duration: 0.35,
}

const dropdownVerticalSpring = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
}

const dropdownOpacitySpring = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
}

// حركات قائمة الفِردِكت المنسدلة المرتبطة بزرها
const verdictMenuVariants = {
  hidden: {
    opacity: 0,
    y: -6,
    scale: 0.95,
    transition: {
      duration: 0.16,
      ease: [0.32, 0, 0.67, 0],
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      bounce: 0,
      duration: 0.35,
    },
  },
}

// حركات قائمة الموبايل المستقلة
const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: {
      duration: 0.16,
      ease: [0.32, 0, 0.67, 0],
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      bounce: 0,
      duration: 0.35,
    },
  },
}

const PLAN_POP = { stiffness: 520, damping: 16, mass: 0.8 }
const PLAN_SOFT = { stiffness: 260, damping: 24, mass: 1 }
const PLAN_FADE = { stiffness: 420, damping: 32, mass: 1 }

// فيزياء Highlight المطاطي لنتائج البحث
const SEARCH_HIGHLIGHT_LEAD = { type: 'spring', stiffness: 620, damping: 36 }
const SEARCH_HIGHLIGHT_TRAIL = { type: 'spring', stiffness: 200, damping: 20 }

const SEARCH_INDEX = [
  { title: 'الرئيسية', sub: 'الواجهة العامة لمنصة قاسم', to: '/', icon: Home },
  { title: 'حُكم السينما — THE VERDICT', sub: 'مراجعات وتقييمات الأفلام', to: '/verdict/movies', icon: Film },
  { title: 'حُكم المسلسلات — THE VERDICT', sub: 'قراءات في المواسم والحلقات', to: '/verdict/series', icon: Tv },
  { title: 'أرشيف الحكايات', sub: 'صور نادرة وقصص من التاريخ', to: '/stories', icon: History },
  { title: 'الفيديوهات', sub: 'حلقات وثائقية ولقطات قصيرة', to: '/videos', icon: Video },
  { title: 'المقالات', sub: 'قراءات ومقالات متأنية', to: '/articles', icon: BookOpen },
  { title: 'أون إير — ON AIR', sub: 'منشورات وحضور قاسم الحيّ', to: '/on-air', icon: Radio },
]

const NAV_ITEMS = [
  { to: '/stories', label: 'أرشيف الحكايات', icon: History },
  { to: '/videos', label: 'الفيديوهات', icon: Video },
  { to: '/articles', label: 'المقالات', icon: BookOpen },
  { to: '/on-air', label: 'أون إير', badge: 'ON AIR', icon: Radio },
]

function resolveRouteKey(pathname) {
  if (pathname.startsWith('/verdict') || pathname.startsWith('/reviews')) return 'verdict'
  if (pathname === '/') return '/'
  if (pathname.startsWith('/stories')) return '/stories'
  if (pathname.startsWith('/videos')) return '/videos'
  if (pathname.startsWith('/articles')) return '/articles'
  if (pathname.startsWith('/on-air')) return '/on-air'
  return '/'
}

function CleanNavIcon({ Icon, active }) {
  return <GlassIcon icon={Icon} size="md" active={active} />
}

// مؤشر Highlight زجاجي مطاطي لنتائج البحث
function SearchElasticHighlight({ containerRef, rowRefs, activeIndex, visible }) {
  const topMV = useMotionValue(0)
  const bottomMV = useMotionValue(46)
  const heightMV = useTransform([topMV, bottomMV], ([t, b]) => Math.max(0, b - t))
  const opacitySpring = useSpring(0, { stiffness: 400, damping: 32 })
  const prevTopRef = useRef(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const rowEl = activeIndex >= 0 ? rowRefs.current[activeIndex] : null

    if (!visible || !container || !rowEl) {
      opacitySpring.set(0)
      return
    }

    const nextTop = rowEl.offsetTop
    const nextBottom = nextTop + rowEl.offsetHeight

    if (prevTopRef.current === null || opacitySpring.get() < 0.05) {
      topMV.jump(nextTop)
      bottomMV.jump(nextBottom)
    } else {
      const movingDown = nextTop >= prevTopRef.current
      animate(topMV, nextTop, movingDown ? SEARCH_HIGHLIGHT_TRAIL : SEARCH_HIGHLIGHT_LEAD)
      animate(bottomMV, nextBottom, movingDown ? SEARCH_HIGHLIGHT_LEAD : SEARCH_HIGHLIGHT_TRAIL)
    }

    prevTopRef.current = nextTop
    opacitySpring.set(1)
  }, [activeIndex, visible, containerRef, rowRefs, topMV, bottomMV, opacitySpring])

  return (
    <motion.span
      aria-hidden="true"
      style={{
        y: topMV,
        height: heightMV,
        opacity: opacitySpring,
        willChange: 'transform, height, opacity',
      }}
      className="qz-search-highlight pointer-events-none absolute inset-x-0 top-0 z-0 rounded-2xl"
    />
  )
}

// قائمة الفِردِكت المنسدلة بكبسولة موحدة مطابقة لكبسولة الـ Navbar تمامًا
function VerdictPlanDropdown({ currentPath, onNavigateSection, onClose, onHoverSound }) {
  const isSeriesDefault = currentPath.startsWith('/verdict/series')
  const [selected, setSelected] = useState(isSeriesDefault ? 'series' : 'movies')
  const [pillReady, setPillReady] = useState(false)

  const switchTrackRef = useRef(null)
  const moviesBtnRef = useRef(null)
  const seriesBtnRef = useRef(null)
  const hasInitRef = useRef(false)

  // نفس كبسولة وفيزياء النوف بار الرئيسية بالضبط
  const segPillX = useSpring(0, tabSlideSpring)
  const segPillW = useSpring(0, tabSlideSpring)
  const segPillVelocity = useVelocity(segPillX)
  const segPillScaleX = useTransform(segPillVelocity, (v) => 1 + Math.min(Math.abs(v) / 2150, 0.22))
  const segPillScaleY = useTransform(segPillVelocity, (v) => 1 - Math.min(Math.abs(v) / 5400, 0.08))

  const syncSegPill = useCallback(
    (tab, instant = false) => {
      const btn = tab === 'series' ? seriesBtnRef.current : moviesBtnRef.current
      if (!btn) return
      const nextX = Math.round(btn.offsetLeft)
      const nextW = Math.round(btn.offsetWidth)
      if (nextW === 0) return

      if (instant) {
        segPillX.jump(nextX)
        segPillW.jump(nextW)
        hasInitRef.current = true
        setPillReady(true)
      } else {
        segPillX.set(nextX)
        segPillW.set(nextW)
      }
    },
    [segPillW, segPillX]
  )

  useLayoutEffect(() => {
    syncSegPill(selected, !hasInitRef.current)
  }, [selected, syncSegPill])

  useEffect(() => {
    const trackEl = switchTrackRef.current
    if (!trackEl) return undefined
    const ro = new ResizeObserver(() => {
      syncSegPill(selected, false)
    })
    ro.observe(trackEl)
    return () => ro.disconnect()
  }, [selected, syncSegPill])

  const handlePick = (tab) => {
    if (tab === selected) return
    playGlassTap()
    setSelected(tab)
  }

  const isSeries = selected === 'series'

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          handlePick(e.key === 'ArrowLeft' ? 'series' : 'movies')
        }
      }}
      className="relative z-10 p-2.5 text-right"
    >
      {/* ترويسة تربط القائمة بصريًا بقسم الفِردِكت */}
      <div className="mb-2 flex items-center justify-between border-b border-white/10 px-2 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
          <Scale className="size-3.5 text-[color:var(--qz-mint)]" />
          <span>تصفّح الفِردِكت</span>
        </span>
        <span className="rounded-full border border-white/14 bg-white/8 px-2 py-0.5 font-sans text-[8.5px] font-semibold tracking-[0.14em] text-[color:var(--qz-mint)]">
          THE VERDICT
        </span>
      </div>

      {/* Segmented Track واحد بكبسولة زجاجية متحركة واحدة من نفس عائلة مؤشر النوف بار */}
      <div
        ref={switchTrackRef}
        role="radiogroup"
        aria-label="أقسام الفِردِكت"
        className="relative flex items-center gap-1 rounded-full border-y border-x-0 border-white/12 bg-white/[0.04] p-1"
      >
        {pillReady && (
          <motion.span
            aria-hidden="true"
            style={{
              left: 0,
              x: segPillX,
              width: segPillW,
              scaleX: segPillScaleX,
              scaleY: segPillScaleY,
              willChange: 'transform, width',
            }}
            className="qz-nav-pill pointer-events-none absolute inset-y-1 z-0 rounded-full"
          />
        )}

        <button
          ref={moviesBtnRef}
          type="button"
          role="radio"
          aria-checked={!isSeries}
          onMouseEnter={() => {
            onHoverSound()
            prefetchRoute('/verdict/movies')
          }}
          onClick={() => handlePick('movies')}
          className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-1.5 text-xs transition-colors duration-200 ${
            !isSeries
              ? 'font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]'
              : 'font-medium text-white/75 hover:text-white'
          }`}
        >
          <Film className="size-3.5 text-[color:var(--qz-mint)]" />
          <span>حُكم السينما</span>
        </button>

        <button
          ref={seriesBtnRef}
          type="button"
          role="radio"
          aria-checked={isSeries}
          onMouseEnter={() => {
            onHoverSound()
            prefetchRoute('/verdict/series')
          }}
          onClick={() => handlePick('series')}
          className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-1.5 text-xs transition-colors duration-200 ${
            isSeries
              ? 'font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]'
              : 'font-medium text-white/75 hover:text-white'
          }`}
        >
          <Tv className="size-3.5 text-[color:var(--qz-mint)]" />
          <span>حُكم المسلسلات</span>
        </button>
      </div>

      {/* تفاصيل القسم المختار داخل الفِردِكت */}
      <div className="px-2 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlassIcon icon={isSeries ? Tv : Film} size="md" active />
            <span className="text-sm font-bold text-white">
              {isSeries ? 'حُكم المسلسلات' : 'حُكم السينما'}
            </span>
          </div>
          <motion.span
            key={selected}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', ...PLAN_POP }}
            style={{ transformOrigin: '100% 50%' }}
            className="rounded-full border border-emerald-300/30 bg-emerald-400/18 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-emerald-200"
          >
            {isSeries ? 'SERIES' : 'MOVIES'}
          </motion.span>
        </div>

        <div className="relative mt-2 h-5 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={selected}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ type: 'spring', ...PLAN_FADE }}
              className="text-xs text-[color:var(--qz-mint)]/85"
            >
              {isSeries
                ? 'قراءات وتحليلات معمّقة في المواسم والحلقات'
                : 'مراجعات وتقييمات سينمائية شاملة للأفلام'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <ul className="mt-1 space-y-1.5 px-2 pb-3 text-xs text-white/85">
        <li className="flex items-center gap-2">
          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white/12 text-white">
            <Check className="size-2.5 stroke-[2.8]" />
          </span>
          <span>تقييم نقدي وبصري متكامل</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white/12 text-white">
            <Check className="size-2.5 stroke-[2.8]" />
          </span>
          <span>بطاقات مراجعة قابلة للمشاركة</span>
        </li>
        <motion.li
          initial={false}
          animate={{
            height: isSeries ? 24 : 0,
            opacity: isSeries ? 1 : 0,
          }}
          transition={{ type: 'spring', ...PLAN_SOFT }}
          className="flex items-center gap-2 overflow-hidden"
        >
          <motion.span
            animate={{ scale: isSeries ? 1 : 0 }}
            transition={{ type: 'spring', ...PLAN_POP, delay: isSeries ? 0.12 : 0 }}
            className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-400 text-[#051F20]"
          >
            <Check className="size-2.5 stroke-[3]" />
          </motion.span>
          <span className="text-emerald-200">متابعة تطور المواسم حلقة بحلقة</span>
        </motion.li>
      </ul>

      <motion.button
        type="button"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', ...PLAN_POP }}
        onMouseEnter={onHoverSound}
        onClick={(e) => {
          playGlassDropdown(false)
          onClose()
          onNavigateSection(e, isSeries ? '/verdict/series' : '/verdict/movies', 'verdict')
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white py-2 text-xs font-bold text-[#051F20] shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-colors hover:bg-[color:var(--qz-mint)]"
      >
        <span>{isSeries ? 'دخول حُكم المسلسلات' : 'دخول حُكم السينما'}</span>
        <ArrowUpLeft className="size-3.5" />
      </motion.button>
    </div>
  )
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [, startTransition] = useTransition()
  const theme = useTheme()

  // الفصل الصريح بين القسم النشط الفعلي (activeKey) ومعاينة Hover/Dropdown المؤقتة
  const [activeKey, setActiveKey] = useState(() => resolveRouteKey(location.pathname))
  const [hoveredKey, setHoveredKey] = useState(null)
  const [verdictOpen, setVerdictOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const glassNavRef = useRef(null)
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)
  const [isCompact, setIsCompact] = useState(false)
  const [lensReady, setLensReady] = useState(false)
  const [verdictAnchor, setVerdictAnchor] = useState({ right: 144, originX: 250 })
  const [suggestionsHeight, setSuggestionsHeight] = useState(0)

  // مراجع العناصر (DOM Refs)
  const linksTrackRef = useRef(null)
  const itemRefs = useRef({})
  const dropdownHostRef = useRef(null)
  const verdictBtnRef = useRef(null)
  const verdictMenuRef = useRef(null)
  const searchBoxRef = useRef(null)
  const searchDropdownRef = useRef(null)
  const searchListInnerRef = useRef(null)
  const searchRowRefs = useRef({})
  const searchInputRef = useRef(null)
  const mobileBtnRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // مراجع المؤقتات والحالات الفورية
  const hasMountedRef = useRef(false)
  const wasSearchExpandedRef = useRef(false)
  const verdictCloseTimerRef = useRef(null)
  const searchSuggestionsCloseTimerRef = useRef(null)
  const mobileCloseTimerRef = useRef(null)
  const focusTimerRef = useRef(null)
  const lastHoverSoundAtRef = useRef(0)

  const activeKeyRef = useRef(activeKey)
  const hoveredKeyRef = useRef(hoveredKey)
  const searchExpandedRef = useRef(searchExpanded)
  const searchSuggestionsOpenRef = useRef(searchSuggestionsOpen)
  const verdictOpenRef = useRef(verdictOpen)
  const mobileMenuOpenRef = useRef(mobileMenuOpen)

  activeKeyRef.current = activeKey
  hoveredKeyRef.current = hoveredKey
  searchExpandedRef.current = searchExpanded
  searchSuggestionsOpenRef.current = searchSuggestionsOpen
  verdictOpenRef.current = verdictOpen
  mobileMenuOpenRef.current = mobileMenuOpen

  const triggerHoverSound = useCallback(() => {
    const now = performance.now()
    if (now - lastHoverSoundAtRef.current < 48) return
    lastHoverSoundAtRef.current = now
    playGlassHover()
  }, [])

  // المؤشر الزجاجي الموحد: ينتقل بسلاسة بين Hover و Verdict و Active دون Fade Out
  const navPillX = useSpring(0, tabSlideSpring)
  const navPillW = useSpring(0, tabSlideSpring)
  const navPillLean = useSpring(0, { stiffness: 185, damping: 18, mass: 0.78 })
  const navPillRenderX = useTransform([navPillX, navPillLean], ([x, lean]) => x + lean)
  const navPillVelocity = useVelocity(navPillX)
  const navPillScaleX = useTransform(navPillVelocity, (v) => 1 + Math.min(Math.abs(v) / 2150, 0.22))
  const navPillScaleY = useTransform(navPillVelocity, (v) => 1 - Math.min(Math.abs(v) / 5400, 0.08))

  // تفاعل ضوء داخلي خافت يتبع الماوس في المنتصف فقط بعيدًا عن الجوانب
  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)
  const smoothGlowX = useSpring(rawMouseX, { stiffness: 180, damping: 17 })
  const smoothGlowY = useSpring(rawMouseY, { stiffness: 180, damping: 17 })
  const glowOpacity = useSpring(0, { stiffness: 220, damping: 24 })
  const NAV_GLOW_RADIUS = 150
  const navGlowX = useTransform(smoothGlowX, (v) => v - NAV_GLOW_RADIUS)
  const navGlowY = useTransform(smoothGlowY, (v) => v - NAV_GLOW_RADIUS)

  const handleTrackMouseMove = useCallback(
    (event) => {
      const item = event.target.closest?.('[data-qz-navitem]')
      if (!item) return
      const r = item.getBoundingClientRect()
      if (r.width === 0) return
      const rel = (event.clientX - (r.left + r.width / 2)) / (r.width / 2)
      navPillLean.set(Math.max(-1, Math.min(1, rel)) * 5)
    },
    [navPillLean]
  )

  const handleNavMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }) => {
      const { left, top } = currentTarget.getBoundingClientRect()
      rawMouseX.set(clientX - left)
      rawMouseY.set(clientY - top)
      if (glowOpacity.get() < 0.99) {
        glowOpacity.set(1)
      }
    },
    [rawMouseX, rawMouseY, glowOpacity]
  )

  // مزامنة قياسات المؤشر الموحد مع DOM الفعلي
  const syncNavIndicator = useCallback(
    (targetKey, instant = false) => {
      const itemEl = itemRefs.current[targetKey]
      if (!itemEl) return

      const nextX = Math.round(itemEl.offsetLeft)
      const nextW = Math.round(itemEl.offsetWidth)
      if (nextW === 0) return

      if (instant) {
        navPillX.jump(nextX)
        navPillW.jump(nextW)
        hasMountedRef.current = true
        setLensReady(true)
      } else {
        navPillX.set(nextX)
        navPillW.set(nextW)
      }
    },
    [navPillW, navPillX]
  )

  // تحديث المسار النشط عند تغير الرابط دون إعادة تشغيل أي Animation للرأس أو اللوجو
  useLayoutEffect(() => {
    const nextRouteKey = resolveRouteKey(location.pathname)
    setActiveKey(nextRouteKey)
    setHoveredKey(null)
    setVerdictOpen(false)
    setMobileMenuOpen(false)
    setSearchSuggestionsOpen(false)
    setSearchExpanded(false)
    setSearchQuery('')
  }, [location.pathname])

  // تحديد القسم المستهدف للمؤشر: الأولوية للـ Hover، ثم فتح الفِردِكت، ثم القسم النشط الحقيقي
  const indicatorTargetKey = hoveredKey || (verdictOpen ? 'verdict' : activeKey)

  useLayoutEffect(() => {
    if (!searchExpanded) {
      const returningFromSearch = wasSearchExpandedRef.current
      wasSearchExpandedRef.current = false
      syncNavIndicator(indicatorTargetKey, !hasMountedRef.current || returningFromSearch)
    } else {
      wasSearchExpandedRef.current = true
    }
  }, [indicatorTargetKey, searchExpanded, syncNavIndicator])

  // مراقبة تغير أبعاد المسار أو تحميل الخطوط
  useEffect(() => {
    if (searchExpanded) return
    const trackEl = linksTrackRef.current
    if (!trackEl) return

    let rafId = null
    const resync = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        if (!searchExpandedRef.current && hasMountedRef.current) {
          const currentTarget =
            hoveredKeyRef.current || (verdictOpenRef.current ? 'verdict' : activeKeyRef.current)
          syncNavIndicator(currentTarget, false)
        }
      })
    }

    const ro = new ResizeObserver(resync)
    ro.observe(trackEl)
    Object.values(itemRefs.current).forEach((el) => {
      if (el && trackEl.contains(el)) ro.observe(el)
    })

    if (document.fonts?.ready) {
      document.fonts.ready.then(resync).catch(() => {})
    }

    return () => {
      ro.disconnect()
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [searchExpanded, syncNavIndicator])

  // محاذاة قائمة الفِردِكت مع زرها فعليًا عبر getBoundingClientRect
  const updateVerdictAlignment = useCallback(() => {
    const btnEl = verdictBtnRef.current
    const hostEl = dropdownHostRef.current
    if (!btnEl || !hostEl) return

    const btnRect = btnEl.getBoundingClientRect()
    const hostRect = hostEl.getBoundingClientRect()
    const menuWidth = Math.min(320, window.innerWidth - 24)

    const rawRight = hostRect.right - btnRect.right
    const maxRight = Math.max(0, hostRect.width - menuWidth)
    const clampedRight = Math.max(0, Math.min(rawRight, maxRight))

    const btnCenterX = btnRect.left + btnRect.width / 2
    const menuLeft = hostRect.right - clampedRight - menuWidth
    const originX = Math.max(24, Math.min(menuWidth - 24, btnCenterX - menuLeft))

    setVerdictAnchor({ right: Math.round(clampedRight), originX: Math.round(originX) })
  }, [])

  useLayoutEffect(() => {
    if (!verdictOpen) return undefined
    updateVerdictAlignment()
    window.addEventListener('resize', updateVerdictAlignment, { passive: true })
    return () => window.removeEventListener('resize', updateVerdictAlignment)
  }, [verdictOpen, updateVerdictAlignment])

  // مراقبة وضع التصغير (Compact Mode) بناءً على موضع Scroll الحقيقي فقط
  useEffect(() => {
    let rafId = null

    const evaluateCompact = () => {
      const y = window.scrollY
      setIsCompact((prev) => {
        if (!prev && y > 58) return true
        if (prev && y < 22) return false
        return prev
      })
    }

    const handleScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        evaluateCompact()
      })
    }

    evaluateCompact()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  // دوال إدارة المؤقتات المستقلة لكل قائمة منسدلة
  const clearVerdictTimer = useCallback(() => {
    window.clearTimeout(verdictCloseTimerRef.current)
    verdictCloseTimerRef.current = null
  }, [])

  const clearSearchSuggestionsTimer = useCallback(() => {
    window.clearTimeout(searchSuggestionsCloseTimerRef.current)
    searchSuggestionsCloseTimerRef.current = null
  }, [])

  const clearMobileTimer = useCallback(() => {
    window.clearTimeout(mobileCloseTimerRef.current)
    mobileCloseTimerRef.current = null
  }, [])

  const handleVerdictEnter = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      clearVerdictTimer()
    },
    [clearVerdictTimer]
  )

  const handleVerdictLeave = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      if (!verdictOpenRef.current) return
      clearVerdictTimer()
      verdictCloseTimerRef.current = window.setTimeout(() => {
        verdictCloseTimerRef.current = null
        setVerdictOpen((open) => {
          if (open) playGlassDropdown(false)
          return false
        })
      }, DROPDOWN_CLOSE_DELAY)
    },
    [clearVerdictTimer]
  )

  const handleSearchAreaEnter = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      clearSearchSuggestionsTimer()
    },
    [clearSearchSuggestionsTimer]
  )

  const handleSearchAreaLeave = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      clearSearchSuggestionsTimer()
      if (!searchExpandedRef.current || !searchSuggestionsOpenRef.current) return
      searchSuggestionsCloseTimerRef.current = window.setTimeout(() => {
        searchSuggestionsCloseTimerRef.current = null
        if (searchExpandedRef.current) {
          setSearchSuggestionsOpen(false)
        }
      }, DROPDOWN_CLOSE_DELAY)
    },
    [clearSearchSuggestionsTimer]
  )

  const handleMobileEnter = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      clearMobileTimer()
    },
    [clearMobileTimer]
  )

  const handleMobileLeave = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      if (!mobileMenuOpenRef.current) return
      clearMobileTimer()
      mobileCloseTimerRef.current = window.setTimeout(() => {
        mobileCloseTimerRef.current = null
        setMobileMenuOpen((open) => {
          if (open) playGlassDropdown(false)
          return false
        })
      }, DROPDOWN_CLOSE_DELAY)
    },
    [clearMobileTimer]
  )

  const openInlineSearch = useCallback(() => {
    clearVerdictTimer()
    clearMobileTimer()
    clearSearchSuggestionsTimer()

    if (verdictOpenRef.current) {
      playGlassDropdown(false)
      setVerdictOpen(false)
    }
    if (mobileMenuOpenRef.current) {
      setMobileMenuOpen(false)
    }

    playGlassMorph(true)
    setHoveredKey(null)
    setActiveSearchIndex(0)
    setSearchExpanded(true)
    setSearchSuggestionsOpen(true)

    window.clearTimeout(focusTimerRef.current)
    focusTimerRef.current = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 65)
  }, [clearMobileTimer, clearSearchSuggestionsTimer, clearVerdictTimer])

  const closeInlineSearch = useCallback(() => {
    clearSearchSuggestionsTimer()
    window.clearTimeout(focusTimerRef.current)
    searchInputRef.current?.blur()
    playGlassMorph(false)
    setSearchSuggestionsOpen(false)
    setSearchExpanded(false)
    setSearchQuery('')
    setActiveSearchIndex(0)
  }, [clearSearchSuggestionsTimer])

  // إغلاق القوائم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target

      if (verdictOpenRef.current) {
        const insideVerdict =
          verdictBtnRef.current?.contains(target) || verdictMenuRef.current?.contains(target)
        if (!insideVerdict) {
          clearVerdictTimer()
          playGlassDropdown(false)
          setVerdictOpen(false)
        }
      }

      if (searchExpandedRef.current || searchSuggestionsOpenRef.current) {
        const insideSearch =
          searchBoxRef.current?.contains(target) || searchDropdownRef.current?.contains(target)
        if (!insideSearch) {
          closeInlineSearch()
        }
      }

      if (mobileMenuOpenRef.current) {
        const insideMobile =
          mobileBtnRef.current?.contains(target) || mobileMenuRef.current?.contains(target)
        if (!insideMobile) {
          clearMobileTimer()
          playGlassDropdown(false)
          setMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [clearMobileTimer, clearVerdictTimer, closeInlineSearch])

  // اختصارات لوحة المفاتيح العامة: Ctrl+K / Cmd+K و Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (searchExpandedRef.current) {
          closeInlineSearch()
        } else {
          openInlineSearch()
        }
        return
      }

      if (event.key === 'Escape') {
        if (searchExpandedRef.current || searchSuggestionsOpenRef.current) {
          closeInlineSearch()
        }
        if (verdictOpenRef.current) {
          clearVerdictTimer()
          playGlassDropdown(false)
          setVerdictOpen(false)
        }
        if (mobileMenuOpenRef.current) {
          clearMobileTimer()
          playGlassDropdown(false)
          setMobileMenuOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearMobileTimer, clearVerdictTimer, closeInlineSearch, openInlineSearch])

  // إغلاق واجهة البحث الموسعة بالكامل (الحقل + الاقتراحات) والقوائم عند Scroll الفعلي للصفحة
  useEffect(() => {
    if (!verdictOpen && !searchExpanded && !searchSuggestionsOpen && !mobileMenuOpen) {
      return undefined
    }
    const anchorY = window.scrollY
    let rafId = null

    const handleScrollClose = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        if (Math.abs(window.scrollY - anchorY) < 10) return

        if (verdictOpenRef.current) {
          clearVerdictTimer()
          playGlassDropdown(false)
          setVerdictOpen(false)
        }
        if (searchExpandedRef.current || searchSuggestionsOpenRef.current) {
          closeInlineSearch()
        }
        if (mobileMenuOpenRef.current) {
          clearMobileTimer()
          playGlassDropdown(false)
          setMobileMenuOpen(false)
        }
      })
    }

    window.addEventListener('scroll', handleScrollClose, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScrollClose)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [
    verdictOpen,
    searchExpanded,
    searchSuggestionsOpen,
    mobileMenuOpen,
    clearVerdictTimer,
    clearMobileTimer,
    closeInlineSearch,
  ])

  // تنظيف جميع المؤقتات عند تفكيك المكون
  useEffect(
    () => () => {
      window.clearTimeout(verdictCloseTimerRef.current)
      window.clearTimeout(searchSuggestionsCloseTimerRef.current)
      window.clearTimeout(mobileCloseTimerRef.current)
      window.clearTimeout(focusTimerRef.current)
    },
    []
  )

  // التنقل السلس بين الأقسام من أي موضع في الصفحة
  const handleSectionSelect = useCallback(
    (event, targetPath, sectionKey = targetPath) => {
      event.preventDefault()

      clearVerdictTimer()
      clearMobileTimer()
      clearSearchSuggestionsTimer()

      const isRouteChange = location.pathname !== targetPath
      setActiveKey(sectionKey)
      setHoveredKey(null)
      syncNavIndicator(sectionKey, false)
      setVerdictOpen(false)
      setMobileMenuOpen(false)
      setSearchSuggestionsOpen(false)
      setSearchExpanded(false)
      setSearchQuery('')
      playGlassTap()

      if (isRouteChange) {
        startTransition(() => {
          navigate(targetPath)
        })
      }
    },
    [
      clearMobileTimer,
      clearSearchSuggestionsTimer,
      clearVerdictTimer,
      location.pathname,
      navigate,
      syncNavIndicator,
    ]
  )

  const filteredSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return SEARCH_INDEX
    return SEARCH_INDEX.filter((item) => `${item.title} ${item.sub}`.toLowerCase().includes(q))
  }, [searchQuery])

  // قياس الارتفاع الفعلي لنتائج البحث لتمدد Spring Dropdown من الأعلى للأسفل بدقة
  useLayoutEffect(() => {
    if (!searchSuggestionsOpen) return undefined
    const innerEl = searchListInnerRef.current
    if (!innerEl) return undefined

    const measure = () => {
      setSuggestionsHeight(innerEl.offsetHeight)
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(innerEl)
    return () => ro.disconnect()
  }, [searchSuggestionsOpen, filteredSearch])

  // التنقل بلوحة المفاتيح داخل نتائج البحث
  const handleSearchInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!searchSuggestionsOpen) {
        setSearchSuggestionsOpen(true)
        setActiveSearchIndex(0)
        return
      }
      if (filteredSearch.length > 0) {
        setActiveSearchIndex((prev) => (prev + 1) % filteredSearch.length)
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (searchSuggestionsOpen && filteredSearch.length > 0) {
        setActiveSearchIndex((prev) => (prev - 1 + filteredSearch.length) % filteredSearch.length)
      }
    } else if (event.key === 'Enter' && searchSuggestionsOpen && filteredSearch[activeSearchIndex]) {
      event.preventDefault()
      const chosen = filteredSearch[activeSearchIndex]
      closeInlineSearch()
      handleSectionSelect(event, chosen.to, resolveRouteKey(chosen.to))
    }
  }

  const isVerdictActive = activeKey === 'verdict'
  const isLightTheme = false // مفيش ثيم فاتح

  return (
    <header
      dir="rtl"
      className="fixed inset-x-0 top-3.5 z-[70] isolation-isolate px-2.5 sm:top-4 sm:px-5"
    >
      {/* كبسولة الزجاج السائل الرئيسية — خالية تمامًا من اللمعان الجانبي ووميض التقاط الصور */}
      <motion.nav
        data-glass-skip=""
        layout="position"
        transition={NAV_LAYOUT_SPRING}
        style={{ borderRadius: 9999 }}
        onMouseMove={handleNavMouseMove}
        onMouseLeave={() => {
          setHoveredKey(null)
          navPillLean.set(0)
          glowOpacity.set(0)
        }}
        aria-label="التنقل الرئيسي"
        className={`isolate group/nav relative z-20 mx-auto flex items-center justify-between gap-2 overflow-hidden rounded-full px-2.5 py-1.5 ${
          searchExpanded
            ? 'w-full max-w-2xl'
            : isCompact
              ? 'w-fit max-w-full'
              : 'w-full max-w-[78rem]'
        }`}
      >
        {/* Keep the lens on a real pill, never on Framer's scale-corrected radius. */}
        <div
          ref={glassNavRef}
          data-glass-host=""
          aria-hidden="true"
          className="qassimz-apple-nav-shell qz-liquid-nav pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full"
          style={{ borderRadius: 9999 }}
        >
          <GlassLayer
            material="clear"
            live
            tint={0.09}
            blur={2}
            swell={false}
            optics={{
              tintColor: theme === 'green' ? '#123b36' : theme === 'red' ? '#48241d' : '#303654',
              refraction: 0.65, bendDepth: 0.8, bendCurve: 6,
              dispersion: 0.06, magnify: 0, rim: 0.12, fresnel: 0.18,
              inner: 0.06, reflection: 0.12, caustic: 0, mirror: 0,
              light: 0.4, cursorLight: false, shadow: 0,
              borderColor: '#ffffff', borderAlpha: 0.25, borderWidth: 0.6,
              frostMix: 1, frostEdge: 1, saturation: 1.1,
            }}
          />
        </div>

        {/* الطبقة 3: ضوء داخلي خافت يتبع الماوس في المنتصف فقط بعيدًا عن الأطراف */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-16 inset-y-0 z-10 overflow-hidden rounded-full"
        >
          <motion.div
            className="absolute left-0 top-0"
            style={{
              x: navGlowX,
              y: navGlowY,
              opacity: glowOpacity,
              width: NAV_GLOW_RADIUS * 2,
              height: NAV_GLOW_RADIUS * 2,
              background: isLightTheme
                ? `radial-gradient(${NAV_GLOW_RADIUS}px circle at center, rgba(255, 255, 255, 0.24), rgba(142, 182, 155, 0.05) 52%, transparent 76%)`
                : `radial-gradient(${NAV_GLOW_RADIUS}px circle at center, rgba(255, 255, 255, 0.09), rgb(var(--qz-glow-rgb) / 0.03) 50%, transparent 76%)`,
              willChange: 'transform, opacity',
            }}
          />
        </div>

        {/* المحتوى الداخلي للكبسولة (نصوص وأيقونات حادة تمامًا) */}
        <motion.div
          layout
          transition={NAV_LAYOUT_SPRING}
          className="relative z-20 flex w-full items-center justify-between gap-2"
        >
          {/* الهوية واللوجو: يتحرك فقط عند تغير وضع Compact أو فتح/إغلاق البحث */}
          <AnimatePresence initial={false} mode="popLayout">
            {!isCompact && !searchExpanded && (
              <motion.div
                key="brand-identity"
                layout
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { ...NAV_LAYOUT_SPRING, opacity: { duration: 0.22, delay: 0.08 } } }}
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)', transition: { duration: 0.16, ease: 'easeIn' } }}
                className="shrink-0"
              >
                {/* اللوجو بيتكتب حرف حرف وبعدين قاسم الافتراضي بيطلع مكانه */}
                <NavHost onHome={(event) => handleSectionSelect(event, '/', '/')} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* مسار الأقسام الستة */}
          <AnimatePresence initial={false} mode="popLayout">
            {!searchExpanded && (
              <motion.div
                key="nav-links-track"
                layout="position"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                ref={linksTrackRef}
                onMouseMove={handleTrackMouseMove}
                onMouseLeave={() => {
                  setHoveredKey(null)
                  navPillLean.set(0)
                }}
                className="relative hidden items-center gap-1 lg:flex xl:gap-1.5"
              >
                {/* الكبسولة الزجاجية الذكية الموحدة */}
                {lensReady && (
                  <motion.div
                    aria-hidden="true"
                    style={{
                      left: 0,
                      x: navPillRenderX,
                      width: navPillW,
                      scaleY: navPillScaleY,
                      scaleX: navPillScaleX,
                      willChange: 'transform, width',
                    }}
                    className="qz-nav-pill pointer-events-none absolute inset-y-0 z-0 rounded-full"
                  />
                )}

                {/* 1. الرئيسية */}
                <NavLink
                  ref={(el) => {
                    itemRefs.current['/'] = el
                  }}
                  to="/"
                  end
                  onMouseEnter={() => {
                    setHoveredKey('/')
                    prefetchRoute('/')
                    triggerHoverSound()
                  }}
                  onClick={(event) => handleSectionSelect(event, '/', '/')}
                  data-qz-navitem=""
                  className={`group/link relative z-10 inline-flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-xs font-medium text-white/90 transition-colors duration-200 hover:text-white xl:pl-3.5 xl:text-sm ${
                    activeKey === '/' && indicatorTargetKey !== '/'
                      ? 'bg-white/[0.06] ring-1 ring-white/14'
                      : ''
                  }`}
                >
                  {() => {
                    const isActive = activeKey === '/'
                    const isHighlighted = indicatorTargetKey === '/'
                    return (
                      <>
                        <CleanNavIcon Icon={Home} active={isActive || isHighlighted} />
                        <span
                          className={`whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] ${
                            isActive ? 'font-semibold text-white' : ''
                          }`}
                        >
                          الرئيسية
                        </span>
                      </>
                    )
                  }}
                </NavLink>

                {/* 2. الفِردِكت | THE VERDICT */}
                <div
                  ref={(el) => {
                    verdictBtnRef.current = el
                    itemRefs.current.verdict = el
                  }}
                  onPointerEnter={handleVerdictEnter}
                  onPointerLeave={handleVerdictLeave}
                  onMouseEnter={() => {
                    setHoveredKey('verdict')
                    prefetchRoute('/verdict/movies')
                    prefetchRoute('/verdict/series')
                    triggerHoverSound()
                  }}
                  className={`relative z-10 rounded-full ${
                    isVerdictActive && indicatorTargetKey !== 'verdict'
                      ? 'bg-white/[0.06] ring-1 ring-white/14'
                      : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      clearVerdictTimer()
                      const next = !verdictOpen
                      if (next) {
                        closeInlineSearch()
                        setMobileMenuOpen(false)
                        syncNavIndicator('verdict', false)
                      }
                      playGlassDropdown(next)
                      setVerdictOpen(next)
                    }}
                    aria-expanded={verdictOpen}
                    aria-haspopup="true"
                    data-qz-navitem=""
                    className={`group/link relative inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-xs font-medium transition-colors duration-200 xl:text-sm ${
                      isVerdictActive || verdictOpen
                        ? 'font-semibold text-white'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    <CleanNavIcon
                      Icon={Scale}
                      active={isVerdictActive || indicatorTargetKey === 'verdict' || verdictOpen}
                    />
                    <span className="flex items-center gap-1.5 whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
                      <span>الفِردِكت</span>
                      <span className="hidden rounded-full border border-white/16 bg-white/8 px-2 py-0.5 font-sans text-[8.5px] font-medium tracking-[0.14em] text-[color:var(--qz-mint)]/90 2xl:inline">
                        THE VERDICT
                      </span>
                      <ChevronDown
                        className={`size-3.5 text-[color:var(--qz-mint)]/90 transition-transform duration-200 ${
                          verdictOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>
                </div>

                {/* 3، 4، 5، 6 */}
                {NAV_ITEMS.map(({ to, label, badge, icon: ItemIcon }) => {
                  const isActive = activeKey === to
                  const isHighlighted = indicatorTargetKey === to
                  return (
                    <NavLink
                      key={to}
                      ref={(el) => {
                        itemRefs.current[to] = el
                      }}
                      to={to}
                      onMouseEnter={() => {
                        setHoveredKey(to)
                        prefetchRoute(to)
                        triggerHoverSound()
                      }}
                      onClick={(event) => handleSectionSelect(event, to, to)}
                      data-qz-navitem=""
                      className={`group/link relative z-10 inline-flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-xs font-medium text-white/90 transition-colors duration-200 hover:text-white xl:pl-3.5 xl:text-sm ${
                        isActive && indicatorTargetKey !== to
                          ? 'bg-white/[0.06] ring-1 ring-white/14'
                          : ''
                      }`}
                    >
                      <CleanNavIcon Icon={ItemIcon} active={isActive || isHighlighted} />
                      <span
                        className={`flex items-center gap-1.5 whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] ${
                          isActive ? 'font-semibold text-white' : ''
                        }`}
                      >
                        <span>{label}</span>
                        {badge && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-400/22 px-1.5 py-0.5 font-sans text-[8px] font-semibold tracking-wider text-emerald-100">
                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
                            {badge}
                          </span>
                        )}
                      </span>
                    </NavLink>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* مجموعة البحث وزر تبديل الثيم المتماثلة */}
          <motion.div
            layout
            transition={NAV_LAYOUT_SPRING}
            ref={searchBoxRef}
            onPointerEnter={handleSearchAreaEnter}
            onPointerLeave={handleSearchAreaLeave}
            onMouseEnter={() => setHoveredKey(null)}
            className={`flex items-center gap-2 ${
              searchExpanded ? 'min-w-0 flex-1' : 'shrink-0'
            }`}
          >
            {/* كبسولة حقل البحث */}
            <motion.div
              layout
              transition={NAV_LAYOUT_SPRING}
              style={{ borderRadius: 9999 }}
              role="combobox"
              aria-expanded={searchSuggestionsOpen}
              aria-haspopup="listbox"
              aria-owns="qz-search-listbox"
              onMouseEnter={() => {
                if (!searchExpanded) triggerHoverSound()
              }}
              onClick={() => {
                if (!searchExpanded) {
                  openInlineSearch()
                } else {
                  clearSearchSuggestionsTimer()
                  setSearchSuggestionsOpen(true)
                  searchInputRef.current?.focus()
                }
              }}
              className={`relative flex items-center overflow-hidden rounded-full border-y border-x-0 transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                searchExpanded
                  ? 'w-full border-white/20 bg-white/[0.11] px-3.5 py-1.5'
                  : 'cursor-pointer border-white/16 bg-white/[0.08] px-3.5 py-1.5 hover:border-white/24 hover:bg-white/[0.13]'
              }`}
            >
              <Search className="size-3.5 shrink-0 text-[color:var(--qz-mint)]" />
              {searchExpanded ? (
                <>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => {
                      clearSearchSuggestionsTimer()
                      setSearchSuggestionsOpen(true)
                    }}
                    onChange={(event) => {
                      clearSearchSuggestionsTimer()
                      setActiveSearchIndex(0)
                      if (!searchSuggestionsOpenRef.current) {
                        setSearchSuggestionsOpen(true)
                      }
                      playGlassKeystroke()
                      setSearchQuery(event.target.value)
                    }}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="اكتب للبحث السريع في أقسام منصة قاسم..."
                    aria-label="بحث في منصة قاسم"
                    aria-autocomplete="list"
                    aria-controls="qz-search-listbox"
                    aria-activedescendant={
                      searchSuggestionsOpen && filteredSearch[activeSearchIndex]
                        ? `qz-search-opt-${activeSearchIndex}`
                        : undefined
                    }
                    className="mx-2.5 w-full min-w-0 bg-transparent text-xs text-white placeholder-white/60 focus:outline-none sm:text-sm"
                  />
                  <motion.button
                    type="button"
                    onMouseEnter={triggerHoverSound}
                    onClick={(event) => {
                      event.stopPropagation()
                      closeInlineSearch()
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ rotate: 90, scale: 1.12 }}
                    whileTap={{ scale: 0.86 }}
                    transition={morphSpring}
                    className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full bg-white/14 text-white transition-colors hover:bg-white/24"
                    aria-label="إغلاق البحث"
                  >
                    <CloseSpinIcon size={12} />
                  </motion.button>
                </>
              ) : (
                <span className="mr-2 flex items-center gap-1.5 whitespace-nowrap text-xs text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
                  <span>بحث</span>
                  <kbd className="hidden rounded bg-white/12 px-1.5 py-0.5 font-sans text-[8.5px] text-[color:var(--qz-mint)] 2xl:inline">
                    Ctrl K
                  </kbd>
                </span>
              )}
            </motion.div>

            {/* خانة تبديل الثيمات المتماثلة */}
            <div
              onMouseEnter={triggerHoverSound}
              className="flex shrink-0 items-center justify-center overflow-visible"
              style={{ width: 74, minWidth: 74, maxWidth: 74, height: 40, minHeight: 40 }}
            >
              <DaylightThemeSwitch
                theme={theme}
                onCycleTheme={(nextTheme) => setTheme(nextTheme)}
                className="qz-nav-switch"
              />
            </div>

            {/* زر قائمة الموبايل */}
            {!searchExpanded && (
              <motion.button
                ref={mobileBtnRef}
                type="button"
                onMouseEnter={triggerHoverSound}
                onClick={() => {
                  clearMobileTimer()
                  const next = !mobileMenuOpen
                  if (next) {
                    setVerdictOpen(false)
                    setSearchSuggestionsOpen(false)
                  }
                  playGlassDropdown(next)
                  setMobileMenuOpen(next)
                }}
                whileTap={{ scale: 0.88 }}
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-y border-x-0 border-white/18 bg-white/10 text-white transition-colors hover:bg-white/16 lg:hidden"
                aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                aria-expanded={mobileMenuOpen}
              >
                <MenuMorphIcon open={mobileMenuOpen} size={16} />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </motion.nav>

      {/* طبقة القوائم المنسدلة المستقلة — نسخة واحدة نظيفة لكل قائمة دون Ghosting */}
      <div
        ref={dropdownHostRef}
        className="pointer-events-none relative z-30 mx-auto max-w-[78rem]"
      >
        {/* 1. قائمة الفِردِكت المنسدلة */}
        <AnimatePresence>
          {verdictOpen && !searchExpanded && (
            <motion.div
              key="verdict-dropdown"
              ref={verdictMenuRef}
              variants={verdictMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onPointerEnter={handleVerdictEnter}
              onPointerLeave={handleVerdictLeave}
              style={{
                right: verdictAnchor.right,
                transformOrigin: `${verdictAnchor.originX}px top`,
              }}
              className="qassimz-dropdown-shell pointer-events-auto absolute top-1.5 hidden w-80 overflow-visible rounded-[28px] border-y border-x-0 border-white/16 bg-[color:var(--qz-ink)]/86 text-right shadow-[0_24px_60px_rgba(0,0,0,0.52)] backdrop-blur-[20px] saturate-[180%] before:absolute before:-top-2.5 before:inset-x-0 before:h-2.5 before:content-[''] lg:block"
            >
              {/* وصلة زجاجية رقيقة تربط القائمة بزر Verdict مباشرة */}
              <span
                aria-hidden="true"
                style={{ left: Math.max(16, verdictAnchor.originX - 28) }}
                className="pointer-events-none absolute -top-1.5 h-2 w-14 rounded-t-full border-t border-white/14 bg-white/[0.08] backdrop-blur-xl"
              />

              <div className="relative overflow-hidden rounded-[28px]">
                <VerdictPlanDropdown
                  currentPath={location.pathname}
                  onNavigateSection={handleSectionSelect}
                  onClose={() => {
                    clearVerdictTimer()
                    setVerdictOpen(false)
                  }}
                  onHoverSound={triggerHoverSound}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. قائمة اقتراحات البحث (Spring Dropdown نظيفة تمامًا بدون Ghosting عند الخروج) */}
        <AnimatePresence>
          {searchSuggestionsOpen && (
            <motion.div
              key="search-suggestions-dropdown"
              ref={searchDropdownRef}
              initial={{ height: 0, opacity: 0, y: -6 }}
              animate={{
                height: suggestionsHeight > 0 ? suggestionsHeight : 'auto',
                opacity: 1,
                y: 0,
                transition: {
                  height: dropdownHeightSpring,
                  y: dropdownVerticalSpring,
                  opacity: dropdownOpacitySpring,
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                y: -6,
                transition: {
                  height: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
                  opacity: { duration: 0.14, ease: 'easeOut' },
                  y: { duration: 0.16, ease: 'easeOut' },
                },
              }}
              onPointerEnter={handleSearchAreaEnter}
              onPointerLeave={handleSearchAreaLeave}
              style={{ transformOrigin: 'top center' }}
              className="qassimz-dropdown-shell pointer-events-auto relative mx-auto mt-2 w-full max-w-2xl overflow-hidden rounded-3xl border-y border-x-0 border-white/16 bg-[color:var(--qz-ink)]/88 text-right shadow-[0_24px_60px_rgba(0,0,0,0.52)] backdrop-blur-[20px] saturate-[180%]"
            >
              <div ref={searchListInnerRef} className="relative p-2">
                <div
                  id="qz-search-listbox"
                  role="listbox"
                  aria-label="اقتراحات البحث"
                  className="relative z-10"
                >
                  {filteredSearch.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[color:var(--qz-sage)]">
                      لا توجد نتائج مطابقة
                    </p>
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={{
                        hidden: {},
                        visible: {
                          transition: {
                            staggerChildren: 0.045,
                            delayChildren: 0.02,
                          },
                        },
                        exit: {
                          transition: {
                            staggerChildren: 0.02,
                            staggerDirection: -1,
                          },
                        },
                      }}
                      className="relative flex flex-col gap-1"
                    >
                      <SearchElasticHighlight
                        containerRef={searchDropdownRef}
                        rowRefs={searchRowRefs}
                        activeIndex={activeSearchIndex}
                        visible={filteredSearch.length > 0}
                      />

                      {filteredSearch.map((item, idx) => {
                        const ItemIcon = item.icon
                        const isSelected = idx === activeSearchIndex
                        return (
                          <motion.button
                            key={item.to}
                            id={`qz-search-opt-${idx}`}
                            role="option"
                            aria-selected={isSelected}
                            ref={(el) => {
                              searchRowRefs.current[idx] = el
                            }}
                            variants={{
                              hidden: { opacity: 0, y: 14 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                  type: 'spring',
                                  stiffness: 380,
                                  damping: 28,
                                },
                              },
                              exit: {
                                opacity: 0,
                                y: 6,
                                transition: { duration: 0.1 },
                              },
                            }}
                            type="button"
                            onMouseEnter={() => {
                              setActiveSearchIndex(idx)
                              triggerHoverSound()
                              prefetchRoute(item.to)
                            }}
                            onClick={(event) => {
                              closeInlineSearch()
                              handleSectionSelect(event, item.to, resolveRouteKey(item.to))
                            }}
                            className="group relative z-10 flex min-h-[46px] w-full cursor-pointer items-center justify-between rounded-2xl px-3.5 py-2 text-right transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <GlassIcon icon={ItemIcon} size="sm" active={isSelected} />
                              <span>
                                <span className="block text-xs font-bold text-white">
                                  {item.title}
                                </span>
                                <span className="block text-[11px] text-[color:var(--qz-mint)]/75">
                                  {item.sub}
                                </span>
                              </span>
                            </span>
                            <ArrowUpLeft
                              className={`size-3.5 shrink-0 transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : 'text-[color:var(--qz-sage)] group-hover:text-white'
                              }`}
                            />
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. قائمة الموبايل المستقلة */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-nav-dropdown"
              ref={mobileMenuRef}
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onPointerEnter={handleMobileEnter}
              onPointerLeave={handleMobileLeave}
              style={{ transformOrigin: 'top center' }}
              className="qassimz-dropdown-shell pointer-events-auto relative mt-2 overflow-visible rounded-3xl border-y border-x-0 border-white/16 bg-[color:var(--qz-ink)]/90 text-right shadow-2xl backdrop-blur-[20px] saturate-[180%] before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] lg:hidden"
            >
              <div className="relative overflow-hidden rounded-3xl p-3">
                <GlassHoverBubble containerRef={mobileMenuRef} radius={12} insetX={4} insetY={3} />

                <div className="relative z-10 flex flex-col gap-1">
                  <NavLink
                    to="/"
                    end
                    onMouseEnter={triggerHoverSound}
                    onClick={(event) => handleSectionSelect(event, '/', '/')}
                    data-qz-item=""
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm text-white"
                  >
                    <GlassIcon icon={Home} size="sm" active={activeKey === '/'} />
                    <span>الرئيسية</span>
                  </NavLink>

                  <div className="my-1 rounded-2xl border-y border-x-0 border-white/10 bg-white/4 p-2">
                    <div className="px-2 pb-1 text-[9.5px] font-semibold tracking-wider text-[color:var(--qz-sage)]">
                      الفِردِكت — THE VERDICT
                    </div>
                    <NavLink
                      to="/verdict/movies"
                      onMouseEnter={triggerHoverSound}
                      onClick={(event) => {
                        playGlassDropdown(false)
                        handleSectionSelect(event, '/verdict/movies', 'verdict')
                      }}
                      data-qz-item=""
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <GlassIcon icon={Film} size="sm" />
                      <span>حُكم السينما (أفلام)</span>
                    </NavLink>
                    <NavLink
                      to="/verdict/series"
                      onMouseEnter={triggerHoverSound}
                      onClick={(event) => {
                        playGlassDropdown(false)
                        handleSectionSelect(event, '/verdict/series', 'verdict')
                      }}
                      data-qz-item=""
                      className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <GlassIcon icon={Tv} size="sm" />
                      <span>حُكم المسلسلات</span>
                    </NavLink>
                  </div>

                  {NAV_ITEMS.map(({ to, label, badge, icon: ItemIcon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onMouseEnter={triggerHoverSound}
                      onClick={(event) => handleSectionSelect(event, to, to)}
                      data-qz-item=""
                      className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-white"
                    >
                      <span className="flex items-center gap-2.5">
                        <GlassIcon icon={ItemIcon} size="sm" active={activeKey === to} />
                        <span>{label}</span>
                      </span>
                      {badge && (
                        <span className="rounded-full bg-emerald-400/22 px-2 py-0.5 font-sans text-[9px] text-emerald-200">
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
