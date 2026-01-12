import React from "react";
import { Card } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MonthlyComparisonChart = ({ data }) => {
  return (
    <Card className="modern-card h-100 border-0">
      <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
        <h5 className="mb-0 fw-bold text-dark">Monthly Sales vs. Expenses</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" name="Total Sales" />
            <Bar dataKey="expenses" fill="#ef4444" name="Total Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};

export default MonthlyComparisonChart;
