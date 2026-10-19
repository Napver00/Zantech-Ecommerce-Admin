import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdChevronRight, MdArrowBack } from "react-icons/md";
import { findActiveNav } from "../../config/navigation";
import "./PageTrail.css";

// Name for the last crumb when we're deeper than a nav page (/orders/42, /products/add…)
const subPageLabel = (pathname, base) => {
  const rest = pathname.slice(base.length).replace(/^\/+/, "");
  if (!rest) return null;
  if (rest === "add" || rest.endsWith("/add")) return "Add new";
  if (rest === "create") return "Create";
  if (rest === "custom-invoice") return "Custom invoice";
  return "Details";
};

/** "Section › Page › Details" trail with a Back button on sub-pages. */
const PageTrail = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const item = findActiveNav(pathname, search);
  if (!item || pathname === "/dashboard") return null;

  const base = item.path.split("?")[0];
  const sub = subPageLabel(pathname, base === "/landing" ? pathname.split("/").slice(0, 3).join("/") : base);
  const isSubPage = pathname !== base && !!sub;

  return (
    <div className="page-trail no-print">
      {isSubPage && (
        <button type="button" className="page-trail-back" onClick={() => navigate(-1)}>
          <MdArrowBack size={16} /> Back
        </button>
      )}
      <nav aria-label="Breadcrumb" className="page-trail-crumbs">
        <Link to="/dashboard">Home</Link>
        <MdChevronRight size={16} />
        <span>{item.section}</span>
        {item.parent && (
          <>
            <MdChevronRight size={16} />
            <span>{item.parent}</span>
          </>
        )}
        <MdChevronRight size={16} />
        {isSubPage ? <Link to={item.path}>{item.label}</Link> : <strong>{item.label}</strong>}
        {isSubPage && (
          <>
            <MdChevronRight size={16} />
            <strong>{sub}</strong>
          </>
        )}
      </nav>
    </div>
  );
};

export default PageTrail;
