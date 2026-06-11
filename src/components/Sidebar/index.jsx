import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdShoppingCart,
  MdPeople,
  MdCategory,
  MdInventory,
  MdAnalytics,
  MdStore,
  MdBusiness,
  MdChevronLeft,
  MdChevronRight,
  MdPerson,
  MdAttachMoney,
  MdLocalOffer,
  MdStar,
  MdSwapHoriz,
  MdContactMail,
  MdExpandMore,
  MdExpandLess,
  MdHistory,
  MdWeb,
  MdPeopleOutline,
  MdBook,
  MdQuestionAnswer,
  MdSettings,
  MdReceiptLong,
  MdClose,
} from "react-icons/md";
import { Nav, Badge, Collapse } from "react-bootstrap";
import { useOrderContext } from "../../context/OrderContext";
import "./Sidebar.css";

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { statusSummary } = useOrderContext();
  const [openSections, setOpenSections] = useState({});

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const menuItems = [
    {
      title: "Main",
      items: [
        { path: "/dashboard", icon: <MdDashboard size={22} />, label: "Dashboard" },
        { path: "/analytics", icon: <MdAnalytics size={22} />, label: "Analytics" },
      ],
    },
    {
      title: "Management",
      items: [
        {
          path: "/orders",
          icon: <MdShoppingCart size={22} />,
          label: "Orders",
          badge: statusSummary.processing > 0 ? (
            <Badge bg="danger" pill className="ms-auto">{statusSummary.processing}</Badge>
          ) : null,
        },
        {
          label: "Products",
          icon: <MdInventory size={22} />,
          subItems: [
            { path: "/products", label: "All Products" },
            { path: "/products/add", label: "Add Product" },
            { path: "/products/buying-price", label: "Buying Price" },
            { path: "/products/in-stock", label: "In Stock" },
          ],
        },
        { path: "/categories", icon: <MdCategory size={22} />, label: "Categories" },
        { path: "/coupons", icon: <MdLocalOffer size={22} />, label: "Coupons" },
        { path: "/ratings", icon: <MdStar size={22} />, label: "Ratings" },
        { path: "/transitions", icon: <MdSwapHoriz size={22} />, label: "Transitions" },
      ],
    },
    {
      title: "Customers",
      items: [
        { path: "/customers", icon: <MdPeople size={22} />, label: "Customers" },
        { path: "/contact", icon: <MdContactMail size={22} />, label: "Contacts" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { path: "/suppliers", icon: <MdBusiness size={22} />, label: "Suppliers" },
        { path: "/challans", icon: <MdReceiptLong size={22} />, label: "Challans" },
        { path: "/expenses", icon: <MdAttachMoney size={22} />, label: "Expenses" },
      ],
    },
    {
      title: "Staff & Activity",
      items: [
        { path: "/staff", icon: <MdPeopleOutline size={22} />, label: "Staff" },
        { path: "/activity", icon: <MdHistory size={22} />, label: "Activity" },
      ],
    },
    {
      title: "Content",
      items: [
        { path: "/blog", icon: <MdBook size={22} />, label: "Blog" },
        { path: "/faq", icon: <MdQuestionAnswer size={22} />, label: "FAQ" },
      ],
    },
    {
      title: "Reports",
      items: [
        { path: "/reports", icon: <MdAnalytics size={22} />, label: "Reports" },
      ],
    },
    {
      title: "Settings",
      items: [
        { path: "/settings/hero", icon: <MdSettings size={22} />, label: "Hero Section" },
        { path: "/landing", icon: <MdWeb size={22} />, label: "Landing Page" },
        { path: "/settings/documents", icon: <MdReceiptLong size={22} />, label: "Documents" },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isSubActive = (subItems) => subItems.some((s) => location.pathname.startsWith(s.path));

  return (
    <div className={`sidebar bg-white h-100 shadow-sm ${collapsed ? "collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          {!collapsed && (
            <div className="brand-logo d-flex align-items-center gap-2">
              <MdStore size={26} className="text-primary" />
              <span className="fw-bold fs-6">ZanTech</span>
            </div>
          )}
          {/* Desktop collapse toggle — visible at ≥769px */}
          <button
            className="btn btn-link text-secondary p-0 sidebar-desktop-toggle align-items-center"
            onClick={() => setCollapsed((p) => !p)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <MdChevronRight size={22} /> : <MdChevronLeft size={22} />}
          </button>
          {/* Mobile close button — visible at ≤768px */}
          <button
            className="btn btn-link text-secondary p-0 sidebar-mobile-close align-items-center"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <MdClose size={22} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav p-2">
        {menuItems.map((section, si) => (
          <div key={si} className="mb-3">
            {!collapsed && (
              <div className="sidebar-section-title text-uppercase small fw-semibold text-secondary mb-1 px-2" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
                {section.title}
              </div>
            )}
            <Nav className="flex-column gap-1">
              {section.items.map((item) => {
                if (item.subItems) {
                  const active = isSubActive(item.subItems);
                  const open = openSections[item.label] ?? active;
                  return (
                    <div key={item.label}>
                      <Nav.Link
                        onClick={() => toggleSection(item.label)}
                        className={`sidebar-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${active ? "active" : ""}`}
                      >
                        <span className="sidebar-icon flex-shrink-0">{item.icon}</span>
                        {!collapsed && (
                          <>
                            <span className="flex-grow-1 text-truncate">{item.label}</span>
                            {open ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                          </>
                        )}
                      </Nav.Link>
                      <Collapse in={!collapsed && open}>
                        <div>
                          <Nav className="flex-column gap-1 ps-4 mt-1">
                            {item.subItems.map((sub) => (
                              <Nav.Link
                                key={sub.path}
                                as={Link}
                                to={sub.path}
                                className={`sidebar-link sidebar-sublink d-flex align-items-center rounded-3 px-3 py-2 ${location.pathname === sub.path ? "active" : ""}`}
                              >
                                <span className="flex-grow-1 text-truncate" style={{ fontSize: "0.85rem" }}>{sub.label}</span>
                              </Nav.Link>
                            ))}
                          </Nav>
                        </div>
                      </Collapse>
                    </div>
                  );
                }

                return (
                  <Nav.Item key={item.path} title={collapsed ? item.label : undefined}>
                    <Nav.Link
                      as={Link}
                      to={item.path}
                      className={`sidebar-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${isActive(item.path) ? "active" : ""}`}
                    >
                      <span className="sidebar-icon flex-shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-grow-1 text-truncate">{item.label}</span>
                          {item.badge}
                        </>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
