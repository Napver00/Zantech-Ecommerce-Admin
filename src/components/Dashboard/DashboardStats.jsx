import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  FaShoppingCart,
  FaBox,
  FaMoneyBillWave,
  FaCalendarDay,
} from "react-icons/fa";

const StatCard = ({ icon, title, value, colorClass }) => (
  <Card className="modern-card text-center h-100 border-0">
    <Card.Body className="d-flex flex-column justify-content-center p-4">
      <div
        className={`dashboard-icon ${colorClass} mx-auto mb-3 shadow-sm`}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "12px",
          fontSize: "1.25rem",
          color: "#fff",
        }}
      >
        {icon}
      </div>
      <div>
        <h6
          className="text-muted fw-bold mb-1 text-uppercase small"
          style={{ letterSpacing: "0.05em" }}
        >
          {title}
        </h6>
        <h3 className="fw-bold text-dark mb-0">{value}</h3>
      </div>
    </Card.Body>
  </Card>
);

const DashboardStats = ({ data }) => {
  const stats = [
    {
      icon: <FaShoppingCart />,
      title: "Total Orders",
      value: data?.total_order_count ?? 0,
      colorClass: "total-orders",
    },
    {
      icon: <FaBox />,
      title: "New Orders",
      value: data?.new_order_count ?? 0,
      colorClass: "new-orders",
    },
    {
      icon: <FaMoneyBillWave />,
      title: "Total Sales",
      value: `৳${(data?.total_revenue ?? 0).toLocaleString()}`,
      colorClass: "revenue",
    },
    {
      icon: <FaCalendarDay />,
      title: "Today's Orders",
      value: data?.today_order_count ?? 0,
      colorClass: "today-orders",
    },
    {
      icon: <FaMoneyBillWave />,
      title: "Today's Sales",
      value: `৳${(data?.today_revenue ?? 0).toLocaleString()}`,
      colorClass: "today-revenue",
    },
  ];

  return (
    <Row xs={2} md={3} lg={5} className="g-3">
      {stats.map((stat, index) => (
        <Col key={index}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  );
};

export default DashboardStats;
