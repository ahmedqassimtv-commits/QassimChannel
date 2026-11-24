/* الأصوات اتشالت من الموقع بالكامل (بطلب أحمد).
   الدوال فاضلة كـ no-op عشان أي مكان بيناديها مايتكسرش — مفيش AudioContext ولا ملفات صوت. */
const noop = () => {}
export const setUiMuted = noop
export const playGlassTap = noop
export const playGlassMorph = noop
export const playGlassDropdown = noop
export const playGlassKeystroke = noop
export const playGlassHover = noop
export const playGlassToggle = noop
export const playGlassSegment = noop
export const playGlassDetent = noop
export const preloadOnAirMusic = noop
export const startOnAirAmbient = noop
export const stopOnAirAmbient = noop
export const toggleOnAirPlayback = noop
export const setOnAirVolume = noop
export const getOnAirState = () => ({ status: 'idle' })
export const subscribeOnAir = () => noop
export const setAmbientVolume = noop
export const startAmbient = noop
export const stopAmbient = noop
