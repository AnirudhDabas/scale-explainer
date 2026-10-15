"use client";

import { motion, useReducedMotion } from "framer-motion";


const WORDS_1 = ["Scan", "anything", "real."];
const WORDS_2 = ["Place", "it", "true."];

export default function HeroText() {
  const reducedMotion = useReducedMotion();

  return (
    <div>
      <h1 id="hero-heading" className="display mb-7" style={{ maxWidth: 820 }} aria-label="Scan anything real. Place it true.">
        {/* Line 1 */}
        <span className="block">
          {WORDS_1.map((w, i) => (
            <motion.span
              key={w}
              className="inline-block mr-[0.22em]"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.1 + i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </span>
        {/* Line 2. accent */}
        <span className="block" style={{ color: "#b7c9a8" }}>
          {WORDS_2.map((w, i) => (
            <motion.span
              key={w}
              className="inline-block mr-[0.22em]"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.38 + i * 0.09, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </span>
      </h1>
    </div>
  );
}
