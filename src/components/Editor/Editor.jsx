import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaCheck, FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import "./Editor.css";

// Building blocks for the long admin forms (course, product, post):
// a page header, sections with a jump list on the side, inline field
// errors, and a save bar that stays at the bottom of the screen.

// ─── Unsaved changes ─────────────────────────────────────────────────────────

const snapshotReplacer = (_key, value) => (value instanceof File ? `file:${value.name}:${value.size}` : value);

const LEAVE_MESSAGE = "Leave this page? Your unsaved changes will be lost.";

/** True when this click would take the user to another page of the admin. */
const leavesPage = (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return false;
  if (event.target.closest(".page-trail-back, [data-leaves-page]")) return true;
  const link = event.target.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return false;
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && url.pathname !== window.location.pathname;
};

/**
 * Compares the form with how it looked once it finished loading (or was last
 * saved). While there are unsaved changes, closing or reloading the tab and
 * clicking away to another admin page (sidebar, breadcrumb, Back) all ask first.
 */
export const useUnsavedChanges = (value, ready = true) => {
  const snapshot = useMemo(() => JSON.stringify(value, snapshotReplacer), [value]);
  const [baseline, setBaseline] = useState(null);

  useEffect(() => {
    if (ready && baseline === null) setBaseline(snapshot);
  }, [ready, baseline, snapshot]);

  const dirty = baseline !== null && snapshot !== baseline;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    // Runs before React Router's own click handling, so a "Stay" stops the navigation.
    const guard = (e) => {
      if (leavesPage(e) && !window.confirm(LEAVE_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, [dirty]);

  const markSaved = useCallback(() => setBaseline(snapshot), [snapshot]);
  return { dirty, markSaved };
};

/**
 * Latest HTML from a Jodit rich-text editor ref, or undefined if it can't be
 * read (the editor saves on blur, so the form state can lag behind typing).
 */
export const editorHtml = (ref) => {
  try {
    const value = ref.current?.value;
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
};

// ─── Errors ──────────────────────────────────────────────────────────────────

/** Scroll to the first field with an error (in `order`) and put the cursor in it. */
export const showFirstError = (errors, order = []) => {
  const key = order.find((k) => errors[k]) || Object.keys(errors)[0];
  if (!key) return;
  const el = document.querySelector(`[data-field="${key}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = el.querySelector("input:not([type=hidden]), textarea, select, [contenteditable=true]");
  if (input) setTimeout(() => input.focus({ preventScroll: true }), 350);
};

/** A labelled field. An error marks the inputs inside it and shows the message under them. */
export const Field = ({ name, label, required, help, error, className = "", children, labelFor }) => (
  <div className={`ed-field ${error ? "has-error" : ""} ${className}`} data-field={name}>
    {label && (
      <label className="ed-label" htmlFor={labelFor}>
        {label}
        {required && <span className="ed-required" aria-hidden="true">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="ed-error" role="alert">{error}</p>
    ) : (
      help && <p className="ed-hint">{help}</p>
    )}
  </div>
);

// ─── Page and sections ───────────────────────────────────────────────────────

/** Page header with a back link, title, a status line and actions. */
export const EditorPage = ({ back, title, meta, actions, nav, children, footer, wide = false, railFirst = false }) => (
  <div className={`ed-page ${wide ? "is-wide" : ""}`}>
    <header className="ed-head">
      {back && (
        <button type="button" className="ed-back" onClick={back.onClick}>
          <FaArrowLeft aria-hidden="true" /> {back.label}
        </button>
      )}
      <div className="ed-head-row">
        <div className="ed-head-text">
          <h1>{title}</h1>
          {meta && <div className="ed-meta">{meta}</div>}
        </div>
        {actions && <div className="ed-head-actions">{actions}</div>}
      </div>
    </header>
    {/* railFirst: on narrow screens the side panel shows above the content instead of hiding */}
    <div className={`ed-body ${nav ? "has-nav" : ""} ${railFirst ? "rail-first" : ""}`}>
      <div className="ed-main">{children}</div>
      {nav && <aside className="ed-rail">{nav}</aside>}
    </div>
    {footer}
  </div>
);

export const EditorSection = ({ id, title, help, count, optional, actions, children }) => (
  <section id={id} className="ed-section" aria-labelledby={`${id}-title`}>
    <div className="ed-section-head">
      <div className="ed-section-titles">
        <h2 id={`${id}-title`} tabIndex={-1}>
          {title}
          {count != null && <span className="ed-count">{count}</span>}
          {optional && <span className="ed-optional">Optional</span>}
        </h2>
        {help && <p className="ed-section-help">{help}</p>}
      </div>
      {actions && <div className="ed-section-actions">{actions}</div>}
    </div>
    <div className="ed-section-body">{children}</div>
  </section>
);

/** Which section is at the top of the screen right now. */
const useActiveSection = (ids) => {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join("|");

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length || typeof IntersectionObserver === "undefined") return undefined;
    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
        const first = ids.find((id) => visible.get(id) != null);
        if (first) setActive(first);
      },
      { rootMargin: "-80px 0px -55% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
};

const goToSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.querySelector("h2")?.focus({ preventScroll: true });
};

/**
 * Jump list for the sections, each marked filled in, empty or needing
 * attention. sections: [{ id, label, state: "done" | "empty" | "error" }]
 */
export const SectionNav = ({ sections, children }) => {
  const active = useActiveSection(sections.map((s) => s.id));
  const done = sections.filter((s) => s.state === "done").length;

  return (
    <div className="ed-nav-wrap">
      <nav className="ed-nav" aria-label="Sections of this form">
        <div className="ed-nav-head">
          <span>On this page</span>
          <span className="ed-nav-progress">{done} of {sections.length} filled in</span>
        </div>
        <div className="ed-nav-bar" aria-hidden="true">
          <span style={{ width: `${(done / Math.max(1, sections.length)) * 100}%` }} />
        </div>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`ed-nav-item is-${s.state} ${active === s.id ? "is-active" : ""}`}
                aria-current={active === s.id ? "location" : undefined}
                onClick={() => goToSection(s.id)}
              >
                <span className="ed-nav-mark" aria-hidden="true">
                  {s.state === "done" ? <FaCheck /> : s.state === "error" ? "!" : null}
                </span>
                <span className="ed-nav-label">{s.label}</span>
                {s.state === "error" && <span className="visually-hidden"> (needs attention)</span>}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {children}
    </div>
  );
};

// ─── Save bar ────────────────────────────────────────────────────────────────

/**
 * Stays at the bottom of the screen: what state the form is in, and the
 * Save button always one click away.
 */
export const SaveBar = ({
  formId,
  dirty,
  saving,
  errorCount = 0,
  onShowErrors,
  onDiscard,
  saveLabel = "Save changes",
  savingLabel = "Saving…",
  cleanText = "All changes saved",
  dirtyText = "You have unsaved changes",
  secondary,
}) => {
  const state = errorCount ? "error" : dirty ? "dirty" : "clean";
  return (
    <div className={`ed-savebar is-${state}`}>
      <div className="ed-savebar-inner">
        <div className="ed-savebar-status" role="status" aria-live="polite">
          <span className="ed-dot" aria-hidden="true" />
          {errorCount ? (
            <>
              <span>
                {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention
              </span>
              {onShowErrors && (
                <button type="button" className="ed-savebar-link" onClick={onShowErrors}>
                  Show me
                </button>
              )}
            </>
          ) : (
            <span>{dirty ? dirtyText : cleanText}</span>
          )}
        </div>
        <div className="ed-savebar-actions">
          {secondary}
          {onDiscard && dirty && (
            <Button type="button" variant="link" className="ed-discard" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
          )}
          <Button type="submit" form={formId} className="ed-save" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {savingLabel}
              </>
            ) : (
              saveLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Inputs ──────────────────────────────────────────────────────────────────

/** Pick one of a few options, shown side by side with a short explanation each. */
export const ChoiceGroup = ({ name, value, options, onChange, columns }) => (
  <div
    className="ed-choices"
    role="radiogroup"
    style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
  >
    {options.map((o) => (
      <label key={o.value} className={`ed-choice ${value === o.value ? "is-selected" : ""}`}>
        <input
          type="radio"
          name={name}
          value={o.value}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
        />
        <span className="ed-choice-text">
          <strong>{o.label}</strong>
          {o.hint && <small>{o.hint}</small>}
        </span>
      </label>
    ))}
  </div>
);

/** Image picker with drag and drop, a preview, and replace / remove. */
export const ImageDrop = ({ id, preview, currentUrl, onFile, onRemove, hint = "JPG, PNG or WebP, up to 2 MB", accept = "image/jpeg,image/png,image/gif,image/webp", aspect = "16 / 9" }) => {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const shown = preview || currentUrl;

  const take = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`ed-drop ${over ? "is-over" : ""} ${shown ? "has-image" : ""}`}
      style={{ aspectRatio: aspect }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="visually-hidden"
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
      />
      {shown ? (
        <>
          <img src={shown} alt="" />
          <div className="ed-drop-tools">
            {preview && <span className="ed-drop-badge">New, saves with the form</span>}
            <button type="button" onClick={() => inputRef.current?.click()}>Replace</button>
            {onRemove && preview && (
              <button type="button" onClick={onRemove} aria-label="Undo new image"><FaTimes /></button>
            )}
          </div>
        </>
      ) : (
        <button type="button" className="ed-drop-empty" onClick={() => inputRef.current?.click()}>
          <FaCloudUploadAlt aria-hidden="true" />
          <strong>Drop an image here or choose a file</strong>
          <small>{hint}</small>
        </button>
      )}
    </div>
  );
};

/** Comma-separated tags with a live preview of how they split. */
export const TagsField = ({ value, onChange, placeholder = "e.g. Arduino, Robotics, IoT" }) => {
  const tags = value.split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <>
      <input className="form-control" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {tags.length > 0 && (
        <div className="ed-tags" aria-label="Tags">
          {tags.map((t, i) => <span key={`${t}-${i}`} className="ed-tag">{t}</span>)}
        </div>
      )}
    </>
  );
};
