"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function getLocale(): "vi" | "en" {
  if (typeof window === "undefined") return "vi";
  try {
    const stored = localStorage.getItem("pokemon-locale");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.locale === "en" ? "en" : "vi";
    }
  } catch {}
  return "vi";
}

const messages = {
  vi: {
    title: "Đã xảy ra lỗi",
    subtitle: "Vui lòng tải lại trang hoặc quay lại trang chủ",
    retry: "Thử lại",
    home: "Trang chủ",
  },
  en: {
    title: "Something went wrong",
    subtitle: "Please reload the page or go back to home",
    retry: "Try again",
    home: "Home",
  },
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const locale = getLocale();
      const msg = messages[locale];

      return (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-red-400 mx-auto mb-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {msg.title}
          </p>
          <p className="text-xs text-red-400 dark:text-red-500 mt-1">
            {msg.subtitle}
          </p>
          {this.state.error && (
            <p className="text-xs text-red-300 dark:text-red-600 mt-2 font-mono truncate max-w-md mx-auto">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              {msg.retry}
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {msg.home}
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function InlineErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-center">
          <p className="text-xs text-red-400">Card failed to render</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
