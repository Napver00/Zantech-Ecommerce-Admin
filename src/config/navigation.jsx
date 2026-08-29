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
  MdContactMail,
  MdHistory,
  MdWeb,
  MdPeopleOutline,
  MdBook,
  MdQuestionAnswer,
  MdSettings,
  MdReceiptLong,
  MdSchool,
} from "react-icons/md";

/**
 * Single source of truth for app navigation — consumed by both the Sidebar
 * and the command palette (Ctrl/Cmd+K quick-search) so they never drift.
 * Each section has a `key` (used to remember collapsed/expanded state) and
 * `items`, each either a direct { path, label, icon } or a grouped
 * { label, icon, subItems: [{ path, label }] }.
 */
export const NAV_SECTIONS = [
  {
    key: "main",
    title: "Main",
    items: [
      { path: "/dashboard", icon: MdDashboard, label: "Dashboard" },
      { path: "/analytics", icon: MdAnalytics, label: "Analytics" },
    ],
  },
  {
    key: "management",
    title: "Management",
    items: [
      { path: "/orders", icon: MdShoppingCart, label: "Orders", badgeKey: "processing" },
      {
        label: "Products",
        icon: MdInventory,
        subItems: [
          { path: "/products", label: "All Products" },
          { path: "/products/add", label: "Add Product" },
          { path: "/products/buying-price", label: "Buying Price" },
          { path: "/products/in-stock", label: "In Stock" },
        ],
      },
      { path: "/categories", icon: MdCategory, label: "Categories" },
      { path: "/coupons", icon: MdLocalOffer, label: "Coupons" },
      { path: "/ratings", icon: MdStar, label: "Ratings" },
      { path: "/transitions", icon: MdSwapHoriz, label: "Transitions" },
    ],
  },
  {
    key: "customers",
    title: "Customers",
    items: [
      { path: "/customers", icon: MdPeople, label: "Customers" },
      { path: "/contact", icon: MdContactMail, label: "Contacts" },
    ],
  },
  {
    key: "inventory",
    title: "Inventory",
    items: [
      { path: "/suppliers", icon: MdBusiness, label: "Suppliers" },
      { path: "/challans", icon: MdReceiptLong, label: "Challans" },
      { path: "/expenses", icon: MdAttachMoney, label: "Expenses" },
    ],
  },
  {
    key: "staff",
    title: "Staff & Activity",
    items: [
      { path: "/staff", icon: MdPeopleOutline, label: "Staff" },
      { path: "/activity", icon: MdHistory, label: "Activity" },
    ],
  },
  {
    key: "content",
    title: "Content",
    items: [
      { path: "/blog", icon: MdBook, label: "Blog" },
      { path: "/faq", icon: MdQuestionAnswer, label: "FAQ" },
    ],
  },
  {
    key: "courses",
    title: "Courses",
    items: [
      {
        label: "Courses",
        icon: MdSchool,
        badgeText: "NEW",
        subItems: [
          { path: "/landing?tab=courses", label: "Manage Courses" },
          { path: "/students", label: "Students" },
          { path: "/course-invoices", label: "Course Invoices" },
          { path: "/course-invoices/add", label: "New Invoice" },
        ],
      },
    ],
  },
  {
    key: "reports",
    title: "Reports",
    items: [
      { path: "/reports", icon: MdAnalytics, label: "Reports" },
    ],
  },
  {
    key: "settings",
    title: "Settings",
    items: [
      { path: "/settings/hero", icon: MdSettings, label: "Hero Section" },
      { path: "/landing", icon: MdWeb, label: "Landing Page" },
      { path: "/settings/documents", icon: MdReceiptLong, label: "Documents" },
    ],
  },
];

/** Flat, search-friendly list of every navigable destination for the command palette. */
export const FLAT_NAV_ITEMS = NAV_SECTIONS.flatMap((section) =>
  section.items.flatMap((item) =>
    item.subItems
      ? item.subItems.map((sub) => ({
          path: sub.path,
          label: sub.label,
          group: `${section.title} / ${item.label}`,
          icon: item.icon,
        }))
      : [{ path: item.path, label: item.label, group: section.title, icon: item.icon }]
  )
);
