/**
 * Who can use which part of the admin. The backend enforces the same map
 * (app/Support/Roles.php in ZantechBackend); keep the two in step.
 *
 * A staff member can have several roles (users.roles; users.role is the main
 * one). They may open a page when any of their roles covers it. "stuff" is the
 * store manager (its name in the database since the first version) and
 * "member" is an older role that works like a store manager.
 *
 * Every helper here takes one role or a list of roles.
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
  inventory_manager: {
    label: "Inventory manager",
    hint: "Stock counts for products, equipment and supplies",
  },
  member: {
    label: "Member (store)",
    hint: "Older role, same access as a store manager",
  },
};

/** Roles offered when adding staff or changing a role, most used first. */
export const ASSIGNABLE_ROLES = ["stuff", "course_manager", "content_manager", "inventory_manager", "admin", "member"];

// What each area covers is listed in navigation.jsx (each item has an `area`).
const AREA_ROLES = {
  admin: ["admin"],
  store: ["admin", "stuff", "member"],
  course: ["admin", "course_manager"],
  content: ["admin", "content_manager"],
  money: ["admin", "stuff", "member", "course_manager"],
  inventory: ["admin", "stuff", "member", "inventory_manager"],
  any: ["admin", "stuff", "member", "course_manager", "content_manager", "inventory_manager"],
};

/** Most access first: picks the main role and the start page. */
export const ROLE_PRIORITY = ["admin", "stuff", "member", "course_manager", "content_manager", "inventory_manager"];

/** One role, a list, or nothing → a clean list, most access first. */
export const rolesOf = (role) => {
  const list = (Array.isArray(role) ? role : [role]).filter((r) => ROLES[r]);
  return ROLE_PRIORITY.filter((r) => list.includes(r));
};

export const primaryRole = (role) => rolesOf(role)[0] || null;

/** "Store manager", or "Store manager + Course manager" for several. Admin covers everything. */
export const roleLabel = (role) => {
  const list = rolesOf(role);
  if (!list.length) return typeof role === "string" && role ? role : "Staff";
  if (list.includes("admin")) return ROLES.admin.label;
  return list.map((r) => ROLES[r].label).join(" + ");
};

export const canUse = (role, area) => !!area && rolesOf(role).some((r) => (AREA_ROLES[area] || []).includes(r));

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
  ["/inventory", "inventory"],
  ["/custom-invoices", "store"],
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

/** Where someone starts after signing in: the start page of their main role. */
export const homeFor = (role) =>
  ({
    admin: "/dashboard",
    stuff: "/orders",
    member: "/orders",
    course_manager: "/course-registrations",
    content_manager: "/blog",
    inventory_manager: "/inventory",
  })[primaryRole(role)] || "/profile";

/** A user record's roles (older saved logins only have role/type). */
export const rolesOfUser = (user) =>
  rolesOf(Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role || user?.type]);

/** The signed-in staff member's roles, from the saved login (a list, maybe empty). */
export const storedRole = () => {
  try {
    return rolesOfUser(JSON.parse(localStorage.getItem("user") || "null"));
  } catch {
    return [];
  }
};
