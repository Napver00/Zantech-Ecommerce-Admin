import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  FaShoppingCart,
  FaBox,
  FaMoneyBillWave,
  FaCalendarDay,
} from "react-icons/fa";

const StatCard = ({ icon, title, value, colorClass }) => (
  <Card className="modern-card h-100 border-0">
    <Card.Body className="d-flex align-items-center gap-3 p-3">
      <div
        className={`dashboard-icon ${colorClass} flex-shrink-0 shadow-sm`}
        style={{ width: 46, height: 46, borderRadius: 12, fontSize: "1.2rem", color: "#fff" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-muted fw-semibold mb-1 text-uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.05em", lineHeight: 1 }}>
          {title}
        </p>
        <h4 className="fw-bold text-dark mb-0" style={{ fontSize: "1.25rem", lineHeight: 1.2 }}>{value}</h4>
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
    <Row xs={1} sm={2} lg={3} xl={5} className="g-3">
      {stats.map((stat, index) => (
        <Col key={index}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  );
};

export default DashboardStats;
