import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MdLockOutline } from "react-icons/md";
import useRole from "../hooks/useRole";
import { canOpen, homeFor, roleLabel } from "../config/access";

/** Shown instead of a page this staff member's role can't open. */
const NoAccess = () => {
  const role = useRole();
  return (
    <div className="empty-state" style={{ minHeight: "50vh", justifyContent: "center" }}>
      <span className="empty-state-icon"><MdLockOutline size={26} /></span>
      <p className="empty-state-title">This page isn't part of your role</p>
      <p className="empty-state-text">
        You're signed in as <strong>{roleLabel(role)}</strong>. Ask an admin if you need access.
      </p>
      <Link className="btn btn-primary btn-sm" to={homeFor(role)}>Go to your start page</Link>
    </div>
  );
};

/** Renders the page only when the signed-in role may open the current URL. */
export const AccessGate = ({ children }) => {
  const role = useRole();
  const { pathname, search } = useLocation();
  return canOpen(role, pathname, search) ? children : <NoAccess />;
};

export default NoAccess;
