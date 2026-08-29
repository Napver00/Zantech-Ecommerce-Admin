import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { Row, Col, Card, Form, Button, Badge, Spinner } from "react-bootstrap";
import Select from "react-select";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import "./CourseInvoices.css";

const today = () => new Date().toISOString().slice(0, 10);

const selectMenuProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  menuPlacement: "auto",
  styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const AddCourseInvoice = () => {
  usePageTitle("New Course Invoice");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCourseId = searchParams.get("course_id");
  const prefillStudentId = searchParams.get("student_id");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [paymentFor, setPaymentFor] = useState("full");
  const [monthNumber, setMonthNumber] = useState("");
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", school_name: "", parent_phone: "" });
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [trxId, setTrxId] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const [saving, setSaving] = useState(false);

  const isMonthlyCourse = selectedCourse?.payment_type === "monthly";

  useEffect(() => {
    axiosInstance
      .get("/courses")
      .then((res) => setCourses(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => toast.error("Failed to load courses"))
      .finally(() => setCoursesLoading(false));
  }, []);

  const courseOptions = useMemo(
    () =>
      courses.map((c) => ({
        value: c.id,
        label: `${c.title}${c.payment_type === "monthly" ? " (Monthly)" : ""}`,
        course: c,
      })),
    [courses]
  );

  const computeDefaultAmount = (course, payFor) => {
    if (!course) return "";
    if (payFor === "monthly") return course.monthly_fee ?? "";
    return course.discount_price ?? course.price ?? "";
  };

  const handleCourseChange = (opt) => {
    const course = opt?.course || null;
    setSelectedCourse(course);
    const nextPaymentFor = course?.payment_type === "monthly" ? "monthly" : "full";
    setPaymentFor(nextPaymentFor);
    setMonthNumber("");
    setLedger(null);
    setAmount(computeDefaultAmount(course, nextPaymentFor));
    setStudentId(null);
    setStudentName("");
    setStudentPhone("");
    setStudentEmail("");
    setEnrolledStudents([]);
  };

  const fetchEnrolledStudents = useCallback(async () => {
    if (!selectedCourse) {
      setEnrolledStudents([]);
      return;
    }
    setEnrolledLoading(true);
    try {
      const res = await axiosInstance.get(`/courses/${selectedCourse.id}/students`);
      setEnrolledStudents(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setEnrolledStudents([]);
    } finally {
      setEnrolledLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchEnrolledStudents();
  }, [fetchEnrolledStudents]);

  // Deep-link support: pre-select course from ?course_id= once options are loaded
  useEffect(() => {
    if (!prefillCourseId || !courseOptions.length || selectedCourse) return;
    const opt = courseOptions.find((o) => String(o.value) === String(prefillCourseId));
    if (opt) handleCourseChange(opt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCourseId, courseOptions]);

  const studentOptions = useMemo(
    () =>
      enrolledStudents.map((s) => ({
        value: s.id,
        label: `${s.name}${s.school_name ? ` — ${s.school_name}` : ""} (${s.parent_phone})`,
        student: s,
      })),
    [enrolledStudents]
  );

  const handleStudentSelect = (opt) => {
    const s = opt?.student || null;
    setStudentId(s?.id ?? null);
    setStudentName(s?.name || "");
    setStudentPhone(s?.parent_phone || "");
  };

  // Deep-link support: pre-select student from ?student_id= once the enrolled list is loaded
  useEffect(() => {
    if (!prefillStudentId || !studentOptions.length || studentId) return;
    const opt = studentOptions.find((o) => String(o.value) === String(prefillStudentId));
    if (opt) handleStudentSelect(opt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillStudentId, studentOptions]);

  const handleCreateAndEnrollStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) return toast.error("Name is required");
    if (!newStudent.parent_phone.trim()) return toast.error("Parent's phone is required");
    setCreatingStudent(true);
    try {
      const res = await axiosInstance.post("/students", { ...newStudent, course_id: selectedCourse.id });
      toast.success("Student created and enrolled");
      const created = res.data.data;
      setNewStudent({ name: "", school_name: "", parent_phone: "" });
      setShowNewStudentForm(false);
      await fetchEnrolledStudents();
      if (created?.id) {
        setStudentId(created.id);
        setStudentName(created.name || "");
        setStudentPhone(created.parent_phone || "");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create student");
    } finally {
      setCreatingStudent(false);
    }
  };

  const handlePaymentForChange = (val) => {
    setPaymentFor(val);
    setMonthNumber("");
    setAmount(computeDefaultAmount(selectedCourse, val));
  };

  const fetchLedger = useCallback(async () => {
    if (!selectedCourse || !studentId || paymentFor !== "monthly") {
      setLedger(null);
      return;
    }
    setLedgerLoading(true);
    try {
      const res = await axiosInstance.get(`/course-invoices/ledger/${selectedCourse.id}/${studentId}`);
      setLedger(res.data.data);
    } catch {
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }, [selectedCourse, studentId, paymentFor]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleAttachment = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachment(file);
    if (file.type.startsWith("image/")) setAttachmentPreview(URL.createObjectURL(file));
    else setAttachmentPreview(null);
  };

  const monthOptions = useMemo(() => {
    if (!isMonthlyCourse || !selectedCourse?.duration_months) return [];
    const paid = new Set(ledger?.paid_months || []);
    return Array.from({ length: selectedCourse.duration_months }, (_, i) => i + 1).map((m) => ({
      value: m,
      paid: paid.has(m),
    }));
  }, [isMonthlyCourse, selectedCourse, ledger]);

  const dueAmount = useMemo(() => {
    const a = Number(amount) || 0;
    const d = Number(discount) || 0;
    const p = Number(paidAmount) || 0;
    return Math.max(a - d - p, 0);
  }, [amount, discount, paidAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return toast.error("Please select a course");
    if (!isWalkIn && !studentId) return toast.error("Please select a student, or switch to walk-in and enter their name");
    if (isWalkIn && !studentName.trim()) return toast.error("Student name is required for a walk-in student");
    if (paymentFor === "monthly") {
      if (!monthNumber) return toast.error("Please select which month this invoice is for");
      if (Number(monthNumber) > (selectedCourse.duration_months || 0))
        return toast.error("Month number exceeds the course duration");
    }
    if (amount === "" || Number(amount) < 0) return toast.error("Please enter a valid amount");

    setSaving(true);
    const fd = new FormData();
    fd.append("course_id", selectedCourse.id);
    fd.append("payment_for", paymentFor);
    if (!isWalkIn && studentId) fd.append("student_id", studentId);
    if (studentName) fd.append("student_name", studentName);
    if (studentPhone) fd.append("student_phone", studentPhone);
    if (studentEmail) fd.append("student_email", studentEmail);
    if (paymentFor === "monthly") fd.append("month_number", monthNumber);
    fd.append("amount", amount);
    fd.append("discount", discount || 0);
    fd.append("paid_amount", paidAmount || 0);
    if (paymentMethod) fd.append("payment_method", paymentMethod);
    if (trxId) fd.append("trx_id", trxId);
    if (issueDate) fd.append("issue_date", issueDate);
    if (note) fd.append("note", note);
    if (attachment) fd.append("attachment", attachment);

    try {
      await axiosInstance.post("/course-invoices", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Invoice created successfully");
      navigate("/course-invoices");
    } catch (err) {
      const rawMsg = err.response?.data?.message || "";
      const msg =
        err.response?.data?.errors && typeof err.response.data.errors === "object"
          ? Object.values(err.response.data.errors).flat().join(", ")
          : rawMsg || "Failed to create invoice";
      toast.error(msg);

      // Recover from the known 422 cases by refreshing the stale data that caused them
      if (rawMsg.includes("not enrolled")) {
        fetchEnrolledStudents();
      } else if (rawMsg.includes("already exists")) {
        fetchLedger();
      } else if (rawMsg.includes("not set up for monthly")) {
        handlePaymentForChange("full");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-blog-container">
      <div className="add-blog-header">
        <h2>New Course Invoice</h2>
        <p className="text-muted">Create a manual invoice for a student's course fee</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Course</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={courseOptions}
                    isLoading={coursesLoading}
                    onChange={handleCourseChange}
                    placeholder="Select a course..."
                    isClearable
                    {...selectMenuProps}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment For <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={paymentFor}
                    onChange={(e) => handlePaymentForChange(e.target.value)}
                    disabled={!selectedCourse}
                  >
                    {isMonthlyCourse && <option value="monthly">Monthly Installment</option>}
                    <option value="full">Full Course Fee</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {paymentFor === "monthly" && (
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Month <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={monthNumber} onChange={(e) => setMonthNumber(e.target.value)}>
                      <option value="">Select month</option>
                      {monthOptions.map((m) => (
                        <option key={m.value} value={m.value} disabled={m.paid}>
                          Month {m.value}{m.paid ? " — already invoiced" : ""}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            {isMonthlyCourse && paymentFor === "monthly" && (
              <div className="mb-2">
                {ledgerLoading ? (
                  <span className="text-muted small"><Spinner animation="border" size="sm" className="me-1" />Checking paid months...</span>
                ) : ledger ? (
                  <div>
                    <span className="text-muted small d-block mb-1">
                      Paid months for this student ({ledger.paid_months.length}/{selectedCourse.duration_months}):
                    </span>
                    <div className="ledger-months-grid">
                      {Array.from({ length: selectedCourse.duration_months }, (_, i) => i + 1).map((m) => (
                        <span
                          key={m}
                          className={`ledger-month-chip ${ledger.paid_months.includes(m) ? "paid" : ""} ${String(monthNumber) === String(m) ? "current" : ""}`}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : !isWalkIn && studentId ? null : (
                  <span className="text-muted small">
                    Select a registered student to see which months are already paid. For walk-in students, duplicate months are still checked by phone number on save.
                  </span>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card className="border mb-4">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Student</h5>
            <Form.Check
              type="switch"
              id="walkin-switch"
              label="Walk-in (no student record)"
              checked={isWalkIn}
              onChange={(e) => {
                setIsWalkIn(e.target.checked);
                setStudentId(null);
                setStudentName("");
                setStudentPhone("");
                setStudentEmail("");
                setLedger(null);
                setShowNewStudentForm(false);
              }}
            />
          </Card.Header>
          <Card.Body>
            {!selectedCourse ? (
              <p className="text-muted small mb-0">Select a course first to see its enrolled students.</p>
            ) : !isWalkIn ? (
              <>
                <Row className="align-items-end mb-2">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Enrolled Student <span className="text-danger">*</span></Form.Label>
                      <Select
                        key={enrolledStudents.length}
                        options={studentOptions}
                        isLoading={enrolledLoading}
                        onChange={handleStudentSelect}
                        placeholder={enrolledStudents.length ? "Select an enrolled student..." : "No students enrolled in this course yet"}
                        isClearable
                        isDisabled={enrolledLoading}
                        noOptionsMessage={() => "No enrolled students"}
                        {...selectMenuProps}
                      />
                      <Form.Text className="text-muted">
                        Only students enrolled in this course are listed. Not enrolled yet? Use "New Student" to create and enroll them in one step.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button variant="outline-primary" className="w-100" onClick={() => setShowNewStudentForm((p) => !p)}>
                      {showNewStudentForm ? "Cancel" : "New Student"}
                    </Button>
                  </Col>
                </Row>

                {showNewStudentForm && (
                  <Form onSubmit={handleCreateAndEnrollStudent} className="border rounded p-3 mb-3">
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            value={newStudent.name}
                            onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Student's full name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>School</Form.Label>
                          <Form.Control
                            value={newStudent.school_name}
                            onChange={(e) => setNewStudent((p) => ({ ...p, school_name: e.target.value }))}
                            placeholder="School name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label>Parent's Phone <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            value={newStudent.parent_phone}
                            onChange={(e) => setNewStudent((p) => ({ ...p, parent_phone: e.target.value }))}
                            placeholder="01xxxxxxxxx"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button type="submit" variant="primary" size="sm" disabled={creatingStudent}>
                      {creatingStudent ? "Saving..." : "Create & Enroll"}
                    </Button>
                  </Form>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Contact Email <span className="text-muted fw-normal">(optional, for this invoice only)</span></Form.Label>
                  <Form.Control type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@email.com" />
                </Form.Group>

                {studentId && (
                  <div className="text-muted small">
                    Selected: {studentName} {studentPhone && `· ${studentPhone}`}
                  </div>
                )}
              </>
            ) : (
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student name" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder="01xxxxxxxxx" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@email.com" />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        <Card className="border mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Payment Details</h5>
          </Card.Header>
          <Card.Body>
            {!selectedCourse && (
              <p className="text-muted small mb-3">Select a course above to enter payment details.</p>
            )}
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount (৳) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!selectedCourse}
                    required
                  />
                  {selectedCourse && (
                    <Form.Text className="text-muted">
                      Auto-filled from course price. Edit if needed.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount (৳)</Form.Label>
                  <Form.Control type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={!selectedCourse} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Paid Now (৳)</Form.Label>
                  <Form.Control type="number" min={0} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} disabled={!selectedCourse} />
                  <Form.Text className="text-muted">Amount actually collected right now.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Issue Date</Form.Label>
                  <Form.Control type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={!selectedCourse} />
                </Form.Group>
              </Col>
            </Row>

            {selectedCourse && (
              <div className="invoice-summary-grid mb-3">
                <div className="invoice-summary-item">
                  <div className="label">Amount</div>
                  <div className="value">৳{(Number(amount) || 0).toLocaleString()}</div>
                </div>
                <div className="invoice-summary-item">
                  <div className="label">Discount</div>
                  <div className="value">৳{(Number(discount) || 0).toLocaleString()}</div>
                </div>
                <div className="invoice-summary-item">
                  <div className="label">Paid Now</div>
                  <div className="value text-success">৳{(Number(paidAmount) || 0).toLocaleString()}</div>
                </div>
                <div className="invoice-summary-item">
                  <div className="label">Due</div>
                  <div className="value text-danger">৳{dueAmount.toLocaleString()}</div>
                </div>
              </div>
            )}

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} disabled={!selectedCourse}>
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="bank">Bank</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction ID</Form.Label>
                  <Form.Control value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="e.g. bKash TrxID" disabled={!selectedCourse} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Attachment <span className="text-muted fw-normal">(receipt photo, jpg/png/pdf, max 4MB)</span></Form.Label>
                  <Form.Control type="file" accept="image/jpg,image/jpeg,image/png,application/pdf" onChange={handleAttachment} disabled={!selectedCourse} />
                  {attachmentPreview && (
                    <img src={attachmentPreview} alt="attachment" className="mt-2 rounded" style={{ maxHeight: 80 }} />
                  )}
                  {attachment && !attachmentPreview && <Badge bg="secondary" className="mt-2">{attachment.name}</Badge>}
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control as="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional internal note" disabled={!selectedCourse} />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="form-actions">
          <button type="button" className="btn btn-light" onClick={() => navigate("/course-invoices")}>
            <FaArrowLeft className="me-2" /> Back to Invoices
          </button>
          <button type="submit" className="btn btn-primary btn-with-icon" disabled={saving || !selectedCourse}>
            {saving ? <><Spinner animation="border" size="sm" className="me-2" />Saving...</> : <><FaSave className="me-1" /> Create Invoice</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourseInvoice;
