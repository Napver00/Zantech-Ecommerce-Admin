import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { FaPlus, FaTrash, FaCheck, FaAlignLeft } from "react-icons/fa";
import AsyncSelect from "react-select/async";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import Loading from "../../components/Loading";
import { EditorPage, EditorSection, Field, ChoiceGroup, SaveBar, showFirstError, useUnsavedChanges } from "../../components/Editor/Editor";
import { LINE_TYPE_LABEL } from "../../components/CustomInvoiceDocument";
import { taka } from "../../components/List/format";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "../Orders/CreateOrder.css";
import "./CustomInvoices.css";

const FORM_ID = "custom-invoice-form";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const blankLine = (key) => ({ key, type: "equipment", name: "", description: "", showDesc: false, quantity: "1", unit_price: "" });
const nextKey = (lines) => Math.max(0, ...lines.map((l) => l.key)) + 1;

const emptyForm = () => ({
  title: "",
  project_name: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  client_address: "",
  issue_date: today(),
  due_date: "",
  lines: [blankLine(1)],
  discount_type: "flat",
  discount_value: "",
  extra_label: "",
  extra_amount: "",
  note: "",
  terms: "",
});

const fromInvoice = (inv) => ({
  title: inv.title || "",
  project_name: inv.project_name || "",
  client_name: inv.client_name || "",
  client_phone: inv.client_phone || "",
  client_email: inv.client_email || "",
  client_address: inv.client_address || "",
  issue_date: String(inv.issue_date || today()).slice(0, 10),
  due_date: inv.due_date ? String(inv.due_date).slice(0, 10) : "",
  lines: (inv.items || []).map((l, i) => ({
    key: i + 1,
    type: l.type || "other",
    name: l.name || "",
    description: l.description || "",
    showDesc: !!l.description,
    quantity: String(l.quantity ?? 1),
    unit_price: String(l.unit_price ?? ""),
  })),
  discount_type: inv.discount_type || "flat",
  discount_value: Number(inv.discount_value) ? String(Number(inv.discount_value)) : "",
  extra_label: inv.extra_label || "",
  extra_amount: Number(inv.extra_amount) ? String(Number(inv.extra_amount)) : "",
  note: inv.note || "",
  terms: inv.terms || "",
});

const lineAmount = (l) => (Number(l.quantity) || 0) * (Number(l.unit_price) || 0);

const loadProducts = async (q) => {
  try {
    const res = await axiosInstance.get("/products", { params: { search: q, limit: 20 } });
    return (res.data?.data || []).map((p) => ({ value: p.id, label: p.name, price: Number(p.price) || 0 }));
  } catch {
    return [];
  }
};

