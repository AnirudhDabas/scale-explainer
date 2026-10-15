"use client";

import { useState } from "react";
import { PIPELINE_STEPS } from "@/data/content";

type Visual = "lidar" | "upload" | "queue" | "sf3d" | "binding" | "sse" | "place";

const C = {
  teal: "#7dd3fc",
  blue: "#5b9cf6",
  orange: "#fb8c42",
  purple: "#a78bfa",
  text: "rgba(240,242,250,0.85)",
  muted: "rgba(240,242,250,0.4)",
  dim: "rgba(240,242,250,0.2)",
  bg: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
};

function StepVisual({ visual }: { visual: Visual }) {
  const W = 320, H = 190;

  if (visual === "lidar") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="LiDAR measurement">
        <rect x="16" y="60" width="44" height="76" rx="7" fill={C.bg} stroke={C.teal} strokeWidth="1.5" />
        <rect x="24" y="68" width="28" height="44" rx="3" fill="rgba(15,196,184,0.08)" />
        <circle cx="38" cy="126" r="4" fill={C.teal} opacity="0.6" />
        {[0,1,2,3,4].map((i) => (
          <line key={i} x1="60" y1={72 + i * 14} x2="160" y2={56 + i * 18} stroke={C.teal} strokeWidth="1" strokeDasharray="4 3" opacity={0.3 + i * 0.12} />
        ))}
        <rect x="160" y="102" width="100" height="6" rx="2" fill="#3a3a3c" opacity="0.9" />
        <rect x="163" y="74" width="94" height="30" rx="3" fill="#2a2a2c" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="160" y1="118" x2="260" y2="118" stroke={C.teal} strokeWidth="1.2" />
        <text x="210" y="132" fontSize="10" fill={C.teal} textAnchor="middle" fontWeight="600">31.3 cm</text>
        <line x1="264" y1="74" x2="264" y2="108" stroke={C.orange} strokeWidth="1.2" />
        <text x="278" y="95" fontSize="10" fill={C.orange} textAnchor="start" fontWeight="600">1.6 cm</text>
        <rect x="58" y="154" width="204" height="22" rx="6" fill="rgba(15,196,184,0.1)" stroke="rgba(15,196,184,0.2)" strokeWidth="1" />
        <text x="160" y="169" fontSize="9.5" fill={C.teal} textAnchor="middle" fontWeight="600">state: &quot;measured&quot; · under 1 s</text>
      </svg>
    );
  }

  if (visual === "upload") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Upload frames">
        <rect x="16" y="56" width="44" height="76" rx="7" fill={C.bg} stroke={C.teal} strokeWidth="1.5" />
        {[0,1,2].map((i) => (
          <rect key={i} x={86 + i * 7} y={68 - i * 7} width="50" height="38" rx="4" fill={i === 0 ? "rgba(15,196,184,0.07)" : C.bg} stroke={i === 0 ? C.teal : C.border} strokeWidth={i === 0 ? 1.5 : 1} opacity={1 - i * 0.25} />
        ))}
        <text x="111" y="91" fontSize="9" fill={C.teal} textAnchor="middle" fontWeight="600">JPEG</text>
        <path d="M152 82 H194" stroke={C.orange} strokeWidth="1.5" fill="none" markerEnd="url(#uarr-up)" />
        <text x="173" y="76" fontSize="8" fill={C.orange} textAnchor="middle" fontWeight="600">PUT</text>
        <ellipse cx="220" cy="75" rx="30" ry="10" fill={C.bg} stroke={C.orange} strokeWidth="1.5" />
        <rect x="190" y="75" width="60" height="40" fill={C.bg} stroke={C.orange} strokeWidth="1.5" />
        <ellipse cx="220" cy="115" rx="30" ry="10" fill="rgba(251,140,66,0.07)" stroke={C.orange} strokeWidth="1.5" />
        <text x="220" y="98" fontSize="11" fill={C.orange} textAnchor="middle" fontWeight="700">R2</text>
        <text x="220" y="150" fontSize="8.5" fill={C.muted} textAnchor="middle">objects/{"{id}"}/frames/0.jpg</text>
        <defs>
          <marker id="uarr-up" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill={C.orange} />
          </marker>
        </defs>
      </svg>
    );
  }

  if (visual === "queue") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Job queue">
        {[
          { x: 8, label: "Phone", sub: "POST /generate", c: C.teal },
          { x: 88, label: "Worker", sub: "job record", c: C.orange },
          { x: 168, label: "Queue", sub: "Cloudflare", c: C.orange },
          { x: 248, label: "Workflow", sub: "GenerateMesh", c: C.purple },
        ].map((item, i) => (
          <g key={i}>
            <rect x={item.x} y="60" width="72" height="56" rx="8" fill={C.bg} stroke={item.c} strokeWidth="1.2" opacity="0.9" />
            <text x={item.x + 36} y="83" fontSize="10" fill={item.c} textAnchor="middle" fontWeight="700">{item.label}</text>
            <text x={item.x + 36} y="99" fontSize="8.5" fill={C.muted} textAnchor="middle">{item.sub}</text>
            {i < 3 && (
              <path d={`M${item.x + 72} 88 H${item.x + 88}`} stroke={C.muted} strokeWidth="1.5" fill="none" markerEnd="url(#qarr-q)" />
            )}
          </g>
        ))}
        <text x="160" y="140" fontSize="9" fill={C.muted} textAnchor="middle">1-min cron · one admission slot</text>
        <defs>
          <marker id="qarr-q" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill={C.muted} />
          </marker>
        </defs>
      </svg>
    );
  }

  if (visual === "sf3d") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="SF3D raw mesh">
        <rect x="12" y="58" width="70" height="52" rx="6" fill={C.bg} stroke={C.teal} strokeWidth="1.2" />
        <text x="47" y="87" fontSize="9" fill={C.teal} textAnchor="middle" fontWeight="600">best frame</text>
        <text x="47" y="100" fontSize="8" fill={C.muted} textAnchor="middle">JPEG</text>
        <path d="M84 84 H118" stroke={C.purple} strokeWidth="1.5" fill="none" markerEnd="url(#sarr-sf)" />
        <text x="101" y="77" fontSize="8" fill={C.purple} textAnchor="middle" fontWeight="600">SF3D</text>
        <g transform="translate(112 38)">
          <path d="M80 52 L120 32 L120 90 L80 110 Z" fill="rgba(167,139,250,0.07)" stroke={C.purple} strokeWidth="1.5" />
          <path d="M80 52 L40 32 L80 12 L120 32" fill="rgba(167,139,250,0.04)" stroke={C.purple} strokeWidth="1.5" />
          <path d="M40 32 L40 90 L80 110" fill="rgba(167,139,250,0.05)" stroke={C.purple} strokeWidth="1.5" />
          <text x="16" y="62" fontSize="9" fill={C.purple} fontWeight="600">±1</text>
          <text x="100" y="118" fontSize="9" fill={C.purple} fontWeight="600">±1</text>
          <text x="128" y="57" fontSize="9" fill={C.purple} fontWeight="600">±1</text>
        </g>
        <text x="200" y="156" fontSize="9" fill={C.muted} textAnchor="middle">no real-world units</text>
        <defs>
          <marker id="sarr-sf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill={C.purple} />
          </marker>
        </defs>
      </svg>
    );
  }

  if (visual === "binding") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Scale binding">
        <text x="72" y="30" fontSize="9" fill={C.muted} textAnchor="middle" fontWeight="600">raw SF3D</text>
        <rect x="28" y="42" width="88" height="88" rx="5" fill="rgba(167,139,250,0.07)" stroke={C.purple} strokeWidth="1.5" />
        <text x="72" y="92" fontSize="10" fill={C.purple} textAnchor="middle">1.0 × 1.0</text>
        <text x="72" y="108" fontSize="9" fill={C.muted} textAnchor="middle">dimensionless</text>
        <path d="M122 86 H158" stroke={C.teal} strokeWidth="2" fill="none" markerEnd="url(#barr-b)" />
        <text x="140" y="76" fontSize="8" fill={C.teal} textAnchor="middle" fontWeight="700">bind</text>
        <text x="140" y="88" fontSize="7" fill={C.teal} textAnchor="middle">sx = w / extX</text>
        <text x="140" y="98" fontSize="7" fill={C.teal} textAnchor="middle">sy = h / extY</text>
        <text x="232" y="30" fontSize="9" fill={C.muted} textAnchor="middle" fontWeight="600">bound mesh</text>
        <rect x="172" y="76" width="120" height="8" rx="2" fill="rgba(15,196,184,0.12)" stroke={C.teal} strokeWidth="1.5" />
        <rect x="175" y="50" width="114" height="28" rx="3" fill="rgba(15,196,184,0.06)" stroke={C.teal} strokeWidth="1.5" />
        <text x="232" y="100" fontSize="10" fill={C.teal} textAnchor="middle" fontWeight="700">0.3126 m</text>
        <text x="294" y="65" fontSize="9" fill={C.teal} textAnchor="start">0.016 m</text>
        <text x="232" y="118" fontSize="9" fill={C.muted} textAnchor="middle">= LiDAR measurement</text>
        <text x="232" y="131" fontSize="8" fill={C.dim} textAnchor="middle">accurate to 1 × 10⁻⁸ m</text>
        <defs>
          <marker id="barr-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill={C.teal} />
          </marker>
        </defs>
      </svg>
    );
  }

  if (visual === "sse") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="SSE notification">
        <rect x="10" y="52" width="72" height="50" rx="8" fill={C.bg} stroke={C.orange} strokeWidth="1.2" />
        <text x="46" y="75" fontSize="10" fill={C.orange} textAnchor="middle" fontWeight="700">R2</text>
        <text x="46" y="91" fontSize="8" fill={C.muted} textAnchor="middle">mesh.glb</text>
        <path d="M82 76 H118" stroke={C.orange} strokeWidth="1.5" fill="none" markerEnd="url(#searr-s)" />
        <rect x="118" y="52" width="80" height="50" rx="8" fill={C.bg} stroke={C.orange} strokeWidth="1.2" />
        <text x="158" y="74" fontSize="9" fill={C.orange} textAnchor="middle" fontWeight="700">Durable</text>
        <text x="158" y="87" fontSize="9" fill={C.orange} textAnchor="middle" fontWeight="700">Object</text>
        <text x="158" y="97" fontSize="8" fill={C.muted} textAnchor="middle">fan-out</text>
        {[{ y: 44, label: "iPhone" }, { y: 76, label: "Quest" }].map((item, i) => (
          <g key={i}>
            <path d={`M198 ${item.y + 33} H238`} stroke={C.muted} strokeWidth="1.2" fill="none" strokeDasharray="4 3" markerEnd="url(#searr2-s)" />
            <rect x="238" y={item.y + 22} width="74" height="28" rx="6" fill={C.bg} stroke={C.border} strokeWidth="1" />
            <text x="275" y={item.y + 35} fontSize="9" fill={C.text} textAnchor="middle" fontWeight="600">{item.label}</text>
            <text x="275" y={item.y + 46} fontSize="8" fill={C.muted} textAnchor="middle">SSE</text>
          </g>
        ))}
        <rect x="10" y="120" width="294" height="48" rx="6" fill="rgba(0,0,0,0.25)" stroke={C.border} strokeWidth="1" />
        <text x="18" y="135" fontSize="8.5" fill={C.teal} fontFamily="monospace">event: object</text>
        <text x="18" y="150" fontSize="8.5" fill={C.text} fontFamily="monospace">state: &quot;ready&quot; · glbUrl: &quot;…&quot;</text>
        <text x="18" y="163" fontSize="8.5" fill={C.muted} fontFamily="monospace">bboxMeters: {`{w:0.3126, h:0.0155}`}</text>
        <defs>
          <marker id="searr-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill={C.orange} />
          </marker>
          <marker id="searr2-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10Z" fill={C.muted} />
          </marker>
        </defs>
      </svg>
    );
  }

  if (visual === "place") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Placed in headset">
        <rect x="60" y="20" width="200" height="140" rx="5" fill="rgba(15,196,184,0.05)" stroke={C.teal} strokeWidth="1.5" />
        <text x="160" y="14" fontSize="9" fill={C.muted} textAnchor="middle">Room H · 2.76 x 4.72 m</text>
        <rect x="60" y="20" width="200" height="7" fill={C.teal} opacity="0.2" />
        <rect x="60" y="153" width="200" height="7" fill={C.teal} opacity="0.2" />
        <rect x="60" y="20" width="7" height="140" fill={C.teal} opacity="0.2" />
        <rect x="253" y="20" width="7" height="140" fill={C.teal} opacity="0.2" />
        <rect x="128" y="70" width="40" height="28" rx="3" fill="rgba(240,242,250,0.12)" stroke="rgba(240,242,250,0.3)" strokeWidth="1.5" transform="rotate(18, 148, 84)" />
        <text x="155" y="112" fontSize="9" fill={C.muted} textAnchor="middle">MacBook Pro 14</text>
        <rect x="66" y="130" width="104" height="18" rx="4" fill="rgba(15,196,184,0.1)" stroke="rgba(15,196,184,0.25)" strokeWidth="1" />
        <text x="118" y="143" fontSize="8" fill={C.teal} textAnchor="middle" fontWeight="700">scale: 1.0 · y: 0.0 (floor)</text>
        <rect x="60" y="170" width="200" height="16" rx="4" fill="rgba(0,0,0,0.2)" stroke={C.border} strokeWidth="1" />
        <text x="160" y="181.5" fontSize="8" fill={C.muted} textAnchor="middle">origin = bottom-centre · no downstream rescaling</text>
      </svg>
    );
  }

  return null;
}

