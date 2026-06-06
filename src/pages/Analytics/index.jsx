import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import Loading from '../../components/Loading';
import usePageTitle from '../../hooks/usePageTitle';

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

const StatCard = ({ label, value, color }) => (
  <Card className="modern-card border-0 h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div
        style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          backgroundColor: color, display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>৳</span>
      </div>
      <div>
        <p className="text-muted mb-1" style={{ fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <h4 className="mb-0 fw-bold text-dark">{value}</h4>
      </div>
    </Card.Body>
  </Card>
);

const Analytics = () => {
  usePageTitle('Analytics');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [salesOverTime, setSalesOverTime] = useState([]);
  const [topItems, setTopItems] = useState([]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, expRes, salesRes, topRes, timeRes] = await Promise.all([
          axiosInstance.get('/admin/dashboard'),
          axiosInstance.get('/reports/expenses/monthly-total'),
          axiosInstance.get('/reports/transitions/monthly-total'),
          axiosInstance.get('/reports/top-selling-items'),
          axiosInstance.get('/reports/sales-over-time?period=monthly'),
        ]);

        if (dashRes.data.success) setDashboardData(dashRes.data.data);

        const salesData = salesRes.data.data || [];
        const expData = expRes.data.data || [];
        const map = new Map();
        salesData.forEach(item => {
          const key = `${item.year}-${item.month}`;
          if (!map.has(key)) map.set(key, { name: `${monthNames[item.month - 1]} ${item.year}`, sales: 0, expenses: 0 });
          map.get(key).sales = Number(item.total_amount);
        });
        expData.forEach(item => {
          const key = `${item.year}-${item.month}`;
          if (!map.has(key)) map.set(key, { name: `${monthNames[item.month - 1]} ${item.year}`, sales: 0, expenses: 0 });
          map.get(key).expenses = Number(item.total_amount);
        });
        setMonthlyData(Array.from(map.values()).reverse());

        setTopItems((topRes.data.data || []).slice(0, 6));
        setSalesOverTime(timeRes.data.data || []);
      } catch {
        toast.error('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Loading />;

  const totalSales = monthlyData.reduce((s, m) => s + m.sales, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const profit = totalSales - totalExpenses;

  const pieData = topItems.map(item => ({ name: item.name, value: Number(item.total_sold) }));

  return (
    <div className="dashboard-container">
      <div className="landing-header mb-4">
        <h2 className="mb-1 text-dark fw-bold">Analytics</h2>
        <p className="text-muted lead fs-6 mb-0">Business performance insights at a glance.</p>
      </div>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <StatCard label="Total Revenue" value={`৳${totalSales.toLocaleString()}`} color="#4e73df" />
        </Col>
        <Col md={4}>
          <StatCard label="Total Expenses" value={`৳${totalExpenses.toLocaleString()}`} color="#e74a3b" />
        </Col>
        <Col md={4}>
          <StatCard label="Net Profit" value={`৳${profit.toLocaleString()}`} color={profit >= 0 ? '#1cc88a' : '#e74a3b'} />
        </Col>
        {dashboardData && (
          <>
            <Col md={4}>
              <StatCard label="Total Orders" value={dashboardData.total_order_count ?? 0} color="#36b9cc" />
            </Col>
            <Col md={4}>
              <StatCard label="Today's Orders" value={dashboardData.today_order_count ?? 0} color="#f6c23e" />
            </Col>
            <Col md={4}>
              <StatCard label="Today's Sales" value={`৳${Number(dashboardData.today_revenue ?? 0).toLocaleString()}`} color="#858796" />
            </Col>
          </>
        )}
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="modern-card border-0 h-100">
            <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
              <h5 className="mb-0 fw-bold text-dark">Monthly Sales vs Expenses</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `৳${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#4e73df" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e74a3b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="modern-card border-0 h-100">
            <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
              <h5 className="mb-0 fw-bold text-dark">Top Products by Units Sold</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => [`${v} units`, 'Sold']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={12}>
          <Card className="modern-card border-0">
            <Card.Header className="bg-transparent border-bottom pt-4 px-4 pb-3">
              <h5 className="mb-0 fw-bold text-dark">Sales Trend (Monthly)</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `৳${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="total_sales" name="Sales" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="order_count" name="Orders" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
