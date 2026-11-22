/* ══ الأصوات اتشالت (بطلب أحمد — هتتعمل من جديد بعدين) ═══════════════
   الملف فاضل بنفس الأسماء علشان أي مكان بينادي عليها مايتكسرش،
   بس كل الدوال مابتعملش أي حاجة ومفيش ولا ملف صوت بيتحمّل. */
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
export const preloadOnAirMusic = () => Promise.resolve()
export const startOnAirAmbient = noop
export const stopOnAirAmbient = noop
export const toggleOnAirPlayback = noop
export const setOnAirVolume = noop
const STATE = { status: 'idle' }
export const getOnAirState = () => STATE
export const subscribeOnAir = () => noop
export const setAmbientVolume = noop
export const startAmbient = noop
export const stopAmbient = noop
