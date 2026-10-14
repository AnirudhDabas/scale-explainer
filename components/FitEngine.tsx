"use client";

import { useState } from "react";

const ROOM_W = 4.0;
const ROOM_L = 3.5;
const DOOR_X = 1.0;
const DOOR_W = 0.9;
const DOOR_SWING = 0.9;
const SOFA_W = 1.8;
const SOFA_D = 0.9;

export default function FitEngine() {
  const [sofaX, setSofaX] = useState(1.0);
  const [showSolver, setShowSolver] = useState(false);

  const sofaMinX = sofaX;
  const sofaMaxX = sofaX + SOFA_W;
  const sofaMinZ = ROOM_L - SOFA_D;

  const hingeX = DOOR_X;
  const hingeZ = ROOM_L;

  const corners = [
    [sofaMinX, sofaMinZ],
    [sofaMaxX, sofaMinZ],
    [sofaMinX, ROOM_L],
    [sofaMaxX, ROOM_L],
  ];
  const arcOverlap = corners.some(([cx, cz]) => {
    const dx = cx - hingeX;
    const dz = cz - hingeZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < DOOR_SWING && cx > hingeX && cz > hingeZ - DOOR_SWING;
  });

  const overlapAmt = arcOverlap
    ? Math.max(
        0,
        DOOR_SWING -
          Math.min(
            ...corners.map(([cx, cz]) =>
              Math.sqrt((cx - hingeX) ** 2 + (cz - hingeZ) ** 2)
            )
          )
      ).toFixed(2)
    : "0.00";

  const SVG_W = 340, SVG_H = 300;
  const PAD = 22;
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

  const violationColor = "#f87171";
  const okColor = "#7dd3fc";

  return (
    <div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(226,232,240,0.5)" }}>
        The fit engine checks clearance corridors (90 cm minimum, per ADA/AODA guidance) and door
        swing arcs before anything else. Drag the sofa toward the door to trigger a violation.
        The violation geometry is returned in{" "}
        <code className="text-xs font-mono text-teal/70">FitReport v1</code> and drawn in the headset.
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
            <span className="text-xs font-semibold" style={{ color: "rgba(226,232,240,0.62)" }}>
              Top-down view · room-demo fixture · {ROOM_W} x {ROOM_L} m
            </span>
          </div>
          <div className="p-4">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full"
              role="img"
              aria-label={`Room layout: sofa at x=${sofaX.toFixed(2)} m. ${arcOverlap ? "Door swing blocked." : "Clearance OK."}`}
            >
              {/* Room floor */}
              <rect
                x={PAD} y={PAD}
                width={SVG_W - 2 * PAD} height={SVG_H - 2 * PAD}
                fill="rgba(15,196,184,0.04)"
                stroke="rgba(15,196,184,0.25)"
                strokeWidth="1.5"
              />

              {/* Door opening */}
              <rect
                x={m2x(DOOR_X)} y={SVG_H - PAD - 2}
                width={DOOR_W * scaleX} height={8}
                fill="#06090f"
              />
              <line x1={m2x(DOOR_X)} y1={SVG_H - PAD} x2={m2x(DOOR_X)} y2={SVG_H - PAD + 6}
                stroke="rgba(226,232,240,0.3)" strokeWidth="1.5" />
              <line x1={m2x(DOOR_X + DOOR_W)} y1={SVG_H - PAD} x2={m2x(DOOR_X + DOOR_W)} y2={SVG_H - PAD + 6}
                stroke="rgba(226,232,240,0.3)" strokeWidth="1.5" />

              {/* Door swing arc */}
              <path
                d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY} L ${arcCx} ${arcCy} Z`}
                fill={arcOverlap ? "rgba(248,113,113,0.12)" : "rgba(15,196,184,0.06)"}
                stroke={arcOverlap ? violationColor : okColor}
                strokeWidth="1.5"
                strokeDasharray={arcOverlap ? "none" : "5 3"}
                style={{ transition: "fill 0.3s ease, stroke 0.3s ease" }}
              />

              {/* Sofa */}
              <rect
                x={m2x(sofaX)}
                y={m2z(ROOM_L - SOFA_D)}
                width={SOFA_W * scaleX}
                height={SOFA_D * scaleZ}
                rx="5"
                fill={arcOverlap ? "rgba(248,113,113,0.12)" : "rgba(226,232,240,0.35)"}
                stroke={arcOverlap ? violationColor : "rgba(226,232,240,0.62)"}
                strokeWidth={arcOverlap ? 2 : 1.5}
                style={{ transition: "all 0.25s ease" }}
              />
              <text
                x={m2x(sofaX + SOFA_W / 2)}
                y={m2z(ROOM_L - SOFA_D / 2) + 4}
                fontSize="10"
                fill={arcOverlap ? violationColor : "rgba(226,232,240,0.6)"}
                textAnchor="middle"
                fontWeight="600"
                style={{ transition: "fill 0.25s ease" }}
              >
                sofa
              </text>

              {arcOverlap && (
                <text
                  x={m2x(DOOR_X + DOOR_SWING + 0.15)}
                  y={m2z(ROOM_L - 0.5)}
                  fontSize="14"
                  fill={violationColor}
                  fontWeight="700"
                >
                  !
                </text>
              )}

              {/* Labels */}
              <text x={m2x(ROOM_W / 2)} y={SVG_H - 4} fontSize="9" fill="rgba(226,232,240,0.3)" textAnchor="middle">
                {ROOM_W} m
              </text>
              <text
                x={PAD - 5} y={SVG_H / 2}
                fontSize="9" fill="rgba(226,232,240,0.3)" textAnchor="middle"
                transform={`rotate(-90, ${PAD - 5}, ${SVG_H / 2})`}
              >
                {ROOM_L} m
              </text>
            </svg>

            {/* Slider */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(226,232,240,0.72)" }}>
                <label htmlFor="sofa-slider" className="font-medium">Sofa position (x)</label>
                <span className="font-mono font-bold text-white/60">{sofaX.toFixed(2)} m from left wall</span>
              </div>
              <input
                id="sofa-slider"
                type="range"
                min={0}
                max={ROOM_W - SOFA_W}
                step={0.02}
                value={sofaX}
                onChange={(e) => setSofaX(parseFloat(e.target.value))}
                className="w-full"
                aria-label={`Sofa x position: ${sofaX.toFixed(2)} metres`}
              />
            </div>
          </div>
        </div>

        {/* Violation panel */}
        <div className="flex flex-col gap-4">
          {/* Status */}
          <div
            className="rounded-xl p-4 transition-all duration-300"
            style={{
              background: arcOverlap ? "rgba(248,113,113,0.08)" : "rgba(15,196,184,0.06)",
              border: `1px solid ${arcOverlap ? "rgba(248,113,113,0.25)" : "rgba(15,196,184,0.2)"}`,
            }}
          >
            <div
              className="text-sm font-bold mb-1.5 transition-colors duration-300"
              style={{ color: arcOverlap ? violationColor : okColor }}
            >
              {arcOverlap ? "Violation: door_swing (block)" : "No violations"}
            </div>
            <p className="text-xs leading-relaxed transition-colors duration-300" style={{ color: arcOverlap ? "rgba(248,113,113,0.7)" : "rgba(15,196,184,0.6)" }}>
              {arcOverlap
                ? `Sofa blocks the door swing arc by ${overlapAmt} m. Move it away from the door or choose a narrower piece.`
                : "Clearance corridors and door swing arc are clear. Drag the sofa toward the door to trigger a violation."}
            </p>
          </div>

          {/* FitReport JSON */}
          <div
            className="rounded-xl p-4 flex-1"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold text-white/60 mb-2">FitReport v1 (live)</p>
            <pre
              className="text-[10px] font-mono leading-relaxed overflow-x-auto max-h-48 whitespace-pre"
              style={{ color: "rgba(226,232,240,0.4)" }}
            >
{`{
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
}`}
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
            {showSolver && (
              <div className="mt-3 text-xs leading-relaxed space-y-2" style={{ color: "rgba(226,232,240,0.4)" }}>
                <p>
                  <code className="text-white/60">POST /solve</code> takes an intent string and
                  optional budget. The designer-agent translates it into an objective function
                  and constraints. <strong className="text-white/50">It never emits coordinates.</strong>{" "}
                  OR-Tools CP-SAT discretises the floor to a grid and places objects.
                </p>
                <p>
                  If infeasible, <code className="text-white/60">answer</code> says so explicitly:
                  &ldquo;There is no arrangement of these three pieces that keeps a 90 cm walkway
                  to the door; drop the ottoman, or go 20 cm narrower on the couch.&rdquo;
                </p>
                <p className="text-[10px] pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.50)" }}>
                  Source: BUILD_DOC.md, Component E; .claude/contracts.md, POST /solve
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
