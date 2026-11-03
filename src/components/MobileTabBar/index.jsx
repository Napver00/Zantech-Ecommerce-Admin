import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MdDashboard, MdShoppingCart, MdHowToReg, MdInventory, MdMenu, MdPeople, MdGroups, MdRequestQuote, MdArticle, MdWeb, MdAttachMoney, MdWorkspacePremium } from "react-icons/md";
import { useOrderContext } from "../../context/OrderContext";
import useRole from "../../hooks/useRole";
import "./MobileTabBar.css";

const ORDERS = { to: "/orders", label: "Orders", icon: MdShoppingCart, badgeKey: "processing" };
const PRODUCTS = { to: "/products", label: "Products", icon: MdInventory };
const ENROLMENTS = { to: "/course-registrations", label: "Enrolments", icon: MdHowToReg, badgeKey: "registrations" };

// The four pages each role opens most.
const TABS_BY_ROLE = {
  admin: [{ to: "/dashboard", label: "Home", icon: MdDashboard }, ORDERS, ENROLMENTS, PRODUCTS],
  stuff: [ORDERS, PRODUCTS, { to: "/customers", label: "Customers", icon: MdPeople }, { to: "/expenses", label: "Expenses", icon: MdAttachMoney }],
  course_manager: [
    ENROLMENTS,
    { to: "/students", label: "Students", icon: MdGroups },
    { to: "/course-invoices", label: "Invoices", icon: MdRequestQuote },
    { to: "/certificates", label: "Certificates", icon: MdWorkspacePremium },
  ],
  content_manager: [
    { to: "/blog", label: "Blog", icon: MdArticle },
    { to: "/landing", label: "Projects", icon: MdWeb },
  ],
};
TABS_BY_ROLE.member = TABS_BY_ROLE.stuff;
TABS_BY_ROLE.inventory_manager = [{ to: "/inventory", label: "Inventory", icon: MdInventory }];

/** Phone-only bottom bar for the pages staff open most. */
const MobileTabBar = ({ onOpenMenu }) => {
  const { pathname } = useLocation();
  const { statusSummary } = useOrderContext();
  const tabs = TABS_BY_ROLE[useRole()] || [];
  const [registrations, setRegistrations] = useState(() => window.__ztRegistrationCount || 0);

  useEffect(() => {
    const onCount = (e) => setRegistrations(e.detail || 0);
    window.addEventListener("registrations:count", onCount);
    return () => window.removeEventListener("registrations:count", onCount);
  }, []);

  const badges = { processing: statusSummary?.processing || 0, registrations };

  return (
    <nav className="mobile-tabbar no-print" aria-label="Quick navigation">
      {tabs.map(({ to, label, icon: Icon, badgeKey }) => {
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
