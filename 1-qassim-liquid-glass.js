import React from 'react';
/*
MIT License

Copyright (c) 2026 Bilal Abdullah Gürşen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Source: https://github.com/bilalgursen/liquid-glass
*/
"use client";

// src/vendor/bilalgursen-liquid-glass/glass-layer.tsx
import { useEffect, useRef } from "react";

// src/vendor/bilalgursen-liquid-glass/dom-snapshot.ts
var isVisibleColor = (color) => !!color && color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color) && !/\/\s*0\)$/.test(color);
function splitTop(text, separator) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}
var lengthOf = (token, span) => token.endsWith("%") ? span * parseFloat(token) / 100 : parseFloat(token) || 0;
function along(token, free) {
  if (!token) return free / 2;
  const calc = /^calc\(([-\d.]+)% ([+-]) ([\d.]+)px\)$/.exec(token);
  if (calc) return free * Number(calc[1]) / 100 + (calc[2] === "-" ? -1 : 1) * Number(calc[3]);
  if (/^-?[\d.]/.test(token)) return lengthOf(token, free);
  return token === "left" || token === "top" ? 0 : token === "right" || token === "bottom" ? free : free / 2;
}
function placeOf(position, freeX, freeY) {
  let [a, b, c, d] = splitTop(position, " ");
  if (d) return [a === "right" ? freeX - along(b, freeX) : along(b, freeX), c === "bottom" ? freeY - along(d, freeY) : along(d, freeY)];
  if (a === "top" || a === "bottom" || b === "left" || b === "right") [a, b] = [b, a];
  return [along(a, freeX), along(b, freeY)];
}
var verdicts = /* @__PURE__ */ new WeakMap();
function isClean(source, key = "") {
  const known = verdicts.get(source);
  if (known && known.key === key) return known.ok;
  let ok = false;
  try {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(source, 0, 0, 1, 1);
      ctx.getImageData(0, 0, 1, 1);
      ok = true;
    }
  } catch {
  }
  verdicts.set(source, { key, ok });
  return ok;
}
var waiting = /* @__PURE__ */ new WeakMap();
function isLoaded(image, onStale) {
  if (image.complete) return image.naturalWidth > 0;
  if (!onStale) return false;
  let callbacks = waiting.get(image);
  if (!callbacks) {
    const pending = callbacks = /* @__PURE__ */ new Set();
    waiting.set(image, pending);
    image.addEventListener(
      "load",
      () => {
        waiting.delete(image);
        pending.forEach((notify) => notify());
      },
      { once: true }
    );
  }
  callbacks.add(onStale);
  return false;
}
var isSameOrigin = (src) => {
  try {
    const url = new URL(src, location.href);
    return url.protocol === "data:" || url.protocol === "blob:" || url.origin === location.origin;
  } catch {
    return false;
  }
};
var copies = /* @__PURE__ */ new Map();
function imageCopy(src) {
  let image = copies.get(src);
  if (!image) {
    if (copies.size > 200) copies.clear();
    image = new Image();
    if (!isSameOrigin(src)) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = src;
    copies.set(src, image);
  }
  return image;
}
function drawFitted(ctx, source, sw, sh, box, radius, style) {
  const fit = style.objectFit;
  let w = box.w;
  let h = box.h;
  if (fit !== "fill") {
    const contain = Math.min(box.w / sw, box.h / sh);
    const k = fit === "cover" ? Math.max(box.w / sw, box.h / sh) : fit === "none" ? 1 : fit === "scale-down" ? Math.min(1, contain) : contain;
    w = sw * k;
    h = sh * k;
  }
  const [ox, oy] = placeOf(style.objectPosition, box.w - w, box.h - h);
  const clips = radius > 0 || w > box.w + 0.5 || h > box.h + 0.5;
  if (clips) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, radius);
    ctx.clip();
  }
  ctx.drawImage(source, box.x + ox, box.y + oy, w, h);
  if (clips) ctx.restore();
}
var svgCache = /* @__PURE__ */ new WeakMap();
var svgTaints = false;
function drawSvg(ctx, svg, color, box, onStale, cacheKey) {
  if (svgTaints) return;
  const key = `${color}|${cacheKey}|${Math.round(box.w)}x${Math.round(box.h)}`;
  let entry = svgCache.get(svg);
  if (!entry || entry.key !== key) {
    const clone = svg.cloneNode(true);
    const originals = [svg, ...svg.querySelectorAll("*")];
    const clones = [clone, ...clone.querySelectorAll("*")];
    originals.forEach((original, i) => {
      const style = getComputedStyle(original);
      const target = clones[i];
      target.removeAttribute("class");
      target.style.fill = style.fill;
      target.style.stroke = style.stroke;
      target.style.animation = "none";
    });
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(box.w));
    clone.setAttribute("height", String(box.h));
    clone.style.color = color;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    entry = { key, image };
    svgCache.set(svg, entry);
  }
  if (!isLoaded(entry.image, onStale)) return;
  if (isClean(entry.image)) ctx.drawImage(entry.image, box.x, box.y, box.w, box.h);
  else svgTaints = true;
}
function parseStops(args, currentColor) {
  const stops = [];
  for (const arg of args) {
    const tokens = splitTop(arg, " ");
    const positions = [];
    while (tokens.length && /^-?[\d.]+(%|px)$/.test(tokens[tokens.length - 1])) positions.unshift(tokens.pop());
    if (!tokens.length) continue;
    const color = tokens.join(" ").replace(/currentcolor/gi, currentColor);
    if (!positions.length) stops.push({ color, at: null, px: false });
    for (const position of positions) stops.push({ color, at: parseFloat(position), px: position.endsWith("px") });
  }
  return stops.length > 1 ? stops : null;
}
function parseImage(text, currentColor) {
  const url = /^url\((['"]?)(.*)\1\)$/.exec(text);
  if (url) return { kind: "url", src: url[2] };
  const gradient = /^(repeating-)?(linear|radial)-gradient\(([\s\S]*)\)$/.exec(text);
  if (!gradient) return null;
  const repeating = !!gradient[1];
  const args = splitTop(gradient[3], ",");
  const first = args[0] ?? "";
  const head = first.replace(/\bin\s+[\w-]+(\s+\w+\s+hue)?/i, "").trim();
  const spaceOnly = head === "" && first !== "";
  if (gradient[2] === "linear") {
    let angle = Math.PI;
    let corner = "";
    let isDirection = spaceOnly;
    if (/^to\s/.test(head)) {
      const v = /top/.test(head) ? "t" : /bottom/.test(head) ? "b" : "";
      const hz = /left/.test(head) ? "l" : /right/.test(head) ? "r" : "";
      if (v && hz) corner = v + hz;
      else angle = { t: 0, r: Math.PI / 2, b: Math.PI, l: Math.PI * 1.5 }[v || hz] ?? Math.PI;
      isDirection = true;
    } else if (/^-?[\d.]+(deg|grad|rad|turn)$/.test(head)) {
      const n = parseFloat(head);
      angle = head.endsWith("turn") ? n * Math.PI * 2 : head.endsWith("grad") ? n * Math.PI / 200 : head.endsWith("rad") ? n : n * Math.PI / 180;
      isDirection = true;
    }
    const stops2 = parseStops(isDirection ? args.slice(1) : args, currentColor);
    return stops2 && { kind: "linear", repeating, stops: stops2, angle, corner };
  }
  const isShape = spaceOnly || /^(circle|ellipse|closest-|farthest-|at\s|-?[\d.]+(px|%))/.test(head);
  const [shape = "", at = "center"] = isShape ? head.split(/\s*\bat\s+/) : [];
  const size = shape.match(/-?[\d.]+(px|%)/g) ?? [];
  const stops = parseStops(isShape ? args.slice(1) : args, currentColor);
  return stops && {
    kind: "radial",
    repeating,
    stops,
    circle: /circle/.test(shape) || size.length === 1,
    extent: /(closest|farthest)-(side|corner)/.exec(shape)?.[0] ?? "farthest-corner",
    size,
    at
  };
}
var parsed = /* @__PURE__ */ new Map();
function imagesOf(style) {
  const value = style.backgroundImage;
  const key = /currentcolor/i.test(value) ? `${value}|${style.color}` : value;
  let images = parsed.get(key);
  if (!images) {
    if (parsed.size > 300) parsed.clear();
    images = splitTop(value, ",").map((image) => parseImage(image, style.color));
    parsed.set(key, images);
  }
  return images;
}
function clearOf(color) {
  const legacy = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(color);
  if (legacy) return `rgba(${legacy[1]}, ${legacy[2]}, ${legacy[3]}, 0)`;
  const modern = /^([a-z-]+\([^/)]+?)\s*(\/[^)]*)?\)$/.exec(color);
  return modern ? `${modern[1]} / 0)` : color;
}
function rampOf(stops, length, repeating, reach = 1) {
  const at = stops.map((stop) => stop.at === null ? null : stop.px ? stop.at / Math.max(length, 1e-6) : stop.at / 100);
  if (at[0] === null) at[0] = 0;
  if (at[at.length - 1] === null) at[at.length - 1] = 1;
  for (let i = 1; i < at.length; i++) {
    if (at[i] === null) {
      let j = i;
      while (at[j] === null) j++;
      const a = at[i - 1];
      const b = Math.max(at[j], a);
      for (let k = i; k < j; k++) at[k] = a + (b - a) * (k - i + 1) / (j - i + 1);
    }
    at[i] = Math.max(at[i], at[i - 1]);
  }
  let list = [];
  stops.forEach((stop, i) => {
    const p = at[i];
    const before = stops[i - 1];
    const after = stops[i + 1];
    const fades = !isVisibleColor(stop.color);
    const fromBefore = fades && !!before && isVisibleColor(before.color);
    const toAfter = fades && !!after && isVisibleColor(after.color);
    if (fromBefore) list.push([p, clearOf(before.color)]);
    if (toAfter) list.push([p, clearOf(after.color)]);
    if (!fromBefore && !toAfter) list.push([p, stop.color]);
  });
  let from = list[0][0];
  let to = list[list.length - 1][0];
  const period = to - from;
  if (repeating && period > 1e-4) {
    const first = Math.floor(-from / period);
    const count = Math.ceil((reach - from) / period) - first;
    if (count > 200) return null;
    const one = list;
    list = [];
    for (let k = first; k < first + count; k++) for (const [p, color] of one) list.push([p + k * period, color]);
    from += first * period;
    to = from + count * period;
  }
  const span = Math.max(to - from, 0.02 / Math.max(length, 1e-6));
  return { from, to: from + span, stops: list.map(([p, color]) => [Math.min(1, Math.max(0, (p - from) / span)), color]) };
}
function fillGradient(ctx, gradient, w, h) {
  if (gradient.kind === "linear") {
    let angle = gradient.angle;
    if (gradient.corner) {
      const base = Math.atan2(h, w);
      angle = { tr: base, br: Math.PI - base, bl: Math.PI + base, tl: -base }[gradient.corner] ?? base;
    }
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const length = Math.abs(w * sin) + Math.abs(h * cos);
    const ramp2 = rampOf(gradient.stops, length, gradient.repeating);
    if (!ramp2) return;
    const x = (t) => w / 2 + sin * length * (t - 0.5);
    const y = (t) => h / 2 - cos * length * (t - 0.5);
    const fill2 = ctx.createLinearGradient(x(ramp2.from), y(ramp2.from), x(ramp2.to), y(ramp2.to));
    for (const [p, color] of ramp2.stops) fill2.addColorStop(p, color);
    ctx.fillStyle = fill2;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const [cx, cy] = placeOf(gradient.at, w, h);
  const dx = [Math.abs(cx), Math.abs(w - cx)];
  const dy = [Math.abs(cy), Math.abs(h - cy)];
  const pick = gradient.extent.startsWith("closest") ? Math.min : Math.max;
  let rx = pick(...dx);
  let ry = pick(...dy);
  if (gradient.size.length) {
    rx = lengthOf(gradient.size[0], w);
    ry = gradient.size[1] ? lengthOf(gradient.size[1], h) : rx;
  } else if (gradient.circle) rx = ry = gradient.extent.endsWith("corner") ? Math.hypot(rx, ry) : pick(rx, ry);
  else if (gradient.extent.endsWith("corner")) {
    rx *= Math.SQRT2;
    ry *= Math.SQRT2;
  }
  if (rx < 0.01 || ry < 0.01) return;
  const ramp = rampOf(gradient.stops, rx, gradient.repeating, Math.hypot(Math.max(...dx) / rx, Math.max(...dy) / ry));
  if (!ramp) return;
  const inner = Math.max(0, rx * ramp.from);
  const fill = ctx.createRadialGradient(0, 0, inner, 0, 0, Math.max(rx * ramp.to, inner + 1e-3));
  for (const [p, color] of ramp.stops) fill.addColorStop(p, color);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = fill;
  ctx.fillRect(-cx, -cy * rx / ry, w, h * rx / ry);
  ctx.restore();
}
function paintBackgrounds(ctx, style, area, bounds, onStale) {
  const images = imagesOf(style);
  const sizes = splitTop(style.backgroundSize, ",");
  const positions = splitTop(style.backgroundPosition, ",");
  const repeats = splitTop(style.backgroundRepeat, ",");
  for (let n = images.length - 1; n >= 0; n--) {
    const image = images[n];
    if (!image) continue;
    let source = null;
    let tw = area.w;
    let th = area.h;
    if (image.kind === "url") {
      source = imageCopy(image.src);
      if (!isLoaded(source, onStale) || !isClean(source)) continue;
      tw = source.naturalWidth;
      th = source.naturalHeight;
    }
    const size = sizes[n % sizes.length] ?? "auto";
    if (size === "cover" || size === "contain") {
      const k = (size === "cover" ? Math.max : Math.min)(area.w / tw, area.h / th);
      tw *= k;
      th *= k;
    } else {
      const [sw = "auto", sh = "auto"] = splitTop(size, " ");
      const ratio = tw / th;
      if (sw !== "auto") tw = lengthOf(sw, area.w);
      if (sh !== "auto") th = lengthOf(sh, area.h);
      if (source && sw !== "auto" && sh === "auto") th = tw / ratio;
      if (source && sw === "auto" && sh !== "auto") tw = th * ratio;
    }
    if (!(tw >= 0.5 && th >= 0.5)) continue;
    const [ox, oy] = placeOf(positions[n % positions.length] ?? "0% 0%", area.w - tw, area.h - th);
    const repeat = repeats[n % repeats.length] ?? "repeat";
    const [repeatX, repeatY = repeatX] = repeat.split(" ");
    const tilesX = repeat !== "repeat-y" && repeatX !== "no-repeat";
    const tilesY = repeat !== "repeat-x" && repeatY !== "no-repeat";
    const x0 = area.x + ox;
    const y0 = area.y + oy;
    const i0 = tilesX ? Math.floor((bounds.x - x0) / tw) : 0;
    const i1 = tilesX ? Math.floor((bounds.x + bounds.w - x0 - 0.01) / tw) : 0;
    const j0 = tilesY ? Math.floor((bounds.y - y0) / th) : 0;
    const j1 = tilesY ? Math.floor((bounds.y + bounds.h - y0 - 0.01) / th) : 0;
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400) continue;
    try {
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          ctx.save();
          ctx.translate(x0 + i * tw, y0 + j * th);
          if (source) ctx.drawImage(source, 0, 0, tw, th);
          else fillGradient(ctx, image, tw, th);
          ctx.restore();
        }
      }
    } catch {
      ctx.restore();
    }
  }
}
function drawText(ctx, node, style, originX, originY, lang, isVisible) {
  const raw = node.textContent ?? "";
  let text = raw.replace(/\s+/g, " ").trim();
  if (!text) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  const lines = [...range.getClientRects()].filter((rect) => rect.width > 0.5);
  if (!lines.length) return;
  const transform = style.textTransform;
  if (transform === "uppercase") text = text.toLocaleUpperCase(lang);
  else if (transform === "lowercase") text = text.toLocaleLowerCase(lang);
  else if (transform === "capitalize") text = text.replace(/(^|\s)(\S)/g, (_, gap, letter) => gap + letter.toUpperCase());
  const rtl = style.direction === "rtl";
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "left";
  ctx.fillStyle = style.color;
  ctx.textBaseline = "alphabetic";
  const metrics = ctx.measureText("Hg\u0130\u015F");
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const space = ctx.measureText(" ").width;
  const words = text.split(" ");
  let next = 0;
  lines.forEach((rect, i) => {
    let line = "";
    if (i === lines.length - 1) line = words.slice(next).join(" ");
    else {
      while (next < words.length) {
        const candidate = line ? `${line} ${words[next]}` : words[next];
        if (line && ctx.measureText(candidate).width > rect.width + 1) break;
        line = candidate;
        next++;
      }
    }
    if (!line || !isVisible(rect)) return;
    const lead = i === 0 && !rtl && /^\s/.test(raw) && rect.width - ctx.measureText(line).width > space * 0.5 ? space : 0;
    const baseline = rect.top - originY + (rect.height - (ascent + descent)) / 2 + ascent;
    ctx.fillText(line, rect.left - originX + lead, baseline);
  });
}
var scratch;
function blurBackdrop(ctx, box, radius, blurPx) {
  const matrix = ctx.getTransform();
  const scale = matrix.a;
  const left = Math.max(0, Math.floor(box.x * scale + matrix.e));
  const top = Math.max(0, Math.floor(box.y * scale + matrix.f));
  const w = Math.min(ctx.canvas.width, Math.ceil((box.x + box.w) * scale + matrix.e)) - left;
  const h = Math.min(ctx.canvas.height, Math.ceil((box.y + box.h) * scale + matrix.f)) - top;
  if (w < 1 || h < 1) return;
  const pad = Math.ceil(blurPx * scale * 3);
  scratch ??= document.createElement("canvas");
  scratch.width = w + 2 * pad;
  scratch.height = h + 2 * pad;
  const copy = scratch.getContext("2d");
  if (!copy) return;
  copy.imageSmoothingEnabled = false;
  copy.drawImage(ctx.canvas, left, top, w, h, pad, pad, w, h);
  copy.drawImage(scratch, pad, pad, 1, h, 0, pad, pad, h);
  copy.drawImage(scratch, pad + w - 1, pad, 1, h, pad + w, pad, pad, h);
  copy.drawImage(scratch, 0, pad, w + 2 * pad, 1, 0, 0, w + 2 * pad, pad);
  copy.drawImage(scratch, 0, pad + h - 1, w + 2 * pad, 1, 0, pad + h, w + 2 * pad, pad);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, radius);
  ctx.clip();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(left, top, w, h);
  ctx.filter = `blur(${blurPx * scale}px)`;
  ctx.drawImage(scratch, left - pad, top - pad);
  ctx.restore();
}
function layerOf(style, inFlexOrGrid) {
  const positioned = style.position !== "static";
  const z = (positioned || inFlexOrGrid) && style.zIndex !== "auto" ? parseInt(style.zIndex, 10) || 0 : 0;
  if (z) return [z < 0 ? 0 : 3, z];
  const stacks = positioned || style.opacity !== "1" || style.transform !== "none" || style.filter !== "none" || style.isolation === "isolate" || (style.backdropFilter || "none") !== "none";
  return [stacks ? 2 : 1, 0];
}
function clipShape(value, box) {
  if (!value || value === "none") return null;
  const path = /^path\((?:[a-z-]+\s*,\s*)?["'](.*)["']\)$/s.exec(value);
  if (path) {
    const shape2 = new Path2D();
    shape2.addPath(new Path2D(path[1]), new DOMMatrix().translate(box.x, box.y));
    return shape2;
  }
  const inset = /^inset\((.*)\)$/s.exec(value);
  if (!inset) return null;
  const [sides, round = ""] = inset[1].split(/\s+round\s+/);
  const length = (token, of) => token.endsWith("%") ? parseFloat(token) / 100 * of : parseFloat(token) || 0;
  const t = sides.trim().split(/\s+/);
  const top = length(t[0], box.h);
  const right = length(t[1] ?? t[0], box.w);
  const bottom = length(t[2] ?? t[0], box.h);
  const left = length(t[3] ?? t[1] ?? t[0], box.w);
  const w = Math.max(0, box.w - left - right);
  const h = Math.max(0, box.h - top - bottom);
  const shape = new Path2D();
  shape.roundRect(box.x + left, box.y + top, w, h, Math.min(round ? length(round.trim().split(/\s+/)[0], Math.min(w, h)) : 0, w / 2, h / 2));
  return shape;
}
function drawDom(ctx, root, options) {
  const { origin, region, skip, onStale, cacheKey = document.documentElement.className, found } = options;
  const originX = origin.left;
  const originY = origin.top;
  const deferred = [];
  const intersects = (rect) => !region || rect.right > region.left && rect.left < region.right && rect.bottom > region.top && rect.top < region.bottom;
  let lang;
  try {
    lang = Intl.getCanonicalLocales(document.documentElement.lang)[0];
  } catch {
  }
  const walk = (element, parentOpacity, isDeferred = false, style = getComputedStyle(element)) => {
    if (skip?.(element)) return;
    if (style.display === "none" || style.visibility === "hidden") return;
    const opacity = parentOpacity * Number(style.opacity);
    if (opacity < 0.01) return;
    if (!isDeferred && element !== root && (style.position === "fixed" || style.position === "sticky")) {
      deferred.push({ element, opacity: parentOpacity });
      found?.pinned.push(element);
      return;
    }
    const drawChildren = () => {
      const inFlexOrGrid = /flex|grid/.test(style.display);
      const children = [...element.childNodes].map((node) => {
        const childStyle = node instanceof Element ? getComputedStyle(node) : null;
        const [layer, z] = childStyle ? layerOf(childStyle, inFlexOrGrid) : [1, 0];
        return { node, childStyle, layer, z };
      });
      children.sort((a, b) => a.layer - b.layer || a.z - b.z);
      for (const { node, childStyle } of children) {
        if (childStyle) walk(node, opacity, false, childStyle);
        else if (node.nodeType === Node.TEXT_NODE) {
          ctx.globalAlpha = opacity;
          drawText(ctx, node, style, originX, originY, lang, intersects);
        }
      }
    };
    if (style.display === "contents") {
      drawChildren();
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || rect.width <= 1 && rect.height <= 1 || !intersects(rect)) return;
    if (found) {
      if (isDeferred) found.touched = true;
      else if (!found.loose) {
        const inline = element.style;
        found.loose = style.animationName !== "none" || style.backgroundImage !== "none" && style.backgroundAttachment.includes("fixed") || !!inline && !!(inline.transform || inline.translate || inline.rotate || inline.scale);
      }
    }
    const box = { x: rect.left - originX, y: rect.top - originY, w: rect.width, h: rect.height };
    const shape = clipShape(style.clipPath, box);
    if (shape) {
      ctx.save();
      ctx.clip(shape);
    }
    try {
      paintBox(element, style, rect, box, opacity, drawChildren);
    } finally {
      if (shape) ctx.restore();
    }
  };
  const paintBox = (element, style, rect, box, opacity, drawChildren) => {
    const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, rect.width / 2, rect.height / 2);
    const backdropBlur = /blur\(([\d.]+)px\)/.exec(style.backdropFilter);
    if (backdropBlur) blurBackdrop(ctx, box, radius, Number(backdropBlur[1]));
    ctx.globalAlpha = opacity;
    const hasBox = style.backgroundClip !== "text";
    if (hasBox && isVisibleColor(style.backgroundColor)) {
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, radius);
      ctx.fillStyle = style.backgroundColor;
      ctx.fill();
    }
    if (hasBox && style.backgroundImage !== "none") {
      const bounds = { ...box };
      if (region) {
        bounds.x = Math.max(box.x, region.left - originX);
        bounds.y = Math.max(box.y, region.top - originY);
        bounds.w = Math.min(box.x + box.w, region.right - originX) - bounds.x;
        bounds.h = Math.min(box.y + box.h, region.bottom - originY) - bounds.y;
      }
      const area = style.backgroundAttachment.includes("fixed") ? { x: -originX, y: -originY, w: innerWidth, h: innerHeight } : box;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, radius);
      ctx.clip();
      paintBackgrounds(ctx, style, area, bounds, onStale);
      ctx.restore();
    }
    const borderWidth = parseFloat(style.borderTopWidth) || 0;
    if (borderWidth > 0 && style.borderTopStyle !== "none" && isVisibleColor(style.borderTopColor)) {
      ctx.beginPath();
      ctx.roundRect(box.x + borderWidth / 2, box.y + borderWidth / 2, box.w - borderWidth, box.h - borderWidth, Math.max(0, radius - borderWidth / 2));
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = style.borderTopColor;
      ctx.setLineDash(style.borderTopStyle === "dashed" ? [4, 3] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (element instanceof SVGSVGElement) {
      drawSvg(ctx, element, style.color, box, onStale, cacheKey);
      return;
    }
    if (element instanceof HTMLCanvasElement) {
      if (element.width && element.height && isClean(element)) ctx.drawImage(element, box.x, box.y, box.w, box.h);
      return;
    }
    if (element instanceof HTMLImageElement) {
      const src = element.currentSrc || element.src;
      if (!src) return;
      const image = element.complete && element.naturalWidth && isClean(element, src) ? element : imageCopy(src);
      if (isLoaded(image, onStale) && isClean(image, src)) drawFitted(ctx, image, image.naturalWidth, image.naturalHeight, box, radius, style);
      return;
    }
    if (element instanceof HTMLVideoElement) {
      if (element.readyState >= 2 && element.videoWidth && isClean(element, element.currentSrc)) drawFitted(ctx, element, element.videoWidth, element.videoHeight, box, radius, style);
      return;
    }
    const clips = element !== root && style.overflow !== "visible" && element !== document.body && element !== document.documentElement;
    if (clips) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.w, box.h, radius);
      ctx.clip();
    }
    drawChildren();
    if (clips) ctx.restore();
  };
  walk(root, 1);
  for (let i = 0; i < deferred.length; i++) walk(deferred[i].element, deferred[i].opacity, true);
  ctx.globalAlpha = 1;
}
function drawAround(ctx, root, box, reach, options) {
  drawDom(ctx, root, {
    ...options,
    origin: box,
    region: { left: box.left - reach, top: box.top - reach, right: box.left + box.width + reach, bottom: box.top + box.height + reach }
  });
}

