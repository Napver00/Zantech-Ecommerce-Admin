import React from "react";
import { Row, Col } from "react-bootstrap";
import {
  FaShoppingCart,
  FaBox,
  FaMoneyBillWave,
  FaCalendarDay,
} from "react-icons/fa";

const StatCard = ({ icon, title, value, tone }) => (
  <div className={`stat-card stat-${tone}`}>
    <div className="stat-icon">{icon}</div>
    <div className="min-w-0">
      <p className="stat-label">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);

const DashboardStats = ({ data }) => {
  const stats = [
    {
      icon: <FaShoppingCart />,
      title: "Total Orders",
      value: (data?.total_order_count ?? 0).toLocaleString(),
      tone: "cyan",
    },
    {
      icon: <FaBox />,
      title: "New Orders",
      value: (data?.new_order_count ?? 0).toLocaleString(),
      tone: "red",
    },
    {
      icon: <FaMoneyBillWave />,
      title: "Total Sales",
      value: `৳${(data?.total_revenue ?? 0).toLocaleString()}`,
      tone: "green",
    },
    {
      icon: <FaCalendarDay />,
      title: "Today's Orders",
      value: (data?.today_order_count ?? 0).toLocaleString(),
      tone: "amber",
    },
    {
      icon: <FaMoneyBillWave />,
      title: "Today's Sales",
      value: `৳${(data?.today_revenue ?? 0).toLocaleString()}`,
      tone: "navy",
    },
  ];

  return (
    <Row xs={2} lg={3} xl={5} className="g-2 g-md-3">
      {stats.map((stat) => (
        <Col key={stat.title}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  );
};

export default DashboardStats;
