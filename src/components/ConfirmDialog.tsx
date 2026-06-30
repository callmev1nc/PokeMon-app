"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  const reduced = useReducedMotion();

  const colors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-orange-600 hover:bg-orange-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            key="dialog"
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors ${colors[variant]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", variant: "danger", onConfirm: () => {} });

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: "danger" | "warning" | "info" = "danger"
  ) => {
    setState({ open: true, title, message, onConfirm, variant });
  };

  const handleConfirm = () => {
    state.onConfirm();
    setState((s) => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
  };

  return { dialogProps: { ...state, onConfirm: handleConfirm, onCancel: handleCancel }, confirm };
}
