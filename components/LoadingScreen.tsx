"use client";

import { useEffect, useRef, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("scale-intro-seen")) { setVisible(false); return; }
      sessionStorage.setItem("scale-intro-seen", "yes");
    } catch {}
    setVisible(true);
    const complete = (event: MessageEvent) => {
      if (event.origin === location.origin && event.source === frame.current?.contentWindow && event.data === "logo-done") setVisible(false);
    };
    window.addEventListener("message", complete);
    const timeout = setTimeout(() => setVisible(false), 2200);
    return () => { clearTimeout(timeout); window.removeEventListener("message", complete); };
  }, []);
  if (!visible) return null;
  return (
    <div className="intro-overlay" onKeyDown={e => { if (e.key === "Escape") setVisible(false); }}>
      <iframe ref={frame} src="/logo-loading.html" title="Scale logo animation" tabIndex={-1} aria-hidden="true" />
      <button className="btn focus-ring" onClick={() => setVisible(false)} autoFocus>Skip intro</button>
    </div>
  );
}
