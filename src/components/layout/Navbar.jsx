import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Menu, Search, X } from 'lucide-react'
import NavHost from '../ai/NavHost.jsx'
import DaylightThemeSwitch from '../ui/DaylightThemeSwitch.jsx'
import { setTheme, useTheme } from '../../utils/theme.js'
import { playGlassTap } from '../../utils/glassSound.js'
import './liquid-nav.css'

const sections = [['/', 'الرئيسية'], ['/verdict/movies', 'حُكم السينما'], ['/verdict/series', 'حُكم المسلسلات'], ['/stories', 'أرشيف الحكايات'], ['/videos', 'الفيديوهات'], ['/articles', 'المقالات'], ['/on-air', 'أون إير'], ['/about', 'عن أحمد']]
export default function Navbar() {
  const { pathname } = useLocation(), navigate = useNavigate(), theme = useTheme(), reduced = useReducedMotion()
  const [panel, setPanel] = useState(''), [query, setQuery] = useState(''), [compact, setCompact] = useState(false)
  const root = useRef(null), input = useRef(null), opener = useRef(null)
  const toggle = (id, el) => { opener.current = el; setPanel(p => p === id ? '' : id); setQuery('') }
  useEffect(() => { setPanel(''); setQuery('') }, [pathname])
  useEffect(() => { if (panel === 'search') input.current?.focus() }, [panel])
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 50)
    const outside = e => { if (!root.current?.contains(e.target)) setPanel('') }
    const key = e => {
      if (e.key === 'Escape' && root.current?.contains(document.activeElement)) { setPanel(''); opener.current?.focus() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle('search',root.current?.querySelector('[data-find]')) }
    }
    scroll(); window.addEventListener('scroll',scroll,{passive:true}); document.addEventListener('pointerdown',outside); window.addEventListener('keydown',key)
    return () => { window.removeEventListener('scroll',scroll); document.removeEventListener('pointerdown',outside); window.removeEventListener('keydown',key) }
  }, [])
  const isActive = path => path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/')
  const lens = <motion.span aria-hidden="true" className="qn-lens" layoutId={reduced ? undefined : 'active-glass'} transition={{type:'spring',stiffness:440,damping:36}} />
  const results = sections.filter(([path,label]) => panel === 'verdict' ? path.startsWith('/verdict/') : panel !== 'search' || label.includes(query.trim()))
  return <header dir="rtl" ref={root} className="qn" data-compact={compact} data-light={theme === 'blue'}>
    <nav className="qn-bar" aria-label="التنقل الرئيسي">
      <NavHost onHome={e => { e.preventDefault(); setPanel(''); navigate('/') }} />
      <LayoutGroup id="primary-navigation"><div className="qn-tabs">
        {sections.filter(([p]) => p !== '/verdict/series').map(([path,label]) => path === '/verdict/movies' ?
          <button key={path} className="qn-tab" type="button" aria-expanded={panel==='verdict'} onClick={e=>toggle('verdict',e.currentTarget)}>{pathname.startsWith('/verdict/') && lens}<span>الفِردِكت</span><ChevronDown size={14}/></button> :
          <NavLink key={path} end={path==='/'} to={path} className="qn-tab" onClick={()=>{setPanel('');playGlassTap()}}>{isActive(path) && lens}<span>{label}</span></NavLink>)}
      </div></LayoutGroup>
      <div className="qn-tools"><button type="button" data-find="" aria-label="بحث في الأقسام" aria-expanded={panel==='search'} onClick={e=>toggle('search',e.currentTarget)}><Search size={18}/></button>
      <DaylightThemeSwitch theme={theme} onCycleTheme={setTheme} className="qz-nav-switch" />
      <button type="button" className="qn-menu" aria-label={panel==='menu'?'إغلاق القائمة':'فتح القائمة'} aria-expanded={panel==='menu'} onClick={e=>toggle('menu',e.currentTarget)}>{panel==='menu'?<X size={19}/>:<Menu size={19}/>}</button></div>
    </nav>
    {panel && <section key={panel} className="qn-panel" aria-label={panel==='search'?'نتائج البحث':'أقسام الموقع'}>
      {panel==='search' && <input ref={input} type="search" value={query} aria-label="اسم القسم" placeholder="ابحث عن قسم…" onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && results.length){navigate(results[0][0]);setPanel('')} if(e.key==='ArrowDown'){e.preventDefault();root.current?.querySelector('.qn-panel a')?.focus()}}}/>}
      {results.map(([path,label])=><NavLink key={path} end={path==='/'} to={path} onClick={()=>{setPanel('');playGlassTap()}}>{label}</NavLink>)}
      {!results.length && <p role="status">لا توجد أقسام بهذا الاسم.</p>}
    </section>}
  </header>
}
