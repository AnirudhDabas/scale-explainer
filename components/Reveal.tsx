"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useMotionPreferences } from "./MotionPreferences";

export default function Reveal({
  children,
  delay = 0,
  y = 12,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useMotionPreferences();
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: 1, y: enabled && !inView ? y : 0 }}
      transition={{ duration: enabled ? 0.45 : 0, delay: enabled ? delay : 0, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
