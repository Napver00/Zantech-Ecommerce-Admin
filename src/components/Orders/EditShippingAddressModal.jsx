import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";

const EditShippingAddressModal = ({ show, onHide, orderData, onUpdate }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const isGuest = !orderData?.order?.user_id && !orderData?.order?.shipping_id;

  useEffect(() => {
    if (orderData) {
      if (isGuest) {
        setFormData({
          user_name: orderData.order.user_name || "",
          phone: orderData.order.user_phone || "",
          address: orderData.order.address || "",
        });
      } else if (orderData.shipping_address) {
        setFormData({
          f_name: orderData.shipping_address.f_name || "",
          l_name: orderData.shipping_address.l_name || "",
          phone: orderData.shipping_address.phone || "",
          address: orderData.shipping_address.address || "",
          city: orderData.shipping_address.city || "",
          zip: orderData.shipping_address.zip || "",
        });
      }
    }
  }, [orderData, isGuest]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isGuest) {
        response = await axiosInstance.put(
          `/orders/update-customer-info/${orderData.order.order_id}`,
          formData
        );
      } else {
        response = await axiosInstance.put(
          `/shipping-addresses/${orderData.order.shipping_id}`,
          formData
        );
      }

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
          {isGuest ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Guest Name</Form.Label>
                <Form.Control
                  type="text"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
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
                  as="textarea"
                  rows={3}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </>
          ) : (
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
              <Col md={12}>
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
              </Col>
              <Col md={12}>
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
              </Col>
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
          )}
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
