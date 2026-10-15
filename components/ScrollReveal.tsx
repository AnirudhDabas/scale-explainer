"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useMotionPreferences } from "./MotionPreferences";

export default function ScrollReveal({
  children,
  y = 40,
  delay = 0,
}: {
  children: React.ReactNode;
  y?: number;
  delay?: number;
}) {
  const { enabled } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "0px 0px 40px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: 1, y: enabled && !visible ? y : 0, rotateX: enabled && !visible ? 3 : 0 }}
      style={{ transformPerspective: 1200, transformOrigin: "center top" }}
      transition={{ duration: enabled ? 0.6 : 0, delay: enabled ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}
