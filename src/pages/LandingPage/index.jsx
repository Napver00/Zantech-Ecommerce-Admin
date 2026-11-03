import React from "react";
import { useSearchParams } from "react-router-dom";
import { FaProjectDiagram, FaGraduationCap, FaBuilding, FaCampground, FaExternalLinkAlt } from "react-icons/fa";
import { ListHeader } from "../../components/List/List";
import "../../components/List/List.css";
import "./Landing.css";
import usePageTitle from "../../hooks/usePageTitle";
import useRole from "../../hooks/useRole";
import { canUse, LANDING_TAB_AREAS } from "../../config/access";

import Projects from "./Projects";
import Courses from "./Courses";
import CompanyInfo from "./CompanyInfo";

const SECTIONS = [
  { key: "projects", label: "Projects", hint: "Portfolio", icon: FaProjectDiagram },
  { key: "courses", label: "Courses", hint: "Long-running classes", icon: FaGraduationCap },
  { key: "bootcamps", label: "Bootcamps", hint: "Short, dated events", icon: FaCampground },
  { key: "company-info", label: "Company info", hint: "Homepage text and contact", icon: FaBuilding },
];

const LandingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useRole();
  // Only the sections this role works on (a course manager sees courses and bootcamps).
  const sections = SECTIONS.filter((s) => canUse(role, LANDING_TAB_AREAS[s.key]));
  const asked = searchParams.get("tab");
  const active = sections.some((s) => s.key === asked) ? asked : sections[0]?.key;
  usePageTitle(`${sections.find((s) => s.key === active)?.label || "Website"} · Website`);

  return (
    <div className="lp-page">
      <ListHeader
        title="Website"
        subtitle="What visitors see on zantechbd.com. Changes here show on the site straight away."
        actions={
          <a className="btn btn-outline-secondary" href="https://zantechbd.com" target="_blank" rel="noreferrer">
            <FaExternalLinkAlt className="me-2" aria-hidden="true" />Open website
          </a>
        }
      />

      {sections.length > 1 && (
      <nav className="lp-sections" aria-label="Website sections">
        {sections.map(({ key, label, hint, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`lp-section ${active === key ? "is-active" : ""}`}
            aria-current={active === key ? "page" : undefined}
            // Switching sections unmounts the current one, so unsaved company details get the same "Leave?" check as a link.
            data-leaves-page={active === key ? undefined : ""}
            onClick={() => setSearchParams({ tab: key })}
          >
            <Icon aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
          </button>
        ))}
      </nav>
      )}

      {active === "projects" && <Projects />}
      {active === "courses" && <Courses key="course" />}
      {active === "bootcamps" && <Courses key="bootcamp" kind="bootcamp" />}
      {active === "company-info" && <CompanyInfo />}
    </div>
  );
};

export default LandingPage;
