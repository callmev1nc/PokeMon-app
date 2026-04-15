"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Dang nhap that bai");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Loi ket noi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Pokemon"
              className="h-16 w-auto mx-auto mb-3 rounded-xl"
            />
            <h1 className="text-xl font-bold text-slate-800">
              Quan ly
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Dang nhap de truy cap trang quan ly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-600 mb-1.5"
              >
                Ten dang nhap
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-600 mb-1.5"
              >
                Mat khau
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-red-200"
            >
              {loading ? "Dang dang nhap..." : "Dang nhap"}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; Quay lai cua hang
          </a>
        </div>
      </div>
    </div>
  );
}
