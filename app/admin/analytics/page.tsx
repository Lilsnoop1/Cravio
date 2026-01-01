"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  Cell,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AnalyticsOrder as Order, OrderStatus } from "@/app/Data/database";

const STATUS_LABELS: Record<OrderStatus, string> = {
  ACCEPTED: "Accepted",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const CHART_COLORS = ["#111827", "#0EA5E9", "#22C55E", "#F59E0B", "#EC4899"];

const formatRs = (value: number) =>
  `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

function derivePrices(product: Order["orderProducts"][number]["product"]) {
  const consumer = product.consumerPrice ?? product.price ?? product.retailPrice ?? 0;
  const retail = product.retailPrice ?? product.originalPrice ?? consumer;
  const bulk = product.bulkPrice ?? retail;
  return { consumer, retail, bulk };
}

function calculateOrderFinancials(order: Order) {
  const consumerSubtotal = order.orderProducts.reduce((sum, item) => {
    const { consumer } = derivePrices(item.product);
    return sum + consumer * item.quantity;
  }, 0);
  const bulkEligible = consumerSubtotal >= 20000;

  return order.orderProducts.reduce(
    (totals, item) => {
      const { consumer, bulk } = derivePrices(item.product);
      const salePrice = bulkEligible ? bulk : consumer;
      const revenue = salePrice * item.quantity;
      const cost = bulk * item.quantity;

      totals.revenue += revenue;
      totals.cost += cost;
      totals.profit += revenue - cost;
      return totals;
    },
    { revenue: 0, cost: 0, profit: 0 }
  );
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totals = orders.reduce(
      (acc, order) => {
        const { revenue, profit } = calculateOrderFinancials(order);
        acc.revenue += revenue;
        acc.profit += profit;
        acc.delivered += order.status === "DELIVERED" ? 1 : 0;
        acc.inTransit += order.status === "IN_TRANSIT" ? 1 : 0;
        acc.cancelled += order.status === "CANCELLED" ? 1 : 0;
        return acc;
      },
      { revenue: 0, profit: 0, delivered: 0, inTransit: 0, cancelled: 0 }
    );

    const average = orders.length ? totals.revenue / orders.length : 0;
    const margin =
      totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

    return { ...totals, average, margin };
  }, [orders]);

  const revenueTrend = useMemo(() => {
    const grouped = new Map<
      string,
      {
        dateKey: string;
        label: string;
        revenue: number;
        profit: number;
        orders: number;
      }
    >();

    orders.forEach((order) => {
      const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(order.createdAt));

      const { revenue, profit } = calculateOrderFinancials(order);
      const current =
        grouped.get(dateKey) || {
          dateKey,
          label,
          revenue: 0,
          profit: 0,
          orders: 0,
        };

      current.revenue += revenue;
      current.profit += profit;
      current.orders += 1;
      grouped.set(dateKey, current);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey)
    );
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      ACCEPTED: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      counts[order.status] += 1;
    });

    return counts;
  }, [orders]);

  const statusBreakdown = useMemo(
    () =>
      Object.entries(statusCounts).map(([status, count]) => ({
        status: STATUS_LABELS[status as OrderStatus],
        count,
      })),
    [statusCounts]
  );

  const fulfillmentMix = useMemo(
    () => [
      { name: "Delivered", value: statusCounts.DELIVERED },
      { name: "In transit", value: statusCounts.IN_TRANSIT },
      { name: "Accepted", value: statusCounts.ACCEPTED },
    ],
    [statusCounts]
  );

  const topProducts = useMemo(() => {
    const products = new Map<
      string,
      { name: string; revenue: number; units: number; profit: number }
    >();

    orders.forEach((order) => {
      const consumerSubtotal = order.orderProducts.reduce((sum, item) => {
        const { consumer } = derivePrices(item.product);
        return sum + consumer * item.quantity;
      }, 0);
      const bulkFlag = consumerSubtotal >= 20000;

      order.orderProducts.forEach((item) => {
        const key = item.product.name;
        const { consumer, bulk } = derivePrices(item.product);
        const applied = bulkFlag ? bulk : consumer;
        const revenue = applied * item.quantity;
        const profit = revenue - bulk * item.quantity;

        const current = products.get(key) || {
          name: key,
          revenue: 0,
          units: 0,
          profit: 0,
        };

        current.revenue += revenue;
        current.units += item.quantity;
        current.profit += profit;

        products.set(key, current);
      });
    });

    return Array.from(products.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  const bestProduct = topProducts[0];

  const companySales = useMemo(() => {
    const grouped = new Map<
      string,
      { company: string; revenue: number; profit: number; orders: number }
    >();

    orders.forEach((order) => {
      const consumerSubtotal = order.orderProducts.reduce((sum, item) => {
        const { consumer } = derivePrices(item.product);
        return sum + consumer * item.quantity;
      }, 0);
      const bulkFlag = consumerSubtotal >= 20000;

      const perCompany = new Map<string, { revenue: number; profit: number }>();

      order.orderProducts.forEach((item) => {
        const company = item.product.company || "Unknown company";
        const { consumer, bulk } = derivePrices(item.product);
        const applied = bulkFlag ? bulk : consumer;
        const revenue = applied * item.quantity;
        const profit = revenue - bulk * item.quantity;

        const current = perCompany.get(company) || { revenue: 0, profit: 0 };
        current.revenue += revenue;
        current.profit += profit;
        perCompany.set(company, current);
      });

      perCompany.forEach((vals, company) => {
        const current = grouped.get(company) || {
          company,
          revenue: 0,
          profit: 0,
          orders: 0,
        };
        current.revenue += vals.revenue;
        current.profit += vals.profit;
        current.orders += 1;
        grouped.set(company, current);
      });
    });

    return Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const orderDrilldown = useMemo(() => {
    return orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 25)
      .map((order) => {
        const financials = calculateOrderFinancials(order);
        const consumerSubtotal = order.orderProducts.reduce((sum, item) => {
          const { consumer } = derivePrices(item.product);
          return sum + consumer * item.quantity;
        }, 0);
        const bulkFlag = consumerSubtotal >= 20000;

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: STATUS_LABELS[order.status],
          revenue: financials.revenue,
          profit: financials.profit,
          margin:
            financials.revenue > 0
              ? (financials.profit / financials.revenue) * 100
              : 0,
          createdAt: new Date(order.createdAt).toLocaleString(),
          items: order.orderProducts.length,
          order,
          bulkFlag,
        };
      });
  }, [orders]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-1/3 rounded-lg bg-gray-100" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-28 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="text-center text-red-600">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Operations Analytics
          </h1>
          <p className="text-sm text-gray-500">
            Detailed order insights, profitability estimates, and real-time
            trends. Profit uses an estimated cost basis (60% of list price or
            65% of sale price, capped at 85% of sale price).
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="self-start rounded-lg border border-gray-200 bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Refresh data
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total revenue</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatRs(summary.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Estimated profit</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatRs(summary.profit)}
          </p>
          <p className="text-xs text-gray-500">
            Margin: {summary.margin.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average order value</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatRs(summary.average)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Delivered / Cancelled</p>
          <p className="text-2xl font-semibold text-gray-900">
            {summary.delivered} / {summary.cancelled}
          </p>
          <p className="text-xs text-gray-500">
            In transit: {summary.inTransit}
          </p>
        </div>
      </div>

      {bestProduct && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Top seller</p>
          <p className="text-lg font-semibold text-gray-900">{bestProduct.name}</p>
          <p className="text-sm text-gray-600">
            Units: {bestProduct.units} · Revenue: {formatRs(bestProduct.revenue)} · Profit: {formatRs(bestProduct.profit)}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Revenue & profit trend
              </p>
              <p className="text-xs text-gray-500">
                Daily aggregation of completed orders
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip formatter={(value: number) => formatRs(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={false}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Status distribution
              </p>
              <p className="text-xs text-gray-500">
                Active orders by lifecycle stage
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#111827" name="Orders" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Top products by revenue
              </p>
              <p className="text-xs text-gray-500">
                Revenue and profit leaders (top 6)
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  width={120}
                />
                <Tooltip formatter={(value: number) => formatRs(value)} />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#0EA5E9"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#22C55E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Fulfillment mix
              </p>
              <p className="text-xs text-gray-500">
                Delivered vs. in-progress orders
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={fulfillmentMix}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {fulfillmentMix.map((segment, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-gray-800">Sales by company</p>
          <p className="text-xs text-gray-500">
            Revenue and profit grouped by company (applied price respects bulk rules)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Profit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {companySales.map((row) => (
                <tr key={row.company}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {row.company}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatRs(row.revenue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatRs(row.profit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.orders}</td>
                </tr>
              ))}
              {companySales.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={4}>
                    No company sales data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Company revenue & profit</p>
            <p className="text-xs text-gray-500">Top companies by revenue (applied pricing)</p>
          </div>
        </div>
        <div className="h-80 px-4 pb-6 sm:px-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={companySales}
              margin={{ left: 80 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis
                dataKey="company"
                type="category"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                width={140}
              />
              <Tooltip formatter={(value: number) => formatRs(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-gray-800">Order drilldown</p>
          <p className="text-xs text-gray-500">
            Recent orders with revenue, profit estimate, and margin
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Profit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Margin
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orderDrilldown.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    #{order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.status}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatRs(order.revenue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatRs(order.profit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.margin.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.items}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{order.createdAt}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      className="text-primary underline"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [order.id]: !prev[order.id] }))
                      }
                    >
                      {expanded[order.id] ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
              {orderDrilldown.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {orderDrilldown.map((row) =>
          expanded[row.id] && row.order ? (
            <div key={row.id} className="border-t border-gray-200 px-4 py-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Order #{row.orderNumber} breakdown
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Profit is (Applied price - Bulk price) × Qty. Applied price is bulk if consumer subtotal ≥ Rs 20,000; otherwise consumer price.
              </p>
              <p className="text-[11px] text-gray-500 mb-2">
                Applied pricing for this order: {row.bulkFlag ? "Bulk (≥ Rs 20,000)" : "Consumer (< Rs 20,000)"}.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-white">
                    <tr className="text-gray-500 uppercase text-xs tracking-wider">
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Consumer</th>
                      <th className="px-3 py-2 text-right">Retail</th>
                      <th className="px-3 py-2 text-right">Bulk</th>
                      <th className="px-3 py-2 text-right">Applied</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                      <th className="px-3 py-2 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {row.order.orderProducts.map((item) => {
                      const { consumer, retail, bulk } = derivePrices(item.product);
                      const applied = row.bulkFlag ? bulk : consumer;
                      const revenue = applied * item.quantity;
                      const profit = revenue - bulk * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium text-gray-900">{item.product.name}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatRs(consumer)}</td>
                          <td className="px-3 py-2 text-right">{formatRs(retail)}</td>
                          <td className="px-3 py-2 text-right">{formatRs(bulk)}</td>
                          <td className="px-3 py-2 text-right">
                            {formatRs(applied)}{" "}
                            <span className="text-[11px] text-gray-500">
                              {row.bulkFlag ? "bulk" : "consumer"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">{formatRs(revenue)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatRs(profit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

