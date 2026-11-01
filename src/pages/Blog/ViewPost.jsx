import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import PostEditor from "./PostEditor";
import "./Blog.css";

const ViewPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  usePageTitle(post?.title ? `${post.title} · Post` : "Edit Post");

  useEffect(() => {
    let alive = true;
    axiosInstance.get(`/posts/${slug}`)
      .then((res) => { if (alive) setPost(res.data.data); })
      .catch(() => {
        toast.error("Couldn't load this post");
        navigate("/blog");
      });
    return () => { alive = false; };
  }, [slug, navigate]);

  if (!post) return <Loading />;
  return <PostEditor key={post.id} post={post} />;
};

export default ViewPost;
