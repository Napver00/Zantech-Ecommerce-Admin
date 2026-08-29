import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaUserGraduate } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import { Row, Col, Card, Form, Button, Badge, Spinner } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";

const studentSelectMenuProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  menuPlacement: "auto",
  styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const COURSE_TYPES = [
  { value: "online_live", label: "Online Live" },
  { value: "recorded", label: "Recorded" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const emptyCurriculum = () => ({ title: "", description: "" });
const emptySchedule = () => ({ course_type: "online_live", start_datetime: "" });
const emptyMentor = () => ({
  name: "", description: "", experience: "",
  is_student_mentor: false, image: null, imagePreview: null,
});

const SectionHeader = ({ title, badge }) => (
  <Card.Header className="bg-light d-flex align-items-center gap-2">
    <h5 className="mb-0">{title}</h5>
    {badge !== undefined && <Badge bg="secondary" pill>{badge}</Badge>}
  </Card.Header>
);

const ViewCourse = () => {
  usePageTitle("Edit Course");
  const { slug } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState(null);

  const [form, setForm] = useState({
    title: "", description: "", short_description: "",
    category: "", tags: "", price: "", discount_price: "",
    payment_type: "one_time", admission_fee: "", duration_months: "",
    reg_link: "", serial_number: "", is_active: true,
    meta_title: "", meta_description: "",
    thumbnail: null, thumbnailPreview: null, thumbnailUrl: null,
  });

  const isMonthly = form.payment_type === "monthly";
  const computedMonthlyFee =
    isMonthly && form.discount_price !== "" && form.admission_fee !== "" && Number(form.duration_months) > 0
      ? Math.round(((Number(form.discount_price) - Number(form.admission_fee)) / Number(form.duration_months)) * 100) / 100
      : null;

  const [curriculums, setCurriculums] = useState([emptyCurriculum()]);
  const [schedules, setSchedules] = useState([emptySchedule()]);
  const [mentors, setMentors] = useState([emptyMentor()]);

  const editorConfig = useMemo(
    () => ({ readonly: false, placeholder: "Write full course description...", height: 350 }),
    []
  );

  // ── Enrolled Students ──────────────────────────────────────────────────────
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", school_name: "", parent_phone: "" });

  const fetchEnrolledStudents = useCallback(async () => {
    if (!courseId) return;
    setEnrollLoading(true);
    try {
      const res = await axiosInstance.get(`/courses/${courseId}/students`);
      setEnrolledStudents(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setEnrolledStudents([]);
    } finally {
      setEnrollLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchEnrolledStudents(); }, [fetchEnrolledStudents]);

  const loadStudentOptions = async (inputValue) => {
    try {
      const res = await axiosInstance.get("/students", { params: { search: inputValue } });
      if (!res.data.success) return [];
      const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
      return res.data.data
        .filter((s) => !enrolledIds.has(s.id))
        .map((s) => ({ value: s.id, label: `${s.name}${s.school_name ? ` — ${s.school_name}` : ""} (${s.parent_phone})` }));
    } catch {
      return [];
    }
  };

  const handleEnroll = async (option) => {
    if (!option) return;
    setEnrolling(true);
    try {
      await axiosInstance.post(`/students/${option.value}/courses`, { course_id: courseId });
      toast.success("Student enrolled");
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll student");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (studentId) => {
    if (!window.confirm("Unenroll this student from the course? Any invoices already issued to them are kept for audit history.")) return;
    try {
      await axiosInstance.delete(`/students/${studentId}/courses/${courseId}`);
      toast.success("Student unenrolled");
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unenroll student");
    }
  };

  const handleCreateAndEnrollStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) return toast.error("Name is required");
    if (!newStudent.parent_phone.trim()) return toast.error("Parent's phone is required");
    setEnrolling(true);
    try {
      await axiosInstance.post("/students", { ...newStudent, course_id: courseId });
      toast.success("Student created and enrolled");
      setNewStudent({ name: "", school_name: "", parent_phone: "" });
      setShowNewStudentForm(false);
      fetchEnrolledStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create student");
    } finally {
      setEnrolling(false);
    }
  };

  // ── Fetch course ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axiosInstance.get(`/courses/${slug}`);
        const d = res.data.data;
        setCourseId(d.id);
        setForm({
          title: d.title || "",
          description: d.description || "",
          short_description: d.short_description || "",
          category: d.category || "",
          tags: Array.isArray(d.tags) ? d.tags.join(", ") : (d.tags || ""),
          price: d.price ?? "",
          discount_price: d.discount_price ?? "",
          payment_type: d.payment_type || "one_time",
          admission_fee: d.admission_fee ?? "",
          duration_months: d.duration_months ?? "",
          reg_link: d.reg_link || "",
          serial_number: d.serial_number ?? "",
          is_active: d.is_active ?? true,
          meta_title: d.meta_title || "",
          meta_description: d.meta_description || "",
          thumbnail: null,
          thumbnailPreview: null,
          thumbnailUrl: d.thumbnail || null,
        });

        setCurriculums(
          d.curriculums?.length
            ? [...d.curriculums]
                .sort((a, b) => (a.module_no ?? 0) - (b.module_no ?? 0))
                .map((c) => ({
                  title: c.title || "",
                  description: c.description || "",
                }))
            : [emptyCurriculum()]
        );

        setSchedules(
          d.schedules?.length
            ? d.schedules.map((s) => ({
                course_type: s.course_type || "online_live",
                start_datetime: s.start_datetime
                  ? s.start_datetime.slice(0, 16)
                  : "",
              }))
            : [emptySchedule()]
        );

        setMentors(
          d.mentors?.length
            ? d.mentors.map((m) => ({
                name: m.name || "",
                description: m.description || "",
                experience: m.experience || "",
                is_student_mentor: !!m.is_student_mentor,
                image: null,
                imagePreview: null,
                imageUrl: m.image || null,
              }))
            : [emptyMentor()]
        );
      } catch (err) {
        toast.error("Failed to load course");
        navigate("/landing?tab=courses");
      } finally {
        setPageLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  // ── Field handlers ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({ ...p, thumbnail: file, thumbnailPreview: URL.createObjectURL(file) }));
  };

  // ── Curriculum ────────────────────────────────────────────────────────────────
  const setCurriculum = (i, field, value) =>
    setCurriculums((p) => p.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  const addCurriculum = () => setCurriculums((p) => [...p, emptyCurriculum()]);
  const removeCurriculum = (i) => setCurriculums((p) => p.filter((_, idx) => idx !== i));

  // ── Schedule ──────────────────────────────────────────────────────────────────
  const setSchedule = (i, field, value) =>
    setSchedules((p) => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const addSchedule = () => setSchedules((p) => [...p, emptySchedule()]);
  const removeSchedule = (i) => setSchedules((p) => p.filter((_, idx) => idx !== i));

  // ── Mentor ────────────────────────────────────────────────────────────────────
  const setMentor = (i, field, value) =>
    setMentors((p) => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  const handleMentorImage = (i, file) => {
    if (!file) return;
    setMentors((p) =>
      p.map((m, idx) =>
        idx === i ? { ...m, image: file, imagePreview: URL.createObjectURL(file) } : m
      )
    );
  };
  const addMentor = () => setMentors((p) => [...p, emptyMentor()]);
  const removeMentor = (i) => setMentors((p) => p.filter((_, idx) => idx !== i));

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (isMonthly) {
      if (form.discount_price === "") return toast.error("Discount price is required for monthly payment type");
      if (form.admission_fee === "") return toast.error("Admission fee is required for monthly payment type");
      if (form.duration_months === "" || Number(form.duration_months) <= 0)
        return toast.error("Duration (months) is required for monthly payment type");
    }

    setSaving(true);
    const fd = new FormData();

    // Basic fields
    fd.append("title", form.title);
    if (form.description) fd.append("description", form.description);
    if (form.short_description) fd.append("short_description", form.short_description);
    if (form.category) fd.append("category", form.category);
    if (form.reg_link) fd.append("reg_link", form.reg_link);
    if (form.price !== "") fd.append("price", form.price);
    if (form.discount_price !== "") fd.append("discount_price", form.discount_price);
    fd.append("payment_type", form.payment_type);
    if (isMonthly) {
      fd.append("admission_fee", form.admission_fee);
      fd.append("duration_months", form.duration_months);
    }
    if (form.serial_number !== "") fd.append("serial_number", form.serial_number);
    fd.append("is_active", form.is_active ? 1 : 0);
    if (form.meta_title) fd.append("meta_title", form.meta_title);
    if (form.meta_description) fd.append("meta_description", form.meta_description);
    if (form.thumbnail) fd.append("thumbnail", form.thumbnail);

    const tagList = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    tagList.forEach((tag) => fd.append("tags[]", tag));

    // Curriculums — only filled rows; module_no is auto-assigned by order
    const filledCurriculums = curriculums.filter((c) => c.title.trim());
    filledCurriculums.forEach((c, i) => {
      fd.append(`curriculums[${i}][module_no]`, i + 1);
      fd.append(`curriculums[${i}][title]`, c.title);
      if (c.description) fd.append(`curriculums[${i}][description]`, c.description);
    });

    // Schedules — only rows with datetime
    const filledSchedules = schedules.filter((s) => s.start_datetime);
    filledSchedules.forEach((s, i) => {
      fd.append(`schedules[${i}][course_type]`, s.course_type);
      fd.append(`schedules[${i}][start_datetime]`, s.start_datetime);
    });

    // Mentors — only rows with name; include new image if uploaded
    const filledMentors = mentors.filter((m) => m.name.trim());
    filledMentors.forEach((m, i) => {
      fd.append(`mentors[${i}][name]`, m.name);
      if (m.description) fd.append(`mentors[${i}][description]`, m.description);
      if (m.experience) fd.append(`mentors[${i}][experience]`, m.experience);
      fd.append(`mentors[${i}][is_student_mentor]`, m.is_student_mentor ? 1 : 0);
      if (m.image) fd.append(`mentors[${i}][image]`, m.image);
    });

    // Laravel PUT via POST + _method
    fd.append("_method", "PUT");

    try {
      await axiosInstance.post(`/courses/${courseId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Course updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <Loading />;

  return (
    <div className="add-blog-container">
      <div className="add-blog-header">
        <h2>Edit Course</h2>
        <p className="text-muted">Update the details of this course</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Basic Info ── */}
        <Card className="border mb-4">
          <SectionHeader title="Basic Information" />
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Course title"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="e.g. Robotics"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Serial No.</Form.Label>
                  <Form.Control
                    type="number"
                    name="serial_number"
                    value={form.serial_number}
                    onChange={handleChange}
                    placeholder="Display order"
                    min={0}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Short Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="short_description"
                value={form.short_description}
                onChange={handleChange}
                maxLength={500}
                placeholder="Brief summary (max 500 chars)"
              />
              <Form.Text className="text-muted">{form.short_description.length}/500</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <JoditEditor
                ref={editorRef}
                value={form.description}
                config={editorConfig}
                tabIndex={1}
                onBlur={(val) => setForm((p) => ({ ...p, description: val }))}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Type</Form.Label>
                  <Form.Select
                    name="payment_type"
                    value={form.payment_type}
                    onChange={handleChange}
                  >
                    <option value="one_time">One Time</option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (৳)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Discount Price (৳) {isMonthly && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="discount_price"
                    value={form.discount_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    required={isMonthly}
                  />
                  {isMonthly && (
                    <Form.Text className="text-muted">Used as the base price for monthly fee calculation.</Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {isMonthly && (
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Admission Fee (৳) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="admission_fee"
                      value={form.admission_fee}
                      onChange={handleChange}
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duration (Months) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="duration_months"
                      value={form.duration_months}
                      onChange={handleChange}
                      placeholder="e.g. 6"
                      min={1}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-center">
                  <div className="mb-3">
                    <Form.Label className="d-block">Monthly Fee (preview)</Form.Label>
                    <Badge bg="success" style={{ fontSize: "0.95rem" }}>
                      {computedMonthlyFee != null ? `৳${computedMonthlyFee.toLocaleString()}/mo` : "—"}
                    </Badge>
                  </div>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Registration Link</Form.Label>
                  <Form.Control
                    name="reg_link"
                    value={form.reg_link}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="is_active-switch"
                    name="is_active"
                    label="Active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Meta Title</Form.Label>
                  <Form.Control
                    name="meta_title"
                    value={form.meta_title}
                    onChange={handleChange}
                    placeholder="Auto-generated from title if left blank"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Meta Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    name="meta_description"
                    value={form.meta_description}
                    onChange={handleChange}
                    placeholder="Auto-generated from title if left blank"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags <span className="text-muted fw-normal">(comma separated)</span></Form.Label>
                  <Form.Control
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="Arduino, Robotics, IoT"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Thumbnail</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpg,image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleThumbnail}
                  />
                  {(form.thumbnailPreview || form.thumbnailUrl) && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <img
                        src={form.thumbnailPreview || form.thumbnailUrl}
                        alt="thumbnail"
                        className="rounded"
                        style={{ maxHeight: 80, objectFit: "cover" }}
                      />
                      {!form.thumbnailPreview && (
                        <span className="text-muted small">Current thumbnail</span>
                      )}
                      {form.thumbnailPreview && (
                        <Badge bg="info">New</Badge>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* ── Curriculum ── */}
        <Card className="border mb-4">
          <SectionHeader title="Curriculum" badge={curriculums.length} />
          <Card.Body>
            {curriculums.map((c, i) => (
              <div key={i} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-muted" style={{ fontSize: "0.85rem" }}>Module {i + 1}</strong>
                  {curriculums.length > 1 && (
                    <Button variant="outline-danger" size="sm" onClick={() => removeCurriculum(i)}>
                      <FaTrash />
                    </Button>
                  )}
                </div>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-2">
                      <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        value={c.title}
                        onChange={(e) => setCurriculum(i, "title", e.target.value)}
                        placeholder="Module title"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={c.description}
                    onChange={(e) => setCurriculum(i, "description", e.target.value)}
                    placeholder="What will students learn in this module?"
                  />
                </Form.Group>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" onClick={addCurriculum}>
              <FaPlus className="me-1" /> Add Module
            </Button>
          </Card.Body>
        </Card>

        {/* ── Schedules ── */}
        <Card className="border mb-4">
          <SectionHeader title="Schedules" badge={schedules.length} />
          <Card.Body>
            {schedules.map((s, i) => (
              <div key={i} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-muted" style={{ fontSize: "0.85rem" }}>Schedule {i + 1}</strong>
                  {schedules.length > 1 && (
                    <Button variant="outline-danger" size="sm" onClick={() => removeSchedule(i)}>
                      <FaTrash />
                    </Button>
                  )}
                </div>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Course Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={s.course_type}
                        onChange={(e) => setSchedule(i, "course_type", e.target.value)}
                      >
                        {COURSE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-2">
                      <Form.Label>Start Date & Time <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={s.start_datetime}
                        onChange={(e) => setSchedule(i, "start_datetime", e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" onClick={addSchedule}>
              <FaPlus className="me-1" /> Add Schedule
            </Button>
          </Card.Body>
        </Card>

        {/* ── Mentors ── */}
        <Card className="border mb-4">
          <SectionHeader title="Mentors" badge={mentors.length} />
          <Card.Body>
            <p className="text-muted small mb-3">
              Note: Uploading a new photo replaces the existing one. Leave blank to remove the photo on save.
            </p>
            {mentors.map((m, i) => (
              <div key={i} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-muted" style={{ fontSize: "0.85rem" }}>Mentor {i + 1}</strong>
                  {mentors.length > 1 && (
                    <Button variant="outline-danger" size="sm" onClick={() => removeMentor(i)}>
                      <FaTrash />
                    </Button>
                  )}
                </div>
                <Row>
                  <Col md={3} className="text-center">
                    <div
                      className="border rounded d-flex align-items-center justify-content-center mb-2 overflow-hidden"
                      style={{ height: 110, background: "#f8f9fa", cursor: "pointer" }}
                      onClick={() => document.getElementById(`mentor-img-${i}`).click()}
                    >
                      {m.imagePreview || m.imageUrl ? (
                        <img
                          src={m.imagePreview || m.imageUrl}
                          alt="mentor"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>Click to upload photo</span>
                      )}
                    </div>
                    {m.imagePreview && <Badge bg="info" className="mb-1">New photo</Badge>}
                    <input
                      id={`mentor-img-${i}`}
                      type="file"
                      accept="image/jpg,image/jpeg,image/png,image/gif,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => handleMentorImage(i, e.target.files[0])}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Student Mentor"
                      checked={m.is_student_mentor}
                      onChange={(e) => setMentor(i, "is_student_mentor", e.target.checked)}
                      className="mt-1"
                    />
                  </Col>
                  <Col md={9}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            value={m.name}
                            onChange={(e) => setMentor(i, "name", e.target.value)}
                            placeholder="Mentor name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Experience</Form.Label>
                          <Form.Control
                            value={m.experience}
                            onChange={(e) => setMentor(i, "experience", e.target.value)}
                            placeholder="e.g. 5 years in Robotics"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group>
                      <Form.Label>Bio / Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={m.description}
                        onChange={(e) => setMentor(i, "description", e.target.value)}
                        placeholder="Short bio about this mentor"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" onClick={addMentor}>
              <FaPlus className="me-1" /> Add Mentor
            </Button>
          </Card.Body>
        </Card>

        {/* ── Actions ── */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate("/landing?tab=courses")}
          >
            <FaArrowLeft className="me-2" /> Back to Courses
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-with-icon"
            disabled={saving}
          >
            {saving
              ? <><Spinner animation="border" size="sm" className="me-2" />Saving...</>
              : <><FaSave className="me-1" /> Update Course</>
            }
          </button>
        </div>
      </form>

      {/* ── Enrolled Students ── */}
      <Card className="border mb-4">
        <Card.Header className="bg-light d-flex align-items-center gap-2">
          <h5 className="mb-0"><FaUserGraduate className="me-2" />Enrolled Students</h5>
          <Badge bg="secondary" pill>{enrolledStudents.length}</Badge>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3 align-items-end">
            <Col md={7}>
              <Form.Label>Enroll an existing student</Form.Label>
              <AsyncSelect
                key={enrolledStudents.length}
                cacheOptions
                defaultOptions
                loadOptions={loadStudentOptions}
                onChange={handleEnroll}
                placeholder="Search by name, phone or school..."
                isDisabled={enrolling}
                noOptionsMessage={() => "No matching students"}
                value={null}
                {...studentSelectMenuProps}
              />
            </Col>
            <Col md={5}>
              <Button variant="outline-primary" onClick={() => setShowNewStudentForm((p) => !p)} disabled={enrolling}>
                <FaPlus className="me-1" /> {showNewStudentForm ? "Cancel" : "New Student"}
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
              <Button type="submit" variant="primary" size="sm" disabled={enrolling}>
                {enrolling ? "Saving..." : "Create & Enroll"}
              </Button>
            </Form>
          )}

          {enrollLoading ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : enrolledStudents.length === 0 ? (
            <p className="text-muted small mb-0">No students enrolled in this course yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle modern-table">
                <thead className="bg-light">
                  <tr>
                    <th>Name</th>
                    <th>School</th>
                    <th>Parent's Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.school_name || "—"}</td>
                      <td>{s.parent_phone}</td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => handleUnenroll(s.id)}>
                          <FaTrash className="me-1" /> Unenroll
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ViewCourse;
