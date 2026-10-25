import React from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, Panel } from "../Reports/ReportParts";
import { COLORS, shortTaka, taka } from "../Reports/reportUtils";

/** Last 12 months: income (store + courses) against expenses. */
const MonthlyComparisonChart = ({ data, loading }) => (
  <Panel
    title="Income vs expenses"
    subtitle="Last 12 months"
    loading={loading}
    height={260}
    actions={<Link to="/reports?preset=12m" className="small fw-semibold">Full report →</Link>}
  >
    {data.some((r) => r.income || r.expenses) ? (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 4, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={shortTaka} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8ef", fontSize: 13 }} formatter={(v, n) => [taka(v), n]} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="income" name="Income" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expenses" name="Expenses" fill={COLORS.expenses} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <EmptyState />
    )}
  </Panel>
);

export default MonthlyComparisonChart;
