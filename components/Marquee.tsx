"use client";

const ITEMS = [
  "0.3126 × 0.0155 × 0.2212 m",
  "bboxMeters in < 1 s",
  "accurate to 1 × 10⁻⁸ m",
  "768-dim SigLIP-2 embeddings",
  "OR-Tools CP-SAT solver",
  "Cloudflare Workers + Vectorize",
  "SF3D · Baseten L4:4×16",
  "WebXR at 1:1 scale",
];

export default function Marquee() {
  const repeated = [...ITEMS, ...ITEMS];
  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 0",
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
      aria-hidden="true"
    >
      <div className="marquee-track flex gap-10 whitespace-nowrap">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="font-mono shrink-0"
            style={{ fontSize: 11, color: "rgba(240,242,250,0.32)", letterSpacing: "0.04em" }}
          >
            {item}
            <span style={{ marginLeft: 40, color: "rgba(125,211,252,0.3)" }}>·</span>
          </span>
        ))}
      </div>
      <style>{`
        .marquee-track {
          animation: marquee-scroll 28s linear infinite;
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
