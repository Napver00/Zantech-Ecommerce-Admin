import React, { useState } from "react";
import { Row, Col, Card, Form, Button, Badge, Alert } from "react-bootstrap";
import { FaPlus, FaTrash, FaFileImport, FaGoogleDrive } from "react-icons/fa";
import { emptyLesson, emptyCurriculum, parseCurriculumText } from "./courseDetailUtils";

// Shared by AddCourse and ViewCourse: curriculum (modules → lessons) and the
// course-details-page sections (highlights, includes, skills, projects, FAQs).

// ─── Curriculum ───────────────────────────────────────────────────────────────

const CurriculumImport = ({ onImport, hasExisting }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseCurriculumText(text) : [];
  const lessonCount = parsed.reduce((n, m) => n + m.lessons.length, 0);

  const apply = (mode) => {
    onImport(parsed, mode);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline-success" size="sm" className="mb-3" onClick={() => setOpen(true)}>
        <FaFileImport className="me-1" /> Paste curriculum from Google Doc
      </Button>
    );
  }

  return (
    <div className="border rounded p-3 mb-3 bg-light">
      <Form.Label className="fw-semibold">Paste curriculum text</Form.Label>
      <Form.Text className="d-block text-muted mb-2">
        Open the curriculum in Google Drive, select all, copy, and paste here. Lines starting with{" "}
        <code>Module 1</code>, <code>Chapter 1</code> (or <code>#</code>) become modules; lines starting with{" "}
        <code>Lesson 1</code>, <code>-</code>, <code>•</code> or <code>1.</code> become lessons; other lines become the
        description of the module/lesson above them. <code>Title | description</code> on one line also works.
      </Form.Text>
      <Form.Control
        as="textarea"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Module 1: Python Basics\nGet introduced to Python and write basic code.\nLesson 1: Welcome to Python\nLearn about programs and algorithms.\nLesson 2: Variables\n...\nModule 2: Loops\n- While loop\n- Nested loop"}
        style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
      />
      {parsed.length > 0 && (
        <Alert variant="info" className="py-2 mt-2 mb-2 small">
          Found <strong>{parsed.length}</strong> module{parsed.length !== 1 && "s"} and{" "}
          <strong>{lessonCount}</strong> lesson{lessonCount !== 1 && "s"}:{" "}
          {parsed.map((m) => `${m.title} (${m.lessons.length})`).join(", ")}
        </Alert>
      )}
      <div className="d-flex gap-2 mt-2">
        <Button size="sm" variant="primary" disabled={!parsed.length} onClick={() => apply("replace")}>
          {hasExisting ? "Replace current curriculum" : "Import"}
        </Button>
        {hasExisting && (
          <Button size="sm" variant="outline-primary" disabled={!parsed.length} onClick={() => apply("append")}>
            Add after current modules
          </Button>
        )}
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
};

export const CurriculumEditor = ({ curriculums, setCurriculums, curriculumLink, onCurriculumLinkChange }) => {
  const setModule = (i, field, value) =>
    setCurriculums((p) => p.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  const removeModule = (i) => setCurriculums((p) => p.filter((_, idx) => idx !== i));
  const setLesson = (i, j, field, value) =>
    setCurriculums((p) =>
      p.map((c, idx) =>
        idx === i ? { ...c, lessons: c.lessons.map((l, k) => (k === j ? { ...l, [field]: value } : l)) } : c
      )
    );
  const addLesson = (i) =>
    setCurriculums((p) => p.map((c, idx) => (idx === i ? { ...c, lessons: [...c.lessons, emptyLesson()] } : c)));
  const removeLesson = (i, j) =>
    setCurriculums((p) =>
      p.map((c, idx) => (idx === i ? { ...c, lessons: c.lessons.filter((_, k) => k !== j) } : c))
    );

  const hasExisting = curriculums.some((c) => c.title.trim());
  const handleImport = (modules, mode) =>
    setCurriculums((p) => (mode === "append" ? [...p.filter((c) => c.title.trim()), ...modules] : modules));

  const lessonTotal = curriculums.reduce((n, c) => n + c.lessons.length, 0);

  return (
    <Card className="border mb-4">
      <Card.Header className="bg-light d-flex align-items-center gap-2">
        <h5 className="mb-0">Curriculum</h5>
        <Badge bg="secondary" pill>{curriculums.length} modules</Badge>
        <Badge bg="secondary" pill>{lessonTotal} lessons</Badge>
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label><FaGoogleDrive className="me-1 text-success" /> Curriculum PDF link (Google Drive)</Form.Label>
          <Form.Control
            type="url"
            value={curriculumLink}
            onChange={(e) => onCurriculumLinkChange(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
          />
          <Form.Text className="text-muted">
            Shown as a "Download Curriculum" button on the course page. Set the file's sharing to "Anyone with the link".
          </Form.Text>
        </Form.Group>

        <CurriculumImport onImport={handleImport} hasExisting={hasExisting} />

        {curriculums.map((c, i) => (
          <div key={i} className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong className="text-muted" style={{ fontSize: "0.85rem" }}>Module {i + 1}</strong>
              {curriculums.length > 1 && (
                <Button variant="outline-danger" size="sm" onClick={() => removeModule(i)}>
                  <FaTrash />
                </Button>
              )}
            </div>
            <Form.Group className="mb-2">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={c.title}
                onChange={(e) => setModule(i, "title", e.target.value)}
                placeholder="Module title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={c.description}
                onChange={(e) => setModule(i, "description", e.target.value)}
                placeholder="What will students learn in this module?"
              />
            </Form.Group>

            <div className="ps-3 border-start">
              <div className="small fw-semibold text-muted mb-2">Lessons ({c.lessons.length})</div>
              {c.lessons.map((l, j) => (
                <Row key={j} className="g-2 mb-2 align-items-start">
                  <Col xs="auto" className="pt-2 small text-muted" style={{ width: 70 }}>Lesson {j + 1}</Col>
                  <Col md={4}>
                    <Form.Control
                      size="sm"
                      value={l.title}
                      onChange={(e) => setLesson(i, j, "title", e.target.value)}
                      placeholder="Lesson title"
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      size="sm"
                      as="textarea"
                      rows={1}
                      value={l.description}
                      onChange={(e) => setLesson(i, j, "description", e.target.value)}
                      placeholder="Short description (optional)"
                    />
                  </Col>
                  <Col xs="auto">
                    <Button variant="outline-danger" size="sm" onClick={() => removeLesson(i, j)}>
                      <FaTrash />
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-secondary" size="sm" onClick={() => addLesson(i)}>
                <FaPlus className="me-1" /> Add Lesson
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline-primary" size="sm" onClick={() => setCurriculums((p) => [...p, emptyCurriculum()])}>
          <FaPlus className="me-1" /> Add Module
        </Button>
      </Card.Body>
    </Card>
  );
};

// ─── Course page details ──────────────────────────────────────────────────────

const StringListEditor = ({ label, help, items, onChange, placeholder }) => (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    {help && <Form.Text className="d-block text-muted mb-2">{help}</Form.Text>}
    {items.map((item, i) => (
      <div key={i} className="d-flex gap-2 mb-2">
        <Form.Control
          size="sm"
          value={item}
          onChange={(e) => onChange(items.map((s, k) => (k === i ? e.target.value : s)))}
          placeholder={placeholder}
        />
        <Button variant="outline-danger" size="sm" onClick={() => onChange(items.filter((_, k) => k !== i))}>
          <FaTrash />
        </Button>
      </div>
    ))}
    <Button variant="outline-secondary" size="sm" onClick={() => onChange([...items, ""])}>
      <FaPlus className="me-1" /> Add
    </Button>
  </Form.Group>
);

export const CourseDetailFields = ({ details, setDetails }) => {
  const set = (key, value) => setDetails((p) => ({ ...p, [key]: value }));
  const setItem = (key, i, field, value) =>
    setDetails((p) => ({ ...p, [key]: p[key].map((x, k) => (k === i ? { ...x, [field]: value } : x)) }));

  return (
    <>
      {/* ── Course Highlights ── */}
      <Card className="border mb-4">
        <Card.Header className="bg-light"><h5 className="mb-0">Course Page Highlights</h5></Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age Group</Form.Label>
                <Form.Control value={details.age_group} onChange={(e) => set("age_group", e.target.value)} placeholder="e.g. Age 10-16" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Level</Form.Label>
                <Form.Control value={details.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. Beginner" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Class Duration</Form.Label>
                <Form.Control value={details.session_duration} onChange={(e) => set("session_duration", e.target.value)} placeholder="e.g. 90 mins per class" />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Activities & Projects</Form.Label>
                <Form.Control value={details.total_activities} onChange={(e) => set("total_activities", e.target.value)} placeholder="e.g. 100+" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Quizzes</Form.Label>
                <Form.Control type="number" min={0} value={details.total_quizzes} onChange={(e) => set("total_quizzes", e.target.value)} placeholder="e.g. 24" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Text className="d-block text-muted mb-3">
            Module and lesson counts are calculated from the curriculum automatically.
          </Form.Text>
          <Form.Group>
            <Form.Label>Certificate Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={details.certificate_description}
              onChange={(e) => set("certificate_description", e.target.value)}
              placeholder="What certificate students earn and when. Leave empty to hide this section."
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* ── Registration form ── */}
      <Card className="border mb-4">
        <Card.Header className="bg-light"><h5 className="mb-0">Registration Form — Class Slots</h5></Card.Header>
        <Card.Body>
          <StringListEditor
            label='"Preferred Class Slot" options'
            help="Parents pick one of these on the website registration form. Leave empty if this course has no slot choice."
            items={details.class_slots}
            onChange={(v) => set("class_slots", v)}
            placeholder="e.g. Slot A — Friday 4:00–5:30 PM & Saturday 4:00–5:30 PM"
          />
        </Card.Body>
      </Card>

      {/* ── Includes + Skills ── */}
      <Card className="border mb-4">
        <Card.Header className="bg-light"><h5 className="mb-0">Includes & Skills</h5></Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <StringListEditor
                label='"This course includes"'
                help="Short bullet points shown in the box next to the overview."
                items={details.includes}
                onChange={(v) => set("includes", v)}
                placeholder="e.g. 48 live hands-on sessions"
              />
            </Col>
            <Col md={6}>
              <StringListEditor
                label="Skills you'll gain"
                help="Learning outcomes, one per row."
                items={details.skills}
                onChange={(v) => set("skills", v)}
                placeholder="e.g. Build and program Arduino robots"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Projects ── */}
      <Card className="border mb-4">
        <Card.Header className="bg-light d-flex align-items-center gap-2">
          <h5 className="mb-0">Projects Students Build</h5>
          <Badge bg="secondary" pill>{details.projects.length}</Badge>
        </Card.Header>
        <Card.Body>
          {details.projects.map((p, i) => (
            <Row key={i} className="g-2 mb-2 align-items-start">
              <Col md={4}>
                <Form.Control size="sm" value={p.title} onChange={(e) => setItem("projects", i, "title", e.target.value)} placeholder="Project title" />
              </Col>
              <Col>
                <Form.Control size="sm" as="textarea" rows={1} value={p.description} onChange={(e) => setItem("projects", i, "description", e.target.value)} placeholder="Short description" />
              </Col>
              <Col xs="auto">
                <Button variant="outline-danger" size="sm" onClick={() => set("projects", details.projects.filter((_, k) => k !== i))}>
                  <FaTrash />
                </Button>
              </Col>
            </Row>
          ))}
          <Button variant="outline-primary" size="sm" onClick={() => set("projects", [...details.projects, { title: "", description: "" }])}>
            <FaPlus className="me-1" /> Add Project
          </Button>
        </Card.Body>
      </Card>

      {/* ── FAQs ── */}
      <Card className="border mb-4">
        <Card.Header className="bg-light d-flex align-items-center gap-2">
          <h5 className="mb-0">FAQs</h5>
          <Badge bg="secondary" pill>{details.faqs.length}</Badge>
        </Card.Header>
        <Card.Body>
          {details.faqs.map((f, i) => (
            <div key={i} className="border rounded p-2 mb-2">
              <div className="d-flex gap-2 mb-2">
                <Form.Control size="sm" value={f.question} onChange={(e) => setItem("faqs", i, "question", e.target.value)} placeholder="Question" />
                <Button variant="outline-danger" size="sm" onClick={() => set("faqs", details.faqs.filter((_, k) => k !== i))}>
                  <FaTrash />
                </Button>
              </div>
              <Form.Control size="sm" as="textarea" rows={2} value={f.answer} onChange={(e) => setItem("faqs", i, "answer", e.target.value)} placeholder="Answer" />
            </div>
          ))}
          <Button variant="outline-primary" size="sm" onClick={() => set("faqs", [...details.faqs, { question: "", answer: "" }])}>
            <FaPlus className="me-1" /> Add FAQ
          </Button>
        </Card.Body>
      </Card>
    </>
  );
};
