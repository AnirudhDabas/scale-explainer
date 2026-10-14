"use client";

import { useEffect, useRef } from "react";

export default function ScrollBackground() {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, progress));

        if (orb1Ref.current) {
          orb1Ref.current.style.transform = `translate(${p * 60}px, ${p * -80}px)`;
          orb1Ref.current.style.opacity = String(0.55 + p * 0.2);
        }
        if (orb2Ref.current) {
          orb2Ref.current.style.transform = `translate(${p * -50}px, ${p * 60}px)`;
          orb2Ref.current.style.opacity = String(0.4 + p * 0.25);
        }
        if (orb3Ref.current) {
          orb3Ref.current.style.transform = `translate(${p * 30}px, ${p * -40}px)`;
          orb3Ref.current.style.opacity = String(0.3 + p * 0.3);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#06090f]" />

      {/* Orb 1: teal top-left */}
      <div
        ref={orb1Ref}
        className="absolute animate-float-slow"
        style={{
          top: "-15%",
          left: "5%",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle at center, rgba(15,196,184,0.12) 0%, rgba(15,196,184,0.04) 50%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          opacity: 0.55,
          transition: "opacity 1.5s ease",
        }}
      />

      {/* Orb 2: indigo center-right */}
      <div
        ref={orb2Ref}
        className="absolute animate-float-medium"
        style={{
          top: "30%",
          right: "0%",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle at center, rgba(91,156,246,0.1) 0%, rgba(91,156,246,0.03) 50%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(70px)",
          opacity: 0.4,
          transition: "opacity 1.5s ease",
        }}
      />

      {/* Orb 3: purple bottom-left */}
      <div
        ref={orb3Ref}
        className="absolute animate-float-fast"
        style={{
          bottom: "10%",
          left: "15%",
          width: 550,
          height: 550,
          background:
            "radial-gradient(circle at center, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0.03) 50%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: 0.3,
          transition: "opacity 1.5s ease",
        }}
      />

      {/* Fine noise/grain overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
