import React from "react";
import { CalendarDays, CircleDollarSign, Clock3, HandCoins, ShoppingCart, Wallet } from "lucide-react";
import { KpiCard } from "../Reports/ReportParts";
import { num, taka } from "../Reports/reportUtils";

/** Headline numbers at the top of the dashboard. */
const DashboardStats = ({ data, loading }) => (
  <div className="rp-kpis">
    <KpiCard loading={loading} label="Today's sales" value={taka(data?.today_revenue)} hint="Payments received today" icon={CalendarDays} tone="cyan" />
    <KpiCard loading={loading} label="Today's orders" value={num(data?.today_order_count)} hint="Placed since midnight" icon={ShoppingCart} tone="amber" />
    <KpiCard loading={loading} label="Waiting to process" value={num(data?.new_order_count)} hint="New orders to handle" icon={Clock3} tone="red" />
    <KpiCard loading={loading} label="To collect" value={taka(data?.due_total)} hint={`${num(data?.due_order_count)} unpaid orders`} icon={HandCoins} tone="violet" />
    <KpiCard loading={loading} label="Total sales" value={taka(data?.total_revenue)} hint="All payments received" icon={Wallet} tone="green" />
    <KpiCard loading={loading} label="Total orders" value={num(data?.total_order_count)} hint="Since the store opened" icon={CircleDollarSign} tone="navy" />
  </div>
);

export default DashboardStats;
