import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MdDashboard, MdShoppingCart, MdHowToReg, MdInventory, MdMenu } from "react-icons/md";
import { useOrderContext } from "../../context/OrderContext";
import "./MobileTabBar.css";

const TABS = [
  { to: "/dashboard", label: "Home", icon: MdDashboard },
  { to: "/orders", label: "Orders", icon: MdShoppingCart, badgeKey: "processing" },
  { to: "/course-registrations", label: "Enrolments", icon: MdHowToReg, badgeKey: "registrations" },
  { to: "/products", label: "Products", icon: MdInventory },
];

/** Phone-only bottom bar for the pages staff open most. */
const MobileTabBar = ({ onOpenMenu }) => {
  const { pathname } = useLocation();
  const { statusSummary } = useOrderContext();
  const [registrations, setRegistrations] = useState(() => window.__ztRegistrationCount || 0);

  useEffect(() => {
    const onCount = (e) => setRegistrations(e.detail || 0);
    window.addEventListener("registrations:count", onCount);
    return () => window.removeEventListener("registrations:count", onCount);
  }, []);

  const badges = { processing: statusSummary?.processing || 0, registrations };

  return (
    <nav className="mobile-tabbar no-print" aria-label="Quick navigation">
      {TABS.map(({ to, label, icon: Icon, badgeKey }) => {
        const count = badgeKey ? badges[badgeKey] : 0;
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <NavLink key={to} to={to} className={`mobile-tab ${active ? "active" : ""}`}>
            <span className="mobile-tab-icon">
              <Icon size={22} />
              {count > 0 && <span className="mobile-tab-badge">{count > 99 ? "99+" : count}</span>}
            </span>
            {label}
          </NavLink>
        );
      })}
      <button type="button" className="mobile-tab" onClick={onOpenMenu}>
        <span className="mobile-tab-icon">
          <MdMenu size={22} />
        </span>
        Menu
      </button>
    </nav>
  );
};

export default MobileTabBar;
