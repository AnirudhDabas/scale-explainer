"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { useMotionPreferences } from "./MotionPreferences";

const NAV = [
  { href: "#experience", label: "The experience" },
  { href: "#architecture", label: "Architecture" },
  { href: "#pipeline",     label: "Pipeline"      },
  { href: "#binding",      label: "Binding"       },
  { href: "#fitengine",    label: "Fit engine"    },
  { href: "#decisions",    label: "Design"        },
];

export default function NavLinks() {
  const [active, setActive] = useState("");
  const linksRef = useRef<HTMLDivElement>(null);
  const { enabled, toggle } = useMotionPreferences();
  const { scrollYProgress } = useScroll();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = NAV.filter(item => {
        const section = document.querySelector(item.href);
        return section && section.getBoundingClientRect().top <= innerHeight * 0.35;
      }).at(-1);
      setActive(current?.href ?? "");
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    const container = linksRef.current;
    const selected = container?.querySelector<HTMLAnchorElement>('[aria-current="location"]');
    if (container && selected) container.scrollTo({ left: selected.offsetLeft - container.offsetLeft - container.clientWidth / 2 + selected.clientWidth / 2, behavior: enabled ? "smooth" : "instant" });
  }, [active, enabled]);
  return (
    <>
    <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    <div className="flex items-center gap-2 min-w-0">
    <div ref={linksRef} className="nav-links flex items-center gap-0.5 overflow-x-auto no-scrollbar">
      {NAV.map((l) => (
        <a key={l.href} href={l.href} aria-current={active === l.href ? "location" : undefined} className="nav-link px-3 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 focus-ring">
          {l.label}
        </a>
      ))}
    </div>
      <button className="motion-toggle focus-ring shrink-0" onClick={toggle} aria-pressed={enabled} aria-label={enabled ? "Pause animations" : "Enable animations"} title={enabled ? "Pause animations" : "Enable animations"}>
        <span aria-hidden="true">{enabled ? "Ⅱ" : "▷"}</span><span className="hidden sm:inline">Motion</span>
      </button>
      <style>{`
        .nav-link { flex-shrink: 0; color: #bec7be; font-family:'DM Sans',sans-serif; }
        .nav-link:hover { color: rgba(242,238,230,0.85); background: rgba(255,255,255,0.06); }
        .nav-link[aria-current] { color: #f2eee6; background: rgba(183,201,168,0.12); box-shadow: inset 0 -2px #b7c9a8; }
      `}</style>
    </div>
    </>
  );
}
