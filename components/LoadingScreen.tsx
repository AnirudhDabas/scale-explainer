"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    // Listen for the logo-done message from the iframe
    const onMessage = (e: MessageEvent) => {
      if (e.data === "logo-done") startFade();
    };
    window.addEventListener("message", onMessage);

    // Hard fallback: never block the page for more than 3.5 s
    const fallback = setTimeout(startFade, 3500);

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(fallback);
    };
  }, []);

  function startFade() {
    setPhase("fading");
    setTimeout(() => setPhase("gone"), 700);
  }

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#060a12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.65s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      <iframe
        src="/logo-loading.html"
        title="Scale logo"
        scrolling="no"
        style={{
          border: "none",
          background: "transparent",
          width: "min(90vw, 90vh)",
          height: "min(90vw, 90vh)",
          display: "block",
        }}
      />
    </div>
  );
}
