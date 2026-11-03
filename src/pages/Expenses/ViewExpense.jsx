import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { FaTrash, FaFilePdf, FaExternalLinkAlt, FaLock } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import confirmDialog from "../../utils/confirmDialog";
import usePageTitle from "../../hooks/usePageTitle";
import { EditorPage, EditorSection, Field, SaveBar, useUnsavedChanges } from "../../components/Editor/Editor";
import { Pill } from "../../components/List/List";
import { taka, shortDate, timeAgo } from "../../components/List/format";
import { ReceiptPicker } from "./index";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "./Expenses.css";

const toForm = (e) => ({
  date: String(e.date || "").slice(0, 10),
  title: e.title || "",
  amount: e.amount != null ? String(Number(e.amount)) : "",
  description: e.description || "",
});
const isImage = (p) => /image/i.test(p.type || "") || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(p.url || "");

const ViewExpense = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [form, setForm] = useState(null);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [notFound, setNotFound] = useState(false);
  usePageTitle(expense ? expense.title : "Expense");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/expenses/${id}`);
      const e = res.data?.data;
      setExpense(e);
      setForm(toForm(e));
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else toast.error("Couldn't load this expense");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const locked = !!expense?.challan_id;
  const { dirty, markSaved } = useUnsavedChanges({ form, files: files.map((f) => f.name) }, !!form);
  useEffect(() => { if (saveCount) markSaved(); }, [saveCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setSaveCount((c) => c + 1);
      toast.success("Expense saved");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      toast.error(apiErrors && typeof apiErrors === "object" ? Object.values(apiErrors).flat()[0] : err.response?.data?.message || "Couldn't save");
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
      navigate("/expenses");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete the expense");
    }
  };

  if (notFound) {
    return (
      <div className="py-5 text-center">
        <h1 className="h5">This expense doesn't exist</h1>
        <p className="text-muted">It may have been deleted.</p>
        <Button onClick={() => navigate("/expenses")}>Back to expenses</Button>
      </div>
    );
  }
  if (!expense || !form) return <Loading />;

  const proves = expense.proves || [];

  return (
    <EditorPage
      back={{ label: "Expenses", onClick: () => navigate("/expenses") }}
      title={expense.title}
      meta={
        <>
          <span className="ex-head-amount">{taka(expense.amount)}</span>
          <span>{shortDate(expense.date)}</span>
          {locked ? <Pill tone="info">Stock bought</Pill> : <Pill tone="muted">Expense</Pill>}
        </>
      }
      actions={!locked && <Button variant="outline-danger" onClick={remove}><FaTrash className="me-2" aria-hidden="true" />Delete</Button>}
      nav={
        <div className="ex-side">
          <dl>
            <div><dt>Added by</dt><dd>{expense.user_name || "—"}</dd></div>
            {expense.created_at && <div><dt>Added</dt><dd>{timeAgo(expense.created_at)}</dd></div>}
            {expense.updated_at && expense.updated_at !== expense.created_at && <div><dt>Last changed</dt><dd>{timeAgo(expense.updated_at)}</dd></div>}
            <div><dt>Account site</dt><dd>Sent as an expense; changes follow automatically.</dd></div>
          </dl>
        </div>
      }
      footer={<SaveBar formId="expense-form" dirty={dirty} saving={saving} onDiscard={() => { setForm(toForm(expense)); setFiles([]); setErrors({}); }} />}
    >
      <Form id="expense-form" onSubmit={save} noValidate>
        {locked && (
          <div className="ex-locked" role="note">
            <FaLock aria-hidden="true" />
            <div>
              <strong>This came from challan #{expense.challan_id}{expense.supplier_name ? ` (${expense.supplier_name})` : ""}.</strong>{" "}
              Its amount and date follow the challan, so change them there. You can still rename it and add details or receipts.
              <div><Link to={`/challans/${expense.challan_id}`}>Open challan #{expense.challan_id} <FaExternalLinkAlt aria-hidden="true" /></Link></div>
            </div>
          </div>
        )}

        <EditorSection id="ex-details" title="Details">
          <Field name="title" label="What was it for?" required error={errors.title} labelFor="ex-title">
            <Form.Control id="ex-title" value={form.title} onChange={set("title")} isInvalid={!!errors.title} />
          </Field>
          <div className="ex-grid-2">
            <Field name="amount" label="Amount" required={!locked} error={errors.amount} labelFor="ex-amount" help={locked ? "Set by the challan." : undefined}>
              <div className="ed-money">
                <span aria-hidden="true">৳</span>
                <Form.Control id="ex-amount" type="number" inputMode="decimal" min={0} step="any" value={form.amount} onChange={set("amount")} disabled={locked} isInvalid={!!errors.amount} />
              </div>
            </Field>
            <Field name="date" label="Date" required={!locked} error={errors.date} labelFor="ex-date" help={locked ? "Set by the challan." : undefined}>
              <Form.Control id="ex-date" type="date" value={form.date} onChange={set("date")} disabled={locked} isInvalid={!!errors.date} />
            </Field>
          </div>
          <Field name="description" label="Details" labelFor="ex-desc" help="Who was paid, for which month, anything worth remembering.">
            <Form.Control id="ex-desc" as="textarea" rows={4} value={form.description} onChange={set("description")} />
          </Field>
        </EditorSection>

        <EditorSection id="ex-receipts" title="Receipts" count={proves.length} help="Bills, memos or payment screenshots for this expense.">
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
            <p className="text-muted mb-3">No receipts yet.</p>
          )}
          <ReceiptPicker id="ex-more-files" files={files} onChange={setFiles} />
          {files.length > 0 && <p className="small text-muted mt-2 mb-0">New receipts upload when you save.</p>}
        </EditorSection>
      </Form>
    </EditorPage>
  );
};

export default ViewExpense;
