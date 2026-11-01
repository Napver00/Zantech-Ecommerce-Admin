import React from "react";
import { useSearchParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";
import CourseEditor from "./CourseEditor";

const AddCourse = () => {
  const [searchParams] = useSearchParams();
  const kind = searchParams.get("kind") === "bootcamp" ? "bootcamp" : "course";
  usePageTitle(kind === "bootcamp" ? "New Bootcamp" : "New Course");

  return <CourseEditor initialKind={kind} />;
};

export default AddCourse;
