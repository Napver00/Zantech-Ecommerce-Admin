import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import Loading from "../../components/Loading";
import ProjectEditor from "./ProjectEditor";

const ViewProject = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  usePageTitle(project?.title || "Edit Project");

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get(`/projects/${slug}`)
      .then((res) => !cancelled && setProject(res.data.data))
      .catch(() => {
        toast.error("Couldn't find that project");
        navigate("/landing?tab=projects");
      });
    return () => { cancelled = true; };
  }, [slug, navigate]);

  if (!project) return <Loading />;
  // Keyed by id: a rename changes the address but keeps the same editor open.
  return <ProjectEditor key={project.id} project={project} />;
};

export default ViewProject;
