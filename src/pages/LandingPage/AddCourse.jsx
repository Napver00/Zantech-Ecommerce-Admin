import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import { Row, Col, Card, Form, Button, Badge } from "react-bootstrap";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";

const COURSE_TYPES = [
  { value: "online_live", label: "Online Live" },
  { value: "recorded", label: "Recorded" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const emptyCurriculum = () => ({ title: "", description: "" });
const emptySchedule = () => ({ course_type: "online_live", start_datetime: "" });
const emptyMentor = () => ({
  name: "",
  description: "",
  experience: "",
  is_student_mentor: false,
  image: null,
  imagePreview: null,
});

const AddCourse = () => {
  usePageTitle("Add New Course");
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    category: "",
    tags: "",
    price: "",
    discount_price: "",
    payment_type: "one_time",
    admission_fee: "",
    duration_months: "",
    reg_link: "",
    serial_number: "",
    thumbnail: null,
    thumbnailPreview: null,
  });

  const isMonthly = form.payment_type === "monthly";

  const [curriculums, setCurriculums] = useState([emptyCurriculum()]);
  const [schedules, setSchedules] = useState([emptySchedule()]);
  const [mentors, setMentors] = useState([emptyMentor()]);

  const editorConfig = useMemo(
    () => ({ readonly: false, placeholder: "Write full course description...", height: 350 }),
    []
  );

  // ─── Basic field handlers ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({
      ...p,
      thumbnail: file,
      thumbnailPreview: URL.createObjectURL(file),
    }));
  };

  // ─── Curriculum handlers ────────────────────────────────────────────────────
  const setCurriculum = (i, field, value) =>
    setCurriculums((p) => p.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  const addCurriculum = () => setCurriculums((p) => [...p, emptyCurriculum()]);
  const removeCurriculum = (i) => setCurriculums((p) => p.filter((_, idx) => idx !== i));

  // ─── Schedule handlers ──────────────────────────────────────────────────────
  const setSchedule = (i, field, value) =>
    setSchedules((p) => p.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  const addSchedule = () => setSchedules((p) => [...p, emptySchedule()]);
  const removeSchedule = (i) => setSchedules((p) => p.filter((_, idx) => idx !== i));

  // ─── Mentor handlers ────────────────────────────────────────────────────────
  const setMentor = (i, field, value) =>
    setMentors((p) => p.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
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

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (isMonthly) {
      if (form.discount_price === "") return toast.error("Discount price is required for monthly payment type");
      if (form.admission_fee === "") return toast.error("Admission fee is required for monthly payment type");
      if (form.duration_months === "" || Number(form.duration_months) <= 0)
        return toast.error("Duration (months) is required for monthly payment type");
    }

    setLoading(true);
    const fd = new FormData();

    // Basic fields
    fd.append("title", form.title);
    fd.append("description", form.description);
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
    if (form.thumbnail) fd.append("thumbnail", form.thumbnail);

    // Tags
    const tagList = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    tagList.forEach((tag) => fd.append("tags[]", tag));

    // Curriculums — only include rows that have a title; module_no is auto-assigned by order
    const filledCurriculums = curriculums.filter((c) => c.title.trim());
    filledCurriculums.forEach((c, i) => {
      fd.append(`curriculums[${i}][module_no]`, i + 1);
      fd.append(`curriculums[${i}][title]`, c.title);
      if (c.description) fd.append(`curriculums[${i}][description]`, c.description);
    });

    // Schedules — only include rows that have a start_datetime
    const filledSchedules = schedules.filter((s) => s.start_datetime);
    filledSchedules.forEach((s, i) => {
      fd.append(`schedules[${i}][course_type]`, s.course_type);
      fd.append(`schedules[${i}][start_datetime]`, s.start_datetime);
    });

    // Mentors — only include rows that have a name
    const filledMentors = mentors.filter((m) => m.name.trim());
    filledMentors.forEach((m, i) => {
      fd.append(`mentors[${i}][name]`, m.name);
      if (m.description) fd.append(`mentors[${i}][description]`, m.description);
      if (m.experience) fd.append(`mentors[${i}][experience]`, m.experience);
      fd.append(`mentors[${i}][is_student_mentor]`, m.is_student_mentor ? 1 : 0);
      if (m.image) fd.append(`mentors[${i}][image]`, m.image);
    });

    try {
      await axiosInstance.post("/courses", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Course created successfully");
      navigate("/landing?tab=courses");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  // ─── Section heading helper ─────────────────────────────────────────────────
  const SectionHeader = ({ title, badge }) => (
    <Card.Header className="bg-light d-flex align-items-center gap-2">
      <h5 className="mb-0">{title}</h5>
      {badge !== undefined && (
        <Badge bg="secondary" pill>{badge}</Badge>
      )}
    </Card.Header>
  );

  return (
    <div className="add-blog-container">
      <div className="add-blog-header">
        <h2>Add New Course</h2>
        <p className="text-muted">Fill in all the details to create a new course</p>
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
                placeholder="Brief summary shown in course cards (max 500 chars)"
              />
              <Form.Text className="text-muted">{form.short_description.length}/500</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
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
                  {form.thumbnailPreview && (
                    <img
                      src={form.thumbnailPreview}
                      alt="preview"
                      className="mt-2 rounded"
                      style={{ maxHeight: 100, objectFit: "cover" }}
                    />
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
              <div key={i} className="border rounded p-3 mb-3 position-relative">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-muted" style={{ fontSize: "0.85rem" }}>Module {i + 1}</strong>
                  {curriculums.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeCurriculum(i)}
                    >
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
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeSchedule(i)}
                    >
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
            {mentors.map((m, i) => (
              <div key={i} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-muted" style={{ fontSize: "0.85rem" }}>Mentor {i + 1}</strong>
                  {mentors.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeMentor(i)}
                    >
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
                      {m.imagePreview ? (
                        <img
                          src={m.imagePreview}
                          alt="mentor"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>Click to upload photo</span>
                      )}
                    </div>
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
            disabled={loading}
          >
            {loading ? "Saving..." : <><FaSave className="me-1" /> Save Course</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;
