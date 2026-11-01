import React from "react";
import usePageTitle from "../../hooks/usePageTitle";
import PostEditor from "./PostEditor";
import "./Blog.css";

const AddPost = () => {
  usePageTitle("New Post");
  return <PostEditor />;
};

export default AddPost;
