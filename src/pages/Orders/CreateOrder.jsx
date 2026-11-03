import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "react-bootstrap";
import { FaMinus, FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import AsyncSelect from "react-select/async";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import AddShippingAddressModal from "../../components/Customers/AddShippingAddressModal";
import {
  EditorPage,
  EditorSection,
  Field,
  ChoiceGroup,
  SaveBar,
  showFirstError,
  useUnsavedChanges,
} from "../../components/Editor/Editor";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "./CreateOrder.css";
import { taka } from "../../components/List/format";
import usePageTitle from "../../hooks/usePageTitle";

const FORM_ID = "create-order-form";

// The backend only accepts these delivery charges, taken from the store settings.
const deliveryOptions = (info) => {
  if (!info) return null;
  return [
    { value: "0", label: "Pickup", hint: "Customer collects it, ৳0" },
    { value: String(Number(info.insideDhaka)), label: "Inside Dhaka", hint: taka(info.insideDhaka) },
    { value: String(Number(info.outsideDhaka)), label: "Outside Dhaka", hint: taka(info.outsideDhaka) },
  ];
};

const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 1080 }),
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderColor: state.isFocused ? "var(--zt-primary)" : base.borderColor,
  }),
};

const OptionRow = ({ label, sub, image }) => (
  <div className="co-option">
    {image !== undefined &&
      (image ? <img src={image} alt="" className="ls-thumb" /> : <span className="ls-thumb is-empty">No photo</span>)}
    <span className="min-w-0">
      <span className="d-block fw-semibold text-truncate">{label}</span>
      {sub && <span className="d-block small text-muted text-truncate">{sub}</span>}
    </span>
  </div>
);

