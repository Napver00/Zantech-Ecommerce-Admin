import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";
import { FaCheck } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import {
  EditorPage, EditorSection, Field, SaveBar, ImageDrop, showFirstError, useUnsavedChanges,
} from "../../components/Editor/Editor";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "../Orders/CreateOrder.css";
import "./Challan.css";
import { taka } from "../../components/List/format";
import ChallanLines, { ProductPicker, lastBuyingPrice } from "./ChallanLines";

const FORM_ID = "challan-form";
const MAX_RECEIPT_MB = 4;
// Local date (toISOString would give yesterday's date in the early hours in Bangladesh).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const AddChallan = () => {
  usePageTitle("New challan");
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ Date: today(), supplier_id: "", delivery_price: "" });
  const [lines, setLines] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const dirty = lines.length > 0 || !!form.supplier_id || !!receipt;
  useUnsavedChanges(dirty && !saving ? 1 : 0);

  useEffect(() => {
    axiosInstance
      .get("/suppliers")
      .then((res) => setSuppliers(res.data?.data || []))
      .catch(() => toast.error("Couldn't load suppliers"));
  }, []);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const addProduct = async (option) => {
    if (!option) return;
    setErrors((e) => ({ ...e, lines: null }));
    if (lines.some((l) => l.key === option.value)) {
      setLines((list) => list.map((l) => (l.key === option.value ? { ...l, quantity: l.quantity + 1 } : l)));
      return;
    }
    const line = { key: option.value, item_id: option.item_id, variant_id: option.variant_id, name: option.label, stock: option.stock, price: "", quantity: 1, last: null };
    setLines((list) => [...list, line]);
    // Start from what we paid last time, if it was bought before.
    const last = await lastBuyingPrice(option.item_id, option.label.split(" — ")[0]);
    if (last) {
      setLines((list) => list.map((l) => (l.key === option.value ? { ...l, last, price: l.price === "" ? String(last.price) : l.price } : l)));
    }
  };

  const pickReceipt = (file) => {
    if (!/^image\//.test(file.type)) {
      setErrors((e) => ({ ...e, receipt: "Use a photo of the receipt (JPG or PNG)." }));
      return;
    }
    if (file.size > MAX_RECEIPT_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, receipt: `That photo is over ${MAX_RECEIPT_MB} MB. Take a smaller one.` }));
      return;
    }
    setErrors((e) => ({ ...e, receipt: null }));
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0);
  const delivery = Number(form.delivery_price) || 0;
  const total = subtotal + delivery;
  const units = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const supplier = useMemo(() => suppliers.find((s) => String(s.id) === String(form.supplier_id)), [suppliers, form.supplier_id]);

  const order = ["supplier_id", "Date", "lines", "delivery_price", "receipt"];

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.supplier_id) found.supplier_id = "Pick who you bought from.";
    if (!form.Date) found.Date = "Enter the purchase date.";
    if (!lines.length) found.lines = "Add the products you bought.";
    else if (lines.some((l) => l.price === "" || Number(l.price) < 0)) found.lines = "Every product needs a buying price.";
    if (form.delivery_price !== "" && Number(form.delivery_price) < 0) found.delivery_price = "Enter 0 or more.";
    if (!receipt) found.receipt = "Add a photo of the supplier's receipt.";
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, order);
      return;
    }

    const fd = new FormData();
    fd.append("Date", form.Date);
    fd.append("supplier_id", form.supplier_id);
    fd.append("delivery_price", form.delivery_price === "" ? 0 : form.delivery_price);
    fd.append("invoice", receipt);
    lines.forEach((l, i) => {
      fd.append(`item_id[${i}]`, l.item_id);
      if (l.variant_id) fd.append(`variant_id[${i}]`, l.variant_id);
      fd.append(`buying[${i}]`, l.price);
      fd.append(`quantity[${i}]`, l.quantity);
    });

    setSaving(true);
    try {
      const res = await axiosInstance.post("/challans", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Challan saved. ${units} ${units === 1 ? "unit" : "units"} added to stock.`);
      setSaving(false);
      const id = res.data?.data?.id;
      navigate(id ? `/challans/${id}` : "/challans", { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      toast.error(
        apiErrors && typeof apiErrors === "object"
          ? Object.values(apiErrors).flat()[0]
          : err.response?.data?.message || "Couldn't save the challan"
      );
      setSaving(false);
    }
  };

  const summary = (
    <div className="co-summary">
      <h2 className="co-summary-title">Challan total</h2>
      {lines.length ? (
        <ul className="co-summary-lines">
          {lines.map((l) => (
            <li key={l.key}>
              <span className="text-truncate">{l.quantity} × {l.name}</span>
              <span>{taka((Number(l.price) || 0) * l.quantity)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted small mb-3">No products yet.</p>
      )}
      <dl className="co-totals">
        <div><dt>Products</dt><dd>{taka(subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>{delivery ? taka(delivery) : "None"}</dd></div>
        <div className="is-total"><dt>Total</dt><dd>{taka(total)}</dd></div>
      </dl>
      <p className="co-paynote">
        Booked as an expense{supplier ? `: equipment from ${supplier.name}` : ""}. Stock goes up by {units} {units === 1 ? "unit" : "units"}.
      </p>
      <ul className="co-checklist">
        <li className={form.supplier_id ? "is-done" : ""}><FaCheck aria-hidden="true" /> Supplier</li>
        <li className={lines.length ? "is-done" : ""}><FaCheck aria-hidden="true" /> Products and prices</li>
        <li className={receipt ? "is-done" : ""}><FaCheck aria-hidden="true" /> Receipt photo</li>
      </ul>
    </div>
  );

  return (
    <div className="co-page">
      <EditorPage
        back={{ label: "Challans", onClick: () => navigate("/challans") }}
        title="New challan"
        meta="Record stock bought from a supplier. Products go into stock when you save."
        nav={summary}
        footer={
          <SaveBar
            formId={FORM_ID}
            dirty={dirty}
            saving={saving}
            errorCount={Object.values(errors).filter(Boolean).length}
            onShowErrors={() => showFirstError(errors, order)}
            saveLabel={`Save challan · ${taka(total)}`}
            savingLabel="Saving…"
            cleanText="Start by picking the supplier"
            dirtyText={`${lines.length} ${lines.length === 1 ? "product" : "products"} · ${taka(total)}`}
          />
        }
      >
        <Form id={FORM_ID} onSubmit={save} noValidate>
          <EditorSection id="supplier" title="Supplier and date">
            <div className="ed-grid co-grid-2">
              <Field name="supplier_id" label="Bought from" required error={errors.supplier_id} labelFor="ch-supplier"
                help={suppliers.length ? null : "No suppliers yet. Add one on the Suppliers page first."}>
                <Form.Select id="ch-supplier" value={form.supplier_id} onChange={(e) => setField("supplier_id", e.target.value)}>
                  <option value="">Choose a supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.phone ? ` · ${s.phone}` : ""}</option>
                  ))}
                </Form.Select>
              </Field>
              <Field name="Date" label="Purchase date" required error={errors.Date} labelFor="ch-date">
                <Form.Control id="ch-date" type="date" max={today()} value={form.Date} onChange={(e) => setField("Date", e.target.value)} />
              </Field>
            </div>
          </EditorSection>

          <EditorSection id="products" title="Products" count={lines.length || null}
            help="Prices start from what you paid last time. Change them to match this receipt.">
            <Field name="lines" error={errors.lines} label="Add a product" labelFor="ch-product">
              <ProductPicker inputId="ch-product" onPick={addProduct} />
            </Field>
            <ChallanLines lines={lines} onChange={(next) => { setLines(next); setErrors((e) => ({ ...e, lines: null })); }} />
          </EditorSection>

          <EditorSection id="delivery" title="Delivery and receipt">
            <div className="ed-grid co-grid-2">
              <Field name="delivery_price" label="Delivery charge" error={errors.delivery_price} labelFor="ch-delivery" help="What the supplier charged to send it. Leave empty if none.">
                <div className="ed-money">
                  <span aria-hidden="true">৳</span>
                  <Form.Control id="ch-delivery" type="number" inputMode="decimal" min={0} value={form.delivery_price} onChange={(e) => setField("delivery_price", e.target.value)} placeholder="0" />
                </div>
              </Field>
              <Field name="receipt" label="Receipt photo" required error={errors.receipt} help={`The supplier's challan or invoice. JPG or PNG, up to ${MAX_RECEIPT_MB} MB.`}>
                <ImageDrop
                  id="ch-receipt"
                  aspect="4 / 3"
                  hint={`JPG or PNG, up to ${MAX_RECEIPT_MB} MB`}
                  accept="image/jpeg,image/png,image/webp"
                  preview={receiptPreview}
                  onFile={pickReceipt}
                  onRemove={() => { setReceipt(null); setReceiptPreview(null); }}
                />
              </Field>
            </div>
          </EditorSection>

          <div className="co-summary-inline">{summary}</div>
        </Form>
      </EditorPage>
    </div>
  );
};

export default AddChallan;
