"use client";

const NAV = [
  { href: "#architecture", label: "Architecture" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#binding", label: "Scale binding" },
  { href: "#fitengine", label: "Fit engine" },
  { href: "#decisions", label: "Design" },
];

export default function NavLinks() {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
      {NAV.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 focus-ring nav-link"
        >
          {l.label}
        </a>
      ))}
      <style>{`
        .nav-link { color: rgba(240,244,255,0.38); }
        .nav-link:hover { color: rgba(240,244,255,0.85); background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
