import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";
import "./Projects.css";

const AddProject = () => {
  usePageTitle("Add New Project");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longdescription: "",
    image: null,
    technologies: [],
  });
  const editorRef = useRef(null);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing the long description...",
      height: 400,
    }),
    []
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
      image: e.target.files[0],
    }));
  };

  const handleEditorChange = (newContent) => {
    setFormData((prev) => ({
      ...prev,
      longdescription: newContent,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const projectData = new FormData();
    projectData.append("title", formData.title);
    projectData.append("description", formData.description);
    projectData.append("longdescription", formData.longdescription);
    if (formData.image) {
      projectData.append("image", formData.image);
    }
    formData.technologies.forEach((tech) =>
      projectData.append("technologies[]", tech)
    );

    try {
      await axiosInstance.post("/projects", projectData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Project added successfully");
      navigate("/landing?tab=projects");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-project-container">
      <div className="add-project-header">
        <h2>Add New Project</h2>
        <p className="text-muted">Create a new project for the landing page</p>
      </div>

      <form onSubmit={handleSubmit} className="add-project-form">
        <Row>
          <Col lg={12}>
            <Card className="border mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Project Details</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter project title"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Short Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter a brief project description"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Long Description</Form.Label>
                  <JoditEditor
                    ref={editorRef}
                    value={formData.longdescription}
                    config={editorConfig}
                    tabIndex={1}
                    onBlur={handleEditorChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Technologies (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="technologies"
                    value={formData.technologies}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        technologies: e.target.value.split(","),
                      }))
                    }
                    placeholder="e.g., React,Node.js,MySQL"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Image</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    onChange={handleFileChange}
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
            onClick={() => navigate("/landing?tab=projects")}
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
                <FaSave /> Save Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
