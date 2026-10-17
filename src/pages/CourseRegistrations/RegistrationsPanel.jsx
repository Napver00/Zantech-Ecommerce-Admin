import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Card, Form, InputGroup, Button, Row, Col, Modal, Badge, Pagination, Spinner } from "react-bootstrap";
import { FaSearch, FaSpinner, FaTimes, FaEye, FaCheck, FaBan, FaTrash, FaFileInvoice } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import CommonTable from "../../components/Common/CommonTable";
import "./RegistrationsPanel.css";

// Registrations submitted from the website's course registration form.
// Used on its own page (all courses) and inside a course's edit page (courseId set).

const STATUS_BADGE = { pending: "warning", approved: "success", rejected: "danger" };

const fmtDate = (d) => (d ? format(new Date(d), "dd MMM yyyy, h:mm a") : "—");
const fmtMoney = (n) => (n == null || n === "" ? "—" : `৳${Number(n).toLocaleString()}`);
const errMsg = (err, fallback) => {
  const e = err.response?.data?.errors;
  if (typeof e === "string") return e;
  if (e && typeof e === "object") return Object.values(e).flat()[0];
  return err.response?.data?.message || fallback;
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const InfoRow = ({ label, children }) => (
  <div className="reg-info-row">
    <div className="reg-info-label">{label}</div>
    <div className="reg-info-value">{children || "—"}</div>
  </div>
);

const RegistrationsPanel = ({ courseId = null, openId = null, onChanged }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(courseId ? "" : "pending");
  const [courseFilter, setCourseFilter] = useState("");
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total_rows: 0, current_page: 1, total_pages: 1, has_more_pages: false });

  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const effectiveCourse = courseId || courseFilter;

  const fetchRows = useCallback(async (pageNum = 1, searchVal = search) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit };
      if (effectiveCourse) params.course_id = effectiveCourse;
      if (status) params.status = status;
      if (searchVal) params.search = searchVal;
      const res = await axiosInstance.get("/course-registrations", { params });
      const raw = res.data.data;
      setRows(Array.isArray(raw) ? raw : raw ? [raw] : []);
      setPagination(res.data.pagination || { total_rows: (raw || []).length, current_page: 1, total_pages: 1, has_more_pages: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load registrations");
      setRows([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCourse, status, limit]);

  useEffect(() => { setPage(1); fetchRows(1); }, [fetchRows]);

  const searchMounted = useRef(false);
  useEffect(() => {
    if (!searchMounted.current) { searchMounted.current = true; return; }
    setIsSearching(true);
    const id = setTimeout(() => { setPage(1); fetchRows(1, search); }, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Course list for the filter (only on the all-courses page)
  useEffect(() => {
    if (courseId) return;
    axiosInstance.get("/courses").then((res) => {
      const d = res.data.data;
      setCourses(Array.isArray(d) ? d : d ? [d] : []);
    }).catch(() => setCourses([]));
  }, [courseId]);

  const openDetails = useCallback(async (id) => {
    try {
      const res = await axiosInstance.get(`/course-registrations/${id}`); // also marks it as seen
      setSelected(res.data.data);
      setNote(res.data.data.admin_note || "");
      window.dispatchEvent(new Event("registrations:changed"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load registration");
    }
  }, []);

  // Deep link from the header notification: ?id=123
  useEffect(() => { if (openId) openDetails(openId); }, [openId, openDetails]);

  const afterChange = (updated, message) => {
    toast.success(message);
    if (updated) setSelected((s) => ({ ...s, ...updated }));
    fetchRows(page);
    onChanged?.();
    window.dispatchEvent(new Event("registrations:changed"));
  };

  const approve = async () => {
    setActing(true);
    try {
      const res = await axiosInstance.post(`/course-registrations/${selected.id}/approve`, { admin_note: note || null });
      afterChange(res.data.data, "Approved — student enrolled. You can now create the invoice.");
    } catch (err) {
      toast.error(errMsg(err, "Failed to approve"));
    } finally {
      setActing(false);
    }
  };

  const reject = async () => {
    if (!window.confirm("Reject this registration?")) return;
    setActing(true);
    try {
      const res = await axiosInstance.post(`/course-registrations/${selected.id}/reject`, { admin_note: note || null });
      afterChange(res.data.data, "Registration rejected");
    } catch (err) {
      toast.error(errMsg(err, "Failed to reject"));
    } finally {
      setActing(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this registration permanently?")) return;
    setActing(true);
    try {
      await axiosInstance.delete(`/course-registrations/${selected.id}`);
      setSelected(null);
      afterChange(null, "Registration deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setActing(false);
    }
  };

  const createInvoice = (r) =>
    navigate(`/course-invoices/add?course_id=${r.course_id}&student_id=${r.student_id}`);

  const headers = [
    {
      key: "created_at",
      label: "Submitted",
      render: (r) => (
        <div className="small">
          {fmtDate(r.created_at)}
          {!r.seen_at && <Badge bg="primary" className="ms-1">New</Badge>}
        </div>
      ),
    },
    {
      key: "student_name",
      label: "Student",
      render: (r) => (
        <div>
          <Button variant="link" className="p-0 text-decoration-none fw-medium" onClick={() => openDetails(r.id)}>{r.student_name}</Button>
          <div className="small text-muted">{r.age_class} · {r.school_name}</div>
        </div>
      ),
    },
    ...(courseId ? [] : [{ key: "course", label: "Course", render: (r) => r.course?.title || "—" }]),
    {
      key: "guardian_name",
      label: "Guardian / Contact",
      render: (r) => (
        <div className="small">
          {r.guardian_name}
          <div><a href={`tel:${r.contact_number}`}>{r.contact_number}</a></div>
        </div>
      ),
    },
    { key: "class_slot", label: "Class Slot", render: (r) => <span className="small">{r.class_slot || "—"}</span> },
    {
      key: "payment",
      label: "Payment",
      render: (r) => (
        <div className="small">
          <span className="fw-medium">{fmtMoney(r.amount)}</span> · {(r.payment_method_label || "").split(" — ")[0] || "—"}
          <div className="text-muted">TrxID: <code>{r.transaction_id || "—"}</code></div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge bg={STATUS_BADGE[r.status] || "secondary"} className="text-capitalize">{r.status}</Badge>,
    },
  ];

  const renderActions = (r) => (
    <div className="d-flex gap-2">
      <Button variant="outline-secondary" size="sm" onClick={() => openDetails(r.id)} title="View details">
        <FaEye />
      </Button>
      {r.status === "approved" && r.student_id && (
        <Button variant="outline-success" size="sm" onClick={() => createInvoice(r)} title="Create invoice">
          <FaFileInvoice />
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {STATUS_TABS.map((t) => (
          <Button key={t.value || "all"} size="sm" variant={status === t.value ? "primary" : "outline-secondary"} onClick={() => setStatus(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>

      <Row className="mb-3 g-2">
        <Col md={courseId ? 6 : 4}>
          <InputGroup>
            <InputGroup.Text>{isSearching ? <FaSpinner className="fa-spin" /> : <FaSearch />}</InputGroup.Text>
            <Form.Control
              placeholder="Search name, phone, email or TrxID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <Button variant="outline-secondary" onClick={() => setSearch("")}><FaTimes /></Button>}
          </InputGroup>
        </Col>
        {!courseId && (
          <Col md={4}>
            <Form.Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Form.Select>
          </Col>
        )}
        <Col md={2}>
          <Form.Select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </Form.Select>
        </Col>
      </Row>

      <p className="text-muted small mb-2">
        {loading ? "Loading..." : `${pagination.total_rows} registration${pagination.total_rows !== 1 ? "s" : ""}`}
      </p>

      <CommonTable headers={headers} data={rows} tableLoading={loading} loading={loading} renderActions={renderActions} />

      {pagination.total_pages > 1 && (
        <div className="pagination-container mt-3">
          <Pagination className="modern-pagination">
            <Pagination.Prev disabled={pagination.current_page === 1} onClick={() => { setPage(page - 1); fetchRows(page - 1); }} />
            {[...Array(pagination.total_pages)].map((_, i) => (
              <Pagination.Item key={i + 1} active={i + 1 === pagination.current_page} onClick={() => { setPage(i + 1); fetchRows(i + 1); }}>
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={!pagination.has_more_pages} onClick={() => { setPage(page + 1); fetchRows(page + 1); }} />
          </Pagination>
        </div>
      )}

      {/* ── Details ── */}
      <Modal show={!!selected} onHide={() => setSelected(null)} size="xl" dialogClassName="registration-modal" className="registration-modal-layer" backdropClassName="registration-modal-layer" centered scrollable>
        {selected && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="d-flex align-items-center gap-2 flex-wrap">
                REG-{String(selected.id).padStart(5, "0")}
                <Badge bg={STATUS_BADGE[selected.status] || "secondary"} className="text-capitalize">{selected.status}</Badge>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted small mb-3">
                Submitted {fmtDate(selected.created_at)} for <strong>{selected.course?.title}</strong>
              </p>
              <Row className="g-3">
                <Col lg={4} md={6}>
                  <div className="reg-section">
                    <div className="reg-section-title">Student</div>
                    <InfoRow label="Full name">{selected.student_name}</InfoRow>
                    <InfoRow label="Email"><a href={`mailto:${selected.email}`}>{selected.email}</a></InfoRow>
                    <InfoRow label="Age / Class">{selected.age_class}</InfoRow>
                    <InfoRow label="School">{selected.school_name}</InfoRow>
                    <InfoRow label="Class slot">{selected.class_slot}</InfoRow>
                  </div>
                </Col>
                <Col lg={4} md={6}>
                  <div className="reg-section">
                    <div className="reg-section-title">Parent / Guardian</div>
                    <InfoRow label="Name">{selected.guardian_name}</InfoRow>
                    <InfoRow label="Contact">
                      <a href={`tel:${selected.contact_number}`}>{selected.contact_number}</a>
                      <a href={`https://wa.me/88${selected.contact_number.replace(/\D/g, "").replace(/^88/, "")}`} target="_blank" rel="noopener noreferrer" className="small ms-2">WhatsApp</a>
                    </InfoRow>
                    <InfoRow label="Alternative">
                      {selected.alt_contact_number ? <a href={`tel:${selected.alt_contact_number}`}>{selected.alt_contact_number}</a> : null}
                    </InfoRow>
                  </div>
                </Col>
                <Col lg={4} md={12}>
                  <div className="reg-section">
                    <div className="reg-section-title">Payment</div>
                    <InfoRow label="Method">{selected.payment_method_label}</InfoRow>
                    <InfoRow label="Paid from">{selected.payer_account}</InfoRow>
                    <InfoRow label="Transaction ID"><code>{selected.transaction_id}</code></InfoRow>
                    <InfoRow label="Amount"><span className="reg-amount">{fmtMoney(selected.amount)}</span></InfoRow>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="reg-section">
                    <div className="reg-section-title">Review</div>
                    <Row className="g-3">
                      <Col md={6}>
                        <InfoRow label="Reviewed">{selected.reviewed_at ? `${fmtDate(selected.reviewed_at)}${selected.reviewer?.name ? ` by ${selected.reviewer.name}` : ""}` : null}</InfoRow>
                        <InfoRow label="Student record">
                          {selected.student_id ? (
                            <Button variant="link" className="p-0" onClick={() => navigate(`/students/${selected.student_id}`)}>
                              {selected.student?.name || `#${selected.student_id}`}
                            </Button>
                          ) : null}
                        </InfoRow>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold">Admin note</Form.Label>
                          <Form.Control as="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Payment verified in bKash statement" disabled={selected.status === "approved"} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
              {selected.status === "pending" && (
                <p className="small text-muted mb-0 mt-3">
                  Check that <strong>{fmtMoney(selected.amount)}</strong> with TrxID <code>{selected.transaction_id}</code> arrived before approving.
                  Approving creates the student and enrolls them in this course.
                </p>
              )}
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
              <Button variant="outline-danger" size="sm" onClick={remove} disabled={acting}>
                <FaTrash className="me-1" /> Delete
              </Button>
              <div className="d-flex gap-2 flex-wrap">
                {selected.status !== "approved" && (
                  <>
                    {selected.status === "pending" && (
                      <Button variant="outline-danger" onClick={reject} disabled={acting}>
                        <FaBan className="me-1" /> Reject
                      </Button>
                    )}
                    <Button variant="success" onClick={approve} disabled={acting}>
                      {acting ? <Spinner size="sm" animation="border" className="me-1" /> : <FaCheck className="me-1" />}
                      Approve & Enroll
                    </Button>
                  </>
                )}
                {selected.status === "approved" && selected.student_id && (
                  <Button variant="primary" onClick={() => createInvoice(selected)}>
                    <FaFileInvoice className="me-1" /> Create Invoice
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
};

export const RegistrationsCard = ({ courseId }) => (
  <Card className="border mb-4">
    <Card.Header className="bg-light"><h5 className="mb-0">Registrations from Website</h5></Card.Header>
    <Card.Body>
      <RegistrationsPanel courseId={courseId} />
    </Card.Body>
  </Card>
);

export default RegistrationsPanel;
