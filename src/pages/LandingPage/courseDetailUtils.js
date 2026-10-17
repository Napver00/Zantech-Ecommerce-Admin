// Data helpers for the course form (AddCourse / ViewCourse / CourseDetailFields).

// ─── Curriculum ───────────────────────────────────────────────────────────────

export const emptyLesson = () => ({ title: "", description: "" });
export const emptyCurriculum = () => ({ title: "", description: "", lessons: [] });

export const curriculumsFromCourse = (d) =>
  d.curriculums?.length
    ? [...d.curriculums]
        .sort((a, b) => (a.module_no ?? 0) - (b.module_no ?? 0))
        .map((c) => ({
          title: c.title || "",
          description: c.description || "",
          lessons: [...(c.lessons || [])]
            .sort((a, b) => (a.lesson_no ?? 0) - (b.lesson_no ?? 0))
            .map((l) => ({ title: l.title || "", description: l.description || "" })),
        }))
    : [emptyCurriculum()];

// module_no / lesson_no are auto-assigned by order; empty rows are skipped
export const appendCurriculums = (fd, curriculums) => {
  curriculums
    .filter((c) => c.title.trim())
    .forEach((c, i) => {
      fd.append(`curriculums[${i}][module_no]`, i + 1);
      fd.append(`curriculums[${i}][title]`, c.title);
      if (c.description) fd.append(`curriculums[${i}][description]`, c.description);
      c.lessons
        .filter((l) => l.title.trim())
        .forEach((l, j) => {
          fd.append(`curriculums[${i}][lessons][${j}][lesson_no]`, j + 1);
          fd.append(`curriculums[${i}][lessons][${j}][title]`, l.title);
          if (l.description) fd.append(`curriculums[${i}][lessons][${j}][description]`, l.description);
        });
    });
};

// Keyword headings need a number or a separator ("Module 2", "Module: X") so normal sentences aren't matched
const MODULE_RE = /^(?:#+\s*|(?:module|chapter|unit|week)\s*(?:\d+\s*[:.)\-–—]?|[:\-–—])\s*)(.*)$/i;
const LESSON_RE = /^(?:lesson|class|session)\s*(?:\d+\s*[:.)\-–—]?|[:\-–—])\s*(.*)$|^(?:[-*•▸]|\d+[.)])\s+(.*)$/i;

// Turns curriculum text copied from the Google Drive doc into modules + lessons.
//   Module 1: Python Basics          ← module (also "# Python Basics", "Chapter 2 - ...")
//   Get introduced to Python...      ← plain line → description of the last module/lesson
//   Lesson 1: Welcome to Python      ← lesson (also "- ...", "• ...", "1. ...")
//   Learn about computer programs... ← lesson description
// "Title | description" on one line
const splitTitle = (s) => {
  const [title, ...rest] = s.split(" | ");
  return { title: title.trim(), description: rest.join(" | ").trim() };
};

export const parseCurriculumText = (text) => {
  const modules = [];
  let current = null; // last module or lesson, receives plain lines
  let awaitingTitle = null; // "Module 1" with no title → next plain line is the title

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const mod = line.match(MODULE_RE);
    if (mod && !LESSON_RE.test(line)) {
      const m = { ...splitTitle(mod[1]), lessons: [] };
      modules.push(m);
      current = m;
      awaitingTitle = m.title ? null : m;
      continue;
    }

    const les = line.match(LESSON_RE);
    if (les) {
      if (!modules.length) modules.push({ title: "Module 1", description: "", lessons: [] });
      const l = splitTitle(les[1] ?? les[2] ?? "");
      modules[modules.length - 1].lessons.push(l);
      current = l;
      awaitingTitle = l.title ? null : l;
      continue;
    }

    if (awaitingTitle) {
      awaitingTitle.title = line;
      awaitingTitle = null;
    } else if (current) {
      current.description = current.description ? `${current.description} ${line}` : line;
    } else {
      modules.push({ title: line, description: "", lessons: [] });
      current = modules[modules.length - 1];
    }
  }
  return modules.filter((m) => m.title);
};

// ─── Course page details ──────────────────────────────────────────────────────

export const emptyDetails = () => ({
  age_group: "",
  level: "",
  session_duration: "",
  total_activities: "",
  total_quizzes: "",
  curriculum_link: "",
  certificate_description: "",
  includes: [""],
  skills: [""],
  projects: [{ title: "", description: "" }],
  faqs: [{ question: "", answer: "" }],
  class_slots: [""],
});

export const detailsFromCourse = (d) => ({
  age_group: d.age_group || "",
  level: d.level || "",
  session_duration: d.session_duration || "",
  total_activities: d.total_activities || "",
  total_quizzes: d.total_quizzes ?? "",
  curriculum_link: d.curriculum_link || "",
  certificate_description: d.certificate_description || "",
  includes: d.includes?.length ? d.includes : [""],
  skills: d.skills?.length ? d.skills : [""],
  projects: d.projects?.length
    ? d.projects.map((p) => ({ title: p.title || "", description: p.description || "" }))
    : [{ title: "", description: "" }],
  faqs: d.faqs?.length
    ? d.faqs.map((f) => ({ question: f.question || "", answer: f.answer || "" }))
    : [{ question: "", answer: "" }],
  class_slots: d.class_slots?.length ? d.class_slots : [""],
});

// Empty values are sent as "" so clearing a field on edit saves it as empty
export const appendDetails = (fd, details) => {
  ["age_group", "level", "session_duration", "total_activities", "total_quizzes", "curriculum_link", "certificate_description"]
    .forEach((key) => fd.append(key, details[key] ?? ""));

  const appendList = (key, items, build) => {
    if (!items.length) return fd.append(key, "");
    items.forEach((item, i) => build(item, i));
  };

  appendList("includes", details.includes.map((s) => s.trim()).filter(Boolean),
    (s) => fd.append("includes[]", s));
  appendList("skills", details.skills.map((s) => s.trim()).filter(Boolean),
    (s) => fd.append("skills[]", s));
  appendList("projects", details.projects.filter((p) => p.title.trim()), (p, i) => {
    fd.append(`projects[${i}][title]`, p.title);
    if (p.description) fd.append(`projects[${i}][description]`, p.description);
  });
  appendList("faqs", details.faqs.filter((f) => f.question.trim()), (f, i) => {
    fd.append(`faqs[${i}][question]`, f.question);
    if (f.answer) fd.append(`faqs[${i}][answer]`, f.answer);
  });
  appendList("class_slots", details.class_slots.map((s) => s.trim()).filter(Boolean),
    (s) => fd.append("class_slots[]", s));
};
