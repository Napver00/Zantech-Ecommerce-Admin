import React from "react";
import AsyncSelect from "react-select/async";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import { taka, shortDate } from "../../components/List/format";

const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 1080 }),
  control: (base) => ({ ...base, minHeight: 44 }),
};

const loadProducts = async (q) => {
  try {
    const res = await axiosInstance.get("/products", { params: { search: q, limit: 20 } });
    const products = res.data?.data || [];
    // A product with variants is bought per variant: offer each one ("JST connector — 2 pin").
    const lists = await Promise.all(
      products.map((p) => (p.variants_count > 0 ? axiosInstance.get(`/products/${p.id}/variants`).then((r) => r.data?.data?.variants || []).catch(() => []) : null))
    );
    return products.flatMap((p, i) =>
      (lists[i] || []).length
        ? lists[i].map((v) => ({
            value: `${p.id}:${v.id}`,
            item_id: p.id,
            variant_id: v.id,
            label: `${p.name} — ${v.name}`,
            stock: Number(v.quantity) || 0,
            image: v.image_url || p.image_paths?.[0] || null,
          }))
        : [{ value: String(p.id), item_id: p.id, variant_id: null, label: p.name, stock: Number(p.quantity) || 0, image: p.image_paths?.[0] || null }]
    );
  } catch {
    return [];
  }
};

/** The latest price a product was bought at, from earlier challans. */
export const lastBuyingPrice = async (itemId, name) => {
  try {
    const res = await axiosInstance.get("/buying-price-items", { params: { search: name, limit: 50 } });
    const hit = (res.data?.data || []).find((r) => Number(r.item_id) === Number(itemId));
    return hit ? { price: Number(hit.buying_price), supplier: hit.supplier_name, date: hit.created_at } : null;
  } catch {
    return null;
  }
};

/** Product search for adding a line. */
export const ProductPicker = ({ inputId, onPick, placeholder = "Search products to add" }) => (
  <AsyncSelect
    inputId={inputId}
    cacheOptions
    defaultOptions
    value={null}
    loadOptions={loadProducts}
    onChange={onPick}
    formatOptionLabel={(o) => (
      <div className="co-option">
        {o.image ? <img src={o.image} alt="" className="ls-thumb" /> : <span className="ls-thumb is-empty">No photo</span>}
        <span className="min-w-0">
          <span className="d-block fw-semibold text-truncate">{o.label}</span>
          <span className="d-block small text-muted">{o.stock} in stock</span>
        </span>
      </div>
    )}
    placeholder={placeholder}
    noOptionsMessage={() => "No products found"}
    menuPortalTarget={document.body}
    styles={selectStyles}
  />
);

/** Editable lines: product, buying price, quantity, line total. */
const ChallanLines = ({ lines, onChange }) => {
  if (!lines.length) return null;

  // Lines are keyed by product + variant, so two variants of one product are two lines.
  const keyOf = (l) => l.key || String(l.item_id);
  const set = (id, patch) => onChange(lines.map((l) => (keyOf(l) === id ? { ...l, ...patch } : l)));
  const setQty = (id, q) => set(id, { quantity: Math.max(1, Math.min(99999, parseInt(q, 10) || 1)) });

  return (
    <ul className="ch-lines">
      <li className="ch-line ch-line-head" aria-hidden="true">
        <span>Product</span>
        <span>Buying price</span>
        <span>Quantity</span>
        <span className="text-end">Amount</span>
        <span />
      </li>
      {lines.map((l) => (
        <li key={keyOf(l)} className="ch-line">
          <div className="ch-line-name">
            <span className="fw-semibold d-block">{l.name}</span>
            <span className="small text-muted">
              {l.stock != null && `${l.stock} in stock → ${l.stock + (Number(l.quantity) || 0)}`}
              {l.last && ` · last ${taka(l.last.price)}${l.last.supplier ? ` from ${l.last.supplier}` : ""}${l.last.date ? `, ${shortDate(l.last.date)}` : ""}`}
            </span>
          </div>
          <div className="ed-money">
            <span aria-hidden="true">৳</span>
            <input
              className="form-control"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={l.price}
              placeholder="0"
              onChange={(e) => set(keyOf(l), { price: e.target.value })}
              aria-label={`Buying price of ${l.name}`}
            />
          </div>
          <div className="co-qty" role="group" aria-label={`Quantity of ${l.name}`}>
            <button type="button" onClick={() => setQty(keyOf(l), l.quantity - 1)} disabled={l.quantity <= 1} aria-label="One less"><FaMinus aria-hidden="true" /></button>
            <input type="number" inputMode="numeric" min={1} value={l.quantity} onChange={(e) => setQty(keyOf(l), e.target.value)} aria-label="Quantity" />
            <button type="button" onClick={() => setQty(keyOf(l), l.quantity + 1)} aria-label="One more"><FaPlus aria-hidden="true" /></button>
          </div>
          <span className="co-line-total">{taka((Number(l.price) || 0) * (Number(l.quantity) || 0))}</span>
          <button type="button" className="co-remove" onClick={() => onChange(lines.filter((x) => keyOf(x) !== keyOf(l)))} aria-label={`Remove ${l.name}`}>
            <FaTrash aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ChallanLines;
