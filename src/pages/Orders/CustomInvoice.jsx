import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import AsyncSelect from "react-select/async";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import InvoiceDocument from "../../components/InvoiceDocument";
import { EditorPage, EditorSection, Field, ChoiceGroup, SaveBar, showFirstError } from "../../components/Editor/Editor";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "./CreateOrder.css";
import { taka } from "../../components/List/format";
import usePageTitle from "../../hooks/usePageTitle";

const FORM_ID = "custom-invoice-form";
// Keeps a half-written invoice in this browser, so a refresh or a wrong click doesn't lose it.
const DRAFT_KEY = "zt-custom-invoice-draft";

const blankLine = (key = 1) => ({ key, name: "", quantity: 1, price: "" });
// Line keys only need to be unique within the invoice.
const nextKeyOf = (lines) => Math.max(0, ...lines.map((l) => l.key)) + 1;
const emptyDraft = () => ({
  customer: { name: "", phone: "", address: "" },
  lines: [blankLine()],
  delivery: "",
  discountType: "flat",
  discountValue: "",
});

const readDraft = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (saved?.lines?.length) {
      saved.lines = saved.lines.map((l, i) => ({ ...l, key: i + 1 }));
      return saved;
    }
  } catch {
    /* no saved draft */
  }
  return emptyDraft();
};

const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 1080 }),
  control: (base) => ({ ...base, minHeight: 44 }),
};

