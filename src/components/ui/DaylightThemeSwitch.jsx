import { useEffect, useRef } from 'react'
import { playGlassToggle } from '../../utils/glassSound.js'

const CORE_W = 192
const CORE_H = 112
const HORIZON = 82
const MARGIN = 14
const WORLD_HZ = 30
const WORLD_SLACK = 0.004
const PILL_RATIO = 1.85
const CLOCK_DAY = 12.2
const CLOCK_SUNSET = 18.0
const CLOCK_NIGHT = 21.5
const CLOCK_SLEEP = 23.4
const NIGHT_CREEP = 26

const RAMPS = [
  ['bg', [0.76, 0.85, 0.93, 0.985]],
  ['surface', [0.4, 0.52, 0.64, 0.76]],
  ['fg', [0.17, 0.25, 0.33, 0.44]],
  ['muted', [0.5, 0.62, 0.74, 0.86]],
  ['accent', [0.5, 0.66, 0.8, 0.92]],
]
const C0 = 0, C1 = 1, C2 = 2, C3 = 3
const G0 = 4, G1 = 5, G2 = 6, G3 = 7
const I0 = 8, I1 = 9, I2 = 10, I3 = 11
const U0 = 12, U1 = 13, U2 = 14, U3 = 15
const A0 = 16, A1 = 17, A2 = 18, A3 = 19

const MATS = [
  ['SKY', C3, C3, C3, C3],
  ['HILL_FAR', U2, U1, I3, I1],
  ['HILL_NEAR', U1, U0, I2, I1],
  ['TREE_FAR', G1, G0, I2, I0],
  ['GRASS', G2, G1, I3, I1],
  ['GRASS_DK', G1, G0, I2, I0],
  ['GRASS_LT', G3, G2, U0, I2],
  ['PATH', C1, C0, U0, I2],
  ['PATH_DK', C0, A0, I3, I1],
  ['WALL', C3, A3, U1, I2],
  ['WALL_SH', C2, A2, U0, I1],
  ['PLANK', C1, A1, I3, I1],
  ['STONE', U1, U0, I2, I1],
  ['STONE_LT', U2, U1, I3, I2],
  ['ROOF', I3, I2, I1, I0],
  ['ROOF_LT', U0, I3, I2, I1],
  ['ROOF_HI', U1, U0, I3, I1],
  ['WOOD', A0, A0, I2, I0],
  ['WOOD_LT', A1, A1, I3, I1],
  ['WOOD_DK', I3, I2, I1, I0],
  ['BRICK', U0, I3, I2, I0],
  ['BRICK_LT', U1, U0, I3, I1],
  ['BARK', I3, I2, I1, I0],
  ['BARK_LT', A0, A0, I1, I0],
  ['LEAF0', G0, G0, I1, I0],
  ['LEAF1', G1, G0, I2, I0],
  ['LEAF2', G2, A0, I2, I1],
  ['LEAF3', G3, A1, I3, I1],
  ['FLOWER_A', A2, A1, A0, I2],
  ['FLOWER_C', C3, A3, U1, I3],
  ['STEM', G0, G0, I2, I0],
  ['GLASS', I2, A0, I1, I0],
  ['GLASS_HI', U1, A1, I2, I1],
  ['ROOM', C1, C0, I3, I1],
  ['SKIN', A3, A3, U2, I3],
  ['HAIR', I0, I0, I0, I0],
  ['SHIRT', A1, A0, I3, I1],
  ['SHIRT_DK', A0, A0, I2, I0],
  ['PANTS', I2, I2, I1, I0],
  ['BOOT', I0, I0, I0, I0],
  ['BOOK', C3, C3, U2, I3],
  ['BOOK_DK', C1, C1, U0, I2],
  ['CLOUD', C3, A3, U1, I2],
  ['CLOUD_SH', U3, A2, U0, I1],
  ['SMOKE', C1, C1, U2, I3],
  ['SMOKE_DK', U2, U1, U0, I2],
  ['SUN', C3, C3, A3, A3],
  ['SUN_RIM', A3, A2, A2, A2],
  ['MOON', C3, C3, C3, C3],
  ['MOON_DK', C1, C1, C1, C1],
  ['STAR', C3, C3, C3, C3],
  ['STAR_DIM', U2, U2, U2, U2],
  ['LIT', A2, A2, A2, A2],
  ['LIT_HI', A3, A3, A3, A3],
  ['LIT_DK', A1, A1, A1, A1],
  ['SIL', I0, I0, I0, I0],
  ['FIREFLY', A3, A3, A3, A3],
  ['BIRD', I2, I2, I1, I0],
  ['MARK', I0, I0, C3, C3],
  ['ZZZ', U3, U3, U3, U3],
  ['WING', A2, A2, A1, I2],
]
const M = Object.fromEntries(MATS.map((row, i) => [row[0], i]))

const KEYS = [
  [0, 3, [I0, I0, I1, I1, I2]],
  [4.8, 3, [I0, I0, I1, I1, I2]],
  [5.4, 3, [I0, I1, I2, I3, U0]],
  [6.0, 2, [I1, I2, I3, U0, U1, A1]],
  [6.7, 1, [I3, U0, U1, U2, A2, A3]],
  [7.8, 0, [U1, U2, U3, C2, C3]],
  [10, 0, [U2, U3, C2, C3, C3]],
  [15, 0, [U1, U2, U3, C2, C3]],
  [17, 1, [U0, U1, U3, C1, A3, A2]],
  [18, 1, [I3, U0, U1, A1, A2, A3]],
  [19, 2, [I1, I2, I3, U0, A0, A1]],
  [20.3, 3, [I0, I0, I1, I1, I2]],
  [24, 3, [I0, I0, I1, I1, I2]],
]

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const mix = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const bayerAt = (x, y) => BAYER[((y & 3) << 2) | (x & 3)]

function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeNoise(seed) {
  const r = seeded(seed)
  const table = new Float32Array(65536)
  for (let i = 0; i < 65536; i++) table[i] = r()
  const at = (x, y) => table[((x & 255) << 8) | (y & 255)]
  return (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    return mix(
      mix(at(xi, yi), at(xi + 1, yi), u),
      mix(at(xi, yi + 1), at(xi + 1, yi + 1), u),
      v
    )
  }
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)
function rgbToOklab([r8, g8, b8]) {
  const r = toLinear(r8 / 255)
  const g = toLinear(g8 / 255)
  const b = toLinear(b8 / 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function oklabToLinear(L, a, b) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}
function labTone(lab, L) {
  let chroma = 1
  for (let i = 0; i < 24; i++) {
    const rgb = oklabToLinear(L, lab[1] * chroma, lab[2] * chroma)
    if (rgb.every((v) => v >= -0.001 && v <= 1.001)) {
      return rgb.map((v) => Math.round(toGamma(clamp(v)) * 255))
    }
    chroma *= 0.9
  }
  return oklabToLinear(L, 0, 0).map((v) => Math.round(toGamma(clamp(v)) * 255))
}

const CHARS = {
  H: 'HAIR', S: 'SKIN', E: 'HAIR', T: 'SHIRT', D: 'SHIRT_DK',
  P: 'PANTS', B: 'BOOT', W: 'BOOK', K: 'BOOK_DK',
}
const makeSprite = (rows) => {
  const list = []
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch !== '.') list.push([x, y, M[CHARS[ch]], ch === 'E'])
    })
  })
  return { list, w: rows[0].length, h: rows.length }
}
const HEAD = ['..HHH..', '.HHHHH.', '.HHSSS.', '.HSSES.', '..SSSS.']
const HEAD_BLINK = ['..HHH..', '.HHHHH.', '.HHSSS.', '.HSSSS.', '..SSSS.']
const HEAD_UP = ['..HHH..', '.HHHHH.', '.HHSES.', '.HSSSS.', '..SSSS.']
const BODY_STAND = ['..TTT..', '.TTTTT.', '.STTTS.', '..DDD..', '..PPP..', '..P.P..', '..B.B..']
const BODY_WALK1 = ['..TTT..', '.TTTTT.', '..TTTS.', '.SDDD..', '..PPP..', '.PP.P..', '.B..BB.']
const BODY_WALK2 = ['..TTT..', '.TTTTT.', '.STTTS.', '..DDD..', '..PPP..', '..PP...', '..BB...']
const BODY_WALK3 = ['..TTT..', '.TTTTT.', '.STTT..', '..DDDS.', '..PPP..', '..P.PP.', '.BB..B.']
const BODY_ARMS = ['S.TTT.S', 'STTTTTS', '..TTT..', '..DDD..', '..PPP..', '..P.P..', '..B.B..']
const person = (head, body) => makeSprite([...head, ...body])
const SPR = {
  stand: person(HEAD, BODY_STAND),
  blink: person(HEAD_BLINK, BODY_STAND),
  walk: [
    person(HEAD, BODY_WALK1),
    person(HEAD, BODY_WALK2),
    person(HEAD, BODY_WALK3),
    person(HEAD, BODY_WALK2),
  ],
  up: person(HEAD_UP, BODY_ARMS),
  crouch: person(HEAD, ['..TTT..', '.TTTTTS', '..DDD.S', '..PPP..', '.BB.B..']),
  seat: makeSprite([
    '....HHH..', '...HHHHH.', '...SSSHH.', '...ESSHH.', '...SSSS..',
    '...TTTT..', '...STTTT.', '...STTTT.', 'PPPPPPDD.', 'BB.PPPPP.',
  ]),
  seatBlink: makeSprite([
    '....HHH..', '...HHHHH.', '...SSSHH.', '...SSSHH.', '...SSSS..',
    '...TTTT..', '...STTTT.', '...STTTT.', 'PPPPPPDD.', 'BB.PPPPP.',
  ]),
  seatUp: makeSprite([
    '....HHH..', '...HHHHH.', '...ESSHH.', '...SSSHH.', '...SSSS..',
    '...TTTT..', '...STTTT.', '...STTTT.', 'PPPPPPDD.', 'BB.PPPPP.',
  ]),
  bust: makeSprite(['...HHH...', '..HHHHH..', '..HSSES..', '...SSS...', '..TTTTT..', '.TTTTTTT.', '.TTTTTTT.', '.TTTTTTT.']),
  bustBlink: makeSprite(['...HHH...', '..HHHHH..', '..HSSSS..', '...SSS...', '..TTTTT..', '.TTTTTTT.', '.TTTTTTT.', '.TTTTTTT.']),
  bustUp: makeSprite(['S..HHH..S', 'S.HHHHH.S', 'S.HSSES.S', 'SS.SSS.SS', '.STTTTTS.', '..TTTTT..', '..TTTTT..', '..TTTTT.']),
  bustHalf: makeSprite(['...HHH...', '..HHHHH..', 'S.HSSES.S', 'SS.SSS.SS', '.STTTTTS.', '..TTTTT..', '.TTTTTTT.', '.TTTTTTT.']),
  sil: makeSprite(['...HHH..', '..HHHHH.', '..HHHHH.', '...HHH..', '..HHHHH.', '.HHHHHHH', 'HHHHHHHH', 'HHHHHHHH']),
  silLook: makeSprite(['....HHH.', '...HHHHH', '...HHHHH', '...HHH..', '..HHHHH.', '.HHHHHHH', 'HHHHHHHH', 'HHHHHHHH']),
}

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

