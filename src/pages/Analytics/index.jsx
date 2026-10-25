import React, { useMemo, useState } from "react";
import {
  Area, Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart,
} from "recharts";
import { BookOpen, Package, PiggyBank, Receipt, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import usePageTitle from "../../hooks/usePageTitle";
import useCachedGet from "../../hooks/useCachedGet";
import useReportRange from "../../components/Reports/useReportRange";
import { EmptyState, KpiCard, Panel, RangeBar } from "../../components/Reports/ReportParts";
import { COLORS, ORDER_STATUS, num, rangeQuery, shortTaka, taka } from "../../components/Reports/reportUtils";

const tooltipStyle = { borderRadius: 10, border: "1px solid #e3e8ef", boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.2)", fontSize: 13 };
const money = (v, name) => [taka(v), name];

const Analytics = () => {
  usePageTitle("Analytics");
  const [range, setRange] = useReportRange("30d");
  const { data, error, loading, refreshing, refresh } = useCachedGet(rangeQuery(range));
  const [trend, setTrend] = useState("money"); // money | orders

  const k = data?.kpis;
  const p = data?.previous;
  const series = data?.series || [];
  const hasMoney = series.some((r) => r.income || r.expenses);
  const hasOrders = series.some((r) => r.orders);

  const incomeSplit = useMemo(
    () => (k ? [
      { name: "Store sales", value: k.store_received, color: COLORS.store },
      { name: "Course fees", value: k.course_collected, color: COLORS.course },
    ].filter((s) => s.value > 0) : []),
    [k]
  );

  const statusData = useMemo(
    () => Object.entries(data?.order_status || {}).map(([s, n]) => ({ name: ORDER_STATUS[s]?.label || `Status ${s}`, value: n, color: ORDER_STATUS[s]?.color || "#94a3b8" })),
    [data]
  );

  const topItems = (data?.top_items || []).slice(0, 8).map((i) => ({ ...i, short: i.name.length > 28 ? `${i.name.slice(0, 26)}…` : i.name }));

  return (
    <div className="rp-page">
      <div className="rp-head">
        <div>
          <p className="rp-eyebrow">&lt;Analytics /&gt;</p>
          <h2>How the business is doing</h2>
          <p>Store sales, course fees and spending for the period you choose.</p>
        </div>
      </div>

      <RangeBar value={range} onChange={setRange} range={data?.range} generatedAt={data?.generated_at} refreshing={refreshing} onRefresh={refresh} />
      {error && <div className="rp-error">{error}</div>}

      <div className="rp-kpis">
        <KpiCard loading={loading} label="Total income" value={taka(k?.income)} now={k?.income} before={p?.income} icon={Wallet} tone="cyan" />
        <KpiCard loading={loading} label="Store sales" value={taka(k?.store_received)} now={k?.store_received} before={p?.store_received} icon={ShoppingBag} tone="cyan" />
        <KpiCard loading={loading} label="Course fees" value={taka(k?.course_collected)} now={k?.course_collected} before={p?.course_collected} icon={BookOpen} tone="violet" />
        <KpiCard loading={loading} label="Expenses" value={taka(k?.expenses)} now={k?.expenses} before={p?.expenses} icon={Receipt} tone="red" invert />
        <KpiCard loading={loading} label="Profit" value={taka(k?.profit)} now={k?.profit} before={p?.profit} icon={PiggyBank} tone={k && k.profit < 0 ? "red" : "green"} />
        <KpiCard loading={loading} label="Orders" value={num(k?.order_count)} now={k?.order_count} before={p?.order_count} icon={Package} tone="amber" />
        <KpiCard loading={loading} label="Avg. order" value={taka(k?.avg_order_value)} now={k?.avg_order_value} before={p?.avg_order_value} icon={TrendingUp} tone="navy" />
      </div>

      <div className="rp-grid">
        <Panel
          className="rp-span-8"
          title={trend === "money" ? "Income vs expenses" : "Orders"}
          subtitle={data ? `Per ${data.range.group}` : ""}
          loading={loading}
          height={320}
          actions={
            <div className="rp-seg" role="tablist">
              <button type="button" className={trend === "money" ? "active" : ""} onClick={() => setTrend("money")}>Money</button>
              <button type="button" className={trend === "orders" ? "active" : ""} onClick={() => setTrend("orders")}>Orders</button>
            </div>
          }
        >
          {(trend === "money" ? hasMoney : hasOrders) ? (
            <ResponsiveContainer width="100%" height={320}>
              {trend === "money" ? (
                <ComposedChart data={series} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis tickFormatter={shortTaka} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={64} />
                  <Tooltip formatter={money} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="store" name="Store sales" stackId="in" fill={COLORS.store} radius={[0, 0, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="course" name="Course fees" stackId="in" fill={COLORS.course} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke={COLORS.expenses} strokeWidth={2} dot={false} />
                </ComposedChart>
              ) : (
                <ComposedChart data={series} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis yAxisId="n" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
                  <YAxis yAxisId="v" orientation="right" tickFormatter={shortTaka} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={64} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === "Orders" ? [v, n] : money(v, n))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                  <Area yAxisId="v" type="monotone" dataKey="order_value" name="Order value" fill="rgb(217 119 6 / 0.12)" stroke={COLORS.orders} />
                  <Bar yAxisId="n" dataKey="orders" name="Orders" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </Panel>

        <Panel className="rp-span-4" title="Where income came from" loading={loading} height={320}>
          {incomeSplit.length ? (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={incomeSplit} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={2} stroke="none">
                    {incomeSplit.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={money} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="list-unstyled mb-0 small">
                {incomeSplit.map((s) => (
                  <li key={s.name} className="d-flex justify-content-between py-1">
                    <span><span className="d-inline-block rounded-circle me-2" style={{ width: 10, height: 10, background: s.color }} />{s.name}</span>
                    <strong>{taka(s.value)} · {Math.round((s.value / k.income) * 100)}%</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState>No income in this period.</EmptyState>
          )}
        </Panel>

        <Panel className="rp-span-7" title="Best-selling products" subtitle="By units sold, cancelled orders left out" loading={loading} height={300}>
          {topItems.length ? (
            <ResponsiveContainer width="100%" height={Math.max(220, topItems.length * 38)}>
              <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f5" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="short" width={170} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n, item) => (n === "Units" ? [`${v} units · ${taka(item.payload.revenue)}`, item.payload.name] : [v, n])} />
                <Bar dataKey="total_sold" name="Units" fill={COLORS.store} radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState>No products sold in this period.</EmptyState>
          )}
        </Panel>

        <Panel className="rp-span-5" title="Order status" subtitle="Orders placed in this period" loading={loading} height={300}>
          {statusData.length ? (
            <div className="d-flex flex-column flex-sm-row align-items-center gap-3">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2} stroke="none">
                    {statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="list-unstyled mb-0 small w-100">
                {statusData.map((s) => (
                  <li key={s.name} className="d-flex justify-content-between py-1">
                    <span><span className="d-inline-block rounded-circle me-2" style={{ width: 10, height: 10, background: s.color }} />{s.name}</span>
                    <strong>{s.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState>No orders in this period.</EmptyState>
          )}
        </Panel>

        {(data?.courses || []).length > 0 && (
          <Panel className="rp-span-12" title="Course fees by course" subtitle="Collected and still due on invoices issued in this period">
            <ResponsiveContainer width="100%" height={Math.max(200, data.courses.length * 44)}>
              <BarChart data={data.courses} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f5" />
                <XAxis type="number" tickFormatter={shortTaka} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="course_title" width={200} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={money} contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="collected" name="Collected" stackId="c" fill={COLORS.course} maxBarSize={22} />
                <Bar dataKey="due" name="Due" stackId="c" fill="#c4b5fd" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default Analytics;
