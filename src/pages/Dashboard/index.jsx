import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, PackagePlus, GraduationCap, ReceiptText, RefreshCw } from "lucide-react";
import { Button, Spinner } from "react-bootstrap";
import "./Dashboard.css";
import DashboardStats from "../../components/Dashboard/DashboardStats";
import DueOrdersTable from "../../components/Dashboard/DueOrdersTable";
import MonthlyComparisonChart from "../../components/Dashboard/MonthlyComparisonChart";
import SalesOverTimeChart from "../../components/Dashboard/SalesOverTimeChart";
import usePageTitle from "../../hooks/usePageTitle";
import useCachedGet from "../../hooks/useCachedGet";
import { rangeQuery, taka } from "../../components/Reports/reportUtils";

const QUICK_ACTIONS = [
  { to: "/orders/create", label: "New order", icon: Plus, primary: true },
  { to: "/products/add", label: "Add product", icon: PackagePlus },
  { to: "/course-registrations", label: "Registrations", icon: GraduationCap },
  { to: "/course-invoices/add", label: "Course invoice", icon: ReceiptText },
];

// Chart period → report range. Monthly is the same request as the 12-month
// comparison below, so it's already in the cache.
const PERIOD_RANGE = { daily: { preset: "30d" }, weekly: { preset: "90d", group: "week" }, monthly: { preset: "12m" } };

const Dashboard = () => {
  usePageTitle("Dashboard Overview");
  const [salesPeriod, setSalesPeriod] = useState("daily");

  const summary = useCachedGet("/admin/dashboard", { staleMs: 20000 });
  const sales = useCachedGet(rangeQuery(PERIOD_RANGE[salesPeriod]));
  const yearly = useCachedGet(rangeQuery(PERIOD_RANGE.monthly), { staleMs: 120000 });

  const d = summary.data;
  const refreshing = summary.refreshing || sales.refreshing || yearly.refreshing;
  const refreshAll = () => {
    summary.refresh();
    sales.refresh();
    yearly.refresh();
  };

  return (
    <div className="dashboard-container">
      <section className="dash-hero">
        <div className="dash-hero-text">
          <p className="dash-eyebrow">&lt;Overview /&gt;</p>
          <h2>Dashboard</h2>
          <p className="dash-hero-sub">
            {d ? (
              <>
                Today: <strong>{d.today_order_count}</strong> orders · <strong>{taka(d.today_revenue)}</strong> received
                {d.new_order_count > 0 && <> · <Link to="/orders" className="dash-pending">{d.new_order_count} waiting to process</Link></>}
              </>
            ) : (
              <span className="rp-skel" style={{ display: "inline-block", width: 260, height: 16 }} />
            )}
          </p>
        </div>
        <div className="dash-actions">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, primary }) => (
            <Link key={to} to={to} className={`dash-action ${primary ? "dash-action-primary" : ""}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          <Button variant="light" className="dash-action" onClick={refreshAll} disabled={refreshing} title="Refresh numbers">
            {refreshing ? <Spinner size="sm" animation="border" /> : <RefreshCw size={16} />}
          </Button>
        </div>
      </section>

      {summary.error && <div className="rp-error mb-3">{summary.error}</div>}

      <DashboardStats data={d} loading={summary.loading} />

      <div className="rp-grid mt-3">
        <div className="rp-span-7">
          <SalesOverTimeChart data={sales.data?.series || []} period={salesPeriod} onPeriodChange={setSalesPeriod} loading={sales.loading} />
        </div>
        <div className="rp-span-5">
          <DueOrdersTable orders={d?.due_orders || []} count={d?.due_order_count} total={d?.due_total} loading={summary.loading} />
        </div>
        <div className="rp-span-12">
          <MonthlyComparisonChart data={yearly.data?.series || []} loading={yearly.loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