// شيدر WebGL2 ناعم وعالي الوضوح (بدون بكسلة) مع عدسة Glass Lens وانكسار حواف
const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uWorld, uGlowNear;
uniform vec2 uRes, uPill, uOrigin, uWorldSize, uGlowSize;
uniform vec4 uLens;
uniform float uBezel, uK, uNight, uLift;
uniform vec3 uShellDay, uShellNight, uInk, uLight, uHiNight, uLoNight, uHomeCol, uSkyCol;
uniform vec2 uHomePos, uSkyPos;
out vec4 outColor;

float rb(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 smoothTex(sampler2D t, vec2 uv, vec2 size) {
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0 + 0.5) / size;
  vec2 h1 = (i + 1.5 + w3 / g1 + 0.5) / size;
  return g0.y * (g0.x * texture(t, vec2(h0.x, h0.y)).rgb + g1.x * texture(t, vec2(h1.x, h0.y)).rgb)
       + g1.y * (g0.x * texture(t, vec2(h0.x, h1.y)).rgb + g1.x * texture(t, vec2(h1.x, h1.y)).rgb);
}

vec3 glowNear(vec2 frag) {
  vec2 uv = vec2(frag.x / uRes.x, 1.0 - frag.y / uRes.y);
  vec3 rough = textureLod(uGlowNear, uv, 0.0).rgb;
  if (rough.r + rough.g + rough.b < 1.0e-4) return vec3(0.0);
  return smoothTex(uGlowNear, uv, uGlowSize);
}

vec3 reach(vec2 p, vec2 pos, vec3 col, float radius) {
  vec2 L = pos - p;
  float r2 = radius * radius;
  return col * r2 / (r2 + dot(L, L));
}

// قراءة ناعمة خالية من البكسلة
vec3 worldSmooth(vec2 frag) {
  vec2 w = vec2(frag.x - uOrigin.x, uOrigin.y - frag.y) / uK;
  return smoothTex(uWorld, w / uWorldSize, uWorldSize);
}

// قراءة العدسة المحدّبة مع انكسار الحواف
vec3 worldBent(vec2 frag, float foot) {
  vec2 w = vec2(frag.x - uOrigin.x, uOrigin.y - frag.y) / uK;
  if (foot > 1.35) return textureLod(uWorld, w / uWorldSize, log2(foot) * 0.65).rgb;
  return smoothTex(uWorld, w / uWorldSize, uWorldSize);
}

vec3 envLow, envHigh;
float softBox(vec2 p, vec2 c, vec2 h, float s) {
  vec2 q = abs(p - c) - h;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  return 1.0 - smoothstep(-s, s, d);
}
vec3 studio(vec3 R) {
  vec3 c = mix(envLow, envHigh, smoothstep(-0.55, 0.85, R.y));
  vec2 s = R.xy / (1.0 + max(R.z, 0.0));
  float key = softBox(s, vec2(-0.1, 0.56), vec2(0.5, 0.11), 0.17);
  float fill = softBox(s, vec2(0.34, -0.6), vec2(0.3, 0.05), 0.2);
  c += envHigh * key * 1.1;
  c += envHigh * fill * 0.14;
  return c;
}

