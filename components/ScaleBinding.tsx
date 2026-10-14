"use client";

import { useState } from "react";

const PRESETS = [
  { label: "MacBook Pro 14", w: 0.3126, h: 0.0155, d: 0.2212 },
  { label: "Side table", w: 0.45, h: 0.60, d: 0.45 },
  { label: "Dining chair", w: 0.44, h: 0.88, d: 0.44 },
];

export default function ScaleBinding() {
  const [w, setW] = useState(0.3126);
  const [h, setH] = useState(0.0155);
  const [d, setD] = useState(0.2212);

  const maxDim = Math.max(w, h, d);
  const rawX = 2.0 * (w / maxDim);
  const rawY = 2.0 * (h / maxDim);
  const rawZ = 2.0 * (d / maxDim);

  const sx = w / rawX;
  const sy = h / rawY;
  const sz = d / rawZ;

  const boundMaxPx = 110;
  const scaleForDisplay = boundMaxPx / maxDim;
  const boundW = Math.max(w * scaleForDisplay, 4);
  const boundH = Math.max(h * scaleForDisplay, 3);

  return (
    <div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(226,232,240,0.5)" }}>
        SF3D outputs a mesh normalised to roughly ±1 on every axis. The adapter rescales it to the
        LiDAR-measured bounding box in a single pass. Adjust the measured dimensions to see the
        binding compute in real time.
        <span className="block mt-1 text-xs italic opacity-60">
          Raw extents shown are simulated proportionally (exact SF3D raw extents vary per mesh).
        </span>
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs font-semibold self-center" style={{ color: "rgba(226,232,240,0.35)" }}>Presets:</span>
        {PRESETS.map((p) => {
          const isActive = w === p.w && h === p.h && d === p.d;
          return (
            <button
              key={p.label}
              onClick={() => { setW(p.w); setH(p.h); setD(p.d); }}
              className={`btn-primary focus-ring text-xs ${isActive ? "btn-active" : ""}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-white">LiDAR measured dimensions (metres)</h3>
          {[
            { label: "Width (W)", val: w, set: setW, min: 0.05, max: 2.0 },
            { label: "Height (H)", val: h, set: setH, min: 0.01, max: 2.5 },
            { label: "Depth (D)", val: d, set: setD, min: 0.05, max: 2.0 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.6)" }}>{label}</label>
                <span className="text-xs font-mono font-bold text-teal">{val.toFixed(4)} m</span>
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
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h4 className="text-xs font-semibold text-white mb-3">Computed scale factors</h4>
            <div className="space-y-2 font-mono text-xs">
              {[
                { axis: "sx", formula: `${w.toFixed(4)} / ${rawX.toFixed(4)}`, val: sx },
                { axis: "sy", formula: `${h.toFixed(4)} / ${rawY.toFixed(4)}`, val: sy },
                { axis: "sz", formula: `${d.toFixed(4)} / ${rawZ.toFixed(4)}`, val: sz },
              ].map(({ axis, formula, val }) => (
                <div key={axis} className="flex items-center gap-2">
                  <span className="w-6 font-bold text-teal">{axis}</span>
                  <span style={{ color: "rgba(226,232,240,0.35)" }}>= {formula}</span>
                  <span className="ml-auto font-bold text-white">= {val.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.25)" }}>
              Source: services/gen/app/generate_server.py, docs/SYSTEM_STATE.md
            </p>
          </div>
        </div>

        {/* Visual */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Mesh before and after binding</h3>
          <div
            className="rounded-xl p-4 flex flex-col items-center gap-4"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <svg viewBox="0 0 300 200" className="w-full" aria-label="Raw vs bound mesh comparison">
              {/* Raw mesh */}
              <text x="70" y="18" fontSize="10" fill="rgba(167,139,250,0.8)" textAnchor="middle" fontWeight="600">Raw SF3D output</text>
              <rect
                x={70 - 40}
                y={110 - 40}
                width={80}
                height={80}
                rx="4"
                fill="rgba(167,139,250,0.07)"
                stroke="rgba(167,139,250,0.6)"
                strokeWidth="1.5"
              />
              <text x="70" y="115" fontSize="8.5" fill="rgba(167,139,250,0.7)" textAnchor="middle">approx {rawX.toFixed(1)}</text>
              <text x="70" y="127" fontSize="8.5" fill="rgba(167,139,250,0.7)" textAnchor="middle">x {rawY.toFixed(1)}</text>
              <text x="70" y="156" fontSize="8" fill="rgba(226,232,240,0.3)" textAnchor="middle">normalised units</text>

              {/* Arrow */}
              <path d="M115 110 H155" stroke="#7dd3fc" strokeWidth="2" fill="none" markerEnd="url(#cbarr-sc)" />
              <text x="135" y="103" fontSize="8" fill="#7dd3fc" textAnchor="middle" fontWeight="700">bind</text>

              {/* Bound mesh */}
              <text x="220" y="18" fontSize="10" fill="rgba(15,196,184,0.8)" textAnchor="middle" fontWeight="600">Bound to bboxMeters</text>
              <rect
                x={220 - boundW / 2}
                y={110 - boundH / 2}
                width={boundW}
                height={boundH}
                rx="3"
                fill="rgba(15,196,184,0.1)"
                stroke="rgba(15,196,184,0.7)"
                strokeWidth="1.5"
              />
              <text x="220" y="152" fontSize="9" fill="rgba(15,196,184,0.8)" textAnchor="middle" fontWeight="600">
                {w.toFixed(3)} x {h.toFixed(3)} m
              </text>
              <text x="220" y="165" fontSize="8" fill="rgba(226,232,240,0.3)" textAnchor="middle">= LiDAR measurement</text>

              <defs>
                <marker id="cbarr-sc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10Z" fill="#7dd3fc" />
                </marker>
              </defs>
            </svg>

            <div className="text-xs text-center" style={{ color: "rgba(226,232,240,0.4)" }}>
              <p>The binding is the only place rescaling happens.</p>
              <p className="font-semibold text-white/70 mt-0.5">Downstream scale is always 1.0.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