export default function PipelineTrace() {
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const current = PIPELINE_STEPS[step];
  const total = PIPELINE_STEPS.length;

  return (
    <div>
      {/* Step progress bar */}
      <div className="flex gap-1 mb-6" role="list" aria-label="Pipeline steps">
        {PIPELINE_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setStep(i); setExpanded(false); }}
            className="flex-1 h-1 rounded-full transition-all duration-300 focus-ring"
            style={{
              background: i === step ? "#7dd3fc" : i < step ? "rgba(15,196,184,0.3)" : "rgba(255,255,255,0.1)",
            }}
            aria-label={`Step ${s.id}: ${s.title}`}
            aria-current={i === step ? "step" : undefined}
          />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Visual panel */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="aspect-[16/9] flex items-center justify-center p-4">
            <StepVisual visual={current.visual as Visual} />
          </div>
          <div
            className="px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto max-h-28 whitespace-pre" style={{ color: "rgba(240,242,250,0.4)" }}>
              {current.dataOut}
            </pre>
          </div>
        </div>

        {/* Text panel */}
        <div className="flex flex-col">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xs font-bold tracking-widest text-teal mt-0.5 shrink-0">{current.label}</span>
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">{current.title}</h3>
              <p className="text-sm font-medium mt-0.5" style={{ color: "#7dd3fc" }}>{current.subtitle}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(240,242,250,0.55)" }}>
            {current.body}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-left mb-2 transition-colors focus-ring"
            style={{ color: "rgba(15,196,184,0.7)" }}
            aria-expanded={expanded}
          >
            {expanded ? "Hide implementation detail ↑" : "Show implementation detail ↓"}
          </button>

          {expanded && (
            <div
              className="rounded-lg p-3 mb-4 text-xs leading-relaxed"
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(240,242,250,0.72)",
              }}
            >
              {current.technical}
            </div>
          )}

          <div className="flex items-center gap-3 mt-auto pt-4">
            <button
              onClick={() => { setStep(Math.max(0, step - 1)); setExpanded(false); }}
              disabled={step === 0}
              className="btn-primary focus-ring disabled:opacity-25"
            >
              ← Prev
            </button>
            <span className="text-sm flex-1 text-center" style={{ color: "rgba(240,242,250,0.3)" }} aria-live="polite">
              {step + 1} / {total}
            </span>
            <button
              onClick={() => { setStep(Math.min(total - 1, step + 1)); setExpanded(false); }}
              disabled={step === total - 1}
              className="btn-primary focus-ring disabled:opacity-25"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Step grid */}
      <div className="mt-5 grid grid-cols-4 sm:grid-cols-7 gap-1.5" role="list">
        {PIPELINE_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setStep(i); setExpanded(false); }}
            className="text-center px-1 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 focus-ring"
            style={{
              background: i === step ? "rgba(15,196,184,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${i === step ? "rgba(15,196,184,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: i === step ? "#7dd3fc" : "rgba(240,242,250,0.4)",
              transform: i === step ? "translateY(-1px)" : "none",
              boxShadow: i === step ? "0 4px 16px rgba(15,196,184,0.15)" : "none",
            }}
            aria-current={i === step ? "step" : undefined}
          >
            <div className="font-bold">{s.label}</div>
            <div className="hidden sm:block leading-tight mt-0.5 text-[9px] opacity-70">
              {s.title.split(" ").slice(0, 2).join(" ")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
