/* ══════════════════════════════════════════════════════════════════════
   QASSIMZ THEME BRIDGE — صفحة «عن أحمد»
   يقرأ ثيم قاسمز الحالي (green | red | gold) ويضبط ألوان WebGL و CSS
   قبل تشغيل lando.gold-v3.js، مع الحفاظ على تباين وتأثيرات مشهد البورتريه
   والخوذة ثلاثية الأبعاد (headScene) كما في الملف الأصلي تماماً.
   ══════════════════════════════════════════════════════════════════════ */
;(function () {
  var STORAGE_KEY = 'qassimz:theme'
  var VALID_THEMES = { green: true, red: true, gold: true }

  var PALETTES = {
    green: {
      glMap: {
        black: '#031415',
        'dark-green': '#051f20',
        'dark-green-tint-1': '#0b2b26',
        'dark-green-tint-1-low': '#c2e2cc',
        white: '#eef8f0',
        lime: '#8ef0d2',
      },
      headScene: {
        COLOR_OUTLINE: '#8eb69b',
        COLOR_FOREGROUND: '#8ef0d2',
        COLOR_BACKGROUND: '#eef8f0',
        COLOR_CURSOR_FOREGROUND: '#8eb69b',
        COLOR_CURSOR_BACKGROUND: '#daf1de',
        COLOR_CURSOR_OUTLINE: '#daf1de',
        COLOR_FILTER: '#235347',
      },
      backgroundScene: {
        COLOR_BACKGROUND: '#051f20',
        COLOR_FOREGROUND: '#0b2b26',
        COLOR_CURSOR_BACKGROUND: '#5ec9a8',
        COLOR_CURSOR_FOREGROUND: '#8ef0d2',
      },
      carouselScene: {
        COLOR_TOP: '#8ef0d2',
        COLOR_BOTTOM: '#daf1de',
      },
    },
    red: {
      glMap: {
        black: '#120604',
        'dark-green': '#1a0a07',
        'dark-green-tint-1': '#261009',
        'dark-green-tint-1-low': '#f3ce9d',
        white: '#fff4e3',
        lime: '#ffa046',
      },
      headScene: {
        COLOR_OUTLINE: '#d9a773',
        COLOR_FOREGROUND: '#ffa046',
        COLOR_BACKGROUND: '#fff4e3',
        COLOR_CURSOR_FOREGROUND: '#e2ac72',
        COLOR_CURSOR_BACKGROUND: '#ffe7c2',
        COLOR_CURSOR_OUTLINE: '#ffe7c2',
        COLOR_FILTER: '#8a2a12',
      },
      backgroundScene: {
        COLOR_BACKGROUND: '#1a0a07',
        COLOR_FOREGROUND: '#261009',
        COLOR_CURSOR_BACKGROUND: '#f2672b',
        COLOR_CURSOR_FOREGROUND: '#ffa046',
      },
      carouselScene: {
        COLOR_TOP: '#ffa046',
        COLOR_BOTTOM: '#ffe7c2',
      },
    },
    gold: {
      glMap: {
        black: '#0e0b04',
        'dark-green': '#1a1408',
        'dark-green-tint-1': '#2a1f0e',
        'dark-green-tint-1-low': '#e4ce99',
        white: '#fff8e8',
        lime: '#e8c96a',
      },
      headScene: {
        COLOR_OUTLINE: '#c9a54e',
        COLOR_FOREGROUND: '#e8c96a',
        COLOR_BACKGROUND: '#fff8e8',
        COLOR_CURSOR_FOREGROUND: '#d4b76a',
        COLOR_CURSOR_BACKGROUND: '#f5e6c0',
        COLOR_CURSOR_OUTLINE: '#f5e6c0',
        COLOR_FILTER: '#8a6d3b',
      },
      backgroundScene: {
        COLOR_BACKGROUND: '#1a1408',
        COLOR_FOREGROUND: '#2a1f0e',
        COLOR_CURSOR_BACKGROUND: '#c9a54e',
        COLOR_CURSOR_FOREGROUND: '#e8c96a',
      },
      carouselScene: {
        COLOR_TOP: '#e8c96a',
        COLOR_BOTTOM: '#f5e6c0',
      },
    },
  }

  function normalizeTheme(value) {
    return VALID_THEMES[value] ? value : 'green'
  }

  function detectInitialTheme() {
    try {
      var qs = new URLSearchParams(window.location.search).get('theme')
      if (VALID_THEMES[qs]) return qs
    } catch (_) {}
    try {
      if (window.parent && window.parent !== window) {
        var parentTheme = window.parent.document.documentElement.dataset.theme
        if (VALID_THEMES[parentTheme]) return parentTheme
      }
    } catch (_) {}
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY)
      if (VALID_THEMES[saved]) return saved
    } catch (_) {}
    return 'green'
  }

  var currentTheme = detectInitialTheme()
  var switchTimer = 0

  function applyTheme(next, animate) {
    var theme = normalizeTheme(next)
    currentTheme = theme
    var pal = PALETTES[theme]
    var root = document.documentElement

    if (animate) {
      root.classList.add('qz-theme-switching')
      window.clearTimeout(switchTimer)
      switchTimer = window.setTimeout(function () {
        root.classList.remove('qz-theme-switching')
      }, 550)
    }

    root.dataset.qzTheme = theme
    window.__qzPalette = pal
    window.__qzGLColors = pal.glMap

    if (window.landoGL && typeof window.landoGL.applyPalette === 'function') {
      window.landoGL.applyPalette(pal)
    }
  }

  // تهيئة فورية قبل تحميل lando.gold-v3.js حتى تبدأ مشاهد WebGL بالثيم الصحيح
  applyTheme(currentTheme, false)

  // استقبال تغييرات الثيم الحية من تطبيق قاسمز الأب
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return
    var data = event.data
    if (data && data.type === 'qz-theme' && VALID_THEMES[data.theme]) {
      applyTheme(data.theme, true)
    }
  })

  // احتياطي: التزامن عبر localStorage إذا تغيّر الثيم من نفس الأصل
  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY && VALID_THEMES[event.newValue]) {
      applyTheme(event.newValue, true)
    }
  })

  // منع الروابط الداخلية غير الموجودة في نسخة لاندو من كسر الـ iframe
  document.addEventListener(
    'click',
    function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a[href]') : null
      if (!link) return
      var href = link.getAttribute('href') || ''
      if (href === '#') return
      if (href.charAt(0) === '/' && href.indexOf('//') !== 0) {
        event.preventDefault()
        event.stopPropagation()
        var target = null
        if (href.indexOf('on-track') !== -1 || href.indexOf('off-track') !== -1) {
          target = document.querySelector('.s.is-otot-home')
        } else if (href.indexOf('calendar') !== -1) {
          target = document.querySelector('.s.home-helmets')
        } else if (href === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    true,
  )
})()