const CustomInvoice = () => {
  usePageTitle("Custom invoice");
  const navigate = useNavigate();
  const [draft, setDraft] = useState(readDraft);
  const [errors, setErrors] = useState({});
  const focusKey = useRef(null);

  const { customer, lines, delivery, discountType, discountValue } = draft;

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
  }, [draft]);

  // Put the cursor in a line that was just added.
  useEffect(() => {
    if (focusKey.current == null) return;
    document.getElementById(`ci-name-${focusKey.current}`)?.focus();
    focusKey.current = null;
  });

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setCustomer = (key, value) => {
    setDraft((d) => ({ ...d, customer: { ...d.customer, [key]: value } }));
    setErrors((e) => ({ ...e, [key]: null }));
  };
  const setLine = (key, patch) => {
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
    setErrors((e) => ({ ...e, lines: null }));
  };
  const addLine = (preset = {}) => {
    setDraft((d) => {
      const line = { ...blankLine(nextKeyOf(d.lines)), ...preset };
      if (!preset.name) focusKey.current = line.key;
      // Fill an untouched blank line first instead of leaving it empty above.
      const blankIndex = d.lines.findIndex((l) => !l.name && !l.price);
      if (preset.name && blankIndex !== -1) {
        const next = [...d.lines];
        next[blankIndex] = { ...line, key: d.lines[blankIndex].key };
        return { ...d, lines: next };
      }
      return { ...d, lines: [...d.lines, line] };
    });
    setErrors((e) => ({ ...e, lines: null }));
  };
  const removeLine = (key) =>
    setDraft((d) => ({ ...d, lines: d.lines.length > 1 ? d.lines.filter((l) => l.key !== key) : [blankLine(nextKeyOf(d.lines))] }));

  const loadProducts = async (q) => {
    try {
      const r = await axiosInstance.get("/products", { params: { search: q, limit: 20 } });
      return (r.data?.data || []).map((p) => ({ value: p.id, label: p.name, price: Number(p.price) || 0 }));
    } catch {
      return [];
    }
  };

  // ─── Money ─────────────────────────────────────────────────────────────────

  const filled = lines.filter((l) => l.name.trim() && Number(l.price) > 0);
  const lineTotal = (l) => (Number(l.price) || 0) * (Number(l.quantity) || 0);
  const subtotal = filled.reduce((s, l) => s + lineTotal(l), 0);
  const deliveryCost = Math.max(0, Number(delivery) || 0);
  const rawDiscount =
    discountType === "percent" ? (subtotal * (Number(discountValue) || 0)) / 100 : Number(discountValue) || 0;
  const discount = Math.min(Math.max(0, rawDiscount), subtotal);
  const total = subtotal + deliveryCost - discount;

  // ─── Checks and print ──────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (!customer.name.trim()) e.name = "Enter who the invoice is for.";
    if (!customer.phone.trim()) e.phone = "Enter a phone number.";
    if (!customer.address.trim()) e.address = "Enter the address.";
    const half = lines.find((l) => (l.name.trim() || l.price) && !(l.name.trim() && Number(l.price) > 0));
    if (half) e.lines = "Each line needs a name and a price, or remove it.";
    else if (!filled.length) e.lines = "Add at least one item or service.";
    if (discountType === "percent" && Number(discountValue) > 100) e.discount = "A percentage discount can't be over 100.";
    return e;
  };

  const fieldOrder = ["name", "phone", "address", "lines", "discount"];
  const errorCount = Object.values(errors).filter(Boolean).length;

  const handlePrint = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      showFirstError(e, fieldOrder);
      return;
    }

    const items = filled.map((l) => ({
      name: l.name.trim(),
      quantity: Number(l.quantity) || 1,
      price: Number(l.price),
      total: lineTotal(l),
      is_bundle: 0,
    }));
    const [first, ...rest] = customer.name.trim().split(" ");
    const orderData = {
      order: {
        invoice_code: `CUSTOM-${Date.now()}`,
        created_at: new Date().toISOString(),
        item_subtotal: subtotal,
        shipping_charge: deliveryCost,
        discount,
        total_amount: total,
        user_name: customer.name.trim(),
        user_phone: customer.phone.trim(),
        address: customer.address.trim(),
      },
      user: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() },
      shipping_address: { f_name: first || "", l_name: rest.join(" "), address: customer.address.trim(), phone: customer.phone.trim(), city: "", zip: "" },
      order_items: items,
      payments: [{ paid_amount: 0, due_amount: total }],
      coupon: null,
    };

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Your browser blocked the print window. Allow pop-ups for this site and try again.");
      return;
    }
    win.document.write(InvoiceDocument({ orderData }));
    win.document.close();
    win.onload = () => setTimeout(() => win.print(), 300);
  };

  const startOver = () => {
    if (!window.confirm("Clear this invoice and start a new one?")) return;
    setDraft(emptyDraft());
    setErrors({});
  };

  const touched = customer.name || customer.phone || customer.address || filled.length > 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  const summary = (
    <div className="co-summary">
      <h2 className="co-summary-title">Invoice total</h2>
      <dl className="co-totals">
        <div><dt>{filled.length} {filled.length === 1 ? "line" : "lines"}</dt><dd>{taka(subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>{deliveryCost ? taka(deliveryCost) : "None"}</dd></div>
        {discount > 0 && (
          <div className="is-discount">
            <dt>Discount{discountType === "percent" ? ` ${Number(discountValue)}%` : ""}</dt>
            <dd>−{taka(discount)}</dd>
          </div>
        )}
        <div className="is-total"><dt>Total due</dt><dd>{taka(total)}</dd></div>
      </dl>
      <p className="co-paynote">Printed as unpaid. Nothing is saved to orders or stock.</p>
      <ul className="co-checklist">
        <li className={customer.name && customer.phone && customer.address ? "is-done" : ""}><FaCheck aria-hidden="true" /> Bill to</li>
        <li className={filled.length ? "is-done" : ""}><FaCheck aria-hidden="true" /> At least one line</li>
      </ul>
    </div>
  );

  return (
    <div className="co-page">
      <EditorPage
        back={{ label: "Orders", onClick: () => navigate("/orders") }}
        title="Custom invoice"
        meta="A printable invoice for work or items that aren't store orders. Your draft is kept in this browser until you start over."
        nav={summary}
        footer={
          <SaveBar
            formId={FORM_ID}
            dirty={!!touched}
            errorCount={errorCount}
            onShowErrors={() => showFirstError(errors, fieldOrder)}
            saveLabel={`Print invoice · ${taka(total)}`}
            cleanText="Fill in who it's for and add lines"
            dirtyText={`Draft · ${taka(total)}`}
            secondary={
              touched ? (
                <Button type="button" variant="link" className="ed-discard" onClick={startOver}>
                  Start over
                </Button>
              ) : null
            }
          />
        }
      >
        <Form id={FORM_ID} onSubmit={handlePrint} noValidate>
          <EditorSection id="bill-to" title="Bill to">
            <div className="ed-grid co-grid-2">
              <Field name="name" label="Name" required error={errors.name} labelFor="ci-cust-name">
                <Form.Control id="ci-cust-name" value={customer.name} onChange={(e) => setCustomer("name", e.target.value)} placeholder="Person or company" />
              </Field>
              <Field name="phone" label="Phone" required error={errors.phone} labelFor="ci-cust-phone">
                <Form.Control id="ci-cust-phone" type="tel" value={customer.phone} onChange={(e) => setCustomer("phone", e.target.value)} placeholder="01XXXXXXXXX" />
              </Field>
              <Field name="address" label="Address" required error={errors.address} labelFor="ci-cust-address" className="co-span-full">
                <Form.Control id="ci-cust-address" as="textarea" rows={2} value={customer.address} onChange={(e) => setCustomer("address", e.target.value)} />
              </Field>
            </div>
          </EditorSection>

          <EditorSection
            id="lines"
            title="Items and services"
            count={filled.length || null}
            help="Type anything: parts, hours of work, a training session. Or pick a store product to fill in its price."
          >
            <Field name="lines" error={errors.lines} label="Add a store product" labelFor="ci-product">
              <AsyncSelect
                inputId="ci-product"
                cacheOptions
                defaultOptions
                value={null}
                loadOptions={loadProducts}
                onChange={(o) => o && addLine({ name: o.label, price: String(o.price) })}
                formatOptionLabel={(o) => (
                  <span className="d-flex justify-content-between gap-3">
                    <span className="text-truncate">{o.label}</span>
                    <span className="text-muted flex-shrink-0">{taka(o.price)}</span>
                  </span>
                )}
                placeholder="Search products (optional)"
                noOptionsMessage={() => "No products found"}
                menuPortalTarget={document.body}
                styles={selectStyles}
              />
            </Field>

            <div className="ci-lines" role="table" aria-label="Invoice lines">
              <div className="ci-line ci-line-head" role="row">
                <span role="columnheader">Item or service</span>
                <span role="columnheader">Qty / hours</span>
                <span role="columnheader">Price each</span>
                <span role="columnheader" className="text-end">Amount</span>
                <span role="columnheader"><span className="visually-hidden">Remove</span></span>
              </div>
              {lines.map((l, idx) => (
                <div className="ci-line" role="row" key={l.key}>
                  <Form.Control
                    id={`ci-name-${l.key}`}
                    value={l.name}
                    onChange={(e) => setLine(l.key, { name: e.target.value })}
                    placeholder="e.g. Robot kit assembly"
                    aria-label={`Line ${idx + 1} item or service`}
                  />
                  <Form.Control
                    type="number"
                    inputMode="decimal"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => setLine(l.key, { quantity: e.target.value })}
                    aria-label={`Line ${idx + 1} quantity or hours`}
                  />
                  <div className="ed-money">
                    <span aria-hidden="true">৳</span>
                    <Form.Control
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={l.price}
                      onChange={(e) => setLine(l.key, { price: e.target.value })}
                      onKeyDown={(e) => {
                        // Enter on the last price starts the next line.
                        if (e.key === "Enter" && idx === lines.length - 1) {
                          e.preventDefault();
                          addLine();
                        }
                      }}
                      placeholder="0"
                      aria-label={`Line ${idx + 1} price each`}
                    />
                  </div>
                  <span className="co-line-total">{taka(lineTotal(l))}</span>
                  <button type="button" className="co-remove" onClick={() => removeLine(l.key)} aria-label={`Remove line ${idx + 1}`}>
                    <FaTrash aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline-primary" size="sm" className="mt-3" onClick={() => addLine()}>
              <FaPlus className="me-1" aria-hidden="true" /> Add a line
            </Button>
          </EditorSection>

          <EditorSection id="extras" title="Delivery and discount" optional>
            <div className="ed-grid">
              <Field name="delivery" label="Delivery cost" labelFor="ci-delivery">
                <div className="ed-money">
                  <span aria-hidden="true">৳</span>
                  <Form.Control id="ci-delivery" type="number" inputMode="decimal" min={0} value={delivery} onChange={(e) => update({ delivery: e.target.value })} placeholder="0" />
                </div>
              </Field>
              <Field name="discount" label="Discount" error={errors.discount} labelFor="ci-discount">
                <div className="ci-discount">
                  <div className="ed-money">
                    <span aria-hidden="true">{discountType === "percent" ? "%" : "৳"}</span>
                    <Form.Control
                      id="ci-discount"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={discountValue}
                      onChange={(e) => {
                        update({ discountValue: e.target.value });
                        setErrors((er) => ({ ...er, discount: null }));
                      }}
                      placeholder="0"
                    />
                  </div>
                  <ChoiceGroup
                    name="discount-type"
                    value={discountType}
                    onChange={(v) => update({ discountType: v })}
                    columns={2}
                    options={[
                      { value: "flat", label: "Taka" },
                      { value: "percent", label: "Percent" },
                    ]}
                  />
                </div>
              </Field>
            </div>
          </EditorSection>

          <div className="co-summary-inline">{summary}</div>
        </Form>
      </EditorPage>
    </div>
  );
};

export default CustomInvoice;
