"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gift, Snowflake } from "lucide-react";

import type { FallingItem } from "./types";

type GameProps = {
  items: FallingItem[];
  score: number;
  progress: number;
  onCatch: (item: FallingItem) => void;
};

export default function Game({ items, score, progress, onCatch }: GameProps) {
  return (
    <motion.main
      key="game"
      className="relative z-20 min-h-screen bg-gradient-to-b from-[#0f1e2b] via-[#1a2b3c] to-[#0b1219] px-5 pb-10 pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6 }}
    >
      <header className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-3xl font-semibold [font-family:var(--font-display)]">
            Catch the Love
          </h2>
          <Gift className="h-7 w-7 text-[#ffd166]" />
        </div>
        <p className="text-sm text-white/70">
          Tap hadiah dan hati, hindari bom dan salju.
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between text-sm text-white/80">
        <span>Score: {score}</span>
        <span className="flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-[#8ad3ff]" />
          Target 100
        </span>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#ffb347] via-[#ff8c7a] to-[#ff6b9a]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.2 }}
        />
      </div>

      <div className="relative h-[60vh] w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
        <AnimatePresence>
          {items.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onCatch(item)}
              className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl backdrop-blur"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              {item.emoji}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 text-xs text-white/60">
        <span className="flex items-center gap-1">
          <span>🎁</span> +10
        </span>
        <span className="flex items-center gap-1">
          <span>❤️</span> +10
        </span>
        <span className="flex items-center gap-1">
          <span>💣</span> -20
        </span>
        <span className="flex items-center gap-1">
          <span>❄️</span> -20
        </span>
      </div>
    </motion.main>
  );
}

