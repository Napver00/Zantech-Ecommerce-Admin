import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Modal, Offcanvas, Spinner } from "react-bootstrap";
import { FaMinus, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { fullDate, timeAgo } from "../../components/List/format";

// Why a count changed. The first ones cover most days.
export const REASONS = {
  add: ["New stock arrived", "Returned by customer", "Found in stock count"],
  remove: ["Damaged or broken", "Used in a workshop or class", "Given as gift or sample", "Missing in stock count"],
  set: ["Stock count"],
};

const errorText = (err, fallback) => {
  const errors = err.response?.data?.errors;
  if (errors && typeof errors === "object") return Object.values(errors).flat()[0];
  return err.response?.data?.message || fallback;
};

/**
 * − count + that saves by itself. Taps are added up and sent together after a
 * short pause, so tapping + five times is one recorded change of +5.
 */
export const QtyStepper = ({ value, unit, url, onSaved, label }) => {
  const [pending, setPending] = useState(0);
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);
  const pendingRef = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flush = async () => {
    const change = pendingRef.current;
    if (!change) return;
    pendingRef.current = 0;
    setSaving(true);
    try {
      const res = await axiosInstance.post(url, { change, reason: "Quick change" });
      setPending(0);
      onSaved(res.data?.data?.quantity);
    } catch (err) {
      setPending(0);
      toast.error(errorText(err, "Couldn't save the new count"));
    } finally {
      setSaving(false);
    }
  };

  const bump = (d) => {
    pendingRef.current += d;
    setPending(pendingRef.current);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  };

  const shown = Number(value) + pending;
  return (
    <div className={`iv-stepper ${pending ? "is-pending" : ""}`} role="group" aria-label={`Stock of ${label}`}>
      <button type="button" onClick={() => bump(-1)} disabled={saving} aria-label="One less"><FaMinus aria-hidden="true" /></button>
      <span className={`iv-count ${shown <= 0 ? "is-out" : ""}`} aria-live="polite">
        {shown}
        {unit && <small>{unit}</small>}
      </span>
      <button type="button" onClick={() => bump(1)} disabled={saving} aria-label="One more"><FaPlus aria-hidden="true" /></button>
      {(pending !== 0 || saving) && (
        <span className="iv-saving">{saving ? <Spinner animation="border" size="sm" /> : `${pending > 0 ? "+" : ""}${pending}`}</span>
      )}
    </div>
  );
};

/** Add, remove or set a counted number, with the reason. */
export const AdjustDialog = ({ target, url, onClose, onSaved }) => {
  const [mode, setMode] = useState("set");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(REASONS.set[0]);
  const [other, setOther] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setMode("set");
    setAmount("");
    setReason(REASONS.set[0]);
    setOther("");
  }, [target]);

  if (!target) return null;
  const n = parseInt(amount, 10);
  const valid = Number.isFinite(n) && n >= 0 && (mode === "set" || n > 0);
  const after = !valid ? null : mode === "set" ? n : mode === "add" ? target.quantity + n : target.quantity - n;
  const finalReason = reason === "Other" ? other.trim() || "Other" : reason;

  const pickMode = (m) => {
    setMode(m);
    setReason(REASONS[m][0]);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const body = mode === "set" ? { set_to: n } : { change: mode === "add" ? n : -n };
      const res = await axiosInstance.post(url, { ...body, reason: finalReason });
      toast.success(`${target.name}: ${res.data?.data?.quantity} now`);
      onSaved(res.data?.data?.quantity);
      onClose();
    } catch (err) {
      toast.error(errorText(err, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={() => !saving && onClose()} centered>
      <Form onSubmit={save}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5 mb-0">{target.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Now: <strong>{target.quantity}</strong> {target.unit || ""}</p>
          <div className="iv-modes" role="radiogroup" aria-label="What happened">
            {[
              ["set", "I counted it"],
              ["add", "Add"],
              ["remove", "Take away"],
            ].map(([m, text]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-active" : ""} onClick={() => pickMode(m)}>
                {text}
              </button>
            ))}
          </div>
          <Form.Group className="mt-3" controlId="iv-amount">
            <Form.Label>{mode === "set" ? "How many are there?" : mode === "add" ? "How many to add?" : "How many to take away?"}</Form.Label>
            <Form.Control type="number" inputMode="numeric" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus size="lg" />
            {after !== null && (
              <Form.Text className={after < 0 ? "text-danger" : ""}>
                {target.quantity} → <strong>{after}</strong>{after < 0 ? " (below zero)" : ""}
              </Form.Text>
            )}
          </Form.Group>
          <fieldset className="mt-3">
            <legend className="form-label fs-6">Why</legend>
            <div className="iv-reasons">
              {[...REASONS[mode], "Other"].map((r) => (
                <button key={r} type="button" className={reason === r ? "is-active" : ""} aria-pressed={reason === r} onClick={() => setReason(r)}>{r}</button>
              ))}
            </div>
            {reason === "Other" && (
              <Form.Control className="mt-2" value={other} onChange={(e) => setOther(e.target.value)} placeholder="Say what happened" maxLength={200} />
            )}
          </fieldset>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={!valid || saving}>{saving ? "Saving…" : "Save"}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

/** Every recorded change to one product or item. */
export const HistoryPanel = ({ target, type, onClose, children }) => {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!target) return;
    setRows(null);
    axiosInstance
      .get("/inventory/movements", { params: { type, id: target.id } })
      .then((res) => setRows(res.data?.data || []))
      .catch(() => setRows([]));
  }, [target, type]);

  return (
    <Offcanvas show={!!target} onHide={onClose} placement="end" className="iv-panel">
      {target && (
        <>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title as="h2" className="h5 mb-0">{target.name}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {children}
            <h3 className="iv-subtitle">Changes made here</h3>
            {rows === null ? (
              <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
            ) : rows.length ? (
              <ol className="iv-history">
                {rows.map((m) => (
                  <li key={m.id}>
                    <span className={`iv-delta ${m.change > 0 ? "is-up" : m.change < 0 ? "is-down" : ""}`}>
                      {m.change > 0 ? "+" : ""}{m.change}
                    </span>
                    <div>
                      <span className="d-block">{m.reason || "Changed"} → <strong>{m.quantity_after}</strong></span>
                      <span className="small text-muted" title={fullDate(m.created_at)}>{m.user?.name || "Someone"} · {timeAgo(m.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted small">No changes made from the Inventory page yet.{type === "product" ? " Orders and challans change the count too; see those pages." : ""}</p>
            )}
          </Offcanvas.Body>
        </>
      )}
    </Offcanvas>
  );
};
