import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { FaArrowDown, FaArrowUp, FaPlus, FaTimes, FaTrash, FaImage } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import "./VariantsEditor.css";

const taka = (n) => `৳${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
let tempKey = 0;
const blankRow = (base = {}) => ({
  key: `new-${++tempKey}`,
  id: null,
  name: "",
  sku: "",
  price: base.price ?? "",
  discount: base.discount ?? "",
  quantity: 0,
  display_quantity: "",
  image_id: null,
  status: true,
  ...base,
});
const fromServer = (v) => ({
  key: `v-${v.id}`,
  id: v.id,
  name: v.name,
  sku: v.sku || "",
  price: v.price,
  discount: v.discount || "",
  quantity: v.quantity,
  display_quantity: v.display_quantity ?? "",
  image_id: v.image_id,
  status: v.status,
});
/** A row without its list key, for comparing with what is saved. */
const withoutKey = ({ key: _key, ...rest }) => rest;
const LABEL_IDEAS = ["Pins", "Colour", "Size", "Value", "Length", "Voltage", "Model"];

/** Pick one of the product's photos for a variant. */
const PhotoPicker = ({ images, value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const current = images.find((i) => i.id === value);
  return (
    <div className="ve-photo">
      <button type="button" className="ve-photo-btn" onClick={() => setOpen((o) => !o)} aria-label={`${label}: ${current ? "change photo" : "pick a photo"}`} aria-expanded={open}>
        {current ? <img src={current.path} alt="" /> : <FaImage aria-hidden="true" />}
      </button>
      {open && (
        <div className="ve-photo-pop" role="dialog" aria-label={`Photo for ${label}`}>
          {images.length === 0 && <p className="small text-muted mb-0">Add photos to the product first, in Photos above.</p>}
          <div className="ve-photo-grid">
            {images.map((img, i) => (
              <button type="button" key={img.id} className={img.id === value ? "is-on" : ""} onClick={() => { onChange(img.id); setOpen(false); }} aria-label={`Photo ${i + 1}`}>
                <img src={img.path} alt="" />
              </button>
            ))}
          </div>
          {value && <button type="button" className="ve-photo-clear" onClick={() => { onChange(null); setOpen(false); }}>Use the main photo</button>}
        </div>
      )}
    </div>
  );
};

/**
 * Variants (SKUs) of a product: e.g. JST connector 1 pin / 2 pin / 3 pin, each
 * with its own price, stock and photo. Saves the whole list at once.
 */
const VariantsEditor = ({ product, onSaved }) => {
  const images = product.images || [];
  const [label, setLabel] = useState(product.variant_label || "");
  const [rows, setRows] = useState(() => (product.variants || []).map(fromServer));
  const [quick, setQuick] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Reload when the product is fetched again (after a save elsewhere on the page)
  useEffect(() => {
    setLabel(product.variant_label || "");
    setRows((product.variants || []).map(fromServer));
  }, [product.variant_label, product.variants]);

  const saved = useMemo(() => JSON.stringify({ l: product.variant_label || "", r: (product.variants || []).map(fromServer).map(withoutKey) }), [product.variant_label, product.variants]);
  const dirty = JSON.stringify({ l: label, r: rows.map(withoutKey) }) !== saved;

  const base = { price: product.price ?? "", discount: product.discount || "" };
  const set = (key, patch) => {
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };
  const move = (i, d) => setRows((list) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const remove = async (row) => {
    if (row.id && !(await confirmDialog({ title: `Remove "${row.name || "this variant"}"?`, message: "It's removed when you save. Past orders keep its name.", confirmLabel: "Remove", tone: "danger" }))) return;
    setRows((list) => list.filter((r) => r.key !== row.key));
  };

  const addQuick = () => {
    const names = quick.split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const have = new Set(rows.map((r) => r.name.trim().toLowerCase()));
    const fresh = names.filter((n) => !have.has(n.toLowerCase())).map((name) => blankRow({ ...base, name }));
    setRows((list) => [...list, ...fresh]);
    setQuick("");
    if (fresh.length < names.length) toast("Some of those are already in the list");
  };

  const check = () => {
    const found = {};
    const seen = new Map();
    rows.forEach((r) => {
      const name = r.name.trim();
      if (!name) found[r.key] = "Give it a name, e.g. 2 pin.";
      else if (seen.has(name.toLowerCase())) found[r.key] = "Two variants have this name.";
      else if (r.price === "" || Number(r.price) < 0) found[r.key] = "Enter a price.";
      else if (Number(r.discount) > Number(r.price)) found[r.key] = "The discount is more than the price.";
      seen.set(name.toLowerCase(), true);
    });
    setErrors(found);
    return !Object.keys(found).length;
  };

  const save = async () => {
    if (!check()) {
      toast.error("Fix the highlighted variants first");
      return;
    }
    if (!rows.length && (product.variants || []).length) {
      const ok = await confirmDialog({ title: "Remove all variants?", message: "The product goes back to one price and one stock count. Past orders keep the variant names.", confirmLabel: "Remove all", tone: "danger" });
      if (!ok) return;
    }
    setSaving(true);
    try {
      await axiosInstance.put(`/products/${product.id}/variants`, {
        variant_label: label.trim() || null,
        variants: rows.map((r) => ({
          id: r.id || undefined,
          name: r.name.trim(),
          sku: r.sku.trim() || null,
          price: Math.round(Number(r.price) || 0),
          discount: r.discount === "" ? null : Math.round(Number(r.discount) || 0),
          quantity: Math.round(Number(r.quantity) || 0),
          display_quantity: r.display_quantity === "" ? null : Math.round(Number(r.display_quantity) || 0),
          image_id: r.image_id || null,
          status: !!r.status,
        })),
      });
      toast.success(rows.length ? `${rows.length} variant${rows.length === 1 ? "" : "s"} saved` : "Variants removed");
      onSaved?.();
    } catch (err) {
      const e = err.response?.data;
      toast.error(e?.message && e.message !== "Validation failed" ? e.message : e?.errors ? Object.values(e.errors).flat()[0] : "Couldn't save the variants");
    } finally {
      setSaving(false);
    }
  };

  if (product.is_bundle === 1) {
    return <p className="text-muted mb-0">Bundles can't have variants. Add variants to the products inside the bundle instead.</p>;
  }

  const total = rows.reduce((n, r) => n + (Number(r.quantity) || 0), 0);
  const onSale = rows.filter((r) => r.status);
  const from = onSale.length ? Math.min(...onSale.map((r) => Math.max(0, (Number(r.price) || 0) - (Number(r.discount) || 0)))) : null;

  return (
    <div className="ve">
      <div className="ve-top">
        <Form.Group className="ve-label" controlId="ve-label">
          <Form.Label>What do they differ by?</Form.Label>
          <Form.Control list="ve-label-ideas" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Pins" maxLength={40} />
          <datalist id="ve-label-ideas">{LABEL_IDEAS.map((l) => <option key={l} value={l} />)}</datalist>
          <Form.Text>Shown above the choices in the store: "Pins: 1 pin · 2 pin · 3 pin".</Form.Text>
        </Form.Group>
        <Form.Group className="ve-quick" controlId="ve-quick">
          <Form.Label>Add several at once</Form.Label>
          <div className="d-flex gap-2">
            <Form.Control value={quick} onChange={(e) => setQuick(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuick(); } }} placeholder="1 pin, 2 pin, 3 pin" />
            <Button variant="outline-primary" onClick={addQuick} disabled={!quick.trim()}>Add</Button>
          </div>
          <Form.Text>Separate with commas. Each starts at the product's price; change it below.</Form.Text>
        </Form.Group>
      </div>

      {rows.length === 0 ? (
        <div className="ve-empty">
          <p className="mb-2"><strong>No variants.</strong> Sell this product in several versions, such as 1 pin, 2 pin and 3 pin, each with its own price, stock and photo.</p>
          <Button size="sm" variant="outline-primary" onClick={() => setRows([blankRow(base)])}><FaPlus className="me-1" aria-hidden="true" />Add a variant</Button>
        </div>
      ) : (
        <>
          <div className="ve-head" aria-hidden="true">
            <span>Photo</span><span>Name</span><span>SKU</span><span>Price</span><span>Discount</span><span>In stock</span><span>Shown</span><span>In store</span><span />
          </div>
          <ol className="ve-rows">
            {rows.map((r, i) => {
              const name = r.name.trim() || `Variant ${i + 1}`;
              return (
                <li key={r.key} className={`ve-row ${errors[r.key] ? "has-error" : ""} ${r.status ? "" : "is-off"}`}>
                  <PhotoPicker images={images} value={r.image_id} onChange={(image_id) => set(r.key, { image_id })} label={name} />
                  <Form.Control className="ve-name" aria-label={`Variant ${i + 1} name`} placeholder="e.g. 2 pin" value={r.name} maxLength={120} onChange={(e) => set(r.key, { name: e.target.value })} />
                  <Form.Control className="ve-sku" aria-label={`${name} SKU`} placeholder="SKU (optional)" value={r.sku} maxLength={64} onChange={(e) => set(r.key, { sku: e.target.value })} />
                  <div className="ed-money ve-price"><i className="ve-f">Price</i><span>৳</span><Form.Control aria-label={`${name} price`} type="number" min="0" inputMode="numeric" value={r.price} onChange={(e) => set(r.key, { price: e.target.value })} /></div>
                  <div className="ed-money ve-discount"><i className="ve-f">Discount</i><span>৳</span><Form.Control aria-label={`${name} discount`} type="number" min="0" inputMode="numeric" placeholder="0" value={r.discount} onChange={(e) => set(r.key, { discount: e.target.value })} /></div>
                  <label className="ve-qty"><i className="ve-f">In stock</i><Form.Control aria-label={`${name} in stock`} type="number" inputMode="numeric" value={r.quantity} onChange={(e) => set(r.key, { quantity: e.target.value })} /></label>
                  <label className="ve-shown"><i className="ve-f">Shown</i><Form.Control aria-label={`${name} count shown in the store`} type="number" min="0" inputMode="numeric" placeholder="Real" value={r.display_quantity} onChange={(e) => set(r.key, { display_quantity: e.target.value })} title="What the store shows. Leave empty to show the real count." /></label>
                  <Form.Check className="ve-on" type="switch" id={`ve-on-${r.key}`} aria-label={`${name} shown in the store`} checked={r.status} onChange={(e) => set(r.key, { status: e.target.checked })} />
                  <div className="ve-acts">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${name} up`}><FaArrowUp aria-hidden="true" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${name} down`}><FaArrowDown aria-hidden="true" /></button>
                    <button type="button" className="is-danger" onClick={() => remove(r)} aria-label={`Remove ${name}`}><FaTrash aria-hidden="true" /></button>
                  </div>
                  {errors[r.key] && <p className="ve-error">{errors[r.key]}</p>}
                </li>
              );
            })}
          </ol>
          <div className="ve-foot">
            <Button size="sm" variant="outline-primary" onClick={() => setRows((list) => [...list, blankRow(base)])}><FaPlus className="me-1" aria-hidden="true" />Add a variant</Button>
            <span className="ve-sum">
              {total} in stock in total{from !== null && <> · store shows <strong>from {taka(from)}</strong></>}
            </span>
          </div>
        </>
      )}

      <div className="ve-save">
        {dirty && <span className="ve-dirty">Unsaved changes to variants</span>}
        {dirty && <Button variant="link" className="text-muted" onClick={() => { setLabel(product.variant_label || ""); setRows((product.variants || []).map(fromServer)); setErrors({}); }} disabled={saving}><FaTimes className="me-1" aria-hidden="true" />Discard</Button>}
        <Button onClick={save} disabled={saving || !dirty}>{saving ? <><Spinner size="sm" className="me-2" />Saving…</> : "Save variants"}</Button>
      </div>
    </div>
  );
};

export default VariantsEditor;