const CreateOrder = () => {
  usePageTitle("New order");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState("account"); // account | guest
  const [customer, setCustomer] = useState(null); // react-select option
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [shippingId, setShippingId] = useState(null);
  const [guest, setGuest] = useState({ user_name: "", userphone: "", address: "" });
  const [items, setItems] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [delivery, setDelivery] = useState("0");
  const [payment, setPayment] = useState(1);
  const [trx, setTrx] = useState({ trxed: "", paymentphone: "" });
  const [coupons, setCoupons] = useState([]);
  const [couponId, setCouponId] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const dirty = items.length > 0 || !!customer || !!guest.user_name || !!guest.address;
  useUnsavedChanges(dirty && !saving ? 1 : 0);

  useEffect(() => {
    axiosInstance
      .get("/documents/order-info")
      .then((r) => r.data?.data && setOrderInfo(r.data.data))
      .catch(() => {});
    axiosInstance
      .get("/coupons", { params: { limit: 100 } })
      .then((r) => setCoupons(r.data?.data || []))
      .catch(() => {});
  }, []);

  // ─── Customer ──────────────────────────────────────────────────────────────

  const loadCustomers = async (q) => {
    try {
      const r = await axiosInstance.get("/clints", { params: { search: q, limit: 20 } });
      return (r.data?.data || []).map((u) => ({
        value: u.id,
        label: u.name,
        sub: [u.phone, u.email].filter(Boolean).join(" · "),
      }));
    } catch {
      return [];
    }
  };

  const loadAddresses = async (userId) => {
    setAddressesLoading(true);
    try {
      const r = await axiosInstance.get(`/shipping-addresses/${userId}`);
      const list = r.data?.data || [];
      setAddresses(list);
      // One saved address is almost always the one they want.
      setShippingId(list.length === 1 ? list[0].id : null);
    } catch {
      setAddresses([]);
      setShippingId(null);
    } finally {
      setAddressesLoading(false);
    }
  };

  const pickCustomer = (option) => {
    setCustomer(option);
    setAddresses([]);
    setShippingId(null);
    setErrors((e) => ({ ...e, customer: null, shipping: null }));
    if (option) loadAddresses(option.value);
  };

  // Opened from a customer's page: start with that customer picked.
  const presetCustomer = params.get("customer");
  useEffect(() => {
    if (!presetCustomer) return;
    axiosInstance
      .get(`/clints/all-info/${presetCustomer}`)
      .then((r) => {
        const u = r.data?.data?.[0]?.user;
        if (u) pickCustomer({ value: u.id, label: u.name, sub: [u.phone, u.email].filter(Boolean).join(" · ") });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetCustomer]);

  const setGuestField = (key, value) => {
    setGuest((g) => ({ ...g, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  // ─── Products ──────────────────────────────────────────────────────────────

  const loadProducts = async (q) => {
    try {
      const r = await axiosInstance.get("/products", { params: { search: q, limit: 20 } });
      return (r.data?.data || []).map((p) => ({
        value: p.id,
        label: p.name,
        price: Number(p.price) || 0,
        stock: Number(p.quantity) || 0,
        image: p.image_paths?.[0] || null,
        sub: `${taka(p.price)} · ${Number(p.quantity) > 0 ? `${p.quantity} in stock` : "Out of stock"}`,
      }));
    } catch {
      return [];
    }
  };

  const addProduct = (option) => {
    if (!option) return;
    setItems((list) => {
      const found = list.find((i) => i.product_id === option.value);
      if (found) {
        return list.map((i) => (i.product_id === option.value ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...list,
        { product_id: option.value, name: option.label, price: option.price, stock: option.stock, image: option.image, quantity: 1 },
      ];
    });
    setErrors((e) => ({ ...e, products: null }));
  };

  const setQty = (id, qty) => {
    const n = Math.max(1, Math.min(999, parseInt(qty, 10) || 1));
    setItems((list) => list.map((i) => (i.product_id === id ? { ...i, quantity: n } : i)));
  };

  const removeItem = (id) => setItems((list) => list.filter((i) => i.product_id !== id));

  // ─── Money ─────────────────────────────────────────────────────────────────

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shippingCharge = Number(delivery) || 0;
  const coupon = coupons.find((c) => String(c.id) === String(couponId));

  // Same sums the server does; product-only coupons are settled when the order is placed.
  const discount = useMemo(() => {
    if (!coupon) return { amount: 0, note: null };
    if (subtotal < Number(coupon.min_pur || 0)) {
      return { amount: 0, note: `Needs ${taka(coupon.min_pur)} or more in products` };
    }
    if (!Number(coupon.is_global)) return { amount: 0, note: "Worked out on the coupon's products when placed" };
    const raw = coupon.type === "percent" ? (subtotal * Number(coupon.amount)) / 100 : Number(coupon.amount);
    return { amount: Math.min(raw, subtotal), note: null };
  }, [coupon, subtotal]);

  const total = Math.max(0, subtotal + shippingCharge - discount.amount);

  // ─── Checks and submit ─────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (mode === "account") {
      if (!customer) e.customer = "Pick the customer, or switch to a walk-in order.";
      else if (!shippingId) e.shipping = addresses.length ? "Choose where to deliver." : "This customer has no saved address yet. Add one.";
    } else {
      if (!guest.user_name.trim()) e.user_name = "Enter the customer's name.";
      if (!/^01\d{9}$/.test(guest.userphone.trim())) e.userphone = "Enter an 11-digit phone number starting with 01.";
      if (!guest.address.trim()) e.address = "Enter the delivery address.";
    }
    if (!items.length) e.products = "Add at least one product.";
    if (payment === 2) {
      if (!trx.trxed.trim()) e.trxed = "Enter the bKash transaction ID.";
      if (!trx.paymentphone.trim()) e.paymentphone = "Enter the number the payment came from.";
    }
    return e;
  };

  const customerDone = mode === "account" ? !!(customer && shippingId) : !!(guest.user_name && guest.userphone && guest.address);
  const errorCount = Object.values(errors).filter(Boolean).length;
  const fieldOrder = ["customer", "shipping", "user_name", "userphone", "address", "products", "trxed", "paymentphone"];

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      showFirstError(e, fieldOrder);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: mode === "account" ? customer.value : null,
        shipping_id: mode === "account" ? shippingId : null,
        user_name: mode === "guest" ? guest.user_name.trim() : "",
        userphone: mode === "guest" ? guest.userphone.trim() : "",
        address: mode === "guest" ? guest.address.trim() : "",
        coupon_id: couponId ? Number(couponId) : null,
        shipping_charge: shippingCharge,
        product_subtotal: subtotal,
        total,
        payment_type: payment,
        trxed: payment === 2 ? trx.trxed.trim() : "",
        paymentphone: payment === 2 ? trx.paymentphone.trim() : "",
        products: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
      };
      const r = await axiosInstance.post("/orders/place-order", payload);
      if (!r.data?.success) throw new Error(r.data?.message || "The order wasn't placed.");
      toast.success(`Order ${r.data.data?.invoice_code || ""} placed`);
      setSaving(false);
      navigate(r.data.data?.id ? `/orders/${r.data.data.id}` : "/orders");
    } catch (err) {
      const api = err.response?.data;
      let msg = api?.message || err.message || "The order wasn't placed.";
      if (api?.errors && typeof api.errors === "object") msg = Object.values(api.errors).flat().join(" ");
      toast.error(msg);
      setSaving(false);
    }
  };

  const options = deliveryOptions(orderInfo);

  // ─── Render ────────────────────────────────────────────────────────────────

  const summary = (
    <div className="co-summary">
      <h2 className="co-summary-title">Order summary</h2>
      {items.length ? (
        <ul className="co-summary-lines">
          {items.map((i) => (
            <li key={i.product_id}>
              <span className="text-truncate">{i.quantity} × {i.name}</span>
              <span>{taka(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted small mb-3">No products yet.</p>
      )}
      <dl className="co-totals">
        <div><dt>Products</dt><dd>{taka(subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>{shippingCharge ? taka(shippingCharge) : "Free"}</dd></div>
        {coupon && (
          <div className="is-discount">
            <dt>{coupon.code}</dt>
            <dd>{discount.amount ? `−${taka(discount.amount)}` : "—"}</dd>
          </div>
        )}
        <div className="is-total"><dt>Total</dt><dd>{taka(total)}</dd></div>
      </dl>
      {discount.note && <p className="co-note">{discount.note}</p>}
      <p className="co-paynote">{payment === 2 ? "Paid by bKash." : "Collected on delivery."}</p>
      <ul className="co-checklist">
        <li className={customerDone ? "is-done" : ""}><FaCheck aria-hidden="true" /> Customer and address</li>
        <li className={items.length ? "is-done" : ""}><FaCheck aria-hidden="true" /> At least one product</li>
        <li className={payment === 1 || (trx.trxed && trx.paymentphone) ? "is-done" : ""}><FaCheck aria-hidden="true" /> Payment</li>
      </ul>
    </div>
  );

  return (
    <div className="co-page">
      <EditorPage
        back={{ label: "Orders", onClick: () => navigate("/orders") }}
        title="New order"
        meta="For phone, Facebook and walk-in sales. Stock goes down as soon as it's placed."
        nav={summary}
        footer={
          <SaveBar
            formId={FORM_ID}
            dirty={dirty}
            saving={saving}
            errorCount={errorCount}
            onShowErrors={() => showFirstError(errors, fieldOrder)}
            saveLabel={`Place order · ${taka(total)}`}
            savingLabel="Placing order…"
            cleanText="Start by choosing the customer"
            dirtyText={`${itemCount} ${itemCount === 1 ? "item" : "items"} · ${taka(total)}`}
          />
        }
      >
        <Form id={FORM_ID} onSubmit={handleSubmit} noValidate>
          <EditorSection id="customer" title="Customer" help="Who it's for and where it goes.">
            <ChoiceGroup
              name="customer-mode"
              value={mode}
              onChange={(v) => {
                setMode(v);
                setErrors({});
              }}
              options={[
                { value: "account", label: "Existing customer", hint: "Has a store account. The order shows in it." },
                { value: "guest", label: "Walk-in or new", hint: "Just a name, phone and address" },
              ]}
            />

            {mode === "account" ? (
              <>
                <Field name="customer" label="Customer" required error={errors.customer} labelFor="co-customer" className="mt-3">
                  <AsyncSelect
                    inputId="co-customer"
                    cacheOptions
                    defaultOptions
                    isClearable
                    value={customer}
                    loadOptions={loadCustomers}
                    onChange={pickCustomer}
                    formatOptionLabel={(o) => <OptionRow label={o.label} sub={o.sub} />}
                    placeholder="Search by name, phone or email"
                    noOptionsMessage={({ inputValue }) => (inputValue ? "No customer found. Try a walk-in order." : "Type to search")}
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                </Field>

                {customer && (
                  <Field name="shipping" label="Deliver to" required error={errors.shipping}>
                    {addressesLoading ? (
                      <p className="text-muted small mb-0">Loading saved addresses…</p>
                    ) : (
                      <div className="co-addresses" role="radiogroup" aria-label="Delivery address">
                        {addresses.map((a) => (
                          <label key={a.id} className={`co-address ${shippingId === a.id ? "is-selected" : ""}`}>
                            <input
                              type="radio"
                              name="co-address"
                              checked={shippingId === a.id}
                              onChange={() => {
                                setShippingId(a.id);
                                setErrors((e) => ({ ...e, shipping: null }));
                              }}
                            />
                            <span>
                              <strong className="d-block">{[a.f_name, a.l_name].filter(Boolean).join(" ")}</strong>
                              <span className="d-block">{a.address}{a.city ? `, ${a.city}` : ""}{a.zip ? ` ${a.zip}` : ""}</span>
                              {a.phone && <span className="d-block text-muted small">{a.phone}</span>}
                            </span>
                          </label>
                        ))}
                        <button type="button" className="co-address is-add" onClick={() => setShowAddAddress(true)}>
                          <FaPlus aria-hidden="true" /> Add an address
                        </button>
                      </div>
                    )}
                  </Field>
                )}
              </>
            ) : (
              <div className="ed-grid co-grid-2 mt-3">
                <Field name="user_name" label="Name" required error={errors.user_name} labelFor="co-name">
                  <Form.Control id="co-name" value={guest.user_name} onChange={(e) => setGuestField("user_name", e.target.value)} autoComplete="off" />
                </Field>
                <Field name="userphone" label="Phone" required error={errors.userphone} labelFor="co-phone">
                  <Form.Control
                    id="co-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={guest.userphone}
                    onChange={(e) => setGuestField("userphone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                  />
                </Field>
                <Field name="address" label="Delivery address" required error={errors.address} labelFor="co-address" className="co-span-full">
                  <Form.Control
                    id="co-address"
                    as="textarea"
                    rows={2}
                    placeholder="House, road, area, city"
                    value={guest.address}
                    onChange={(e) => setGuestField("address", e.target.value)}
                    maxLength={255}
                  />
                </Field>
              </div>
            )}
          </EditorSection>

          <EditorSection id="products" title="Products" count={items.length || null} help="Search and pick. Picking the same product again adds one more.">
            <Field name="products" error={errors.products} labelFor="co-product" label="Add a product">
              <AsyncSelect
                inputId="co-product"
                cacheOptions
                defaultOptions
                value={null}
                loadOptions={loadProducts}
                onChange={addProduct}
                formatOptionLabel={(o) => <OptionRow label={o.label} sub={o.sub} image={o.image} />}
                placeholder="Search products"
                noOptionsMessage={() => "No products found"}
                menuPortalTarget={document.body}
                styles={selectStyles}
              />
            </Field>

            {items.length > 0 && (
              <ul className="co-lines">
                {items.map((i) => (
                  <li key={i.product_id} className="co-line">
                    {i.image ? <img src={i.image} alt="" className="ls-thumb" /> : <span className="ls-thumb is-empty">No photo</span>}
                    <div className="co-line-name">
                      <span className="fw-semibold d-block">{i.name}</span>
                      <span className="small text-muted">{taka(i.price)} each</span>
                      {i.quantity > i.stock && (
                        <span className="d-block small co-warn">
                          {i.stock > 0 ? `Only ${i.stock} in stock` : "Out of stock"}. Stock will go below zero.
                        </span>
                      )}
                    </div>
                    <div className="co-qty" role="group" aria-label={`Quantity of ${i.name}`}>
                      <button type="button" onClick={() => setQty(i.product_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="One less">
                        <FaMinus aria-hidden="true" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={i.quantity}
                        onChange={(e) => setQty(i.product_id, e.target.value)}
                        aria-label="Quantity"
                      />
                      <button type="button" onClick={() => setQty(i.product_id, i.quantity + 1)} aria-label="One more">
                        <FaPlus aria-hidden="true" />
                      </button>
                    </div>
                    <span className="co-line-total">{taka(i.price * i.quantity)}</span>
                    <button type="button" className="co-remove" onClick={() => removeItem(i.product_id)} aria-label={`Remove ${i.name}`}>
                      <FaTrash aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </EditorSection>

          <EditorSection id="delivery" title="Delivery and payment">
            <Field name="delivery" label="Delivery charge">
              {options ? (
                <ChoiceGroup name="delivery" value={delivery} onChange={setDelivery} options={options} columns={3} />
              ) : (
                <Form.Control type="number" min={0} value={delivery} onChange={(e) => setDelivery(e.target.value)} style={{ maxWidth: 200 }} />
              )}
            </Field>

            <Field name="payment" label="Payment">
              <ChoiceGroup
                name="payment"
                value={payment}
                onChange={(v) => {
                  setPayment(v);
                  setErrors((e) => ({ ...e, trxed: null, paymentphone: null }));
                }}
                options={[
                  { value: 1, label: "Cash on delivery", hint: "Collected when it arrives" },
                  { value: 2, label: "Paid by bKash", hint: "Needs the transaction ID" },
                ]}
              />
            </Field>

            {payment === 2 && (
              <div className="ed-grid">
                <Field name="trxed" label="Transaction ID" required error={errors.trxed} labelFor="co-trx">
                  <Form.Control
                    id="co-trx"
                    value={trx.trxed}
                    onChange={(e) => {
                      setTrx((t) => ({ ...t, trxed: e.target.value.toUpperCase() }));
                      setErrors((er) => ({ ...er, trxed: null }));
                    }}
                    placeholder="e.g. 9BC4D7XY2Q"
                    autoComplete="off"
                  />
                </Field>
                <Field name="paymentphone" label="Paid from number" required error={errors.paymentphone} labelFor="co-payphone">
                  <Form.Control
                    id="co-payphone"
                    type="tel"
                    inputMode="numeric"
                    value={trx.paymentphone}
                    onChange={(e) => {
                      setTrx((t) => ({ ...t, paymentphone: e.target.value.replace(/\D/g, "").slice(0, 11) }));
                      setErrors((er) => ({ ...er, paymentphone: null }));
                    }}
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
              </div>
            )}

            <Field name="coupon" label="Coupon" labelFor="co-coupon" help={discount.note || (coupon ? null : "Optional")}>
              <Form.Select id="co-coupon" value={couponId} onChange={(e) => setCouponId(e.target.value)} style={{ maxWidth: 360 }}>
                <option value="">No coupon</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.type === "percent" ? `${parseFloat(c.amount)}% off` : `${taka(c.amount)} off`}
                    {Number(c.min_pur) > 0 ? `, over ${taka(c.min_pur)}` : ""}
                  </option>
                ))}
              </Form.Select>
            </Field>
          </EditorSection>

          {/* Below 1200px the side panel is hidden, so the summary sits at the end of the form. */}
          <div className="co-summary-inline">{summary}</div>
        </Form>
      </EditorPage>

      <AddShippingAddressModal
        show={showAddAddress}
        onHide={() => setShowAddAddress(false)}
        userId={customer?.value}
        onAdd={(a) => {
          setAddresses((list) => [...list, a]);
          setShippingId(a.id);
          setErrors((e) => ({ ...e, shipping: null }));
          setShowAddAddress(false);
        }}
      />
    </div>
  );
};

export default CreateOrder;
