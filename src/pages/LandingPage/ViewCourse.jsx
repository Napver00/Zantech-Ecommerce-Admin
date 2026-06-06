import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import { Row, Col, Card, Form, Button, Badge, Spinner } from "react-bootstrap";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";

const COURSE_TYPES = [
  { value: "online_live", label: "Online Live" },
  { value: "recorded", label: "Recorded" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

const emptyCurriculum = () => ({ module_no: "", title: "", description: "" });
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
    reg_link: "", serial_number: "",
    thumbnail: null, thumbnailPreview: null, thumbnailUrl: null,
  });

  const [curriculums, setCurriculums] = useState([emptyCurriculum()]);
  const [schedules, setSchedules] = useState([emptySchedule()]);
  const [mentors, setMentors] = useState([emptyMentor()]);

  const editorConfig = useMemo(
    () => ({ readonly: false, placeholder: "Write full course description...", height: 350 }),
    []
  );

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
          reg_link: d.reg_link || "",
          serial_number: d.serial_number ?? "",
          thumbnail: null,
          thumbnailPreview: null,
          thumbnailUrl: d.thumbnail || null,
        });

        setCurriculums(
          d.curriculums?.length
            ? d.curriculums.map((c) => ({
                module_no: c.module_no ?? "",
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
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
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
    if (form.serial_number !== "") fd.append("serial_number", form.serial_number);
    if (form.thumbnail) fd.append("thumbnail", form.thumbnail);

    const tagList = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    tagList.forEach((tag) => fd.append("tags[]", tag));

    // Curriculums — only filled rows
    const filledCurriculums = curriculums.filter((c) => c.title.trim());
    filledCurriculums.forEach((c, i) => {
      if (c.module_no !== "") fd.append(`curriculums[${i}][module_no]`, c.module_no);
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
                  <Form.Label>Discount Price (৳)</Form.Label>
                  <Form.Control
                    type="number"
                    name="discount_price"
                    value={form.discount_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
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
                  <Col md={2}>
                    <Form.Group className="mb-2">
                      <Form.Label>Module No.</Form.Label>
                      <Form.Control
                        type="number"
                        value={c.module_no}
                        onChange={(e) => setCurriculum(i, "module_no", e.target.value)}
                        placeholder="#"
                        min={1}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={10}>
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
    </div>
  );
};

export default ViewCourse;
