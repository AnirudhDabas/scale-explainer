"use client";

import { useState } from "react";

type NodeId =
  | "iphone" | "quest" | "workers" | "d1r2vec" | "durable"
  | "agent" | "gen" | "fit" | "ingest" | "baseten";

interface NodeDetail {
  title: string;
  role: string;
  tech: string;
  source: string;
}

const NODES: Record<NodeId, NodeDetail> = {
  iphone: {
    title: "iPhone (Expo + Swift)",
    role: "Capture room geometry and objects. Three Swift native modules: RoomPlan room scan, Object Capture photogrammetry, LiDAR object measurement. The phone is its own USDZ-to-GLB converter with no server-side conversion.",
    tech: "Expo Router, Apple RoomPlan, ARKit, Object Capture, QuickLook AR",
    source: "BUILD_DOC.md, Component A",
  },
  quest: {
    title: "Meta Quest (WebXR)",
    role: "The room at 1:1. Loads GLBs by URL, rebuilds room from RoomCapture v1 primitives, physics grab-and-carry, voice hold-to-talk, floating library panel, live Shopify storefront windows.",
    tech: "three.js, @react-three/xr, Rapier physics, ElevenLabs, Vite",
    source: "BUILD_DOC.md, Component D",
  },
  workers: {
    title: "Cloudflare Workers (front door)",
    role: "Every HTTP route under /v1. Rooms, objects, versions, uploads, search, jobs, fit, solve, push, sync, find, listings, ingest, catalog. The only public entry point. Answers committed fixtures on X-Stub:1.",
    tech: "Workers, D1, R2, Vectorize, KV, Queues, Durable Objects, Workflows, Cron Triggers, Browser Rendering",
    source: "BUILD_DOC.md, Component B",
  },
  d1r2vec: {
    title: "D1 + R2 + Vectorize",
    role: "D1 (SQLite): rooms, versions, objects, jobs. R2 (blob store): GLBs, frames, photos served through /v1/assets/{key}. Vectorize: 768-dim SigLIP-2 embeddings, cosine metric, integer-millimetre metadata for fit filtering.",
    tech: "Cloudflare D1, R2, Vectorize (google/siglip2-base-patch16-224)",
    source: ".claude/contracts.md, D1 tables, R2 layout, Vectorize index",
  },
  durable: {
    title: "Durable Object (SSE fan-out)",
    role: "One Durable Object per room. Clients call GET /sync/{roomId} and subscribe. When an object becomes ready or a version is pushed, the Worker triggers the DO, which fans the event to all subscribers. The Quest subscribes on room open and never polls.",
    tech: "Cloudflare Durable Objects, Server-Sent Events",
    source: ".claude/contracts.md, SSE stream",
  },
  agent: {
    title: "designer-agent Worker",
    role: "Translates natural-language intent into an objective function and constraints. Calls the OR-Tools solver and commits a new room Version on success. Never emits coordinates directly.",
    tech: "Cloudflare Workers, OpenAI GPT-4o, Workers AI, Agents SDK",
    source: "BUILD_DOC.md, Component F; services/agent/",
  },
  gen: {
    title: "gen adapter (Docker)",
    role: "Receives bbox_meters from the Workflow. Sends the best frame to SF3D on Baseten. Applies the one scale binding. Returns a bound GLB. GenerateMeshWorkflow refuses raw SF3D output, so the adapter is not optional.",
    tech: "Python, FastAPI, Docker, Baseten SF3D model 3mzlyd6w, trimesh, NumPy",
    source: "docs/SYSTEM_STATE.md, 2D to 3D",
  },
  fit: {
    title: "fit service (Docker)",
    role: "POST /fit validates a layout: clearance corridors (90 cm ADA/AODA), door swing arcs, window occlusion, wall adjacency. POST /solve runs OR-Tools CP-SAT given a language-model-derived objective function.",
    tech: "Python, OR-Tools CP-SAT, Docker",
    source: "BUILD_DOC.md, Component E",
  },
  ingest: {
    title: "ingest service (Docker)",
    role: "Shopify storefront crawler and dimension extractor. Regex pass, LLM pass over body_html, VLM pass over spec images. Unit validation, category priors, aspect-ratio cross-check, confidence scoring.",
    tech: "Python, Browserbase, OpenAI, Docker",
    source: "BUILD_DOC.md, P3; services/ingest/",
  },
  baseten: {
    title: "Baseten (Stable Fast 3D)",
    role: "Single-image to textured 3D mesh in 10-20 s on a warm L4 GPU. Output is normalised to roughly plus-or-minus one on every axis. The gen adapter applies the scale binding before the mesh is accepted by the Worker.",
    tech: "Stability AI SF3D, Baseten deployment qe95lkp, L4:4x16 GPU",
    source: "BUILD_DOC.md, Component C; docs/SYSTEM_STATE.md",
  },
};

