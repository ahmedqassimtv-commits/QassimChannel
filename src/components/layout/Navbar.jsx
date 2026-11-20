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
  User,
  Library,
  Compass,
} from 'lucide-react'
import {
  playGlassDropdown,
  playGlassHover,
  playGlassKeystroke,
  playGlassMorph,
  playGlassTap,
} from '../../utils/glassSound.js'
import { prefetchRoute } from '../../utils/liquidGlassEngine.js'
import BrandLogo from '../brand/BrandLogo.jsx'
import DaylightThemeSwitch from '../ui/DaylightThemeSwitch.jsx'
import GlassHoverBubble from '../glass/GlassHoverBubble.jsx'
import GlassIcon from '../ui/GlassIcon.jsx'
import { LiquidGlass } from '../glass/LiquidGlass.tsx'
import {
  NimbusIcons,
  WaterlineIcon,
  WaterlineLayers,
  useWaterline,
} from '../glass/WaterlineCapsule.tsx'
import { setTheme, useTheme } from '../../utils/theme.js'
import { CloseSpinIcon, MenuMorphIcon } from '../ui/AnimatedIcons.jsx'

// ============================================================================
// إعادة تصميم النوف بار وحركة الكبسولة:
//  1. سطح النوف بار والقوائم المنسدلة عبر LiquidGlass:
//     • خريطة انكسار بصرية Lissé Squircle + 3-slice Capsule Baking
//     • تشتت لوني Chromatic RGB Dispersion عند الحواف المنحنية
//     • طبقة حافة Specular Rim وإضاءة اتجاهية بامتداد 2px خارج الإطار
//  2. حركة الكبسولة عبر Nimbus UI · "Waterline":
//     • قطرة ماء نشطة بفيزياء جسمين مقترنين (Head + Tail مع تأخر Meniscus 70ms)
//     • انشطار العنق السائل إلى قطيرات تابعة (Satellite Droplets) في القفزات الطويلة
//       واندماجها مجددًا عبر SDF Smooth-Min مع موجة ارتطام دائرية
//     • ارتفاع Meniscus ثلاثي الأبعاد تحت المؤشر + موجات نقر متسعة + مشاهد أيقونات حيّة
// ============================================================================

const DROPDOWN_CLOSE_DELAY = 360

const morphSpring = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
}

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

const SEARCH_HIGHLIGHT_SPRING = { type: 'spring', stiffness: 520, damping: 38, mass: 0.85 }
const NAV_SHELL_SPRING = { type: 'spring', bounce: 0, duration: 0.38 }

const SEARCH_INDEX = [
  { title: 'الرئيسية', sub: 'الواجهة العامة لمنصة قاسم', to: '/', icon: Home },
  { title: 'حُكم السينما — THE VERDICT', sub: 'مراجعات وتقييمات الأفلام', to: '/verdict/movies', icon: Film },
  { title: 'حُكم المسلسلات — THE VERDICT', sub: 'قراءات في المواسم والحلقات', to: '/verdict/series', icon: Tv },
  { title: 'أرشيف الحكايات', sub: 'صور نادرة وقصص من التاريخ', to: '/stories', icon: History },
  { title: 'الفيديوهات', sub: 'حلقات وثائقية ولقطات قصيرة', to: '/videos', icon: Video },
  { title: 'المقالات', sub: 'قراءات ومقالات متأنية', to: '/articles', icon: BookOpen },
  { title: 'أون إير — ON AIR', sub: 'البث المباشر والمحتوى الحيّ', to: '/masaha/on-air', icon: Radio },
  { title: 'الكتب والقصص', sub: 'مكتبة القراءات والحكايات', to: '/masaha/books', icon: Library },
  { title: 'عنّي', sub: 'وراء الصورة والحكاية', to: '/masaha/about', icon: User },
]

const NAV_ITEMS = [
  { to: '/stories', label: 'أرشيف الحكايات', icon: History, waterIcon: NimbusIcons.stories, fx: 'spin' },
  { to: '/videos', label: 'الفيديوهات', icon: Video, waterIcon: NimbusIcons.videos, fx: 'pop' },
  { to: '/articles', label: 'المقالات', icon: BookOpen, waterIcon: NimbusIcons.articles, fx: 'drop' },
]

const MASAHA_ITEMS = [
  { to: '/masaha/on-air', label: 'أون إير', shortLabel: 'أون إير', sub: 'البث المباشر والمحتوى الحيّ', icon: Radio, fx: 'glow' },
  { to: '/masaha/books', label: 'الكتب والقصص', shortLabel: 'الكتب', sub: 'مكتبة القراءات والحكايات', icon: Library, fx: 'pop' },
  { to: '/masaha/about', label: 'عنّي', shortLabel: 'عنّي', sub: 'وراء الصورة والحكاية', icon: User, fx: 'wave' },
]

// الترتيب الكامل لعناصر مسار الكبسولة المائية (Waterline Track) من اليمين لليسار
const TRACK_KEYS = ['/', 'verdict', '/stories', '/videos', '/articles', 'masaha']

function resolveRouteKey(pathname) {
  if (pathname.startsWith('/verdict') || pathname.startsWith('/reviews')) return 'verdict'
  if (pathname === '/') return '/'
  if (pathname.startsWith('/stories')) return '/stories'
  if (pathname.startsWith('/videos')) return '/videos'
  if (pathname.startsWith('/articles')) return '/articles'
  if (pathname.startsWith('/masaha')) return 'masaha'
  return '/'
}

function resolveWaterPalette(theme) {
  if (theme === 'red') return 'red'
  if (theme === 'gold') return 'gold'
  return 'green'
}

// مؤشر Highlight زجاجي سلس ومتناظر لنتائج البحث
function SearchElasticHighlight({ rowRefs, activeIndex, visible, itemCount }) {
  const topMV = useMotionValue(0)
  const heightMV = useMotionValue(46)
  const initializedRef = useRef(false)

  useLayoutEffect(() => {
    if (!visible || itemCount === 0) {
      initializedRef.current = false
      return
    }
    const clampedIndex = Math.max(0, Math.min(activeIndex, itemCount - 1))
    const rowEl = rowRefs.current[clampedIndex]
    if (!rowEl) return

    const nextTop = rowEl.offsetTop
    const nextHeight = rowEl.offsetHeight

    if (!initializedRef.current) {
      topMV.jump(nextTop)
      heightMV.jump(nextHeight)
      initializedRef.current = true
    } else {
      animate(topMV, nextTop, SEARCH_HIGHLIGHT_SPRING)
      animate(heightMV, nextHeight, SEARCH_HIGHLIGHT_SPRING)
    }
  }, [activeIndex, visible, itemCount, rowRefs, topMV, heightMV])

  return (
    <motion.span
      aria-hidden="true"
      style={{
        y: topMV,
        height: heightMV,
        opacity: visible && itemCount > 0 ? 1 : 0,
        willChange: 'transform, height',
      }}
      className="qz-search-highlight pointer-events-none absolute inset-x-0 top-0 z-0 rounded-2xl transition-opacity duration-150"
    />
  )
}

