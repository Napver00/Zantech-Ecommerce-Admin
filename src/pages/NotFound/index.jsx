import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/zantechInvoiceLogo.png";
import "./NotFound.css";
import usePageTitle from '../../hooks/usePageTitle';

const NotFound = () => {
    usePageTitle('Page Not Found');
  return (
    <div className="not-found-container">
      <div className="not-found-box">
        <img src={logo} alt="ZanTech Logo" className="not-found-logo" />
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-text">
          Sorry, the page you are looking for does not exist. It might have been
          moved or deleted.
        </p>
        <Link to="/dashboard" className="btn btn-primary not-found-button">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
