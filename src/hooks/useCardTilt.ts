"use client";

import { useRef, useCallback } from "react";
import { useReducedMotion } from "./useReducedMotion";
import { useMediaQuery } from "./useMediaQuery";

const TILT_MAX = 8;
const SCALE_HOVER = 1.02;

export function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced || !canHover || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      ref.current.style.transform = `perspective(600px) rotateY(${x * TILT_MAX}deg) rotateX(${-y * TILT_MAX}deg) scale3d(${SCALE_HOVER},${SCALE_HOVER},${SCALE_HOVER})`;
    },
    [reduced, canHover]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}
