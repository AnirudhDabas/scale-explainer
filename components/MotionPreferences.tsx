"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

const MotionContext = createContext({ enabled: false, toggle: () => {} });
export const useMotionPreferences = () => useContext(MotionContext);

export default function MotionPreferences({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      let paused = false;
      try { paused = localStorage.getItem("scale-motion") === "paused"; } catch {}
      setEnabled(!preference.matches && !paused);
    };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? "on" : "off";
    document.querySelectorAll("svg").forEach(svg => {
      if (enabled) svg.unpauseAnimations(); else svg.pauseAnimations();
    });
    if (enabled) return;
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node instanceof SVGSVGElement) node.pauseAnimations();
      if (node instanceof Element) node.querySelectorAll("svg").forEach(svg => svg.pauseAnimations());
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);

  const toggle = () => setEnabled(current => {
    try { localStorage.setItem("scale-motion", current ? "paused" : "on"); } catch {}
    return !current;
  });

  return (
    <MotionContext.Provider value={{ enabled, toggle }}>
      <MotionConfig reducedMotion={enabled ? "user" : "always"}>{children}</MotionConfig>
    </MotionContext.Provider>
  );
}
