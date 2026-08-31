import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaImage,
  FaNewspaper,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, InputGroup, Button, Row, Col, Pagination, Badge } from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Blog.css";
import usePageTitle from "../../hooks/usePageTitle";

const CATEGORY_VARIANT = {
  Blog: "primary",
  Tutorial: "info",
  workshop: "warning",
};

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchPosts(1);
      } finally {
        setPageLoading(false);
      }
    };

    if (pageLoading) {
      loadInitialData();
    } else {
      fetchPosts(page);
    }
  }, [page, limit]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      setPage(1);
      fetchPosts(1);
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchPosts = async (pageNum = page) => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        page: pageNum,
        limit,
        ...(searchParams.search && { title: searchParams.search }),
      };

      const response = await axiosInstance.get("/posts", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch posts");
      }

      const raw = Array.isArray(result.data) ? result.data : [result.data];
      setPosts(raw);
      setPagination(
        result.pagination || {
          total_rows: raw.length,
          current_page: pageNum,
          per_page: limit,
          total_pages: 1,
          has_more_pages: false,
        }
      );
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

  const handlePageChange = (p) => {
    if (p < 1 || (pagination && p > pagination.total_pages)) return;
    setPage(p);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleDeletePost = (id, title) => {
    toast(
      (t) => (
        <div className="delete-confirm-toast">
          <p className="mb-2">
            Delete <strong>{title}</strong>? This can't be undone.
          </p>
          <div className="d-flex gap-2 justify-content-end">
            <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  setTableLoading(true);
                  await axiosInstance.delete(`/posts/${id}`);
                  toast.success("Post deleted successfully");
                  fetchPosts(page);
                } catch (error) {
                  toast.error(error.response?.data?.message || "Failed to delete post");
                } finally {
                  setTableLoading(false);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const handleToggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/posts/status/${id}`);
      toast.success("Status updated successfully");
      fetchPosts(page);
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

  if (pageLoading) {
    return <Loading />;
  }

  const showEmptyState = !loading && posts.length === 0;

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
                  {pagination.total_rows} post{pagination.total_rows !== 1 ? "s" : ""} published on your blog
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
              {!showEmptyState && (
                <Col md={2} className="ms-auto">
                  <Form.Select value={limit} onChange={handleLimitChange} className="limit-select">
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </Form.Select>
                </Col>
              )}
            </Row>
          </div>

          {loading ? (
            <div className="blog-grid-loading">
              <Loading />
            </div>
          ) : showEmptyState ? (
            <div className="blog-empty-state">
              <div className="blog-empty-icon">
                <FaNewspaper />
              </div>
              <h5 className="mb-1">
                {searchParams.search ? "No posts match your search" : "No blog posts yet"}
              </h5>
              <p className="text-muted mb-4">
                {searchParams.search
                  ? "Try a different search term."
                  : "Write your first post to start filling up the blog."}
              </p>
              {!searchParams.search && (
                <Button variant="primary" onClick={() => navigate("/blog/add")}>
                  <FaPlus className="me-2" /> Write Your First Post
                </Button>
              )}
            </div>
          ) : (
            <Row className="g-4 blog-grid">
              {posts.map((post) => (
                <Col key={post.id} xs={12} sm={6} lg={4} xl={3}>
                  <div className="blog-card">
                    <div className="blog-card-img-wrap">
                      {post.thumbnail ? (
                        <img src={post.thumbnail} alt={post.title} className="blog-card-img" />
                      ) : (
                        <div className="blog-card-img-placeholder">
                          <FaImage />
                        </div>
                      )}
                      {post.category && (
                        <Badge bg={CATEGORY_VARIANT[post.category] || "secondary"} className="blog-category-badge">
                          {post.category}
                        </Badge>
                      )}
                    </div>

                    <div className="blog-card-body">
                      <h6 className="blog-card-title" title={post.title}>
                        {post.title}
                      </h6>

                      <div className="blog-card-meta">
                        <FaCalendarAlt className="me-1" />
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>

                      {post.tags?.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 blog-card-tags">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} bg="light" text="dark" className="border fw-normal">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge bg="light" text="muted" className="border fw-normal">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="blog-card-footer">
                      <button
                        type="button"
                        className={`blog-status-toggle ${
                          post.status === "published" ? "is-published" : "is-draft"
                        }`}
                        onClick={() => handleToggleStatus(post.id)}
                        title="Click to toggle status"
                      >
                        <span className="blog-status-dot" />
                        {post.status === "published" ? "Published" : "Draft"}
                      </button>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/blog/${post.slug}`)}
                          disabled={tableLoading}
                          title="Edit"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeletePost(post.id, post.title)}
                          disabled={tableLoading}
                          title="Delete"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination-container mt-4 d-flex justify-content-center">
              <Pagination className="modern-pagination">
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                />
                {[...Array(pagination.total_pages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === pagination.current_page}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.has_more_pages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Blog;
