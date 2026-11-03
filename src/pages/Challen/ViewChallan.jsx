import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaPen, FaPhoneAlt, FaPlus, FaTrash, FaFilePdf, FaUpload, FaMinus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import confirmDialog from "../../utils/confirmDialog";
import usePageTitle from "../../hooks/usePageTitle";
import { taka, shortDate } from "../../components/List/format";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "../Orders/CreateOrder.css";
import "../Customers/CustomerDetail.css";
import "./Challan.css";
import ChallanLines, { ProductPicker, lastBuyingPrice } from "./ChallanLines";

const MAX_RECEIPT_MB = 2;
const isPdf = (url) => /\.pdf($|\?)/i.test(url || "");

const ViewChallan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [busy, setBusy] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ Date: "", supplier_id: "", delivery_price: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [adding, setAdding] = useState([]);
  const [savingAdd, setSavingAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  usePageTitle(challan ? `Challan #${challan.id}` : "Challan");

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/challans/${id}`);
      setChallan(res.data?.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't find that challan");
      navigate("/challans");
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
    axiosInstance.get("/suppliers").then((r) => setSuppliers(r.data?.data || [])).catch(() => {});
  }, [load]);

  if (!challan) return <Loading />;

  const products = Number(challan.totalproductprice) || 0;
  const delivery = Number(challan.delivery_price) || 0;
  const units = (challan.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
  const mark = (key, on) => setBusy((b) => ({ ...b, [key]: on }));

  // ─── Details ───────────────────────────────────────────────────────────────

  const openEdit = () => {
    setEdit({ Date: String(challan.Date || "").slice(0, 10), supplier_id: String(challan.supplier_id || challan.supplier?.id || ""), delivery_price: String(challan.delivery_price ?? "") });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!edit.Date || !edit.supplier_id || edit.delivery_price === "" || Number(edit.delivery_price) < 0) {
      toast.error("Fill in the date, supplier and delivery charge (0 if none).");
      return;
    }
    setSavingEdit(true);
    try {
      await axiosInstance.put(`/challans/${id}`, edit);
      toast.success("Challan updated");
      setEditOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save the changes");
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Products ──────────────────────────────────────────────────────────────

  const changeQty = async (item, qty) => {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    if (q === Number(item.quantity)) return;
    mark(`q${item.challan_item_id}`, true);
    try {
      await axiosInstance.put(`/challans/challan-item/update-quantity/${item.challan_item_id}`, { quantity: q });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't change the quantity");
    } finally {
      mark(`q${item.challan_item_id}`, false);
    }
  };

  const removeItem = async (item) => {
    if (!(await confirmDialog(`Remove ${item.item_name} from this challan? Its ${item.quantity} units come back out of stock and the total drops by ${taka(item.buying_price * item.quantity)}.`))) return;
    mark(`d${item.challan_item_id}`, true);
    try {
      await axiosInstance.delete(`/challans/challan-item/delete/${item.challan_item_id}`);
      toast.success(`${item.item_name} removed`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove it");
    } finally {
      mark(`d${item.challan_item_id}`, false);
    }
  };

  const pickToAdd = async (option) => {
    if (!option) return;
    if (adding.some((l) => l.item_id === option.value)) return;
    setAdding((list) => [...list, { item_id: option.value, name: option.label, stock: option.stock, price: "", quantity: 1, last: null }]);
    const last = await lastBuyingPrice(option.value, option.label);
    if (last) setAdding((list) => list.map((l) => (l.item_id === option.value ? { ...l, last, price: l.price === "" ? String(last.price) : l.price } : l)));
  };

  const saveAdded = async () => {
    if (adding.some((l) => l.price === "" || Number(l.price) < 0)) {
      toast.error("Every new product needs a buying price.");
      return;
    }
    setSavingAdd(true);
    try {
      await axiosInstance.post(`/challans/add-items/${id}`, {
        item_id: adding.map((l) => l.item_id),
        buying: adding.map((l) => Number(l.price)),
        quantity: adding.map((l) => l.quantity),
      });
      toast.success(`${adding.length} ${adding.length === 1 ? "product" : "products"} added to the challan and to stock`);
      setAdding([]);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add them");
    } finally {
      setSavingAdd(false);
    }
  };

  // ─── Receipts ──────────────────────────────────────────────────────────────

  const uploadReceipt = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) {
      toast.error("Use a JPG, PNG or PDF.");
      return;
    }
    if (file.size > MAX_RECEIPT_MB * 1024 * 1024) {
      toast.error(`That file is over ${MAX_RECEIPT_MB} MB.`);
      return;
    }
    const fd = new FormData();
    fd.append("invoice", file);
    setUploading(true);
    try {
      await axiosInstance.post(`/challans/upload-invoice/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Receipt added");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't upload it");
    } finally {
      setUploading(false);
    }
  };

  const deleteReceipt = async (file) => {
    if (!(await confirmDialog("Delete this receipt file? This can't be undone."))) return;
    mark(`r${file.id}`, true);
    try {
      await axiosInstance.delete(`/challans/invoices/${file.id}`);
      toast.success("Receipt deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete it");
    } finally {
      mark(`r${file.id}`, false);
    }
  };

  const supplier = challan.supplier;

  return (
    <div className="cd-page ch-page">
      <button type="button" className="cd-back" onClick={() => navigate("/challans")}>
        <FaArrowLeft aria-hidden="true" /> Challans
      </button>

      <header className="cd-head">
        <div className="cd-head-text">
          <h1>Challan #{challan.id}</h1>
          <p>
            {shortDate(challan.Date)}
            {supplier ? ` · from ${supplier.name}` : ""}
            {challan.user?.name ? ` · added by ${challan.user.name}` : ""}
          </p>
        </div>
        <div className="cd-head-actions">
          <Button variant="outline-secondary" onClick={openEdit}><FaPen className="me-2" aria-hidden="true" />Edit details</Button>
        </div>
      </header>

      <dl className="cd-stats ch-stats">
        <div>
          <dt>Products</dt>
          <dd>{taka(products)}</dd>
          <span className="cd-stat-note">{units} {units === 1 ? "unit" : "units"} in {challan.items?.length || 0} {challan.items?.length === 1 ? "line" : "lines"}</span>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{delivery ? taka(delivery) : "None"}</dd>
        </div>
        <div>
          <dt>Total paid</dt>
          <dd>{taka(challan.total)}</dd>
        </div>
      </dl>

      <div className="cd-body">
        <section className="cd-card" aria-labelledby="ch-items-title">
          <div className="cd-card-head">
            <h2 id="ch-items-title">Products <span className="ed-count">{challan.items?.length || 0}</span></h2>
          </div>
          {challan.items?.length ? (
            <ul className="ch-lines ch-saved">
              <li className="ch-line ch-line-head" aria-hidden="true">
                <span>Product</span>
                <span>Buying price</span>
                <span>Quantity</span>
                <span className="text-end">Amount</span>
                <span />
              </li>
              {challan.items.map((item) => {
                const qBusy = !!busy[`q${item.challan_item_id}`];
                return (
                  <li key={item.challan_item_id} className="ch-line">
                    <div className="ch-line-name">
                      <span className="fw-semibold d-block">{item.item_name}</span>
                    </div>
                    <span className="ch-price">{taka(item.buying_price)}</span>
                    <div className="co-qty" role="group" aria-label={`Quantity of ${item.item_name}`}>
                      <button type="button" onClick={() => changeQty(item, Number(item.quantity) - 1)} disabled={qBusy || Number(item.quantity) <= 1} aria-label="One less"><FaMinus aria-hidden="true" /></button>
                      <input
                        key={item.quantity}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        defaultValue={item.quantity}
                        disabled={qBusy}
                        onBlur={(e) => changeQty(item, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        aria-label="Quantity"
                      />
                      <button type="button" onClick={() => changeQty(item, Number(item.quantity) + 1)} disabled={qBusy} aria-label="One more"><FaPlus aria-hidden="true" /></button>
                    </div>
                    <span className="co-line-total">{taka(item.buying_price * item.quantity)}</span>
                    <button type="button" className="co-remove" onClick={() => removeItem(item)} disabled={!!busy[`d${item.challan_item_id}`]} aria-label={`Remove ${item.item_name}`}>
                      <FaTrash aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="cd-empty">No products on this challan.</p>
          )}
          <p className="ch-note">Changing a quantity or removing a product updates stock and the challan's expense too.</p>

          <div className="ch-add">
            <h3>Add products bought on the same receipt</h3>
            <ProductPicker inputId="ch-add-product" onPick={pickToAdd} />
            <ChallanLines lines={adding} onChange={setAdding} />
            {adding.length > 0 && (
              <div className="ch-add-actions">
                <Button variant="link" className="ed-discard" onClick={() => setAdding([])} disabled={savingAdd}>Cancel</Button>
                <Button onClick={saveAdded} disabled={savingAdd}>
                  {savingAdd ? <><Spinner animation="border" size="sm" className="me-2" />Adding…</> : `Add to challan · ${taka(adding.reduce((s, l) => s + (Number(l.price) || 0) * l.quantity, 0))}`}
                </Button>
              </div>
            )}
          </div>
        </section>

        <aside className="cd-side">
          <section className="cd-card" aria-labelledby="ch-supplier-title">
            <div className="cd-card-head"><h2 id="ch-supplier-title">Supplier</h2></div>
            {supplier ? (
              <ul className="cd-contact">
                <li><strong>{supplier.name}</strong></li>
                {supplier.phone && <li><FaPhoneAlt aria-hidden="true" /><a href={`tel:${supplier.phone}`}>{supplier.phone}</a></li>}
                {supplier.address && <li><span className="text-muted">{supplier.address}</span></li>}
              </ul>
            ) : (
              <p className="cd-empty">No supplier on this challan.</p>
            )}
          </section>

          <section className="cd-card" aria-labelledby="ch-expense-title">
            <div className="cd-card-head"><h2 id="ch-expense-title">Booked as expense</h2></div>
            {challan.expense ? (
              <div className="ch-expense">
                <span className="ls-money">{taka(challan.expense.amount)}</span>
                <p>{challan.expense.description}</p>
                <p className="text-muted small mb-0">Also sent to the account site under Tools &amp; equipment, with the supplier's name.</p>
              </div>
            ) : (
              <p className="cd-empty">This challan is from before expenses were linked to challans. Its expense was saved separately and won't follow edits here.</p>
            )}
          </section>

          <section className="cd-card" aria-labelledby="ch-receipts-title">
            <div className="cd-card-head">
              <h2 id="ch-receipts-title">Receipts {challan.invoices?.length > 0 && <span className="ed-count">{challan.invoices.length}</span>}</h2>
              <Button size="sm" variant="outline-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Spinner animation="border" size="sm" /> : <><FaUpload className="me-1" aria-hidden="true" />Add</>}
              </Button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" hidden onChange={uploadReceipt} />
            </div>
            {challan.invoices?.length ? (
              <ul className="ch-receipts">
                {challan.invoices.map((f) => (
                  <li key={f.id}>
                    <a href={f.path} target="_blank" rel="noreferrer" title="Open full size">
                      {isPdf(f.path) ? <span className="ch-receipt-pdf"><FaFilePdf aria-hidden="true" />PDF</span> : <img src={f.path} alt="Receipt" loading="lazy" />}
                    </a>
                    <button type="button" onClick={() => deleteReceipt(f)} disabled={!!busy[`r${f.id}`]} aria-label="Delete this receipt">
                      <FaTrash aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cd-empty">No receipt yet. Add a photo or PDF of the supplier's challan.</p>
            )}
          </section>
        </aside>
      </div>

      <Modal show={editOpen} onHide={() => !savingEdit && setEditOpen(false)} centered>
        <Form onSubmit={saveEdit}>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5 mb-0">Edit challan details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="ch-edit-supplier">
              <Form.Label>Bought from</Form.Label>
              <Form.Select value={edit.supplier_id} onChange={(e) => setEdit((x) => ({ ...x, supplier_id: e.target.value }))} required>
                <option value="">Choose a supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="ch-edit-date">
              <Form.Label>Purchase date</Form.Label>
              <Form.Control type="date" value={edit.Date} onChange={(e) => setEdit((x) => ({ ...x, Date: e.target.value }))} required />
            </Form.Group>
            <Form.Group controlId="ch-edit-delivery">
              <Form.Label>Delivery charge</Form.Label>
              <div className="ed-money">
                <span aria-hidden="true">৳</span>
                <Form.Control type="number" inputMode="decimal" min={0} value={edit.delivery_price} onChange={(e) => setEdit((x) => ({ ...x, delivery_price: e.target.value }))} required />
              </div>
              <Form.Text>The total and the expense change with it.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditOpen(false)} disabled={savingEdit}>Cancel</Button>
            <Button type="submit" disabled={savingEdit}>{savingEdit ? "Saving…" : "Save changes"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewChallan;
