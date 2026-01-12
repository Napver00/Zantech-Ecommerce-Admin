import React from "react";
import { Card, ButtonGroup, Button, Spinner } from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SalesOverTimeChart = ({ data, period, onPeriodChange, loading }) => {
  return (
    <Card className="modern-card h-100 border-0">
      <Card.Header className="d-flex justify-content-between align-items-center bg-transparent border-bottom pt-4 px-4 pb-3">
        <h5 className="mb-0 fw-bold text-dark">Sales Over Time</h5>
        <ButtonGroup size="sm" className="shadow-sm">
          <Button
            variant={period === "daily" ? "primary" : "light"}
            onClick={() => onPeriodChange("daily")}
          >
            Daily
          </Button>
          <Button
            variant={period === "weekly" ? "primary" : "light"}
            onClick={() => onPeriodChange("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={period === "monthly" ? "primary" : "light"}
            onClick={() => onPeriodChange("monthly")}
          >
            Monthly
          </Button>
        </ButtonGroup>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "300px" }}
          >
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_sales"
                stroke="#10b981"
                name="Sales"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="order_count"
                stroke="#f59e0b"
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
};

export default SalesOverTimeChart;
