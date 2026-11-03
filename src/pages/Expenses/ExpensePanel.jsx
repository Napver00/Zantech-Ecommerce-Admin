import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Offcanvas, Spinner } from "react-bootstrap";
import { FaTrash, FaFilePdf, FaExternalLinkAlt, FaLock, FaUpload, FaPaperclip, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import { Pill } from "../../components/List/List";
import { taka, shortDate, timeAgo } from "../../components/List/format";

const MAX_MB = 3;
const FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

/** Pick receipts: images or PDFs, checked before upload. */
export const ReceiptPicker = ({ files, onChange, id = "ex-files" }) => {
  const ref = useRef(null);
  const add = (list) => {
    const next = [];
    [...list].forEach((f) => {
      if (!FILE_TYPES.includes(f.type)) toast.error(`${f.name}: use JPG, PNG or PDF`);
      else if (f.size > MAX_MB * 1024 * 1024) toast.error(`${f.name} is over ${MAX_MB} MB`);
      else next.push(f);
    });
    onChange([...files, ...next]);
  };
  return (
    <div className="ex-receipts-pick">
      <input ref={ref} id={id} type="file" multiple accept={FILE_TYPES.join(",")} className="visually-hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <Button type="button" variant="outline-secondary" size="sm" onClick={() => ref.current?.click()}>
        <FaUpload className="me-1" aria-hidden="true" />Add receipt
      </Button>
      <span className="text-muted small ms-2">JPG, PNG or PDF, up to {MAX_MB} MB each</span>
      {files.length > 0 && (
        <ul className="ex-file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <FaPaperclip aria-hidden="true" />
              <span className="text-truncate">{f.name}</span>
              <button type="button" onClick={() => onChange(files.filter((_, k) => k !== i))} aria-label={`Remove ${f.name}`}><FaTimes aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const toForm = (e) => ({
  date: String(e.date || "").slice(0, 10),
  title: e.title || "",
  amount: e.amount != null ? String(Number(e.amount)) : "",
  description: e.description || "",
});
const isImage = (p) => /image/i.test(p.type || "") || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(p.url || "");
const firstError = (err, fallback) => {
  const e = err.response?.data?.errors;
  return e && typeof e === "object" ? Object.values(e).flat()[0] : err.response?.data?.message || fallback;
};

/**
 * Expense details in a side panel over the Expenses list.
 * id: the expense to show (null hides the panel). onChanged runs after a save or delete.
 */
const ExpensePanel = ({ id, onClose, onChanged }) => {
  const [expense, setExpense] = useState(null);
  const [form, setForm] = useState(null);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/expenses/${id}`);
      const e = res.data?.data;
      setExpense(e);
      setForm(toForm(e));
    } catch (err) {
      if (err.response?.status === 404) setMissing(true);
      else toast.error("Couldn't load this expense");
    }
  }, [id]);

  useEffect(() => {
    setExpense(null);
    setForm(null);
    setFiles([]);
    setErrors({});
    setMissing(false);
    load();
  }, [load]);

  const locked = !!expense?.challan_id;
  const dirty = useMemo(
    () => !!expense && !!form && (files.length > 0 || JSON.stringify(form) !== JSON.stringify(toForm(expense))),
    [expense, form, files]
  );

  const close = async () => {
    if (saving) return;
    if (dirty && !(await confirmDialog({ title: "Close without saving?", message: "Your changes to this expense will be lost.", confirmLabel: "Close without saving", tone: "warning" }))) return;
    onClose();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.title.trim()) found.title = "What was it for?";
    if (!locked) {
      if (!(Number(form.amount) > 0)) found.amount = "Enter the amount spent.";
      if (!form.date) found.date = "Enter the date.";
    }
    setErrors(found);
    if (Object.keys(found).length) return;

    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    if (!locked) {
      fd.append("date", form.date);
      fd.append("amount", form.amount);
    }
    files.forEach((f) => fd.append("proves[]", f));
    setSaving(true);
    try {
      await axiosInstance.post(`/expenses/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setFiles([]);
      await load();
      onChanged?.();
      toast.success("Expense saved");
    } catch (err) {
      toast.error(firstError(err, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  const removeReceipt = async (p, n) => {
    const ok = await confirmDialog({ title: `Remove receipt ${n}?`, message: "The file is deleted from this expense.", confirmLabel: "Remove receipt", tone: "danger" });
    if (!ok) return;
    try {
      await axiosInstance.delete(`/expenses/prove/${p.id}`);
      setExpense((x) => ({ ...x, proves: x.proves.filter((q) => q.id !== p.id) }));
      onChanged?.();
      toast.success("Receipt removed");
    } catch {
      toast.error("Couldn't remove the receipt");
    }
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: `Delete "${expense.title}"?`,
      message: `${taka(expense.amount)} on ${shortDate(expense.date)} is removed here and from the account site.`,
      confirmLabel: "Delete expense",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await axiosInstance.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(firstError(err, "Couldn't delete the expense"));
    }
  };

  const proves = expense?.proves || [];

  return (
    <Offcanvas show={!!id} onHide={close} placement="end" className="ex-panel" aria-labelledby="ex-panel-title">
      <Offcanvas.Header closeButton>
        <div className="ex-panel-head">
          <Offcanvas.Title as="h2" id="ex-panel-title" className="h5 mb-1">{expense ? expense.title : missing ? "Expense not found" : "Expense"}</Offcanvas.Title>
          {expense && (
            <div className="ex-panel-meta">
              <span className="ex-head-amount">{taka(expense.amount)}</span>
              <span>{shortDate(expense.date)}</span>
              {locked ? <Pill tone="info">Stock bought</Pill> : <Pill tone="muted">Expense</Pill>}
            </div>
          )}
        </div>
      </Offcanvas.Header>

      {missing ? (
        <Offcanvas.Body><p className="text-muted">This expense doesn't exist. It may have been deleted.</p></Offcanvas.Body>
      ) : !expense || !form ? (
        <Offcanvas.Body><div className="text-center py-5"><Spinner animation="border" size="sm" /></div></Offcanvas.Body>
      ) : (
        <Form onSubmit={save} noValidate className="ex-panel-form">
          <Offcanvas.Body>
            {locked && (
              <div className="ex-locked" role="note">
                <FaLock aria-hidden="true" />
                <div>
                  <strong>From challan #{expense.challan_id}{expense.supplier_name ? ` (${expense.supplier_name})` : ""}.</strong>{" "}
                  Its amount and date follow the challan, so change them there.
                  <div><Link to={`/challans/${expense.challan_id}`}>Open challan #{expense.challan_id} <FaExternalLinkAlt aria-hidden="true" /></Link></div>
                </div>
              </div>
            )}

            <Form.Group className="mb-3" controlId="exp-title">
              <Form.Label>What was it for?</Form.Label>
              <Form.Control value={form.title} onChange={set("title")} isInvalid={!!errors.title} />
              <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
            </Form.Group>
            <div className="ex-grid-2">
              <Form.Group className="mb-3" controlId="exp-amount">
                <Form.Label>Amount</Form.Label>
                <div className="ed-money">
                  <span aria-hidden="true">৳</span>
                  <Form.Control type="number" inputMode="decimal" min={0} step="any" value={form.amount} onChange={set("amount")} disabled={locked} isInvalid={!!errors.amount} />
                </div>
                {errors.amount && <div className="invalid-feedback d-block">{errors.amount}</div>}
              </Form.Group>
              <Form.Group className="mb-3" controlId="exp-date">
                <Form.Label>Date</Form.Label>
                <Form.Control type="date" value={form.date} onChange={set("date")} disabled={locked} isInvalid={!!errors.date} />
                {errors.date && <div className="invalid-feedback d-block">{errors.date}</div>}
              </Form.Group>
            </div>
            <Form.Group className="mb-4" controlId="exp-desc">
              <Form.Label>Details <span className="text-muted fw-normal">(optional)</span></Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description} onChange={set("description")} placeholder="Who was paid, for which month…" />
            </Form.Group>

            <h3 className="ex-panel-sub">Receipts{proves.length ? ` (${proves.length})` : ""}</h3>
            {proves.length > 0 ? (
              <ul className="ex-receipt-grid">
                {proves.map((p, i) => (
                  <li key={p.id}>
                    <a href={p.url} target="_blank" rel="noreferrer" className="ex-receipt-thumb" aria-label={`Open receipt ${i + 1}`}>
                      {isImage(p) ? <img src={p.url} alt="" loading="lazy" /> : <span className="ex-receipt-pdf"><FaFilePdf aria-hidden="true" />PDF</span>}
                    </a>
                    <div className="ex-receipt-foot">
                      <span>Receipt {i + 1}</span>
                      <button type="button" onClick={() => removeReceipt(p, i + 1)} aria-label={`Remove receipt ${i + 1}`}><FaTrash aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted small mb-2">No receipts yet.</p>
            )}
            <ReceiptPicker id="exp-more-files" files={files} onChange={setFiles} />

            <dl className="tx-details ex-panel-facts">
              <div><dt>Added by</dt><dd>{expense.user_name || "—"}</dd></div>
              {expense.created_at && <div><dt>Added</dt><dd>{timeAgo(expense.created_at)}</dd></div>}
              {expense.updated_at && expense.updated_at !== expense.created_at && <div><dt>Last changed</dt><dd>{timeAgo(expense.updated_at)}</dd></div>}
              <div><dt>Account site</dt><dd>Changes follow automatically</dd></div>
            </dl>
          </Offcanvas.Body>

          <div className="ex-panel-foot">
            {!locked && (
              <Button variant="link" className="text-danger px-0 me-auto" onClick={remove} disabled={saving}>
                <FaTrash className="me-1" aria-hidden="true" />Delete
              </Button>
            )}
            {dirty && (
              <Button variant="outline-secondary" onClick={() => { setForm(toForm(expense)); setFiles([]); setErrors({}); }} disabled={saving}>Discard</Button>
            )}
            <Button type="submit" disabled={saving || !dirty}>{saving ? "Saving…" : files.length ? `Save and upload ${files.length}` : "Save changes"}</Button>
          </div>
        </Form>
      )}
    </Offcanvas>
  );
};

export default ExpensePanel;
