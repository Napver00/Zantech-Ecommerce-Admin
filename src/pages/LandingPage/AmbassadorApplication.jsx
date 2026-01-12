import React, { useState, useEffect } from "react";
import { Card, Button, Spinner, Image, Modal } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { FaTrash, FaEye } from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";

const AmbassadorApplication = () => {
  usePageTitle("Ambassador Applications");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/ambassadors");
      if (response.data.success) {
        setApplications(response.data.data);
      } else {
        toast.error("Failed to fetch applications.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        const response = await axiosInstance.delete(`/ambassadors/${id}`);
        if (response.data.success) {
          toast.success("Application deleted successfully!");
          fetchApplications();
        } else {
          toast.error("Failed to delete application.");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the application.");
      }
    }
  };

  const handleImagePreview = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleMessagePreview = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const headers = [
    { key: "id", label: "ID" },
    {
      key: "image",
      label: "Image",
      render: (app) => (
        <Image
          src={app.image}
          alt={app.name}
          thumbnail
          style={{ width: "60px", height: "60px", cursor: "pointer" }}
          onClick={() => handleImagePreview(app.image)}
        />
      ),
    },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "campus", label: "Campus" },
    {
      key: "status",
      label: "Status",
      render: (app) => (
        <span
          className={`badge bg-${app.status === "0" ? "warning" : "success"}`}
        >
          {app.status === "0" ? "Pending" : "Approved"}
        </span>
      ),
    },
    {
      key: "message",
      label: "Message",
      render: (app) => (
        <Button
          variant="link"
          onClick={() => handleMessagePreview(app.message)}
        >
          <FaEye />
        </Button>
      ),
    },
    {
      key: "created_at",
      label: "Applied At",
      render: (app) => new Date(app.created_at).toLocaleDateString(),
    },
  ];

  const renderActions = (app) => (
    <Button
      variant="outline-danger"
      size="sm"
      onClick={() => handleDelete(app.id)}
    >
      <FaTrash />
    </Button>
  );

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
        <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-0">
          <h4 className="mb-1 text-primary fw-bold">Ambassador Applications</h4>
          <p className="text-muted small">
            Review and manage incoming ambassador program applications
          </p>
        </Card.Header>
        <Card.Body className="p-4">
          <CommonTable
            headers={headers}
            data={applications}
            tableLoading={loading}
            loading={loading}
            renderActions={renderActions}
          />
        </Card.Body>
      </Card>

      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Image src={selectedImage} fluid />
        </Modal.Body>
      </Modal>

      <Modal
        show={showMessageModal}
        onHide={() => setShowMessageModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{selectedMessage}</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AmbassadorApplication;
