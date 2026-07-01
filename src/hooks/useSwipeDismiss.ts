"use client";

import { useCallback, useRef, useState } from "react";

interface SwipeDismissOptions {
  /** Which axis the gesture travels along. */
  axis: "x" | "y";
  /** Distance (px) past which a drag dismisses on release. */
  threshold?: number;
  /** Flick velocity (px/ms) past which a drag dismisses regardless of distance. */
  velocityThreshold?: number;
  /** 1 = dragging toward +axis dismisses (right/down), -1 = toward -axis (left/up). */
  dismissDirection?: 1 | -1;
  /** Gate the gesture (e.g. only when the surface is open). */
  enabled?: boolean;
  onDismiss: () => void;
}

interface SwipeDismissResult {
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  /** Apply while dragging (transform follows the finger, transition disabled).
   *  undefined when idle so the element's own CSS class controls open/close. */
  style: React.CSSProperties | undefined;
  dragging: boolean;
}

/**
 * Drag-to-dismiss for drawers / bottom sheets — no animation dependency.
 *
 * - Animates only `transform` (GPU-friendly).
 * - Pointer capture is taken LAZILY (only once a real drag exceeds `armPx`),
 *   so taps/clicks on child buttons (close X, steppers, links) are never stolen.
 * - Primary-pointer guard so multi-touch can't hijack it.
 * - Dismisses when dragged past `threshold` OR flicked above `velocityThreshold`,
 *   with rubber-band damping past the threshold.
 * - `style` is only returned while dragging; otherwise the surface's CSS class
 *   (translate-x/y + transition) owns the open/close animation.
 */
export function useSwipeDismiss({
  axis,
  threshold = 100,
  velocityThreshold = 0.5,
  dismissDirection = 1,
  enabled = true,
  onDismiss,
}: SwipeDismissOptions): SwipeDismissResult {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const lastRef = useRef<{ pos: number; t: number } | null>(null);
  /** Synchronous dragging flag (the useState value is stale inside callbacks). */
  const armedRef = useRef(false);
  /** Movement (px) that must be exceeded before we capture + treat as a drag. */
  const armPx = 4;

  const reset = useCallback(() => {
    armedRef.current = false;
    setDragging(false);
    setOffset(0);
    offsetRef.current = 0;
    startRef.current = null;
    lastRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !e.isPrimary) return;
      const pos = axis === "x" ? e.clientX : e.clientY;
      startRef.current = pos;
      lastRef.current = { pos, t: e.timeStamp };
      // Deliberately do NOT setPointerCapture here — capturing on every pointer
      // down would steal the click from child buttons (close X, steppers, links).
      // We arm/capture lazily in onPointerMove once a real drag is detected.
    },
    [enabled, axis]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (startRef.current === null || !e.isPrimary) return;
      const pos = axis === "x" ? e.clientX : e.clientY;
      let delta = pos - startRef.current;
      // Clamp to the dismiss direction so dragging the wrong way just resists.
      delta = dismissDirection === 1 ? Math.max(0, delta) : Math.min(0, delta);

      // Arm the gesture only after clear intent to drag — protects taps/clicks.
      if (!armedRef.current) {
        if (Math.abs(delta) <= armPx) return;
        armedRef.current = true;
        setDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* pointer capture not supported — ignore */
        }
      }

      // Rubber-band damping past the threshold so it never feels infinite.
      if (Math.abs(delta) > threshold) {
        const sign = Math.sign(delta);
        delta = sign * (threshold + (Math.abs(delta) - threshold) * 0.4);
      }
      offsetRef.current = delta;
      lastRef.current = { pos, t: e.timeStamp };
      setOffset(delta);
    },
    [axis, dismissDirection, threshold]
  );

  const finish = useCallback(
    (e: React.PointerEvent) => {
      if (startRef.current === null) return;
      const wasDragging = armedRef.current;
      const last = lastRef.current;
      let velocity = 0;
      if (last) {
        const dt = Math.max(1, e.timeStamp - last.t);
        const pos = axis === "x" ? e.clientX : e.clientY;
        velocity = (pos - last.pos) / dt;
      }
      const delta = offsetRef.current;
      const movingTowardDismiss =
        (dismissDirection === 1 && delta > 0) || (dismissDirection === -1 && delta < 0);
      const shouldDismiss =
        movingTowardDismiss &&
        (Math.abs(delta) >= threshold || Math.abs(velocity) >= velocityThreshold);
      reset();
      if (wasDragging && shouldDismiss) onDismiss();
    },
    [axis, dismissDirection, threshold, velocityThreshold, onDismiss, reset]
  );

  const transform =
    axis === "x" ? `translateX(${offset}px)` : `translateY(${offset}px)`;

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
    },
    style: dragging ? { transform, transitionDuration: "0ms" } : undefined,
    dragging,
  };
}
