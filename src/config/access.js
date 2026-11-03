/**
 * Who can use which part of the admin. The backend enforces the same map
 * (app/Support/Roles.php in ZantechBackend); keep the two in step.
 *
 * Roles live in users.role. "stuff" is the store manager (its name in the
 * database since the first version) and "member" is an older role that works
 * like a store manager.
 */

export const ROLES = {
  admin: {
    label: "Admin",
    hint: "Everything, including reports, staff and website settings",
  },
  stuff: {
    label: "Store manager",
    hint: "Orders, products, customers, stock, expenses and messages",
  },
  course_manager: {
    label: "Course manager",
    hint: "Registrations, courses, bootcamps, students, invoices and certificates",
  },
  content_manager: {
    label: "Content manager",
    hint: "Blog posts, tutorials, workshops and projects",
  },
  member: {
    label: "Member (store)",
    hint: "Older role, same access as a store manager",
  },
};

/** Roles offered when adding staff or changing a role, most used first. */
export const ASSIGNABLE_ROLES = ["stuff", "course_manager", "content_manager", "admin", "member"];

// What each area covers is listed in navigation.jsx (each item has an `area`).
const AREA_ROLES = {
  admin: ["admin"],
  store: ["admin", "stuff", "member"],
  course: ["admin", "course_manager"],
  content: ["admin", "content_manager"],
  money: ["admin", "stuff", "member", "course_manager"],
  any: ["admin", "stuff", "member", "course_manager", "content_manager"],
};

export const roleLabel = (role) => ROLES[role]?.label || role || "Staff";

export const canUse = (role, area) => !!area && (AREA_ROLES[area] || []).includes(role);

// Pages and the area they belong to. The first matching prefix wins, so more
// specific paths come first. Website tabs (/landing?tab=…) are checked apart.
const PATH_AREAS = [
  ["/profile", "any"],
  ["/dashboard", "admin"],
  ["/analytics", "admin"],
  ["/reports", "admin"],
  ["/staff", "admin"],
  ["/activity", "admin"],
  ["/faq", "admin"],
  ["/settings/documents", "admin"],
  ["/settings/hero", "store"],
  ["/orders", "store"],
  ["/products", "store"],
  ["/categories", "store"],
  ["/coupons", "store"],
  ["/customers", "store"],
  ["/ratings", "store"],
  ["/expenses", "store"],
  ["/suppliers", "store"],
  ["/challans", "store"],
  ["/contact", "store"],
  ["/transitions", "money"],
  ["/course-registrations", "course"],
  ["/students", "course"],
  ["/course-invoices", "course"],
  ["/certificates", "course"],
  ["/payment-methods", "admin"],
  ["/landing/courses", "course"],
  ["/blog", "content"],
  ["/landing/projects", "content"],
];

/** Tabs of the Website page (/landing) and who sees them. */
export const LANDING_TAB_AREAS = {
  projects: "content",
  courses: "course",
  bootcamps: "course",
  "company-info": "admin",
};

/** May this role open the page? Unknown pages are left to the router (404). */
export const canOpen = (role, pathname, search = "") => {
  if (pathname === "/landing") {
    const tab = new URLSearchParams(search).get("tab");
    if (tab && LANDING_TAB_AREAS[tab]) return canUse(role, LANDING_TAB_AREAS[tab]);
    return Object.values(LANDING_TAB_AREAS).some((area) => canUse(role, area));
  }
  const hit = PATH_AREAS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit ? canUse(role, hit[1]) : true;
};

/** Where each role starts after signing in. */
export const homeFor = (role) =>
  ({
    admin: "/dashboard",
    stuff: "/orders",
    member: "/orders",
    course_manager: "/course-registrations",
    content_manager: "/blog",
  })[role] || "/profile";

/** The signed-in staff member's role, from the saved login. */
export const storedRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role || user?.type || null;
  } catch {
    return null;
  }
};