const CustomInvoiceEditor = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loaded, setLoaded] = useState(!isEdit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const focusKey = useRef(null);
  const { dirty, markSaved } = useUnsavedChanges(form, loaded);
  usePageTitle(isEdit ? `Edit ${invoice?.invoice_no || "invoice"}` : "New custom invoice");

  useEffect(() => {
    if (!isEdit) return;
    axiosInstance
      .get(`/custom-invoices/${id}`)
      .then((res) => {
        setInvoice(res.data.data);
        setForm(fromInvoice(res.data.data));
        setLoaded(true);
      })
      .catch(() => {
        toast.error("Couldn't find that invoice");
        navigate("/custom-invoices");
      });
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (focusKey.current == null) return;
    document.getElementById(`ci-name-${focusKey.current}`)?.focus();
    focusKey.current = null;
  });

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };
  const setLine = (key, patch) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
    if (errors.lines) setErrors((e) => ({ ...e, lines: null }));
  };
  const addLine = (preset = {}) =>
    setForm((f) => {
      const blank = f.lines.find((l) => !l.name && !l.unit_price);
      if (preset.name && blank) {
        return { ...f, lines: f.lines.map((l) => (l === blank ? { ...l, ...preset } : l)) };
      }
      const line = { ...blankLine(nextKey(f.lines)), ...preset };
      if (!preset.name) focusKey.current = line.key;
      return { ...f, lines: [...f.lines, line] };
    });
  const removeLine = (key) => setForm((f) => ({ ...f, lines: f.lines.length > 1 ? f.lines.filter((l) => l.key !== key) : [blankLine(nextKey(f.lines))] }));

  // Same sums as the server.
  const filled = form.lines.filter((l) => l.name.trim());
  const subtotal = filled.reduce((s, l) => s + lineAmount(l), 0);
  const dv = Number(form.discount_value) || 0;
  const discount = form.discount_type === "percent" ? (subtotal * Math.min(100, dv)) / 100 : Math.min(subtotal, dv);
  const extra = Number(form.extra_amount) || 0;
  const total = Math.max(0, subtotal - discount + extra);
  const paid = Number(invoice?.paid_amount) || 0;

  const order = ["client_name", "title", "lines", "due_date", "discount_value"];

  const validate = () => {
    const e = {};
    if (!form.client_name.trim()) e.client_name = "Who is the invoice for?";
    if (!form.title.trim()) e.title = "Say what the invoice is for, e.g. Line-follower robot prototype.";
    const half = form.lines.find((l) => (l.name.trim() || l.unit_price) && !(l.name.trim() && l.unit_price !== "" && Number(l.quantity) > 0));
    if (half) e.lines = "Each line needs a name, a quantity and a price, or remove it.";
    else if (!filled.length) e.lines = "Add at least one line.";
    if (form.due_date && form.due_date < form.issue_date) e.due_date = "The due date can't be before the issue date.";
    if (form.discount_type === "percent" && dv > 100) e.discount_value = "A percentage can't be over 100.";
    if (form.client_email && !/^\S+@\S+\.\S+$/.test(form.client_email)) e.client_email = "That doesn't look like an email address.";
    return e;
  };

  const save = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      showFirstError(e, order);
      return;
    }
    const body = {
      title: form.title.trim(),
      project_name: form.project_name.trim() || null,
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim() || null,
      client_email: form.client_email.trim() || null,
      client_address: form.client_address.trim() || null,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      items: filled.map((l) => ({
        type: l.type,
        name: l.name.trim(),
        description: l.description.trim() || null,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
      })),
      discount_type: form.discount_type,
      discount_value: dv,
      extra_label: form.extra_label.trim() || null,
      extra_amount: extra,
      note: form.note.trim() || null,
      terms: form.terms.trim() || null,
    };
    setSaving(true);
    try {
      const res = isEdit
        ? await axiosInstance.put(`/custom-invoices/${id}`, body)
        : await axiosInstance.post("/custom-invoices", body);
      markSaved();
      toast.success(isEdit ? "Invoice saved" : `Invoice ${res.data.data.invoice_no} created`);
      setSaving(false);
      navigate(`/custom-invoices/${res.data.data.id}`, { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      toast.error(apiErrors ? Object.values(apiErrors).flat()[0] : err.response?.data?.message || "Couldn't save the invoice");
      setSaving(false);
    }
  };

  if (!loaded) return <Loading />;

  const summary = (
    <div className="co-summary">
      <h2 className="co-summary-title">Invoice total</h2>
      <dl className="co-totals">
        <div><dt>{filled.length} {filled.length === 1 ? "line" : "lines"}</dt><dd>{taka(subtotal)}</dd></div>
        {discount > 0 && <div className="is-discount"><dt>Discount{form.discount_type === "percent" ? ` ${dv}%` : ""}</dt><dd>−{taka(discount)}</dd></div>}
        {extra > 0 && <div><dt>{form.extra_label || "Other charges"}</dt><dd>{taka(extra)}</dd></div>}
        <div className="is-total"><dt>Total</dt><dd>{taka(total)}</dd></div>
        {paid > 0 && <div><dt>Already paid</dt><dd>{taka(paid)}</dd></div>}
        {paid > 0 && <div><dt>Will be due</dt><dd>{taka(Math.max(0, total - paid))}</dd></div>}
      </dl>
      <p className="co-paynote">Payments and advances are recorded on the invoice after saving. They go to Income in the account site.</p>
      <ul className="co-checklist">
        <li className={form.client_name.trim() ? "is-done" : ""}><FaCheck aria-hidden="true" /> Client</li>
        <li className={form.title.trim() ? "is-done" : ""}><FaCheck aria-hidden="true" /> What it's for</li>
        <li className={filled.length ? "is-done" : ""}><FaCheck aria-hidden="true" /> At least one line</li>
      </ul>
    </div>
  );

  return (
    <div className="co-page">
      <EditorPage
        back={{ label: "Custom invoices", onClick: () => navigate(isEdit ? `/custom-invoices/${id}` : "/custom-invoices") }}
        title={isEdit ? `Edit ${invoice.invoice_no}` : "New custom invoice"}
        meta={isEdit ? `${invoice.client_name} · ${invoice.title}` : "For R&D projects, equipment, software and services. The invoice number is given when you save."}
        nav={summary}
        footer={
          <SaveBar
            formId={FORM_ID}
            dirty={dirty}
            saving={saving}
            errorCount={Object.values(errors).filter(Boolean).length}
            onShowErrors={() => showFirstError(errors, order)}
            saveLabel={isEdit ? `Save · ${taka(total)}` : `Create invoice · ${taka(total)}`}
            savingLabel="Saving…"
            cleanText={isEdit ? "No changes" : "Start with the client"}
            dirtyText={`${filled.length} ${filled.length === 1 ? "line" : "lines"} · ${taka(total)}`}
          />
        }
      >
        <Form id={FORM_ID} onSubmit={save} noValidate>
          <EditorSection id="client" title="Bill to">
            <div className="ed-grid co-grid-2">
              <Field name="client_name" label="Client" required error={errors.client_name} labelFor="ci-client">
                <Form.Control id="ci-client" value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Person, company or institution" />
              </Field>
              <Field name="client_phone" label="Phone" labelFor="ci-phone">
                <Form.Control id="ci-phone" type="tel" value={form.client_phone} onChange={(e) => set("client_phone", e.target.value)} placeholder="01XXXXXXXXX" />
              </Field>
              <Field name="client_email" label="Email" error={errors.client_email} labelFor="ci-email">
                <Form.Control id="ci-email" type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} />
              </Field>
              <Field name="client_address" label="Address" labelFor="ci-address">
                <Form.Control id="ci-address" value={form.client_address} onChange={(e) => set("client_address", e.target.value)} />
              </Field>
            </div>
          </EditorSection>

          <EditorSection id="project" title="What it's for">
            <div className="ed-grid co-grid-2">
              <Field name="title" label="Invoice title" required error={errors.title} labelFor="ci-title" className="co-span-full">
                <Form.Control id="ci-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Smart irrigation prototype, phase 1" />
              </Field>
              <Field name="project_name" label="R&D project" labelFor="ci-project" help="Invoices with the same project name are grouped as one project in the account site.">
                <Form.Control id="ci-project" value={form.project_name} onChange={(e) => set("project_name", e.target.value)} placeholder="e.g. Smart irrigation" />
              </Field>
              <div className="ed-grid co-grid-2 ci-dates">
                <Field name="issue_date" label="Issued" labelFor="ci-issued">
                  <Form.Control id="ci-issued" type="date" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} />
                </Field>
                <Field name="due_date" label="Pay by" error={errors.due_date} labelFor="ci-due">
                  <Form.Control id="ci-due" type="date" min={form.issue_date} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
                </Field>
              </div>
            </div>
          </EditorSection>

          <EditorSection id="lines" title="Lines" count={filled.length || null}
            help="Anything: equipment, software licences, development hours, services. Pick a store product to fill its name and price.">
            <Field name="lines" error={errors.lines} label="Add a store product (optional)" labelFor="ci-product">
              <AsyncSelect
                inputId="ci-product"
                cacheOptions
                defaultOptions
                value={null}
                loadOptions={loadProducts}
                onChange={(o) => o && addLine({ type: "equipment", name: o.label, unit_price: String(o.price) })}
                formatOptionLabel={(o) => <span className="d-flex justify-content-between gap-3"><span className="text-truncate">{o.label}</span><span className="text-muted">{taka(o.price)}</span></span>}
                placeholder="Search products"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (b) => ({ ...b, zIndex: 1080 }), control: (b) => ({ ...b, minHeight: 44 }) }}
              />
            </Field>

            <ol className="cv-lines">
              {form.lines.map((l, i) => (
                <li key={l.key} className="cv-line">
                  <span className="cv-line-no" aria-hidden="true">{i + 1}</span>
                  <div className="cv-line-main">
                    <div className="cv-line-top">
                      <Form.Select value={l.type} onChange={(e) => setLine(l.key, { type: e.target.value })} aria-label={`Line ${i + 1} type`} className="cv-type">
                        {Object.entries(LINE_TYPE_LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                      </Form.Select>
                      <Form.Control id={`ci-name-${l.key}`} value={l.name} onChange={(e) => setLine(l.key, { name: e.target.value })}
                        placeholder={l.type === "software" ? "e.g. Firmware development" : l.type === "service" ? "e.g. On-site installation" : "e.g. ESP32 dev board"}
                        aria-label={`Line ${i + 1} name`} />
                    </div>
                    {l.showDesc ? (
                      <Form.Control as="textarea" rows={2} className="mt-2" value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })}
                        placeholder="Details shown under the name on the invoice" aria-label={`Line ${i + 1} details`} />
                    ) : (
                      <button type="button" className="cv-add-desc" onClick={() => setLine(l.key, { showDesc: true })}>
                        <FaAlignLeft aria-hidden="true" /> Add details
                      </button>
                    )}
                    <div className="cv-line-nums">
                      <label>
                        <span>Qty</span>
                        <Form.Control type="number" inputMode="decimal" min={0} step="any" value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} aria-label={`Line ${i + 1} quantity`} />
                      </label>
                      <label>
                        <span>Price each</span>
                        <div className="ed-money">
                          <span aria-hidden="true">৳</span>
                          <Form.Control type="number" inputMode="decimal" min={0} step="any" value={l.unit_price} onChange={(e) => setLine(l.key, { unit_price: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter" && i === form.lines.length - 1) { e.preventDefault(); addLine(); } }}
                            placeholder="0" aria-label={`Line ${i + 1} price each`} />
                        </div>
                      </label>
                      <span className="cv-line-amount">{taka(lineAmount(l))}</span>
                    </div>
                  </div>
                  <button type="button" className="co-remove" onClick={() => removeLine(l.key)} aria-label={`Remove line ${i + 1}`}><FaTrash aria-hidden="true" /></button>
                </li>
              ))}
            </ol>
            <Button type="button" variant="outline-primary" size="sm" className="mt-2" onClick={() => addLine()}>
              <FaPlus className="me-1" aria-hidden="true" /> Add a line
            </Button>
          </EditorSection>

          <EditorSection id="charges" title="Discount and other charges" optional>
            <div className="ed-grid co-grid-2">
              <Field name="discount_value" label="Discount" error={errors.discount_value} labelFor="ci-discount">
                <div className="ci-discount">
                  <div className={`ed-money ${form.discount_type === "percent" ? "is-suffix" : ""}`}>
                    <span aria-hidden="true">{form.discount_type === "percent" ? "%" : "৳"}</span>
                    <Form.Control id="ci-discount" type="number" inputMode="decimal" min={0} value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} placeholder="0" />
                  </div>
                  <ChoiceGroup name="ci-discount-type" value={form.discount_type} onChange={(v) => set("discount_type", v)} columns={2}
                    options={[{ value: "flat", label: "Taka" }, { value: "percent", label: "Percent" }]} />
                </div>
              </Field>
              <Field name="extra" label="Other charge" labelFor="ci-extra" help="Delivery, installation, travel…">
                <div className="d-flex gap-2">
                  <Form.Control value={form.extra_label} onChange={(e) => set("extra_label", e.target.value)} placeholder="Name" aria-label="Charge name" />
                  <div className="ed-money" style={{ maxWidth: 150 }}>
                    <span aria-hidden="true">৳</span>
                    <Form.Control id="ci-extra" type="number" inputMode="decimal" min={0} value={form.extra_amount} onChange={(e) => set("extra_amount", e.target.value)} placeholder="0" />
                  </div>
                </div>
              </Field>
            </div>
          </EditorSection>

          <EditorSection id="notes" title="Note and terms" optional help="Both print on the invoice.">
            <div className="ed-grid co-grid-2">
              <Field name="note" label="Note to the client" labelFor="ci-note">
                <Form.Control id="ci-note" as="textarea" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. Prototype delivered with source code and wiring diagram." />
              </Field>
              <Field name="terms" label="Payment terms" labelFor="ci-terms">
                <Form.Control id="ci-terms" as="textarea" rows={3} value={form.terms} onChange={(e) => set("terms", e.target.value)} placeholder="e.g. 50% advance, rest on delivery. 6 months warranty on hardware." />
              </Field>
            </div>
          </EditorSection>

          <div className="co-summary-inline">{summary}</div>
        </Form>
      </EditorPage>
    </div>
  );
};

export default CustomInvoiceEditor;
