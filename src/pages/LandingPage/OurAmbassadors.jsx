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
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { FaPlus, FaTrash, FaEdit, FaUniversity } from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import "./OurAmbassadors.css";

const OurAmbassadors = () => {
  usePageTitle("Our Ambassadors");
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAmbassador, setCurrentAmbassador] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    campus: "",
    bio: "",
    status: "0",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const fetchAmbassadors = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/ourambassadors");
      if (response.data.success) {
        setAmbassadors(response.data.data);
      } else {
        toast.error("Failed to fetch ambassadors.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching ambassadors.");
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

  const resetModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentAmbassador(null);
    setFormData({ name: "", campus: "", bio: "", status: "0", image: null });
    setImagePreview(null);
  };

  const handleShowAddModal = () => {
    resetModal();
    setIsEditing(false);
    setShowModal(true);
  };

  const handleShowEditModal = (ambassador) => {
    setIsEditing(true);
    setCurrentAmbassador(ambassador);
    setFormData({
      name: ambassador.name,
      campus: ambassador.campus,
      bio: ambassador.bio,
      status: ambassador.status,
      image: null,
    });
    setImagePreview(ambassador.image_url);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("campus", formData.campus);
    data.append("bio", formData.bio);
    if (formData.image) {
      data.append("image", formData.image);
    }

    let url = "/ourambassadors";
    if (isEditing) {
      url = `/ourambassadors/${currentAmbassador.id}`;
      data.append("status", formData.status);
    }

    try {
      const response = await axiosInstance.post(url, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(
          `Ambassador ${isEditing ? "updated" : "created"} successfully!`
        );
        fetchAmbassadors();
        resetModal();
      } else {
        toast.error(`Failed to ${isEditing ? "update" : "create"} ambassador.`);
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${
          isEditing ? "updating" : "creating"
        } the ambassador.`
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ambassador?")) {
      try {
        const response = await axiosInstance.delete(`/ourambassadors/${id}`);
        if (response.data.success) {
          toast.success("Ambassador deleted successfully!");
          fetchAmbassadors();
        } else {
          toast.error("Failed to delete ambassador.");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the ambassador.");
      }
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
        <Card.Header className="bg-white d-flex justify-content-between align-items-center border-bottom pt-4 px-4 pb-3">
          <div>
            <h4 className="mb-1 text-primary fw-bold">Our Ambassadors</h4>
            <p className="text-muted small mb-0">
              Showcase your active campus ambassadors
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleShowAddModal}
            className="shadow-sm px-4"
          >
            <FaPlus className="me-2" /> Add Ambassador
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          <Row xs={1} md={2} lg={4} className="g-4">
            {ambassadors.map((ambassador) => (
              <Col key={ambassador.id}>
                <Card className="h-100 shadow-sm ambassador-card border-0 hover-lift">
                  <div className="ambassador-card-image-container rounded-top overflow-hidden position-relative">
                    <Card.Img
                      variant="top"
                      src={ambassador.image_url}
                      className="ambassador-card-img"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="overlay d-flex justify-content-center align-items-center gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        className="rounded-circle p-2"
                        onClick={() => handleShowEditModal(ambassador)}
                      >
                        <FaEdit className="text-primary" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="rounded-circle p-2"
                        onClick={() => handleDelete(ambassador.id)}
                      >
                        <FaTrash className="text-danger" />
                      </Button>
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column p-3 text-center">
                    <Card.Title className="ambassador-name h6 fw-bold mb-1">
                      {ambassador.name}
                    </Card.Title>
                    <Card.Subtitle className="mb-3 text-muted small d-flex align-items-center justify-content-center">
                      <FaUniversity className="me-1" />
                      {ambassador.campus}
                    </Card.Subtitle>
                    <Card.Text className="ambassador-bio flex-grow-1 text-muted small fst-italic line-clamp-3">
                      "{ambassador.bio}"
                    </Card.Text>
                    <div className="mt-3">
                      <span
                        className={`badge rounded-pill bg-${
                          ambassador.status === "1"
                            ? "success"
                            : "light text-muted border"
                        } px-3 py-2`}
                      >
                        {ambassador.status === "1" ? "Active" : "Inactive"}
                      </span>
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
            {isEditing ? "Edit Ambassador" : "Add New Ambassador"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Campus</Form.Label>
              <Form.Control
                type="text"
                name="campus"
                value={formData.campus}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
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
            {isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={resetModal}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Update Ambassador" : "Create Ambassador"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default OurAmbassadors;
