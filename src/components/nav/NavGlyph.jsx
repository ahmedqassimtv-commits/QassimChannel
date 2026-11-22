/* ══ Nav glyphs — every icon has its own motion ═══════════════════════════
   Hand-drawn 24×24 line icons (1.7 stroke). Each icon is built from parts that
   animate on their own when the parent link is "hot" (hover / focus / press)
   — see .qz-g-* rules in nav.css. Motion is transform/opacity only, and every
   animation starts and ends on the resting pose, so a cut never jumps. */

const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const GLYPHS = {
  // Home: the roof lifts and the door swings open
  home: (
    <>
      <path className="qz-g-roof" d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.6V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.6" />
      <path className="qz-g-door" d="M10 20v-4.6a2 2 0 0 1 4 0V20" />
    </>
  ),
  // Verdict: the beam weighs, the pans follow
  verdict: (
    <>
      <path d="M12 4.5V20M8.5 20h7" />
      <g className="qz-g-beam">
        <path d="M5 7.5h14" />
        <g className="qz-g-pan-a">
          <path d="m5 7.5-2.4 5.2M5 7.5l2.4 5.2" />
          <path d="M2.4 12.7a2.6 2.6 0 0 0 5.2 0Z" />
        </g>
        <g className="qz-g-pan-b">
          <path d="m19 7.5-2.4 5.2M19 7.5l2.4 5.2" />
          <path d="M16.4 12.7a2.6 2.6 0 0 0 5.2 0Z" />
        </g>
      </g>
      <circle cx="12" cy="4.2" r="1.1" />
    </>
  ),
  // Stories: the arrow rewinds the clock, hands spin back
  stories: (
    <>
      <path className="qz-g-rewind" d="M3.6 12a8.4 8.4 0 1 0 2.5-6M3.4 4.4v3.9h3.9" />
      <g className="qz-g-hands">
        <path d="M12 7.8V12l2.8 1.8" />
      </g>
    </>
  ),
  // Videos: the frame flashes, play pops forward
  videos: (
    <>
      <rect className="qz-g-frame" x="3" y="5" width="18" height="14" rx="4" />
      <path
        className="qz-g-play"
        d="M10.2 9.3v5.4a.6.6 0 0 0 .9.5l4.3-2.7a.6.6 0 0 0 0-1l-4.3-2.7a.6.6 0 0 0-.9.5Z"
      />
    </>
  ),
  // Articles: an open book whose page turns
  articles: (
    <>
      <path d="M12 6.5c-1.8-1.3-4.6-1.8-8-1.5v13c3.4-.3 6.2.2 8 1.5 1.8-1.3 4.6-1.8 8-1.5V5c-3.4-.3-6.2.2-8 1.5Z" />
      <path d="M12 6.5v13" />
      <path className="qz-g-page" d="M12 6.5c1.5-1 3.6-1.4 6-1.3v12.1c-2.4-.1-4.5.3-6 1.3" />
    </>
  ),
  // Masaha: a compass whose needle spins and settles
  masaha: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <g className="qz-g-needle">
        <path d="m14.9 9.1-1.6 4.2-4.2 1.6 1.6-4.2Z" />
      </g>
    </>
  ),
  // Search: the lens zooms, the handle wiggles
  search: (
    <>
      <circle className="qz-g-lens" cx="10.8" cy="10.8" r="6" />
      <path className="qz-g-handle" d="m15.3 15.3 4.6 4.6" />
    </>
  ),
  close: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  arrow: <path d="M17 7 7 17M7 9v8h8" />,
}

export default function NavGlyph({ name, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`qz-glyph ${className}`}
      data-glyph={name}
      aria-hidden="true"
      focusable="false"
      {...P}
    >
      {GLYPHS[name]}
    </svg>
  )
}
