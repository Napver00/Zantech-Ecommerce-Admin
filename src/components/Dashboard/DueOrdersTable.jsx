import React from "react";
import { Card, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const DueOrdersTable = ({ orders }) => {
  const navigate = useNavigate();

  const getStatusLabel = (status) => {
    const statusMap = {
      0: "Processing",
      1: "Completed",
      2: "On Hold",
      3: "Cancelled",
      4: "Refunded",
    };
    return statusMap[status] || "Unknown";
  };

  return (
    <Card className="modern-card h-100 border-0">
      <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
        <h5 className="mb-0 fw-bold text-dark">Orders with Due Amount</h5>
      </Card.Header>
      <Card.Body>
        <div className="due-orders-table-container">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Order Info</th>
                <th>Customer Info</th>
                <th>Payment Info (Total/Paid/Due)</th>
              </tr>
            </thead>
            <tbody>
              {orders && Array.isArray(orders) && orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => navigate(`/orders/${order.order_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div>
                        <strong>ID:</strong> {order.order_id}
                      </div>
                      <div>
                        <strong>Invoice:</strong> {order.invoice_code}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>Name:</strong> {order.user_name}
                      </div>
                      <div>
                        <strong>Phone:</strong> {order.user_phone}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>Status:</strong> {getStatusLabel(order.status)}
                      </div>
                      <div>
                        <strong>Total:</strong> ৳
                        {parseFloat(order.total_amount).toLocaleString()}
                      </div>
                      <div>
                        <strong>Paid:</strong> ৳
                        {parseFloat(order.paid_amount).toLocaleString()}
                      </div>
                      <div className="text-danger">
                        <strong>Due:</strong> ৳
                        {parseFloat(order.due_amount).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    No orders with a due amount found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DueOrdersTable;
