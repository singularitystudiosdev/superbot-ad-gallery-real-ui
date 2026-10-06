// Ordered (Bayer 8x8) halftone pass: the film's "cut" layer applies it to the Kling clip and the Rodin turntable.
// One WebGL canvas per surface; draw(source) samples a cover-fit crop of a <video>/<canvas>/<img> per cell.
const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FS = `precision highp float;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uCell; uniform vec4 uRect;
uniform vec3 uInk; uniform vec3 uPaper; uniform vec3 uHi; uniform float uPaperA; uniform float uMode;
uniform float uGamma; uniform float uContrast; uniform float uBias; uniform float uFade;
float b2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
float b8(vec2 a){ return b4(0.5 * a) * 0.25 + b2(a); }
void main(){
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(frag / uCell);
  vec2 c = clamp((cell + 0.5) * uCell / uRes, 0.0, 1.0);
  vec4 s = texture2D(uTex, mix(uRect.xy, uRect.zw, c));
  float l = dot(s.rgb, vec3(0.299, 0.587, 0.114));
  l = clamp((pow(l, uGamma) - 0.5) * uContrast + 0.5 + uBias, 0.0, 1.0);
  float th = b8(cell) * 0.984 + 0.008;
  float a = step(th, s.a * uFade);
  vec4 o;
  if (uMode < 0.5) {
    o = l < th ? vec4(uInk, 1.0) : vec4(uPaper, uPaperA);
  } else {
    if (l < th * 0.55) o = vec4(uInk, 1.0);
    else if (l > 0.45 + th * 0.55) o = vec4(uHi, 1.0);
    else o = vec4(uPaper, uPaperA);
  }
  o.a *= a;
  gl_FragColor = vec4(o.rgb * o.a, o.a);
}`;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function makeDither(canvas, opt = {}) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const U = {}; for (const n of ['uRes', 'uCell', 'uRect', 'uInk', 'uPaper', 'uHi', 'uPaperA', 'uMode', 'uGamma', 'uContrast', 'uBias', 'uFade']) U[n] = gl.getUniformLocation(pr, n);
  const o = { cell: 3, ink: '#0a0a0a', paper: '#ffffff', hi: '#ffffff', paperA: 0, mode: 0, gamma: 1, contrast: 1.15, bias: 0.02, zoom: 1, fx: 0.5, fy: 0.5, ...opt };

  function draw(src, p = {}) {
    const q = { ...o, ...p };
    const sw = src.videoWidth || src.naturalWidth || src.width; const shh = src.videoHeight || src.naturalHeight || src.height;
    if (!sw || !shh) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    // cover-fit crop of the source, then zoom about the focus point
    const ca = canvas.width / canvas.height, sa = sw / shh;
    let w = 1, h = 1; if (sa > ca) w = ca / sa; else h = sa / ca;
    w /= q.zoom; h /= q.zoom;
    const x0 = Math.min(Math.max(q.fx - w / 2, 0), 1 - w), y0 = Math.min(Math.max(q.fy - h / 2, 0), 1 - h);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uCell, Math.max(2, Math.round(q.cell)));
    gl.uniform4f(U.uRect, x0, y0, x0 + w, y0 + h);
    gl.uniform3fv(U.uInk, rgb(q.ink)); gl.uniform3fv(U.uPaper, rgb(q.paper)); gl.uniform3fv(U.uHi, rgb(q.hi));
    gl.uniform1f(U.uPaperA, q.paperA); gl.uniform1f(U.uMode, q.mode);
    gl.uniform1f(U.uGamma, q.gamma); gl.uniform1f(U.uContrast, q.contrast); gl.uniform1f(U.uBias, q.bias); gl.uniform1f(U.uFade, q.fade ?? 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  return { draw, canvas };
}