vec3 shellColor(vec2 p, float d) {
  vec2 q = p;
  float inner = uPill.x - uPill.y;
  q.x = sign(p.x) * max(abs(p.x) - inner, 0.0);
  vec2 g = q / max(length(q), 1.0e-3);
  float t = clamp(-d / uBezel, 0.0, 1.0);
  float a = (1.0 - 2.0 * t);
  a = sign(a) * pow(abs(a), 1.35) * 0.96;
  vec3 N = normalize(vec3(g * a, sqrt(max(1.0 - a * a, 0.02))));
  vec3 R = vec3(2.0 * N.z * N.xy, 2.0 * N.z * N.z - 1.0);
  vec3 albedo = mix(uShellDay, uShellNight, uNight);
  float diffuse = 0.64 + 0.36 * clamp(dot(N, normalize(vec3(-0.25, 0.75, 0.6))), 0.0, 1.0);
  float fresnel = 0.08 + 0.92 * pow(1.0 - N.z, 3.2);
  vec3 c = albedo * diffuse;
  c = mix(c, studio(R), clamp(fresnel * 0.85 + 0.12, 0.0, 1.0));
  float toWindow = smoothstep(0.62, 1.0, t);
  c = mix(c, c * 0.78, toWindow * 0.55);

  float radius = uPill.y * 0.62;
  for (int i = 0; i < 2; i++) {
    vec2 pos = i == 0 ? uHomePos : uSkyPos;
    vec3 col = i == 0 ? uHomeCol : uSkyCol;
    vec3 e = reach(p, pos, col, radius);
    vec2 toL = normalize(pos - p + 1.0e-3);
    float wrap = 0.5 + 0.5 * dot(N.xy, toL);
    c += e * wrap * mix(albedo * 0.9, vec3(dot(albedo, vec3(0.34))) + 0.34, 0.55) * 2.6;
  }
  return c;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = frag - 0.5 * uRes;
  envLow = mix(uShellDay * 0.78, uLoNight, uNight);
  envHigh = mix(uLight, uHiNight, uNight);

  float d = rb(p, uPill, uPill.y);
  float dw = d + uBezel;

  vec3 premul = vec3(0.0);
  float alpha = 0.0;
  if (d > -2.0) {
    float h = uPill.y;
    float contact = rb(p + vec2(0.0, h * 0.025), uPill, uPill.y);
    float shadow = 0.22 * (1.0 - smoothstep(-h * 0.03, h * 0.08, contact));
    alpha = shadow;
    premul = uInk * shadow;
    vec2 toEdge = 0.5 * uRes - abs(p);
    float room = min(toEdge.x, toEdge.y) / (h * 0.25);
    float fade = smoothstep(0.0, 1.0, clamp(room, 0.0, 1.0));
    premul *= fade;
    alpha *= fade;
  }

  vec3 color = premul;
  if (d < 1.2) {
    vec3 body = dw > -1.0 ? shellColor(p, d) : vec3(0.0);

    if (dw < 1.2) {
      vec3 c = worldSmooth(frag);
      vec3 near = glowNear(frag);
      c = 1.0 - (1.0 - c) * (1.0 - clamp(near * 0.8, 0.0, 1.0));

      float win = uPill.y - uBezel;
      float sheen = smoothstep(win * 0.12, win * 1.02, p.y + p.x * 0.09);
      c = mix(c, envHigh, sheen * sheen * mix(0.15, 0.05, uNight));

      float top = rb(p - vec2(0.0, win * 0.06), uPill - vec2(uBezel), win);
      float inset = 1.0 - smoothstep(-win * 0.2, win * 0.03, top);
      float ring = exp(max(dw, -win) / (win * 0.08));
      float depth = clamp(ring * 0.42 + exp(min(top, 0.0) / (win * 0.1)) * 0.36 * inset, 0.0, 0.78);
      c = mix(c, uInk, depth);

      vec2 lc = uLens.xy;
      vec2 he = uLens.zw;
      float lr = min(he.x, he.y);
      vec2 lq = p - lc;

      float lift = 0.055 + uLift * 0.045;
      float sd = rb(lq + vec2(0.0, lr * lift * 1.5), he, lr);
      float sh = 1.0 - smoothstep(-lr * 0.16, lr * (0.22 + uLift * 0.12), sd);
      c = mix(c, uInk, sh * mix(0.38, 0.56, uNight));

      float ld = rb(lq, he, lr);
      if (ld < 1.2) {
        vec2 axis = lq;
        vec2 inner2 = max(he - lr, vec2(0.0));
        axis.x = sign(lq.x) * max(abs(lq.x) - inner2.x, 0.0);
        axis.y = sign(lq.y) * max(abs(lq.y) - inner2.y, 0.0);
        float rad = length(axis);
        vec2 gr = axis / max(rad, 1.0e-3);
        float rho = clamp(rad / lr, 0.0, 1.0);

        float mag = 1.26;
        float bt = clamp((rho - 0.68) / 0.32, 0.0, 1.0);
        float band = bt * bt * (3.0 - 2.0 * bt);
        float strength = 1.0 - 1.0 / mag + 0.22;
        float bend = pow(band, 2.1) * lr * strength;
        vec2 base = lc + lq / mag;
        vec2 shiftDir = gr * bend;
        vec2 center = 0.5 * uRes;
        float dBand = 6.0 * bt * (1.0 - bt) / 0.32;
        float foot = (1.0 / mag + 2.1 * pow(max(band, 1.0e-3), 1.1) * dBand * strength) / max(uK, 0.5);

        vec3 seen;
        if (band > 0.02) {
          float ca = 0.055 * band;
          seen.r = worldBent(center + base + shiftDir * (1.0 - ca), foot).r;
          seen.g = worldBent(center + base + shiftDir, foot).g;
          seen.b = worldBent(center + base + shiftDir * (1.0 + ca), foot).b;
        } else {
          seen = worldBent(center + base, foot);
        }
        vec3 throughGlow = glowNear(center + base + shiftDir);
        seen = 1.0 - (1.0 - seen) * (1.0 - clamp(throughGlow * 0.8, 0.0, 1.0));

        vec2 tilt = gr * (0.22 * rho + 0.78 * pow(rho, 7.0));
        vec3 N = normalize(vec3(tilt, sqrt(max(1.0 - dot(tilt, tilt), 0.02))));
        vec3 R = vec3(2.0 * N.z * N.xy, 2.0 * N.z * N.z - 1.0);
        vec2 lp = lq / lr;

        vec3 lens = seen * 1.04;
        float edge = pow(rho, 15.0);
        lens = mix(lens, uInk, edge * 0.38);

        float pool = smoothstep(0.05, 0.95, -lp.y * 0.9 + lp.x * 0.2) * smoothstep(1.0, 0.78, rho) * smoothstep(0.42, 0.86, rho);
        lens += envHigh * pool * mix(0.32, 0.12, uNight);

        float broad = softBox(lp, vec2(-0.12, 0.62), vec2(0.48, 0.16), 0.28) * smoothstep(0.98, 0.72, rho);
        lens = mix(lens, envHigh, broad * mix(0.46, 0.14, uNight));

        float rimLight = smoothstep(0.86, 0.98, rho) * (1.0 - smoothstep(0.98, 1.0, rho));
        lens += envHigh * rimLight * 0.24;

        float fresnel = pow(1.0 - N.z, 3.0);
        float dir = 0.2 + 0.8 * smoothstep(-0.6, 0.85, dot(gr, normalize(vec2(-0.42, 0.9))));
        float mirror = clamp(fresnel * dir * dir * 0.58, 0.0, 0.4);
        if (mirror > 1.0e-3) lens = mix(lens, studio(R), mirror);

        c = mix(c, lens, 1.0 - smoothstep(-1.0, 1.0, ld));
      }

      body = mix(body, c, 1.0 - smoothstep(-1.0, 1.0, dw));
    }

    float cover = 1.0 - smoothstep(-1.0, 1.0, d);
    color = mix(premul, body, cover);
    alpha = mix(alpha, 1.0, cover);
  }

  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}`

// التوافق التام مع الهوية البصرية للموقع:
// green -> الثيم الزمردي الداكن (ليل زمردي + نجوم + نافذة مضيئة)
// red   -> الثيم الجمري (غروب أحمر وعنبر دافئ)
// blue  -> الثيم الرملي الدافئ (#EBE2CC • #DED6C1 • #B7B09E • نهار مشرق)
const THEME_CONFIGS = {
  green: {
    pos: 1,
    clock: CLOCK_NIGHT,
    label: 'الثيم الزمردي الأصلي',
    bg: '#DAF1DE',
    surface: '#235347',
    fg: '#051F20',
    muted: '#8EB69B',
    accent: '#8ef0d2',
    shellDay: '#163832',
    shellNight: '#0B2B26',
  },
  red: {
    pos: 0.5,
    clock: CLOCK_SUNSET,
    label: 'الثيم الجمري',
    bg: '#FFE7C2',
    surface: '#8A2A12',
    fg: '#1A0A07',
    muted: '#F2A65A',
    accent: '#F2672B',
    shellDay: '#3B160C',
    shellNight: '#261009',
  },
  blue: {
    pos: 0,
    clock: CLOCK_DAY,
    label: 'الثيم الرملي الدافئ',
    bg: '#EBE2CC',
    surface: '#8A8271',
    fg: '#1F1D18',
    muted: '#B7B09E',
    accent: '#D99B38',
    shellDay: '#CFC6B1',
    shellNight: '#B7B09E',
  },
}

const THEME_ORDER = ['green', 'red', 'blue']

function nearestThemeForPos(pos) {
  if (pos >= 0.75) return 'green'
  if (pos >= 0.25) return 'red'
  return 'blue'
}

export default function DaylightThemeSwitch({ theme = 'green', onCycleTheme, className = '' }) {
  const rootRef = useRef(null)
  const controllerRef = useRef(null)
  const themeRef = useRef(theme)
  const onCycleRef = useRef(onCycleTheme)
  themeRef.current = theme
  onCycleRef.current = onCycleTheme

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const cfg = THEME_CONFIGS[theme] || THEME_CONFIGS.green
    root.style.setProperty('--_bg', cfg.bg)
    root.style.setProperty('--_surface', cfg.surface)
    root.style.setProperty('--_fg', cfg.fg)
    root.style.setProperty('--_muted', cfg.muted)
    root.style.setProperty('--_accent', cfg.accent)
    root.style.setProperty('--_shellday', cfg.shellDay)
    root.style.setProperty('--_shellnight', cfg.shellNight)

    if (controllerRef.current) {
      controllerRef.current.syncTheme(cfg.pos, cfg.label)
    }
  }, [theme])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const cleanups = []
    const on = (target, type, fn, options) => {
      target.addEventListener(type, fn, options)
      cleanups.push(() => target.removeEventListener(type, fn, options))
    }

    let canvas = root.querySelector('.scene')
    const button = root.querySelector('.hit')
    const statusEl = root.querySelector('[data-status]')
    const probe = root.querySelector('.probe')
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    let calm = motionQuery.matches

    const offscreen = (w, h) =>
      typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(w, h)
        : Object.assign(root.ownerDocument.createElement('canvas'), { width: w, height: h })

    const paint = offscreen(1, 1).getContext('2d', { willReadFrequently: true })
    const palette = new Array(20)
    const palette32 = new Uint32Array(20)
    let shellDayUnit = [0.1, 0.22, 0.2]
    let shellNightUnit = [0.04, 0.17, 0.15]

    const readColorUnit = (cssVal, fallback) => {
      probe.style.color = cssVal || fallback
      paint.clearRect(0, 0, 1, 1)
      paint.fillStyle = getComputedStyle(probe).color
      paint.fillRect(0, 0, 1, 1)
      const d = paint.getImageData(0, 0, 1, 1).data
      return [d[0] / 255, d[1] / 255, d[2] / 255]
    }

    const readPalette = () => {
      const style = getComputedStyle(root)
      RAMPS.forEach(([name, tones], ramp) => {
        probe.style.color = style.getPropertyValue(`--_${name}`).trim() || '#888888'
        paint.clearRect(0, 0, 1, 1)
        paint.fillStyle = getComputedStyle(probe).color
        paint.fillRect(0, 0, 1, 1)
        const d = paint.getImageData(0, 0, 1, 1).data
        const lab = rgbToOklab([d[0], d[1], d[2]])
        tones.forEach((L, step) => {
          const rgb = labTone(lab, L)
          const id = ramp * 4 + step
          palette[id] = rgb
          palette32[id] = (255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0]
        })
      })
      shellDayUnit = readColorUnit(style.getPropertyValue('--_shellday').trim(), '#163832')
      shellNightUnit = readColorUnit(style.getPropertyValue('--_shellnight').trim(), '#0B2B26')
    }
    const unit = (id) => palette[id].map((v) => v / 255)

    const STEP_L = RAMPS.flatMap(([, tones]) => tones)
    const shadeOf = (id) => {
      const step = id % 4
      if (step > 0) return id - 1
      if (id === C0 || id === G0 || id === U0 || id === A0) return I3
      return id
    }
    const litOf = (dayId) => (STEP_L[dayId] < 0.9 ? A0 : A1)
    const NM = MATS.length
    const table = KEYS.map(([, col]) => {
      const t = new Uint8Array(NM * 3)
      MATS.forEach((row, m) => {
        const id = row[col + 1]
        t[m] = id
        t[NM + m] = shadeOf(id)
        t[NM * 2 + m] = litOf(row[1])
      })
      return t
    })

    let bw = 1, bh = 1, ox = 0, oy = 0, k = 1
    let matBuf = new Uint8Array(1), baseBuf = new Uint8Array(1), varBuf = new Uint8Array(1)
    let thrA = new Uint8Array(1), pixels = new Uint32Array(1), pixelBytes = new Uint8Array(pixels.buffer)
    let skyKeys = [], canopy = [], stars = []
    const emitList = []
    const sources = [{ w: 0, x: 0, y: 0 }, { w: 0, x: 0, y: 0 }]

    const noiseA = makeNoise(11)
    const noiseB = makeNoise(29)

    const put = (x, y, m) => {
      const px = x + ox, py = y + oy
      if (px < 0 || py < 0 || px >= bw || py >= bh) return
      matBuf[py * bw + px] = m
    }
    const putSky = (x, y, m) => {
      const px = x + ox, py = y + oy
      if (px < 0 || py < 0 || px >= bw || py >= bh) return
      const i = py * bw + px
      if (matBuf[i] === 0) matBuf[i] = m
    }
    const rect = (x, y, w, h, m) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, m)
    }
    const blit = (s, x, y, flip = false, force = -1) => {
      for (const [dx, dy, m] of s.list) put(flip ? x + s.w - 1 - dx : x + dx, y + dy, force >= 0 ? force : m)
    }
    const emit = (x, y, weight, group = 2) => {
      const px = x + ox, py = y + oy
      if (px < 0 || py < 0 || px >= bw || py >= bh) return
      emitList.push(py * bw + px, weight)
      if (group < 2) {
        const c = sources[group]
        c.w += weight
        c.x += px * weight
        c.y += py * weight
      }
    }

    const hillFar = (x) => 58 + noiseA(x * 0.022 + 3, 1.5) * 16 + noiseB(x * 0.09, 4.5) * 3
    const hillNear = (x) => 69 + noiseA(x * 0.034 + 40, 7.5) * 11 + noiseB(x * 0.14 + 7, 2.5) * 2
    const pathDist = (x, y) => {
      const main = Math.abs(x - (74 + Math.pow(Math.max(y - 86, 0), 1.45) * 0.62 + Math.sin(y * 0.3) * 1.5))
      const toTree = y < 100 ? Math.abs(y - (92 + Math.sin(x * 0.09) * 1.4 + (x - 78) * 0.012)) * (x > 78 && x < 136 ? 1 : 99) : 99
      return Math.min(main * 0.5, toTree)
    }

    const paintGround = () => {
      for (let py = 0; py < bh; py++) {
        const y = py - oy
        for (let px = 0; px < bw; px++) {
          const x = px - ox
          const i = py * bw + px
          if (y < HORIZON) {
            if (y >= hillNear(x)) {
              const tuft = noiseB(x * 0.5, y * 0.8) > 0.74 && y > hillNear(x) + 1
              matBuf[i] = tuft ? M.TREE_FAR : M.HILL_NEAR
            } else if (y >= hillFar(x)) {
              const fromTop = y - hillFar(x)
              matBuf[i] = fromTop < 2 && bayerAt(x, y) > 9 ? 0 : M.HILL_FAR
            }
            continue
          }
          const n = noiseA(x * 0.075 + 9, y * 0.2 + 3) + noiseB(x * 0.3, y * 0.5) * 0.28
          const depth = (y - HORIZON) / 30
          const v = n + (bayerAt(x, y) / 16 - 0.5) * 0.14 - depth * 0.14
          let m = M.GRASS
          if (v > 0.84) m = M.GRASS_LT
          else if (v < 0.5) m = M.GRASS_DK
          const pd = pathDist(x, y)
          if (pd < 2.4 + depth * 2.4) {
            m = noiseB(x * 0.7 + 3, y * 0.9) > 0.68 ? M.PATH_DK : M.PATH
          } else if (pd < 3.4 + depth * 2.4 && bayerAt(x, y) > 7) {
            m = M.PATH_DK
          }
          matBuf[i] = m
        }
      }
      const r = seeded(5)
      for (let x = -ox; x < bw - ox; x++) if (r() < 0.6) put(x, HORIZON, M.GRASS_DK)
      for (let i = 0; i < (bw * bh) / 60; i++) {
        const x = Math.floor(r() * bw) - ox
        const y = HORIZON + 2 + Math.floor(r() * (bh - oy - HORIZON))
        if (pathDist(x, y) < 5) continue
        put(x, y, r() < 0.5 ? M.GRASS_LT : M.GRASS_DK)
        if (r() < 0.5) put(x, y - 1, M.GRASS_LT)
      }
    }

    const paintFence = () => {
      for (let x = 90; x < 124; x += 4) {
        rect(x, 74, 2, 9, M.WOOD_LT)
        put(x + 1, 74, M.PLANK)
        rect(x + 1, 75, 1, 8, M.WOOD)
      }
      rect(89, 76, 36, 1, M.WOOD_LT)
      rect(89, 80, 36, 1, M.WOOD)
    }

    const paintBush = (cx, cy, rx, ry, seed) => {
      const r = seeded(seed)
      const blobs = Array.from({ length: 6 }, () => [cx + (r() - 0.5) * rx * 1.5, cy + (r() - 0.5) * ry, 3 + r() * (ry * 0.75)])
      for (let y = cy - ry - 3; y <= cy + ry + 1; y++) {
        for (let x = cx - rx - 3; x <= cx + rx + 3; x++) {
          let inside = false, shade = 0
          for (const [bx, by, br] of blobs) {
            const d = Math.hypot(x - bx, (y - by) * 1.15)
            if (d < br) { inside = true; shade = Math.max(shade, 1 - d / br) }
          }
          if (!inside) continue
          const v = shade * 0.6 + (cy - y) / (ry * 2.4) + (bayerAt(x, y) / 16 - 0.5) * 0.3 + noiseB(x * 0.4, y * 0.5) * 0.25
          put(x, y, v > 0.82 ? M.LEAF3 : v > 0.52 ? M.LEAF2 : v > 0.24 ? M.LEAF1 : M.LEAF0)
        }
      }
    }

    const paintFlowers = (x0, x1, y0, y1, count, seed) => {
      const r = seeded(seed)
      for (let i = 0; i < count; i++) {
        const x = Math.floor(mix(x0, x1, r()))
        const y = Math.floor(mix(y0, y1, r()))
        if (pathDist(x, y) < 4.5) continue
        put(x, y, M.STEM)
        put(x, y - 1, M.STEM)
        const m = r() < 0.55 ? M.FLOWER_A : M.FLOWER_C
        put(x, y - 2, m)
        if (r() < 0.5) {
          put(x - 1, y - 2, m)
          put(x + 1, y - 2, m)
          put(x, y - 3, m)
        }
      }
    }

    const paintHouse = () => {
      const X0 = 38, X1 = 84, TOP = 53, BASE = 85
      rect(68, 28, 8, 18, M.BRICK)
      for (let y = 28; y < 46; y += 2) {
        for (let x = 68; x < 76; x++) if ((x + (((y - 28) / 2) & 1) * 2) % 4 < 2) put(x, y, M.BRICK_LT)
      }
      rect(67, 26, 10, 2, M.STONE_LT)
      rect(67, 28, 10, 1, M.STONE)
      rect(X0, TOP, X1 - X0, BASE - TOP, M.WALL)
      for (let y = TOP + 3; y < BASE; y += 4) {
        for (let x = X0; x < X1; x++) if ((x * 7 + y * 3) % 23 !== 0) put(x, y, M.PLANK)
      }
      for (let y = TOP; y < TOP + 6; y++) {
        for (let x = X0; x < X1; x++) if (y < TOP + 3 || bayerAt(x, y) < (TOP + 6 - y) * 4) put(x, y, M.WALL_SH)
      }
      for (let x = X1 - 3; x < X1; x++) {
        for (let y = TOP; y < BASE; y++) if (bayerAt(x, y) < (x - (X1 - 3) + 1) * 5) put(x, y, M.WALL_SH)
      }
      rect(X0 - 1, BASE - 3, X1 - X0 + 2, 3, M.STONE)
      for (let x = X0 - 1; x < X1 + 1; x += 5) {
        rect(x, BASE - 3, 4, 1, M.STONE_LT)
        put(x + 2, BASE - 2, M.STONE_LT)
      }
      const RT = 34
      for (let y = RT; y < TOP; y++) {
        const t = (y - RT) / (TOP - RT)
        const l = Math.round(mix(47, X0 - 6, t))
        const r = Math.round(mix(75, X1 + 6, t))
        for (let x = l; x <= r; x++) {
          const row = Math.floor((y - RT) / 3)
          const tile = (x + (row & 1) * 3) % 6
          let m = M.ROOF
          if ((y - RT) % 3 !== 0 && tile !== 0) m = (y - RT) % 3 === 1 ? M.ROOF_LT : M.ROOF
          if (x - l < 5 + t * 8 && (y - RT) % 3 === 1 && tile !== 0) m = M.ROOF_HI
          put(x, y, m)
        }
      }
      rect(46, RT - 1, 31, 1, M.ROOF_HI)
      for (let x = X0 - 6; x <= X1 + 6; x++) {
        put(x, TOP, M.WOOD_DK)
        if (x % 3 === 0) put(x, TOP + 1, M.WOOD_DK)
      }
      rect(67, 66, 12, 19, M.WOOD_DK)
      rect(68, 67, 10, 18, M.WOOD)
      for (let x = 70; x < 78; x += 3) rect(x, 67, 1, 18, M.WOOD_DK)
      rect(68, 72, 10, 1, M.WOOD_DK)
      rect(69, 68, 8, 3, M.GLASS)
      put(70, 69, M.GLASS_HI)
      put(71, 69, M.GLASS_HI)
      put(76, 77, M.FLOWER_A)
      rect(66, 85, 14, 2, M.STONE_LT)
      rect(65, 87, 16, 1, M.STONE)
      rect(44, 59, 18, 16, M.WOOD_DK)
      rect(43, 75, 20, 3, M.WOOD)
      rect(43, 75, 20, 1, M.WOOD_LT)
      const r = seeded(77)
      for (let x = 44; x < 62; x++) {
        if (r() < 0.75) put(x, 74, r() < 0.5 ? M.FLOWER_A : M.FLOWER_C)
        if (r() < 0.5) put(x, 73, M.STEM)
      }
      put(64, 63, M.WOOD_DK)
      put(65, 63, M.WOOD_DK)
      rect(92, 82, 1, 8, M.WOOD_DK)
      rect(90, 78, 6, 4, M.ROOF_LT)
      rect(90, 78, 6, 1, M.ROOF_HI)
      put(96, 79, M.FLOWER_A)
      put(96, 80, M.FLOWER_A)
    }

    const buildCanopy = () => {
      canopy = []
      const r = seeded(303)
      const CX = 146, CY = 44
      const blobs = [[CX, CY, 21]]
      for (let i = 0; i < 16; i++) {
        const a = r() * Math.PI * 2
        const d = 14 + r() * 13
        blobs.push([CX + Math.cos(a) * d * 1.08, CY + Math.sin(a) * d * 0.82, 6 + r() * 7])
      }
      for (let y = CY - 36; y <= CY + 32; y++) {
        for (let x = CX - 42; x <= CX + 42; x++) {
          let inside = false, best = 0
          for (const [bx, by, br] of blobs) {
            const d = Math.hypot(x - bx, y - by)
            if (d < br) { inside = true; best = Math.max(best, 1 - d / br) }
          }
          if (!inside) continue
          const lightDir = ((CX - x) * 0.4 + (CY - y) * 0.75) / 26
          const clump = best * 0.5
          const grain = noiseB(x * 0.26 + 20, y * 0.3) * 0.7 + noiseA(x * 0.7, y * 0.7) * 0.3
          const v = lightDir * 0.34 + clump + grain + (bayerAt(x, y) / 16 - 0.5) * 0.16 - 0.3
          const m = v > 0.82 ? M.LEAF3 : v > 0.52 ? M.LEAF2 : v > 0.26 ? M.LEAF1 : M.LEAF0
          canopy.push(x, y, m)
        }
      }
    }

    const paintTrunk = () => {
      const X = 143
      for (let y = 56; y < 90; y++) {
        const flare = y > 83 ? (y - 83) * 0.8 : 0
        const up = y < 66 ? (66 - y) * 0.1 : 0
        const l = Math.round(X - flare - up)
        const r = Math.round(X + 7 + flare * 0.9 + up)
        for (let x = l; x <= r; x++) {
          const t = (x - l) / Math.max(r - l, 1)
          const grain = noiseB(x * 0.9, y * 0.14) > 0.55
          put(x, y, t > 0.84 ? M.BARK : t < 0.2 ? M.WOOD_LT : grain ? M.BARK_LT : M.WOOD)
        }
      }
      rect(156, 87, 5, 2, M.STONE)
      rect(157, 86, 3, 1, M.STONE_LT)
      rect(124, 95, 4, 2, M.STONE)
      rect(125, 94, 2, 1, M.STONE_LT)
    }

    const buildBase = () => {
      matBuf.fill(0)
      paintGround()
      paintFence()
      paintBush(22, 78, 16, 8, 61)
      paintBush(176, 80, 14, 7, 62)
      paintBush(-6, 81, 11, 6, 63)
      paintBush(204, 81, 10, 5, 64)
      paintTrunk()
      paintHouse()
      paintFlowers(96, 126, 85, 92, 26, 91)
      paintFlowers(14, 38, 86, 96, 16, 92)
      paintFlowers(150, 205, 90, 106, 24, 93)
      paintFlowers(-14, 14, 88, 104, 12, 95)
      paintFlowers(40, 62, 90, 104, 12, 94)
      baseBuf.set(matBuf)
      buildCanopy()

      const r = seeded(808)
      stars = []
      for (let i = 0; i < 95; i++) {
        stars.push({ x: Math.floor(r() * (CORE_W + 40)) - 20, y: Math.floor(r() * 66), seed: r(), big: r() < 0.14 })
      }
      skyKeys = KEYS.map(([, , stops]) => {
        const sky = new Uint8Array(bw * bh)
        const n = stops.length - 1
        for (let py = 0; py < bh; py++) {
          const pos = clamp((py - oy) / HORIZON) * n
          const a = Math.min(Math.floor(pos), n)
          const b = Math.min(a + 1, n)
          const f = smoothstep(0.3, 0.7, pos - a) * 4
          for (let px = 0; px < bw; px++) {
            const cell = ((py & 1) << 1) | (px & 1)
            sky[py * bw + px] = f > [0, 2, 3, 1][cell] ? stops[b] : stops[a]
          }
        }
        return sky
      })
    }

    const res = { x: 73, inside: false, face: 1, step: 0, doorOpen: 0, startle: 0, hop: 0, blink: 0, nextBlink: 2, page: 0, nextPage: 4, pageT: 0 }
    const clouds = [
      { x: 8, y: 13, w: 30, h: 9, seed: 1, speed: 0.55 },
      { x: 88, y: 24, w: 22, h: 7, seed: 2, speed: 0.8 },
      { x: 150, y: 9, w: 34, h: 10, seed: 3, speed: 0.42 },
      { x: 214, y: 30, w: 18, h: 5, seed: 4, speed: 1.05 },
    ].map((cloud) => {
      const r = seeded(cloud.seed * 977)
      const blobs = Array.from({ length: 6 }, (_, i) => [cloud.w * ((i + 0.5) / 6) + (r() - 0.5) * 3, cloud.h * (0.45 + (r() - 0.5) * 0.35), cloud.h * (0.3 + r() * 0.32)])
      const list = []
      for (let y = 0; y < cloud.h + 3; y++) {
        for (let x = -2; x < cloud.w + 3; x++) {
          let inside = false
          for (const [bx, by, br] of blobs) if (Math.hypot(x - bx, (y - by) * 1.25) < br) inside = true
          if (!inside) continue
          list.push(x, y, y > cloud.h * 0.62 ? 1 : 0)
        }
      }
      return { ...cloud, list }
    })
    const smoke = [], zees = [], leaves = []
    const birds = { t: -1, next: 8, y: 20, dir: 1 }
    const shoot = { t: -1, next: 14 }
    const flies = Array.from({ length: 8 }, (_, i) => ({ seed: i * 7.3 + 1, x: 150 + (i - 3) * 9, y: 88 + (i % 3) * 6 }))
    const butterfly = { x: 108, y: 84 }
    let anim = 0, smokeAcc = 0, zeeAcc = 0, lampFlick = 1, windowL = 0, lanternL = 0, shutter = 0

    const hourOf = (clock) => ((clock % 24) + 24) % 24
    const planFor = (h) => {
      if (h >= 9.6 && h < 11) return { outside: true, x: 104, act: 'tend' }
      if (h >= 11 && h < 16.2) return { outside: true, x: 131, act: 'read' }
      if (h >= 16.2 && h < 17.2) return { outside: true, x: 88, act: 'stroll' }
      return { outside: false, x: 73, act: 'in' }
    }

    const stepResident = (dt, h, speedHint) => {
      const plan = planFor(h)
      const want = plan.outside ? plan.x : 73
      if (calm) {
        res.inside = !plan.outside
        res.x = want
        return plan
      }
      res.startle = Math.max(0, res.startle - dt)
      res.hop = res.startle > 0.55 ? Math.sin(((0.9 - res.startle) / 0.35) * Math.PI) * 3 : 0
      res.doorOpen = Math.max(0, res.doorOpen - dt)
      if (res.startle > 0) return plan

      if (res.inside && plan.outside) {
        res.inside = false
        res.x = 73
        res.doorOpen = 0.5
      }
      if (!res.inside) {
        const delta = want - res.x
        if (Math.abs(delta) > 0.5) {
          const speed = 17 + clamp(speedHint, 0, 1) * 72 + (Math.abs(delta) > 34 ? 8 : 0)
          const move = Math.min(Math.abs(delta), speed * dt)
          res.x += Math.sign(delta) * move
          res.face = Math.sign(delta)
          res.step += move * 0.28
        } else {
          res.x = want
          res.step = 0
          if (!plan.outside) {
            res.inside = true
            res.doorOpen = 0.45
          }
        }
      }
      res.nextBlink -= dt
      if (res.nextBlink <= 0) {
        res.blink = 0.13
        res.nextBlink = 1.8 + Math.random() * 3.4
      }
      res.blink = Math.max(0, res.blink - dt)
      res.nextPage -= dt
      if (res.nextPage <= 0) {
        res.pageT = 0.42
        res.nextPage = 3.6 + Math.random() * 3.2
      }
      res.pageT = Math.max(0, res.pageT - dt)
      return plan
    }

    const drawSky = (h) => {
      const dark = smoothstep(18.2, 20.2, h) + (1 - smoothstep(4.6, 6.2, h))
      const night = clamp(dark)
      if (night > 0.02) {
        for (const s of stars) {
          if (s.seed > night * 1.05) continue
          const twinkle = calm ? 1 : Math.sin(anim * (1.3 + s.seed * 4.4) + s.seed * 40)
          if (twinkle < -0.72) continue
          const m = twinkle < 0.1 && !s.big ? M.STAR_DIM : M.STAR
          putSky(s.x, s.y, m)
          if (s.big && twinkle > 0.55) {
            putSky(s.x - 1, s.y, M.STAR_DIM)
            putSky(s.x + 1, s.y, M.STAR_DIM)
            putSky(s.x, s.y - 1, M.STAR_DIM)
            putSky(s.x, s.y + 1, M.STAR_DIM)
          }
        }
        if (!calm && night > 0.9 && shoot.t >= 0) {
          const f = shoot.t / 0.55
          for (let i = 0; i < 7; i++) {
            const u = f * 42 - i * 2
            if (u > 0 && u < 42) putSky(Math.round(shoot.x + u), Math.round(shoot.y + u * 0.45), i < 2 ? M.STAR : M.STAR_DIM)
          }
        }
      }
      if (h > 5.2 && h < 19) {
        const a = ((h - 6) / 12) * Math.PI
        const sx = Math.round(96 - Math.cos(a) * 102)
        const sy = Math.round(HORIZON - 2 - Math.sin(a) * 70)
        const low = 1 - clamp(Math.sin(a) * 1.6)
        const R = 5 + Math.round(low * 2)
        for (let dy = -R - 5; dy <= R + 5; dy++) {
          for (let dx = -R - 5; dx <= R + 5; dx++) {
            const d = Math.hypot(dx, dy)
            const x = sx + dx, y = sy + dy
            if (d <= R - 1) { putSky(x, y, M.SUN); emit(x, y, 26 + low * 90, 1) }
            else if (d <= R) putSky(x, y, M.SUN_RIM)
            else if (d <= R + 4 && bayerAt(x, y) < (R + 4.6 - d) * 2.2) putSky(x, y, M.SUN_RIM)
          }
        }
      }
      const mh = h >= 17.6 ? h : h + 24
      if (mh > 17.6 && mh < 30.4) {
        const a = ((mh - 18) / 12) * Math.PI
        const mx = Math.round(96 - Math.cos(a) * 102)
        const my = Math.round(HORIZON - 2 - Math.sin(a) * 66)
        const R = 6
        for (let dy = -R - 3; dy <= R + 3; dy++) {
          for (let dx = -R - 3; dx <= R + 3; dx++) {
            const d = Math.hypot(dx, dy)
            const x = mx + dx, y = my + dy
            if (d <= R) {
              const crater = (dx === -2 && dy === -2) || (dx === 2 && dy === 1) || (dx === -3 && dy === 2) || (dx === 1 && dy === -3)
              const shaded = dx * 0.7 + dy * 0.7 > R * 0.45
              putSky(x, y, crater || shaded ? M.MOON_DK : M.MOON)
              emit(x, y, 12, 1)
            } else if (d <= R + 3 && bayerAt(x, y) < (R + 3.4 - d) * 1.6) putSky(x, y, M.STAR_DIM)
          }
        }
      }
      for (const cloud of clouds) {
        const span = CORE_W + 96
        const cx = ((cloud.x + (calm ? 0 : anim * cloud.speed) + 48) % span) - 48
        const x0 = Math.round(cx)
        for (let i = 0; i < cloud.list.length; i += 3) {
          const x = x0 + cloud.list[i], y = cloud.y + cloud.list[i + 1], under = cloud.list[i + 2]
          if (under && bayerAt(x, y) > 11) continue
          putSky(x, y, under ? M.CLOUD_SH : M.CLOUD)
        }
      }
      if (!calm && h > 7 && h < 18.5 && birds.t >= 0) {
        const flap = Math.floor(anim * 7) % 2
        for (let i = 0; i < 4; i++) {
          const x = Math.round((birds.dir > 0 ? -12 + birds.t * 26 : CORE_W + 12 - birds.t * 26) - birds.dir * i * 6)
          const y = birds.y + (i % 2) * 3 + i
          putSky(x, y, M.BIRD)
          putSky(x - 1, y - flap, M.BIRD)
          putSky(x + 1, y - flap, M.BIRD)
        }
      }
    }

    const drawShadows = (h) => {
      if (h < 6.2 || h > 18.6) return
      const a = ((h - 6) / 12) * Math.PI
      const dir = -Math.cos(a)
      const fade = smoothstep(6.2, 7.6, h) * (1 - smoothstep(17.4, 18.6, h))
      const reach = 3 + Math.abs(dir) * 22
      const mark = (x, y, strength) => {
        const px = x + ox, py = y + oy
        if (px < 0 || py < 0 || px >= bw || py >= bh) return
        const i = py * bw + px
        if (matBuf[i] !== 0 && strength * fade * 16 > bayerAt(x, y)) varBuf[i] = 1
      }
      const tx = 146 + reach * 0.8 * dir
      for (let y = 87; y < 101; y++) {
        const t = (y - 87) / 14
        const half = 25 * Math.sqrt(1 - Math.pow(t * 2 - 1, 2)) * (1 + Math.abs(dir) * 0.3)
        const cx = tx + (t - 0.5) * dir * 8
        for (let x = Math.round(cx - half); x <= cx + half; x++) mark(x, y, 1 - (Math.abs(x - cx) / (half + 1)) * 0.4)
      }
      for (let y = 87; y < 94; y++) {
        const t = (y - 87) / 7
        const shift = dir * reach * 0.8 * t
        for (let x = Math.round(36 + Math.min(shift, 0)); x <= 86 + Math.max(shift, 0); x++) mark(x, y, 1 - t * 0.5)
      }
    }

    const drawWindow = (h) => {
      const WX = 46, WY = 61, WW = 14, WH = 12
      const lamp = h >= 19.6 && h < 22.9
      const cook = h >= 17.2 && h < 19.6
      const morning = h >= 7 && h < 9.6
      const asleep = h >= 22.9 || h < 6.5

      if (lamp || cook) {
        const flick = lamp ? lampFlick : 0.6 + 0.08 * Math.sin(anim * 9)
        const swing = lamp && !calm ? Math.round(Math.sin(anim * 0.9) * 0.7) : 0
        for (let y = 0; y < WH; y++) {
          for (let x = 0; x < WW; x++) {
            let m
            if (lamp) {
              const cone = Math.abs(x - (4.5 + swing)) - (y - 2) * 0.62
              m = cone < 0 && y >= 3 ? M.LIT_HI : cone < 2.2 ? M.LIT : M.LIT_DK
            } else {
              m = Math.hypot(x - 6.5, y - 8) < 5 && bayerAt(x, y) < 8 ? M.LIT : M.LIT_DK
            }
            if (y >= WH - 1) m = M.LIT_DK
            put(WX + x, WY + y, m)
            if (y < WH) emit(WX + x, WY + y, (m === M.LIT_HI ? 255 : m === M.LIT ? 210 : 130) * flick, 0)
          }
        }
        if (lamp) {
          const lx = WX + 4 + swing
          put(lx, WY, M.SIL); put(lx, WY + 1, M.SIL)
          rect(lx - 2, WY + 2, 5, 1, M.SIL)
          rect(lx - 1, WY + 3, 3, 1, M.LIT_HI)
          rect(WX + 1, WY + 10, 9, 1, M.SIL)
          rect(WX + 2, WY + 11, 1, 1, M.SIL)
          rect(WX + 8, WY + 11, 1, 1, M.SIL)
          rect(WX + 4, WY + 9, 3, 1, M.SIL)
          if (res.pageT > 0 && !calm) put(WX + 5, WY + 8, M.SIL)
          if (!res.inside) return { lamp, cook, asleep }
          const startled = res.startle > 0
          const look = startled || (!calm && Math.sin(anim * 0.46) > 0.72)
          const nod = !calm && !look && Math.sin(anim * 1.7) > 0.86 ? 1 : 0
          const hy = WY + 3 + nod - (startled ? 1 : 0)
          const hx = WX + 8
          rect(hx, hy + (look ? 0 : 1), 4, 3, M.SIL)
          put(hx + 1, hy + (look ? -1 : 0), M.SIL)
          put(hx + 2, hy + (look ? -1 : 0), M.SIL)
          if (!look) put(hx - 1, hy + 2, M.SIL)
          rect(WX + 8, WY + 7, 5, 3, M.SIL)
          rect(WX + 9, WY + 10, 4, 2, M.SIL)
          rect(WX + 6, WY + 8, 3, 1, M.SIL)
        } else {
          const walk = calm ? 0 : Math.sin(anim * 0.8) * 3
          if (res.inside) blit(SPR.sil, Math.round(WX + 3 + walk), WY + 5, false, M.SIL)
          if (!calm) {
            for (let i = 0; i < 3; i++) {
              const s = (anim * 0.9 + i * 0.33) % 1
              put(WX + 11 + Math.round(Math.sin(s * 8 + i)), WY + 7 - Math.round(s * 6), M.LIT_HI)
            }
          }
          rect(WX + 10, WY + 8, 4, 1, M.SIL)
        }
      } else if (morning) {
        rect(WX, WY, WW, WH, M.ROOM)
        for (let y = 0; y < 2; y++) for (let x = 0; x < WW; x++) put(WX + x, WY + y, M.GLASS_HI)
        let bust = SPR.bust
        if (!calm) {
          const c = (anim % 5.4) / 5.4
          if (c > 0.16 && c < 0.24) bust = SPR.bustHalf
          else if (c >= 0.24 && c < 0.5) bust = SPR.bustUp
          else if (c >= 0.5 && c < 0.58) bust = SPR.bustHalf
          else if (res.blink > 0) bust = SPR.bustBlink
        }
        const dy = res.startle > 0 ? -1 : 0
        if (res.inside) blit(bust, WX + 3, WY + 4 + dy)
      } else {
        rect(WX, WY, WW, WH, M.GLASS)
        for (let i = 0; i < 6; i++) {
          put(WX + 2 + i, WY + 7 - i, M.GLASS_HI)
          if (i < 4) put(WX + 6 + i, WY + 8 - i, M.GLASS_HI)
        }
      }

      rect(WX + 6, WY, 2, 2, M.WOOD_DK)
      rect(WX, WY + 4, 1, 1, M.WOOD_DK)
      rect(WX + 13, WY + 4, 1, 1, M.WOOD_DK)

      const closed = asleep ? 1 : 0
      shutter += calm ? closed - shutter : clamp(closed - shutter, -0.09, 0.09)
      const leaf = Math.round(shutter * 7)
      const drawLeaf = (x0, w) => {
        for (let i = 0; i < w; i++) for (let y = 0; y < 14; y++) put(x0 + i, 60 + y, y % 2 === 0 ? M.WOOD : M.WOOD_LT)
      }
      const open = 4 - Math.min(4, leaf)
      if (open > 0) { drawLeaf(44 - open, open); drawLeaf(62, open) }
      if (leaf > 0) { drawLeaf(46, leaf); drawLeaf(60 - leaf, leaf) }
      return { lamp, cook, asleep }
    }

    const drawDoor = () => {
      if (res.doorOpen > 0) {
        rect(68, 67, 10, 18, M.SIL)
        rect(68, 67, 2, 18, M.WOOD_LT)
      }
    }

    const drawResident = (plan) => {
      if (res.inside) return
      const base = 89
      const dy = -Math.round(res.hop)
      const startled = res.startle > 0
      const moving = Math.abs((plan.outside ? plan.x : 73) - res.x) > 0.5
      if (!moving && plan.act === 'read' && Math.abs(res.x - 131) < 1) {
        const up = startled
        const spr = up ? SPR.seatUp : res.blink > 0 ? SPR.seatBlink : SPR.seat
        const x = 131, y = base - 10 + dy
        blit(spr, x, y)
        const bx = x - 1, by = y + 5
        if (!up) {
          if (res.pageT > 0.28) { rect(bx, by, 4, 3, M.BOOK); rect(bx + 1, by - 1, 2, 1, M.BOOK_DK) }
          else if (res.pageT > 0.14) rect(bx + 1, by - 2, 2, 5, M.BOOK)
          else { rect(bx, by, 4, 3, M.BOOK); rect(bx + 3, by, 1, 3, M.BOOK_DK); put(bx + 1, by + 1, M.BOOK_DK) }
        } else rect(bx, by + 1, 4, 2, M.BOOK_DK)
        if (!calm && Math.sin(anim * 1.1) > 0.8) put(x + 1, y + 9, M.BOOT)
        if (startled) { rect(x + 5, y - 7, 1, 4, M.MARK); put(x + 5, y - 2, M.MARK) }
        return
      }
      if (!moving && plan.act === 'tend') {
        const bob = !calm && Math.sin(anim * 2.2) > 0
        blit(bob ? SPR.crouch : SPR.stand, Math.round(res.x) - 3, bob ? base - 10 : base - 12, false)
        return
      }
      let spr = SPR.stand
      if (startled) spr = SPR.up
      else if (moving) spr = SPR.walk[Math.floor(res.step) % 4]
      else if (res.blink > 0) spr = SPR.blink
      blit(spr, Math.round(res.x) - 3, base - 12 + dy, res.face < 0)
      if (startled) { rect(Math.round(res.x), base - 19 + dy, 1, 4, M.MARK); put(Math.round(res.x), base - 14 + dy, M.MARK) }
    }

    const drawCanopy = () => {
      for (let i = 0; i < canopy.length; i += 3) {
        const y = canopy[i + 1]
        const sway = calm ? 0 : Math.round(Math.sin(anim * 0.9 + y * 0.11) * (1.15 - (y - 10) * 0.012))
        put(canopy[i] + sway, y, canopy[i + 2])
      }
    }

    const drawParticles = (h, dt) => {
      const smoking = (h >= 17.2 && h < 19.8) || (h >= 7 && h < 8.2)
      if (!calm && smoking) {
        smokeAcc += dt * (h >= 17 ? 3.2 : 1.4)
        while (smokeAcc >= 1) {
          smokeAcc -= 1
          smoke.push({ x: 72 + Math.random() * 2, y: 25, t: 0, seed: Math.random() * 10 })
        }
      }
      for (let i = smoke.length - 1; i >= 0; i--) {
        const s = smoke[i]
        s.t += dt; s.y -= dt * (7 - s.t * 0.8); s.x += dt * (2.2 + Math.sin(s.t * 1.7 + s.seed) * 2.6)
        if (s.t > 4.2 || s.y < -4) { smoke.splice(i, 1); continue }
        const size = 1 + Math.floor(s.t * 0.75)
        const thin = s.t * 2.6
        for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
          const x = Math.round(s.x) + dx, y = Math.round(s.y) + dy
          if (bayerAt(x, y) < 16 - thin * 1.3) put(x, y, s.t > 2.3 ? M.SMOKE_DK : M.SMOKE)
        }
      }
      if (!calm && (h >= 23.4 || h < 6)) {
        zeeAcc += dt * 0.62
        while (zeeAcc >= 1) { zeeAcc -= 1; zees.push({ x: 60, y: 58, t: 0 }) }
      }
      for (let i = zees.length - 1; i >= 0; i--) {
        const z = zees[i]
        z.t += dt; z.y -= dt * 4; z.x += dt * (1.2 + Math.sin(z.t * 2) * 2)
        if (z.t > 3 || (h >= 6 && h < 23)) { zees.splice(i, 1); continue }
        const x = Math.round(z.x), y = Math.round(z.y), big = z.t > 1.2, n = big ? 3 : 2
        rect(x, y, n, 1, M.ZZZ); put(x + n - 2, y + 1, M.ZZZ)
        if (big) put(x, y + 2, M.ZZZ)
        rect(x, y + (big ? 3 : 2), n, 1, M.ZZZ)
      }
      const night = clamp(smoothstep(19.4, 20.8, h) + (1 - smoothstep(3.6, 5, h)))
      if (night > 0.3 && !calm) {
        for (const f of flies) {
          const wx = f.x + Math.sin(anim * 0.33 + f.seed) * 14 + Math.sin(anim * 0.9 + f.seed * 2) * 3
          const wy = f.y + Math.sin(anim * 0.47 + f.seed * 1.4) * 5
          const pulse = Math.sin(anim * 1.4 + f.seed * 3)
          if (pulse < 0.1) continue
          put(Math.round(wx), Math.round(wy), M.FIREFLY)
          emit(Math.round(wx), Math.round(wy), 170 * pulse)
        }
      }
      if (!calm && h > 8 && h < 17) {
        butterfly.x = 108 + Math.sin(anim * 0.31) * 15 + Math.sin(anim * 1.1) * 2
        butterfly.y = 82 + Math.sin(anim * 0.72) * 5
        const x = Math.round(butterfly.x), y = Math.round(butterfly.y)
        put(x, y, M.WOOD_DK)
        if (Math.floor(anim * 6) % 2) { put(x - 1, y - 1, M.WING); put(x + 1, y - 1, M.WING) }
        else { put(x - 1, y, M.WING); put(x + 1, y, M.WING) }
      }
      if (!calm && h > 7 && h < 19 && Math.random() < dt * 0.18) {
        leaves.push({ x: 124 + Math.random() * 44, y: 54 + Math.random() * 14, t: 0, seed: Math.random() * 6 })
      }
      for (let i = leaves.length - 1; i >= 0; i--) {
        const l = leaves[i]
        l.t += dt; l.y += dt * 9; l.x += Math.sin(l.t * 2.3 + l.seed) * dt * 11 - dt * 2
        if (l.y > 96 || l.t > 8) { leaves.splice(i, 1); continue }
        put(Math.round(l.x), Math.round(l.y), M.LEAF3)
      }
    }

    const drawLights = (state, h) => {
      const targetWin = state.lamp ? 1 : state.cook ? 0.46 : 0
      const targetLan = h >= 18.4 && h < 22.9 ? 1 : 0
      windowL += (targetWin - windowL) * (calm ? 1 : 0.28)
      lanternL += (targetLan - lanternL) * (calm ? 1 : 0.28)
      if (lanternL > 0.02) {
        const flick = calm ? 1 : 0.94 + 0.06 * Math.sin(anim * 11) * Math.sin(anim * 3.7)
        rect(64, 64, 3, 1, M.WOOD_DK); rect(64, 65, 3, 3, M.LIT_HI); rect(64, 68, 3, 1, M.WOOD_DK)
        for (let y = 65; y < 68; y++) for (let x = 64; x < 67; x++) emit(x, y, 255 * lanternL * flick, 0)
      } else {
        rect(64, 64, 3, 1, M.WOOD_DK); rect(64, 65, 3, 3, M.GLASS); rect(64, 68, 3, 1, M.WOOD_DK)
      }
      const pool = (cx, cy, rx, ry, L) => {
        if (L <= 0.01) return
        for (let y = Math.max(cy - ry, -oy); y <= cy + ry; y++) {
          for (let x = cx - rx; x <= cx + rx; x++) {
            const px = x + ox, py = y + oy
            if (px < 0 || py < 0 || px >= bw || py >= bh) continue
            const i = py * bw + px
            const m = matBuf[i]
            if (m === 0 || m === M.SIL || m === M.LIT || m === M.LIT_HI || m === M.LIT_DK) continue
            const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
            if ((1 - d) * L * 1.5 * 16 > bayerAt(x, y)) varBuf[i] = 2
          }
        }
      }
      pool(53, 92, 26, 12, windowL * 0.95)
      pool(53, 67, 17, 10, windowL * 0.36)
      pool(65, 69, 11, 13, lanternL * 0.5)
      pool(65, 90, 19, 7, lanternL * 0.6)
    }

    let keyA = 0, keyB = 1, keyP = 0
    const pickKeys = (h) => {
      for (let i = 0; i < KEYS.length - 1; i++) {
        if (h >= KEYS[i][0] && h < KEYS[i + 1][0]) {
          keyA = i; keyB = i + 1
          keyP = clamp(((h - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]) - 0.32) / 0.36)
          return
        }
      }
      keyA = 0; keyB = 1; keyP = 0
    }

    const renderWorld = (clock, dt, hurryVal) => {
      const h = hourOf(clock)
      if (!calm) anim += dt
      matBuf.set(baseBuf)
      varBuf.fill(0)
      emitList.length = 0
      for (const c of sources) { c.w = 0; c.x = 0; c.y = 0 }
      lampFlick = calm ? 1 : 0.95 + 0.05 * Math.sin(anim * 13) * Math.sin(anim * 5.3)

      if (!calm) {
        birds.next -= dt
        if (birds.t >= 0) { birds.t += dt; if (birds.t > 9) birds.t = -1 }
        else if (birds.next <= 0) { birds.t = 0; birds.next = 12 + Math.random() * 14; birds.y = 10 + Math.random() * 24; birds.dir = Math.random() < 0.5 ? 1 : -1 }
        shoot.next -= dt
        if (shoot.t >= 0) { shoot.t += dt; if (shoot.t > 0.6) shoot.t = -1 }
        else if (shoot.next <= 0) { shoot.t = 0; shoot.next = 9 + Math.random() * 16; shoot.x = 10 + Math.random() * 130; shoot.y = 2 + Math.random() * 20 }
      }

      const plan = stepResident(dt, h, hurryVal)
      drawSky(h)
      drawShadows(h)
      const state = drawWindow(h)
      drawDoor()
      drawLights(state, h)
      drawResident(plan)
      drawCanopy()
      drawParticles(h, dt)

      pickKeys(h)
      const ta = table[keyA], tb = table[keyB], sa = skyKeys[keyA], sb = skyKeys[keyB]
      const p = keyP * 16, n = bw * bh
      for (let i = 0; i < n; i++) {
        const m = matBuf[i]
        const useB = thrA[i] < p
        const idx = m === 0 ? (useB ? sb[i] : sa[i]) : (useB ? tb : ta)[varBuf[i] * NM + m]
        pixels[i] = palette32[idx]
      }
    }

    const GRID_W = 72
    let GRID_H = 44
    let glowRaw = new Float32Array(1), glowNearBuf = new Float32Array(1), glowFarBuf = new Float32Array(1), glowTemp = new Float32Array(1)

    const boxBlur = (src, dst, w, h, r) => {
      const size = r * 2 + 1
      for (let y = 0; y < h; y++) {
        const row = y * w * 4
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let x = -r; x <= r; x++) sum += src[row + clamp(x, 0, w - 1) * 4 + c]
          for (let x = 0; x < w; x++) {
            dst[row + x * 4 + c] = sum / size
            sum += src[row + clamp(x + r + 1, 0, w - 1) * 4 + c] - src[row + clamp(x - r, 0, w - 1) * 4 + c]
          }
        }
      }
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let y = -r; y <= r; y++) sum += dst[clamp(y, 0, h - 1) * w * 4 + x * 4 + c]
          for (let y = 0; y < h; y++) {
            src[y * w * 4 + x * 4 + c] = sum / size
            sum += dst[clamp(y + r + 1, 0, h - 1) * w * 4 + x * 4 + c] - dst[clamp(y - r, 0, h - 1) * w * 4 + x * 4 + c]
          }
        }
      }
    }

    let gl = null
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      })
    } catch {
      gl = null
    }
    let program = null
    const loc = {}
    let vao = null, quad = null, texWorld = null, texNear = null

    const compile = (type, source) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, source)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
      return s
    }
    const setupGl = () => {
      if (!gl) return false
      try {
        program = gl.createProgram()
        const v = compile(gl.VERTEX_SHADER, VERT)
        const f = compile(gl.FRAGMENT_SHADER, FRAG)
        gl.attachShader(program, v); gl.attachShader(program, f)
        gl.bindAttribLocation(program, 0, 'aPos')
        gl.linkProgram(program)
        gl.deleteShader(v); gl.deleteShader(f)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'link')
      } catch {
        return false
      }
      gl.useProgram(program)
      for (const name of ['uWorld', 'uGlowNear', 'uRes', 'uPill', 'uOrigin', 'uWorldSize', 'uGlowSize', 'uLens', 'uBezel', 'uK', 'uNight', 'uLift', 'uShellDay', 'uShellNight', 'uInk', 'uLight', 'uHiNight', 'uLoNight', 'uHomeCol', 'uSkyCol', 'uHomePos', 'uSkyPos']) {
        loc[name] = gl.getUniformLocation(program, name)
      }
      vao = gl.createVertexArray()
      gl.bindVertexArray(vao)
      quad = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      const makeTex = () => {
        const t = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        return t
      }
      texWorld = makeTex()
      texNear = makeTex()
      gl.uniform1i(loc.uWorld, 0)
      gl.uniform1i(loc.uGlowNear, 1)
      gl.disable(gl.BLEND)
      return true
    }

    let ready = setupGl()
    let ctx2d = null, lowCanvas = null
    if (!ready) {
      const fresh = canvas.cloneNode(false)
      canvas.replaceWith(fresh)
      canvas = fresh
      ctx2d = canvas.getContext('2d')
    }

    const shape = { W: 1, H: 1, dpr: 1, pillW: 1, pillH: 1, bezel: 1, winW: 1, winH: 1, r0: 1, travel: 1, travelCss: 1, ox: 0, oy: 0 }

    const measure = () => {
      const box = root.getBoundingClientRect()
      if (!box.width || !box.height) return false
      // دقة فائقة (حتى 3x) لمنع أي بكسلة أو تدرج خشن
      const dpr = Math.min(3, Math.max(2, devicePixelRatio || 1))
      const W = Math.max(2, Math.round(box.width * dpr))
      const H = Math.max(2, Math.round(box.height * dpr))
      const changed = W !== shape.W || H !== shape.H
      shape.W = W; shape.H = H; shape.dpr = dpr
      shape.pillH = H / 1.08
      shape.pillW = shape.pillH * PILL_RATIO
      shape.bezel = shape.pillH * 0.052
      shape.winW = shape.pillW - shape.bezel * 2
      shape.winH = shape.pillH - shape.bezel * 2
      const gap = shape.pillH * 0.032
      shape.r0 = shape.winH / 2 - gap
      shape.travel = shape.winW - (shape.r0 + gap) * 2
      shape.travelCss = shape.travel / dpr

      canvas.style.width = `${W / dpr}px`
      canvas.style.height = `${H / dpr}px`
      if (!changed) return false
      canvas.width = W
      canvas.height = H

      // ملاءمة المشهد بالكامل داخل الكبسولة بدقة ناعمة
      k = Math.max(0.5, shape.winH / CORE_H)
      const needW = Math.ceil(shape.winW / k) + MARGIN * 2
      const needH = Math.ceil(shape.winH / k) + MARGIN * 2
      bw = needW + (needW & 1)
      bh = needH + (needH & 1)
      ox = (bw - CORE_W) >> 1
      oy = (bh - CORE_H) >> 1
      matBuf = new Uint8Array(bw * bh)
      baseBuf = new Uint8Array(bw * bh)
      varBuf = new Uint8Array(bw * bh)
      pixels = new Uint32Array(bw * bh)
      pixelBytes = new Uint8Array(pixels.buffer)
      thrA = new Uint8Array(bw * bh)
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) thrA[y * bw + x] = bayerAt(x + 1, y + 2)
      buildBase()

      shape.ox = Math.floor(W / 2 - (bw * k) / 2)
      shape.oy = Math.floor(H / 2 + (bh * k) / 2)

      GRID_H = Math.max(8, Math.round((GRID_W * H) / W))
      const size = GRID_W * GRID_H * 4
      glowRaw = new Float32Array(size)
      glowNearBuf = new Float32Array(size)
      glowFarBuf = new Float32Array(size)
      glowTemp = new Float32Array(size)

      if (ready) {
        gl.viewport(0, 0, W, H)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texWorld)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, bw, bh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, texNear)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, GRID_W, GRID_H, 0, gl.RGBA, gl.FLOAT, null)
      } else {
        lowCanvas = offscreen(bw, bh)
      }
      return true
    }

    const uploadWorld = () => {
      glowRaw.fill(0)
      for (let e = 0; e < emitList.length; e += 2) {
        const i = emitList[e], w = emitList[e + 1] / 255
        const px = i % bw, py = (i - px) / bw
        const fx = ((shape.ox + (px + 0.5) * k) / shape.W) * GRID_W
        const fy = ((shape.H - shape.oy + (py + 0.5) * k) / shape.H) * GRID_H
        const gx = clamp(Math.floor(fx), 0, GRID_W - 1)
        const gy = clamp(Math.floor(fy), 0, GRID_H - 1)
        const c = pixels[i], at = (gy * GRID_W + gx) * 4
        glowRaw[at] += (c & 255) * w * 0.0007
        glowRaw[at + 1] += ((c >>> 8) & 255) * w * 0.0007
        glowRaw[at + 2] += ((c >>> 16) & 255) * w * 0.0007
      }
      glowNearBuf.set(glowRaw)
      boxBlur(glowNearBuf, glowTemp, GRID_W, GRID_H, 1)
      glowFarBuf.set(glowRaw)
      boxBlur(glowFarBuf, glowTemp, GRID_W, GRID_H, 3)
      for (let i = 0; i < glowNearBuf.length; i++) glowNearBuf[i] += glowFarBuf[i] * 0.55

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texWorld)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, bw, bh, gl.RGBA, gl.UNSIGNED_BYTE, pixelBytes)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texNear)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GRID_W, GRID_H, gl.RGBA, gl.FLOAT, glowNearBuf)
    }

    const initialCfg = THEME_CONFIGS[themeRef.current] || THEME_CONFIGS.green
    let x = initialCfg.pos
    let velocity = 0
    let target = initialCfg.pos
    let moving = false
    let stretch = 0, stretchV = 0, lift = 0, liftTarget = 0, hurry = 0
    let branch = 'pm'
    let amStart = CLOCK_NIGHT
    let nightClock = CLOCK_NIGHT
    let drag = null
    let suppressClick = 0

    const clockOf = () => {
      if (branch === 'am') return mix(36, amStart, x)
      if (x >= 0.98 && !moving && !drag) return nightClock
      return CLOCK_DAY + (CLOCK_NIGHT - CLOCK_DAY) * x
    }

    const beginTravel = () => {
      if (x <= 0.005) branch = 'pm'
      else if (x >= 0.995) {
        branch = 'am'
        amStart = nightClock
      }
    }

    const drawGl = (night) => {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform2f(loc.uRes, shape.W, shape.H)
      gl.uniform2f(loc.uPill, shape.pillW / 2, shape.pillH / 2)
      gl.uniform2f(loc.uOrigin, shape.ox, shape.oy)
      gl.uniform2f(loc.uWorldSize, bw, bh)
      gl.uniform2f(loc.uGlowSize, GRID_W, GRID_H)
      gl.uniform1f(loc.uBezel, shape.bezel)
      gl.uniform1f(loc.uK, k)
      gl.uniform1f(loc.uNight, night)
      gl.uniform1f(loc.uLift, lift)

      const s = clamp(stretch, -0.5, 1.2)
      const r = shape.r0 * (1 + 0.015 * lift)
      const halfX = r * (1 + 0.22 * s)
      const halfY = r * (1 - 0.08 * s)
      const lim = shape.winW / 2 - (shape.winH / 2 - shape.r0) - halfX
      const raw = (x - 0.5) * shape.travel
      const cx = clamp(raw, -lim, lim)
      gl.uniform4f(loc.uLens, cx, 0, halfX, halfY)

      // دمج لون الإطار الخارجي للزر مع هوية الثيم الحالي في الموقع
      gl.uniform3fv(loc.uShellDay, shellDayUnit)
      gl.uniform3fv(loc.uShellNight, shellNightUnit)
      gl.uniform3fv(loc.uInk, unit(I0))
      gl.uniform3fv(loc.uLight, unit(C3))
      gl.uniform3fv(loc.uHiNight, unit(I3))
      gl.uniform3fv(loc.uLoNight, unit(I0))

      const homeW = sources[0].w
      const home = unit(A2)
      const homeI = (homeW / 255 / 150) * 1.05
      const hx = homeW > 0 ? shape.ox + (sources[0].x / homeW + 0.5) * k - shape.W / 2 : 0
      const hy = homeW > 0 ? shape.oy - (sources[0].y / homeW + 0.5) * k - shape.H / 2 : 0
      gl.uniform2f(loc.uHomePos, hx, hy)
      gl.uniform3f(loc.uHomeCol, home[0] * homeI, home[1] * homeI, home[2] * homeI)

      const skyW = sources[1].w
      const skyU = unit(A3)
      const skyI = (skyW / 255 / 110) * 0.55
      const sx = skyW > 0 ? shape.ox + (sources[1].x / skyW + 0.5) * k - shape.W / 2 : 0
      const sy = skyW > 0 ? shape.oy - (sources[1].y / skyW + 0.5) * k - shape.H / 2 : 0
      gl.uniform2f(loc.uSkyPos, sx, sy)
      gl.uniform3f(loc.uSkyCol, skyU[0] * skyI, skyU[1] * skyI, skyU[2] * skyI)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const draw2d = () => {
      const g = ctx2d
      if (!g || !lowCanvas) return
      const low = lowCanvas.getContext('2d')
      low.putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer), bw, bh), 0, 0)
      g.clearRect(0, 0, shape.W, shape.H)
      const px = (shape.W - shape.pillW) / 2
      const py = (shape.H - shape.pillH) / 2
      g.save()
      g.beginPath()
      g.roundRect(px, py, shape.pillW, shape.pillH, shape.pillH / 2)
      g.clip()
      g.imageSmoothingEnabled = true
      g.drawImage(lowCanvas, shape.ox, shape.H - shape.oy, bw * k, bh * k)
      g.restore()
      const cx = shape.W / 2 + (x - 0.5) * shape.travel
      const light = unit(C3).map((v) => Math.round(v * 255))
      g.fillStyle = `rgb(${light[0]} ${light[1]} ${light[2]} / 0.5)`
      g.beginPath()
      g.arc(cx, shape.H / 2, shape.r0, 0, Math.PI * 2)
      g.fill()
    }

    let raf = 0, last = 0, worldAcc = 1, dirty = true, lastWorldClock = -1
    const nightAmount = (h) => clamp(smoothstep(17.4, 20.2, h) + (1 - smoothstep(4.8, 7.2, h)))

    const tick = (ms) => {
      raf = 0
      const t = ms / 1000
      const dt = last ? Math.min(0.05, t - last) : 1 / 60
      last = t

      // نفس فيزياء حركة المرجع: السحب السلس + القصور الذاتي + الارتداد المطاطي
      if (drag) {
        const before = x
        x += (clamp(drag.want) - x) * (1 - Math.exp(-dt * 34))
        velocity = (x - before) / Math.max(dt, 1 / 240)
        dirty = true
      } else if (moving) {
        const omega = calm ? 16 : 9.5
        const accel = omega * omega * (target - x) - 2 * omega * velocity
        velocity += accel * dt
        x += velocity * dt
        dirty = true
        if (Math.abs(target - x) < 0.0015 && Math.abs(velocity) < 0.03) {
          x = target
          velocity = 0
          moving = false
          if (!calm) stretchV -= 3.2
          if (x >= 0.98) {
            nightClock = branch === 'am' ? amStart : CLOCK_NIGHT
            branch = 'pm'
          } else {
            branch = 'pm'
          }
        }
        x = clamp(x)
      } else {
        velocity = 0
      }

      if (!calm) {
        const goal = clamp(Math.abs(velocity) * 0.44)
        stretchV += (170 * (goal - stretch) - 11 * stretchV) * dt
        stretch += stretchV * dt
        lift += (liftTarget - lift) * (1 - Math.exp(-dt * 14))
        if (Math.abs(stretch) > 0.002 || Math.abs(stretchV) > 0.01 || Math.abs(liftTarget - lift) > 0.002) dirty = true
      } else {
        stretch = 0
        stretchV = 0
        lift = liftTarget
      }

      if (!calm && x >= 0.98 && !moving && !drag && nightClock < CLOCK_SLEEP) {
        nightClock = Math.min(CLOCK_SLEEP, nightClock + (dt * (CLOCK_SLEEP - CLOCK_NIGHT)) / NIGHT_CREEP)
      }

      const clock = clockOf()
      hurry = Math.max(hurry - dt * 1.4, clamp(Math.abs(velocity) * 0.6))

      worldAcc += dt
      const worldStep = calm ? Math.abs(clock - lastWorldClock) > 1e-4 || dirty : worldAcc >= 1 / WORLD_HZ - WORLD_SLACK
      if (worldStep) {
        renderWorld(clock, Math.min(worldAcc, 0.1), hurry)
        worldAcc = 0
        lastWorldClock = clock
        if (ready) uploadWorld()
        dirty = true
      }

      if (dirty) {
        const night = nightAmount(hourOf(clock))
        if (ready) drawGl(night)
        else draw2d()
        dirty = false
      }

      raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }

    let startleCool = 0
    const startle = () => {
      if (calm || performance.now() < startleCool) return
      startleCool = performance.now() + 1500
      res.startle = 0.9
    }

    controllerRef.current = {
      syncTheme(nextPos, label) {
        readPalette()
        beginTravel()
        target = nextPos
        moving = true
        if (nextPos >= 0.98) nightClock = CLOCK_NIGHT
        if (statusEl) statusEl.textContent = label
        if (button) button.setAttribute('aria-label', label)
        wake()
      },
    }

    on(button, 'pointerenter', () => {
      liftTarget = 1
      wake()
    })

    on(button, 'pointerleave', () => {
      if (!drag) {
        liftTarget = 0
        wake()
      }
    })

    on(button, 'pointerdown', (event) => {
      if (event.button !== 0) return
      beginTravel()
      moving = false
      drag = {
        id: event.pointerId,
        start: event.clientX,
        from: x,
        want: x,
        moved: false,
        lastX: event.clientX,
        lastT: performance.now(),
        speed: 0,
      }
      liftTarget = 1
      try {
        button.setPointerCapture(event.pointerId)
      } catch {}
      wake()
    })

    on(button, 'pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.start
      if (Math.abs(dx) > 3) drag.moved = true
      drag.want = drag.from + dx / Math.max(shape.travelCss, 1)
      const nowMs = performance.now()
      const dtMs = Math.max(nowMs - drag.lastT, 4)
      const speed = (event.clientX - drag.lastX) / Math.max(shape.travelCss, 1) / (dtMs / 1000)
      drag.speed = drag.speed * 0.6 + speed * 0.4
      drag.lastX = event.clientX
      drag.lastT = nowMs
      if (Math.abs(drag.speed) > 3.2) startle()
      wake()
    })

    const release = (event) => {
      if (!drag || event.pointerId !== drag.id) return
      const wasMoved = drag.moved
      const speed = drag.speed
      drag = null
      liftTarget = 0
      if (wasMoved) {
        suppressClick = performance.now() + 300
        const projected = clamp(x + speed * 0.09)
        const nextTheme = nearestThemeForPos(projected)
        const cfg = THEME_CONFIGS[nextTheme]
        target = cfg.pos
        velocity = clamp(speed, -3, 3)
        moving = true
        playGlassToggle(nextTheme !== 'blue')
        onCycleRef.current?.(nextTheme)
      }
      wake()
    }

    on(button, 'pointerup', release)
    on(button, 'pointercancel', release)
    on(button, 'lostpointercapture', release)

    on(button, 'click', () => {
      if (performance.now() < suppressClick) return
      const idx = THEME_ORDER.indexOf(themeRef.current)
      const nextIdx = (idx + 1) % THEME_ORDER.length
      const nextTheme = THEME_ORDER[nextIdx]
      playGlassToggle(nextIdx > 0)
      onCycleRef.current?.(nextTheme)
    })

    on(button, 'keydown', (event) => {
      let dir = 0
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') dir = 1
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') dir = -1
      else if (event.key === 'Enter' || event.key === ' ') dir = 1
      if (!dir) return
      event.preventDefault()
      const idx = THEME_ORDER.indexOf(themeRef.current)
      const nextIdx = (idx + dir + THEME_ORDER.length) % THEME_ORDER.length
      const nextTheme = THEME_ORDER[nextIdx]
      playGlassToggle(nextIdx > 0)
      onCycleRef.current?.(nextTheme)
    })

    const ro = new ResizeObserver(() => {
      measure()
      dirty = true
      lastWorldClock = -1
      wake()
    })
    ro.observe(root)

    on(motionQuery, 'change', () => {
      calm = motionQuery.matches
      dirty = true
      lastWorldClock = -1
    })

    readPalette()
    measure()
    res.x = 131
    res.inside = false
    renderWorld(clockOf(), 0, 0)
    if (ready) uploadWorld()
    wake()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      for (const off of cleanups) off()
      controllerRef.current = null
      if (gl && ready) {
        gl.deleteProgram(program)
        gl.deleteBuffer(quad)
        gl.deleteVertexArray(vao)
        gl.deleteTexture(texWorld)
        gl.deleteTexture(texNear)
      }
    }
  }, [])

  return (
    <div
      ref={rootRef}
      data-ld-part="toggle-daylight"
      className={`relative inline-block shrink-0 select-none bg-transparent ${className}`}
      style={{
        width: '74px',
        height: '40px',
      }}
    >
      <canvas
        className="scene pointer-events-none absolute inset-0 block h-full w-full"
        aria-hidden="true"
      />
      <button
        type="button"
        className="hit absolute inset-[5%_4%] cursor-grab rounded-full border-0 bg-transparent p-0 active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label={THEME_CONFIGS[theme]?.label || 'تبديل الثيم'}
        title="اسحب أو اضغط للتبديل (الزمردي • الجمري • الرملي)"
      />
      <span className="vh sr-only" role="status" aria-live="polite" data-status />
      <span className="probe hidden" aria-hidden="true" />
    </div>
  )
}