import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaBox } from 'react-icons/fa';

const OrderInformation = ({ order, coupon }) => {
  const getStatusLabel = (status) => {
    const statusMap = {
      "0": "Processing",
      "1": "Completed",
      "2": "On Hold",
      "3": "Cancelled",
      "4": "Refunded",
    };
    return statusMap[status?.toString()] || "Unknown";
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "0": { label: "Processing", variant: "info" },
      "1": { label: "Completed", variant: "success" },
      "2": { label: "On Hold", variant: "secondary" },
      "3": { label: "Cancelled", variant: "danger" },
      "4": { label: "Refunded", variant: "danger" },
    };

    const statusStr = status?.toString();
    const { label, variant } = statusMap[statusStr] || {
      label: "Unknown",
      variant: "secondary",
    };
    return <span className={`badge bg-${variant}`}>{label}</span>;
  };

  return (
    <Card className="modern-card mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0 d-flex align-items-center">
          <FaBox className="me-2" /> Order Information
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong className="text-muted">Invoice Code:</strong>
              <div className="fw-medium">{order.invoice_code}</div>
            </div>
            <div className="mb-3">
              <strong className="text-muted">Status:</strong>
              <div>{getStatusBadge(order.status)}</div>
            </div>
            <div className="mb-3">
              <strong className="text-muted">Order Date:</strong>
              <div className="fw-medium">
                {new Date(order.created_at).toLocaleString()}
              </div>
            </div>
            {order.status_change_desc && (
              <div className="mb-3">
                <strong className="text-muted">Status Change:</strong>
                <div className="text-muted small">
                  {order.status_change_desc}
                </div>
              </div>
            )}
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong className="text-muted">Item Subtotal:</strong>
              <div className="fw-medium">
                ৳{parseFloat(order.item_subtotal).toLocaleString()}
              </div>
            </div>
            <div className="mb-3">
              <strong className="text-muted">Shipping Charge:</strong>
              <div className="fw-medium">
                ৳{parseFloat(order.shipping_charge).toLocaleString()}
              </div>
            </div>
            {parseFloat(order.discount) > 0 && (
              <div className="mb-3">
                <strong className="text-muted">Discount:</strong>
                <div className="fw-medium text-danger">
                  -৳{parseFloat(order.discount).toLocaleString()}
                  {coupon && ` (${coupon.code})`}
                </div>
              </div>
            )}
            <div className="mb-3">
              <strong className="text-muted">Total Amount:</strong>
              <div className="fw-bold fs-5">
                ৳{parseFloat(order.total_amount).toLocaleString()}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default OrderInformation;