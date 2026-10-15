"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

interface FlowDef {
  label: string;
  nodes: NodeId[];
  color: string;
  connections: string[];
}

const FLOWS: Record<string, FlowDef> = {
  capture: {
    label: "Capture object",
    nodes: ["iphone","workers","d1r2vec","gen","baseten","durable","quest"],
    color: "#b7c9a8",
    connections: ["cf-iphone-workers","cf-workers-d1r2vec","cf-workers-gen","cf-gen-baseten","cf-workers-durable","cf-durable-quest"],
  },
  search: {
    label: "Search library",
    nodes: ["quest","workers","d1r2vec"],
    color: "#9bb7c9",
    connections: ["cf-quest-workers","cf-workers-d1r2vec"],
  },
  arrange: {
    label: "Arrange room",
    nodes: ["quest","agent","fit","workers","durable"],
    color: "#bab1ce",
    connections: ["cf-quest-workers","cf-workers-agent","cf-agent-fit","cf-workers-durable","cf-durable-quest"],
  },
  find: {
    label: "Find in store",
    nodes: ["quest","workers","ingest","gen","baseten"],
    color: "#dbb58d",
    connections: ["cf-quest-workers","cf-workers-ingest","cf-workers-gen","cf-gen-baseten"],
  },
};

const TEAL   = "#b7c9a8";
const BLUE   = "#9bb7c9";
const ORANGE = "#dbb58d";
const PURPLE = "#bab1ce";
const ARROW  = "rgba(242,238,230,0.3)";

const PACKET_OFFSETS = [0, 0.45] as const;

