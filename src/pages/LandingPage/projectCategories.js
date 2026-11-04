// Who built a project. The main site shows these as tabs and as a label on each card.
export const PROJECT_CATEGORIES = [
  { value: "rnd", label: "ZAN Tech R&D", tab: "ZAN Tech R&D", hint: "Built by the ZAN Tech team" },
  { value: "student", label: "Student project", tab: "Student projects", hint: "Built by our students in a course or bootcamp" },
];

export const CATEGORY_LABEL = Object.fromEntries(PROJECT_CATEGORIES.map((c) => [c.value, c.label]));
