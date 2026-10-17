import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Card, Form, Button, Row, Col, Modal, Badge } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import CommonTable from "../../components/Common/CommonTable";
import usePageTitle from "../../hooks/usePageTitle";

// bKash / Rocket / Nagad / bank details shown on the website's course registration page

const TYPES = [
  { value: "bkash", label: "bKash" },
  { value: "rocket", label: "Rocket" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  type: "bkash",
  title: "bKash",
  account_number: "",
  account_name: "",
  account_type: "Personal (Send Money)",
  bank_name: "",
  branch_name: "",
  routing_number: "",
  instructions: "",
  is_active: true,
  sort_order: 0,
};

const PaymentMethods = () => {
  usePageTitle("Payment Methods");
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/payment-methods");
      setMethods(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: methods.length + 1 });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      ...emptyForm,
      ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v ?? ""])),
      is_active: !!m.is_active,
    });
    setShowModal(true);
  };

  // Picking a type fills in a sensible title/account type for new methods
  const changeType = (type) => {
    const label = TYPES.find((t) => t.value === type)?.label || "";
    setForm((p) => ({
      ...p,
      type,
      title: !p.title || TYPES.some((t) => t.label === p.title) ? label : p.title,
      account_type: type === "bank" ? "" : p.account_type || "Personal (Send Money)",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.account_number.trim()) return toast.error(form.type === "bank" ? "Account number is required" : "Number is required");
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0, is_active: !!form.is_active };
    try {
      if (editing) {
        await axiosInstance.put(`/payment-methods/${editing.id}`, payload);
        toast.success("Payment method updated");
      } else {
        await axiosInstance.post("/payment-methods", payload);
        toast.success("Payment method added");
      }
      setShowModal(false);
      fetchMethods();
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors && typeof errors === "object" ? Object.values(errors).flat()[0] : err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m) => {
    try {
      await axiosInstance.put(`/payment-methods/${m.id}`, { is_active: !m.is_active });
      fetchMethods();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.title}"? Past registrations keep the payment details they were made with.`)) return;
    try {
      await axiosInstance.delete(`/payment-methods/${m.id}`);
      toast.success("Payment method deleted");
      fetchMethods();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const isBank = form.type === "bank";

  const headers = [
    { key: "sort_order", label: "Order" },
    {
      key: "title",
      label: "Method",
      render: (m) => (
        <div>
          <span className="fw-medium">{m.title}</span>
          <div className="small text-muted">{m.account_type || (m.type === "bank" ? m.bank_name : "")}</div>
        </div>
      ),
    },
    {
      key: "account_number",
      label: "Number / Account",
      render: (m) => (
        <div>
          <code>{m.account_number}</code>
          {m.account_name && <div className="small text-muted">{m.account_name}</div>}
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Shown on website",
      render: (m) => (
        <Form.Check type="switch" id={`pm-active-${m.id}`} checked={!!m.is_active} onChange={() => toggleActive(m)}
          label={m.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Hidden</Badge>} />
      ),
    },
  ];

  const renderActions = (m) => (
    <div className="d-flex gap-2">
      <Button variant="outline-primary" size="sm" onClick={() => openEdit(m)} title="Edit"><FaEdit /></Button>
      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(m)} title="Delete"><FaTrash /></Button>
    </div>
  );

  if (loading) return <Loading />;

  return (
    <div className="students-container">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary">Payment Methods</h4>
              <p className="text-muted small mb-0">Shown on the website's course registration form. Hide a method to stop accepting it.</p>
            </div>
            <Button variant="primary" onClick={openAdd}><FaPlus className="me-2" /> Add Method</Button>
          </div>

          <CommonTable headers={headers} data={methods} tableLoading={false} loading={false} renderActions={renderActions} />

          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>{editing ? "Edit Payment Method" : "Add Payment Method"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type</Form.Label>
                      <Form.Select value={form.type} onChange={(e) => changeType(e.target.value)}>
                        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title shown <span className="text-danger">*</span></Form.Label>
                      <Form.Control value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. bKash" />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>{isBank ? "Account number" : "Mobile number"} <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={form.account_number} onChange={(e) => set("account_number", e.target.value)} placeholder={isBank ? "Bank account number" : "01XXXXXXXXX"} />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account name</Form.Label>
                      <Form.Control value={form.account_name} onChange={(e) => set("account_name", e.target.value)} placeholder="e.g. ZAN Tech" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account type</Form.Label>
                      <Form.Control value={form.account_type} onChange={(e) => set("account_type", e.target.value)} placeholder={isBank ? "e.g. Current account" : "e.g. Personal (Send Money)"} />
                    </Form.Group>
                  </Col>
                </Row>
                {isBank && (
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Bank name</Form.Label>
                        <Form.Control value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Branch</Form.Label>
                        <Form.Control value={form.branch_name} onChange={(e) => set("branch_name", e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Routing no.</Form.Label>
                        <Form.Control value={form.routing_number} onChange={(e) => set("routing_number", e.target.value)} />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Instructions for the parent</Form.Label>
                  <Form.Control as="textarea" rows={3} value={form.instructions} onChange={(e) => set("instructions", e.target.value)}
                    placeholder={isBank ? "Transfer to this account and enter the bank reference number below." : "Send Money to this number, then enter your number and the Transaction ID below."} />
                </Form.Group>
                <Row className="align-items-center">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Display order</Form.Label>
                      <Form.Control type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Check type="switch" id="pm-active" label="Show on website" checked={!!form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Method"}</Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentMethods;
