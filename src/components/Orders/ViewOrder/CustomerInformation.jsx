import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { FaUser, FaEdit } from 'react-icons/fa';

const CustomerInformation = ({ user, shipping_address, order, setShowEditAddressModal }) => {
  const getCustomerName = () => {
    if (user?.name) return user.name;
    if (order.user_name) return order.user_name;
    return 'N/A';
  };

  const getCustomerPhone = () => {
    if (user?.phone) return user.phone;
    if (order.user_phone) return order.user_phone;
    return 'N/A';
  };

  const getCustomerAddress = () => {
    if (user?.address) return user.address;
    if (order.address) return order.address;
    return 'N/A';
  };

  return (
    <Card className="modern-card mb-4">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0 d-flex align-items-center">
          <FaUser className="me-2" /> Customer Information
        </h5>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setShowEditAddressModal(true)}
        >
          <FaEdit />
        </Button>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong className="text-muted">Name:</strong>
              <div className="fw-medium">{getCustomerName()}</div>
            </div>
            {user?.email && (
              <div className="mb-3">
                <strong className="text-muted">Email:</strong>
                <div className="fw-medium">{user.email}</div>
              </div>
            )}
            <div className="mb-3">
              <strong className="text-muted">Phone:</strong>
              <div className="fw-medium">{getCustomerPhone()}</div>
            </div>
            <div>
              <strong className="text-muted">Address:</strong>
              <div className="fw-medium">{getCustomerAddress()}</div>
            </div>
          </Col>
          <Col md={6}>
            <h6 className="mb-3 fw-medium">Shipping Address</h6>
            {shipping_address ? (
              <>
                <div className="mb-3">
                  <strong className="text-muted">Name:</strong>
                  <div className="fw-medium">
                    {shipping_address.f_name} {shipping_address.l_name}
                  </div>
                </div>
                <div className="mb-3">
                  <strong className="text-muted">Phone:</strong>
                  <div className="fw-medium">{shipping_address.phone}</div>
                </div>
                <div className="mb-3">
                  <strong className="text-muted">Address:</strong>
                  <div className="fw-medium">{shipping_address.address}</div>
                </div>
                <div className="mb-3">
                  <strong className="text-muted">City:</strong>
                  <div className="fw-medium">{shipping_address.city}</div>
                </div>
                <div>
                  <strong className="text-muted">ZIP:</strong>
                  <div className="fw-medium">{shipping_address.zip}</div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <strong className="text-muted">Name:</strong>
                  <div className="fw-medium">{getCustomerName()}</div>
                </div>
                <div className="mb-3">
                  <strong className="text-muted">Phone:</strong>
                  <div className="fw-medium">{getCustomerPhone()}</div>
                </div>
                <div className="mb-3">
                  <strong className="text-muted">Address:</strong>
                  <div className="fw-medium">{getCustomerAddress()}</div>
                </div>
              </>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CustomerInformation;