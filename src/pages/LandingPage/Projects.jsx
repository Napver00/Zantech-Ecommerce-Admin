import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Image,
  Modal,
  Form,
  Badge,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { FaPlus, FaTrash, FaEdit, FaTag, FaTimes } from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import "./Projects.css";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  usePageTitle("Our Projects");
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    technologies: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [techInput, setTechInput] = useState("");
  const [technologies, setTechnologies] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data);
      } else {
        toast.error("Failed to fetch projects.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTechnologiesChange = (e) => {
    setFormData({ ...formData, technologies: e.target.value });
  };

  const resetModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentProject(null);
    setFormData({ title: "", description: "", image: null, technologies: "" });
    setImagePreview(null);
    setTechnologies([]);
    setTechInput("");
  };

  const handleShowAddModal = () => {
    navigate("/landing/projects/add");
  };

  const handleShowEditModal = (project) => {
    navigate(`/landing/projects/${project.slug}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);

    if (formData.image) {
      data.append("image", formData.image);
    }

    if (isEditing) {
      data.append("status", formData.status);
    } else {
      const techArray = formData.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      techArray.forEach((tech, index) => {
        data.append(`technologies[${index}]`, tech);
      });
    }

    const url = isEditing ? `/projects/${currentProject.id}` : "/projects";

    try {
      const response = await axiosInstance.post(url, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(
          `Project ${isEditing ? "updated" : "created"} successfully!`
        );
        fetchProjects();
        resetModal();
      } else {
        toast.error(`Failed to ${isEditing ? "update" : "create"} project.`);
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${
          isEditing ? "updating" : "creating"
        } the project.`
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await axiosInstance.delete(`/projects/${id}`);
        if (response.data.success) {
          toast.success("Project deleted successfully!");
          fetchProjects();
        } else {
          toast.error("Failed to delete project.");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the project.");
      }
    }
  };

  const handleAddTechnology = async () => {
    if (!techInput.trim() || !currentProject) return;
    try {
      const response = await axiosInstance.post(
        `/projects/technologie/${currentProject.id}`,
        {
          name: techInput,
        }
      );
      if (response.data.success) {
        toast.success("Technology added");
        setTechInput("");

        // Refetch the projects to update the list
        fetchProjects();

        // Update the current project in the modal
        const updatedProject = {
          ...currentProject,
          technologies: [...currentProject.technologies, response.data.data],
        };
        setCurrentProject(updatedProject);
        setTechnologies(updatedProject.technologies.map((t) => t.name));
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
        fetchProjects();
        const updatedTechnologies = currentProject.technologies.filter(
          (t) => t.id !== techId
        );
        const updatedProject = {
          ...currentProject,
          technologies: updatedTechnologies,
        };
        setCurrentProject(updatedProject);
        setTechnologies(updatedProject.technologies.map((t) => t.name));
      } else {
        toast.error("Failed to delete technology");
      }
    } catch (error) {
      toast.error("Error deleting technology");
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="tab-content-container">
      <Card className="modern-card border-0">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center border-bottom card-header-custom pt-4 px-4 pb-3">
          <div>
            <h4 className="mb-1 fw-bold text-primary">Our Projects</h4>
            <p className="text-muted small mb-0">
              Manage and showcase your portfolio projects
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleShowAddModal}
            className="shadow-sm px-4"
          >
            <FaPlus className="me-2" /> Add Project
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          <Row xs={1} md={2} lg={4} className="g-4">
            {projects.map((project) => (
              <Col key={project.id}>
                <Card className="h-100 shadow-sm project-card border-0 hover-lift">
                  <div className="project-card-image-container rounded-top overflow-hidden position-relative">
                    <Card.Img
                      variant="top"
                      src={project.image_url}
                      className="project-card-img"
                    />
                    <div className="overlay d-flex justify-content-center align-items-center gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        className="rounded-circle p-2"
                        onClick={() => handleShowEditModal(project)}
                      >
                        <FaEdit className="text-primary" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="rounded-circle p-2"
                        onClick={() => handleDelete(project.id)}
                      >
                        <FaTrash className="text-danger" />
                      </Button>
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title
                        className="project-name h6 fw-bold mb-0 text-truncate w-75"
                        title={project.title}
                      >
                        {project.title}
                      </Card.Title>
                      <span
                        className={`badge rounded-pill bg-${
                          project.status === "active"
                            ? "success"
                            : "light text-muted border"
                        }`}
                      >
                        {project.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Card.Text className="project-bio flex-grow-1 text-muted small lh-sm line-clamp-3 mb-3">
                      {project.description}
                    </Card.Text>
                    <div className="d-flex flex-wrap gap-1 mt-auto">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <Badge
                          key={tech.id}
                          bg="light"
                          text="dark"
                          className="me-1 border fw-normal"
                        >
                          {tech.name}
                        </Badge>
                      ))}
                      {project.technologies.length > 3 && (
                        <Badge
                          bg="light"
                          text="muted"
                          className="border fw-normal"
                        >
                          +{project.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={resetModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Edit Project" : "Add New Project"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
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
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <Form.Control
                type="file"
                name="image"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <Image
                  src={imagePreview}
                  thumbnail
                  className="mt-2"
                  style={{ maxHeight: "150px" }}
                />
              )}
            </Form.Group>
            {!isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Technologies (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleTechnologiesChange}
                />
              </Form.Group>
            )}
            {isEditing && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Technologies</Form.Label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {currentProject &&
                      currentProject.technologies.map((tech) => (
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
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={resetModal}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Update Project" : "Create Project"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
