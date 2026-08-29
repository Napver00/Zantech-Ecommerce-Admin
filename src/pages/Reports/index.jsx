import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ButtonGroup, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import Loading from '../../components/Loading';
import './Reports.css';
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from '../../components/Common/CommonTable';

const Reports = () => {
  usePageTitle('Reports Overview');
  const [loading, setLoading] = useState(true);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [salesOverTime, setSalesOverTime] = useState([]);
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [salesLoading, setSalesLoading] = useState(false);
  const [courseSummary, setCourseSummary] = useState(null);
  const [courseMonthly, setCourseMonthly] = useState([]);

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        setLoading(true);
        const [expensesRes, salesRes, topItemsRes] = await Promise.all([
          axiosInstance.get('/reports/expenses/monthly-total'),
          axiosInstance.get('/reports/transitions/monthly-total'),
          axiosInstance.get('/reports/top-selling-items'),
        ]);

        const salesData = salesRes.data.data;
        const expensesData = expensesRes.data.data;
        const mergedData = mergeMonthlyData(salesData, expensesData);
        setMonthlyComparison(mergedData);

        setTopSellingItems(topItemsRes.data.data);
      } catch (error) {
        toast.error("Failed to load initial reports data.");
      } finally {
        setLoading(false);
      }

      // Course revenue reports are fetched independently so a missing/failing
      // endpoint doesn't block the rest of the reports page from loading.
      try {
        const [courseSummaryRes, courseMonthlyRes] = await Promise.all([
          axiosInstance.get('/reports/course-invoices/summary'),
          axiosInstance.get('/reports/course-invoices/monthly-total'),
        ]);
        setCourseSummary(courseSummaryRes.data.data);
        setCourseMonthly(courseMonthlyRes.data.data || []);
      } catch {
        // Silently skip the Course Revenue section if unavailable.
      }
    };

    fetchAllReports();
    fetchSalesOverTime('daily');
  }, []);

  const fetchSalesOverTime = async (period) => {
    setSalesLoading(true);
    try {
      const response = await axiosInstance.get(`/reports/sales-over-time?period=${period}`);
      setSalesOverTime(response.data.data);
    } catch (error) {
      toast.error(`Failed to fetch ${period} sales data.`);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleSalesPeriodChange = (period) => {
    setSalesPeriod(period);
    fetchSalesOverTime(period);
  };

  const mergeMonthlyData = (sales, expenses) => {
    const dataMap = new Map();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    sales.forEach(item => {
      const key = `${item.year}-${item.month}`;
      if (!dataMap.has(key)) {
        dataMap.set(key, { name: `${monthNames[item.month - 1]} ${item.year}`, sales: 0, expenses: 0 });
      }
      dataMap.get(key).sales = item.total_amount;
    });

    expenses.forEach(item => {
        const key = `${item.year}-${item.month}`;
        if (!dataMap.has(key)) {
          dataMap.set(key, { name: `${monthNames[item.month - 1]} ${item.year}`, sales: 0, expenses: 0 });
        }
        dataMap.get(key).expenses = item.total_amount;
      });
  
      return Array.from(dataMap.values()).reverse();
    };

    const monthlyComparisonHeaders = [
        { key: 'name', label: 'Month' },
        { key: 'sales', label: 'Total Sales', render: (row) => <span className="text-end text-success">৳{row.sales.toLocaleString()}</span> },
        { key: 'expenses', label: 'Total Expenses', render: (row) => <span className="text-end text-danger">৳{row.expenses.toLocaleString()}</span> },
    ];

    const topSellingItemsHeaders = [
        { key: 'item_id', label: '#', render: (row, index) => index + 1 },
        { key: 'name', label: 'Product Name' },
        { key: 'price', label: 'Price', render: (row) => <span className="text-end">৳{parseFloat(row.price).toLocaleString()}</span> },
        { key: 'total_sold', label: 'Total Sold', render: (row) => <span className="text-end fw-bold">{row.total_sold}</span> },
    ];

    const salesOverTimeHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'total_sales', label: 'Total Sales', render: (row) => <span className="text-end text-success">৳{parseFloat(row.total_sales).toLocaleString()}</span> },
        { key: 'order_count', label: 'Order Count', render: (row) => <span className="text-end">{row.order_count}</span> },
    ];

    const courseByCourseHeaders = [
        { key: 'course_title', label: 'Course' },
        { key: 'total_invoiced', label: 'Invoiced', render: (row) => <span className="text-end">৳{parseFloat(row.total_invoiced).toLocaleString()}</span> },
        { key: 'total_collected', label: 'Collected', render: (row) => <span className="text-end text-success">৳{parseFloat(row.total_collected).toLocaleString()}</span> },
        { key: 'total_due', label: 'Due', render: (row) => <span className="text-end text-danger">৳{parseFloat(row.total_due).toLocaleString()}</span> },
        { key: 'invoice_count', label: 'Invoices', render: (row) => <span className="text-end">{row.invoice_count}</span> },
    ];

    const courseMonthlyHeaders = [
        { key: 'month', label: 'Month', render: (row) => `${row.year}-${String(row.month).padStart(2, '0')}` },
        { key: 'total_paid', label: 'Collected', render: (row) => <span className="text-end text-success">৳{parseFloat(row.total_paid).toLocaleString()}</span> },
        { key: 'total_due', label: 'Due', render: (row) => <span className="text-end text-danger">৳{parseFloat(row.total_due).toLocaleString()}</span> },
        { key: 'invoice_count', label: 'Invoices', render: (row) => <span className="text-end">{row.invoice_count}</span> },
    ];

    if (loading) {
      return <Loading />;
    }
  
    return (
      <div className="reports-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="page-title mb-1">Reports</h2>
            <p className="text-muted mb-0">Analytics and insights on your business performance</p>
          </div>
        </div>
  
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="modern-card h-100">
              <Card.Header>
                <h5 className="mb-0">Monthly Sales vs. Expenses</h5>
              </Card.Header>
              <Card.Body>
                <CommonTable
                    headers={monthlyComparisonHeaders}
                    data={monthlyComparison}
                    tableLoading={loading}
                    loading={loading}
                />
              </Card.Body>
            </Card>
          </Col>
  
          <Col lg={6} className="mb-4">
            <Card className="modern-card h-100">
              <Card.Header>
                <h5 className="mb-0">Top Selling Items</h5>
              </Card.Header>
              <Card.Body>
                <CommonTable
                    headers={topSellingItemsHeaders}
                    data={topSellingItems}
                    tableLoading={loading}
                    loading={loading}
                />
              </Card.Body>
            </Card>
          </Col>

          {courseSummary && (
            <Col lg={12} className="mb-4">
              <Card className="modern-card">
                <Card.Header>
                  <h5 className="mb-0">Course Revenue</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-4 text-center g-3">
                    <Col md={3}>
                      <div className="p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <div className="small text-muted mb-1">Total Invoiced</div>
                        <div className="fs-5 fw-bold">৳{parseFloat(courseSummary.total_invoiced).toLocaleString()}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <div className="small text-muted mb-1">Total Collected</div>
                        <div className="fs-5 fw-bold text-success">৳{parseFloat(courseSummary.total_collected).toLocaleString()}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <div className="small text-muted mb-1">Total Due</div>
                        <div className="fs-5 fw-bold text-danger">৳{parseFloat(courseSummary.total_due).toLocaleString()}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <div className="small text-muted mb-1">Invoices</div>
                        <div className="fs-5 fw-bold">{courseSummary.invoice_count}</div>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={6} className="mb-3">
                      <h6 className="mb-3">By Course</h6>
                      <CommonTable
                        headers={courseByCourseHeaders}
                        data={courseSummary.by_course || []}
                        tableLoading={loading}
                        loading={loading}
                      />
                    </Col>
                    <Col lg={6} className="mb-3">
                      <h6 className="mb-3">Monthly Trend</h6>
                      <CommonTable
                        headers={courseMonthlyHeaders}
                        data={courseMonthly}
                        tableLoading={loading}
                        loading={loading}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          )}

          <Col lg={12}>
            <Card className="modern-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Sales Over Time</h5>
                <ButtonGroup size="sm">
                  <Button variant={salesPeriod === 'daily' ? 'primary' : 'outline-primary'} onClick={() => handleSalesPeriodChange('daily')}>Daily</Button>
                  <Button variant={salesPeriod === 'weekly' ? 'primary' : 'outline-primary'} onClick={() => handleSalesPeriodChange('weekly')}>Weekly</Button>
                  <Button variant={salesPeriod === 'monthly' ? 'primary' : 'outline-primary'} onClick={() => handleSalesPeriodChange('monthly')}>Monthly</Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body>
              {salesLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <Spinner animation="border" variant="primary" />
                </div>
                 ) : (
                    <CommonTable
                        headers={salesOverTimeHeaders}
                        data={salesOverTime}
                        tableLoading={salesLoading}
                        loading={salesLoading}
                    />
                 )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };
  
  export default Reports;