// src/vendor/bilalgursen-liquid-glass/engine.ts
function stepSpring(s, target, { omega, zeta }, dt) {
  const d = s.x - target;
  if (zeta > 0.9995) {
    const b = s.v + omega * d;
    const e = Math.exp(-omega * dt);
    s.x = target + (d + b * dt) * e;
    s.v = (s.v - omega * b * dt) * e;
  } else {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const b = (s.v + zeta * omega * d) / wd;
    const e = Math.exp(-zeta * omega * dt);
    const cos = Math.cos(wd * dt);
    const sin = Math.sin(wd * dt);
    const x = (d * cos + b * sin) * e;
    s.x = target + x;
    s.v = e * wd * (b * cos - d * sin) - zeta * omega * x;
  }
  const scale = Math.max(1, Math.abs(target));
  const settled = Math.abs(s.x - target) < 5e-4 * scale && Math.abs(s.v) < 5e-3 * scale;
  if (settled) {
    s.x = target;
    s.v = 0;
  }
  return !settled;
}
var GLOW = {
  /** One press, at the centre of the light. Presses that land before the last has faded add up, to `stack` presses at most. */
  amount: 3.55,
  stack: 3,
  /**
   * A choice made inside an open surface: this much of a press, and a light of its own size. It
   * is a wide, soft light around the choice (`selectReach` at first, `selectSpread` more as it
   * fades, both × the control's height) and it leaves as the surface starts back in.
   */
  select: 0.45,
  selectReach: 1.6,
  selectSpread: 1.2,
  /** A choice's light is gone once the surface is this far back in (0–1 of the way open; higher = it leaves sooner). */
  selectLeave: 0.5,
  /** The light's reach at first, and how much further it spreads as it fades (both × the control's height). */
  reach: 1.65,
  spread: 3,
  /** It stays for at least this long (seconds), comes up at `riseSpeed`, fades at `fadeSpeed` and spreads at `spreadSpeed` (springs: higher = faster). */
  hold: 0.2,
  riseSpeed: 60,
  fadeSpeed: 5.5,
  spreadSpeed: 5,
  /**
   * The press that opens a surface: its light grows with the surface until it covers it whole
   * (its reach ends at `cover` × the surface's diagonal). It lets go once the surface is this
   * far open (0–1) and fades at `coverFadeSpeed`: a flash, not a wash.
   */
  cover: 0.9,
  coverUntil: 0.1,
  coverFadeSpeed: 10,
  /** How much of the light spills past an open surface's edge (0 = none). */
  halo: 1
};
var MIRROR = {
  /**
   * How much of a neighbour shows on the rim's line (1 at most: the line is the rim light's own,
   * as thin as the one that leans towards the cursor), and in the band that begins inside it.
   */
  line: 1,
  band: 0.45,
  /**
   * How deep that band goes: this × the glass's shorter half (or its reach, on taller glass).
   * The rim's edge looks `reach` far; the look shortens with depth and ends here, so a
   * neighbour's picture fills the band where it is near and thins out where the rim turns
   * away from it: a crescent on a round glass.
   */
  depth: 1.1,
  /** How fast the picture fades from the rim inwards, an exponent (1 = evenly, higher = it keeps closer to the rim). */
  fall: 2,
  /** How soft the picture is: the patch each point gathers, × the reach (0 = a sharp mirror). */
  soft: 0.3,
  /** How much more than its plain difference from the surface a neighbour counts. */
  gain: 1.2,
  /** How much a darker neighbour dims the rim (× the above; 0 = not at all). */
  dim: 0.6,
  /** How far the rim's edge looks: this × the glass's height, between `reachMin` and `reachMax` px. */
  reach: 0.75,
  reachMin: 24,
  reachMax: 96,
  /** What a point gathers along its look: shares from its near part, from further out and from its far end. */
  near: 0.25,
  mid: 0.35,
  far: 0.4,
  /** The rim light's far side: its brightness (× the lit side's), and how much of the surroundings' colour it takes (0 = always white). */
  bounce: 0.6,
  tint: 1
};
var GLOW_SMALL = { ...GLOW, reach: 0.7, spread: 0.7, riseSpeed: 24, coverUntil: 0.5 };
var MORPH_GLOW = { ...GLOW, stack: 3.5, hold: 0.5 };
var MORPH_GLOW_SMALL = { ...GLOW_SMALL, stack: MORPH_GLOW.stack, hold: MORPH_GLOW.hold };
var SPRINGS = {
  press: { omega: 16, zeta: 0.6 },
  hoverX: { omega: 17, zeta: 0.42 },
  hoverY: { omega: 12, zeta: 0.34 },
  /** A droplet separating from the body: slow, one small overshoot. */
  dropletOut: { omega: 5, zeta: 0.72 },
  /** The droplet melting back in (pointer leaves or presses). */
  dropletIn: { omega: 13, zeta: 0.7 },
  /** A lens sliding to the newly selected option. */
  slide: { omega: 14, zeta: 0.75 },
  /** A dragged lens following the finger. */
  drag: { omega: 40, zeta: 0.999 }
};
var lerp = (a, b, t) => a + (b - a) * t;
var clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
var smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
var mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
var rgbCss = (c) => `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;
var isVisibleColor2 = (c) => !!c && c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c) && !/\/\s*0\)$/.test(c);
function surfaceColorOf(el) {
  for (let a = el; a; a = a.parentElement) {
    const c = getComputedStyle(a).backgroundColor;
    if (isVisibleColor2(c)) return c;
  }
  return getComputedStyle(document.documentElement).colorScheme.includes("dark") ? "black" : "white";
}
var DESIGN_HEIGHT = 120;
var VERTEX = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;
var FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uSize, uCenter, uHalf, uLightDir;
uniform float uUnit, uDevicePx, uRadius, uBevel, uBodyX, uBand, uFieldRadius;
uniform vec3 uDrop;
uniform vec4 uBlob;
uniform vec2 uBlobShape, uBlobNeck, uBlobFade;
uniform float uRim, uCaustic, uInner, uTopRefl, uTopBase, uRimWidth, uFresnel;
uniform float uShadow, uShadowSoft, uShadowOffset;
uniform float uLightMix, uEdgeClear;
uniform vec3 uSurface, uColor, uBorder;
uniform float uBorderWidth, uBorderAlpha;
uniform sampler2D uBack, uFront;
uniform float uTextured, uRefract, uMag, uDisp, uBlurCenter, uBlurEdge, uBlurShift, uFrost, uFrostBlur, uFrostMix;
uniform float uFrostEdge, uSaturation, uBendCurve, uEdgeBand;
uniform vec2 uRadial;
uniform vec4 uGlow;
uniform vec2 uGlowHalo;
uniform float uGlowBlob;
uniform vec4 uBlobMat;
uniform vec3 uBlobLine;
uniform float uCssPx;
uniform sampler2D uAround;
uniform vec4 uAroundBox;
uniform float uAroundScale, uReach;
uniform vec4 uMirror, uSeen;
uniform vec2 uBounce;
uniform float uFall, uSoft;
out vec4 outColor;

// design units -> texture uv (textures are uploaded flipped: top row at v = 1)
vec2 toUv(vec2 d) {
  vec2 q = d * uUnit;
  return clamp(vec2(q.x / uSize.x, 1.0 - q.y / uSize.y), vec2(0.0005), vec2(0.9995));
}
vec3 backdrop(vec2 st, float lod) {
  vec4 c = textureLod(uBack, st, lod);
  return c.rgb + (1.0 - c.a) * uSurface;
}
// What surrounds the glass (GlassLens.reflection), at a point of the canvas in design units and
// blurred over spread. Where the picture is empty, or there is none, it is the surface colour.
vec3 around(vec2 d, float spread) {
  vec2 st = clamp((d - uAroundBox.xy) / uAroundBox.zw, vec2(0.002), vec2(0.998));
  vec4 c = textureLod(uAround, vec2(st.x, 1.0 - st.y), log2(max(spread * uAroundScale, 1.0)));
  return c.rgb + (1.0 - c.a) * uSurface;
}
// Frosted glass: the backdrop under a gaussian blur of deviation sigma (design units),
// gathered from 32 taps on a golden-angle spiral out to 2.5 deviations. Each tap reads a
// mip about as wide as the gap between taps, so the frost stays smooth while the backdrop moves.
vec3 frosted(vec2 p, float sigma) {
  float lod = max(log2(sigma * 0.8 * uUnit) - 0.5, 0.0);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 32; i++) {
    float f = float(i) + 0.5;
    float r = sqrt(f / 32.0) * 2.5 * sigma;
    float a = f * 2.39996323;
    float w = exp(-0.5 * r * r / (sigma * sigma));
    sum += backdrop(toUv(p + r * vec2(cos(a), sin(a))), lod) * w;
    total += w;
  }
  return sum / total;
}
// The sharp bend: the backdrop at p pushed by bend, its colours split slightly.
vec3 bent(vec2 p, vec2 bend, float split, float lod) {
  return vec3(
    backdrop(toUv(p + bend * (1.0 + split)), lod).r,
    backdrop(toUv(p + bend), lod).g,
    backdrop(toUv(p + bend * (1.0 - split)), lod).b);
}
float roundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float melt(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(a, b, h) - k * h * (1.0 - h);
}
// The glass shape: a pill body, smoothly unioned with a separating droplet.
float bodyShape(vec2 p) {
  float body = roundRect(p - vec2(uBodyX, 0.0), uHalf, uRadius);
  if (uDrop.y <= 0.0) return body;
  float d = length(p - vec2(uDrop.x, 0.0)) - uDrop.y;
  float k = max(uDrop.z, 1e-3);
  float h = clamp(0.5 + 0.5 * (d - body) / k, 0.0, 1.0);
  return mix(d, body, h) - k * h * (1.0 - h);
}
// ...and with the optional second box (uBlobShape.y = its bridge softness, 0 = none).
float blobSoft(vec2 p) {
  float k = uBlobShape.y;
  if (uBlobNeck.y > 0.0) {
    float n = (p.x - uBlobNeck.x) / uBlobNeck.y;
    // A peaked falloff: as the softness drops, the bridge thins into a thread before it breaks.
    k *= exp(0.2 - sqrt(n * n + 0.04));
  }
  // On a small body the bridge belongs to the side that faces the second box: towards the far
  // edge the softness fades out (uBlobFade: how much, and how far in), or it raises a ridge there.
  if (uBlobFade.x > 0.0) {
    float back = smoothstep(-uHalf.y, -uHalf.y + 2.0 * uHalf.y * max(uBlobFade.y, 0.01), p.y * sign(uBlob.y));
    k *= mix(1.0, back, uBlobFade.x);
  }
  return max(k, 1e-3);
}
float shape(vec2 p) {
  float s = bodyShape(p);
  if (uBlobShape.y <= 0.0) return s;
  return melt(roundRect(p - uBlob.xy, uBlob.zw, uBlobShape.x), s, blobSoft(p));
}
// What casts the drop shadow: the body alone once a blob has a glass of its own.
float caster(vec2 p) {
  return uBlobShape.y > 0.0 && uBlobLine.z > 0.5 ? bodyShape(p) : shape(p);
}
// The body with corners at least as round as the bend is deep (see uBand in main).
float field(vec2 p) {
  float f = roundRect(p - vec2(uBodyX, 0.0), uHalf, uFieldRadius);
  if (uBlobShape.y <= 0.0) return f;
  return melt(roundRect(p - uBlob.xy, uBlob.zw, uBlobShape.x), f, blobSoft(p));
}
// The reference darkens linear colour; on sRGB values the same factor is k^(1/2.2).
float dim(float k) { return pow(clamp(k, 0.0, 1.0), 1.0 / 2.2); }
vec3 dim(vec3 k) { return pow(clamp(k, 0.0, 1.0), vec3(1.0 / 2.2)); }
float height(vec2 p) {
  float t = pow(clamp(-shape(p) / uBevel, 0.0, 1.0), 1.0 / 1.4);
  return sqrt(1.0 - (1.0 - t) * (1.0 - t));
}
// Radial bend (the SVG card's): towards the centre, strongest at the rim, fading over the
// half size. uRadial is the full bend per axis (design units); uEdgeBand / 0.35 = bendDepth.
float radialRatio(float d) {
  return clamp(1.0 - abs(d) / (min(uHalf.x, uHalf.y) * uEdgeBand / 0.35), 0.0, 1.0);
}
// d = shape(q): the caller has it already.
vec2 radialBend(vec2 q, float d) {
  vec2 c = q - vec2(uBodyX, 0.0);
  float k = pow(radialRatio(d), uBendCurve) * smoothstep(1.5 * uCssPx, -0.5 * uCssPx, d);
  return -c / max(length(c), 1e-4) * k * uRadial;
}
// Frost after the bend: every tap is bent on its own, and taps outside the glass are left
// out (the SVG filter saw nothing beyond the card), so the rim keeps its colour.
vec3 frostedRadial(vec2 q, float dq, float sigma) {
  float lod = max(log2(sigma * 0.8 * uUnit) - 0.5, 0.0);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 32; i++) {
    float f = float(i) + 0.5;
    float r = sqrt(f / 32.0) * 2.5 * sigma;
    float a = f * 2.39996323;
    vec2 t = q + r * vec2(cos(a), sin(a));
    // One shape per tap: it masks the tap and bends it.
    float dt = shape(t);
    float w = exp(-0.5 * r * r / (sigma * sigma)) * step(dt, 0.0);
    sum += backdrop(toUv(uCenter + t + radialBend(t, dt)), lod) * w;
    total += w;
  }
  return total > 1e-4 ? sum / total : backdrop(toUv(uCenter + q + radialBend(q, dq)), lod);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 local = px / uUnit - uCenter;
  float dist = shape(local);

  // Drop shadow: tight + ambient, kept near the glass, faded before the canvas edge.
  float vFade = smoothstep(-0.1, 0.9, local.y / uHalf.y) * 0.92 + 0.08;
  float outside = smoothstep(-4.0, 14.0, dist);
  float near = 1.0 - smoothstep(-6.0, uShadowSoft, caster(local - vec2(0.0, uShadowOffset)));
  float far = 1.0 - smoothstep(-10.0, uShadowSoft * 1.5, caster(local - vec2(0.0, uShadowOffset * 1.6)));
  float border = min(min(px.x, px.y), min(uSize.x - px.x, uSize.y - px.y));
  float sh = clamp((near + far) * uShadow * vFade * outside, 0.0, 0.85) * smoothstep(0.0, 14.0, border);
  vec4 outsideCol = vec4(0.0, 0.0, 0.0, 1.0 - dim(1.0 - sh));

  // Glow (see below): its strength here. It stays inside the glass unless a halo is asked for
  // (uGlowHalo: 1 = around the body, 2 = around the blob; and how much).
  float glowAt = 0.0;
  if (uGlow.w > 0.0) {
    vec2 gd = (local - uGlow.xy) / max(uGlow.z, 1.0);
    glowAt = uGlow.w * exp(-dot(gd, gd));
    if (uGlowHalo.x > 0.5) {
      // Past that edge it brightens the page the same way: the page's own colour at its
      // brightest, laid over just thick enough to lift the surface colour to L^(1 / (1 + halo)).
      float edgeDist = uGlowHalo.x > 1.5 ? roundRect(local - uBlob.xy, uBlob.zw, uBlobShape.x) : roundRect(local - vec2(uBodyX, 0.0), uHalf, uRadius);
      float halo = glowAt * uGlowHalo.y * exp(-max(edgeDist, 0.0) / 28.0) * smoothstep(0.0, 14.0, border);
      float pageL = max(dot(uSurface, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
      float pageMax = max(max(uSurface.r, uSurface.g), uSurface.b);
      float cover = clamp((pow(pageL, 1.0 / (1.0 + halo)) / pageL - 1.0) * pageMax / max(1.0 - pageMax, 1e-3), 0.0, 1.0);
      outsideCol = vec4(uSurface / max(pageMax, 1e-3) * cover, cover + outsideCol.a * (1.0 - cover));
    }
  }

  // Outside the glass the shadow (and the halo) is the whole pixel: about half of every canvas
  // stops here, before the bevel, the bend and the light are worked out.
  float aa = max(fwidth(dist), 1e-4);
  float mask = 1.0 - smoothstep(-aa, aa, dist);
  if (mask <= 0.0) {
    outColor = outsideCol;
    return;
  }

  // The lighting belongs to the body. A melted blob takes none of it (no reflection, inner
  // shading, rim light or caustic): its face stays flat, and the light fades out where it begins.
  float lit = 1.0;
  if (uBlobShape.y > 0.0) lit = 1.0 - smoothstep(-2.0, 8.0, roundRect(local - vec2(uBodyX, 0.0), uHalf, uRadius));
  // A blob with a glass of its own: its tint, frost and bend take over where the light leaves.
  float own = (1.0 - lit) * uBlobLine.z;
  float frostCover = mix(uFrost, uBlobMat.x, own);
  float frostBlur = mix(uFrostBlur, uBlobMat.y, own);
  float bendCurve = mix(uBendCurve, uBlobMat.z, own);
  float edgeBand = mix(uEdgeBand, uBlobMat.w, own);

  // Surface normal from the bevel height field.
  float e = 1.25;
  float h = height(local);
  vec2 grad = vec2(height(local + vec2(e, 0.0)) - h, height(local + vec2(0.0, e)) - h) / e;
  vec3 normal = normalize(vec3(-grad * 42.0, 1.0));
  float depth = clamp(1.0 - h, 0.0, 1.0);
  float edge = 1.0 - smoothstep(0.0, uBevel * edgeBand, -dist);
  vec2 dir = normalize(vec2(shape(local + vec2(e, 0.0)) - dist, shape(local + vec2(0.0, e)) - dist) + 1e-6);

  vec3 glass;
  if (uTextured > 0.5 && (uRadial.x > 0.0 || uRadial.y > 0.0)) {
    // Radial bend, then frost: the old SVG card's rim.
    float ratio = radialRatio(dist);
    float sharpLod = max(uBlurShift, 0.0);
    if (uFrostBlur > 0.0 && dist < 1.0) {
      vec3 frost = frostedRadial(local, dist, uFrostBlur * mix(1.0, uFrostEdge, pow(ratio, 1.3)));
      glass = uFrostMix < 1.0 ? mix(bent(uCenter + local, radialBend(local, dist), uDisp * 0.35, sharpLod), frost, uFrostMix) : frost;
    } else {
      glass = bent(uCenter + local, radialBend(local, dist), uDisp * 0.35, sharpLod);
    }
    if (uSaturation != 1.0) glass = max(mix(vec3(dot(glass, vec3(0.2126, 0.7152, 0.0722))), glass, uSaturation), 0.0);
  } else if (uTextured > 0.5) {
    // Refraction: magnify the middle, bend inwards at the rim, split colours slightly.
    // A lens with square corners (uBand > 0) bends deeper than its corner radius. The
    // bend then follows a shape whose corners are at least that round: on the real
    // shape its direction would break along the diagonals. Mask and light keep the real shape.
    float bendEdge = edge;
    vec2 bendDir = dir;
    if (uBand > 0.0) {
      float fd = field(local);
      bendDir = normalize(vec2(field(local + vec2(e, 0.0)) - fd, field(local + vec2(0.0, e)) - fd) + 1e-6);
      bendEdge = 1.0 - smoothstep(0.0, uBand, -fd);
    }
    vec2 magnified = local / (uMag * h + 1.0);
    vec2 bend = -bendDir * uRefract * pow(bendEdge, bendCurve);
    float split = uDisp * 0.35 * (1.0 - own);
    float lod = max(mix(uBlurCenter, uBlurEdge, pow(bendEdge, 1.3)) + uBlurShift, 0.0);
    vec2 at = uCenter + magnified;
    if (frostBlur > 0.0 && dist < 1.0) {
      // Frosted (inside the glass only: outside, nothing of it shows). The frost hides the
      // colour split, so one bent point is enough; uFrostMix lets the sharp bend show through.
      vec3 frost = frosted(at + bend, frostBlur * mix(1.0, uFrostEdge, pow(bendEdge, 1.3)));
      glass = uFrostMix < 1.0 ? mix(bent(at, bend, split, lod), frost, uFrostMix) : frost;
    } else {
      glass = bent(at, bend, split, lod);
    }
    // Vibrancy: what shows through, more (or less) saturated.
    if (uSaturation != 1.0) glass = max(mix(vec3(dot(glass, vec3(0.2126, 0.7152, 0.0722))), glass, uSaturation), 0.0);
  } else {
    // Tinted glass: its own colour in the middle, thinning towards the rim.
    glass = mix(uSurface, uColor, 1.0 - edge * uEdgeClear);
  }

  // Top reflection.
  float ny = local.y / uHalf.y;
  float nx = (local.x - uBodyX) / uHalf.x;
  float top = ((1.0 - smoothstep(-0.05, 0.75, ny)) * (1.0 - nx * 0.12) * uTopRefl * 0.6 + uTopBase) * lit;
  glass *= dim(1.0 - vec3(1.0, 1.0, 0.72) * top);

  // Frosted resting state: a still lens is the flat highlight colour.
  glass = mix(glass, uColor, frostCover * step(0.5, uTextured));

  // Inner shading: just inside the rim, a wide band on the left, a deep ring.
  float up = clamp(-dir.y, 0.0, 1.0);
  float right = clamp(dir.x, 0.0, 1.0);
  float left = clamp(-dir.x, 0.0, 1.0);
  float down = clamp(dir.y, 0.0, 1.0);
  float inner = uInner * lit;
  float innerBand = smoothstep(uBevel * -0.19, uBevel * -0.024, dist);
  glass *= dim(1.0 - innerBand * (up + left * 0.6 + right * 0.3 + down * 0.15) * inner * 2.2);
  float deepBand = smoothstep(uBevel * -0.73, uBevel * -0.13, dist);
  glass *= dim(1.0 - deepBand * left * inner * 2.0);
  float hx = (dist + uBevel * 0.45) / (uBevel * 0.26);
  float ring = exp(-hx * hx);
  glass *= dim(1.0 - ring * (right * 0.9 + up * 0.5 + left * 0.4 + down * 0.3) * inner * 1.5);

  // Rim light + fresnel; leans a little towards the cursor when there is one.
  float fresnel = pow(clamp(1.0 - normal.z, 0.0, 1.0), 6.0);
  float rimW = max(uDevicePx * 1.1, 1.0) * uRimWidth;
  float rimLine = 1.0 - smoothstep(0.0, rimW * 1.6, abs(dist + rimW * 1.8));
  float fall = exp(-(local.y / 30.0) * (local.y / 30.0));
  float studio = right * right * fall * 0.9 + down * down * 0.2 + left * left * 0.55;
  float lightCos = dot(dir, uLightDir);
  float facing = clamp(lightCos, 0.0, 1.0);
  float away = clamp(-lightCos, 0.0, 1.0);
  float aimed = facing * facing * 0.9 + away * away * 0.55;
  float lean = uLightMix * 0.4;
  float rimDir = mix(studio, aimed, lean);
  float front = mix(right, facing, lean);
  float back = mix(left, away, lean);
  // What this point of the glass mirrors. The bevel is a curved mirror: its very edge looks far
  // out, the way the rim faces there, and the look shortens with depth, down to nothing at the
  // band's inner end (uMirror.z). So a neighbour's picture is squeezed into the rim, deepest
  // where it is nearest and thinner as the rim turns away from it: a crescent on a round glass,
  // on a pill a band that tapers round the ends. Each point gathers a soft patch of the
  // surroundings (uSoft wide) at three places along its look, so the picture has no hard edge.
  float into = clamp(-dist / uMirror.z, 0.0, 1.0);
  float look = uReach * (1.0 - into);
  vec2 rimAt = uCenter + local - dir * dist;
  vec2 across = vec2(-dir.y, dir.x) * uSoft * 0.7;
  vec3 seen = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    vec2 at = rimAt + dir * look * (0.4 + 0.3 * float(i));
    seen += (around(at, uSoft) * 0.4 + around(at + across, uSoft) * 0.3 + around(at - across, uSoft) * 0.3) * uSeen[i];
  }
  // The light is white where it lands; the far side and the bottom are lit by what bounces back
  // from the surroundings, and take their colour (white from anything dark or grey).
  float seenMax = max(max(seen.r, seen.g), seen.b);
  vec3 bounce = mix(vec3(1.0), seen / max(seenMax, 1e-3), smoothstep(0.08, 0.5, seenMax) * uBounce.y);
  vec3 rimCol = mix(vec3(1.0), bounce, down * 0.6);
  rimCol = mix(rimCol, bounce * uBounce.x, back * 0.85);
  glass += rimCol * (rimLine * rimDir * uRim + fresnel * front * uFresnel * step(0.001, uRim)) * lit;

  // Reflection: the rim mirrors what differs from the surface the glass sits on. A neighbour
  // of another colour shows on the rim that faces it; a darker one dims it a little.
  // (uMirror: on the line, in the band inside it, that band's depth, the dimming. uSeen.w: the gain.)
  // much: how far what is seen differs from the surface; hue: that difference at full strength.
  vec3 differs = (seen - uSurface) * uSeen.w;
  float much = max(max(abs(differs.r), abs(differs.g)), abs(differs.b));
  vec3 hue = differs / max(much, 1e-4);
  much = min(much, 1.0);
  // On the rim it is the rim light's own line, no thicker; the band begins inside that line.
  float band = pow(1.0 - into, uFall) * uMirror.y * smoothstep(0.0, rimW * 1.8, -dist);
  float mirror = min(lit * max(rimLine * uMirror.x, band), 1.0) * much;
  // What it lacks of the surface's colour is taken out of the glass; then the glass is lifted
  // towards the neighbour's colour: dark glass mirrors it on any page.
  glass *= 1.0 - max(-hue, 0.0) * mirror * uMirror.w;
  glass += max(clamp(uSurface + hue, 0.0, 1.0) - glass, 0.0) * mirror;

  // Glow: light let in at one point, fading smoothly with distance. It brightens whatever glass
  // is near, evenly from the middle to the rim, a melted blob included (the halo is above),
  // unless the light is kept to the body (uGlowBlob: how much of it the blob takes).
  float glassL = max(dot(glass, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
  glass *= pow(glassL, 1.0 / (1.0 + glowAt * mix(uGlowBlob, 1.0, lit))) / glassL;

  // Caustic: warm light gathering inside the bottom edge.
  glass += vec3(1.0, 0.92, 0.86) * smoothstep(0.72, 0.98, depth) * down * uCaustic * lit;

  // Bordered body (outline buttons): a flat line just inside the edge.
  glass = mix(glass, uBorder, smoothstep(-uBorderWidth - aa, -uBorderWidth + aa, dist) * step(1e-4, uBorderWidth) * uBorderAlpha);
  // ...and the white line of a blob with its own glass.
  glass = mix(glass, vec3(1.0), smoothstep(-uBlobLine.x - aa, -uBlobLine.x + aa, dist) * uBlobLine.y * own);
  vec4 col = mix(outsideCol, vec4(clamp(glass, 0.0, 1.0), 1.0), mask);
  // Front layer (selected labels) sits on the frosted pill and fades as the lens clears.
  vec4 fg = texture(uFront, gl_FragCoord.xy / uSize) * mask * uFrost * step(0.5, uTextured);
  outColor = fg + col * (1.0 - fg.a);
}
`;
function createEngine() {
  const glCanvas = document.createElement("canvas");
  const gl = glCanvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
    console.warn("[liquid-glass] shader failed to compile", gl.getShaderInfoLog(s));
    return null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
  const layer = () => {
    const canvas = document.createElement("canvas");
    return { canvas, ctx: canvas.getContext("2d") };
  };
  const texture = (mipmapped) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    if (mipmapped) gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  };
  const back = layer();
  const front = layer();
  if (!back.ctx || !front.ctx) return null;
  const painted = /* @__PURE__ */ new Map();
  const around = layer();
  if (!around.ctx) return null;
  const mirrored = /* @__PURE__ */ new Map();
  const AROUND_SCALE = 0.5;
  const AROUND_EVERY = 400;
  const blank = { back: texture(true), front: texture(false) };
  const REPAINT_EVERY = 120;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.uniform1i(gl.getUniformLocation(program, "uBack"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "uFront"), 1);
  gl.uniform1i(gl.getUniformLocation(program, "uAround"), 2);
  const locations = /* @__PURE__ */ new Map();
  const u = (name) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name) ?? null;
  };
  const sent = [];
  const set = (name, a, b, c, d) => {
    const at = u(name);
    if (b === void 0) gl.uniform1f(at, a);
    else if (c === void 0) gl.uniform2f(at, a, b);
    else if (d === void 0) gl.uniform3f(at, a, b, c);
    else gl.uniform4f(at, a, b, c, d);
    sent.push(a, b ?? 0, c ?? 0, d ?? 0);
  };
  const shown = /* @__PURE__ */ new WeakMap();
  const views = /* @__PURE__ */ new Set();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let dead = false;
  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = probeCanvas.height = 1;
  const probe = probeCanvas.getContext("2d", { willReadFrequently: true });
  const ABSOLUTE = /^(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|black|white|transparent)$/i;
  const resolved = /* @__PURE__ */ new Map();
  const resolveColor = (css) => {
    if (!probe) return [1, 1, 1, 1];
    const fixed = ABSOLUTE.test(css) && !/currentcolor/i.test(css);
    const known = fixed ? resolved.get(css) : void 0;
    if (known) return [known[0], known[1], known[2], known[3]];
    const span = document.createElement("span");
    span.style.color = css;
    document.body.appendChild(span);
    const computed = getComputedStyle(span).color;
    span.remove();
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = computed;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
    if (fixed) {
      if (resolved.size > 400) resolved.clear();
      resolved.set(css, [r / 255, g / 255, b / 255, a / 255]);
    }
    return [r / 255, g / 255, b / 255, a / 255];
  };
  const pointer = { x: 0, y: 0, active: false, moved: false, mix: 0 };
  const draw = (v, refresh, repaint) => {
    const m = v.lens(refresh);
    let on = shown.get(v);
    if (!on) shown.set(v, on = { sent: [], box: "" });
    if (!m || m.width < 2 || m.height < 2) {
      v.ctx.clearRect(0, 0, v.canvas.width, v.canvas.height);
      on.sent.length = 0;
      return;
    }
    const box = `${m.left}|${m.top}|${m.width}|${m.height}`;
    if (box !== on.box) {
      on.box = box;
      const st = v.canvas.style;
      st.left = `${m.left}px`;
      st.top = `${m.top}px`;
      st.width = `${m.width}px`;
      st.height = `${m.height}px`;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const devW = Math.max(2, Math.round(m.width * dpr));
    const devH = Math.max(2, Math.round(m.height * dpr));
    if (v.canvas.width !== devW || v.canvas.height !== devH) {
      v.canvas.width = devW;
      v.canvas.height = devH;
      on.sent.length = 0;
    }
    if (glCanvas.width < devW || glCanvas.height < devH) {
      glCanvas.width = Math.max(glCanvas.width, devW);
      glCanvas.height = Math.max(glCanvas.height, devH);
    }
    gl.viewport(0, 0, devW, devH);
    const unit = m.unit;
    const r = m.refraction;
    let fresh = true;
    if (r) {
      let p = painted.get(v);
      if (!p) painted.set(v, p = { back: texture(true), front: texture(false), w: 0, h: 0, at: 0 });
      const now = performance.now();
      const sized = p.w === devW && p.h === devH;
      const fronted = r.paint.length > 1;
      fresh = !repaint && sized && now - p.at < REPAINT_EVERY;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, p.back);
      if (!fresh) {
        for (const l of fronted ? [back, front] : [back]) {
          if (l.canvas.width !== devW || l.canvas.height !== devH) {
            l.canvas.width = devW;
            l.canvas.height = devH;
          }
          l.ctx.setTransform(1, 0, 0, 1, 0, 0);
          l.ctx.clearRect(0, 0, devW, devH);
          l.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        fresh = r.paint(back.ctx, front.ctx) === false && sized;
      }
      if (!fresh) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, back.canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fronted ? p.front : blank.front);
      if (!fresh) {
        if (fronted) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, front.canvas);
        p.w = devW;
        p.h = devH;
        p.at = now;
      }
    } else {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, blank.back);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, blank.front);
    }
    sent.length = 0;
    const clear = r ? clamp((1 - r.frost) / 0.4) : 0;
    const mirror = m.strength * Math.max(0, m.tune?.mirror ?? 1) * clear;
    const f = mirror > 0 ? m.reflection : void 0;
    if (refresh && m.reflection && !f) {
      const idle = mirrored.get(v);
      if (idle) idle.due = true;
    }
    gl.activeTexture(gl.TEXTURE2);
    if (f) {
      let a = mirrored.get(v);
      if (!a) mirrored.set(v, a = { tex: texture(true), w: 0, h: 0, at: 0, left: 0, top: 0, reach: 0, due: true, timer: 0 });
      const taken = a;
      const reach = clamp(f.height * MIRROR.reach, MIRROR.reachMin, Math.max(MIRROR.reachMin, MIRROR.reachMax));
      const aw = Math.max(2, Math.ceil((m.width + 2 * reach) * AROUND_SCALE));
      const ah = Math.max(2, Math.ceil((m.height + 2 * reach) * AROUND_SCALE));
      const now = performance.now();
      gl.bindTexture(gl.TEXTURE_2D, a.tex);
      if (refresh || f.live && repaint || a.w !== aw || a.h !== ah || a.reach !== reach) a.due = true;
      if (a.due && a.w && now - a.at < AROUND_EVERY) {
        if (!a.timer)
          a.timer = window.setTimeout(
            () => {
              taken.timer = 0;
              if (mirrored.get(v) !== taken) return;
              v.repaint = true;
              wake();
            },
            AROUND_EVERY - (now - a.at)
          );
      } else if (a.due) {
        a.due = false;
        if (around.canvas.width !== aw || around.canvas.height !== ah) {
          around.canvas.width = aw;
          around.canvas.height = ah;
        }
        const c = around.ctx;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, aw, ah);
        c.setTransform(AROUND_SCALE, 0, 0, AROUND_SCALE, reach * AROUND_SCALE, reach * AROUND_SCALE);
        f.paint(c, reach);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, around.canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        a.w = aw;
        a.h = ah;
        a.at = now;
        a.left = m.left;
        a.top = m.top;
        a.reach = reach;
        fresh = false;
      }
      set("uAroundBox", (a.left - m.left - a.reach) / unit, (a.top - m.top - a.reach) / unit, a.w / AROUND_SCALE / unit, a.h / AROUND_SCALE / unit);
      set("uAroundScale", AROUND_SCALE * unit);
      set("uReach", reach / unit);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, blank.back);
      set("uAroundBox", 0, 0, 1, 1);
      set("uAroundScale", 1);
      set("uReach", 0);
    }
    set("uTextured", r ? 1 : 0);
    set("uRefract", r?.refract ?? 0);
    set("uMag", r?.magnify ?? 0);
    set("uDisp", r?.dispersion ?? 0);
    set("uBlurCenter", r?.blurCenter ?? 0);
    set("uBlurEdge", r?.blurEdge ?? 0);
    set("uBlurShift", Math.log2(Math.max(unit * dpr / 2.27, 1e-3)));
    set("uFrost", r?.frost ?? 0);
    set("uFrostBlur", Math.max(0, r?.blur ?? 0) / unit);
    set("uFrostMix", clamp(r?.blurMix ?? 1));
    const radial = Math.max(0, r?.radial ?? 0);
    set("uRadial", radial * window.innerWidth / unit, radial * window.innerHeight / unit);
    set("uCssPx", 1 / unit);
    set("uSize", devW, devH);
    set("uUnit", unit * dpr);
    set("uDevicePx", 1 / (unit * dpr));
    set("uCenter", m.cx / unit, m.cy / unit);
    set("uHalf", Math.max(m.hx / unit, 0.5), Math.max(m.hy / unit, 0.5));
    const radius = Math.max(0, Math.min(m.radius, m.hx - 0.5, m.hy - 0.5) / unit);
    set("uRadius", radius);
    const band = r ? m.band ?? 0 : 0;
    set("uBand", band);
    set("uFieldRadius", Math.min(Math.max(radius, band), Math.max(0, (Math.min(m.hx, m.hy) - 0.5) / unit)));
    set("uBodyX", m.bodyX / unit);
    set("uDrop", (m.droplet?.x ?? 0) / unit, (m.droplet?.r ?? 0) / unit, (m.droplet?.k ?? 0) / unit);
    const blob = m.blob;
    set("uBlob", (blob?.x ?? 0) / unit, (blob?.y ?? 0) / unit, (blob?.hx ?? 0) / unit, (blob?.hy ?? 0) / unit);
    set("uBlobShape", (blob?.r ?? 0) / unit, (blob?.k ?? 0) / unit);
    set("uBlobNeck", (blob?.neck?.x ?? 0) / unit, (blob?.neck?.w ?? 0) / unit);
    set("uBlobFade", blob?.fade?.amount ?? 0, blob?.fade?.reach ?? 0.5);
    const mat = blob?.material;
    set("uBlobMat", clamp(mat?.frost ?? 0), Math.max(0, mat?.blur ?? 0) / unit, Math.max(0.05, mat?.bendCurve ?? 1.6), 0.35 * Math.max(0.05, mat?.bendDepth ?? 1));
    set("uBlobLine", Math.max(0, mat?.borderWidth ?? 0) / unit, clamp(mat?.borderAlpha ?? 0), mat ? 1 : 0);
    set("uBevel", Math.max(m.bevel, 2));
    const k = m.tune ?? {};
    set("uRim", 0.55 * m.strength * (k.rim ?? 1));
    set("uCaustic", 0.08 * m.strength * (k.caustic ?? 1));
    set("uInner", 0.1 * m.strength * (k.inner ?? 1));
    set("uTopRefl", 0.3 * m.strength * (k.reflection ?? 1));
    set("uTopBase", 0.02 * m.strength * (k.reflection ?? 1));
    set("uRimWidth", Math.max(0.05, k.rimWidth ?? 1));
    set("uFresnel", 0.02 * (k.fresnel ?? 1));
    const reached = m.reflection ? clamp(m.reflection.height * MIRROR.reach, MIRROR.reachMin, Math.max(MIRROR.reachMin, MIRROR.reachMax)) : 0;
    const deep = Math.max(0.01, MIRROR.depth) * Math.max(1, Math.min(m.hx, m.hy, reached || Infinity)) / unit;
    set("uMirror", clamp(MIRROR.line) * mirror, MIRROR.band * mirror, deep, clamp(MIRROR.dim));
    set("uSoft", Math.max(0, MIRROR.soft) * reached / unit);
    const shares = Math.max(MIRROR.near + MIRROR.mid + MIRROR.far, 1e-3);
    set("uSeen", MIRROR.near / shares, MIRROR.mid / shares, MIRROR.far / shares, Math.max(0, MIRROR.gain));
    set("uBounce", Math.max(0, MIRROR.bounce), clamp(MIRROR.tint) * clear);
    set("uFall", Math.max(0.05, MIRROR.fall));
    set("uBendCurve", Math.max(0.05, k.bendCurve ?? 1.6));
    set("uEdgeBand", 0.35 * Math.max(0.05, k.bendDepth ?? 1));
    set("uSaturation", Math.max(0, k.saturation ?? 1));
    set("uFrostEdge", Math.max(0.05, k.frostEdge ?? 1));
    set("uShadow", m.shadow * m.strength);
    set("uShadowSoft", m.shadowSoftness);
    set("uShadowOffset", m.shadowOffset);
    set("uSurface", ...m.surface);
    set("uColor", ...m.color);
    set("uEdgeClear", m.edgeClear);
    set("uBorder", ...m.border ?? m.color);
    set("uBorderWidth", m.border ? Math.max(0, m.borderWidth ?? 1) / unit : 0);
    set("uBorderAlpha", clamp(m.borderAlpha ?? 1));
    const dx = pointer.x - m.screenX;
    const dy = pointer.y - m.screenY;
    const d = Math.hypot(dx, dy);
    const lightMix = m.cursorLight ? pointer.mix : 0;
    const aim = lightMix > 0 && d > 0.5 ? Math.round(Math.atan2(dy, dx) * (360 / Math.PI)) * Math.PI / 360 : -Math.PI / 2;
    set("uLightDir", Math.cos(aim), Math.sin(aim));
    set("uLightMix", lightMix);
    const glow = m.glow;
    set("uGlow", (glow?.x ?? 0) / unit, (glow?.y ?? 0) / unit, (glow?.r ?? 0) / unit, Math.max(0, glow?.amount ?? 0));
    set("uGlowHalo", glow?.halo ? glow.halo.around === "blob" && blob ? 2 : 1 : 0, clamp(glow?.halo?.amount ?? 0));
    set("uGlowBlob", clamp(glow?.blob ?? 1));
    if (fresh && on.sent.length === sent.length && sent.every((value, i) => value === on.sent[i])) return;
    on.sent = sent.slice();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    v.ctx.clearRect(0, 0, devW, devH);
    v.ctx.drawImage(glCanvas, 0, glCanvas.height - devH, devW, devH, 0, 0, devW, devH);
    v.drawn?.();
  };
  let raf = 0;
  let last = 0;
  const frame = (now) => {
    raf = 0;
    if (dead) return;
    const dt = last ? Math.min((now - last) / 1e3, 1 / 30) : 1 / 60;
    last = now;
    const still = reduced.matches;
    const target = pointer.active && !still ? 1 : 0;
    const before = pointer.mix;
    pointer.mix += (target - pointer.mix) * Math.min(1, dt * 6);
    if (Math.abs(pointer.mix - target) < 2e-3) pointer.mix = target;
    const relight = pointer.moved || pointer.mix !== before;
    pointer.moved = false;
    let running = pointer.mix !== target;
    for (const v of views) {
      const moving = v.step(dt, still);
      if (moving) running = true;
      if (!v.visible) continue;
      const again = v.repaint === true;
      if (moving || v.dirty || again || relight) {
        const refresh = v.dirty;
        v.dirty = false;
        v.repaint = false;
        draw(v, refresh, moving || refresh || again);
      }
    }
    if (running) wake();
    else if (!raf) last = 0;
  };
  const wake = () => {
    if (!raf && !dead) raf = requestAnimationFrame(frame);
  };
  const invalidateAll = () => {
    for (const v of views) v.dirty = true;
    wake();
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.moved = true;
      wake();
    },
    { passive: true }
  );
  document.documentElement.addEventListener("pointerleave", () => {
    pointer.active = false;
    pointer.moved = true;
    wake();
  });
  new MutationObserver(invalidateAll).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"]
  });
  new MutationObserver(invalidateAll).observe(document.body, { attributes: true, attributeFilter: ["data-theme"], subtree: true });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", invalidateAll);
  window.addEventListener("resize", invalidateAll, { passive: true });
  glCanvas.addEventListener("webglcontextlost", () => {
    dead = true;
    for (const v of views) {
      v.lost();
      v.ctx.clearRect(0, 0, v.canvas.width, v.canvas.height);
    }
    engine = void 0;
  });
  return {
    add: (v) => {
      views.add(v);
      wake();
    },
    remove: (v) => {
      views.delete(v);
      const a = mirrored.get(v);
      if (a) {
        mirrored.delete(v);
        clearTimeout(a.timer);
        gl.deleteTexture(a.tex);
      }
      const p = painted.get(v);
      if (!p) return;
      painted.delete(v);
      gl.deleteTexture(p.back);
      gl.deleteTexture(p.front);
    },
    wake,
    resolveColor
  };
}
var engine;
function getGlassEngine() {
  if (typeof window === "undefined") return null;
  if (engine === void 0) engine = createEngine();
  return engine;
}

