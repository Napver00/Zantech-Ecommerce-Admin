import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Row, Col, Form, Button, Spinner } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import confirmDialog from "../../utils/confirmDialog";
import { EditorSection } from "../../components/Editor/Editor";
import { RegistrationsCard } from "../CourseRegistrations/RegistrationsPanel";
import CourseEditor from "./CourseEditor";

const studentSelectMenuProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  menuPlacement: "auto",
  styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const TABS = [
  { key: "details", label: "Details" },
  { key: "registrations", label: "Registrations" },
  { key: "students", label: "Students" },
];

// ─── Students enrolled in this course ────────────────────────────────────────

const EnrolledStudents = ({ courseId, students, loading, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", school_name: "", parent_phone: "" });

  const loadOptions = async (inputValue) => {
    try {
      const res = await axiosInstance.get("/students", { params: { search: inputValue } });
      if (!res.data.success) return [];
      const enrolled = new Set(students.map((s) => s.id));
      return res.data.data
        .filter((s) => !enrolled.has(s.id))
        .map((s) => ({ value: s.id, label: `${s.name}${s.school_name ? ` — ${s.school_name}` : ""} (${s.parent_phone})` }));
    } catch {
      return [];
    }
  };

  const enroll = async (option) => {
    if (!option) return;
    setBusy(true);
    try {
      await axiosInstance.post(`/students/${option.value}/courses`, { course_id: courseId });
      toast.success("Student enrolled");
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't enroll the student");
    } finally {
      setBusy(false);
    }
  };

  const unenroll = async (s) => {
    if (!(await confirmDialog(`Unenroll ${s.name}? Invoices already issued to them are kept.`))) return;
    try {
      await axiosInstance.delete(`/students/${s.id}/courses/${courseId}`);
      toast.success("Student unenrolled");
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't unenroll the student");
    }
  };

  const createAndEnroll = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) return toast.error("Enter the student's name");
    if (!newStudent.parent_phone.trim()) return toast.error("Enter the parent's phone number");
    setBusy(true);
    try {
      await axiosInstance.post("/students", { ...newStudent, course_id: courseId });
      toast.success("Student added and enrolled");
      setNewStudent({ name: "", school_name: "", parent_phone: "" });
      setShowNew(false);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add the student");
    } finally {
      setBusy(false);
    }
  };

  return (
    <EditorSection
      id="students"
      title="Enrolled students"
      count={students.length}
      help="Approving a website registration enrolls the student here automatically."
      actions={
        <Button variant={showNew ? "light" : "outline-primary"} size="sm" onClick={() => setShowNew((v) => !v)} disabled={busy}>
          {showNew ? "Cancel" : <><FaPlus className="me-1" /> New student</>}
        </Button>
      }
    >
      <Form.Label htmlFor="enroll-existing" className="ed-label">Enroll a student who's already in the system</Form.Label>
      <AsyncSelect
        inputId="enroll-existing"
        key={students.length}
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        onChange={enroll}
        placeholder="Search by name, phone or school…"
        isDisabled={busy}
        noOptionsMessage={() => "No matching students"}
        value={null}
        {...studentSelectMenuProps}
      />

      {showNew && (
        <Form onSubmit={createAndEnroll} className="ed-item mt-3">
          <div className="ed-item-head"><span>New student</span></div>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                <Form.Control value={newStudent.name} onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>School</Form.Label>
                <Form.Control value={newStudent.school_name} onChange={(e) => setNewStudent((p) => ({ ...p, school_name: e.target.value }))} placeholder="School name" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Parent's phone <span className="text-danger">*</span></Form.Label>
                <Form.Control type="tel" value={newStudent.parent_phone} onChange={(e) => setNewStudent((p) => ({ ...p, parent_phone: e.target.value }))} placeholder="01XXXXXXXXX" />
              </Form.Group>
            </Col>
          </Row>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Add and enroll"}</Button>
        </Form>
      )}

      <div className="mt-3">
        {loading ? (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
        ) : students.length === 0 ? (
          <p className="ed-hint mb-0">No students yet. Search above, or approve a registration from the website.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle modern-table mb-0">
              <thead className="bg-light">
                <tr><th>Name</th><th>School</th><th>Parent's phone</th><th className="text-end"><span className="visually-hidden">Actions</span></th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.name}</td>
                    <td>{s.school_name || "—"}</td>
                    <td><a href={`tel:${s.parent_phone}`}>{s.parent_phone}</a></td>
                    <td className="text-end">
                      <Button variant="outline-danger" size="sm" onClick={() => unenroll(s)}>
                        <FaTrash className="me-1" aria-hidden="true" /> Unenroll
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </EditorSection>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const ViewCourse = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const tab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "details";
  usePageTitle(course ? `${course.title} · ${course.kind === "bootcamp" ? "Bootcamp" : "Course"}` : "Edit Course");

  useEffect(() => {
    let alive = true;
    axiosInstance.get(`/courses/${slug}`)
      .then((res) => { if (alive) setCourse(res.data.data); })
      .catch(() => {
        toast.error("Couldn't load this course");
        navigate("/landing?tab=courses");
      });
    return () => { alive = false; };
  }, [slug, navigate]);

  const loadStudents = useCallback(async () => {
    if (!course?.id) return;
    setStudentsLoading(true);
    try {
      const res = await axiosInstance.get(`/courses/${course.id}/students`);
      setStudents(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [course?.id]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  if (!course) return <Loading />;

  const selectTab = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === "details") next.delete("tab");
    else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  const tabs = (
    <div className="ed-tabs" role="tablist" aria-label="Course pages">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={tab === t.key}
          className={`ed-tab ${tab === t.key ? "is-active" : ""}`}
          onClick={() => selectTab(t.key)}
        >
          {t.label}
          {t.key === "students" && <span className="ed-count">{students.length}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <CourseEditor
      key={course.id}
      course={course}
      initialKind={course.kind}
      tabs={tabs}
      activeTab={tab}
      tabContent={
        tab === "registrations" ? (
          <RegistrationsCard courseId={course.id} />
        ) : (
          <EnrolledStudents courseId={course.id} students={students} loading={studentsLoading} onChanged={loadStudents} />
        )
      }
    />
  );
};

export default ViewCourse;
