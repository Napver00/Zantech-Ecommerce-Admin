import React from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import { FaProjectDiagram, FaGraduationCap, FaBuilding } from "react-icons/fa";
import "./Landing.css";
import usePageTitle from "../../hooks/usePageTitle";

import Projects from "./Projects";
import Courses from "./Courses";
import CompanyInfo from "./CompanyInfo";

const LandingPage = () => {
  usePageTitle("Landing Page");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const handleSelect = (key) => {
    setSearchParams({ tab: key });
  };

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h2 className="mb-1">Landing Page Management</h2>
        <p className="lead fs-6 mb-0">
          Manage your website's public facing content, projects, and courses
          from one place.
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={handleSelect}
        id="landing-page-tabs"
        className="landing-tabs mb-4 border-0"
      >
        <Tab
          eventKey="projects"
          title={
            <span className="landing-tab-title">
              <FaProjectDiagram className="me-2" /> Projects
            </span>
          }
        >
          <Projects />
        </Tab>
        <Tab
          eventKey="courses"
          title={
            <span className="landing-tab-title">
              <FaGraduationCap className="me-2" /> Courses
            </span>
          }
        >
          <Courses />
        </Tab>
        <Tab
          eventKey="company-info"
          title={
            <span className="landing-tab-title">
              <FaBuilding className="me-2" /> Company Info
            </span>
          }
        >
          <CompanyInfo />
        </Tab>
      </Tabs>
    </div>
  );
};

export default LandingPage;
