"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Vendor, VendorOrder } from "@/app/Data/database";

const formatRs = (value: number) =>
  `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

function derivePrices(product: VendorOrder["orderProducts"][number]["product"]) {
  const consumer = product.consumerPrice ?? product.price ?? product.retailPrice ?? 0;
  const retail = product.retailPrice ?? product.price ?? consumer;
  const bulk = product.bulkPrice ?? retail;
  return { consumer, retail, bulk };
}

function calcTotals(order: VendorOrder) {
  const consumerSubtotal = order.orderProducts.reduce((sum, item) => {
    const { consumer } = derivePrices(item.product);
    return sum + consumer * item.quantity;
  }, 0);
  const bulkFlag = consumerSubtotal >= 20000;
  const revenue = order.orderProducts.reduce((sum, item) => {
    const { consumer, bulk } = derivePrices(item.product);
    const applied = bulkFlag ? bulk : consumer;
    return sum + applied * item.quantity;
  }, 0);
  return { revenue, bulkFlag };
}

export default function AdminP2PPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vendors");
        const data = await res.json();
        setVendors(data || []);
      } catch (err) {
        console.error("Failed to load vendors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [session, status, router]);

  const chartData = useMemo(() => {
    return vendors
      .map((vendor) => {
        const revenue = (vendor.orders || []).reduce((sum, order) => {
          const { revenue } = calcTotals(order);
          return sum + revenue;
        }, 0);
        const profit = (vendor.orders || []).reduce((sum, order) => {
          const { revenue } = calcTotals(order);
          return sum + revenue * 0.01; // 1% commission as proxy profit for employee
        }, 0);
        return { name: vendor.name, revenue, profit };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);
  }, [vendors]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-brasika">P2P Vendors</h1>
        <p className="text-sm text-gray-600">
          Vendors, their orders, employees, and 1% commission.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Company revenue & commission</p>
            <p className="text-xs text-gray-500">Top vendors by revenue</p>
          </div>
        </div>
        <div className="h-80 px-4 pb-6 sm:px-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                width={160}
              />
              <Tooltip formatter={(value: number) => formatRs(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Commission (1%)" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-gray-800">Vendors & orders</p>
          <p className="text-xs text-gray-500">Per-vendor orders, employees, totals, commission</p>
        </div>
        <div className="divide-y divide-gray-200">
          {vendors.map((vendor) => {
            const orders = vendor.orders || [];
            return (
              <div key={vendor.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-600">
                      {vendor.address || "No address"} • {vendor.phoneNumber}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Orders: {orders.length}
                  </div>
                </div>
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-500">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order #</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Employee</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Commission (1%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {orders.map((order) => {
                          const { revenue } = calcTotals(order);
                          const commission = revenue * 0.01;
                          return (
                            <tr key={order.id}>
                              <td className="px-3 py-2 font-medium text-gray-900">#{order.orderNumber}</td>
                              <td className="px-3 py-2 text-gray-700">
                                {order.user?.name || order.user?.email || "Employee"}
                              </td>
                              <td className="px-3 py-2 text-gray-800">{formatRs(revenue)}</td>
                              <td className="px-3 py-2 text-gray-800">{formatRs(commission)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

