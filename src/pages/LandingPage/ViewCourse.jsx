import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft, FaTrash, FaPlus } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import { Row, Col, Card, Form, Button, Image } from "react-bootstrap";
import JoditEditor from "jodit-react";
import Select from "react-select";
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
  const [ambassadors, setAmbassadors] = useState([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState(null);
  const [teacherSerial, setTeacherSerial] = useState(1);
  const [teacherStatus, setTeacherStatus] = useState(1);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const editorRef = useRef(null);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing the course content...",
      height: 400,
    }),
    [],
  );

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

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const handleAddTeacher = async () => {
    if (!selectedAmbassador) {
      toast.error("Please select an ambassador");
      return;
    }

    setAddingTeacher(true);
    try {
      await axiosInstance.post("/posts/add-teacher", {
        post_id: post.id,
        ourambassadors_id: selectedAmbassador.value,
        serial: teacherSerial,
        status: teacherStatus,
      });
      toast.success("Teacher added successfully");
      fetchPost(); // Refresh post data to show new teacher
      setSelectedAmbassador(null);
      setTeacherSerial((prev) => prev + 1);
      setTeacherStatus(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add teacher");
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleRemoveTeacher = async (ambassadorId) => {
    if (!window.confirm("Are you sure you want to remove this teacher?"))
      return;

    try {
      await axiosInstance.delete("/posts/remove-teacher", {
        data: {
          post_id: post.id,
          ourambassadors_id: ambassadorId,
        },
      });
      toast.success("Teacher removed successfully");
      fetchPost(); // Refresh post to remove teacher from list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove teacher");
    }
  };

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

                <div className="mb-3 border p-3 rounded">
                  <h5 className="mb-3">Course Instructors</h5>

                  {/* Add Teacher Form */}
                  <div className="bg-light p-3 rounded mb-3">
                    <h6 className="mb-2">Add Instructor</h6>
                    <Row className="g-2 align-items-end">
                      <Col md={5}>
                        <Form.Label className="small">
                          Select Ambassador
                        </Form.Label>
                        <Select
                          value={selectedAmbassador}
                          onChange={setSelectedAmbassador}
                          options={ambassadors.map((amb) => ({
                            value: amb.id,
                            label: amb.name,
                            image: amb.image,
                            campus: amb.campus,
                          }))}
                          formatOptionLabel={(option) => (
                            <div className="d-flex align-items-center">
                              {option.image ? (
                                <Image
                                  src={`https://media.zantechbd.com/${option.image}`}
                                  roundedCircle
                                  width={30}
                                  height={30}
                                  className="me-2"
                                  style={{ objectFit: "cover" }}
                                />
                              ) : (
                                <div
                                  className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                                  style={{ width: 30, height: 30 }}
                                >
                                  {option.label.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="fw-bold">{option.label}</div>
                                <div
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {option.campus}
                                </div>
                              </div>
                            </div>
                          )}
                          placeholder="Select Ambassador..."
                          isSearchable
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label className="small">Serial</Form.Label>
                        <Form.Control
                          type="number"
                          value={teacherSerial}
                          onChange={(e) =>
                            setTeacherSerial(parseInt(e.target.value) || 0)
                          }
                          size="sm"
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small">Status</Form.Label>
                        <Form.Select
                          value={teacherStatus}
                          onChange={(e) =>
                            setTeacherStatus(parseInt(e.target.value))
                          }
                          size="sm"
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
                          size="sm"
                          disabled={addingTeacher}
                        >
                          {addingTeacher ? (
                            "Adding..."
                          ) : (
                            <>
                              <FaPlus /> Add
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </div>

                  {/* Teachers List */}
                  {post.teachers && post.teachers.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "60px" }}>Serial</th>
                            <th style={{ width: "60px" }}>Image</th>
                            <th>Name</th>
                            <th>Campus</th>
                            <th>Status</th>
                            <th style={{ width: "80px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {post.teachers
                            .sort((a, b) => a.serial - b.serial)
                            .map((teacher) => (
                              <tr key={teacher.id}>
                                <td className="align-middle text-center">
                                  {teacher.serial}
                                </td>
                                <td className="align-middle text-center">
                                  {teacher.ambassador?.image && (
                                    <Image
                                      src={`https://media.zantechbd.com/${teacher.ambassador.image}`}
                                      roundedCircle
                                      width={30}
                                      height={30}
                                      style={{ objectFit: "cover" }}
                                    />
                                  )}
                                </td>
                                <td className="align-middle">
                                  {teacher.ambassador?.name}
                                </td>
                                <td className="align-middle small text-muted">
                                  {teacher.ambassador?.campus}
                                </td>
                                <td className="align-middle">
                                  <span
                                    className={`badge bg-${teacher.status === "active" || teacher.status === 1 ? "success" : "secondary"}`}
                                  >
                                    {teacher.status === "active" ||
                                    teacher.status === 1
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </td>
                                <td className="align-middle text-center">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="py-0 px-2"
                                    onClick={() =>
                                      handleRemoveTeacher(
                                        teacher.ourambassadors_id,
                                      )
                                    }
                                    title="Remove from course"
                                  >
                                    <FaTrash size={12} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted text-center py-3 mb-0">
                      No instructors assigned to this course.
                    </p>
                  )}
                </div>
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
