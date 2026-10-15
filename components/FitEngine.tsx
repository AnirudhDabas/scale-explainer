"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useSpring } from "framer-motion";

const ROOM_W = 4.0;
const ROOM_L = 3.5;
const DOOR_X = 1.0;
const DOOR_W = 0.9;
const DOOR_SWING = 0.9;
const SOFA_W = 1.8;
const SOFA_D = 0.9;

// Typewriter hook
function useTypewriter(text: string, speedMs = 16): string {
  const [displayed, setDisplayed] = useState("");
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i > textRef.current.length) { clearInterval(id); return; }
      setDisplayed(textRef.current.slice(0, i));
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);
  return displayed;
}

export default function FitEngine() {
  const [sofaXTarget, setSofaXTarget] = useState(1.0);
  const [showSolver, setShowSolver] = useState(false);
  const [prevViolation, setPrevViolation] = useState(false);
  const [collisionFlash, setCollisionFlash] = useState(false);

  // Spring-based sofa X position
  const springX = useSpring(sofaXTarget, { stiffness: 200, damping: 25 });
  const [sofaX, setSofaXDisplay] = useState(1.0);

  useEffect(() => {
    springX.set(sofaXTarget);
    const unsub = springX.on("change", (v) => setSofaXDisplay(v));
    return unsub;
  }, [sofaXTarget, springX]);

  const sofaMinX = sofaX;
  const sofaMaxX = sofaX + SOFA_W;
  const sofaMinZ = ROOM_L - SOFA_D;
  const hingeX = DOOR_X;
  const hingeZ = ROOM_L;

  const corners: [number, number][] = [
    [sofaMinX, sofaMinZ], [sofaMaxX, sofaMinZ],
    [sofaMinX, ROOM_L],   [sofaMaxX, ROOM_L],
  ];
  const arcOverlap = corners.some(([cx, cz]) => {
    const dx = cx - hingeX;
    const dz = cz - hingeZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < DOOR_SWING && cx > hingeX && cz > hingeZ - DOOR_SWING;
  });

  const overlapAmt = arcOverlap
    ? Math.max(0, DOOR_SWING - Math.min(...corners.map(([cx, cz]) =>
        Math.sqrt((cx - hingeX) ** 2 + (cz - hingeZ) ** 2)
      ))).toFixed(2)
    : "0.00";

  // Detect new violation rising edge
  useEffect(() => {
    if (arcOverlap && !prevViolation) {
      setCollisionFlash(true);
      setTimeout(() => setCollisionFlash(false), 1400);
    }
    setPrevViolation(arcOverlap);
  }, [arcOverlap]);

  const SVG_W = 340, SVG_H = 300;
  const PAD = 32;
  const scaleX = (SVG_W - 2 * PAD) / ROOM_W;
  const scaleZ = (SVG_H - 2 * PAD) / ROOM_L;
  const m2x = (m: number) => PAD + m * scaleX;
  const m2z = (m: number) => PAD + m * scaleZ;

  const arcR = DOOR_SWING * scaleX;
  const arcCx = m2x(hingeX);
  const arcCy = m2z(hingeZ);
  const arcStartX = m2x(hingeX);
  const arcStartY = m2z(hingeZ - DOOR_SWING);
  const arcEndX = m2x(hingeX + DOOR_SWING);
  const arcEndY = m2z(hingeZ);

  // Arc draw-in animation
  const arcPathRef = useRef<SVGPathElement>(null);
  const arcAnimated = useRef(false);
  useEffect(() => {
    if (arcPathRef.current && !arcAnimated.current) {
      arcAnimated.current = true;
      const len = arcPathRef.current.getTotalLength();
      arcPathRef.current.style.strokeDasharray = `${len}`;
      arcPathRef.current.style.strokeDashoffset = `${len}`;
      arcPathRef.current.style.transition = "stroke-dashoffset 0.8s ease-out";
      requestAnimationFrame(() => {
        if (arcPathRef.current) {
          arcPathRef.current.style.strokeDashoffset = "0";
        }
      });
    }
  }, []);

  const violationColor = "#f87171";
  const okColor = "#7dd3fc";

  // Collision point (near door hinge corner)
  const collisionSvgX = m2x(hingeX + 0.15);
  const collisionSvgY = m2z(ROOM_L - 0.35);

  const fitJson = `{
  "ok": ${!arcOverlap},
  "violations": [${arcOverlap ? `
    {
      "kind": "door_swing",
      "severity": "block",
      "detailMeters": ${overlapAmt},
      "message": "blocks the door swing",
      "geometry": {
        "type": "arc",
        "center": [${DOOR_X}, ${ROOM_L.toFixed(1)}],
        "radiusM": ${DOOR_SWING},
        "startDeg": 0,
        "endDeg": 90
      }
    }` : ""}
  ]
}`;

  const typedJson = useTypewriter(fitJson, 12);

  return (
    <div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,242,250,0.5)" }}>
        The fit engine checks clearance corridors (90 cm minimum, per ADA/AODA guidance) and door
        swing arcs before anything else. Drag the sofa toward the door to trigger a violation.
        The violation geometry is returned in{" "}
        <code className="text-xs font-mono" style={{ color: "rgba(125,211,252,0.7)" }}>FitReport v1</code> and drawn in the headset.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Room diagram */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="px-4 pt-3 pb-1"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "rgba(240,242,250,0.62)" }}>
              Top-down view · room-demo fixture · {ROOM_W} × {ROOM_L} m
            </span>
          </div>
          <div className="p-4">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full"
              role="img"
              aria-label={`Room layout: sofa at x=${sofaXTarget.toFixed(2)} m. ${arcOverlap ? "Door swing blocked." : "Clearance OK."}`}
            >
              <defs>
                <pattern id="floor-grid" x={PAD} y={PAD} width={scaleX * 1} height={scaleZ * 1} patternUnits="userSpaceOnUse">
                  <path d={`M ${scaleX * 1} 0 L 0 0 0 ${scaleZ * 1}`} fill="none" stroke="rgba(125,211,252,0.07)" strokeWidth="0.5"/>
                </pattern>
              </defs>

              {/* Room floor with grid */}
              <rect
                x={PAD} y={PAD}
                width={SVG_W - 2 * PAD} height={SVG_H - 2 * PAD}
                fill="rgba(15,196,184,0.03)"
              />
              <rect
                x={PAD} y={PAD}
                width={SVG_W - 2 * PAD} height={SVG_H - 2 * PAD}
                fill="url(#floor-grid)"
              />
              {/* Wall outline */}
              <rect
                x={PAD} y={PAD}
                width={SVG_W - 2 * PAD} height={SVG_H - 2 * PAD}
                fill="none"
                stroke="rgba(125,211,252,0.3)"
                strokeWidth="2"
              />
              {/* Corner markers */}
              {[[PAD,PAD],[SVG_W-PAD,PAD],[PAD,SVG_H-PAD],[SVG_W-PAD,SVG_H-PAD]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="rgba(125,211,252,0.4)" />
              ))}

              {/* Measurement annotations — wall tick marks */}
              {/* Width annotation (bottom) */}
              <line x1={m2x(0)} y1={SVG_H - PAD + 12} x2={m2x(ROOM_W)} y2={SVG_H - PAD + 12} stroke="rgba(240,242,250,0.2)" strokeWidth="1" />
              <line x1={m2x(0)} y1={SVG_H - PAD + 8} x2={m2x(0)} y2={SVG_H - PAD + 16} stroke="rgba(240,242,250,0.2)" strokeWidth="1" />
              <line x1={m2x(ROOM_W)} y1={SVG_H - PAD + 8} x2={m2x(ROOM_W)} y2={SVG_H - PAD + 16} stroke="rgba(240,242,250,0.2)" strokeWidth="1" />
              <text x={m2x(ROOM_W / 2)} y={SVG_H - PAD + 24} fontSize="9" fill="rgba(240,242,250,0.32)" textAnchor="middle" fontWeight="500">{ROOM_W.toFixed(1)} m</text>

              {/* Depth annotation (left) */}
              <line x1={PAD - 12} y1={m2z(0)} x2={PAD - 12} y2={m2z(ROOM_L)} stroke="rgba(240,242,250,0.2)" strokeWidth="1" />
              <line x1={PAD - 16} y1={m2z(0)} x2={PAD - 8} y2={m2z(0)} stroke="rgba(240,242,250,0.2)" strokeWidth="1" />
              <line x1={PAD - 16} y1={m2z(ROOM_L)} x2={PAD - 8} y2={m2z(ROOM_L)} stroke="rgba(240,242,250,0.2)" strokeWidth="1" />
              <text
                x={PAD - 20} y={m2z(ROOM_L / 2)}
                fontSize="9" fill="rgba(240,242,250,0.32)" textAnchor="middle"
                transform={`rotate(-90, ${PAD - 20}, ${m2z(ROOM_L / 2)})`}
                fontWeight="500"
              >{ROOM_L.toFixed(1)} m</text>

              {/* Door opening */}
              <rect
                x={m2x(DOOR_X)} y={SVG_H - PAD - 2}
                width={DOOR_W * scaleX} height={8}
                fill="#07090f"
              />
              <line x1={m2x(DOOR_X)} y1={SVG_H - PAD} x2={m2x(DOOR_X)} y2={SVG_H - PAD + 6}
                stroke="rgba(240,242,250,0.3)" strokeWidth="1.5" />
              <line x1={m2x(DOOR_X + DOOR_W)} y1={SVG_H - PAD} x2={m2x(DOOR_X + DOOR_W)} y2={SVG_H - PAD + 6}
                stroke="rgba(240,242,250,0.3)" strokeWidth="1.5" />

              {/* Door swing arc — draws in on mount */}
              <path
                ref={arcPathRef}
                d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY} L ${arcCx} ${arcCy} Z`}
                fill={arcOverlap ? "rgba(248,113,113,0.12)" : "rgba(15,196,184,0.06)"}
                stroke={arcOverlap ? violationColor : okColor}
                strokeWidth="1.5"
                style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
              />

              {/* Collision pulse ring — AnimatePresence in SVG coordinates */}
              <AnimatePresence>
                {collisionFlash && (
                  <>
                    <motion.circle
                      key="flash1"
                      cx={collisionSvgX}
                      cy={collisionSvgY}
                      r={8}
                      fill="none"
                      stroke={violationColor}
                      strokeWidth="2"
                      initial={{ r: 6, opacity: 0.9 }}
                      animate={{ r: 32, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                    <motion.circle
                      key="flash2"
                      cx={collisionSvgX}
                      cy={collisionSvgY}
                      r={8}
                      fill="none"
                      stroke={violationColor}
                      strokeWidth="1.5"
                      initial={{ r: 6, opacity: 0.7 }}
                      animate={{ r: 22, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.65, ease: "easeOut", delay: 0.15 }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Sofa — position driven by spring value, drawn as proper furniture */}
              {(() => {
                const sx0 = m2x(sofaX);
                const sy0 = m2z(ROOM_L - SOFA_D);
                const sw  = SOFA_W * scaleX;
                const sh  = SOFA_D * scaleZ;
                const col = arcOverlap ? violationColor : okColor;
                const fillBase = arcOverlap ? "rgba(248,113,113,0.08)" : "rgba(125,211,252,0.06)";
                const armW = sw * 0.09;
                const backH = sh * 0.28;
                return (
                  <g style={{ transition: "opacity 0.2s ease" }}>
                    {/* Sofa body */}
                    <rect x={sx0} y={sy0} width={sw} height={sh} rx="5"
                      fill={fillBase} stroke={col} strokeWidth="1.5"
                      style={{ transition: "fill 0.25s, stroke 0.25s" }} />
                    {/* Back cushion */}
                    <rect x={sx0 + armW} y={sy0} width={sw - armW * 2} height={backH} rx="3"
                      fill={arcOverlap ? "rgba(248,113,113,0.12)" : "rgba(125,211,252,0.08)"}
                      stroke={col} strokeWidth="0.8" opacity="0.8" />
                    {/* Seat cushions — 3 equal sections */}
                    {[0,1,2].map(i => (
                      <rect key={i}
                        x={sx0 + armW + (sw - armW * 2) * i / 3 + 2}
                        y={sy0 + backH + 3}
                        width={(sw - armW * 2) / 3 - 4}
                        height={sh - backH - 6}
                        rx="3"
                        fill={arcOverlap ? "rgba(248,113,113,0.1)" : "rgba(125,211,252,0.06)"}
                        stroke={col} strokeWidth="0.6" opacity="0.7"
                      />
                    ))}
                    {/* Arms */}
                    {[sx0, sx0 + sw - armW].map((ax, i) => (
                      <rect key={i} x={ax} y={sy0} width={armW} height={sh} rx="3"
                        fill={arcOverlap ? "rgba(248,113,113,0.14)" : "rgba(125,211,252,0.1)"}
                        stroke={col} strokeWidth="0.8" opacity="0.9" />
                    ))}
                    {/* Label */}
                    <text x={sx0 + sw / 2} y={sy0 + sh / 2 + 4}
                      fontSize="9" fill={col} textAnchor="middle" fontWeight="600" opacity="0.7">
                      sofa
                    </text>
                  </g>
                );
              })()}

              {arcOverlap && (
                <text
                  x={m2x(DOOR_X + DOOR_SWING + 0.2)}
                  y={m2z(ROOM_L - 0.6)}
                  fontSize="11"
                  fill={violationColor}
                  fontWeight="700"
                >
                  ✕ blocked
                </text>
              )}
            </svg>

            {/* Slider */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(240,242,250,0.72)" }}>
                <label htmlFor="sofa-slider" className="font-medium">Sofa position (x)</label>
                <span className="font-mono font-bold" style={{ color: "rgba(240,242,250,0.6)" }}>{sofaXTarget.toFixed(2)} m from left wall</span>
              </div>
              <input
                id="sofa-slider"
                type="range"
                min={0}
                max={ROOM_W - SOFA_W}
                step={0.02}
                value={sofaXTarget}
                onChange={(e) => setSofaXTarget(parseFloat(e.target.value))}
                className="w-full"
                aria-label={`Sofa x position: ${sofaXTarget.toFixed(2)} metres`}
              />
            </div>
          </div>
        </div>

        {/* Violation panel */}
        <div className="flex flex-col gap-4">
          {/* Status banner with AnimatePresence slide */}
          <AnimatePresence mode="wait">
            <motion.div
              key={arcOverlap ? "violation" : "ok"}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="rounded-xl p-4"
              style={{
                background: arcOverlap ? "rgba(248,113,113,0.08)" : "rgba(15,196,184,0.06)",
                border: `1px solid ${arcOverlap ? "rgba(248,113,113,0.25)" : "rgba(15,196,184,0.2)"}`,
              }}
            >
              <div
                className="text-sm font-bold mb-1.5"
                style={{ color: arcOverlap ? violationColor : okColor }}
              >
                {arcOverlap ? "Violation: door_swing (block)" : "No violations"}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: arcOverlap ? "rgba(248,113,113,0.7)" : "rgba(15,196,184,0.6)" }}>
                {arcOverlap
                  ? `Sofa blocks the door swing arc by ${overlapAmt} m. Move it away from the door or choose a narrower piece.`
                  : "Clearance corridors and door swing arc are clear. Drag the sofa toward the door to trigger a violation."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* FitReport JSON with typewriter */}
          <div
            className="rounded-xl p-4 flex-1"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "rgba(240,242,250,0.6)" }}>FitReport v1 (live)</p>
            <pre
              className="text-[10px] font-mono leading-relaxed overflow-x-auto max-h-48 whitespace-pre"
              style={{ color: "rgba(240,242,250,0.4)" }}
            >
              {typedJson}
              <span style={{ borderRight: "1px solid rgba(125,211,252,0.6)", animation: "blink 1.1s step-end infinite", marginLeft: 1 }} />
            </pre>
          </div>

          {/* Solver */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => setShowSolver(!showSolver)}
              className="text-xs font-semibold transition-colors focus-ring w-full text-left"
              style={{ color: "rgba(15,196,184,0.7)" }}
              aria-expanded={showSolver}
            >
              {showSolver ? "Hide solver (POST /solve) ↑" : "Show solver (POST /solve) ↓"}
            </button>
            <AnimatePresence>
              {showSolver && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="mt-3 text-xs leading-relaxed space-y-2" style={{ color: "rgba(240,242,250,0.4)" }}>
                    <p>
                      <code style={{ color: "rgba(240,242,250,0.6)" }}>POST /solve</code> takes an intent string and
                      optional budget. The designer-agent translates it into an objective function
                      and constraints. <strong style={{ color: "rgba(240,242,250,0.5)" }}>It never emits coordinates.</strong>{" "}
                      OR-Tools CP-SAT discretises the floor to a grid and places objects.
                    </p>
                    <p>
                      If infeasible, <code style={{ color: "rgba(240,242,250,0.6)" }}>answer</code> says so explicitly:
                      &ldquo;There is no arrangement of these three pieces that keeps a 90 cm walkway
                      to the door; drop the ottoman, or go 20 cm narrower on the couch.&rdquo;
                    </p>
                    <p className="text-[10px] pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,242,250,0.50)" }}>
                      Source: BUILD_DOC.md, Component E; .claude/contracts.md, POST /solve
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
