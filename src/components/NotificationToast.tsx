"use client";
import { useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

function ToastItem({ toast, reduced }: { toast: Toast; reduced: boolean }) {
  return (
    <motion.div
      layout
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: reduced ? 0 : 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
        toast.type === "success" ? "bg-green-600 text-white" :
        toast.type === "error" ? "bg-red-600 text-white" :
        "bg-slate-800 text-white"
      }`}
    >
      {toast.type === "success" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline-block mr-1.5 -mt-0.5">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      )}
      {toast.message}
    </motion.div>
  );
}

export default function NotificationToast({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduced = useReducedMotion();

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} reduced={reduced} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
