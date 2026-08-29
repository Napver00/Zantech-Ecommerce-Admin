import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaEdit, FaBan, FaMoneyBillWave, FaSave, FaTimes } from "react-icons/fa";
import { Card, Row, Col, Button, Form, Badge, Modal, Spinner } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import "./CourseInvoices.css";

const STATUS_VARIANT = { due: "warning", partial: "info", paid: "success", void: "secondary" };

const ViewCourseInvoice = () => {
  usePageTitle("Course Invoice");
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ student_name: "", student_phone: "", student_email: "", amount: "", discount: "", note: "" });

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payTrxId, setPayTrxId] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/course-invoices/${id}`);
      const d = res.data.data;
      setInvoice(d);
      setEditForm({
        student_name: d.student_name || d.student?.name || "",
        student_phone: d.student_phone || "",
        student_email: d.student_email || "",
        amount: d.amount ?? "",
        discount: d.discount ?? "",
        note: d.note || "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load invoice");
      navigate("/course-invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const isLocked = invoice?.status === "paid" || invoice?.status === "void";

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put(`/course-invoices/${id}`, editForm);
      toast.success("Invoice updated");
      setIsEditing(false);
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async () => {
    if (!window.confirm("Void this invoice? This removes its contribution to revenue reports but keeps it in the database for audit history.")) return;
    try {
      await axiosInstance.delete(`/course-invoices/${id}`);
      toast.success("Invoice voided");
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to void invoice");
    }
  };

  const openPayModal = () => {
    setPayAmount("");
    setPayMethod("");
    setPayTrxId("");
    setPayNote("");
    setShowPayModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return toast.error("Enter a valid amount");
    if (Number(payAmount) > Number(invoice.due_amount)) return toast.error("Amount exceeds the due balance");
    setPaying(true);
    try {
      await axiosInstance.post(`/course-invoices/${id}/payments`, {
        amount: payAmount,
        payment_method: payMethod || undefined,
        trx_id: payTrxId || undefined,
        note: payNote || undefined,
      });
      toast.success("Payment recorded");
      setShowPayModal(false);
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Loading />;
  if (!invoice) return null;

  return (
    <div className="course-invoices-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => navigate("/course-invoices")}>
                <FaArrowLeft className="me-2" /> Back to Invoices
              </Button>
              <h2 className="page-title mb-1">{invoice.invoice_no || `Invoice #${invoice.id}`}</h2>
              <Badge bg={STATUS_VARIANT[invoice.status] || "secondary"} style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>
                {invoice.status}
              </Badge>
            </div>
            <div className="d-flex gap-2">
              {!isLocked && !isEditing && (
                <Button variant="success" onClick={openPayModal}>
                  <FaMoneyBillWave className="me-2" /> Add Payment
                </Button>
              )}
              {!isLocked && !isEditing && (
                <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                  <FaEdit className="me-2" /> Edit
                </Button>
              )}
              {invoice.status !== "void" && (
                <Button variant="outline-danger" onClick={handleVoid}>
                  <FaBan className="me-2" /> Void
                </Button>
              )}
            </div>
          </div>

          <div className="invoice-summary-grid mb-4">
            <div className="invoice-summary-item">
              <div className="label">Amount</div>
              <div className="value">৳{Number(invoice.amount).toLocaleString()}</div>
            </div>
            <div className="invoice-summary-item">
              <div className="label">Discount</div>
              <div className="value">৳{Number(invoice.discount || 0).toLocaleString()}</div>
            </div>
            <div className="invoice-summary-item">
              <div className="label">Paid</div>
              <div className="value text-success">৳{Number(invoice.paid_amount).toLocaleString()}</div>
            </div>
            <div className="invoice-summary-item">
              <div className="label">Due</div>
              <div className="value text-danger">৳{Number(invoice.due_amount).toLocaleString()}</div>
            </div>
          </div>

          {isLocked && invoice.status === "paid" && (
            <p className="text-muted small mb-4">This invoice is fully paid and can no longer be edited. Void it and create a new one if a correction is needed.</p>
          )}

          {isEditing ? (
            <Form onSubmit={handleSaveEdit}>
              <Card className="border mb-4">
                <Card.Header className="bg-light"><h5 className="mb-0">Edit Invoice</h5></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Student Name</Form.Label>
                        <Form.Control name="student_name" value={editForm.student_name} onChange={handleEditChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control name="student_phone" value={editForm.student_phone} onChange={handleEditChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="student_email" value={editForm.student_email} onChange={handleEditChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Amount (৳)</Form.Label>
                        <Form.Control type="number" min={0} step="0.01" name="amount" value={editForm.amount} onChange={handleEditChange} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discount (৳)</Form.Label>
                        <Form.Control type="number" min={0} step="0.01" name="discount" value={editForm.discount} onChange={handleEditChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Note</Form.Label>
                    <Form.Control as="textarea" rows={2} name="note" value={editForm.note} onChange={handleEditChange} />
                  </Form.Group>
                </Card.Body>
              </Card>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? <><Spinner animation="border" size="sm" className="me-2" />Saving...</> : <><FaSave className="me-1" /> Save Changes</>}
                </Button>
              </div>
            </Form>
          ) : (
            <>
              <Card className="border mb-4">
                <Card.Header className="bg-light"><h5 className="mb-0">Course & Student</h5></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="detail-label">Course</label>
                        <div className="detail-value">{invoice.course?.title || "—"}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="detail-label">Payment For</label>
                        <div className="detail-value">
                          {invoice.payment_for === "monthly" ? `Month ${invoice.month_number}` : "Full Course Fee"}
                        </div>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Student Name</label>
                        <div className="detail-value">{invoice.student_name || invoice.student?.name || "—"}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">School</label>
                        <div className="detail-value">{invoice.student?.school_name || "—"}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Phone</label>
                        <div className="detail-value">{invoice.student_phone || invoice.student?.parent_phone || "—"}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Email</label>
                        <div className="detail-value">{invoice.student_email || "—"}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="border mb-4">
                <Card.Header className="bg-light"><h5 className="mb-0">Payment Info</h5></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Issue Date</label>
                        <div className="detail-value">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "—"}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Payment Method</label>
                        <div className="detail-value">{invoice.payment_method || "—"}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Transaction ID</label>
                        <div className="detail-value">{invoice.trx_id || "—"}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <label className="detail-label">Created By</label>
                        <div className="detail-value">{invoice.creator?.name || "—"}</div>
                      </div>
                    </Col>
                  </Row>
                  <div className="mb-3">
                    <label className="detail-label">Note</label>
                    <div className="detail-value">{invoice.note || "No note"}</div>
                  </div>
                  {invoice.attachment_url && (
                    <div className="mb-2">
                      <label className="detail-label d-block">Attachment</label>
                      {invoice.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={invoice.attachment_url}
                          alt="attachment"
                          className="rounded"
                          style={{ maxHeight: 160, cursor: "pointer" }}
                          onClick={() => window.open(invoice.attachment_url, "_blank")}
                        />
                      ) : (
                        <a href={invoice.attachment_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                          View Attachment
                        </a>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
        <Form onSubmit={handleAddPayment}>
          <Modal.Header closeButton>
            <Modal.Title>Record Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted small">
              Due balance: <span className="fw-bold text-danger">৳{Number(invoice.due_amount).toLocaleString()}</span>
            </p>
            <Form.Group className="mb-3">
              <Form.Label>Amount (৳) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                min={0.01}
                max={invoice.due_amount}
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">Bank</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Transaction ID</Form.Label>
              <Form.Control value={payTrxId} onChange={(e) => setPayTrxId(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control as="textarea" rows={2} value={payNote} onChange={(e) => setPayNote(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPayModal(false)}>
              <FaTimes className="me-1" /> Cancel
            </Button>
            <Button variant="success" type="submit" disabled={paying}>
              {paying ? <><Spinner animation="border" size="sm" className="me-2" />Recording...</> : "Record Payment"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewCourseInvoice;
