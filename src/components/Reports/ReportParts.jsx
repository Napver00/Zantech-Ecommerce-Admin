import React, { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { ArrowDownRight, ArrowUpRight, CalendarRange, Minus, RefreshCw } from "lucide-react";
import { PRESETS, ago, change, rangeLabel } from "./reportUtils";
import "./Reports.css";

/** Preset chips + optional custom dates + refresh. Controlled by { preset, from, to }. */
export const RangeBar = ({ value, onChange, range, generatedAt, refreshing, onRefresh }) => {
  const [custom, setCustom] = useState(Boolean(value.from));
  const [from, setFrom] = useState(value.from || "");
  const [to, setTo] = useState(value.to || "");

  const applyCustom = (e) => {
    e.preventDefault();
    if (from && to && from <= to) onChange({ from, to });
  };

  return (
    <div className="rp-rangebar">
      <div className="rp-chips" role="tablist" aria-label="Date range">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={!value.from && value.preset === p.id}
            className={`rp-chip ${!value.from && value.preset === p.id ? "active" : ""}`}
            onClick={() => {
              setCustom(false);
              onChange({ preset: p.id });
            }}
          >
            {p.label}
          </button>
        ))}
        <button type="button" className={`rp-chip ${value.from || custom ? "active" : ""}`} onClick={() => setCustom((c) => !c)}>
          <CalendarRange size={14} /> Custom
        </button>
      </div>

      {custom && (
        <Form onSubmit={applyCustom} className="rp-custom">
          <Form.Control type="date" size="sm" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <span className="text-muted small">to</span>
          <Form.Control type="date" size="sm" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          <Button type="submit" size="sm" disabled={!from || !to || from > to}>Apply</Button>
        </Form>
      )}

      <div className="rp-meta">
        <span>{rangeLabel(range)}</span>
        {generatedAt && <span className="text-muted">· updated {ago(generatedAt)}</span>}
        <Button size="sm" variant="light" className="border rp-refresh" onClick={onRefresh} disabled={refreshing} title="Refresh now">
          {refreshing ? <Spinner size="sm" animation="border" /> : <RefreshCw size={14} />}
        </Button>
      </div>
    </div>
  );
};

/** Headline number with % change against the previous period. */
export const KpiCard = ({ label, value, now, before, tone = "cyan", icon: Icon, hint, invert = false, loading }) => {
  const pct = before === undefined ? undefined : change(now, before);
  const good = pct === null || pct === undefined ? null : invert ? pct <= 0 : pct >= 0;
  return (
    <div className={`rp-kpi rp-${tone}`}>
      <div className="rp-kpi-top">
        <span className="rp-kpi-label">{label}</span>
        {Icon && <span className="rp-kpi-icon"><Icon size={16} /></span>}
      </div>
      {loading ? <span className="rp-skel rp-skel-value" /> : <div className="rp-kpi-value">{value}</div>}
      <div className="rp-kpi-foot">
        {loading ? (
          <span className="rp-skel rp-skel-line" />
        ) : pct === undefined ? (
          <span className="text-muted">{hint}</span>
        ) : pct === null ? (
          <span className="text-muted">New this period</span>
        ) : (
          <>
            <span className={`rp-delta ${Math.abs(pct) < 0.5 ? "flat" : good ? "up" : "down"}`}>
              {Math.abs(pct) < 0.5 ? <Minus size={12} /> : pct > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%
            </span>
            <span className="text-muted">vs previous</span>
          </>
        )}
      </div>
    </div>
  );
};

/** Card with a title row and a body that shows a skeleton until data arrives. */
export const Panel = ({ title, subtitle, actions, loading, height = 280, children, className = "" }) => (
  <section className={`rp-panel ${className}`}>
    <header className="rp-panel-head">
      <div className="min-w-0">
        <h3 className="rp-panel-title">{title}</h3>
        {subtitle && <p className="rp-panel-sub">{subtitle}</p>}
      </div>
      {actions && <div className="rp-panel-actions">{actions}</div>}
    </header>
    <div className="rp-panel-body">{loading ? <div className="rp-skel rp-skel-block" style={{ height }} /> : children}</div>
  </section>
);

export const EmptyState = ({ children = "Nothing in this period." }) => <div className="rp-empty">{children}</div>;
