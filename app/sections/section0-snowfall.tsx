"use client";

import { useMemo } from "react";

export default function Snowfall() {
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 6,
        opacity: 0.4 + Math.random() * 0.6,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
