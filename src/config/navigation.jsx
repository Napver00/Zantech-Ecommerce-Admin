import {
  MdDashboard,
  MdShoppingCart,
  MdPeople,
  MdCategory,
  MdInventory,
  MdAnalytics,
  MdBusiness,
  MdAttachMoney,
  MdLocalOffer,
  MdStar,
  MdSwapHoriz,
  MdMarkEmailUnread,
  MdHistory,
  MdWeb,
  MdBadge,
  MdArticle,
  MdQuestionAnswer,
  MdViewCarousel,
  MdReceiptLong,
  MdSchool,
  MdRocketLaunch,
  MdHowToReg,
  MdGroups,
  MdRequestQuote,
  MdAccountBalanceWallet,
  MdLocalShipping,
  MdInsertChart,
  MdFolderOpen,
} from "react-icons/md";

/**
 * Single source of truth for app navigation — consumed by the Sidebar, the
 * breadcrumb bar, the mobile tab bar and the command palette (Ctrl/Cmd+K) so
 * they never drift.
 *
 * Sections follow how ZAN Tech actually works: the store, the education side
 * (courses & bootcamps), money & stock, the public websites, and the team.
 *
 * Item fields:
 *   path      where the link goes (may include ?tab=…)
 *   label     what staff see
 *   icon      react-icons component
 *   match     extra path prefixes that should highlight this item
 *             (detail / edit pages, e.g. /orders/123)
 *   keywords  extra words for search ("transactions" finds Transitions)
 *   badgeKey  live count shown next to the item (see Sidebar)
 *   subItems  nested links (only used where a page really has variants)
 */
export const NAV_SECTIONS = [
  {
    key: "overview",
    title: "Overview",
    items: [
      { path: "/dashboard", icon: MdDashboard, label: "Dashboard", keywords: "home overview today" },
      { path: "/analytics", icon: MdInsertChart, label: "Analytics", keywords: "charts graphs" },
      { path: "/reports", icon: MdAnalytics, label: "Reports", keywords: "profit sales summary export" },
    ],
  },
  {
    key: "store",
    title: "Store",
    items: [
      {
        path: "/orders",
        icon: MdShoppingCart,
        label: "Orders",
        badgeKey: "processing",
        match: ["/orders/"],
        keywords: "sales invoice create order custom invoice",
      },
      {
        label: "Products",
        icon: MdInventory,
        keywords: "items stock inventory",
        subItems: [
          { path: "/products", label: "All products", match: ["/products/"] },
          { path: "/products/add", label: "Add product" },
          { path: "/products/in-stock", label: "In stock" },
          { path: "/products/buying-price", label: "Buying prices", keywords: "cost purchase price" },
        ],
      },
      { path: "/categories", icon: MdCategory, label: "Categories" },
      { path: "/coupons", icon: MdLocalOffer, label: "Coupons", keywords: "discount promo code" },
      { path: "/customers", icon: MdPeople, label: "Customers", match: ["/customers/"], keywords: "buyers users" },
      { path: "/ratings", icon: MdStar, label: "Reviews", keywords: "ratings feedback" },
    ],
  },
  {
    key: "education",
    title: "Education",
    items: [
      {
        path: "/course-registrations",
        icon: MdHowToReg,
        label: "Registrations",
        badgeKey: "registrations",
        keywords: "enroll admission applications new students",
      },
      {
        path: "/landing?tab=courses",
        icon: MdSchool,
        label: "Courses",
        match: ["/landing/courses/"],
        keywords: "classes programmes curriculum",
      },
      { path: "/landing?tab=bootcamps", icon: MdRocketLaunch, label: "Bootcamps", keywords: "camp workshop" },
      { path: "/students", icon: MdGroups, label: "Students", match: ["/students/"] },
      {
        path: "/course-invoices",
        icon: MdRequestQuote,
        label: "Course invoices",
        match: ["/course-invoices/"],
        keywords: "fees payment receipt monthly",
      },
      { path: "/payment-methods", icon: MdAccountBalanceWallet, label: "Payment methods", keywords: "bkash rocket bank" },
    ],
  },
  {
    key: "finance",
    title: "Finance & Stock",
    items: [
      { path: "/transitions", icon: MdSwapHoriz, label: "Transactions", keywords: "transitions payments money in out" },
      { path: "/expenses", icon: MdAttachMoney, label: "Expenses", match: ["/expenses/"], keywords: "costs spending" },
      { path: "/suppliers", icon: MdBusiness, label: "Suppliers", keywords: "vendors" },
      { path: "/challans", icon: MdLocalShipping, label: "Challans", match: ["/challans/"], keywords: "purchase delivery stock in" },
    ],
  },
  {
    key: "website",
    title: "Website",
    items: [
      { path: "/settings/hero", icon: MdViewCarousel, label: "Store banners", keywords: "hero images slider home" },
      {
        path: "/landing?tab=projects",
        icon: MdWeb,
        label: "Projects & company",
        match: ["/landing/projects/"],
        keywords: "landing page main site company info about",
      },
      { path: "/blog", icon: MdArticle, label: "Blog", match: ["/blog/"], keywords: "posts tutorials articles" },
      { path: "/faq", icon: MdQuestionAnswer, label: "FAQ", keywords: "questions" },
      { path: "/contact", icon: MdMarkEmailUnread, label: "Messages", keywords: "contacts inbox contact form" },
      { path: "/settings/documents", icon: MdFolderOpen, label: "Documents", keywords: "files pdf" },
    ],
  },
  {
    key: "team",
    title: "Team",
    items: [
      { path: "/staff", icon: MdBadge, label: "Staff", keywords: "users admins employees" },
      { path: "/activity", icon: MdHistory, label: "Activity log", keywords: "history audit" },
    ],
  },
];

