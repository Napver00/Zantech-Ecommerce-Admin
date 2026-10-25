import React from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, Panel } from "../Reports/ReportParts";
import { COLORS, shortTaka, taka } from "../Reports/reportUtils";

const PERIODS = [
  ["daily", "30 days"],
  ["weekly", "12 weeks"],
  ["monthly", "12 months"],
];

/** Money received (store + courses) with the number of orders. */
const SalesOverTimeChart = ({ data, period, onPeriodChange, loading }) => (
  <Panel
    title="Sales over time"
    subtitle="Money received from the store and courses, with orders placed"
    loading={loading}
    height={300}
    className="h-100"
    actions={
      <div className="rp-seg" role="tablist">
        {PERIODS.map(([id, label]) => (
          <button key={id} type="button" className={period === id ? "active" : ""} onClick={() => onPeriodChange(id)}>
            {label}
          </button>
        ))}
      </div>
    }
  >
    {data.some((r) => r.income || r.orders) ? (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="dashIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.income} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.income} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={14} />
          <YAxis yAxisId="v" tickFormatter={shortTaka} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
          <YAxis yAxisId="n" orientation="right" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #e3e8ef", fontSize: 13 }}
            formatter={(v, name) => (name === "Orders" ? [v, name] : [taka(v), name])}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar yAxisId="n" dataKey="orders" name="Orders" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Area yAxisId="v" type="monotone" dataKey="income" name="Received" stroke={COLORS.income} strokeWidth={2} fill="url(#dashIncome)" />
        </ComposedChart>
      </ResponsiveContainer>
    ) : (
      <EmptyState>No sales in this period yet.</EmptyState>
    )}
  </Panel>
);

export default SalesOverTimeChart;
