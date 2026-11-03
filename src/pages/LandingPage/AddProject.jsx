import React from "react";
import usePageTitle from "../../hooks/usePageTitle";
import ProjectEditor from "./ProjectEditor";

const AddProject = () => {
  usePageTitle("New Project");
  return <ProjectEditor />;
};

export default AddProject;
