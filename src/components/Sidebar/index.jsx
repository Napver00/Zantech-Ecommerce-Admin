import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdShoppingCart,
  MdPeople,
  MdCategory,
  MdInventory,
  MdLocalShipping,
  MdPayment,
  MdSettings,
  MdAnalytics,
  MdStore,
  MdBusiness,
  MdChevronLeft,
  MdChevronRight,
  MdMenu,
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
  MdWork,
  MdBook,
  MdQuestionAnswer,
} from "react-icons/md";
import { Nav, Badge, Collapse } from "react-bootstrap";
import { useOrderContext } from "../../context/OrderContext";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { statusSummary } = useOrderContext();
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const menuItems = [
    {
      title: "Main",
      items: [
        {
          path: "/dashboard",
          icon: <MdDashboard size={22} />,
          label: "Dashboard",
        },
        {
          path: "/analytics",
          icon: <MdAnalytics size={22} />,
          label: "Analytics",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          path: "/orders",
          icon: <MdShoppingCart size={22} />,
          label: "Orders",
          badge:
            statusSummary.processing > 0 ? (
              <Badge bg="danger" pill className="ms-2">
                {statusSummary.processing}
              </Badge>
            ) : null,
        },
        {
          label: "Products",
          icon: <MdInventory size={22} />,
          subItems: [
            {
              path: "/products",
              label: "All Products",
            },
            {
              path: "/products/add",
              label: "Add New Product",
            },
            {
              path: "/products/buying-price",
              label: "Product Buying Price",
            },
            {
              path: "/products/in-stock",
              label: "In Stock",
            },
          ],
        },
        {
          path: "/categories",
          icon: <MdCategory size={22} />,
          label: "Categories",
        },
        {
          path: "/transitions",
          icon: <MdSwapHoriz size={22} />,
          label: "Transitions",
        },
        {
          path: "/coupons",
          icon: <MdLocalOffer size={22} />,
          label: "Coupons",
        },
        {
          path: "/ratings",
          icon: <MdStar size={22} />,
          label: "Ratings",
        },
        {
          path: "/customers",
          icon: <MdPeople size={22} />,
          label: "Customers",
        },
        {
          path: "/contact",
          icon: <MdContactMail size={22} />,
          label: "Contacts",
        },
        {
          path: "/activity",
          icon: <MdHistory size={22} />,
          label: "Activity",
        },
      ],
    },
    {
      title: "Inventory",
      items: [
        {
          path: "/suppliers",
          icon: <MdBusiness size={22} />,
          label: "Suppliers",
        },
        {
          path: "/challans",
          icon: <MdPerson size={22} />,
          label: "Challans",
        },
        {
          path: "/expenses",
          icon: <MdAttachMoney size={22} />,
          label: "Expenses",
        },
      ],
    },
    {
      title: "Staff Management",
      items: [
        {
          path: "/staff",
          icon: <MdPeopleOutline size={22} />,
          label: "Staff",
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          path: "/careers",
          icon: <MdWork size={22} />,
          label: "Careers",
        },
        {
          path: "/blog",
          icon: <MdBook size={22} />,
          label: "Blog",
        },
        {
          path: "/faq",
          icon: <MdQuestionAnswer size={22} />,
          label: "FAQ",
        },
      ],
    },
    {
      title: "Reports",
      items: [
        {
          path: "/reports",
          icon: <MdAnalytics size={22} />,
          label: "Reports",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          path: "/settings/hero",
          icon: <MdSettings size={22} />,
          label: "Hero Section",
        },
        {
          path: "/landing",
          icon: <MdWeb size={22} />,
          label: "Landing Page",
        },
        {
          path: "/settings/documents",
          icon: <MdSettings size={22} />,
          label: "Documents",
        },
      ],
    },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={`sidebar bg-white h-100 shadow-sm ${
        collapsed ? "collapsed" : ""
      }`}
    >
      <div className="sidebar-brand p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          {!collapsed && (
            <div className="brand-logo d-flex align-items-center gap-2">
              <MdStore size={28} className="text-primary" />
              <span className="brand-text fw-bold">ZanTech</span>
            </div>
          )}
          <button
            className="btn btn-link text-secondary p-0 d-flex align-items-center"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <MdChevronRight size={24} />
            ) : (
              <MdChevronLeft size={24} />
            )}
          </button>
        </div>
      </div>

      <div className="sidebar-nav p-3">
        {menuItems.map((section, index) => (
          <div key={index} className="mb-4">
            {!collapsed && (
              <div className="sidebar-section-title text-uppercase small text-secondary mb-2 px-3">
                {section.title}
              </div>
            )}
            <Nav className="flex-column">
              {section.items.map((item) => {
                if (item.subItems) {
                  const isProductActive = item.subItems.some((subItem) =>
                    location.pathname.startsWith(subItem.path)
                  );
                  const isSectionOpen = openSections[item.label] || false;

                  return (
                    <div key={item.label}>
                      <Nav.Link
                        onClick={() => toggleSection(item.label)}
                        aria-controls="products-collapse"
                        aria-expanded={isSectionOpen}
                        className={`sidebar-link d-flex align-items-center gap-3 rounded-3 px-3 py-2 ${
                          isProductActive ? "active" : ""
                        }`}
                      >
                        <span
                          className={`sidebar-icon ${
                            isProductActive ? "active" : ""
                          }`}
                        >
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-grow-1">{item.label}</span>
                            {isSectionOpen ? (
                              <MdExpandLess />
                            ) : (
                              <MdExpandMore />
                            )}
                          </>
                        )}
                      </Nav.Link>
                      <Collapse in={!collapsed && isSectionOpen}>
                        <div id="products-collapse">
                          <Nav className="flex-column ms-4">
                            {item.subItems.map((subItem) => (
                              <Nav.Link
                                key={subItem.path}
                                as={Link}
                                to={subItem.path}
                                className={`sidebar-link d-flex align-items-center gap-3 rounded-3 px-3 py-2 ${
                                  location.pathname === subItem.path
                                    ? "active"
                                    : ""
                                }`}
                              >
                                {subItem.label}
                              </Nav.Link>
                            ))}
                          </Nav>
                        </div>
                      </Collapse>
                    </div>
                  );
                }
                const isActive = location.pathname === item.path;
                return (
                  <Nav.Item key={item.path} className="mb-1" title={item.label}>
                    <Nav.Link
                      as={Link}
                      to={item.path}
                      className={`sidebar-link d-flex align-items-center gap-3 rounded-3 px-3 py-2 ${
                        isActive ? "active" : ""
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className={`sidebar-icon ${isActive ? "active" : ""}`}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-grow-1">{item.label}</span>
                          {item.badge && (
                            <span className="badge bg-danger rounded-pill">
                              {item.badge}
                            </span>
                          )}
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