// src/vendor/bilalgursen-liquid-glass/glass-layer.tsx
var PRESS_SCALE = 1.08;
var HOVER_SCALE = 1.04;
var HOVER_GROW = 0.08;
var MAX_GROW_PX = 6;
var DROPLET_GAP = 0.25;
var GLASS_CSS = `
/* Layered, so a utility class on the host (absolute, fixed) still wins over relative. */
@layer components{:where([data-glass-host]){position:relative;isolation:isolate}}
/* Unlayered on purpose: once the glass draws, it must beat the host's own fill utilities. */
[data-glass-host][data-glass-ready]{background:transparent!important;border-color:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
@keyframes glass-marquee{to{transform:translateX(-50%)}}
[data-glass-marquee]{animation:glass-marquee var(--glass-marquee-duration,5s) linear infinite}
/* Swapped labels and icons rise from a soft blur; a check draws itself in. */
@keyframes glass-in{from{opacity:0;filter:blur(3px);transform:translateY(4px)}}
[data-glass-in]{animation:glass-in .38s cubic-bezier(.2,.8,.2,1) both}
@keyframes glass-draw{from{stroke-dashoffset:25}}
[data-glass-draw]{stroke-dasharray:25;animation:glass-draw .42s cubic-bezier(.65,0,.35,1) .12s both}
@keyframes glass-spin{to{transform:rotate(1turn)}}
[data-glass-spin]{animation:glass-spin .8s linear infinite}
[data-glass-ready] [data-glass-fallback]{visibility:hidden}
@media (prefers-reduced-motion:reduce){[data-glass-marquee],[data-glass-in],[data-glass-draw],[data-glass-spin]{animation:none}}
`;
function GlassStyles() {
  return /* @__PURE__ */ React.createElement("style", { href: "liquid-glass", precedence: "default" }, GLASS_CSS);
}
function GlassLayer({
  material = "clear",
  droplet = "none",
  tint = 0.6,
  blur = 0,
  backdrop,
  live = false,
  liveFrameRate = 10,
  trigger,
  disabled = false,
  swell = true,
  optics
}) {
  const canvasRef = useRef(null);
  const dropletRef = useRef(droplet);
  dropletRef.current = droplet;
  const tuneRef = useRef({ tint, blur, optics });
  tuneRef.current = { tint, blur, optics };
  const pokeRef = useRef(null);
  useEffect(() => pokeRef.current?.(), [droplet, tint, blur, optics]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    const engine2 = disabled ? null : getGlassEngine();
    if (!canvas || !host || !ctx || !engine2) return;
    const clear = material === "clear";
    let w = 0;
    let h = 0;
    let hasDroplet = false;
    let corner = null;
    let surface = [1, 1, 1];
    let color = [
      [1, 1, 1],
      [1, 1, 1]
    ];
    let border = null;
    let borderAlpha = 1;
    let darkGlass = false;
    let colorT = 1;
    let unpaintable = false;
    let sampled = false;
    let pressed = false;
    let hovered = false;
    let ready = false;
    const page = {
      canvas: document.createElement("canvas"),
      ctx: null,
      key: "",
      at: 0,
      stale: true,
      /** The surface colour the picture was last filled with. */
      fill: "",
      // Where the glass and the page were when the picture was taken, and what the walk found:
      // elements pinned to the viewport, and whether everything else scrolls as one piece.
      size: "",
      lx: 0,
      ly: 0,
      sx: 0,
      sy: 0,
      pinned: [],
      rigid: false
    };
    const press = { x: 0, v: 0 };
    const growX = { x: 0, v: 0 };
    const growY = { x: 0, v: 0 };
    const scale = { x: 1, v: 0 };
    const drop = { x: 0, v: 0 };
    const maxScale = () => 1 + 2 * MAX_GROW_PX / Math.max(w, 1);
    const view = {
      canvas,
      ctx,
      dirty: true,
      visible: false,
      step: (dt, still) => {
        if (still) {
          press.x = growX.x = growY.x = press.v = growX.v = growY.v = 0;
          drop.x = hasDroplet && dropletRef.current === "apart" ? 1 : 0;
          drop.v = 0;
          scale.x = 1;
          host.style.scale = "";
          if (colorT !== 1) view.dirty = true;
          colorT = 1;
          return false;
        }
        const hov = hovered ? 1 : 0;
        const target2 = pressed ? Math.min(PRESS_SCALE, maxScale()) : hovered ? Math.min(HOVER_SCALE, maxScale()) : 1;
        const a = stepSpring(press, pressed ? 1 : 0, SPRINGS.press, dt);
        const b = stepSpring(growX, hov, SPRINGS.hoverX, dt);
        const c = stepSpring(growY, hov, SPRINGS.hoverY, dt);
        const d = stepSpring(scale, target2, SPRINGS.press, dt);
        const apart = dropletRef.current === "apart" && view.visible && !pressed;
        const e = hasDroplet ? stepSpring(drop, apart ? 1 : 0, apart ? SPRINGS.dropletOut : SPRINGS.dropletIn, dt) : false;
        host.style.scale = scale.x === 1 ? "" : scale.x.toFixed(4);
        const fading = 1 - colorT > 4e-3;
        colorT = fading ? colorT + (1 - colorT) * Math.min(1, dt * 14) : 1;
        return a || b || c || d || e || fading;
      },
      lens: (refresh) => {
        if (refresh) {
          w = host.offsetWidth;
          h = host.offsetHeight;
          const rounding = getComputedStyle(host).borderTopLeftRadius;
          const px = rounding.endsWith("%") ? Math.min(w, h) * parseFloat(rounding) / 100 : parseFloat(rounding) || 0;
          corner = px >= Math.min(w, h) / 2 - 0.5 ? null : px;
          const had = hasDroplet;
          hasDroplet = dropletRef.current !== "none" && [...host.children].some((c) => c.hasAttribute("data-glass-drop"));
          if (hasDroplet !== had) engine2.wake();
          const s2 = engine2.resolveColor(surfaceColorOf(host.parentElement));
          surface = [s2[0], s2[1], s2[2]];
          if (clear) {
            const o2 = tuneRef.current.optics;
            const custom = o2?.tintColor || getComputedStyle(host).getPropertyValue("--glass-tint").trim();
            const luminance = 0.2126 * surface[0] + 0.7152 * surface[1] + 0.0722 * surface[2];
            const t2 = custom ? engine2.resolveColor(custom) : null;
            const tc = t2 ? [t2[0], t2[1], t2[2]] : luminance > 0.5 ? [1, 1, 1] : [0, 0, 0];
            const tone = 0.2126 * tc[0] + 0.7152 * tc[1] + 0.0722 * tc[2] > 0.5 ? "light" : "dark";
            if (host.dataset.glassTone !== tone) host.dataset.glassTone = tone;
            darkGlass = tone === "dark";
            color = [tc, tc];
            const line = darkGlass ? { ...o2, ...o2?.dark } : o2;
            const bc = line?.borderColor && (line.borderAlpha ?? 0) > 0 ? engine2.resolveColor(line.borderColor) : null;
            border = bc ? [[bc[0], bc[1], bc[2]], [bc[0], bc[1], bc[2]]] : null;
            borderAlpha = bc ? clamp((line?.borderAlpha ?? 0) * bc[3]) : 1;
            colorT = 1;
            sampled = true;
          } else {
            const had2 = "glassReady" in host.dataset;
            const transition = host.style.transition;
            host.style.transition = "none";
            if (had2) delete host.dataset.glassReady;
            const st = getComputedStyle(host);
            const fill = engine2.resolveColor(st.backgroundColor);
            const bw = st.borderTopStyle === "solid" ? parseFloat(st.borderTopWidth) || 0 : 0;
            const bc = engine2.resolveColor(st.borderTopColor);
            const cannot = st.backgroundImage !== "none" || st.borderTopStyle !== "solid" && st.borderTopStyle !== "none";
            if (had2) {
              host.dataset.glassReady = "";
              void getComputedStyle(host).backgroundColor;
            }
            host.style.transition = transition;
            const next = mixRgb(surface, [fill[0], fill[1], fill[2]], fill[3]);
            const nextBorder = bw > 0 && bc[3] > 0.02 ? mixRgb(next, [bc[0], bc[1], bc[2]], bc[3]) : null;
            unpaintable = cannot || fill[3] < 0.02 && !nextBorder;
            const now = sampled ? mixRgb(color[0], color[1], colorT) : next;
            const nowBorder = sampled && border ? mixRgb(border[0], border[1], colorT) : nextBorder ?? next;
            const changed = sampled && (now.some((v, i) => Math.abs(v - next[i]) > 4e-3) || !!border !== !!nextBorder);
            color = [now, next];
            border = nextBorder ? [nowBorder, nextBorder] : null;
            colorT = changed ? 0 : 1;
            sampled = true;
            if (changed) engine2.wake();
          }
        }
        if (w < 2 || h < 2) return null;
        if (unpaintable) {
          if (ready) {
            ready = false;
            delete host.dataset.glassReady;
          }
          return null;
        }
        const padX = 8;
        const padTop = 10;
        const padBottom = Math.round(h * 0.8 + 4);
        const p = clamp(press.x, -0.12, 1.15);
        const s = Math.max(0.5, scale.x);
        const k = lerp(1, Math.min(PRESS_SCALE, maxScale()), p) / s;
        const grow = h * HOVER_GROW / s;
        const t = hasDroplet ? clamp(drop.x, 0, 1.06) : 0;
        const pull = h * (1 + DROPLET_GAP) * t;
        const hy = h / 2 * k + grow * growY.x;
        const rect = host.getBoundingClientRect();
        const pc = clamp(press.x);
        const unit = h / DESIGN_HEIGHT;
        const bevel = lerp(DESIGN_HEIGHT * 0.42, 62, pc);
        const radius = corner === null ? 999 : corner * (hy / (h / 2));
        const { tint: tint2, blur: blur2, optics: o } = tuneRef.current;
        const strength = Math.max(clamp(o?.light ?? 1, 0, 3), 1e-4);
        return {
          // The canvas is placed against the padding box; the glass is measured on the border box.
          left: -padX - host.clientLeft,
          top: -padTop - host.clientTop,
          width: w + 2 * padX,
          height: h + padTop + padBottom,
          unit,
          cx: padX + w / 2,
          cy: padTop + h / 2,
          hx: (w / 2 - pull / 2) * k + grow * growX.x,
          hy,
          radius,
          bodyX: -pull / 2 * k,
          droplet: t > 1e-3 ? {
            x: (w / 2 - h / 2) * k + grow * growX.x * 0.5,
            r: hy,
            // The gooey bridge opens as the droplet leaves and closes once it has snapped.
            k: h * 0.34 * smooth(0, 0.15, t) * (1 - smooth(0.8, 1, t))
          } : void 0,
          // Shading bands deeper than a square corner would meet in diagonal seams: the bevel
          // stays within the corner, and the bend keeps the depth it has on a pill.
          bevel: (corner === null ? bevel : Math.min(bevel, radius / unit * 1.2)) * Math.max(0.05, o?.bevel ?? 1),
          band: corner === null || hasDroplet ? void 0 : bevel * 0.35 * Math.max(0.05, o?.bendDepth ?? 1),
          shadow: 0.12 * lerp(0.55, 1, pc) * Math.max(0, o?.shadow ?? 1) / strength,
          shadowSoftness: 34 * lerp(0.6, 1, pc) * Math.max(0.05, o?.shadowSoftness ?? 1),
          shadowOffset: 22 * lerp(0.5, 1, pc) * Math.max(0, o?.shadowOffset ?? 1),
          strength,
          tune: o && {
            rim: o.rim,
            rimWidth: o.rimWidth,
            fresnel: o.fresnel,
            inner: o.inner,
            reflection: o.reflection,
            caustic: o.caustic,
            mirror: o.mirror,
            bendCurve: o.bendCurve,
            bendDepth: o.bendDepth,
            saturation: o.saturation,
            frostEdge: o.frostEdge
          },
          color: mixRgb(color[0], color[1], colorT),
          border: border ? mixRgb(border[0], border[1], colorT) : void 0,
          borderAlpha: clear ? borderAlpha : void 0,
          borderWidth: clear ? o?.borderWidth : void 0,
          surface,
          edgeClear: 0.2,
          cursorLight: o?.cursorLight ?? true,
          // What the rim of clear glass mirrors: the page around it. Tinted glass mirrors nothing.
          reflection: !clear ? void 0 : {
            height: h,
            live,
            paint: (around, reach) => {
              const r = host.getBoundingClientRect();
              const box = { left: r.left + (r.width - w) / 2 - padX, top: r.top + (r.height - h) / 2 - padTop, width: w + 2 * padX, height: h + padTop + padBottom };
              drawAround(around, (backdrop ? host.closest(backdrop) : null) ?? document.body, box, reach, {
                skip: (el) => el === host || el.hasAttribute("data-glass-skip"),
                onStale: dirty
              });
            }
          },
          refraction: clear ? {
            paint: (back) => {
              back.translate(padX, padTop);
              const fill = rgbCss(surface);
              const recoloured = fill !== page.fill;
              page.fill = fill;
              back.fillStyle = fill;
              back.fillRect(-padX, -padTop, w + 2 * padX, h + padTop + padBottom);
              const root = (backdrop ? host.closest(backdrop) : null) ?? document.body;
              const r = host.getBoundingClientRect();
              const lx = r.left + (r.width - w) / 2;
              const ly = r.top + (r.height - h) / 2;
              const target2 = back.canvas;
              const key = `${target2.width}:${target2.height}:${Math.round(lx * 2)}:${Math.round(ly * 2)}:${Math.round(scrollX)}:${Math.round(scrollY)}`;
              const now = performance.now();
              if (!page.ctx) page.ctx = page.canvas.getContext("2d");
              const region = { left: lx - padX, top: ly - padTop, right: lx + w + padX, bottom: ly + h + padBottom };
              const rides = !live && page.rigid && page.size === `${target2.width}:${target2.height}` && Math.abs(lx - page.lx + scrollX - page.sx) < 0.05 && Math.abs(ly - page.ly + scrollY - page.sy) < 0.05 && !page.pinned.some((el) => {
                const b = el.getBoundingClientRect();
                return b.width > 0 && b.height > 0 && b.right > region.left && b.left < region.right && b.bottom > region.top && b.top < region.bottom;
              });
              const again = !!page.ctx && (page.stale || key !== page.key && !rides || now - page.at > (live ? 12 : 120));
              if (page.ctx && again) {
                page.stale = false;
                page.key = key;
                page.at = now;
                page.size = `${target2.width}:${target2.height}`;
                page.lx = lx;
                page.ly = ly;
                page.sx = scrollX;
                page.sy = scrollY;
                if (page.canvas.width !== target2.width || page.canvas.height !== target2.height) {
                  page.canvas.width = target2.width;
                  page.canvas.height = target2.height;
                }
                const pc2 = page.ctx;
                pc2.setTransform(1, 0, 0, 1, 0, 0);
                pc2.clearRect(0, 0, target2.width, target2.height);
                pc2.setTransform(back.getTransform());
                const found = { pinned: [], touched: false, loose: false };
                drawDom(pc2, root, {
                  origin: { left: lx, top: ly },
                  region,
                  skip: (el) => el === host || el.hasAttribute("data-glass-skip"),
                  onStale: () => {
                    page.stale = true;
                    view.dirty = true;
                    engine2.wake();
                  },
                  found
                });
                page.pinned = found.pinned;
                page.rigid = !found.loose && !found.touched;
              }
              back.save();
              back.setTransform(1, 0, 0, 1, 0, 0);
              back.drawImage(page.canvas, 0, 0);
              back.restore();
              return again || recoloured;
            },
            refract: lerp(44, 37, pc) * Math.max(0, o?.refraction ?? 1),
            magnify: Math.max(0, o?.magnify ?? 0),
            dispersion: Math.max(0, o?.dispersion ?? 0.12),
            blurCenter: Math.max(0, o?.clearBlur ?? 0.35),
            blurEdge: Math.max(0, o?.clearBlurEdge ?? 2.2),
            frost: clamp(darkGlass ? o?.dark?.tint ?? tint2 : tint2),
            blur: blur2,
            blurMix: o?.frostMix,
            radial: o?.bendMode === "radial" ? 0.065 * Math.max(0, o?.refraction ?? 1) : void 0
          } : void 0,
          screenX: rect.left + rect.width / 2,
          screenY: rect.top + rect.height / 2
        };
      },
      drawn: () => {
        if (ready) return;
        ready = true;
        host.dataset.glassReady = "";
      },
      lost: () => {
        delete host.dataset.glassReady;
        host.style.scale = "";
      }
    };
    const isDisabled = () => host.matches(":disabled, [aria-disabled='true']");
    const dirty = () => {
      view.dirty = true;
      engine2.wake();
    };
    pokeRef.current = dirty;
    const onDown = () => {
      if (!swell || isDisabled()) return;
      pressed = true;
      engine2.wake();
    };
    const onUp = () => {
      pressed = false;
      engine2.wake();
    };
    const onEnter = (e) => {
      if (!swell || e.pointerType !== "mouse" || isDisabled()) return;
      hovered = true;
      dirty();
    };
    const onLeave = () => {
      pressed = false;
      hovered = false;
      dirty();
    };
    const target = (trigger ? host.closest(trigger) : null) ?? host;
    target.addEventListener("pointerdown", onDown);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
    target.addEventListener("pointerenter", onEnter);
    target.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([entry]) => {
      view.visible = entry.isIntersecting;
      dirty();
    });
    io.observe(host);
    const ro = new ResizeObserver(dirty);
    ro.observe(host);
    const mo = new MutationObserver(dirty);
    mo.observe(host, {
      childList: true,
      attributes: true,
      attributeFilter: ["class", "disabled", "aria-pressed", "aria-checked", "aria-selected", "aria-expanded", "data-state"]
    });
    const onScroll = () => {
      view.repaint = true;
      engine2.wake();
    };
    if (clear) addEventListener("scroll", onScroll, { passive: true, capture: true });
    engine2.add(view);
    // Capture animated backdrops at a bounded cadence, not on every display frame.
    // The engine sleeps between captures, and hidden pages do no background work.
    const liveTimer = clear && live ? setInterval(() => {
      if (!view.visible || document.hidden) return;
      view.repaint = true;
      engine2.wake();
    }, 1000 / Math.max(1, Math.min(30, liveFrameRate))) : null;
    return () => {
      if (liveTimer !== null) clearInterval(liveTimer);
      engine2.remove(view);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      removeEventListener("scroll", onScroll, { capture: true });
      target.removeEventListener("pointerdown", onDown);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      delete host.dataset.glassReady;
      delete host.dataset.glassTone;
      host.style.scale = "";
      pokeRef.current = null;
    };
  }, [material, backdrop, live, liveFrameRate, trigger, disabled, swell]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(GlassStyles, null), /* @__PURE__ */ React.createElement(
    "canvas",
    {
      ref: canvasRef,
      "aria-hidden": true,
      style: { position: "absolute", zIndex: -1, maxWidth: "none", pointerEvents: "none", width: 0, height: 0 }
    }
  ));
}
var glass_layer_default = GlassLayer;
export {
  GLASS_CSS,
  GlassLayer,
  GlassStyles,
  glass_layer_default as default
};
