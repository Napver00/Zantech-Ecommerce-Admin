import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft, FaPlus, FaTimes } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Badge,
} from "react-bootstrap";
import JoditEditor from "jodit-react";
import usePageTitle from "../../hooks/usePageTitle";
import Loading from "../../components/Loading";

const ViewProject = () => {
  const { slug } = useParams();
  usePageTitle(`Edit Project`);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longdescription: "",
    image: null,
    technologies: [],
  });
  const [techInput, setTechInput] = useState("");
  const editorRef = useRef(null);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing the long description...",
      height: 400,
    }),
    []
  );

  const fetchProject = async () => {
    try {
      const response = await axiosInstance.get(`/projects/${slug}`);
      const projectData = response.data.data;
      setProject(projectData);
      setFormData({
        title: projectData.title || "",
        description: projectData.description || "",
        longdescription: projectData.longdescription || "",
        technologies: projectData.technologies.map((t) => t.name) || [],
        image: null,
      });
    } catch (error) {
      toast.error("Failed to fetch project details");
    }
  };

  useEffect(() => {
    fetchProject();
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
      image: e.target.files[0],
    }));
  };

  const handleEditorChange = (newContent) => {
    setFormData((prev) => ({
      ...prev,
      longdescription: newContent,
    }));
  };

  const handleAddTechnology = async () => {
    if (!techInput.trim()) return;
    try {
      const response = await axiosInstance.post(
        `/projects/technologie/${project.id}`,
        {
          name: techInput,
        }
      );
      if (response.data.success) {
        toast.success("Technology added");
        setTechInput("");
        fetchProject();
      } else {
        toast.error("Failed to add technology");
      }
    } catch (error) {
      toast.error("Error adding technology");
    }
  };

  const handleDeleteTechnology = async (techId) => {
    try {
      const response = await axiosInstance.delete(
        `/projects/technologie/${techId}`
      );
      if (response.data.success) {
        toast.success("Technology deleted");
        fetchProject();
      } else {
        toast.error("Failed to delete technology");
      }
    } catch (error) {
      toast.error("Error deleting technology");
    }
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
    projectData.append("_method", "POST"); // Since the API uses POST for update

    try {
      await axiosInstance.post(`/projects/${project.id}`, projectData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Project updated successfully");
      navigate("/landing?tab=projects");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  if (!project) return <Loading />;

  return (
    <div className="add-project-container">
      <div className="add-project-header">
        <h2>Edit Project</h2>
        <p className="text-muted">Update the details of the project</p>
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
                  <Form.Label>Technologies</Form.Label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {project.technologies.map((tech) => (
                      <Badge
                        key={tech.id}
                        pill
                        bg="secondary"
                        className="d-flex align-items-center"
                      >
                        {tech.name}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-white p-0 ms-2"
                          onClick={() => handleDeleteTechnology(tech.id)}
                        >
                          <FaTimes />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Add new technology"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={handleAddTechnology}
                    >
                      <FaPlus />
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Image</Form.Label>
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
          <Button
            variant="light"
            onClick={() => navigate("/landing?tab=projects")}
          >
            <FaArrowLeft className="me-2" /> Back to Landing Page
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              "Updating..."
            ) : (
              <>
                <FaSave /> Update Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ViewProject;
