import { springs } from './springs'

export function mount(root: HTMLElement): () => void {
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  root.appendChild(canvas)
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
  if (!gl) return () => canvas.remove()
  const vertex = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vertex, 'attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}')
  gl.compileShader(vertex)
  const fragment = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fragment, 'precision mediump float; uniform float t; uniform float green; void main(){vec2 p=gl_PointCoord; vec2 uv=(gl_FragCoord.xy/48.-.5)*2.; float d=length(uv); vec3 a=mix(vec3(.95,.25,.12),vec3(.20,.8,.5),green); float glow=smoothstep(1.,.1,d); float core=smoothstep(.68,.55,d); gl_FragColor=vec4(a*(.55+.45*core)+vec3(.2)*core,glow*(.75+.05*sin(t)));}')
  gl.compileShader(fragment)
  const program = gl.createProgram()!
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program); gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const time = gl.getUniformLocation(program, 't')
  const colour = gl.getUniformLocation(program, 'green')
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  let frame = 0
  let value = document.documentElement.dataset.theme === 'green' ? 1 : 0
  let velocity = 0
  let previous = 0
  const draw = (now: number) => {
    const target = document.documentElement.dataset.theme === 'green' ? 1 : 0
    const dt = Math.min((now - (previous || now)) / 1000, 0.032)
    previous = now
    if (media.matches) { value = target; velocity = 0 }
    else {
      velocity += ((target - value) * springs.soft.stiffness - velocity * springs.soft.damping) * dt
      value += velocity * dt
    }
    gl.uniform1f(time, media.matches ? 0 : now / 1000); gl.uniform1f(colour, value)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    if (!media.matches && !document.hidden) frame = requestAnimationFrame(draw)
  }
  const restart = () => { cancelAnimationFrame(frame); previous = 0; if (!document.hidden) frame = requestAnimationFrame(draw) }
  const observer = new MutationObserver(restart)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  media.addEventListener('change', restart); document.addEventListener('visibilitychange', restart)
  restart()
  return () => { cancelAnimationFrame(frame); observer.disconnect(); media.removeEventListener('change', restart); document.removeEventListener('visibilitychange', restart); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove() }
}
