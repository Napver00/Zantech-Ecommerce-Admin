import React from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import "./Landing.css";
import usePageTitle from "../../hooks/usePageTitle";

import AmbassadorApplication from "./AmbassadorApplication";
import OurAmbassadors from "./OurAmbassadors";
import Projects from "./Projects";
import CompanyInfo from "./CompanyInfo";

const LandingPage = () => {
  usePageTitle("Landing Page");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "application";

  const handleSelect = (key) => {
    setSearchParams({ tab: key });
  };

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h2 className="mb-1">Landing Page Management</h2>
        <p className="lead fs-6 mb-0">
          Manage your website's public facing content, projects, and ambassadors
          from one place.
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={handleSelect}
        id="landing-page-tabs"
        className="landing-tabs mb-4 border-0"
        fill
      >
        <Tab eventKey="application" title="Ambassador Application">
          <AmbassadorApplication />
        </Tab>
        <Tab eventKey="ambassadors" title="Our Ambassadors">
          <OurAmbassadors />
        </Tab>
        <Tab eventKey="projects" title="Projects">
          <Projects />
        </Tab>
        <Tab eventKey="company-info" title="Company Info">
          <CompanyInfo />
        </Tab>
      </Tabs>
    </div>
  );
};

export default LandingPage;
