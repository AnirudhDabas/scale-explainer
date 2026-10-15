"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const WORDS_1 = ["Scan", "anything", "real."];
const WORDS_2 = ["Place", "it", "true."];

export default function HeroText() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Parallax: headline drifts up slightly as you scroll past it
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <motion.div ref={ref} style={{ y, opacity }}>
      <h1 className="display mb-7" style={{ maxWidth: 820 }} aria-label="Scan anything real. Place it true.">
        {/* Line 1 */}
        <span className="block">
          {WORDS_1.map((w, i) => (
            <motion.span
              key={w}
              className="inline-block mr-[0.22em]"
              initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.1 + i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </span>
        {/* Line 2 — accent */}
        <span className="block" style={{ color: "#7dd3fc" }}>
          {WORDS_2.map((w, i) => (
            <motion.span
              key={w}
              className="inline-block mr-[0.22em]"
              initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.38 + i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </span>
      </h1>
    </motion.div>
  );
}
