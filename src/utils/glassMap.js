/*
 * تعطيل فلتر feDisplacementMap في backdrop-filter لتفادي تشوهات الحواف الماسية
 * والاعتماد على العزل الزجاجي النظيف (backdrop-filter: blur + saturate) في كل المكونات.
 */

export function getGlassMap() {
  return ''
}

export function canRefract() {
  return false
}