/** Shortcuts for creating things — shown in the command palette and dashboard. */
export const QUICK_CREATE = [
  { path: "/orders/create", label: "New order", icon: MdShoppingCart, keywords: "create sale" },
  { path: "/orders/custom-invoice", label: "Custom invoice", icon: MdReceiptLong, keywords: "create bill" },
  { path: "/products/add", label: "Add product", icon: MdInventory, keywords: "create item" },
  { path: "/course-invoices/add", label: "New course invoice", icon: MdRequestQuote, keywords: "create fee receipt" },
  { path: "/landing/courses/add", label: "Add course", icon: MdSchool, keywords: "create class" },
  { path: "/landing/courses/add?kind=bootcamp", label: "Add bootcamp", icon: MdRocketLaunch, keywords: "create camp" },
  { path: "/blog/add", label: "Write blog post", icon: MdArticle, keywords: "create article" },
  { path: "/challans/add", label: "Add challan", icon: MdLocalShipping, keywords: "create purchase" },
];

const leafItems = (section) =>
  section.items.flatMap((item) =>
    item.subItems
      ? item.subItems.map((sub) => ({
          ...sub,
          icon: item.icon,
          group: `${section.title} / ${item.label}`,
          section: section.title,
          parent: item.label,
          keywords: [item.keywords, sub.keywords].filter(Boolean).join(" "),
        }))
      : [{ ...item, group: section.title, section: section.title }]
  );

/** Flat, search-friendly list of every navigable destination. */
export const FLAT_NAV_ITEMS = [
  ...NAV_SECTIONS.flatMap(leafItems),
  ...QUICK_CREATE.map((q) => ({ ...q, group: "Create", section: "Create" })),
];

/**
 * Finds the nav entry for the current URL: exact path (+ ?tab) first, then the
 * longest matching prefix, so /orders/42 highlights "Orders" and
 * /landing/courses/x highlights "Courses".
 */
export const findActiveNav = (pathname, search = "") => {
  let tab = new URLSearchParams(search).get("tab");
  // /landing opens on Projects; Company Info lives under the same nav entry
  if (pathname === "/landing" && (!tab || tab === "company-info")) tab = "projects";
  let best = null;
  let bestScore = -1;
  for (const item of FLAT_NAV_ITEMS) {
    if (item.section === "Create") continue;
    const [base, query] = item.path.split("?");
    const itemTab = query ? new URLSearchParams(query).get("tab") : null;
    let score = -1;
    if (pathname === base) {
      if (!itemTab) score = 900;
      else if (itemTab === tab) score = 1000;
    } else {
      for (const prefix of item.match || []) {
        if (pathname.startsWith(prefix)) score = Math.max(score, prefix.length);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 0 ? best : null;
};
