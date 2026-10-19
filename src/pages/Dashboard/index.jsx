import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Plus, PackagePlus, GraduationCap, ReceiptText } from "lucide-react";
import axiosInstance from "../../config/axios";
import { toast } from "react-hot-toast";
import "./Dashboard.css";
import Loading from "../../components/Loading";
import DashboardStats from "../../components/Dashboard/DashboardStats";
import DueOrdersTable from "../../components/Dashboard/DueOrdersTable";
import MonthlyComparisonChart from "../../components/Dashboard/MonthlyComparisonChart";
import SalesOverTimeChart from "../../components/Dashboard/SalesOverTimeChart";
import usePageTitle from "../../hooks/usePageTitle";

const QUICK_ACTIONS = [
  { to: "/orders/create", label: "New order", icon: Plus, primary: true },
  { to: "/products/add", label: "Add product", icon: PackagePlus },
  { to: "/course-registrations", label: "Registrations", icon: GraduationCap },
  { to: "/course-invoices/add", label: "Course invoice", icon: ReceiptText },
];

const Dashboard = () => {
  usePageTitle("Dashboard Overview");
  const [dashboardData, setDashboardData] = useState({
    total_order_count: 0,
    new_order_count: 0,
    total_revenue: 0,
    today_order_count: 0,
    today_revenue: 0,
  });
  const [dueOrders, setDueOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [salesOverTime, setSalesOverTime] = useState([]);
  const [salesPeriod, setSalesPeriod] = useState("daily");
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchDueOrders(),
          fetchMonthlyComparisonData(),
          fetchSalesOverTime("daily"),
        ]);
      } catch (error) {
        // Errors are handled in the individual functions
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get("/admin/dashboard");
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch dashboard data"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    }
  };

  const fetchDueOrders = async () => {
    try {
      const response = await axiosInstance.get("/orders/summary/due-amount");
      if (response.data.success) {
        setDueOrders(
          Array.isArray(response.data.data) ? response.data.data : []
        );
      } else {
        toast.error("Failed to fetch due orders");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch due orders"
      );
    }
  };

  const fetchMonthlyComparisonData = async () => {
    try {
      const [expensesRes, salesRes] = await Promise.all([
        axiosInstance.get("/reports/expenses/monthly-total"),
        axiosInstance.get("/reports/transitions/monthly-total"),
      ]);

      const salesData = salesRes.data.data;
      const expensesData = expensesRes.data.data;
      const mergedData = mergeMonthlyData(salesData, expensesData);
      setMonthlyComparison(mergedData);
    } catch (error) {
      toast.error("Failed to load monthly comparison data.");
    }
  };

  const fetchSalesOverTime = async (period) => {
    setSalesLoading(true);
    try {
      const response = await axiosInstance.get(
        `/reports/sales-over-time?period=${period}`
      );
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
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    sales.forEach((item) => {
      const key = `${item.year}-${item.month}`;
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          name: `${monthNames[item.month - 1]} ${item.year}`,
          sales: 0,
          expenses: 0,
        });
      }
      dataMap.get(key).sales = item.total_amount;
    });

    expenses.forEach((item) => {
      const key = `${item.year}-${item.month}`;
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          name: `${monthNames[item.month - 1]} ${item.year}`,
          sales: 0,
          expenses: 0,
        });
      }
      dataMap.get(key).expenses = item.total_amount;
    });

    return Array.from(dataMap.values()).reverse();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="dashboard-container">
      <section className="dash-hero">
        <div className="dash-hero-text">
          <p className="dash-eyebrow">&lt;Overview /&gt;</p>
          <h2>Dashboard</h2>
          <p className="dash-hero-sub">
            Today: <strong>{dashboardData.today_order_count ?? 0}</strong> orders ·{" "}
            <strong>৳{(dashboardData.today_revenue ?? 0).toLocaleString()}</strong> in sales
          </p>
        </div>
        <div className="dash-actions">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, primary }) => (
            <Link key={to} to={to} className={`dash-action ${primary ? "dash-action-primary" : ""}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      </section>

      <DashboardStats data={dashboardData} />

      <Row className="g-4 mt-2">
        <Col lg={7}>
          <SalesOverTimeChart
            data={salesOverTime}
            period={salesPeriod}
            onPeriodChange={handleSalesPeriodChange}
            loading={salesLoading}
          />
        </Col>
        <Col lg={5}>
          <DueOrdersTable orders={dueOrders} />
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col lg={7}>
          <MonthlyComparisonChart data={monthlyComparison} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
