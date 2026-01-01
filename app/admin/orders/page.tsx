"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminOrder, OrderStatus, } from "@/app/Data/database";

export default function OrdersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    if (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
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

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        ));
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setUpdating(null);
    }
  };
  const deleteOrder = async (orderId: string) => {
  setUpdating(orderId);

  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Remove order from UI
      setOrders(orders.filter(order => order.id !== orderId));
    } else {
      const error = await response.json();
      console.error("Failed to delete order:", error.error);
    }
  } catch (err) {
    console.error("Error deleting order:", err);
  } finally {
    setUpdating(null);
  }
};


  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: OrderStatus) => {
    switch (status) {
      case 'IN_TRANSIT': return 'In Transit';
      default: return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  const currency = (value: number) => `Rs ${value.toFixed(2)}`;

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "ADMIN")) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-red-600">
          Access denied. This page is only for employees and admins.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
        <p className="text-gray-600">Manage and update order statuses</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const total = order.orderProducts.reduce(
                  (sum, item) => sum + (item.product.price * item.quantity),
                  0
                );

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{order.user.name || 'N/A'}</div>
                        <div className="text-gray-500">{order.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.phoneNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {order.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {currency(total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="text-primary underline"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [order.id]: !prev[order.id] }))
                        }
                      >
                        {expanded[order.id] ? "Hide" : "View"} items
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="ACCEPTED">Accepted</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      {updating === order.id && (
                        <span className="ml-2 text-gray-500">Updating...</span>
                      )}
                      <button
                      onClick={() => deleteOrder(order.id)}
                      disabled={updating === order.id}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      {updating === order.id ? "Processing..." : "Delete"}
                    </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.map((order) =>
          expanded[order.id] ? (
            <div key={order.id} className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Order #{order.orderNumber} items
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-white">
                    <tr className="text-gray-500 uppercase text-xs tracking-wider">
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Consumer</th>
                      <th className="px-4 py-2 text-right">Retail</th>
                      <th className="px-4 py-2 text-right">Bulk</th>
                      <th className="px-4 py-2 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {order.orderProducts.map((item) => {
                      const consumer = item.product.consumerPrice ?? item.product.price;
                      const retail = item.product.retailPrice ?? item.product.price;
                      const bulk = item.product.bulkPrice ?? retail;
                      const line = consumer * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium text-gray-900">{item.product.name}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{currency(consumer)}</td>
                          <td className="px-4 py-2 text-right">{currency(retail)}</td>
                          <td className="px-4 py-2 text-right">{currency(bulk)}</td>
                          <td className="px-4 py-2 text-right font-semibold">{currency(line)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null
        )}

        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}

