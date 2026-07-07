"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  withText?: boolean;
  animated?: boolean;
}

// Animated SkidHub mark: a hexagonal glass badge with an orbiting accent
// ring and a stylized "S" download glyph.
export default function Logo({
  size = 40,
  withText = true,
  animated = true,
}: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        initial={animated ? { rotate: -8, scale: 0.9, opacity: 0 } : false}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          className="drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]"
        >
          <defs>
            <linearGradient id="skidhub-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-from)" />
              <stop offset="100%" stopColor="var(--accent-to)" />
            </linearGradient>
          </defs>
          {/* Hexagon badge */}
          <motion.path
            d="M24 3 L41 13 L41 35 L24 45 L7 35 L7 13 Z"
            fill="url(#skidhub-grad)"
            fillOpacity="0.15"
            stroke="url(#skidhub-grad)"
            strokeWidth="1.5"
            initial={animated ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          {/* Stylized S / download arrow */}
          <motion.path
            d="M30 17 C30 14 20 14 18 18 C16 22 30 22 30 27 C30 32 20 32 18 29"
            fill="none"
            stroke="url(#skidhub-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={animated ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeInOut" }}
          />
        </svg>
        {animated && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 0 1px rgba(139,92,246,0.4)",
            }}
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </motion.div>

      {withText && (
        <motion.span
          className="text-xl font-extrabold tracking-tight"
          initial={animated ? { opacity: 0, x: -6 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Skid<span className="accent-text">Hub</span>
        </motion.span>
      )}
    </div>
  );
}
