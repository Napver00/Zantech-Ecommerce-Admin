import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdExpandMore,
  MdExpandLess,
  MdClose,
  MdSearch,
  MdOpenInNew,
} from "react-icons/md";
import { Nav, Badge, Collapse } from "react-bootstrap";
import { useOrderContext } from "../../context/OrderContext";
import { NAV_SECTIONS } from "../../config/navigation";
import logo from "../../assets/zantechLogo.png";
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
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to="/dashboard" className="sidebar-brand-link">
          <img src={logo} alt="" />
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-name">ZAN<span>TECH</span></span>
            <span className="sidebar-brand-sub">Admin Console</span>
          </span>
        </Link>
        {/* Mobile close button — visible when the sidebar is a drawer */}
        <button className="sidebar-mobile-close" onClick={onClose} aria-label="Close sidebar">
          <MdClose size={20} />
        </button>
      </div>

      {/* Quick filter — never hides anything unless the user actively types */}
      <div className="sidebar-search">
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
      <div className="sidebar-nav">
        {filteredSections.length === 0 && isSearching && (
          <div className="sidebar-empty">No pages match "{search}"</div>
        )}
        {filteredSections.map((section) => (
          <div key={section.key} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            <Nav className="flex-column">
              {section.items.map((item) => {
                if (item.subItems) {
                  const active = isSubActive(item.subItems);
                  const forceOpen = isSearching && item.subItems.some((s) => matches(s.label, query));
                  const open = forceOpen || (openSections[item.label] ?? active);
                  return (
                    <div key={item.label}>
                      <Nav.Link
                        onClick={() => toggleSection(item.label)}
                        className={`sidebar-link ${active ? "active" : ""}`}
                      >
                        <span className="sidebar-icon flex-shrink-0"><item.icon /></span>
                        <span className="flex-grow-1 text-truncate">{item.label}</span>
                        {item.badgeText && <Badge className="sidebar-new-badge">{item.badgeText}</Badge>}
                        {open ? <MdExpandLess size={18} className="sidebar-chevron" /> : <MdExpandMore size={18} className="sidebar-chevron" />}
                      </Nav.Link>
                      <Collapse in={open}>
                        <div>
                          <Nav className="flex-column sidebar-sublist">
                            {item.subItems
                              .filter((sub) => !isSearching || matches(sub.label, query) || matches(item.label, query))
                              .map((sub) => (
                                <Nav.Link
                                  key={sub.path}
                                  as={Link}
                                  to={sub.path}
                                  className={`sidebar-link sidebar-sublink ${location.pathname === sub.path.split("?")[0] ? "active" : ""}`}
                                >
                                  <span className="flex-grow-1 text-truncate">{sub.label}</span>
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
                      className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                    >
                      <span className="sidebar-icon flex-shrink-0"><item.icon /></span>
                      <span className="flex-grow-1 text-truncate">{item.label}</span>
                      {badgeValue > 0 && <Badge pill className="sidebar-count-badge ms-auto">{badgeValue}</Badge>}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <span><span className="sidebar-status-dot" />ONLINE</span>
        <span className="d-flex gap-3">
          <a href="https://store.zantechbd.com" target="_blank" rel="noreferrer">Store <MdOpenInNew size={12} /></a>
          <a href="https://zantechbd.com" target="_blank" rel="noreferrer">Site <MdOpenInNew size={12} /></a>
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
