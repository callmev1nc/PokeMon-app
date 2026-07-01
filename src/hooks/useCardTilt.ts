"use client";

import { useRef, useCallback } from "react";
import { useReducedMotion } from "./useReducedMotion";
import { useMediaQuery } from "./useMediaQuery";

const TILT_MAX = 10;
const SCALE_HOVER = 1.03;

/**
 * 3D tilt + cursor-tracked holographic glare for cards.
 * - Sets a `perspective()` rotate/scale transform on pointer move (hover pointers only).
 * - Writes `--mx` / `--my` (0–100%) so a descendant `.holo-glare` layer can follow the cursor.
 * - Toggles an `is-tilting` class (enter/leave) to fade the glare in/out.
 * - Collapses to a no-op for `prefers-reduced-motion` and touch pointers.
 * - Transform-only: safe inside virtualized grids (no layout cost).
 */
export function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const handleMouseEnter = useCallback(() => {
    const el = ref.current;
    if (!el || reduced || !canHover) return;
    el.classList.add("is-tilting");
  }, [reduced, canHover]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (reduced || !canHover || !el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const x = px - 0.5;
      const y = py - 0.5;
      el.style.transform =
        `perspective(700px) rotateY(${x * TILT_MAX}deg) rotateX(${-y * TILT_MAX}deg) scale3d(${SCALE_HOVER},${SCALE_HOVER},${SCALE_HOVER})`;
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    },
    [reduced, canHover]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // clear inline transform so CSS hover/rest transforms regain control
    el.style.transform = "";
    el.classList.remove("is-tilting");
  }, []);

  return { ref, handleMouseEnter, handleMouseMove, handleMouseLeave, canHover, reduced };
}
