import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, InputGroup, Button, Row, Col } from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Blog.css";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";

const Blog = () => {
  usePageTitle("Manage Blog");
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    search: "",
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchPosts();
      } finally {
        setPageLoading(false);
      }
    };

    if (pageLoading) {
      loadInitialData();
    } else {
      fetchPosts();
    }
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      fetchPosts();
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchPosts = async () => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        ...(searchParams.search && { title: searchParams.search }),
      };

      const response = await axiosInstance.get("/posts", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch posts");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      setPosts(Array.isArray(result.data) ? result.data : [result.data]);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error(error.response?.data?.message || "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        setTableLoading(true);
        await axiosInstance.delete(`/posts/${id}`);
        toast.success("Post deleted successfully");
        fetchPosts();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete post");
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/posts/status/${id}`);
      toast.success("Status updated successfully");
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const headers = [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "tags", label: "Tags", render: (row) => row.tags.join(", ") },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Button
          variant={row.status === "published" ? "success" : "danger"}
          size="sm"
          onClick={() => handleToggleStatus(row.id)}
        >
          {row.status}
        </Button>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  const renderActions = (post) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => navigate(`/blog/${post.slug}`)}
        disabled={tableLoading}
        title="Edit"
        className="view-btn"
      >
        <FaEdit />
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDeletePost(post.id)}
        disabled={tableLoading}
        title="Delete"
        className="delete-btn"
      >
        <FaTrash />
      </Button>
    </div>
  );

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="blog-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Blog Posts</h2>
              {loading && tableLoading ? (
                <div className="d-flex align-items-center">
                  <FaSpinner className="spinner-border spinner-border-sm me-2" />
                  <p className="page-subtitle mb-0">Loading posts...</p>
                </div>
              ) : (
                <p className="page-subtitle mb-0">
                  Showing {posts.length} posts
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/blog/add")}
              className="create-blog-btn"
            >
              <FaPlus className="me-2" /> Add Post
            </Button>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3 align-items-center">
              <Col md={4}>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <InputGroup className="search-box">
                    <InputGroup.Text className="search-icon">
                      {isSearching ? (
                        <FaSpinner className="spinner-border spinner-border-sm" />
                      ) : (
                        <FaSearch />
                      )}
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search posts..."
                      name="search"
                      value={searchParams.search}
                      onChange={handleSearch}
                      disabled={loading}
                      className={`search-input ${
                        isSearching ? "searching" : ""
                      }`}
                    />
                    {searchParams.search && !isSearching && (
                      <Button
                        variant="link"
                        className="clear-search"
                        onClick={() => {
                          setSearchParams((prev) => ({ ...prev, search: "" }));
                        }}
                        disabled={loading}
                      >
                        <FaTimes />
                      </Button>
                    )}
                  </InputGroup>
                </Form>
              </Col>
            </Row>
          </div>

          <CommonTable
            headers={headers}
            data={posts}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default Blog;
