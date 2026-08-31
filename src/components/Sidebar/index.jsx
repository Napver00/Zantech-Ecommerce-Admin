import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdStore,
  MdExpandMore,
  MdExpandLess,
  MdClose,
  MdSearch,
} from "react-icons/md";
import { Nav, Badge, Collapse } from "react-bootstrap";
import { useOrderContext } from "../../context/OrderContext";
import { NAV_SECTIONS } from "../../config/navigation";
import "./Sidebar.css";

const matches = (label, query) => label.toLowerCase().includes(query);

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { statusSummary } = useOrderContext();
  const [openSections, setOpenSections] = useState({});
  const [search, setSearch] = useState("");

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const toggleSection = (label) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => location.pathname === path;
  const isSubActive = (subItems) => subItems.some((s) => location.pathname.startsWith(s.path.split("?")[0]));

  const badgeValues = { processing: statusSummary.processing };

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  // When filtering, decide per-section/per-item visibility without touching the
  // underlying nav data — nothing is destructively hidden, only dimmed away.
  const filteredSections = useMemo(() => {
    if (!isSearching) return NAV_SECTIONS;
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.subItems) {
          return matches(item.label, query) || item.subItems.some((s) => matches(s.label, query));
        }
        return matches(item.label, query);
      }),
    })).filter((section) => section.items.length > 0);
  }, [isSearching, query]);

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    // Jump straight to the first match on Enter
    for (const section of filteredSections) {
      for (const item of section.items) {
        if (item.subItems) {
          const sub = item.subItems.find((s) => matches(s.label, query));
          if (sub) return navigate(sub.path);
        } else if (matches(item.label, query)) {
          return navigate(item.path);
        }
      }
    }
  };

  return (
    <div className="sidebar bg-white h-100 shadow-sm">
      {/* Brand */}
      <div className="sidebar-brand p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div className="brand-logo d-flex align-items-center gap-2">
            <MdStore size={26} className="text-primary" />
            <span className="fw-bold fs-6">ZAN Tech</span>
          </div>
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

      {/* Quick filter — never hides anything unless the user actively types */}
      <div className="sidebar-search px-3 pt-3">
        <div className="sidebar-search-box">
          <MdSearch size={17} className="sidebar-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find a page..."
            aria-label="Search navigation"
          />
          {search && (
            <button className="sidebar-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <MdClose size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav p-2">
        {filteredSections.length === 0 && isSearching && (
          <div className="text-center text-muted small py-4 px-2">No pages match "{search}"</div>
        )}
        {filteredSections.map((section) => (
          <div key={section.key} className="mb-3">
            <div className="sidebar-section-title text-uppercase small fw-semibold text-secondary mb-1 px-2" style={{ fontSize: "0.7rem", letterSpacing: "0.06em" }}>
              {section.title}
            </div>
            <Nav className="flex-column gap-1">
              {section.items.map((item) => {
                if (item.subItems) {
                  const active = isSubActive(item.subItems);
                  const forceOpen = isSearching && item.subItems.some((s) => matches(s.label, query));
                  const open = forceOpen || (openSections[item.label] ?? active);
                  return (
                    <div key={item.label}>
                      <Nav.Link
                        onClick={() => toggleSection(item.label)}
                        className={`sidebar-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${active ? "active" : ""}`}
                      >
                        <span className="sidebar-icon flex-shrink-0"><item.icon size={22} /></span>
                        <span className="flex-grow-1 text-truncate">{item.label}</span>
                        {item.badgeText && <Badge bg="success" className="sidebar-new-badge me-1">{item.badgeText}</Badge>}
                        {open ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                      </Nav.Link>
                      <Collapse in={open}>
                        <div>
                          <Nav className="flex-column gap-1 ps-4 mt-1">
                            {item.subItems
                              .filter((sub) => !isSearching || matches(sub.label, query) || matches(item.label, query))
                              .map((sub) => (
                                <Nav.Link
                                  key={sub.path}
                                  as={Link}
                                  to={sub.path}
                                  className={`sidebar-link sidebar-sublink d-flex align-items-center rounded-3 px-3 py-2 ${location.pathname === sub.path.split("?")[0] ? "active" : ""}`}
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

                const badgeValue = item.badgeKey ? badgeValues[item.badgeKey] : null;

                return (
                  <Nav.Item key={item.path}>
                    <Nav.Link
                      as={Link}
                      to={item.path}
                      className={`sidebar-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 ${isActive(item.path) ? "active" : ""}`}
                    >
                      <span className="sidebar-icon flex-shrink-0"><item.icon size={22} /></span>
                      <span className="flex-grow-1 text-truncate">{item.label}</span>
                      {badgeValue > 0 && <Badge bg="danger" pill className="ms-auto">{badgeValue}</Badge>}
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
