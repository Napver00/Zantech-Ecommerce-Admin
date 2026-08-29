import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaEdit, FaTrash, FaPlus, FaSpinner } from "react-icons/fa";
import { Card, Row, Col, Button, Form, Badge, Modal, Spinner } from "react-bootstrap";
import Select from "react-select";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import "../CourseInvoices/CourseInvoices.css";

const selectMenuProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  menuPlacement: "auto",
  styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const ViewStudent = () => {
  usePageTitle("Student Details");
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState([]);
  const [ledgers, setLedgers] = useState({}); // course_id -> ledger data

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", school_name: "", parent_phone: "" });
  const [saving, setSaving] = useState(false);

  const [enrollCourseOpt, setEnrollCourseOpt] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/students/${id}`);
      const d = res.data.data;
      setStudent(d);
      setEditForm({ name: d.name || "", school_name: d.school_name || "", parent_phone: d.parent_phone || "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load student");
      navigate("/students");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);

  useEffect(() => {
    axiosInstance
      .get("/courses")
      .then((res) => setAllCourses(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => {});
  }, []);

  const enrolledCourseIds = useMemo(() => new Set((student?.courses || []).map((c) => c.id)), [student]);

  const courseOptions = useMemo(
    () => allCourses.filter((c) => !enrolledCourseIds.has(c.id)).map((c) => ({ value: c.id, label: c.title })),
    [allCourses, enrolledCourseIds]
  );

  const coursesById = useMemo(() => {
    const map = {};
    allCourses.forEach((c) => { map[c.id] = c; });
    return map;
  }, [allCourses]);

  // Fetch fee ledgers for every enrolled monthly-plan course
  useEffect(() => {
    if (!student?.courses?.length || !allCourses.length) return;
    const monthlyCourseIds = student.courses
      .filter((c) => coursesById[c.id]?.payment_type === "monthly")
      .map((c) => c.id);
    if (!monthlyCourseIds.length) return;

    Promise.all(
      monthlyCourseIds.map((cid) =>
        axiosInstance
          .get(`/course-invoices/ledger/${cid}/${id}`)
          .then((res) => [cid, res.data.data])
          .catch(() => [cid, null])
      )
    ).then((pairs) => {
      setLedgers((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, allCourses]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error("Name is required");
    if (!editForm.parent_phone.trim()) return toast.error("Parent's phone is required");
    setSaving(true);
    try {
      await axiosInstance.put(`/students/${id}`, editForm);
      toast.success("Student updated");
      setShowEditModal(false);
      fetchStudent();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollCourseOpt) return toast.error("Select a course to enroll in");
    setEnrolling(true);
    try {
      await axiosInstance.post(`/students/${id}/courses`, { course_id: enrollCourseOpt.value });
      toast.success("Enrolled successfully");
      setEnrollCourseOpt(null);
      fetchStudent();
    } catch (err) {
      // "already enrolled" is a soft/expected case — just refresh instead of erroring loudly
      if (err.response?.status === 422) {
        toast("Already enrolled — refreshing list", { icon: "ℹ️" });
        fetchStudent();
      } else {
        toast.error(err.response?.data?.message || "Failed to enroll student");
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm("Unenroll this student from the course? Past invoices for that course are unaffected.")) return;
    try {
      await axiosInstance.delete(`/students/${id}/courses/${courseId}`);
      toast.success("Unenrolled successfully");
      fetchStudent();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unenroll student");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this student? This removes all their course enrollments. Invoices already issued to them are kept for records, but will no longer link to a live student record.")) return;
    try {
      await axiosInstance.delete(`/students/${id}`);
      toast.success("Student deleted");
      navigate("/students");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student");
    }
  };

  if (loading) return <Loading />;
  if (!student) return null;

  return (
    <div className="course-invoices-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => navigate("/students")}>
                <FaArrowLeft className="me-2" /> Back to Students
              </Button>
              <h2 className="page-title mb-1">{student.name}</h2>
              <p className="text-muted mb-0">{student.school_name || "No school on record"}</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => setShowEditModal(true)}>
                <FaEdit className="me-2" /> Edit
              </Button>
              <Button variant="outline-danger" onClick={handleDelete}>
                <FaTrash className="me-2" /> Delete
              </Button>
            </div>
          </div>

          <Row className="mb-4">
            <Col md={4}>
              <div className="mb-3">
                <label className="detail-label">Parent's Phone</label>
                <div className="detail-value">{student.parent_phone}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="mb-3">
                <label className="detail-label">School</label>
                <div className="detail-value">{student.school_name || "—"}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="mb-3">
                <label className="detail-label">Enrolled Courses</label>
                <div className="detail-value">{student.courses?.length || 0}</div>
              </div>
            </Col>
          </Row>

          <Card className="border mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Enroll in another course</h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-end">
                <Col md={8}>
                  <Select
                    options={courseOptions}
                    value={enrollCourseOpt}
                    onChange={setEnrollCourseOpt}
                    placeholder={courseOptions.length ? "Select a course..." : "Already enrolled in all courses"}
                    isDisabled={!courseOptions.length || enrolling}
                    {...selectMenuProps}
                  />
                </Col>
                <Col md={4}>
                  <Button variant="primary" className="w-100" onClick={handleEnroll} disabled={!enrollCourseOpt || enrolling}>
                    {enrolling ? <Spinner animation="border" size="sm" /> : <><FaPlus className="me-1" /> Enroll</>}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border">
            <Card.Header className="bg-light d-flex align-items-center gap-2">
              <h5 className="mb-0">Enrolled Courses & Fee Status</h5>
              <Badge bg="secondary" pill>{student.courses?.length || 0}</Badge>
            </Card.Header>
            <Card.Body>
              {!student.courses?.length ? (
                <p className="text-muted small mb-0">Not enrolled in any course yet.</p>
              ) : (
                student.courses.map((c) => {
                  const course = coursesById[c.id];
                  const ledger = ledgers[c.id];
                  const isMonthly = course?.payment_type === "monthly";
                  return (
                    <div key={c.id} className="border rounded p-3 mb-3">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div>
                          <strong>{c.title}</strong>
                          <div className="text-muted small">
                            Enrolled {(c.pivot?.enrolled_at || c.enrolled_at) ? new Date(c.pivot?.enrolled_at || c.enrolled_at).toLocaleDateString() : "—"}
                            {isMonthly && course?.duration_months ? ` · Monthly plan, ${course.duration_months} months` : " · Full payment"}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/course-invoices/add?course_id=${c.id}&student_id=${id}`)}
                          >
                            New Invoice
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleUnenroll(c.id)}>
                            Unenroll
                          </Button>
                        </div>
                      </div>
                      {isMonthly && (
                        ledger === undefined ? (
                          <span className="text-muted small"><FaSpinner className="fa-spin me-1" />Loading fee status...</span>
                        ) : ledger ? (
                          <div>
                            <span className="text-muted small d-block mb-1">
                              Paid months ({ledger.paid_months.length}/{course.duration_months}){ledger.fully_paid ? " — fully paid" : ""}:
                            </span>
                            <div className="ledger-months-grid">
                              {Array.from({ length: course.duration_months }, (_, i) => i + 1).map((m) => (
                                <span key={m} className={`ledger-month-chip ${ledger.paid_months.includes(m) ? "paid" : ""}`}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted small">No fee status available yet.</span>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Student</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>School</Form.Label>
              <Form.Control value={editForm.school_name} onChange={(e) => setEditForm((p) => ({ ...p, school_name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Parent's Phone <span className="text-danger">*</span></Form.Label>
              <Form.Control value={editForm.parent_phone} onChange={(e) => setEditForm((p) => ({ ...p, parent_phone: e.target.value }))} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewStudent;
