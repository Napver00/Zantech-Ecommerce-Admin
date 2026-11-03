import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal } from "react-bootstrap";
import { FaArrowLeft, FaPen, FaPlus, FaPrint, FaTrash, FaBan, FaUndo, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import confirmDialog from "../../utils/confirmDialog";
import usePageTitle from "../../hooks/usePageTitle";
import { Pill } from "../../components/List/List";
import { taka, shortDate, timeAgo } from "../../components/List/format";
import { printCustomInvoice, LINE_TYPE_LABEL } from "../../components/CustomInvoiceDocument";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "../Customers/CustomerDetail.css";
import "./CustomInvoices.css";

export const STATUS = {
  due: { label: "Unpaid", tone: "warn" },
  partial: { label: "Advance paid", tone: "info" },
  paid: { label: "Paid", tone: "good" },
  void: { label: "Void", tone: "muted" },
};
const METHODS = ["Cash", "bKash", "Nagad", "Bank transfer", "Cheque"];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const ViewCustomInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: "", method: "Cash", trx_id: "", paid_on: today(), note: "" });
  const [saving, setSaving] = useState(false);
  usePageTitle(inv ? inv.invoice_no : "Invoice");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/custom-invoices/${id}`);
      setInv(res.data.data);
    } catch {
      toast.error("Couldn't find that invoice");
      navigate("/custom-invoices");
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (!inv) return <Loading />;

  const total = Number(inv.total);
  const paid = Number(inv.paid_amount);
  const due = Number(inv.due_amount);
  const isVoid = inv.status === "void";
  const status = STATUS[inv.status] || STATUS.due;
  const overdue = !isVoid && due > 0 && inv.due_date && inv.due_date.slice(0, 10) < today();

  const openPay = () => {
    setPay({ amount: due > 0 ? String(due) : "", method: "Cash", trx_id: "", paid_on: today(), note: paid > 0 ? "" : "Advance" });
    setPayOpen(true);
  };

  const savePayment = async (e) => {
    e.preventDefault();
    const amount = Number(pay.amount);
    if (!(amount > 0)) {
      toast.error("Enter how much was paid.");
      return;
    }
    if (amount > due + 0.005 && !(await confirmDialog(`That's ${taka(amount - due)} more than what's due. Record it anyway?`))) return;
    setSaving(true);
    try {
      const res = await axiosInstance.post(`/custom-invoices/${id}/payments`, { ...pay, amount, trx_id: pay.trx_id || null, note: pay.note || null });
      setInv(res.data.data);
      setPayOpen(false);
      toast.success(res.data.data.status === "paid" ? "Paid in full. Added to Income." : `${taka(amount)} recorded. Added to Income.`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat()[0] : err.response?.data?.message || "Couldn't record the payment");
    } finally {
      setSaving(false);
    }
  };

  const removePayment = async (p) => {
    if (!(await confirmDialog(`Remove the ${taka(p.amount)} payment from ${shortDate(p.paid_on)}? Income in the account site goes down by the same amount.`))) return;
    try {
      const res = await axiosInstance.delete(`/custom-invoices/${id}/payments/${p.id}`);
      setInv(res.data.data);
      toast.success("Payment removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove it");
    }
  };

  const toggleVoid = async () => {
    const msg = isVoid
      ? "Restore this invoice? Its payments count as income again."
      : `Void ${inv.invoice_no}? It stays here for the record, but its ${taka(paid)} paid is taken off Income in the account site.`;
    if (!(await confirmDialog(msg))) return;
    try {
      const res = await axiosInstance.patch(`/custom-invoices/${id}/void`, { void: !isVoid });
      setInv(res.data.data);
      toast.success(isVoid ? "Invoice restored" : "Invoice voided");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't change it");
    }
  };

  const print = () => {
    if (!printCustomInvoice(inv)) toast.error("Your browser blocked the print window. Allow pop-ups for this site.");
  };

  return (
    <div className="cd-page">
      <button type="button" className="cd-back" onClick={() => navigate("/custom-invoices")}>
        <FaArrowLeft aria-hidden="true" /> Custom invoices
      </button>

      <header className="cd-head">
        <div className="cd-head-text">
          <h1>{inv.invoice_no} <Pill tone={overdue ? "bad" : status.tone}>{overdue ? "Overdue" : status.label}</Pill></h1>
          <p>
            {inv.title}{inv.project_name ? ` · ${inv.project_name}` : ""} · issued {shortDate(inv.issue_date)}
            {inv.due_date ? ` · pay by ${shortDate(inv.due_date)}` : ""}
          </p>
        </div>
        <div className="cd-head-actions">
          <Button variant="outline-secondary" onClick={print}><FaPrint className="me-2" aria-hidden="true" />Print / PDF</Button>
          {!isVoid && <Button variant="outline-secondary" onClick={() => navigate(`/custom-invoices/${id}/edit`)}><FaPen className="me-2" aria-hidden="true" />Edit</Button>}
          {!isVoid && due > 0 && <Button onClick={openPay}><FaPlus className="me-2" aria-hidden="true" />Record payment</Button>}
        </div>
      </header>

      <dl className="cd-stats">
        <div><dt>Total</dt><dd>{taka(total)}</dd></div>
        <div><dt>Paid</dt><dd>{taka(paid)}</dd>{inv.payments?.length > 0 && <span className="cd-stat-note">{inv.payments.length} {inv.payments.length === 1 ? "payment" : "payments"}</span>}</div>
        <div className={due > 0 && !isVoid ? "is-due" : ""}><dt>Still due</dt><dd>{isVoid ? "—" : due > 0 ? taka(due) : "Nothing"}</dd></div>
      </dl>

      <div className="cd-body">
        <section className="cd-card" aria-labelledby="cv-lines-title">
          <div className="cd-card-head"><h2 id="cv-lines-title">Lines <span className="ed-count">{inv.items?.length || 0}</span></h2></div>
          <div className="cv-table-wrap">
            <table className="cv-lines-view">
              <thead>
                <tr><th>Item</th><th className="num">Qty</th><th className="num">Price each</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {(inv.items || []).map((l, i) => (
                  <tr key={i}>
                    <td>
                      <span className="cv-type-tag">{LINE_TYPE_LABEL[l.type] || l.type}</span>
                      <span className="d-block fw-semibold">{l.name}</span>
                      {l.description && <span className="cv-desc">{l.description}</span>}
                    </td>
                    <td className="num">{Number(l.quantity).toLocaleString()}</td>
                    <td className="num">{taka(l.unit_price)}</td>
                    <td className="num">{taka(Number(l.quantity) * Number(l.unit_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="cv-totals">
            <div><dt>Subtotal</dt><dd>{taka(inv.subtotal)}</dd></div>
            {Number(inv.discount_amount) > 0 && <div><dt>Discount{inv.discount_type === "percent" ? ` (${Number(inv.discount_value)}%)` : ""}</dt><dd>−{taka(inv.discount_amount)}</dd></div>}
            {Number(inv.extra_amount) > 0 && <div><dt>{inv.extra_label || "Other charges"}</dt><dd>{taka(inv.extra_amount)}</dd></div>}
            <div className="is-total"><dt>Total</dt><dd>{taka(total)}</dd></div>
          </dl>
          {inv.note && <div className="cv-text"><strong>Note</strong>{inv.note}</div>}
          {inv.terms && <div className="cv-text"><strong>Terms</strong>{inv.terms}</div>}
        </section>

        <aside className="cd-side">
          <section className="cd-card" aria-labelledby="cv-pay-title">
            <div className="cd-card-head">
              <h2 id="cv-pay-title">Payments</h2>
              {!isVoid && due > 0 && <Button size="sm" variant="outline-primary" onClick={openPay}><FaPlus className="me-1" aria-hidden="true" />Add</Button>}
            </div>
            {total > 0 && <div className="cv-progress" role="img" aria-label={`${Math.round((paid / total) * 100)}% paid`}><span style={{ width: `${Math.min(100, (paid / total) * 100)}%` }} /></div>}
            {inv.payments?.length ? (
              <ul className="cv-payments">
                {inv.payments.map((p) => (
                  <li key={p.id}>
                    <div>
                      <span className="ls-money d-block">{taka(p.amount)}</span>
                      <span className="text-muted">
                        {shortDate(p.paid_on)}{p.method ? ` · ${p.method}` : ""}{p.trx_id ? ` · ${p.trx_id}` : ""}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                      {p.creator?.name && <span className="d-block small text-muted">by {p.creator.name}, {timeAgo(p.created_at)}</span>}
                    </div>
                    {!isVoid && (
                      <button type="button" className="cd-icon-btn" onClick={() => removePayment(p)} aria-label={`Remove the ${taka(p.amount)} payment`}><FaTrash aria-hidden="true" /></button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cd-empty">Nothing paid yet. Record an advance when the client pays one.</p>
            )}
            <p className="cd-empty">Payments go to Income in the account site{inv.project_name ? `, under the "${inv.project_name}" R&D project` : ""}.</p>
          </section>

          <section className="cd-card" aria-labelledby="cv-client-title">
            <div className="cd-card-head"><h2 id="cv-client-title">Client</h2></div>
            <ul className="cd-contact">
              <li><strong>{inv.client_name}</strong></li>
              {inv.client_phone && <li><FaPhoneAlt aria-hidden="true" /><a href={`tel:${inv.client_phone}`}>{inv.client_phone}</a></li>}
              {inv.client_email && <li><FaEnvelope aria-hidden="true" /><a href={`mailto:${inv.client_email}`}>{inv.client_email}</a></li>}
              {inv.client_address && <li><span className="text-muted">{inv.client_address}</span></li>}
            </ul>
          </section>

          <section className="cd-card">
            <div className="cd-card-head"><h2>{isVoid ? "Voided" : "Cancel this invoice"}</h2></div>
            <p className="cd-empty">{isVoid ? "Kept for the record. Restore it to use it again." : "Void it if the work was cancelled. It stays here, and its payments come off Income."}</p>
            <div className="px-3 pb-3">
              <Button size="sm" variant={isVoid ? "outline-primary" : "outline-danger"} onClick={toggleVoid}>
                {isVoid ? <><FaUndo className="me-1" aria-hidden="true" />Restore</> : <><FaBan className="me-1" aria-hidden="true" />Void invoice</>}
              </Button>
            </div>
          </section>
        </aside>
      </div>

      <Modal show={payOpen} onHide={() => !saving && setPayOpen(false)} centered>
        <Form onSubmit={savePayment}>
          <Modal.Header closeButton><Modal.Title as="h2" className="h5 mb-0">Record a payment</Modal.Title></Modal.Header>
          <Modal.Body>
            <p className="text-muted small">{taka(due)} is still due on {inv.invoice_no}.</p>
            <Form.Group className="mb-3" controlId="cv-amount">
              <Form.Label>Amount received</Form.Label>
              <div className="ed-money">
                <span aria-hidden="true">৳</span>
                <Form.Control type="number" inputMode="decimal" min={0} step="any" value={pay.amount} onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))} autoFocus size="lg" />
              </div>
              <div className="cv-quick">
                <button type="button" onClick={() => setPay((p) => ({ ...p, amount: String(due), note: paid > 0 ? "Final payment" : p.note }))}>All due · {taka(due)}</button>
                <button type="button" onClick={() => setPay((p) => ({ ...p, amount: String(Math.round(due / 2)), note: "Advance" }))}>Half · {taka(Math.round(due / 2))}</button>
              </div>
            </Form.Group>
            <div className="row g-3">
              <Form.Group className="col-sm-6" controlId="cv-method">
                <Form.Label>Paid by</Form.Label>
                <Form.Control list="cv-methods" value={pay.method} onChange={(e) => setPay((p) => ({ ...p, method: e.target.value }))} />
                <datalist id="cv-methods">{METHODS.map((m) => <option key={m} value={m} />)}</datalist>
              </Form.Group>
              <Form.Group className="col-sm-6" controlId="cv-date">
                <Form.Label>Date received</Form.Label>
                <Form.Control type="date" max={today()} value={pay.paid_on} onChange={(e) => setPay((p) => ({ ...p, paid_on: e.target.value }))} />
              </Form.Group>
              <Form.Group className="col-sm-6" controlId="cv-trx">
                <Form.Label>Transaction ID <span className="text-muted fw-normal">(optional)</span></Form.Label>
                <Form.Control value={pay.trx_id} onChange={(e) => setPay((p) => ({ ...p, trx_id: e.target.value }))} />
              </Form.Group>
              <Form.Group className="col-sm-6" controlId="cv-note">
                <Form.Label>Note <span className="text-muted fw-normal">(optional)</span></Form.Label>
                <Form.Control value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} placeholder="e.g. Advance" maxLength={255} />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setPayOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Record payment"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewCustomInvoice;
