// Formatting and helpers shared by Dashboard, Analytics and Reports.

export const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "90d", label: "90 days" },
  { id: "this_year", label: "This year" },
  { id: "12m", label: "12 months" },
  { id: "all", label: "All time" },
];

export const ORDER_STATUS = {
  0: { label: "Processing", color: "#0891b2" },
  1: { label: "Completed", color: "#059669" },
  2: { label: "On hold", color: "#d97706" },
  3: { label: "Cancelled", color: "#ed2626" },
  4: { label: "Refunded", color: "#64748b" },
};

export const COLORS = {
  income: "#0891b2",
  store: "#0891b2",
  course: "#7c3aed",
  expenses: "#ed2626",
  profit: "#059669",
  orders: "#d97706",
};

export const taka = (v, digits = 0) =>
  `৳${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** ৳1.2L / ৳35k style for chart axes (Bangladesh uses lakh). */
export const shortTaka = (v) => {
  const n = Number(v || 0);
  const a = Math.abs(n);
  if (a >= 1e7) return `৳${(n / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `৳${(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `৳${(n / 1e3).toFixed(0)}k`;
  return `৳${n}`;
};

export const num = (v) => Number(v || 0).toLocaleString("en-IN");

/** % change vs the previous period, or null when there is nothing to compare. */
export const change = (now, before) => {
  const a = Number(now || 0);
  const b = Number(before || 0);
  if (!b) return a ? null : 0;
  return ((a - b) / Math.abs(b)) * 100;
};

export const rangeQuery = ({ preset, from, to, group }) => {
  const p = new URLSearchParams();
  if (from && to) {
    p.set("from", from);
    p.set("to", to);
  } else {
    p.set("preset", preset || "30d");
  }
  if (group) p.set("group", group);
  return `/reports/overview?${p.toString()}`;
};

export const rangeLabel = (range) => {
  if (!range) return "";
  const f = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return range.from === range.to ? f(range.from) : `${f(range.from)} – ${f(range.to)}`;
};

export const ago = (iso) => {
  if (!iso) return "";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
};

/** Rows of objects → CSV download (Excel opens it). */
export const downloadCsv = (filename, columns, rows) => {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(c.csv ? c.csv(r) : r[c.key])).join(","))];
  // Byte-order mark so Excel reads ৳ and Bangla text as UTF-8.
  const blob = new Blob(["﻿", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