// قائمة الفِردِكت المنسدلة بكبسولة Waterline مائية مطابقة لكبسولة الـ Navbar
function VerdictPlanDropdown({
  currentPath,
  waterPalette,
  onNavigateSection,
  onClose,
  onHoverSound,
}) {
  const isSeriesDefault = currentPath.startsWith('/verdict/series')
  const [selected, setSelected] = useState(isSeriesDefault ? 'series' : 'movies')
  const isSeries = selected === 'series'
  const segIndex = isSeries ? 1 : 0

  const segWl = useWaterline({
    activeIndex: segIndex,
    itemCount: 2,
    tone: 'dark',
    palette: waterPalette,
    trackRim: 0.42,
    ambient: 0.55,
    wallInset: 4,
    sound: false,
  })

  const handlePick = (tab, idx, fxKind) => {
    segWl.triggerFx(idx, fxKind)
    if (tab === selected) return
    playGlassTap()
    setSelected(tab)
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          if (e.key === 'ArrowLeft') handlePick('series', 1, 'glow')
          else handlePick('movies', 0, 'pop')
        }
      }}
      className="relative z-10 p-3 text-right"
    >
      {/* ترويسة تربط القائمة بصريًا بقسم الفِردِكت */}
      <div className="mb-2.5 flex items-center justify-between border-b border-white/10 px-2 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
          <Scale className="size-3.5 text-[color:var(--qz-mint)]" />
          <span>تصفّح الفِردِكت</span>
        </span>
        <span className="rounded-full border border-white/14 bg-white/8 px-2 py-0.5 font-sans text-[8.5px] font-semibold tracking-[0.14em] text-[color:var(--qz-mint)]">
          THE VERDICT
        </span>
      </div>

      {/* Segmented Track بكبسولة Waterline المائية */}
      <div
        ref={segWl.trackRef}
        role="radiogroup"
        aria-label="أقسام الفِردِكت"
        onPointerMove={segWl.onPointerMove}
        onPointerLeave={segWl.onPointerLeave}
        onPointerDown={segWl.onPointerDown}
        className="relative flex items-center gap-1 rounded-full bg-white/[0.04] p-1"
      >
        <WaterlineLayers
          canvasRef={segWl.canvasRef}
          dropRef={segWl.dropRef}
          glMode={segWl.glMode}
          dropInsetY={4}
        />

        <button
          ref={segWl.registerItem(0)}
          type="button"
          role="radio"
          aria-checked={!isSeries}
          data-qz-active={!isSeries ? 'true' : undefined}
          onMouseEnter={() => {
            onHoverSound()
            prefetchRoute('/verdict/movies')
          }}
          onClick={() => handlePick('movies', 0, 'pop')}
          className={`relative z-10 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
            !isSeries
              ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <WaterlineIcon
            fx="pop"
            playing={segWl.fx.i === 0}
            playKey={segWl.fx.n}
            iconRef={segWl.registerIcon(0)}
          >
            <Film className="size-3.5" />
          </WaterlineIcon>
          <span>حُكم السينما</span>
        </button>

        <button
          ref={segWl.registerItem(1)}
          type="button"
          role="radio"
          aria-checked={isSeries}
          data-qz-active={isSeries ? 'true' : undefined}
          onMouseEnter={() => {
            onHoverSound()
            prefetchRoute('/verdict/series')
          }}
          onClick={() => handlePick('series', 1, 'glow')}
          className={`relative z-10 flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
            isSeries
              ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <WaterlineIcon
            fx="glow"
            playing={segWl.fx.i === 1}
            playKey={segWl.fx.n}
            iconRef={segWl.registerIcon(1)}
          >
            <Tv className="size-3.5" />
          </WaterlineIcon>
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

// قائمة «مساحة» المنسدلة — مرتبطة بقسم مساحة وبنفس تأثير كبسولات Waterline السائلة
function MasahaDropdown({
  currentPath,
  waterPalette,
  onNavigateSection,
  onClose,
  onHoverSound,
}) {
  const initialIdx = useMemo(() => {
    const found = MASAHA_ITEMS.findIndex((it) => currentPath.startsWith(it.to))
    return found >= 0 ? found : 0
  }, [currentPath])

  const [selectedIdx, setSelectedIdx] = useState(initialIdx)
  const masahaRowRefs = useRef({})

  useEffect(() => {
    const found = MASAHA_ITEMS.findIndex((it) => currentPath.startsWith(it.to))
    if (found >= 0) setSelectedIdx(found)
  }, [currentPath])

  const segWl = useWaterline({
    activeIndex: selectedIdx,
    itemCount: MASAHA_ITEMS.length,
    tone: 'dark',
    palette: waterPalette,
    trackRim: 0.42,
    ambient: 0.55,
    wallInset: 4,
    sound: false,
  })

  const activeItem = MASAHA_ITEMS[selectedIdx] || MASAHA_ITEMS[0]

  const handlePick = (idx, fxKind) => {
    segWl.triggerFx(idx, fxKind)
    if (idx === selectedIdx) return
    playGlassTap()
    setSelectedIdx(idx)
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          const dir = e.key === 'ArrowLeft' ? 1 : -1
          const nextIdx = (selectedIdx + dir + MASAHA_ITEMS.length) % MASAHA_ITEMS.length
          handlePick(nextIdx, MASAHA_ITEMS[nextIdx].fx)
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const dir = e.key === 'ArrowDown' ? 1 : -1
          const nextIdx = (selectedIdx + dir + MASAHA_ITEMS.length) % MASAHA_ITEMS.length
          handlePick(nextIdx, MASAHA_ITEMS[nextIdx].fx)
        }
      }}
      className="relative z-10 p-3 text-right"
    >
      {/* ترويسة تربط القائمة بصريًا بقسم مساحة */}
      <div className="mb-2.5 flex items-center justify-between border-b border-white/10 px-2 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
          <Compass className="size-3.5 text-[color:var(--qz-mint)]" />
          <span>مساحة قاسم</span>
        </span>
        <span className="rounded-full border border-white/14 bg-white/8 px-2 py-0.5 font-sans text-[8.5px] font-semibold tracking-[0.14em] text-[color:var(--qz-mint)]">
          MASAHA
        </span>
      </div>

      {/* مسار كبسولة Waterline المائية لأقسام مساحة الثلاثة */}
      <div
        ref={segWl.trackRef}
        role="radiogroup"
        aria-label="أقسام مساحة"
        onPointerMove={segWl.onPointerMove}
        onPointerLeave={segWl.onPointerLeave}
        onPointerDown={segWl.onPointerDown}
        className="relative mb-2.5 flex items-center gap-1 rounded-full bg-white/[0.04] p-1"
      >
        <WaterlineLayers
          canvasRef={segWl.canvasRef}
          dropRef={segWl.dropRef}
          glMode={segWl.glMode}
          dropInsetY={4}
        />

        {MASAHA_ITEMS.map((item, idx) => {
          const TabIcon = item.icon
          const isCurrentTab = idx === selectedIdx
          return (
            <button
              key={item.to}
              ref={segWl.registerItem(idx)}
              type="button"
              role="radio"
              aria-checked={isCurrentTab}
              data-qz-active={isCurrentTab ? 'true' : undefined}
              onMouseEnter={() => {
                onHoverSound()
                prefetchRoute(item.to)
              }}
              onClick={() => handlePick(idx, item.fx)}
              className={`relative z-10 flex h-8.5 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-medium transition-colors duration-200 ${
                isCurrentTab
                  ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <WaterlineIcon
                fx={item.fx}
                playing={segWl.fx.i === idx}
                playKey={segWl.fx.n}
                iconRef={segWl.registerIcon(idx)}
              >
                <TabIcon className="size-3.5" />
              </WaterlineIcon>
              <span className="whitespace-nowrap">{item.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* قائمة عناصر مساحة مع مؤشر الكبسولة الزجاجي المتزامن */}
      <div className="relative flex flex-col gap-1">
        <SearchElasticHighlight
          rowRefs={masahaRowRefs}
          activeIndex={selectedIdx}
          visible={MASAHA_ITEMS.length > 0}
          itemCount={MASAHA_ITEMS.length}
        />

        {MASAHA_ITEMS.map((item, idx) => {
          const isSelected = idx === selectedIdx
          const isCurrentRoute = currentPath.startsWith(item.to)
          return (
            <button
              key={item.to}
              ref={(el) => {
                if (el) masahaRowRefs.current[idx] = el
              }}
              type="button"
              onMouseEnter={() => {
                onHoverSound()
                prefetchRoute(item.to)
                if (selectedIdx !== idx) {
                  setSelectedIdx(idx)
                }
              }}
              onClick={(e) => {
                segWl.triggerFx(idx, item.fx)
                playGlassDropdown(false)
                onClose()
                onNavigateSection(e, item.to, 'masaha')
              }}
              className="group/item relative z-10 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors"
            >
              <GlassIcon icon={item.icon} size="md" active={isSelected || isCurrentRoute} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block text-xs font-bold text-white">{item.label}</span>
                  {isCurrentRoute && (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-1.5 py-0.5 font-sans text-[8.5px] font-bold tracking-wider text-emerald-200">
                      الحالي
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] text-[color:var(--qz-sage)]">
                  {item.sub}
                </span>
              </span>
              <ArrowUpLeft
                className={`mr-auto size-3.5 shrink-0 transition-all duration-200 ${
                  isSelected
                    ? 'translate-x-0 text-white opacity-100'
                    : 'text-[color:var(--qz-sage)] opacity-45 group-hover/item:opacity-100'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* زر انتقال سريع للقسم المحدد بكبسولة مساحة */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', ...PLAN_POP }}
        onMouseEnter={onHoverSound}
        onClick={(e) => {
          playGlassDropdown(false)
          onClose()
          onNavigateSection(e, activeItem.to, 'masaha')
        }}
        className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white py-2 text-xs font-bold text-[#051F20] shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-colors hover:bg-[color:var(--qz-mint)]"
      >
        <span>دخول {activeItem.label}</span>
        <ArrowUpLeft className="size-3.5" />
      </motion.button>
    </div>
  )
}

// مسار الأقسام الستة مع كبسولة الماء السائلة (Nimbus Waterline)
function DesktopWaterlineTrack({
  activeKey,
  verdictOpen,
  masahaOpen,
  waterPalette,
  hidden = false,
  trackContainerRef,
  verdictBtnRef,
  masahaBtnRef,
  onVerdictEnter,
  onVerdictLeave,
  onToggleVerdict,
  onMasahaEnter,
  onMasahaLeave,
  onToggleMasaha,
  onSectionSelect,
  onHoverSound,
}) {
  const targetKey = verdictOpen ? 'verdict' : masahaOpen ? 'masaha' : activeKey
  const activeIndex = Math.max(0, TRACK_KEYS.indexOf(targetKey))

  const wl = useWaterline({
    activeIndex,
    itemCount: TRACK_KEYS.length,
    tone: 'dark',
    palette: waterPalette,
    trackRim: 0,
    ambient: 0.68,
    wallInset: 4,
    sound: false,
    paused: hidden,
  })

  const bindTrackRef = useCallback(
    (el) => {
      wl.trackRef.current = el
      if (trackContainerRef) trackContainerRef.current = el
    },
    [trackContainerRef, wl.trackRef]
  )

  const bindVerdictRef = useCallback(
    (el) => {
      verdictBtnRef.current = el
      wl.registerItem(1)(el)
    },
    [verdictBtnRef, wl]
  )

  const bindMasahaRef = useCallback(
    (el) => {
      masahaBtnRef.current = el
      wl.registerItem(5)(el)
    },
    [masahaBtnRef, wl]
  )

  const handleTrackKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    // في اتجاه RTL: السهم الأيسر ينتقل للعنصر التالي (+1) والأيمن للسابق (-1)
    const dir = event.key === 'ArrowLeft' ? 1 : -1
    const nextIdx = (activeIndex + dir + TRACK_KEYS.length) % TRACK_KEYS.length
    const el = wl.itemRefs.current[nextIdx]
    const focusTarget = el?.matches('button, a') ? el : el?.querySelector('button, a')
    focusTarget?.focus()
  }

  return (
    <motion.div
      ref={bindTrackRef}
      aria-hidden={hidden || undefined}
      inert={Boolean(hidden)}
      animate={{ scale: hidden ? 0.96 : 1 }}
      transition={NAV_SHELL_SPRING}
      data-gl={wl.glMode}
      onKeyDown={handleTrackKeyDown}
      onPointerMove={hidden ? undefined : wl.onPointerMove}
      onPointerLeave={hidden ? undefined : wl.onPointerLeave}
      onPointerDown={hidden ? undefined : wl.onPointerDown}
      className="relative flex shrink-0 items-center gap-0.5 rounded-full p-1 xl:gap-1"
    >
      {/* شيدر قطرة الماء والانشطار السائل وموجات النقر */}
      <WaterlineLayers
        canvasRef={wl.canvasRef}
        dropRef={wl.dropRef}
        glMode={wl.glMode}
        dropInsetY={4}
      />

      {/* 1. الرئيسية */}
      <NavLink
        ref={wl.registerItem(0)}
        to="/"
        end
        data-qz-navitem=""
        data-qz-active={targetKey === '/' ? 'true' : undefined}
        onMouseEnter={() => {
          prefetchRoute('/')
          onHoverSound()
        }}
        onClick={(event) => {
          wl.triggerFx(0, 'glow')
          onSectionSelect(event, '/', '/')
        }}
        className={`group/link relative z-10 inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-medium transition-colors duration-200 xl:px-4 xl:text-[13.5px] ${
          targetKey === '/'
            ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
            : activeKey === '/'
              ? 'bg-white/[0.06] text-white ring-1 ring-white/15'
              : 'text-white/74 hover:text-white'
        }`}
      >
        <WaterlineIcon
          fx="glow"
          playing={wl.fx.i === 0}
          playKey={wl.fx.n}
          iconRef={wl.registerIcon(0)}
        >
          <GlassIcon icon={Home} size="sm" active={targetKey === '/' || activeKey === '/'} />
        </WaterlineIcon>
        <span className="whitespace-nowrap">الرئيسية</span>
      </NavLink>

      {/* 2. الفِردِكت | THE VERDICT */}
      <div
        ref={bindVerdictRef}
        onPointerEnter={onVerdictEnter}
        onPointerLeave={onVerdictLeave}
        onMouseEnter={() => {
          prefetchRoute('/verdict/movies')
          prefetchRoute('/verdict/series')
          onHoverSound()
        }}
        className="relative z-10 rounded-full"
      >
        <button
          type="button"
          onClick={() => {
            wl.triggerFx(1, 'wave')
            onToggleVerdict()
          }}
          aria-expanded={verdictOpen}
          aria-haspopup="true"
          data-qz-navitem=""
          data-qz-active={targetKey === 'verdict' ? 'true' : undefined}
          className={`group/link relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-medium transition-colors duration-200 xl:px-4 xl:text-[13.5px] ${
            targetKey === 'verdict'
              ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
              : activeKey === 'verdict'
                ? 'bg-white/[0.06] text-white ring-1 ring-white/15'
                : 'text-white/74 hover:text-white'
          }`}
        >
          <WaterlineIcon
            fx="wave"
            playing={wl.fx.i === 1}
            playKey={wl.fx.n}
            iconRef={wl.registerIcon(1)}
          >
            <GlassIcon icon={Scale} size="sm" active={targetKey === 'verdict' || activeKey === 'verdict' || verdictOpen} />
          </WaterlineIcon>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span>الفِردِكت</span>
            <span className="hidden rounded-full border border-white/16 bg-white/10 px-2 py-0.5 font-sans text-[8.5px] font-semibold tracking-[0.14em] text-[color:var(--qz-mint)]/95 2xl:inline">
              THE VERDICT
            </span>
            <ChevronDown
              className={`size-3.5 text-[color:var(--qz-mint)]/85 transition-transform duration-200 ${
                verdictOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
          {(verdictOpen || activeKey === 'verdict') && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full transition-opacity duration-200 ${
                verdictOpen
                  ? 'bg-[color:var(--qz-mint)] opacity-90 shadow-[0_0_8px_rgb(var(--qz-glow-rgb)/0.8)]'
                  : 'bg-[color:var(--qz-mint)]/60 opacity-60'
              }`}
            />
          )}
        </button>
      </div>

      {/* 3، 4، 5: أرشيف الحكايات، الفيديوهات، المقالات */}
      {NAV_ITEMS.map(({ to, label, icon, fx }, idx) => {
        const trackIdx = idx + 2
        const isCurrent = targetKey === to
        const isRouteActive = activeKey === to
        return (
          <NavLink
            key={to}
            ref={wl.registerItem(trackIdx)}
            to={to}
            data-qz-navitem=""
            data-qz-active={isCurrent ? 'true' : undefined}
            onMouseEnter={() => {
              prefetchRoute(to)
              onHoverSound()
            }}
            onClick={(event) => {
              wl.triggerFx(trackIdx, fx)
              onSectionSelect(event, to, to)
            }}
            className={`group/link relative z-10 inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-medium transition-colors duration-200 xl:px-4 xl:text-[13.5px] ${
              isCurrent
                ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
                : isRouteActive
                  ? 'bg-white/[0.06] text-white ring-1 ring-white/15'
                  : 'text-white/74 hover:text-white'
            }`}
          >
            <WaterlineIcon
              fx={fx}
              playing={wl.fx.i === trackIdx}
              playKey={wl.fx.n}
              iconRef={wl.registerIcon(trackIdx)}
            >
              <GlassIcon icon={icon} size="sm" active={isCurrent || isRouteActive} />
            </WaterlineIcon>
            <span className="whitespace-nowrap">{label}</span>
          </NavLink>
        )
      })}

      {/* 6. مساحة ▾ */}
      <div
        ref={bindMasahaRef}
        onPointerEnter={onMasahaEnter}
        onPointerLeave={onMasahaLeave}
        onMouseEnter={() => {
          MASAHA_ITEMS.forEach((item) => prefetchRoute(item.to))
          onHoverSound()
        }}
        className="relative z-10 rounded-full"
      >
        <button
          type="button"
          onClick={() => {
            wl.triggerFx(5, 'spin')
            onToggleMasaha()
          }}
          aria-expanded={masahaOpen}
          aria-haspopup="true"
          data-qz-navitem=""
          data-qz-active={targetKey === 'masaha' ? 'true' : undefined}
          className={`group/link relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs font-medium transition-colors duration-200 xl:px-4 xl:text-[13.5px] ${
            targetKey === 'masaha'
              ? 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'
              : activeKey === 'masaha'
                ? 'bg-white/[0.06] text-white ring-1 ring-white/15'
                : 'text-white/74 hover:text-white'
          }`}
        >
          <WaterlineIcon
            fx="spin"
            playing={wl.fx.i === 5}
            playKey={wl.fx.n}
            iconRef={wl.registerIcon(5)}
          >
            <GlassIcon icon={Compass} size="sm" active={targetKey === 'masaha' || activeKey === 'masaha' || masahaOpen} />
          </WaterlineIcon>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span>مساحة</span>
            <ChevronDown
              className={`size-3.5 text-[color:var(--qz-mint)]/85 transition-transform duration-200 ${
                masahaOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
          {(masahaOpen || activeKey === 'masaha') && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full transition-opacity duration-200 ${
                masahaOpen
                  ? 'bg-[color:var(--qz-mint)] opacity-90 shadow-[0_0_8px_rgb(var(--qz-glow-rgb)/0.8)]'
                  : 'bg-[color:var(--qz-mint)]/60 opacity-60'
              }`}
            />
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [, startTransition] = useTransition()
  const theme = useTheme()
  const waterPalette = resolveWaterPalette(theme)

  const [activeKey, setActiveKey] = useState(() => resolveRouteKey(location.pathname))
  const [activeDropdown, setActiveDropdown] = useState(null)
  const verdictOpen = activeDropdown === 'verdict'
  const masahaOpen = activeDropdown === 'masaha'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)
  const [isCompact, setIsCompact] = useState(false)
  // الموبايل والتابلت (أقل من lg): النوف بار بيتقلص عند التمرير بدل ما اللوجو يختفي
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const [brandWidth, setBrandWidth] = useState(126)
  const [trackWidth, setTrackWidth] = useState(680)
  const [compactMaxWidth, setCompactMaxWidth] = useState(880)
  const [brandAnimating, setBrandAnimating] = useState(false)
  const [trackAnimating, setTrackAnimating] = useState(false)
  const [verdictAnchor, setVerdictAnchor] = useState({ right: 144, originX: 250 })
  const [masahaAnchor, setMasahaAnchor] = useState({ right: 16, originX: 160 })
  const [suggestionsHeight, setSuggestionsHeight] = useState(0)
  const [pillPhase, setPillPhase] = useState('collapsed')
  const pillWidthMv = useMotionValue(76)
  const pillMaxWidthMv = useMotionValue(76)

  // مراجع العناصر (DOM Refs)
  const dropdownHostRef = useRef(null)
  const brandMeasureRef = useRef(null)
  const trackContainerRef = useRef(null)
  const collapsedControlsWidthRef = useRef(196)
  const verdictBtnRef = useRef(null)
  const verdictMenuRef = useRef(null)
  const masahaBtnRef = useRef(null)
  const masahaMenuRef = useRef(null)
  const searchBoxRef = useRef(null)
  const searchPillRef = useRef(null)
  const collapsedPillWidthRef = useRef(76)
  const expandedPillWidthRef = useRef(268)
  const pillAnimRef = useRef(null)
  const searchDropdownRef = useRef(null)
  const searchListInnerRef = useRef(null)
  const searchRowRefs = useRef({})
  const searchInputRef = useRef(null)
  const mobileBtnRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // مراجع المؤقتات والحالات الفورية
  const dropdownCloseTimerRef = useRef(null)
  const searchSuggestionsCloseTimerRef = useRef(null)
  const mobileCloseTimerRef = useRef(null)
  const focusTimerRef = useRef(null)
  const navFrameRef = useRef(null)
  const lastHoverSoundAtRef = useRef(0)

  const searchExpandedRef = useRef(searchExpanded)
  const prevSearchExpandedRef = useRef(searchExpanded)
  const pillPhaseRef = useRef(pillPhase)
  const searchSuggestionsOpenRef = useRef(searchSuggestionsOpen)
  const activeDropdownRef = useRef(activeDropdown)
  const mobileMenuOpenRef = useRef(mobileMenuOpen)

  searchExpandedRef.current = searchExpanded
  pillPhaseRef.current = pillPhase
  searchSuggestionsOpenRef.current = searchSuggestionsOpen
  activeDropdownRef.current = activeDropdown
  mobileMenuOpenRef.current = mobileMenuOpen

  const triggerHoverSound = useCallback(() => {
    const now = performance.now()
    if (now - lastHoverSoundAtRef.current < 48) return
    lastHoverSoundAtRef.current = now
    playGlassHover()
  }, [])

  // قياس عرض الشعار ومسار الأقسام وعناصر التحكم لضمان انتقال متزامن بدون قفزات
  useLayoutEffect(() => {
    const updateMetrics = () => {
      const brandEl = brandMeasureRef.current
      if (brandEl && brandEl.offsetWidth > 0) {
        const bw = Math.ceil(brandEl.offsetWidth)
        setBrandWidth((prev) => (prev !== bw ? bw : prev))
      }

      const trackEl = trackContainerRef.current
      let nextTrackW = null
      if (trackEl && trackEl.offsetWidth > 0) {
        nextTrackW = Math.ceil(trackEl.offsetWidth)
        setTrackWidth((prev) => (prev !== nextTrackW ? nextTrackW : prev))
      }

      const pillEl = searchPillRef.current
      if (pillEl && pillEl.offsetWidth > 0) {
        const pw = pillEl.offsetWidth
        if (searchExpandedRef.current) {
          expandedPillWidthRef.current = pw
        } else if (pillPhaseRef.current === 'collapsed') {
          collapsedPillWidthRef.current = Math.ceil(pw)
        }
      }

      if (
        !searchExpandedRef.current &&
        pillPhaseRef.current === 'collapsed' &&
        searchBoxRef.current &&
        searchBoxRef.current.offsetWidth > 0
      ) {
        collapsedControlsWidthRef.current = Math.ceil(searchBoxRef.current.offsetWidth)
      }

      if (nextTrackW && nextTrackW > 0) {
        const nextCompact = Math.max(760, nextTrackW + collapsedControlsWidthRef.current + 44)
        setCompactMaxWidth((prev) => (prev !== nextCompact ? nextCompact : prev))
      }
    }

    updateMetrics()
    const ro = new ResizeObserver(updateMetrics)
    if (brandMeasureRef.current) ro.observe(brandMeasureRef.current)
    if (trackContainerRef.current) ro.observe(trackContainerRef.current)
    if (searchBoxRef.current) ro.observe(searchBoxRef.current)
    if (searchPillRef.current) ro.observe(searchPillRef.current)
    window.addEventListener('resize', updateMetrics, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateMetrics)
    }
  }, [isCompact, searchExpanded])

  // تحريك عرض كبسولة البحث بسلاسة متزامنة مع NAV_SHELL_SPRING عند الفتح والإغلاق
  useLayoutEffect(() => {
    const wasExpanded = prevSearchExpandedRef.current
    prevSearchExpandedRef.current = searchExpanded
    if (wasExpanded === searchExpanded) return undefined

    pillAnimRef.current?.stop()
    const horizPad = window.innerWidth >= 640 ? 40 : 20
    const maxAvailW = Math.min(672, Math.max(200, window.innerWidth - horizPad))

    if (searchExpanded) {
      const startW =
        pillPhaseRef.current === 'closing'
          ? pillWidthMv.get()
          : collapsedPillWidthRef.current || 76
      expandedPillWidthRef.current = Math.min(
        expandedPillWidthRef.current || maxAvailW,
        maxAvailW
      )
      pillMaxWidthMv.set(startW)
      setPillPhase('opening')
      pillAnimRef.current = animate(pillMaxWidthMv, maxAvailW, {
        ...NAV_SHELL_SPRING,
        onComplete: () => {
          if (searchExpandedRef.current) {
            setPillPhase('expanded')
          }
        },
      })
    } else {
      const measuredW = searchPillRef.current?.offsetWidth || 0
      const rawExpandedW =
        pillPhaseRef.current === 'opening'
          ? Math.min(measuredW || pillMaxWidthMv.get(), pillMaxWidthMv.get(), maxAvailW)
          : Math.min(measuredW || expandedPillWidthRef.current || 268, maxAvailW)
      const startW = Math.max(collapsedPillWidthRef.current || 76, rawExpandedW)
      expandedPillWidthRef.current = startW
      const targetW = collapsedPillWidthRef.current || 76
      pillWidthMv.set(startW)
      setPillPhase('closing')
      pillAnimRef.current = animate(pillWidthMv, targetW, {
        ...NAV_SHELL_SPRING,
        onComplete: () => {
          if (!searchExpandedRef.current) {
            setPillPhase('collapsed')
          }
        },
      })
    }

    return undefined
  }, [searchExpanded, pillMaxWidthMv, pillWidthMv])

  // إزالة خصائص العرض المضمّنة المتبقية من Framer Motion عند تغيّر مرحلة الكبسولة
  useLayoutEffect(() => {
    const pillEl = searchPillRef.current
    if (!pillEl) return
    if (pillPhase !== 'opening') {
      pillEl.style.maxWidth = ''
    }
    if (pillPhase !== 'closing') {
      pillEl.style.width = ''
    }
  }, [pillPhase])

  useEffect(() => () => pillAnimRef.current?.stop(), [])

  // تحديث المسار النشط عند تغير الرابط
  useLayoutEffect(() => {
    const nextRouteKey = resolveRouteKey(location.pathname)
    setActiveKey(nextRouteKey)
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    setSearchSuggestionsOpen(false)
    setSearchExpanded(false)
    setSearchQuery('')
  }, [location.pathname])

  // محاذاة قائمة الفِردِكت مع زرها
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

  const updateMasahaAlignment = useCallback(() => {
    const btnEl = masahaBtnRef.current
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
    setMasahaAnchor({ right: Math.round(clampedRight), originX: Math.round(originX) })
  }, [])

  useLayoutEffect(() => {
    if (!masahaOpen) return undefined
    updateMasahaAlignment()
    window.addEventListener('resize', updateMasahaAlignment, { passive: true })
    return () => window.removeEventListener('resize', updateMasahaAlignment)
  }, [masahaOpen, updateMasahaAlignment])

  // مراقبة وضع التصغير (Compact Mode) بناءً على موضع Scroll الحقيقي
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

  // دوال إدارة المؤقتات الموحدة للقوائم المنسدلة
  const clearDropdownTimer = useCallback(() => {
    window.clearTimeout(dropdownCloseTimerRef.current)
    dropdownCloseTimerRef.current = null
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
      clearDropdownTimer()
    },
    [clearDropdownTimer]
  )

  const handleVerdictLeave = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      if (activeDropdownRef.current !== 'verdict') return
      clearDropdownTimer()
      dropdownCloseTimerRef.current = window.setTimeout(() => {
        dropdownCloseTimerRef.current = null
        setActiveDropdown((cur) => {
          if (cur === 'verdict') {
            playGlassDropdown(false)
            return null
          }
          return cur
        })
      }, DROPDOWN_CLOSE_DELAY)
    },
    [clearDropdownTimer]
  )

  const handleMasahaEnter = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      clearDropdownTimer()
    },
    [clearDropdownTimer]
  )

  const handleMasahaLeave = useCallback(
    (event) => {
      if (event?.pointerType && event.pointerType !== 'mouse') return
      if (activeDropdownRef.current !== 'masaha') return
      clearDropdownTimer()
      dropdownCloseTimerRef.current = window.setTimeout(() => {
        dropdownCloseTimerRef.current = null
        setActiveDropdown((cur) => {
          if (cur === 'masaha') {
            playGlassDropdown(false)
            return null
          }
          return cur
        })
      }, DROPDOWN_CLOSE_DELAY)
    },
    [clearDropdownTimer]
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
      // لا نغلق قائمة الاقتراحات لمجرد حركة الماوس إذا كان المستخدم يكتب حالياً داخل حقل البحث
      if (document.activeElement === searchInputRef.current) return
      searchSuggestionsCloseTimerRef.current = window.setTimeout(() => {
        searchSuggestionsCloseTimerRef.current = null
        if (searchExpandedRef.current && document.activeElement !== searchInputRef.current) {
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
    clearDropdownTimer()
    clearMobileTimer()
    clearSearchSuggestionsTimer()

    if (activeDropdownRef.current) {
      playGlassDropdown(false)
      setActiveDropdown(null)
    }
    if (mobileMenuOpenRef.current) {
      setMobileMenuOpen(false)
    }

    playGlassMorph(true)
    setActiveSearchIndex(0)
    setSearchExpanded(true)
    setSearchSuggestionsOpen(true)

    window.cancelAnimationFrame(focusTimerRef.current)
    focusTimerRef.current = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
  }, [clearDropdownTimer, clearMobileTimer, clearSearchSuggestionsTimer])

  const closeInlineSearch = useCallback(() => {
    clearSearchSuggestionsTimer()
    window.cancelAnimationFrame(focusTimerRef.current)
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

      if (activeDropdownRef.current === 'verdict') {
        const insideVerdict =
          verdictBtnRef.current?.contains(target) || verdictMenuRef.current?.contains(target)
        const onMasahaBtn = masahaBtnRef.current?.contains(target)
        if (!insideVerdict && !onMasahaBtn) {
          clearDropdownTimer()
          playGlassDropdown(false)
          setActiveDropdown(null)
        }
      } else if (activeDropdownRef.current === 'masaha') {
        const insideMasaha =
          masahaBtnRef.current?.contains(target) || masahaMenuRef.current?.contains(target)
        const onVerdictBtn = verdictBtnRef.current?.contains(target)
        if (!insideMasaha && !onVerdictBtn) {
          clearDropdownTimer()
          playGlassDropdown(false)
          setActiveDropdown(null)
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
  }, [clearDropdownTimer, clearMobileTimer, closeInlineSearch])

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
        if (activeDropdownRef.current) {
          clearDropdownTimer()
          playGlassDropdown(false)
          setActiveDropdown(null)
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
  }, [clearDropdownTimer, clearMobileTimer, closeInlineSearch, openInlineSearch])

  // إغلاق البحث والقوائم المنسدلة عند التمرير الفعلي للصفحة
  useEffect(() => {
    if (!activeDropdown && !searchExpanded && !searchSuggestionsOpen && !mobileMenuOpen) {
      return undefined
    }
    const anchorY = window.scrollY
    let rafId = null

    const handleScrollClose = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        if (Math.abs(window.scrollY - anchorY) < 10) return

        if (activeDropdownRef.current) {
          clearDropdownTimer()
          playGlassDropdown(false)
          setActiveDropdown(null)
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
    activeDropdown,
    searchExpanded,
    searchSuggestionsOpen,
    mobileMenuOpen,
    clearDropdownTimer,
    clearMobileTimer,
    closeInlineSearch,
  ])

  // تنظيف جميع المؤقتات عند تفكيك المكون
  useEffect(
    () => () => {
      window.clearTimeout(dropdownCloseTimerRef.current)
      window.clearTimeout(searchSuggestionsCloseTimerRef.current)
      window.clearTimeout(mobileCloseTimerRef.current)
      window.cancelAnimationFrame(focusTimerRef.current)
      window.cancelAnimationFrame(navFrameRef.current)
    },
    []
  )

  // التنقل السلس بين الأقسام — إغلاق القائمة وتحريك الكبسولة فوراً ثم بدء الانتقال في الإطار التالي
  const handleSectionSelect = useCallback(
    (event, targetPath, sectionKey = targetPath) => {
      event.preventDefault()

      const hadDropdownOpen = Boolean(activeDropdownRef.current)
      clearDropdownTimer()
      clearMobileTimer()
      clearSearchSuggestionsTimer()
      window.cancelAnimationFrame(navFrameRef.current)

      const isRouteChange = location.pathname !== targetPath
      setActiveKey(sectionKey)
      setActiveDropdown(null)
      setMobileMenuOpen(false)
      setSearchSuggestionsOpen(false)
      setSearchExpanded(false)
      setSearchQuery('')
      playGlassTap()

      if (isRouteChange) {
        const runNav = () => {
          startTransition(() => {
            navigate(targetPath)
          })
        }
        if (hadDropdownOpen) {
          navFrameRef.current = window.requestAnimationFrame(runNav)
        } else {
          runNav()
        }
      }
    },
    [
      clearDropdownTimer,
      clearMobileTimer,
      clearSearchSuggestionsTimer,
      location.pathname,
      navigate,
    ]
  )

  const handleToggleVerdict = useCallback(() => {
    clearDropdownTimer()
    const next = activeDropdownRef.current === 'verdict' ? null : 'verdict'
    if (next) {
      if (searchExpandedRef.current) closeInlineSearch()
      setMobileMenuOpen(false)
    }
    playGlassDropdown(Boolean(next))
    setActiveDropdown(next)
  }, [clearDropdownTimer, closeInlineSearch])

  const handleToggleMasaha = useCallback(() => {
    clearDropdownTimer()
    const next = activeDropdownRef.current === 'masaha' ? null : 'masaha'
    if (next) {
      if (searchExpandedRef.current) closeInlineSearch()
      setMobileMenuOpen(false)
    }
    playGlassDropdown(Boolean(next))
    setActiveDropdown(next)
  }, [clearDropdownTimer, closeInlineSearch])

  const filteredSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return SEARCH_INDEX
    return SEARCH_INDEX.filter((item) => `${item.title} ${item.sub}`.toLowerCase().includes(q))
  }, [searchQuery])

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

  const targetNavMaxWidth = searchExpanded ? 672 : isCompact ? compactMaxWidth : 1248

  return (
    <header
      dir="rtl"
      data-qz-nav=""
      data-compact={isCompact ? 'true' : undefined}
      className="qz-nav-header fixed inset-x-0 top-3.5 z-[70] isolation-isolate px-2.5 sm:top-4 sm:px-5"
    >
      {/* كبسولة النوف بار الرئيسية — سطح LiquidGlass البصري مع انتقال عرض ناعم بنابض متزن */}
      <LiquidGlass
        asChild
        appearance="dark"
        material="clear"
        refraction={26}
        bezel={26}
        dispersion={0.14}
        blur={2.8}
        fallbackBlur={24}
      >
        <motion.nav
          aria-label="التنقل الرئيسي"
          initial={false}
          animate={{ maxWidth: targetNavMaxWidth }}
          transition={NAV_SHELL_SPRING}
          className="qassimz-liquid-nav group/nav relative z-20 mx-auto flex w-full items-center justify-between gap-2 rounded-full bg-[rgb(var(--qz-deep-rgb)/0.19)] px-2.5 py-1.5 transition-[background-color] duration-300"
        >
          <div className="relative z-20 flex w-full items-center justify-between gap-2">
            {/* الهوية واللوجو — عرض مقاس متزامن مع نابض النوف بار لمنع أي قصّ أو ارتداد */}
            <AnimatePresence initial={false}>
              {(!isCompact || !isDesktop) && !searchExpanded && (
                <motion.div
                  key="brand-identity"
                  initial={{ opacity: 0, width: 0, x: 8, scale: 0.94 }}
                  animate={{
                    opacity: 1,
                    width: brandWidth,
                    x: 0,
                    scale: 1,
                    transition: {
                      width: NAV_SHELL_SPRING,
                      x: NAV_SHELL_SPRING,
                      scale: NAV_SHELL_SPRING,
                      opacity: { duration: 0.22, delay: 0.06, ease: 'easeOut' },
                    },
                  }}
                  exit={{
                    opacity: 0,
                    width: 0,
                    x: 8,
                    scale: 0.94,
                    transition: {
                      opacity: { duration: 0.14, ease: 'easeOut' },
                      width: NAV_SHELL_SPRING,
                      x: { duration: 0.18, ease: 'easeIn' },
                      scale: { duration: 0.18, ease: 'easeIn' },
                    },
                  }}
                  onAnimationStart={() => setBrandAnimating(true)}
                  onAnimationComplete={() => setBrandAnimating(false)}
                  className={`shrink-0 ${
                    brandAnimating || (isCompact && isDesktop) || searchExpanded ? 'overflow-hidden' : 'overflow-visible'
                  }`}
                >
                  <div ref={brandMeasureRef} className="w-max shrink-0">
                    <button
                      type="button"
                      onMouseEnter={triggerHoverSound}
                      onClick={(event) => {
                        playGlassDropdown(true)
                        handleSectionSelect(event, '/', '/')
                      }}
                      aria-label="قاسمز - الرئيسية"
                      className="group flex shrink-0 cursor-pointer items-center rounded-full px-2 py-1 sm:px-2.5"
                    >
                      <BrandLogo
                        variant="glass"
                        title="قاسمز"
                        className="qz-nav-brand h-7 w-auto shrink-0 transition-[transform,height] duration-300 group-hover:scale-[1.04] sm:h-8"
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* مسار الأقسام الستة مع كبسولة الماء السائلة — ينكمش ويتوسع بتزامن مع نابض النوف بار دون قفز */}
            <motion.div
              initial={false}
              animate={{
                width: searchExpanded ? 0 : trackWidth,
                opacity: searchExpanded ? 0 : 1,
              }}
              transition={{
                width: NAV_SHELL_SPRING,
                opacity: { duration: searchExpanded ? 0.14 : 0.22, ease: 'easeOut' },
              }}
              onAnimationStart={() => setTrackAnimating(true)}
              onAnimationComplete={() => setTrackAnimating(false)}
              className={`hidden shrink-0 items-center lg:flex ${
                searchExpanded
                  ? 'pointer-events-none overflow-hidden'
                  : trackAnimating
                    ? 'overflow-hidden'
                    : 'overflow-visible'
              }`}
            >
              <DesktopWaterlineTrack
                activeKey={activeKey}
                verdictOpen={verdictOpen}
                masahaOpen={masahaOpen}
                waterPalette={waterPalette}
                hidden={searchExpanded}
                trackContainerRef={trackContainerRef}
                verdictBtnRef={verdictBtnRef}
                masahaBtnRef={masahaBtnRef}
                onVerdictEnter={handleVerdictEnter}
                onVerdictLeave={handleVerdictLeave}
                onToggleVerdict={handleToggleVerdict}
                onMasahaEnter={handleMasahaEnter}
                onMasahaLeave={handleMasahaLeave}
                onToggleMasaha={handleToggleMasaha}
                onSectionSelect={handleSectionSelect}
                onHoverSound={triggerHoverSound}
              />
            </motion.div>

            {/* مجموعة البحث ومبدّل الثيم والقائمة المحمولة */}
            <div
              ref={searchBoxRef}
              onPointerEnter={handleSearchAreaEnter}
              onPointerLeave={handleSearchAreaLeave}
              className={`flex items-center gap-2 ${
                searchExpanded ? 'min-w-0 flex-1 justify-end' : 'shrink-0'
              }`}
            >
              {/* كبسولة البحث الموحدة — تتوسع وتنكمش بسلاسة متزامنة مع نابض النوف بار دون شدّ أو تشوّه */}
              <motion.div
                ref={searchPillRef}
                role="combobox"
                aria-expanded={searchExpanded && searchSuggestionsOpen}
                aria-haspopup="listbox"
                aria-owns="qz-search-listbox"
                style={
                  pillPhase === 'opening'
                    ? { maxWidth: pillMaxWidthMv }
                    : pillPhase === 'closing'
                      ? { width: pillWidthMv }
                      : undefined
                }
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
                className={`relative flex h-10 items-center overflow-hidden rounded-full border px-3.5 transition-colors duration-200 ${
                  searchExpanded
                    ? 'w-full min-w-0 flex-1 border-white/18 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'shrink-0 cursor-pointer border-white/14 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:border-white/22 hover:bg-white/[0.09]'
                }`}
              >
                <Search className="size-3.5 shrink-0 text-[color:var(--qz-mint)]" />
                {searchExpanded ? (
                  <>
                    <motion.input
                      key="search-input"
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
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
                  <motion.span
                    key="search-collapsed-label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="mr-2 flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]"
                  >
                    <span>بحث</span>
                    <kbd className="hidden rounded-md bg-white/12 px-1.5 py-0.5 font-sans text-[8.5px] text-[color:var(--qz-mint)] 2xl:inline">
                      Ctrl K
                    </kbd>
                  </motion.span>
                )}
              </motion.div>

              {/* خانة تبديل الثيمات الثلاثة (الزمردي • الجمري • الذهبي) */}
              <div
                onMouseEnter={triggerHoverSound}
                className="flex shrink-0 items-center justify-center overflow-visible"
                style={{ width: 74, minWidth: 74, maxWidth: 74, height: 40, minHeight: 40 }}
              >
                <DaylightThemeSwitch
                  theme={theme === 'gold' ? 'blue' : theme}
                  onCycleTheme={(nextTheme) =>
                    setTheme(nextTheme === 'blue' ? 'gold' : nextTheme)
                  }
                  className="qz-nav-switch"
                />
              </div>

              {/* زر قائمة الموبايل */}
              <AnimatePresence initial={false}>
                {!searchExpanded && (
                  <motion.div
                    key="mobile-menu-btn"
                    initial={{ opacity: 0, width: 0, scale: 0.85 }}
                    animate={{ opacity: 1, width: 36, scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0.85 }}
                    transition={NAV_SHELL_SPRING}
                    className="shrink-0 overflow-hidden lg:hidden"
                  >
                    <button
                      ref={mobileBtnRef}
                      type="button"
                      onMouseEnter={triggerHoverSound}
                      onClick={() => {
                        clearMobileTimer()
                        const next = !mobileMenuOpen
                        if (next) {
                          clearDropdownTimer()
                          setActiveDropdown(null)
                          setSearchSuggestionsOpen(false)
                        }
                        playGlassDropdown(next)
                        setMobileMenuOpen(next)
                      }}
                      className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/14 bg-white/[0.04] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors hover:bg-white/[0.1]"
                      aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                      aria-expanded={mobileMenuOpen}
                    >
                      <MenuMorphIcon open={mobileMenuOpen} size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.nav>
      </LiquidGlass>

      {/* طبقة القوائم المنسدلة المستقلة بأسطح LiquidGlass الموحدة */}
      <div
        ref={dropdownHostRef}
        className="pointer-events-none relative z-30 mx-auto max-w-[78rem]"
      >
        {/* 1 و 2: قوائم الفِردِكت ومساحة المنسدلة في AnimatePresence موحّد لمنع التداخل */}
        <AnimatePresence mode="wait">
          {activeDropdown === 'verdict' && !searchExpanded && (
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
              className="pointer-events-auto absolute top-2 hidden w-80 before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] lg:block"
            >
              <span
                aria-hidden="true"
                style={{ left: Math.max(16, verdictAnchor.originX - 28) }}
                className="pointer-events-none absolute -top-1.5 z-0 h-2 w-14 rounded-t-full border-t border-white/18 bg-white/[0.08] backdrop-blur-xl"
              />
              <LiquidGlass
                appearance="dark"
                material="regular"
                refraction={18}
                dispersion={0.08}
                fallbackBlur={22}
                className="rounded-[28px] bg-[rgb(var(--qz-ink-rgb)/0.68)] text-right shadow-[0_24px_60px_rgba(0,0,0,0.52)]"
              >
                <VerdictPlanDropdown
                  currentPath={location.pathname}
                  waterPalette={waterPalette}
                  onNavigateSection={handleSectionSelect}
                  onClose={() => {
                    clearDropdownTimer()
                    setActiveDropdown(null)
                  }}
                  onHoverSound={triggerHoverSound}
                />
              </LiquidGlass>
            </motion.div>
          )}

          {activeDropdown === 'masaha' && !searchExpanded && (
            <motion.div
              key="masaha-dropdown"
              ref={masahaMenuRef}
              variants={verdictMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onPointerEnter={handleMasahaEnter}
              onPointerLeave={handleMasahaLeave}
              style={{
                right: masahaAnchor.right,
                transformOrigin: `${masahaAnchor.originX}px top`,
              }}
              className="pointer-events-auto absolute top-2 hidden w-80 before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] lg:block"
            >
              <span
                aria-hidden="true"
                style={{ left: Math.max(16, masahaAnchor.originX - 28) }}
                className="pointer-events-none absolute -top-1.5 z-0 h-2 w-14 rounded-t-full border-t border-white/18 bg-white/[0.08] backdrop-blur-xl"
              />
              <LiquidGlass
                appearance="dark"
                material="regular"
                refraction={18}
                dispersion={0.08}
                fallbackBlur={22}
                className="rounded-[28px] bg-[rgb(var(--qz-ink-rgb)/0.68)] text-right shadow-[0_24px_60px_rgba(0,0,0,0.52)]"
              >
                <MasahaDropdown
                  currentPath={location.pathname}
                  waterPalette={waterPalette}
                  onNavigateSection={handleSectionSelect}
                  onClose={() => {
                    clearDropdownTimer()
                    setActiveDropdown(null)
                  }}
                  onHoverSound={triggerHoverSound}
                />
              </LiquidGlass>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. قائمة اقتراحات البحث */}
        <AnimatePresence>
          {searchSuggestionsOpen && (
            <motion.div
              key="search-suggestions-dropdown"
              ref={searchDropdownRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  y: dropdownVerticalSpring,
                  opacity: dropdownOpacitySpring,
                  scale: dropdownVerticalSpring,
                },
              }}
              exit={{
                opacity: 0,
                y: -6,
                scale: 0.98,
                transition: {
                  opacity: { duration: 0.14, ease: 'easeOut' },
                  y: { duration: 0.16, ease: 'easeOut' },
                  scale: { duration: 0.16, ease: 'easeOut' },
                },
              }}
              onPointerEnter={handleSearchAreaEnter}
              onPointerLeave={handleSearchAreaLeave}
              style={{ transformOrigin: 'top center' }}
              className="pointer-events-auto relative mx-auto mt-2.5 w-full max-w-2xl"
            >
              <LiquidGlass
                appearance="dark"
                material="regular"
                refraction={14}
                dispersion={0.06}
                fallbackBlur={22}
                className="rounded-3xl bg-[rgb(var(--qz-ink-rgb)/0.68)] text-right shadow-[0_24px_60px_rgba(0,0,0,0.52)]"
              >
                <motion.div
                  animate={{
                    height: suggestionsHeight > 0 ? suggestionsHeight : 'auto',
                    transition: { height: dropdownHeightSpring },
                  }}
                  className="overflow-hidden rounded-3xl"
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
                                staggerChildren: 0.016,
                                delayChildren: 0.01,
                              },
                            },
                            exit: {
                              transition: {
                                staggerChildren: 0.01,
                                staggerDirection: -1,
                              },
                            },
                          }}
                          className="relative flex flex-col gap-1"
                        >
                          <SearchElasticHighlight
                            rowRefs={searchRowRefs}
                            activeIndex={activeSearchIndex}
                            visible={filteredSearch.length > 0}
                            itemCount={filteredSearch.length}
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
                                  if (el) {
                                    searchRowRefs.current[idx] = el
                                  } else if (searchRowRefs.current[idx]) {
                                    delete searchRowRefs.current[idx]
                                  }
                                }}
                                variants={{
                                  hidden: { opacity: 0, y: 6 },
                                  visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                      type: 'spring',
                                      bounce: 0,
                                      duration: 0.24,
                                    },
                                  },
                                  exit: {
                                    opacity: 0,
                                    y: 4,
                                    transition: { duration: 0.09 },
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
              </LiquidGlass>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. قائمة الموبايل المستقلة */}
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
              className="pointer-events-auto relative mt-2 before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] lg:hidden"
            >
              <LiquidGlass
                appearance="dark"
                material="regular"
                refraction={18}
                dispersion={0.08}
                fallbackBlur={22}
                className="qz-mobile-menu rounded-3xl bg-[rgb(var(--qz-ink-rgb)/0.94)] text-right shadow-2xl"
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

                    <div className="my-1 rounded-2xl border-y border-x-0 border-white/10 bg-white/4 p-2">
                      <div className="px-2 pb-1 text-[9.5px] font-semibold tracking-wider text-[color:var(--qz-sage)]">
                        مساحة — MASAHA
                      </div>
                      {MASAHA_ITEMS.map(({ to, label, icon: ItemIcon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onMouseEnter={triggerHoverSound}
                          onClick={(event) => {
                            playGlassDropdown(false)
                            handleSectionSelect(event, to, 'masaha')
                          }}
                          data-qz-item=""
                          className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          <GlassIcon icon={ItemIcon} size="sm" />
                          <span>{label}</span>
                        </NavLink>
                      ))}
                    </div>

                    {NAV_ITEMS.map(({ to, label, icon: ItemIcon }) => (
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
                      </NavLink>
                    ))}
                  </div>
                </div>
              </LiquidGlass>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}