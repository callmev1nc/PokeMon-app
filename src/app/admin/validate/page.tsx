"use client";

import { useState, useEffect, useCallback } from "react";
import AdminNav from "@/components/AdminNav";

interface TCGMatch {
  found: boolean;
  cardId: string | null;
  cardName: string | null;
  cardNumber: string | null;
  setName: string | null;
  setId: string | null;
  supertype: string | null;
  pokemonTypes: string[] | null;
  hp: string | null;
  rarity: string | null;
  flavorText: string | null;
  officialImageSmall: string | null;
  officialImageLarge: string | null;
}

interface ValidationEntry {
  product: {
    id: string;
    code: string;
    name: string;
    series: string;
    type: string;
    group: string;
    imageUrl: string | null;
  };
  tcgMatch: TCGMatch;
  validation: {
    imageStatus: "Valid" | "Invalid" | "Needs Review" | "No Image";
    reason: string;
    dataMatch: boolean;
    nameMatch: boolean;
    seriesMatch: boolean;
  };
  suggestion: {
    correctImageUrl: string | null;
    correctName: string | null;
  };
}

type FilterMode = "all" | "matched" | "unmatched" | "noImage";

export default function ValidatePage() {
  const [results, setResults] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(50);
  const [previewCard, setPreviewCard] = useState<ValidationEntry | null>(null);
  const [revalidating, setRevalidating] = useState<string | null>(null);

  const totalProducts = results.length;
  const matched = results.filter((r) => r.tcgMatch.found).length;
  const unmatched = results.filter((r) => !r.tcgMatch.found).length;
  const noImage = results.filter((r) => r.validation.imageStatus === "No Image").length;

  useEffect(() => {
    fetchReport();
  }, []);

  async function fetchReport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/validate");
      if (!res.ok) throw new Error("Report not found");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Failed to load validation report");
    } finally {
      setLoading(false);
    }
  }

  async function revalidateCard(entry: ValidationEntry) {
    setRevalidating(entry.product.id);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: entry.product.name,
          series: entry.product.series,
        }),
      });
      const data = await res.json();
      if (data.found && data.card) {
        setResults((prev) =>
          prev.map((r) => {
            if (r.product.id !== entry.product.id) return r;
            return {
              ...r,
              tcgMatch: {
                found: true,
                cardId: data.card.id,
                cardName: data.card.name,
                cardNumber: data.card.number,
                setName: data.card.setName,
                setId: data.card.setId,
                supertype: data.card.supertype,
                pokemonTypes: data.card.types,
                hp: data.card.hp,
                rarity: data.card.rarity,
                flavorText: data.card.flavorText,
                officialImageSmall: data.card.imageSmall,
                officialImageLarge: data.card.imageLarge,
              },
              validation: {
                ...r.validation,
                dataMatch: data.nameMatch && (data.numberMatch !== false),
                nameMatch: data.nameMatch,
                seriesMatch: data.numberMatch !== false,
              },
            };
          })
        );
      }
    } catch {
      // silently fail
    } finally {
      setRevalidating(null);
    }
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify({ results: filtered }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const headers = [
      "Name", "Series", "Group", "TCG Match", "Card Name", "Set",
      "Card Number", "Types", "Rarity", "Data Match", "Image Status",
      "Official Image URL", "Correct Name",
    ];
    const rows = filtered.map((r) => [
      r.product.name,
      r.product.series,
      r.product.group,
      r.tcgMatch.found ? "Yes" : "No",
      r.tcgMatch.cardName || "",
      r.tcgMatch.setName || "",
      r.tcgMatch.cardNumber || "",
      (r.tcgMatch.pokemonTypes || []).join(";"),
      r.tcgMatch.rarity || "",
      r.validation.dataMatch ? "Yes" : "No",
      r.validation.imageStatus,
      r.tcgMatch.officialImageLarge || "",
      r.suggestion.correctName || "",
    ]);
    const csv = [headers, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = results.filter((r) => {
    if (filter === "matched" && !r.tcgMatch.found) return false;
    if (filter === "unmatched" && r.tcgMatch.found) return false;
    if (filter === "noImage" && r.validation.imageStatus !== "No Image") return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.product.name.toLowerCase().includes(s) ||
        r.product.series.toLowerCase().includes(s) ||
        (r.tcgMatch.cardName || "").toLowerCase().includes(s) ||
        (r.tcgMatch.setName || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const visible = filtered.slice(0, showCount);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Valid: "bg-green-100 text-green-700",
      Invalid: "bg-red-100 text-red-700",
      "Needs Review": "bg-yellow-100 text-yellow-700",
      "No Image": "bg-slate-100 text-slate-500",
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  const matchBadge = (match: boolean | null) => {
    if (match === null) return "bg-gray-50 text-gray-400";
    return match ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <AdminNav active="validate" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Card Validation
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Validate product data against Pokémon TCG API
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadJSON}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Download JSON
            </button>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Download CSV
            </button>
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="text-2xl font-bold text-slate-800">{totalProducts}</div>
            <div className="text-xs text-slate-500">Total Cards</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{matched}</div>
            <div className="text-xs text-slate-500">
              Matched ({totalProducts ? ((matched / totalProducts) * 100).toFixed(1) : 0}%)
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-100">
            <div className="text-2xl font-bold text-red-600">{unmatched}</div>
            <div className="text-xs text-slate-500">Unmatched</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="text-2xl font-bold text-slate-500">{noImage}</div>
            <div className="text-xs text-slate-500">No Image</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1.5">
            {([
              ["all", "All"],
              ["matched", "Matched"],
              ["unmatched", "Unmatched"],
              ["noImage", "No Image"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setShowCount(50);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === key
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search name, series, set..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowCount(50);
            }}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full mx-auto mb-3" />
            Loading validation report...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Series</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">TCG Match</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Set</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Types</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Rarity</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Data</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((entry) => (
                      <tr
                        key={entry.product.id}
                        className="border-b border-slate-50 hover:bg-slate-25 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {entry.product.name}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {entry.product.group} · {entry.product.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {entry.product.series}
                        </td>
                        <td className="px-4 py-3">
                          {entry.tcgMatch.found ? (
                            <div>
                              <div className="font-medium text-slate-700">
                                {entry.tcgMatch.cardName}
                              </div>
                              <div className="text-xs text-slate-400">
                                #{entry.tcgMatch.cardNumber}
                              </div>
                            </div>
                          ) : (
                            <span className="text-red-400 text-xs">Not found</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {entry.tcgMatch.setName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {entry.tcgMatch.pokemonTypes?.map((t) => (
                            <span
                              key={t}
                              className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 mr-1"
                            >
                              {t}
                            </span>
                          )) || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {entry.tcgMatch.rarity || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${matchBadge(
                              entry.validation.dataMatch
                            )}`}
                          >
                            {entry.validation.dataMatch ? "OK" : "MISMATCH"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(
                              entry.validation.imageStatus
                            )}`}
                          >
                            {entry.validation.imageStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            {entry.tcgMatch.officialImageLarge && (
                              <button
                                onClick={() => setPreviewCard(entry)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                              >
                                Image
                              </button>
                            )}
                            {!entry.tcgMatch.found && (
                              <button
                                onClick={() => revalidateCard(entry)}
                                disabled={revalidating === entry.product.id}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-50"
                              >
                                {revalidating === entry.product.id ? "..." : "Retry"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No cards match the current filter
                </div>
              )}
            </div>

            {/* Load more */}
            {showCount < filtered.length && (
              <div className="text-center mt-4">
                <span className="text-sm text-slate-400 mr-3">
                  Showing {showCount} of {filtered.length}
                </span>
                <button
                  onClick={() => setShowCount((p) => p + 50)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}

        {/* Preview modal */}
        {previewCard && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewCard(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {previewCard.tcgMatch.cardName || previewCard.product.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {previewCard.tcgMatch.setName} #{previewCard.tcgMatch.cardNumber}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewCard(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  x
                </button>
              </div>

              {previewCard.tcgMatch.officialImageLarge && (
                <img
                  src={previewCard.tcgMatch.officialImageLarge}
                  alt={previewCard.tcgMatch.cardName || ""}
                  className="w-full rounded-xl mb-4"
                />
              )}

              <div className="space-y-2 text-sm">
                {previewCard.tcgMatch.supertype && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Card Type</span>
                    <span className="font-medium">{previewCard.tcgMatch.supertype}</span>
                  </div>
                )}
                {previewCard.tcgMatch.pokemonTypes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pokemon Type</span>
                    <span className="font-medium">
                      {previewCard.tcgMatch.pokemonTypes.join(", ")}
                    </span>
                  </div>
                )}
                {previewCard.tcgMatch.hp && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">HP</span>
                    <span className="font-medium">{previewCard.tcgMatch.hp}</span>
                  </div>
                )}
                {previewCard.tcgMatch.rarity && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rarity</span>
                    <span className="font-medium">{previewCard.tcgMatch.rarity}</span>
                  </div>
                )}
                {previewCard.tcgMatch.flavorText && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-slate-600 italic">
                      {previewCard.tcgMatch.flavorText}
                    </p>
                  </div>
                )}
                {previewCard.suggestion.correctName && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <span className="text-yellow-700 text-xs font-semibold">Suggested correction: </span>
                    <span className="text-yellow-800">{previewCard.suggestion.correctName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
