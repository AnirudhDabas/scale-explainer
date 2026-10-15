"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ScrollReveal({
  children,
  y = 40,
  delay = 0,
}: {
  children: React.ReactNode;
  y?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "start 45%"] });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const translateY = useTransform(scrollYProgress, [0, 1], [y, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y: translateY }} transition={{ delay }}>
      {children}
    </motion.div>
  );
}
