"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PIPELINE_STEPS } from "@/data/content";

// ── Spinning SF3D canvas — a rotating wireframe cube showing ±1 normalised output ──
function SpinningSF3D({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef  = useRef(0);
  const rafRef    = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    const cx = cw * 0.62, cy = ch * 0.5;
    const S = Math.min(cw, ch) * 0.18; // cube half-size
    const a = angleRef.current;
    const ax = a * 0.4, ay = a;

    // 8 corners of unit cube (±1)
    const raw: [number,number,number][] = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
    ];

    // Rotate around Y then X
    const project = ([x,y,z]: [number,number,number]) => {
      // Y rotation
      const x1 = x * Math.cos(ay) - z * Math.sin(ay);
      const z1 = x * Math.sin(ay) + z * Math.cos(ay);
      // X rotation
      const y2 = y * Math.cos(ax) - z1 * Math.sin(ax);
      const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
      // Simple perspective
      const fov = 4.5;
      const scale = fov / (fov + z2);
      return { px: cx + x1 * S * scale, py: cy + y2 * S * scale, z: z2 };
    };

    const pts = raw.map(project);

    // Edges: cube has 12 edges
    const edges = [
      [0,1],[1,2],[2,3],[3,0], // back face
      [4,5],[5,6],[6,7],[7,4], // front face
      [0,4],[1,5],[2,6],[3,7], // connecting edges
    ];

    // Sort edges by average Z for painter's algorithm
    const edgesWithZ = edges.map(([a,b]) => ({
      a, b, z: (pts[a].z + pts[b].z) / 2
    })).sort((x,y) => y.z - x.z);

    edgesWithZ.forEach(({ a, b, z }) => {
      const alpha = 0.3 + (z + 1) * 0.3; // depth-based opacity
      ctx.beginPath();
      ctx.moveTo(pts[a].px, pts[a].py);
      ctx.lineTo(pts[b].px, pts[b].py);
      ctx.strokeStyle = `rgba(167,139,250,${Math.min(0.9, alpha)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Glowing vertices
    pts.forEach(({ px, py, z }) => {
      const alpha = 0.4 + (z + 1) * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${Math.min(0.95, alpha)})`;
      ctx.fill();
    });

    // Labels on left side
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(167,139,250,0.6)";
    ctx.textAlign = "right";
    ctx.fillText("Stable Fast 3D", cw * 0.38, cy - S * 0.7);
    ctx.font = "9px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(167,139,250,0.4)";
    ctx.fillText("output: ±1 on all axes", cw * 0.38, cy - S * 0.7 + 14);
    ctx.fillText("no metric units", cw * 0.38, cy - S * 0.7 + 26);

    // Axis labels near cube
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(167,139,250,0.75)";
    ctx.textAlign = "center";
    ctx.fillText("±1", cx + S * 1.3, cy);
    ctx.fillText("±1", cx, cy - S * 1.3);
    ctx.fillText("±1", cx - S * 0.7, cy + S * 0.8);
  }, []);

  useEffect(() => {
    if (!active) { draw(); return; }
    const tick = () => {
      angleRef.current += 0.018;
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
      aria-label="SF3D spinning wireframe cube — output normalised to ±1 on all axes"
    />
  );
}

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

function StepVisual({ visual, active }: { visual: Visual; active: boolean }) {
  const W = 320, H = 190;

  if (visual === "lidar") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="LiDAR measurement">
        <rect x="16" y="60" width="44" height="76" rx="7" fill={C.bg} stroke={C.teal} strokeWidth="1.5" />
        <rect x="24" y="68" width="28" height="44" rx="3" fill="rgba(15,196,184,0.08)" />
        <circle cx="38" cy="126" r="4" fill={C.teal} opacity="0.6" />
        {[0,1,2,3,4].map((i) => (
          <line key={i} x1="60" y1={72 + i * 14} x2="160" y2={56 + i * 18}
            stroke={C.teal} strokeWidth="1" strokeDasharray="4 3"
            opacity={active ? (0.3 + i * 0.12) : 0.1}
            style={{ transition: "opacity 0.5s ease" }}
          >
            {active && (
              <animate attributeName="opacity"
                values={`0;${0.3 + i * 0.12};0`}
                dur={`${1.2 + i * 0.2}s`}
                repeatCount="indefinite"
                begin={`${i * 0.15}s`}
              />
            )}
          </line>
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
          <rect key={i} x={86 + i * 7} y={68 - i * 7} width="50" height="38" rx="4"
            fill={i === 0 ? "rgba(15,196,184,0.07)" : C.bg}
            stroke={i === 0 ? C.teal : C.border}
            strokeWidth={i === 0 ? 1.5 : 1}
            opacity={1 - i * 0.25}
          />
        ))}
        <text x="111" y="91" fontSize="9" fill={C.teal} textAnchor="middle" fontWeight="600">JPEG</text>
        <path d="M152 82 H194" stroke={C.orange} strokeWidth="1.5" fill="none" markerEnd="url(#uarr-up)" />
        <text x="173" y="76" fontSize="8" fill={C.orange} textAnchor="middle" fontWeight="600">PUT</text>
        {active && (
          <circle r="4" fill={C.orange} opacity="0.9">
            <animateMotion dur="1.2s" repeatCount="indefinite">
              <mpath href="#pt-upload-path" />
            </animateMotion>
          </circle>
        )}
        <path id="pt-upload-path" d="M152 82 H194" fill="none" stroke="none" />
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
              <>
                <path id={`pt-queue-seg-${i}`} d={`M${item.x + 72} 88 H${item.x + 88}`} stroke={C.muted} strokeWidth="1.5" fill="none" markerEnd="url(#qarr-q)" />
                {active && (
                  <circle r="3.5" fill={C.orange} opacity="0.9">
                    <animateMotion dur="0.8s" repeatCount="indefinite" begin={`${i * 0.27}s`}>
                      <mpath href={`#pt-queue-seg-${i}`} />
                    </animateMotion>
                  </circle>
                )}
              </>
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
    return <SpinningSF3D active={active} />;
  }

  if (visual === "binding") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Scale binding">
        <text x="72" y="30" fontSize="9" fill={C.muted} textAnchor="middle" fontWeight="600">raw SF3D</text>
        <rect x="28" y="42" width="88" height="88" rx="5" fill="rgba(167,139,250,0.07)" stroke={C.purple} strokeWidth="1.5" />
        <text x="72" y="92" fontSize="10" fill={C.purple} textAnchor="middle">1.0 × 1.0</text>
        <text x="72" y="108" fontSize="9" fill={C.muted} textAnchor="middle">dimensionless</text>
        <path id="pt-bind-arrow" d="M122 86 H158" fill="none" stroke={C.teal} strokeWidth="2" markerEnd="url(#barr-b)" />
        <text x="140" y="76" fontSize="8" fill={C.teal} textAnchor="middle" fontWeight="700">bind</text>
        <text x="140" y="88" fontSize="7" fill={C.teal} textAnchor="middle">sx = w / extX</text>
        <text x="140" y="98" fontSize="7" fill={C.teal} textAnchor="middle">sy = h / extY</text>
        {active && (
          <circle r="4" fill={C.teal} opacity="0.9">
            <animateMotion dur="1.1s" repeatCount="indefinite">
              <mpath href="#pt-bind-arrow" />
            </animateMotion>
          </circle>
        )}
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
        <path id="pt-sse-r2-do" d="M82 76 H118" fill="none" stroke={C.orange} strokeWidth="1.5" markerEnd="url(#searr-s)" />
        {active && (
          <circle r="3.5" fill={C.orange} opacity="0.9">
            <animateMotion dur="0.9s" repeatCount="indefinite">
              <mpath href="#pt-sse-r2-do" />
            </animateMotion>
          </circle>
        )}
        <rect x="118" y="52" width="80" height="50" rx="8" fill={C.bg} stroke={C.orange} strokeWidth="1.2" />
        <text x="158" y="74" fontSize="9" fill={C.orange} textAnchor="middle" fontWeight="700">Durable</text>
        <text x="158" y="87" fontSize="9" fill={C.orange} textAnchor="middle" fontWeight="700">Object</text>
        <text x="158" y="97" fontSize="8" fill={C.muted} textAnchor="middle">fan-out</text>
        {[{ y: 44, label: "iPhone" }, { y: 76, label: "Quest" }].map((item, i) => (
          <g key={i}>
            <path id={`pt-sse-fan-${i}`} d={`M198 ${item.y + 33} H238`} stroke={C.muted} strokeWidth="1.2" fill="none" strokeDasharray="4 3" markerEnd="url(#searr2-s)" />
            {active && (
              <circle r="3" fill={C.teal} opacity="0.8">
                <animateMotion dur="1.0s" repeatCount="indefinite" begin={`${i * 0.35}s`}>
                  <mpath href={`#pt-sse-fan-${i}`} />
                </animateMotion>
              </circle>
            )}
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

// Typewriter hook: retypes text whenever `text` changes
function useTypewriter(text: string, speedMs = 18): string {
  const [displayed, setDisplayed] = useState("");
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i > textRef.current.length) {
        clearInterval(id);
        return;
      }
      setDisplayed(textRef.current.slice(0, i));
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);

  return displayed;
}

export default function PipelineTrace() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [expanded, setExpanded] = useState(false);

  const current = PIPELINE_STEPS[step];
  const total = PIPELINE_STEPS.length;

  const typedOutput = useTypewriter(current.dataOut, 14);

  const goTo = (i: number) => {
    setDir(i > step ? 1 : -1);
    setStep(i);
    setExpanded(false);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div>
      {/* Large step circles progress bar */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1" role="list" aria-label="Pipeline steps">
        {PIPELINE_STEPS.map((s, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="flex-shrink-0 focus-ring"
              aria-label={`Step ${s.id}: ${s.title}`}
              aria-current={isActive ? "step" : undefined}
              style={{ outline: "none" }}
            >
              {/* Circle */}
              <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: isActive ? 40 : 32,
                  height: isActive ? 40 : 32,
                  borderRadius: "50%",
                  background: isActive
                    ? "rgba(125,211,252,0.15)"
                    : isDone
                    ? "rgba(125,211,252,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: `2px solid ${isActive ? "#7dd3fc" : isDone ? "rgba(125,211,252,0.4)" : "rgba(255,255,255,0.1)"}`,
                  boxShadow: isActive ? "0 0 16px rgba(125,211,252,0.25)" : "none",
                }}
              >
                {/* Pulsing outer ring for active */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ border: "2px solid rgba(125,211,252,0.35)", animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }}
                  />
                )}
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span
                    style={{
                      fontSize: isActive ? 13 : 11,
                      fontWeight: 700,
                      color: isActive ? "#7dd3fc" : isDone ? "rgba(125,211,252,0.6)" : "rgba(240,242,250,0.35)",
                      lineHeight: 1,
                    }}
                  >
                    {s.id}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Progress line connecting them */}
        <div className="flex-1 hidden sm:block" style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, minWidth: 8 }} />
      </div>

      {/* Smooth top progress bar */}
      <div className="h-0.5 rounded-full mb-5 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "#7dd3fc" }}
          animate={{ width: `${((step + 1) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Visual panel */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="aspect-[16/9] flex items-center justify-center p-4 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <StepVisual visual={current.visual as Visual} active={true} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div
            className="px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <pre
              className="text-[10px] font-mono leading-relaxed overflow-x-auto max-h-28 whitespace-pre"
              style={{ color: "rgba(240,242,250,0.4)" }}
            >
              {typedOutput}
              <span
                style={{ borderRight: "1px solid rgba(125,211,252,0.7)", animation: "blink 1.1s step-end infinite", marginLeft: 1 }}
              />
            </pre>
          </div>
        </div>

        {/* Text panel */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="flex flex-col flex-1"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xs font-bold tracking-widest mt-0.5 shrink-0" style={{ color: "#7dd3fc" }}>{current.label}</span>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{current.title}</h3>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "#7dd3fc" }}>{current.subtitle}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(240,242,250,0.55)" }}>
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-left mb-2 transition-colors focus-ring"
            style={{ color: "rgba(15,196,184,0.7)" }}
            aria-expanded={expanded}
          >
            {expanded ? "Hide implementation detail ↑" : "Show implementation detail ↓"}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-auto pt-4">
            <button
              onClick={() => goTo(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-primary focus-ring disabled:opacity-25"
            >
              ← Prev
            </button>
            <span className="text-sm flex-1 text-center" style={{ color: "rgba(240,242,250,0.3)" }} aria-live="polite">
              {step + 1} / {total}
            </span>
            <button
              onClick={() => goTo(Math.min(total - 1, step + 1))}
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
            onClick={() => goTo(i)}
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

      {/* Global keyframe styles for blink cursor and ping */}
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
