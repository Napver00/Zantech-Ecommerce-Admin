import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdExpandMore,
  MdClose,
  MdSearch,
  MdOpenInNew,
  MdPushPin,
  MdOutlinePushPin,
} from "react-icons/md";
import { Collapse } from "react-bootstrap";
import { useOrderContext } from "../../context/OrderContext";
import { NAV_SECTIONS, FLAT_NAV_ITEMS, findActiveNav } from "../../config/navigation";
import logo from "../../assets/zantechLogo.png";
import "./Sidebar.css";

const PINS_KEY = "zt-nav-pins";
const COLLAPSED_KEY = "zt-nav-collapsed";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the sidebar still works, it just won't remember */
  }
};

const textOf = (item) => `${item.label} ${item.keywords || ""}`.toLowerCase();

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { statusSummary } = useOrderContext();
  const [search, setSearch] = useState("");
  const [pins, setPins] = useState(() => readJson(PINS_KEY, []));
  const [collapsed, setCollapsed] = useState(() => readJson(COLLAPSED_KEY, {}));
  const [openGroups, setOpenGroups] = useState({});
  const [registrationCount, setRegistrationCount] = useState(() => window.__ztRegistrationCount || 0);

  // Close the drawer on navigation (mobile)
  useEffect(() => {
    if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // New website registrations — the header polls and broadcasts the count
  useEffect(() => {
    const onCount = (e) => setRegistrationCount(e.detail || 0);
    window.addEventListener("registrations:count", onCount);
    return () => window.removeEventListener("registrations:count", onCount);
  }, []);

  const badges = {
    processing: statusSummary?.processing || 0,
    registrations: registrationCount,
  };

  const active = useMemo(
    () => findActiveNav(location.pathname, location.search),
    [location.pathname, location.search]
  );
  const isActive = (item) => active && active.path === item.path;

  const togglePin = useCallback((path) => {
    setPins((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      writeJson(PINS_KEY, next);
      return next;
    });
  }, []);

  const toggleSection = (key) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeJson(COLLAPSED_KEY, next);
      return next;
    });
  };

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  // Search: show a flat list of matching pages (labels + keywords)
  const searchResults = useMemo(
    () => (isSearching ? FLAT_NAV_ITEMS.filter((i) => i.section !== "Create" && textOf(i).includes(query)) : []),
    [isSearching, query]
  );

  const pinnedItems = useMemo(
    () => pins.map((p) => FLAT_NAV_ITEMS.find((i) => i.path === p && i.section !== "Create")).filter(Boolean),
    [pins]
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchResults[0]) {
      navigate(searchResults[0].path);
      setSearch("");
    } else if (e.key === "Escape") {
      setSearch("");
    }
  };

  const renderLink = (item, { sub = false, showGroup = false } = {}) => {
    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
    const pinned = pins.includes(item.path);
    const Icon = item.icon;
    return (
      <div key={`${item.path}-${showGroup ? "g" : ""}`} className="sidebar-row">
        <Link
          to={item.path}
          className={`sidebar-link ${sub ? "sidebar-sublink" : ""} ${isActive(item) ? "active" : ""}`}
          onClick={() => isSearching && setSearch("")}
        >
          {!sub && Icon && (
            <span className="sidebar-icon">
              <Icon />
            </span>
          )}
          <span className="sidebar-label">
            {item.label}
            {showGroup && <small>{item.group}</small>}
          </span>
          {badge > 0 && <span className="sidebar-count">{badge > 99 ? "99+" : badge}</span>}
        </Link>
        <button
          type="button"
          className={`sidebar-pin ${pinned ? "is-pinned" : ""}`}
          onClick={() => togglePin(item.path)}
          aria-label={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          title={pinned ? "Unpin" : "Pin to top"}
        >
          {pinned ? <MdPushPin size={14} /> : <MdOutlinePushPin size={14} />}
        </button>
      </div>
    );
  };

  const renderItem = (item) => {
    if (!item.subItems) return renderLink(item);
    const childActive = item.subItems.some((s) => isActive(s));
    const open = openGroups[item.label] ?? childActive;
    const Icon = item.icon;
    return (
      <div key={item.label}>
        <button
          type="button"
          className={`sidebar-link sidebar-group-toggle ${childActive ? "is-parent-active" : ""}`}
          onClick={() => setOpenGroups((p) => ({ ...p, [item.label]: !open }))}
          aria-expanded={open}
        >
          <span className="sidebar-icon">
            <Icon />
          </span>
          <span className="sidebar-label">{item.label}</span>
          <MdExpandMore size={18} className={`sidebar-chevron ${open ? "is-open" : ""}`} />
        </button>
        <Collapse in={open}>
          <div>
            <div className="sidebar-sublist">{item.subItems.map((s) => renderLink(s, { sub: true }))}</div>
          </div>
        </Collapse>
      </div>
    );
  };

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to="/dashboard" className="sidebar-brand-link">
          <img src={logo} alt="" />
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-name">
              ZAN<span>TECH</span>
            </span>
            <span className="sidebar-brand-sub">Admin Console</span>
          </span>
        </Link>
        <button className="sidebar-mobile-close" onClick={onClose} aria-label="Close menu">
          <MdClose size={20} />
        </button>
      </div>

      {/* Find a page */}
      <div className="sidebar-search">
        <div className="sidebar-search-box">
          <MdSearch size={17} className="sidebar-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find a page…"
            aria-label="Find a page"
          />
          {search && (
            <button className="sidebar-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <MdClose size={14} />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        {isSearching ? (
          <div className="sidebar-section">
            <div className="sidebar-section-title is-static">
              {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
            </div>
            {searchResults.length === 0 ? (
              <div className="sidebar-empty">No pages match “{search}”</div>
            ) : (
              searchResults.map((item) => renderLink(item, { showGroup: true }))
            )}
          </div>
        ) : (
          <>
            {pinnedItems.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-section-title is-static">
                  <MdPushPin size={11} /> Pinned
                </div>
                {pinnedItems.map((item) => renderLink(item))}
              </div>
            )}

            {NAV_SECTIONS.map((section) => {
              const holdsActive = section.items.some((i) =>
                i.subItems ? i.subItems.some((s) => isActive(s)) : isActive(i)
              );
              const isCollapsed = collapsed[section.key] && !holdsActive;
              const sectionCount = section.items.reduce(
                (n, i) => n + (i.badgeKey ? badges[i.badgeKey] || 0 : 0),
                0
              );
              return (
                <div key={section.key} className="sidebar-section">
                  <button
                    type="button"
                    className="sidebar-section-title"
                    onClick={() => toggleSection(section.key)}
                    aria-expanded={!isCollapsed}
                  >
                    <span>{section.title}</span>
                    {isCollapsed && sectionCount > 0 && <span className="sidebar-section-dot">{sectionCount}</span>}
                    <MdExpandMore size={14} className={`sidebar-section-chevron ${isCollapsed ? "" : "is-open"}`} />
                  </button>
                  <Collapse in={!isCollapsed}>
                    <div>
                      <div className="sidebar-section-items">{section.items.map(renderItem)}</div>
                    </div>
                  </Collapse>
                </div>
              );
            })}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <span>
          <span className="sidebar-status-dot" />
          ONLINE
        </span>
        <span className="d-flex gap-3">
          <a href="https://store.zantechbd.com" target="_blank" rel="noreferrer">
            Store <MdOpenInNew size={12} />
          </a>
          <a href="https://zantechbd.com" target="_blank" rel="noreferrer">
            Site <MdOpenInNew size={12} />
          </a>
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
