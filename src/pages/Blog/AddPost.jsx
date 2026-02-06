import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaPlus, FaTrash } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";
import "./Blog.css";

const AddPost = () => {
  usePageTitle("Add New Post");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Blog",
    tags: [],
    thumbnail: null,
    teachers: [],
  });
  const [ambassadors, setAmbassadors] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherSerial, setTeacherSerial] = useState(1);
  const [teacherStatus, setTeacherStatus] = useState(1);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const fetchAmbassadors = async () => {
    try {
      const response = await axiosInstance.get("/ourambassadors");
      if (response.data.success) {
        setAmbassadors(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch ambassadors", error);
    }
  };

  const handleAddTeacher = () => {
    if (!selectedTeacherId) {
      toast.error("Please select an ambassador");
      return;
    }

    const ambassador = ambassadors.find(
      (a) => a.id === parseInt(selectedTeacherId),
    );
    if (!ambassador) return;

    const newTeacher = {
      ourambassadors_id: ambassador.id,
      name: ambassador.name, // For display
      serial: teacherSerial,
      status: teacherStatus,
    };

    // Check if already added
    if (
      formData.teachers.some(
        (t) => t.ourambassadors_id === newTeacher.ourambassadors_id,
      )
    ) {
      toast.error("This teacher is already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      teachers: [...prev.teachers, newTeacher].sort(
        (a, b) => a.serial - b.serial,
      ),
    }));

    // Reset fields
    setSelectedTeacherId("");
    setTeacherSerial((prev) => prev + 1);
    setTeacherStatus(1);
  };

  const handleRemoveTeacher = (id) => {
    setFormData((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.ourambassadors_id !== id),
    }));
  };

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing the post content...",
      height: 400,
    }),
    [],
  );

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
    postData.append("category", formData.category);
    formData.tags.forEach((tag) => postData.append("tags[]", tag));
    if (formData.thumbnail) {
      postData.append("thumbnail", formData.thumbnail);
    }

    if (formData.category === "Course" && formData.teachers.length > 0) {
      formData.teachers.forEach((teacher, index) => {
        postData.append(
          `teachers[${index}][ourambassadors_id]`,
          teacher.ourambassadors_id,
        );
        postData.append(`teachers[${index}][serial]`, teacher.serial);
        postData.append(`teachers[${index}][status]`, teacher.status);
      });
    }

    try {
      await axiosInstance.post("/posts", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Post added successfully");
      navigate("/blog");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-blog-container">
      <div className="add-blog-header">
        <h2>Add New Post</h2>
        <p className="text-muted">Create a new blog post</p>
      </div>

      <form onSubmit={handleSubmit} className="add-blog-form">
        <Row>
          <Col lg={12}>
            <Card className="border mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Post Details</h5>
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
                        placeholder="Enter post title"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="Blog">Blog</option>
                        <option value="Tutorial">Tutorial</option>
                        <option value="workshop">workshop</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Tags (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: e.target.value.split(","),
                      }))
                    }
                    placeholder="Enter tags"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Thumbnail</Form.Label>
                  <Form.Control
                    type="file"
                    name="thumbnail"
                    onChange={handleFileChange}
                  />
                </Form.Group>

                {formData.category === "Course" && (
                  <div className="mb-3 border p-3 rounded">
                    <h6 className="mb-3">Course Instructors</h6>
                    <Row className="g-2 items-end mb-3 align-items-end">
                      <Col md={5}>
                        <Form.Label>Select Ambassador</Form.Label>
                        <Form.Select
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                        >
                          <option value="">Select Ambassador...</option>
                          {ambassadors.map((ambassador) => (
                            <option key={ambassador.id} value={ambassador.id}>
                              {ambassador.name} ({ambassador.campus})
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label>Serial</Form.Label>
                        <Form.Control
                          type="number"
                          value={teacherSerial}
                          onChange={(e) =>
                            setTeacherSerial(parseInt(e.target.value) || 0)
                          }
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={teacherStatus}
                          onChange={(e) =>
                            setTeacherStatus(parseInt(e.target.value))
                          }
                        >
                          <option value={1}>Active</option>
                          <option value={0}>Inactive</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Button
                          variant="secondary"
                          onClick={handleAddTeacher}
                          className="w-100"
                        >
                          <FaPlus /> Add
                        </Button>
                      </Col>
                    </Row>

                    {formData.teachers.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead>
                            <tr>
                              <th>Serial</th>
                              <th>Name</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.teachers.map((teacher) => (
                              <tr key={teacher.ourambassadors_id}>
                                <td>{teacher.serial}</td>
                                <td>{teacher.name}</td>
                                <td>
                                  <span
                                    className={`badge bg-${teacher.status === 1 ? "success" : "secondary"}`}
                                  >
                                    {teacher.status === 1
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </td>
                                <td>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveTeacher(
                                        teacher.ourambassadors_id,
                                      )
                                    }
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <JoditEditor
                    ref={editorRef}
                    value={formData.content}
                    config={editorConfig}
                    tabIndex={1}
                    onBlur={handleEditorChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate("/blog")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-with-icon"
            disabled={loading}
          >
            {loading ? (
              "Adding..."
            ) : (
              <>
                <FaSave /> Save Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPost;
