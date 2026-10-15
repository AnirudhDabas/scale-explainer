"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [
  { label: "MacBook Pro 14", w: 0.3126, h: 0.0155, d: 0.2212 },
  { label: "Side table",     w: 0.45,   h: 0.60,   d: 0.45   },
  { label: "Dining chair",   w: 0.44,   h: 0.88,   d: 0.44   },
];

// Isometric projection helpers
// Standard iso angles: right face goes right+down, left face goes left+down, top goes up
const ISO_SCALE = 30; // px per metre on the canvas
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

function isoToScreen(ix: number, iy: number, iz: number) {
  // ix = right, iy = up, iz = forward
  const sx = (ix - iz) * COS30;
  const sy = (ix + iz) * SIN30 - iy;
  return { sx, sy };
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  d: number,
  color: string,
  scale: number,
  rotY = 0,        // Y-axis rotation in radians
  glowAlpha = 0,   // extra glow pass (0–1)
) {
  const hw = w / 2, hd = d / 2;
  const cosR = Math.cos(rotY), sinR = Math.sin(rotY);

  const raw = [
    [ hw, 0,  hd], [ hw, 0, -hd], [ hw, h, -hd], [ hw, h,  hd],
    [-hw, 0,  hd], [-hw, 0, -hd], [-hw, h, -hd], [-hw, h,  hd],
  ] as const;

  const corners = raw.map(([ix, iy, iz]) => {
    // Rotate around Y axis
    const rx = ix * cosR + iz * sinR;
    const rz = -ix * sinR + iz * cosR;
    return [rx, iy, rz] as [number, number, number];
  });

  const pts = corners.map(([ix, iy, iz]) => {
    const { sx, sy } = isoToScreen(ix * scale, iy * scale, iz * scale);
    return { x: cx + sx, y: cy + sy };
  });

  // Optional glow pass
  if (glowAlpha > 0) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.globalAlpha = glowAlpha;
  }

  // Face indices: right (0,1,2,3), top (3,2,6,7), left (7,6,5,4)
  const faces = [
    { idx: [0,1,2,3], fill: `${color}22`, stroke: color },
    { idx: [3,2,6,7], fill: `${color}18`, stroke: color },
    { idx: [7,6,5,4], fill: `${color}15`, stroke: color },
  ];

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;

  for (const face of faces) {
    ctx.beginPath();
    face.idx.forEach((pi, i) => {
      const p = pts[pi];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = face.fill;
    ctx.fill();
    ctx.strokeStyle = face.stroke;
    ctx.stroke();
  }

  if (glowAlpha > 0) ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 10, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 10, y - 5);
  ctx.lineTo(x2 - 10, y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface ScaleFactorRowProps {
  axis: string;
  formula: string;
  val: number;
  changed: boolean;
}

function ScaleFactorRow({ axis, formula, val, changed }: ScaleFactorRowProps) {
  return (
    <motion.div
      className="flex items-center gap-2"
      animate={changed ? { backgroundColor: ["rgba(125,211,252,0.15)", "rgba(0,0,0,0)"] } : {}}
      transition={{ duration: 0.6 }}
      style={{ borderRadius: 4, paddingLeft: 4, paddingRight: 4 }}
    >
      <span className="w-6 font-bold" style={{ color: "#7dd3fc" }}>{axis}</span>
      <span style={{ color: "rgba(240,242,250,0.62)" }}>= {formula}</span>
      <span className="ml-auto font-bold text-white">= {val.toFixed(4)}</span>
    </motion.div>
  );
}

export default function ScaleBinding() {
  const [w, setW] = useState(0.3126);
  const [h, setH] = useState(0.0155);
  const [d, setD] = useState(0.2212);
  const [prevSx, setPrevSx] = useState<number | null>(null);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const displayRef = useRef({ w: 0.3126, h: 0.0155, d: 0.2212 });
  const rotAngle   = useRef(0);   // continuous Y-axis rotation
  const glowRef    = useRef(0);   // flash on bind (0–1, decays)
  const animRef    = useRef<number | null>(null);

  const maxDim = Math.max(w, h, d);
  const rawX = 2.0 * (w / maxDim);
  const rawY = 2.0 * (h / maxDim);
  const rawZ = 2.0 * (d / maxDim);
  const sx = w / rawX;
  const sy = h / rawY;
  const sz = d / rawZ;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    const dw = displayRef.current.w;
    const dh = displayRef.current.h;
    const dd = displayRef.current.d;

    const rot = rotAngle.current;
    const glow = glowRef.current;

    // Raw box: normalised ±1, rotates continuously
    const rawCx = cw * 0.22;
    const rawCy = ch * 0.52;
    drawIsoBox(ctx, rawCx, rawCy, 2.0, 2.0, 2.0, "#a78bfa", ISO_SCALE * 0.3, rot);

    ctx.fillStyle = "rgba(167,139,250,0.7)";
    ctx.font = "bold 10px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Raw SF3D", rawCx, rawCy + 52);
    ctx.fillStyle = "rgba(167,139,250,0.45)";
    ctx.font = "9px 'DM Sans', sans-serif";
    ctx.fillText("±1 normalised", rawCx, rawCy + 65);

    // Animated bind arrow (pulsing when glow active)
    const arrowMidY = rawCy - 12;
    const arrowAlpha = 0.7 + glow * 0.3;
    ctx.globalAlpha = arrowAlpha;
    drawArrow(ctx, rawCx + 44, arrowMidY, cw * 0.54 - 44, "#7dd3fc");
    ctx.fillStyle = "#7dd3fc";
    ctx.font = "bold 11px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("bind", (rawCx + 44 + cw * 0.54 - 44) / 2, arrowMidY - 7);
    ctx.globalAlpha = 1;

    // Bound box: actual dimensions, also rotates
    const boundCx = cw * 0.76;
    const boundCy = ch * 0.52;
    const dispMax  = Math.max(dw, dh, dd);
    const visScale = dispMax > 0 ? (ISO_SCALE * 0.75) / dispMax : ISO_SCALE * 0.75;
    // Offset rotation slightly so they don't perfectly align — more dynamic
    drawIsoBox(ctx, boundCx, boundCy, dw, dh, dd, "#7dd3fc", visScale, rot + 0.4, glow * 0.55);

    ctx.fillStyle = "rgba(125,211,252,0.85)";
    ctx.font = "bold 10px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Bound mesh", boundCx, boundCy + 52);
    ctx.fillStyle = "rgba(125,211,252,0.55)";
    ctx.font = "9px 'DM Sans', sans-serif";
    ctx.fillText(`${dw.toFixed(3)} × ${dh.toFixed(3)} × ${dd.toFixed(3)} m`, boundCx, boundCy + 65);
  }, []);

  // Unified animation loop: rotation + dimension lerp
  const wRef = useRef(w);
  const hRef = useRef(h);
  const dRef = useRef(d);
  useEffect(() => { wRef.current = w; hRef.current = h; dRef.current = d; }, [w, h, d]);

  useEffect(() => {
    // Flash glow when dimensions change
    glowRef.current = 1;
  }, [w, h, d]);

  useEffect(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    const LERP = 0.1;

    const tick = () => {
      // Continuous rotation
      rotAngle.current += 0.006;
      // Decay glow
      if (glowRef.current > 0) glowRef.current = Math.max(0, glowRef.current - 0.025);

      // Lerp dimensions
      const cur = displayRef.current;
      displayRef.current = {
        w: cur.w + (wRef.current - cur.w) * LERP,
        h: cur.h + (hRef.current - cur.h) * LERP,
        d: cur.d + (dRef.current - cur.d) * LERP,
      };

      drawCanvas();
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [drawCanvas]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => drawCanvas());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawCanvas]);

  // Track changes for flash animation
  const scaleKey = `${sx.toFixed(4)}-${sy.toFixed(4)}-${sz.toFixed(4)}`;
  const prevKeyRef = useRef(scaleKey);
  const [changedAxes, setChangedAxes] = useState({ sx: false, sy: false, sz: false });

  useEffect(() => {
    if (prevKeyRef.current !== scaleKey) {
      prevKeyRef.current = scaleKey;
      setChangedAxes({ sx: true, sy: true, sz: true });
      const t = setTimeout(() => setChangedAxes({ sx: false, sy: false, sz: false }), 650);
      return () => clearTimeout(t);
    }
  }, [scaleKey]);

  return (
    <div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,242,250,0.5)" }}>
        SF3D outputs a mesh normalised to roughly ±1 on every axis. The adapter rescales it to the
        LiDAR-measured bounding box in a single pass. Adjust the measured dimensions to see the
        binding compute in real time.
        <span className="block mt-1 text-xs italic opacity-60">
          Raw extents shown are simulated proportionally (exact SF3D raw extents vary per mesh).
        </span>
      </p>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs font-semibold self-center" style={{ color: "rgba(240,242,250,0.62)" }}>Presets:</span>
        {PRESETS.map((p) => {
          const isActive = w === p.w && h === p.h && d === p.d;
          return (
            <motion.button
              key={p.label}
              onClick={() => { setW(p.w); setH(p.h); setD(p.d); }}
              className="btn-primary focus-ring text-xs relative overflow-hidden"
              animate={{
                background: isActive ? "rgba(125,211,252,0.12)" : "rgba(255,255,255,0.04)",
                borderColor: isActive ? "rgba(125,211,252,0.4)" : "rgba(255,255,255,0.1)",
                color: isActive ? "#7dd3fc" : "rgba(240,242,250,0.6)",
              }}
              transition={{ duration: 0.2 }}
              style={{ border: "1px solid" }}
            >
              {p.label}
            </motion.button>
          );
        })}
      </div>

      {/* Isometric canvas */}
      <div
        className="rounded-xl mb-6 overflow-hidden"
        style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: 220, display: "block" }}
          aria-label="Isometric view of raw SF3D output vs bound mesh"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-white">LiDAR measured dimensions (metres)</h3>
          {[
            { label: "Width (W)",  val: w, set: setW, min: 0.05, max: 2.0 },
            { label: "Height (H)", val: h, set: setH, min: 0.01, max: 2.5 },
            { label: "Depth (D)",  val: d, set: setD, min: 0.05, max: 2.0 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: "rgba(240,242,250,0.6)" }}>{label}</label>
                <span className="text-xs font-mono font-bold" style={{ color: "#7dd3fc" }}>{val.toFixed(4)} m</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={0.001}
                value={val}
                onChange={(e) => set(parseFloat(e.target.value))}
                className="w-full"
                aria-label={`${label}: ${val.toFixed(4)} metres`}
              />
            </div>
          ))}

          {/* Scale factors */}
          <motion.div
            key={scaleKey}
            className="rounded-xl p-4"
            initial={{ boxShadow: "0 0 0 0 rgba(125,211,252,0)" }}
            animate={{ boxShadow: ["0 0 12px 2px rgba(125,211,252,0.15)", "0 0 0 0 rgba(125,211,252,0)"] }}
            transition={{ duration: 0.5 }}
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h4 className="text-xs font-semibold text-white mb-3">Computed scale factors</h4>
            <div className="space-y-2 font-mono text-xs">
              <ScaleFactorRow axis="sx" formula={`${w.toFixed(4)} / ${rawX.toFixed(4)}`} val={sx} changed={changedAxes.sx} />
              <ScaleFactorRow axis="sy" formula={`${h.toFixed(4)} / ${rawY.toFixed(4)}`} val={sy} changed={changedAxes.sy} />
              <ScaleFactorRow axis="sz" formula={`${d.toFixed(4)} / ${rawZ.toFixed(4)}`} val={sz} changed={changedAxes.sz} />
            </div>
            <p className="text-[10px] mt-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,242,250,0.50)" }}>
              Source: services/gen/app/generate_server.py, docs/SYSTEM_STATE.md
            </p>
          </motion.div>
        </div>

        {/* Binding formula explainer */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">The binding contract</h3>
          <div
            className="rounded-xl p-4 space-y-3 h-full"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-xs font-mono space-y-1.5" style={{ color: "rgba(240,242,250,0.65)" }}>
              <p style={{ color: "rgba(240,242,250,0.38)" }}># one scale binding, applied exactly once</p>
              <p><span style={{ color: "#a78bfa" }}>raw</span> = sf3d_output(<span style={{ color: "#fb8c42" }}>best_frame</span>)</p>
              <p><span style={{ color: "#7dd3fc" }}>sx</span> = bbox.w / raw.extentX</p>
              <p><span style={{ color: "#7dd3fc" }}>sy</span> = bbox.h / raw.extentY</p>
              <p><span style={{ color: "#7dd3fc" }}>sz</span> = bbox.d / raw.extentZ</p>
              <p>mesh.scale(<span style={{ color: "#7dd3fc" }}>sx, sy, sz</span>)</p>
              <p style={{ color: "rgba(240,242,250,0.38)" }}># glTF node scale written as 1.0</p>
            </div>
            <div
              className="rounded-lg p-3 mt-2"
              style={{ background: "rgba(125,211,252,0.05)", border: "1px solid rgba(125,211,252,0.12)" }}
            >
              <p className="text-xs leading-relaxed" style={{ color: "rgba(240,242,250,0.55)" }}>
                The binding is the only place rescaling happens.{" "}
                <strong style={{ color: "rgba(240,242,250,0.75)" }}>Downstream scale is always 1.0.</strong>{" "}
                Any component that applies its own scale factor corrupts the result and violates the contract.
              </p>
            </div>
            <p className="text-xs" style={{ color: "rgba(240,242,250,0.3)" }}>
              Measured accuracy on first live product: bound extents match LiDAR to{" "}
              <span style={{ color: "rgba(125,211,252,0.7)" }}>1 × 10⁻⁸ m</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
