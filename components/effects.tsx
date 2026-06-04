"use client";
import React from "react";

/* Holoverse — holographic tilt card (magical TCG foil).
   Adapts the React-Bits ProfileCard shine/glare/tilt to vanilla inline styles.
   Pointer drives CSS vars --px/--py (glare + rainbow position) and --rx/--ry (3D tilt). */
function HoloTilt({ children, rainbow = true, max = 14, radius = 12, style, className = "" }) {
  const ref = React.useRef(null);
  const raf = React.useRef(0);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--px", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--py", (py * 100).toFixed(1) + "%");
      el.style.setProperty("--rx", ((0.5 - py) * max).toFixed(2) + "deg");
      el.style.setProperty("--ry", ((px - 0.5) * max).toFixed(2) + "deg");
      el.style.setProperty("--fc", Math.min(1, Math.hypot(px - 0.5, py - 0.5) * 2).toFixed(2));
    });
  };
  const onEnter = () => ref.current && ref.current.classList.add("is-hover");
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-hover");
    el.style.setProperty("--px", "50%");
    el.style.setProperty("--py", "50%");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} className={`holo-tilt ${className}`} onPointerMove={onMove} onPointerEnter={onEnter} onPointerLeave={onLeave}
      style={{ borderRadius: radius, ...style }}>
      <div className="holo-inner" style={{ borderRadius: radius }}>
        {children}
        {rainbow && <div className="holo-layer holo-shine" style={{ borderRadius: radius }} />}
        <div className="holo-layer holo-glare" style={{ borderRadius: radius }} />
      </div>
    </div>
  );
}


/* Holoverse — LiquidChrome animated background (raw WebGL, no deps).
   Adapted from the React-Bits LiquidChrome shader. window.LiquidChrome */
function LiquidChrome({ baseColor = [0.12, 0.10, 0.18], speed = 0.5, amplitude = 0.5, frequencyX = 3, frequencyY = 2, interactive = true, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false, premultipliedAlpha: false });
    if (!gl) { container.style.background = "linear-gradient(135deg,#1a1430,#0d0a18)"; return; }
    container.appendChild(canvas);

    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const vert = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";
    const frag = `precision highp float;
      uniform float uTime; uniform vec3 uResolution; uniform vec3 uBaseColor;
      uniform float uAmplitude; uniform float uFrequencyX; uniform float uFrequencyY; uniform vec2 uMouse;
      vec3 render(vec2 uvCoord){
        vec2 fragCoord = uvCoord * uResolution.xy;
        vec2 uv = (2.0*fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);
        for(float i=1.0;i<10.0;i++){
          uv.x += uAmplitude/i * cos(i*uFrequencyX*uv.y + uTime + uMouse.x*3.14159);
          uv.y += uAmplitude/i * cos(i*uFrequencyY*uv.x + uTime + uMouse.y*3.14159);
        }
        vec2 diff = uvCoord - uMouse; float dist = length(diff); float fall = exp(-dist*20.0);
        float rip = sin(10.0*dist - uTime*2.0)*0.03;
        uv += (diff/(dist+0.0001)) * rip * fall;
        return uBaseColor / abs(sin(uTime - uv.y - uv.x));
      }
      void main(){
        vec2 vUv = gl_FragCoord.xy / uResolution.xy;
        gl_FragColor = vec4(render(vUv), 1.0);
      }`;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n) => gl.getUniformLocation(prog, n);
    const uTime = U("uTime"), uRes = U("uResolution"), uBase = U("uBaseColor"), uAmp = U("uAmplitude"), uFX = U("uFrequencyX"), uFY = U("uFrequencyY"), uMouse = U("uMouse");
    gl.uniform3fv(uBase, new Float32Array(baseColor));
    gl.uniform1f(uAmp, amplitude); gl.uniform1f(uFX, frequencyX); gl.uniform1f(uFY, frequencyY);

    let mouse = [0.5, 0.5];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      const w = container.offsetWidth, h = container.offsetHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(uRes, canvas.width, canvas.height, canvas.width / canvas.height);
    }
    const ro = new ResizeObserver(resize); ro.observe(container); resize();
    function onMove(e) { const r = container.getBoundingClientRect(); mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; }
    if (interactive) container.addEventListener("pointermove", onMove);

    let raf, start = performance.now();
    function loop(t) {
      raf = requestAnimationFrame(loop);
      gl.uniform1f(uTime, (t - start) * 0.001 * speed);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      if (interactive) container.removeEventListener("pointermove", onMove);
      const ext = gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();
      if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
    };
  }, []);
  return <div ref={ref} style={{ position: "absolute", inset: 0, ...style }} aria-hidden="true" />;
}


export { HoloTilt, LiquidChrome };
