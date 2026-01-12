import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";

const EditShippingAddressModal = ({ show, onHide, address, onUpdate }) => {
  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        f_name: address.f_name || "",
        l_name: address.l_name || "",
        phone: address.phone || "",
        address: address.address || "",
        city: address.city || "",
        zip: address.zip || "",
      });
    }
  }, [address]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put(
        `/shipping-addresses/${address.id}`,
        formData
      );
      if (response.data.success) {
        toast.success("Shipping address updated successfully!");
        onUpdate(response.data.data);
        onHide();
      } else {
        throw new Error(
          response.data.message || "Failed to update shipping address"
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Shipping Address</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="f_name"
                  value={formData.f_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="l_name"
                  value={formData.l_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>ZIP Code</Form.Label>
                <Form.Control
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Address"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditShippingAddressModal;