const FLOWS: Record<string, { label: string; nodes: NodeId[]; color: string }> = {
  capture: { label: "Capture object",  nodes: ["iphone","workers","d1r2vec","gen","baseten","durable","quest"], color: "#7dd3fc" },
  search:  { label: "Search library",  nodes: ["quest","workers","d1r2vec"],                                    color: "#5b9cf6" },
  arrange: { label: "Arrange room",    nodes: ["quest","agent","fit","workers","durable"],                      color: "#a78bfa" },
  find:    { label: "Find in store",   nodes: ["quest","workers","ingest","gen","baseten"],                     color: "#fb8c42" },
};

// SVG canvas: 960 w × 430 h
// Zone 1 – Devices:       x=10,  w=145
// Zone 2 – Cloudflare:    x=163, w=438
// Zone 3 – Local compute: x=609, w=341, y=10,  h=195
// Zone 4 – External:      x=609, w=341, y=213, h=207
//
// Node positions (all within zones):
// iPhone:     x=18,  y=85,  w=129, h=70  → cx=82,  cy=120, right=147, bottom=155
// Quest:      x=18,  y=265, w=129, h=70  → cx=82,  cy=300, right=147, bottom=335
// Workers:    x=171, y=45,  w=190, h=70  → cx=266, cy=80,  right=361, bottom=115
// D1R2Vec:    x=171, y=190, w=130, h=70  → cx=236, cy=225, right=301, top=190
// Durable:    x=309, y=190, w=130, h=70  → cx=374, cy=225, right=439, top=190
// agent:      x=449, y=45,  w=145, h=70  → cx=521, cy=80,  right=594, left=449
// gen:        x=617, y=18,  w=138, h=75  → cx=686, cy=55,  right=755, bottom=93
// fit:        x=617, y=110, w=138, h=65  → cx=686, cy=142, right=755
// ingest:     x=765, y=18,  w=175, h=75  → cx=852, cy=55
// baseten:    x=617, y=228, w=333, h=105 → cx=783, cy=280

const TEAL   = "#7dd3fc";
const BLUE   = "#5b9cf6";
const ORANGE = "#fb8c42";
const PURPLE = "#a78bfa";
const ARROW  = "rgba(226,232,240,0.3)";

