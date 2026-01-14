import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import { Row, Col, Card, Form, Button, Image } from "react-bootstrap";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";

const ViewCourse = () => {
  usePageTitle("Edit Course");
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Course",
    tags: [],
    thumbnail: null,
    reg_link: "",
    reg_status: "",
    serial: "",
  });
  const editorRef = useRef(null);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing the course content...",
      height: 400,
    }),
    []
  );

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axiosInstance.get(`/posts/${slug}`);
        const postData = response.data.data;
        setPost(postData);
        setFormData({
          title: postData.title || "",
          content: postData.content || "",
          category: postData.category || "Course",
          tags: postData.tags || [],
          thumbnail: null,
          reg_link: postData.reg_link || "",
          reg_status: parseInt(postData.reg_status) || 0,
          serial: postData.serial || "",
        });
      } catch (error) {
        toast.error("Failed to fetch course details");
      }
    };
    fetchPost();
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail: e.target.files[0],
    }));
  };

  const handleEditorChange = (newContent) => {
    setFormData((prev) => ({
      ...prev,
      content: newContent,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("content", formData.content);
    postData.append("category", "Course"); // Force category to remain Course
    postData.append("reg_link", formData.reg_link);
    if (formData.reg_status !== null) {
      postData.append("reg_status", formData.reg_status);
    }
    if (formData.serial !== "" && formData.serial !== null) {
      postData.append("serial", formData.serial);
    }
    formData.tags.forEach((tag) => postData.append("tags[]", tag));
    if (formData.thumbnail) {
      postData.append("thumbnail", formData.thumbnail);
    }

    // Meta fields removed as per request
    // postData.append("meta_title", formData.meta_title);
    // postData.append("meta_description", formData.meta_description);

    postData.append("_method", "PUT");

    try {
      await axiosInstance.post(`/posts/${post.id}`, postData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Course updated successfully");
      // navigate("/landing?tab=courses"); // Removed as per user request to stay on page
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update course");
    } finally {
      setLoading(false);
    }
  };

  if (!post) return <Loading />;

  return (
    <div className="add-blog-container">
      <div className="add-blog-header">
        <h2>Edit Course</h2>
        <p className="text-muted">Update the details of the course</p>
      </div>
      <form onSubmit={handleSubmit} className="add-blog-form">
        <Row>
          <Col lg={12}>
            <Card className="border mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Course Details</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Control
                        type="text"
                        name="category"
                        value={formData.category}
                        readOnly
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Registration Link</Form.Label>
                      <Form.Control
                        type="text"
                        name="reg_link"
                        value={formData.reg_link}
                        onChange={handleInputChange}
                        placeholder="Enter registration link"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reg Status</Form.Label>
                      <Form.Check
                        type="switch"
                        id="reg-status-switch"
                        label={
                          formData.reg_status === 1 ? "Active" : "Inactive"
                        }
                        checked={formData.reg_status === 1}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            reg_status: e.target.checked ? 1 : 0,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Serial</Form.Label>
                      <Form.Control
                        type="number"
                        name="serial"
                        value={formData.serial}
                        onChange={handleInputChange}
                        placeholder="Sort order"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Tags (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags.join(",")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim()),
                      }))
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Thumbnail</Form.Label>
                  <Form.Control
                    type="file"
                    name="thumbnail"
                    onChange={handleFileChange}
                  />
                  {post.thumbnail_url && (
                    <div className="mt-3">
                      <Image src={post.thumbnail_url} thumbnail width={200} />
                    </div>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <JoditEditor
                    ref={editorRef}
                    value={formData.content}
                    config={editorConfig}
                    onBlur={handleEditorChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <div className="form-actions">
          <Button
            variant="light"
            onClick={() => navigate("/landing?tab=courses")}
          >
            <FaArrowLeft className="me-2" /> Back to Courses
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              "Updating..."
            ) : (
              <>
                <FaSave /> Update Course
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ViewCourse;
