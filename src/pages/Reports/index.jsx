import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import { BookOpen, Download, Package, PiggyBank, Printer, Receipt, ShoppingBag, Wallet } from "lucide-react";
import usePageTitle from "../../hooks/usePageTitle";
import useCachedGet from "../../hooks/useCachedGet";
import useReportRange from "../../components/Reports/useReportRange";
import { EmptyState, KpiCard, Panel, RangeBar } from "../../components/Reports/ReportParts";
import { downloadCsv, num, rangeLabel, rangeQuery, taka } from "../../components/Reports/reportUtils";

const PERIOD_NAME = { day: "Day", week: "Week of", month: "Month" };

const CsvButton = ({ onClick }) => (
  <Button size="sm" variant="light" className="border d-inline-flex align-items-center gap-1" onClick={onClick}>
    <Download size={14} /> CSV
  </Button>
);

const Reports = () => {
  usePageTitle("Reports");
  const [range, setRange] = useReportRange("this_month");
  const { data, error, loading, refreshing, refresh } = useCachedGet(rangeQuery(range));

  const k = data?.kpis;
  const p = data?.previous;
  const group = data?.range.group || "day";
  const label = data ? rangeLabel(data.range).replace(/\s/g, "_") : "report";

  // Newest first in the table; only periods with any activity.
  const rows = useMemo(
    () => (data?.series || []).filter((r) => r.income || r.expenses || r.orders).slice().reverse(),
    [data]
  );
  const totals = useMemo(
    () => rows.reduce((t, r) => ({
      store: t.store + r.store, course: t.course + r.course, income: t.income + r.income,
      expenses: t.expenses + r.expenses, orders: t.orders + r.orders,
    }), { store: 0, course: 0, income: 0, expenses: 0, orders: 0 }),
    [rows]
  );
  const maxSold = Math.max(1, ...(data?.top_items || []).map((i) => i.total_sold));

  const periodCols = [
    { key: "label", label: PERIOD_NAME[group] || "Period", csv: (r) => r.date },
    { key: "orders", label: "Orders" },
    { key: "store", label: "Store sales" },
    { key: "course", label: "Course fees" },
    { key: "income", label: "Income" },
    { key: "expenses", label: "Expenses" },
    { key: "profit", label: "Profit", csv: (r) => (r.income - r.expenses).toFixed(2) },
  ];

  return (
    <div className="rp-page">
      <div className="rp-head">
        <div>
          <p className="rp-eyebrow">&lt;Reports /&gt;</p>
          <h2>Reports</h2>
          <p>Totals you can check, download to Excel, or print.</p>
        </div>
        <Button variant="light" className="border d-inline-flex align-items-center gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </Button>
      </div>

      <RangeBar value={range} onChange={setRange} range={data?.range} generatedAt={data?.generated_at} refreshing={refreshing} onRefresh={refresh} />
      {error && <div className="rp-error">{error}</div>}

      <div className="rp-kpis">
        <KpiCard loading={loading} label="Income" value={taka(k?.income)} now={k?.income} before={p?.income} icon={Wallet} tone="cyan" />
        <KpiCard loading={loading} label="Store sales" value={taka(k?.store_received)} now={k?.store_received} before={p?.store_received} icon={ShoppingBag} tone="cyan" />
        <KpiCard loading={loading} label="Course fees" value={taka(k?.course_collected)} hint={k ? `${taka(k.course_due)} still due` : ""} icon={BookOpen} tone="violet" />
        <KpiCard loading={loading} label="Expenses" value={taka(k?.expenses)} now={k?.expenses} before={p?.expenses} icon={Receipt} tone="red" invert />
        <KpiCard loading={loading} label="Profit" value={taka(k?.profit)} now={k?.profit} before={p?.profit} icon={PiggyBank} tone={k && k.profit < 0 ? "red" : "green"} />
        <KpiCard loading={loading} label="Orders" value={num(k?.order_count)} hint={k ? `${taka(k.order_value)} order value` : ""} icon={Package} tone="amber" />
      </div>

      <div className="rp-grid">
        <Panel
          className="rp-span-12"
          title={`Income and expenses by ${group}`}
          subtitle="Store sales are payments received; course fees are amounts collected on course invoices."
          loading={loading}
          height={260}
          actions={rows.length > 0 && <CsvButton onClick={() => downloadCsv(`ZAN-Tech-income-${label}.csv`, periodCols, rows)} />}
        >
          {rows.length ? (
            <div className="rp-scroll">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>{PERIOD_NAME[group] || "Period"}</th>
                    <th className="num">Orders</th>
                    <th className="num">Store sales</th>
                    <th className="num">Course fees</th>
                    <th className="num">Income</th>
                    <th className="num">Expenses</th>
                    <th className="num">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const profit = r.income - r.expenses;
                    return (
                      <tr key={r.date}>
                        <td className="fw-semibold">{group === "day" ? new Date(`${r.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : r.label}</td>
                        <td className="num">{r.orders || "—"}</td>
                        <td className="num">{r.store ? taka(r.store) : "—"}</td>
                        <td className="num">{r.course ? taka(r.course) : "—"}</td>
                        <td className="num fw-semibold">{taka(r.income)}</td>
                        <td className="num text-danger">{r.expenses ? taka(r.expenses) : "—"}</td>
                        <td className={`num fw-semibold ${profit < 0 ? "text-danger" : "text-success"}`}>{taka(profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="num">{num(totals.orders)}</td>
                    <td className="num">{taka(totals.store)}</td>
                    <td className="num">{taka(totals.course)}</td>
                    <td className="num">{taka(totals.income)}</td>
                    <td className="num">{taka(totals.expenses)}</td>
                    <td className={`num ${totals.income - totals.expenses < 0 ? "text-danger" : "text-success"}`}>{taka(totals.income - totals.expenses)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <EmptyState>No sales, course fees or expenses in this period.</EmptyState>
          )}
        </Panel>

        <Panel
          className="rp-span-7"
          title="Top products"
          subtitle="Units sold and their sale value"
          loading={loading}
          height={260}
          actions={(data?.top_items || []).length > 0 && (
            <CsvButton onClick={() => downloadCsv(`ZAN-Tech-top-products-${label}.csv`, [
              { key: "name", label: "Product" }, { key: "total_sold", label: "Units" }, { key: "revenue", label: "Sales value" }, { key: "price", label: "Current price" },
            ], data.top_items)} />
          )}
        >
          {(data?.top_items || []).length ? (
            <table className="rp-table">
              <thead>
                <tr><th style={{ width: 36 }}>#</th><th>Product</th><th className="num">Units</th><th className="num">Sales value</th></tr>
              </thead>
              <tbody>
                {data.top_items.map((i, idx) => (
                  <tr key={i.item_id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <div className="fw-semibold">{i.name}</div>
                      <div className="rp-bar"><span style={{ width: `${(i.total_sold / maxSold) * 100}%` }} /></div>
                    </td>
                    <td className="num fw-semibold">{num(i.total_sold)}</td>
                    <td className="num">{taka(i.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState>No products sold in this period.</EmptyState>
          )}
        </Panel>

        <Panel
          className="rp-span-5"
          title="Course fees"
          subtitle="Invoices issued in this period"
          loading={loading}
          height={260}
          actions={(data?.courses || []).length > 0 && (
            <CsvButton onClick={() => downloadCsv(`ZAN-Tech-course-fees-${label}.csv`, [
              { key: "course_title", label: "Course" }, { key: "invoices", label: "Invoices" }, { key: "invoiced", label: "Invoiced" }, { key: "collected", label: "Collected" }, { key: "due", label: "Due" },
            ], data.courses)} />
          )}
        >
          {(data?.courses || []).length ? (
            <table className="rp-table">
              <thead>
                <tr><th>Course</th><th className="num">Collected</th><th className="num">Due</th></tr>
              </thead>
              <tbody>
                {data.courses.map((c) => (
                  <tr key={c.course_id}>
                    <td>
                      <div className="fw-semibold">{c.course_title}</div>
                      <div className="small text-muted">{c.invoices} invoice{c.invoices === 1 ? "" : "s"} · {taka(c.invoiced)} billed</div>
                    </td>
                    <td className="num text-success fw-semibold">{taka(c.collected)}</td>
                    <td className="num text-danger">{c.due ? taka(c.due) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">{taka(k?.course_collected)}</td>
                  <td className="num">{taka(k?.course_due)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <EmptyState>No course invoices in this period.</EmptyState>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Reports;
