import React from 'react';
import { FaSearch, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './List.css';

// Building blocks for the admin's list pages: header, toolbar, search,
// status tabs, pager and status pills. Used with components/Common/CommonTable.

/** Page title, one line about the page, and the main buttons on the right. */
export const ListHeader = ({ title, subtitle, actions }) => (
  <header className="ls-head">
    <div className="ls-head-text">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="ls-head-actions">{actions}</div>}
  </header>
);

/** The card that holds tabs, filters, the table and the pager. */
export const ListCard = ({ children }) => <section className="ls-card">{children}</section>;

/** Search and filters on the left, extra controls (count, per page) on the right. */
export const ListToolbar = ({ children, end }) => (
  <div className="ls-toolbar">
    <div className="ls-toolbar-main">{children}</div>
    {end && <div className="ls-toolbar-end">{end}</div>}
  </div>
);

export const SearchBox = ({ value, onChange, placeholder = 'Search…', label, busy = false }) => (
  <div className={`ls-search ${busy ? 'is-busy' : ''}`}>
    <FaSearch className="ls-search-icon" aria-hidden="true" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label || placeholder}
    />
    {value && (
      <button type="button" className="ls-search-clear" onClick={() => onChange('')} aria-label="Clear search">
        <FaTimes />
      </button>
    )}
  </div>
);

/**
 * One-tap filters with counts, e.g. All / Processing (5) / Completed (12).
 * tabs: [{ value, label, count? }]
 */
export const FilterTabs = ({ tabs, value, onChange, label = 'Filter' }) => (
  <div className="ls-tabs" role="tablist" aria-label={label}>
    {tabs.map((t) => (
      <button
        key={t.value}
        type="button"
        role="tab"
        aria-selected={value === t.value}
        className={`ls-tab ${value === t.value ? 'is-active' : ''}`}
        onClick={() => onChange(t.value)}
      >
        {t.label}
        {t.count != null && <span className="ls-tab-count">{Number(t.count).toLocaleString()}</span>}
      </button>
    ))}
  </div>
);

/** "Showing 1–10 of 48 orders" */
export const ResultCount = ({ page = 1, perPage, total, noun = 'results' }) => {
  if (!total) return <span className="ls-count">No {noun}</span>;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <span className="ls-count">
      {total <= perPage ? `${total.toLocaleString()} ${noun}` : `${from}–${to} of ${total.toLocaleString()} ${noun}`}
    </span>
  );
};

const pageList = (current, last) => {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i && p - list[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
};

/** Previous / page numbers / next, plus how many rows per page. */
export const Pager = ({ page, lastPage, onPage, perPage, onPerPage, perPageOptions = [10, 20, 50, 100] }) => {
  if (!lastPage || (lastPage <= 1 && !onPerPage)) return null;
  return (
    <nav className="ls-pager" aria-label="Pages">
      {onPerPage ? (
        <label className="ls-perpage">
          Rows
          <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))}>
            {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      ) : <span />}
      {lastPage > 1 && (
        <div className="ls-pages">
          <button type="button" className="ls-page" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <FaChevronLeft />
          </button>
          {pageList(page, lastPage).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="ls-gap" aria-hidden="true">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`ls-page ${p === page ? 'is-current' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button type="button" className="ls-page" onClick={() => onPage(page + 1)} disabled={page >= lastPage} aria-label="Next page">
            <FaChevronRight />
          </button>
        </div>
      )}
    </nav>
  );
};

/** Coloured status label. tone: good | warn | bad | info | muted */
export const Pill = ({ tone = 'muted', children, title }) => (
  <span className={`ls-pill is-${tone}`} title={title}>{children}</span>
);