export default function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [activeFlow, setActiveFlow] = useState<string>("capture");
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

  const displayFlow = hoveredFlow ?? activeFlow;
  const flowDef: FlowDef = FLOWS[displayFlow] ?? FLOWS["capture"];
  const flowNodes = new Set<NodeId>(flowDef.nodes);
  const activeConnections = new Set<string>(flowDef.connections);
  const on  = (id: NodeId) => flowNodes.has(id);
  const dim = (ids: NodeId[]) => ids.some((id) => flowNodes.has(id)) ? 1 : 0.1;
  const flowColor = FLOWS[activeFlow]?.color ?? TEAL;

  const detail = selectedNode ? NODES[selectedNode] : null;
  const click = (id: NodeId) => setSelectedNode(selectedNode === id ? null : id);

  return (
    <div>
      {/* Flow tabs */}
      <div className="flex flex-wrap gap-2 mb-5 relative" role="group" aria-label="Highlight a data flow">
        {Object.entries(FLOWS).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActiveFlow(key)}
            onMouseEnter={() => setHoveredFlow(key)}
            onMouseLeave={() => setHoveredFlow(null)}
            className="btn focus-ring text-xs relative overflow-hidden"
            style={activeFlow === key ? {
              borderColor: `${f.color}55`,
              background: `${f.color}12`,
              color: f.color,
            } : {}}
            aria-pressed={activeFlow === key}
          >
            {f.label}
            {activeFlow === key && (
              <motion.span
                layoutId="flow-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: f.color }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Diagram */}
      <div className="diagram-scroll overflow-x-auto rounded-xl" tabIndex={0} role="region" aria-label="Scrollable architecture diagram" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ minWidth: 960 }}>
          <svg
            viewBox="0 0 960 430"
            width="100%"
            style={{ display: "block", minWidth: 960 }}
            aria-label="Scale system architecture diagram"
            role="group"
          >
            <defs>
              <pattern id="adot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.035)" />
              </pattern>
              <marker id="m-teal"   viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={TEAL}   /></marker>
              <marker id="m-orange" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={ORANGE} /></marker>
              <marker id="m-blue"   viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={BLUE}   /></marker>
              <marker id="m-purple" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={PURPLE} /></marker>
              <marker id="m-arrow"  viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={ARROW}  /></marker>
              {/* Glow filters for active elements */}
              <filter id="ad-glow-teal"   x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ad-glow-orange" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ad-glow-blue"   x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ad-glow-purple" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ad-packet-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Dot grid background */}
            <rect x="0" y="0" width="960" height="430" fill="url(#adot-grid)" />

            {/* Zone backgrounds */}
            <rect x="10"  y="10" width="145" height="410" rx="10" fill="rgba(183,201,168,0.03)"  stroke="rgba(183,201,168,0.1)"  strokeWidth="1" />
            <rect x="163" y="10" width="438" height="410" rx="10" fill="rgba(219,181,141,0.03)"  stroke="rgba(219,181,141,0.1)"  strokeWidth="1" />
            <rect x="609" y="10" width="341" height="245" rx="10" fill="rgba(155,183,201,0.03)"  stroke="rgba(155,183,201,0.1)"  strokeWidth="1" />
            <rect x="609" y="263" width="341" height="157" rx="10" fill="rgba(186,177,206,0.04)" stroke="rgba(186,177,206,0.1)" strokeWidth="1" />

            {/* Zone labels */}
            <text x="82"  y="30" fontSize="11" fill={TEAL}   fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="1">DEVICES</text>
            <text x="382" y="30" fontSize="11" fill={ORANGE} fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="1">CLOUDFLARE</text>
            <text x="779" y="30" fontSize="11" fill={BLUE}   fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="1">LOCAL COMPUTE (DOCKER)</text>
            <text x="779" y="283" fontSize="11" fill={PURPLE} fontWeight="700" textAnchor="middle" letterSpacing="1.5" opacity="1">EXTERNAL</text>

            {/* Connection paths. ids used by animateMotion mpath */}
            <path id="cf-iphone-workers"  d="M147 120 H159 V100 H171"                            stroke={TEAL}   strokeWidth="2"   fill="none" markerEnd="url(#m-teal)"   opacity={dim(["iphone","workers"])} />
            <path id="cf-durable-quest"   d="M374 305 V350 H155 V300 H147"                  stroke={ARROW}  strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerEnd="url(#m-arrow)" opacity={dim(["durable","quest"])} />
            <path id="cf-quest-workers"   d="M147 300 H163 V100 H171"                  stroke={TEAL}   strokeWidth="1.5" fill="none" markerEnd="url(#m-teal)"   opacity={dim(["quest","workers"])} />
            <path id="cf-workers-d1r2vec" d="M240 140 V225"                             stroke={ORANGE} strokeWidth="1.5" fill="none" markerEnd="url(#m-orange)" opacity={dim(["workers","d1r2vec"])} />
            <path id="cf-workers-durable" d="M340 140 V225"                             stroke={ORANGE} strokeWidth="1.5" fill="none" markerEnd="url(#m-orange)" opacity={dim(["workers","durable"])} />
            <path id="cf-workers-agent"   d="M361 100 H449"                              stroke={ORANGE} strokeWidth="1.5" fill="none" markerEnd="url(#m-orange)" opacity={dim(["workers","agent"])} />
            <path id="cf-agent-fit"       d="M521 140 V200 H617"                              stroke={BLUE}   strokeWidth="1.5" fill="none" markerEnd="url(#m-blue)"   opacity={dim(["agent","fit"])} />
            <path id="cf-workers-gen"     d="M361 120 H401 V170 H605 V100 H617"                              stroke={BLUE}   strokeWidth="2"   fill="none" markerEnd="url(#m-blue)"   opacity={dim(["workers","gen","ingest"])} />
            <path id="cf-workers-ingest"  d="M361 130 H445 V250 H852 V140"                              stroke={BLUE}   strokeWidth="1.5" fill="none" markerEnd="url(#m-blue)"   opacity={dim(["workers","ingest"])} />
            <path id="cf-gen-baseten"     d="M686 140 H757 V260 H930 V292 H779 V300"                              stroke={PURPLE} strokeWidth="1.5" fill="none" strokeDasharray="5 3" markerEnd="url(#m-purple)" opacity={dim(["gen","baseten"])} />
            <text x="535" y="162" fontSize="11" fill={BLUE} textAnchor="middle" fontWeight="600" opacity={dim(["workers","gen","ingest"])}>TUNNEL</text>

            {/* Animated data packets. glowing dots traveling along active connections */}
            {flowDef.connections.map((connId) =>
              activeConnections.has(connId)
                ? PACKET_OFFSETS.map((offset, pi) => (
                    <g key={`${connId}-${pi}`} >
                      <circle r="2.5" fill={flowDef.color} opacity="0.95">
                        <animateMotion
                          dur={`${1.6 + pi * 0.3}s`}
                          repeatCount="indefinite"
                          begin={`${offset * (1.6 + pi * 0.3)}s`}
                        >
                          <mpath href={`#${connId}`} />
                        </animateMotion>
                      </circle>
                      {/* Bright core */}
                      <circle r="1.8" fill="white" opacity="0.8">
                        <animateMotion
                          dur={`${1.6 + pi * 0.3}s`}
                          repeatCount="indefinite"
                          begin={`${offset * (1.6 + pi * 0.3)}s`}
                        >
                          <mpath href={`#${connId}`} />
                        </animateMotion>
                      </circle>
                    </g>
                  ))
                : null
            )}

            {/* Nodes */}
            <ArchNode x={18}  y={85}  w={129} h={70}  label="iPhone"         sub1="Expo"           sub2="Swift modules"         acc={TEAL}   sel={selectedNode==="iphone"}   act={on("iphone")}   click={() => click("iphone")} />
            <ArchNode x={18}  y={265} w={129} h={70}  label="Meta Quest"     sub1="WebXR"          sub2="three.js + Rapier"     acc={TEAL}   sel={selectedNode==="quest"}    act={on("quest")}    click={() => click("quest")} />
            <ArchNode x={171} y={60}  w={190} h={80}  label="Workers"        sub1="front door"     sub2="every /v1 route"       acc={ORANGE} sel={selectedNode==="workers"}  act={on("workers")}  click={() => click("workers")} />
            <ArchNode x={171} y={225} w={130} h={80}  label="D1 · R2 · Vec"  sub1="rows"           sub2="blobs · vectors"       acc={ORANGE} sel={selectedNode==="d1r2vec"} act={on("d1r2vec")}  click={() => click("d1r2vec")} />
            <ArchNode x={309} y={225} w={130} h={80}  label="Durable Object" sub1="SSE"            sub2="fan-out"               acc={ORANGE} sel={selectedNode==="durable"}  act={on("durable")}  click={() => click("durable")} />
            <ArchNode x={449} y={60}  w={145} h={80}  label="designer-agent" sub1="Worker"         sub2="intents → constraints" acc={ORANGE} sel={selectedNode==="agent"}   act={on("agent")}    click={() => click("agent")} />
            <ArchNode x={617} y={60}  w={138} h={80}  label="gen adapter"    sub1="Docker"         sub2="scale binding"         acc={BLUE}   sel={selectedNode==="gen"}      act={on("gen")}      click={() => click("gen")} />
            <ArchNode x={617} y={160} w={138} h={80}  label="fit service"    sub1="Docker"         sub2="OR-Tools CP-SAT"       acc={BLUE}   sel={selectedNode==="fit"}      act={on("fit")}      click={() => click("fit")} />
            <ArchNode x={765} y={60}  w={175} h={80}  label="ingest service" sub1="Docker"         sub2="Browserbase + LLM"     acc={BLUE}   sel={selectedNode==="ingest"}   act={on("ingest")}   click={() => click("ingest")} />
            <ArchNode x={617} y={300} w={323} h={85} label="Baseten"        sub1="Stable Fast 3D" sub2="L4:4x16 GPU"           acc={PURPLE} sel={selectedNode==="baseten"}  act={on("baseten")}  click={() => click("baseten")} />
          </svg>
        </div>
      </div>
      <p className="text-center mt-2" style={{ fontSize: 11, color: "#bec7be" }}>
        Select any component for details · scroll right on narrow screens
      </p>

      {/* Detail panel with AnimatePresence */}
      <AnimatePresence mode="wait">
        {detail && (
          <motion.div
            key={selectedNode}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-4 p-4 sm:p-5 rounded-xl relative"
            style={{ background: "rgba(22,28,24,0.9)", border: `1px solid ${flowColor}28` }}
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg focus-ring transition-colors text-lg"
              style={{ color: "#bec7be", background: "rgba(255,255,255,0.05)" }}
              aria-label="Close"
            >
              ×
            </button>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: flowColor }}>Component</p>
            <h3 className="text-base font-bold mb-2 pr-8" style={{ color: "#f2eee6" }}>{detail.title}</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#bec7be" }}>{detail.role}</p>
            <div className="text-xs space-y-1.5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#bec7be" }}><span className="font-semibold" style={{ color: "#bec7be" }}>Tech:</span> {detail.tech}</p>
              <p style={{ color: "#bec7be" }}><span className="font-semibold" style={{ color: "#bec7be" }}>Source:</span> {detail.source}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArchNode({
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
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); }
      }}
      className="architecture-node"
      tabIndex={0}
      role="button"
      aria-pressed={sel}
      aria-label={`${label}: click for details`}
      style={{
        cursor: "pointer",
        opacity: 1,
        transition: "opacity 0.22s ease",
      }}
    >
      {/* Selection glow ring */}
      {sel && (
        <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={12}
          fill="none" stroke={acc} strokeWidth="1" opacity="0.35" />
      )}
      {/* Glow rect behind box when active */}
      {act && (
        <rect
          x={x} y={y} width={w} height={h} rx={10}
          fill="none"
          stroke={acc}
          strokeWidth="1"
          opacity="0.18"
        />
      )}
      {/* Box */}
      <rect
        x={x} y={y} width={w} height={h} rx={10}
        className="node-box"
        fill="#1b211d"
        stroke={sel ? acc : act ? `${acc}55` : "rgba(255,255,255,0.1)"}
        strokeWidth={sel ? 1.5 : act ? 1 : 1}
        style={{ transition: "all 0.18s ease" }}
      />
      {/* Accent top bar when selected */}
      {sel && <rect x={x + 1} y={y + 1} width={w - 2} height={3} rx={4} fill={acc} opacity="0.7" />}

      {/* Pulsing status dot. top-left corner of node */}
      <circle
        cx={x + 11}
        cy={y + 11}
        r="3.5"
        fill={act ? acc : "rgba(255,255,255,0.12)"}
        opacity={act ? 0.85 : 0.3}
      >
        {act && (
          <animate
            attributeName="opacity"
            values="0.85;0.3;0.85"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Label */}
      <text x={mid} y={y + 30} fontSize="13" fill={sel ? acc : "rgba(242,238,230,0.85)"} fontWeight="700" textAnchor="middle">{label}</text>
      {/* Sub line 1 */}
      <text x={mid} y={y + 45} fontSize="11" fill="#bec7be" textAnchor="middle">{sub1}</text>
      {/* Sub line 2. only if node is tall enough */}
      {h >= 70 && (
        <text x={mid} y={y + 58} fontSize="11" fill="#bec7be" textAnchor="middle">{sub2}</text>
      )}
    </g>
  );
}