export default function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [activeFlow, setActiveFlow] = useState<string>("capture");

  const flowNodes = new Set(FLOWS[activeFlow]?.nodes ?? []);
  const on  = (id: NodeId) => flowNodes.has(id);
  const dim = (ids: NodeId[]) => ids.some((id) => flowNodes.has(id)) ? 1 : 0.1;
  const flowColor = FLOWS[activeFlow]?.color ?? TEAL;

  const detail = selectedNode ? NODES[selectedNode] : null;

  const click = (id: NodeId) => setSelectedNode(selectedNode === id ? null : id);

  return (
    <div>
      {/* Flow tabs */}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Highlight a data flow">
        {Object.entries(FLOWS).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActiveFlow(key)}
            className="btn focus-ring text-xs"
            style={activeFlow === key ? {
              borderColor: `${f.color}55`,
              background: `${f.color}12`,
              color: f.color,
            } : {}}
            aria-pressed={activeFlow === key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Diagram — horizontal scroll on narrow screens */}
      <div className="overflow-x-auto rounded-xl" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ minWidth: 680 }}>
          <svg
            viewBox="0 0 960 430"
            width="100%"
            style={{ display: "block", minWidth: 680 }}
            aria-label="Scale system architecture diagram"
            role="img"
          >
            {/* ── Marker defs ── */}
            <defs>
              <marker id="m-teal"   viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={TEAL}   /></marker>
              <marker id="m-orange" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={ORANGE} /></marker>
              <marker id="m-blue"   viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={BLUE}   /></marker>
              <marker id="m-purple" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={PURPLE} /></marker>
              <marker id="m-arrow"  viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={ARROW}  /></marker>
            </defs>

            {/* ── Zone backgrounds ── */}
            <rect x="10"  y="10" width="145" height="410" rx="10" fill="rgba(15,196,184,0.03)"  stroke="rgba(15,196,184,0.1)"  strokeWidth="1" />
            <rect x="163" y="10" width="438" height="410" rx="10" fill="rgba(251,140,66,0.03)"  stroke="rgba(251,140,66,0.1)"  strokeWidth="1" />
            <rect x="609" y="10" width="341" height="195" rx="10" fill="rgba(91,156,246,0.03)"  stroke="rgba(91,156,246,0.1)"  strokeWidth="1" />
            <rect x="609" y="213" width="341" height="207" rx="10" fill="rgba(167,139,250,0.04)" stroke="rgba(167,139,250,0.1)" strokeWidth="1" />

            {/* Zone labels */}
            <text x="82"  y="28" fontSize="8" fill={TEAL}   fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="0.6">DEVICES</text>
            <text x="382" y="28" fontSize="8" fill={ORANGE} fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="0.6">CLOUDFLARE</text>
            <text x="779" y="28" fontSize="8" fill={BLUE}   fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="0.6">LOCAL COMPUTE (DOCKER)</text>
            <text x="779" y="228" fontSize="8" fill={PURPLE} fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="0.6">EXTERNAL</text>

            {/* ── Connection lines ── */}
            {/* iPhone → Workers */}
            <path d="M147 120 H171" stroke={TEAL}   strokeWidth="2"   fill="none" markerEnd="url(#m-teal)"   opacity={dim(["iphone","workers"])} />
            {/* Workers ← Durable ← Quest (SSE back-path) */}
            <path d="M171 305 H155 V300 H147" stroke={ARROW} strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerEnd="url(#m-arrow)" opacity={dim(["durable","quest"])} />
            {/* Quest → Workers */}
            <path d="M147 300 H163 V120 H171" stroke={TEAL}   strokeWidth="1.5" fill="none" markerEnd="url(#m-teal)"   opacity={dim(["quest","workers"])} />
            {/* Workers → D1/R2/Vec */}
            <path d="M240 115 V190" stroke={ORANGE} strokeWidth="1.5" fill="none" markerEnd="url(#m-orange)" opacity={dim(["workers","d1r2vec"])} />
            {/* Workers → Durable */}
            <path d="M340 115 V190" stroke={ORANGE} strokeWidth="1.5" fill="none" markerEnd="url(#m-orange)" opacity={dim(["workers","durable"])} />
            {/* Workers → designer-agent */}
            <path d="M361 80 H449" stroke={ORANGE} strokeWidth="1.5" fill="none" markerEnd="url(#m-orange)" opacity={dim(["workers","agent"])} />
            {/* Cloudflare → gen/fit/ingest via tunnel */}
            <path d="M594 70 H617" stroke={BLUE}   strokeWidth="2"   fill="none" markerEnd="url(#m-blue)"   opacity={dim(["workers","gen","ingest"])} />
            <path d="M594 90 H617" stroke={BLUE}   strokeWidth="1.5" fill="none" markerEnd="url(#m-blue)"   opacity={dim(["agent","fit"])} />
            <text x="605" y="62" fontSize="7" fill={BLUE} textAnchor="middle" fontWeight="600" opacity={dim(["workers","gen","ingest"])}>TUNNEL</text>
            {/* gen → baseten */}
            <path d="M686 93 V228" stroke={PURPLE} strokeWidth="1.5" fill="none" strokeDasharray="5 3" markerEnd="url(#m-purple)" opacity={dim(["gen","baseten"])} />

            {/* ── Nodes ── */}
            <N x={18}  y={85}  w={129} h={70}  label="iPhone"         sub1="Expo"           sub2="Swift modules"       acc={TEAL}   sel={selectedNode==="iphone"}   act={on("iphone")}   click={() => click("iphone")} />
            <N x={18}  y={265} w={129} h={70}  label="Meta Quest"     sub1="WebXR"          sub2="three.js + Rapier"   acc={TEAL}   sel={selectedNode==="quest"}    act={on("quest")}    click={() => click("quest")} />
            <N x={171} y={45}  w={190} h={70}  label="Workers"        sub1="front door"     sub2="every /v1 route"     acc={ORANGE} sel={selectedNode==="workers"}  act={on("workers")}  click={() => click("workers")} />
            <N x={171} y={190} w={130} h={70}  label="D1 · R2 · Vec"  sub1="rows"           sub2="blobs · vectors"     acc={ORANGE} sel={selectedNode==="d1r2vec"} act={on("d1r2vec")}  click={() => click("d1r2vec")} />
            <N x={309} y={190} w={130} h={70}  label="Durable Object" sub1="SSE"            sub2="fan-out"             acc={ORANGE} sel={selectedNode==="durable"}  act={on("durable")}  click={() => click("durable")} />
            <N x={449} y={45}  w={145} h={70}  label="designer-agent" sub1="Worker"         sub2="intents → constraints" acc={ORANGE} sel={selectedNode==="agent"} act={on("agent")}    click={() => click("agent")} />
            <N x={617} y={18}  w={138} h={75}  label="gen adapter"    sub1="Docker"         sub2="scale binding"       acc={BLUE}   sel={selectedNode==="gen"}      act={on("gen")}      click={() => click("gen")} />
            <N x={617} y={110} w={138} h={65}  label="fit service"    sub1="Docker"         sub2="OR-Tools CP-SAT"     acc={BLUE}   sel={selectedNode==="fit"}      act={on("fit")}      click={() => click("fit")} />
            <N x={765} y={18}  w={175} h={75}  label="ingest service" sub1="Docker"         sub2="Browserbase + LLM"   acc={BLUE}   sel={selectedNode==="ingest"}   act={on("ingest")}   click={() => click("ingest")} />
            <N x={617} y={228} w={333} h={105} label="Baseten"        sub1="Stable Fast 3D" sub2="L4:4×16 GPU"         acc={PURPLE} sel={selectedNode==="baseten"}  act={on("baseten")}  click={() => click("baseten")} />
          </svg>
        </div>
      </div>
      <p className="text-center mt-2" style={{ fontSize: 11, color: "rgba(240,244,255,0.2)" }}>
        Select any component for details · scroll right on narrow screens
      </p>

      {/* ── Detail panel ── */}
      {detail && (
        <div className="mt-4 p-4 sm:p-5 rounded-xl relative" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${flowColor}28` }}>
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg focus-ring transition-colors text-lg"
            style={{ color: "rgba(240,244,255,0.62)", background: "rgba(255,255,255,0.05)" }}
            aria-label="Close"
          >
            ×
          </button>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: flowColor }}>Component</p>
          <h3 className="text-base font-bold mb-2" style={{ color: "#f0f4ff" }}>{detail.title}</h3>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(240,244,255,0.5)" }}>{detail.role}</p>
          <div className="text-xs space-y-1.5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(240,244,255,0.62)" }}><span className="font-semibold" style={{ color: "rgba(240,244,255,0.5)" }}>Tech:</span> {detail.tech}</p>
            <p style={{ color: "rgba(240,244,255,0.50)" }}><span className="font-semibold" style={{ color: "rgba(240,244,255,0.62)" }}>Source:</span> {detail.source}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Single node rendered as an SVG group */
function N({
  x, y, w, h, label, sub1, sub2, acc, sel, act, click,
}: {
  x: number; y: number; w: number; h: number;
  label: string; sub1: string; sub2: string;
  acc: string; sel: boolean; act: boolean;
  click: () => void;
}) {
  const mid = x + w / 2;
  return (
    <g
      onClick={click}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && click()}
      tabIndex={0}
      role="button"
      aria-pressed={sel}
      aria-label={`${label}: click for details`}
      style={{ cursor: "pointer", opacity: act ? 1 : 0.13, transition: "opacity 0.22s ease" }}
    >
      {/* Border glow when selected */}
      {sel && <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx={11} fill="none" stroke={acc} strokeWidth="1.5" opacity="0.5" />}
      {/* Box */}
      <rect
        x={x} y={y} width={w} height={h} rx={10}
        fill="rgba(255,255,255,0.04)"
        stroke={sel ? acc : "rgba(255,255,255,0.1)"}
        strokeWidth={sel ? 1.5 : 1}
      />
      {/* Accent top bar when selected */}
      {sel && <rect x={x + 1} y={y + 1} width={w - 2} height={3} rx={4} fill={acc} opacity="0.7" />}
      {/* Label */}
      <text x={mid} y={y + 28} fontSize="12" fill={sel ? acc : "rgba(240,244,255,0.85)"} fontWeight="700" textAnchor="middle">{label}</text>
      {/* Sub line 1 */}
      <text x={mid} y={y + 44} fontSize="9" fill="rgba(240,244,255,0.62)" textAnchor="middle">{sub1}</text>
      {/* Sub line 2 — only if node is tall enough */}
      {h >= 70 && (
        <text x={mid} y={y + 57} fontSize="9" fill="rgba(240,244,255,0.50)" textAnchor="middle">{sub2}</text>
      )}
    </g>
  );
}
