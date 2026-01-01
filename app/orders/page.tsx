"use client"
import { useEffect, useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, CheckCircle, MapPin, Phone, User } from 'lucide-react';
import Loading from '../components/Loading';
import type { OrderProductItem, UserOrder } from '../Data/database';

const OrdersPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session, router]);

  const pendingOrders = orders.filter(order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED');
  const deliveredOrders = orders.filter(order => order.status === 'DELIVERED');
  const cancelledOrders = orders.filter(order => order.status === 'CANCELLED');

  const calculateTotal = (orderProducts: OrderProductItem[]) => {
    return orderProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const minutesSince = (dateString: string) => {
    const placed = new Date(dateString).getTime();
    const now = Date.now();
    return Math.floor((now - placed) / 60000);
  };

  const handleCancelSubmit = (e: FormEvent, order: UserOrder) => {
    e.preventDefault();
    cancelOrder(order);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const cancelOrder = async (order: UserOrder) => {
    const diffMinutes = minutesSince(order.createdAt);
    const canCancel = diffMinutes <= 10;
    if (!canCancel) {
      showToast('Order cannot be cancelled as the rider is on the way.', "error");
      return;
    }
    const reason = cancelReasons[order.id]?.trim();
    if (!reason) {
      showToast('Please provide a reason for cancellation.', "error");
      return;
    }

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to cancel order', "error");
        return;
      }

      const updated: UserOrder = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setCancelReasons((prev) => ({ ...prev, [order.id]: '' }));
      showToast('Cancellation submitted. We will contact you shortly.', "success");
    } catch (error) {
      console.error(error);
      showToast('Failed to cancel order. Please try again.', "error");
    }
  };

  if (loading) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
      {toast && (
        <div
          className={`fixed bottom-4 left-4 right-4 sm:right-4 sm:left-auto z-[9999] max-w-sm sm:max-w-md px-4 py-3 rounded-lg shadow-lg text-white font-sifonn ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-sifonn">Back to Menu</span>
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <h1 className="text-2xl font-bold text-primary font-brasika">My Orders</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 font-brasika">Pending Orders</h2>
              <span className="bg-amber-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                {pendingOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {pendingOrders.map((order) => {
                const total = calculateTotal(order.orderProducts);
                const finalTotal = total;
                const diffMinutes = minutesSince(order.createdAt);
                const canCancel = diffMinutes <= 10;

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-amber-600" />
                          <h3 className="text-xl font-bold text-slate-800 font-brasika">
                            Order #{order.orderNumber}
                          </h3>
                          <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            {order.status === 'ACCEPTED' ? 'Accepted' :
                             order.status === 'IN_TRANSIT' ? 'In Transit' :
                             order.status === 'CANCELLED' ? 'Cancelled' : order.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">Placed on {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-600">Rs {finalTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Delivery Address</p>
                          <p className="text-sm font-medium text-slate-800">{order.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Contact</p>
                          <p className="text-sm font-medium text-slate-800">{order.phoneNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Order Items:</p>
                      <div className="space-y-2">
                        {order.orderProducts.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity} × Rs {item.product.price}</p>
                            </div>
                            <p className="text-sm font-bold text-amber-600">
                              Rs {(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Need help cancelling?</p>
                          <p className="text-xs text-slate-500">
                            Chat with us or submit a cancellation reason below.
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/923143942767?text=${encodeURIComponent(`Hi, I need help with Order #${order.orderNumber}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition"
                        >
                          WhatsApp Support
                        </a>
                      </div>

                      <div className="mt-4">
                        {canCancel ? (
                          <form
                            className="space-y-3"
                            onSubmit={(e) => handleCancelSubmit(e, order)}
                          >
                            <label className="text-sm font-medium text-slate-700">
                              Reason for cancellation
                            </label>
                            <textarea
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                              rows={3}
                              placeholder="Tell us why you want to cancel..."
                              value={cancelReasons[order.id] ?? ''}
                              onChange={(e) =>
                                setCancelReasons((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              required
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition"
                            >
                              Submit cancellation request
                            </button>
                            <p className="text-xs text-slate-500">
                              You can cancel within 10 minutes of placing the order.
                            </p>
                          </form>
                        ) : (
                          <div className="text-sm text-red-600 font-semibold">
                            Order cannot be cancelled as the rider is on the way
                            (placed {diffMinutes} minutes ago).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivered Orders Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 font-brasika">Delivered Orders</h2>
            <span className="bg-green-500 text-white rounded-full px-3 py-1 text-sm font-bold">
              {deliveredOrders.length}
            </span>
          </div>

          {deliveredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No delivered orders yet</p>
              <p className="text-sm text-slate-500">Your completed orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveredOrders.map((order) => {
                const total = calculateTotal(order.orderProducts);
                const finalTotal = total;

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-green-600" />
                          <h3 className="text-xl font-bold text-slate-800 font-brasika">
                            Order #{order.orderNumber}
                          </h3>
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Delivered
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">Completed on {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-800">Rs {finalTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Order Items:</p>
                      <div className="space-y-2">
                        {order.orderProducts.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity} × Rs {item.product.price}</p>
                            </div>
                            <p className="text-sm font-bold text-amber-600">
                              Rs {(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancelled Orders Section */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 font-brasika">Cancelled Orders</h2>
            <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold">
              {cancelledOrders.length}
            </span>
          </div>

          {cancelledOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No cancelled orders</p>
              <p className="text-sm text-slate-500">Cancelled orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledOrders.map((order) => {
                const total = calculateTotal(order.orderProducts);
                const finalTotal = total;

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-red-600" />
                          <h3 className="text-xl font-bold text-slate-800 font-brasika">
                            Order #{order.orderNumber}
                          </h3>
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Cancelled
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">Placed on {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-800">Rs {finalTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">Order Items:</p>
                      <div className="space-y-2">
                        {order.orderProducts.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity} × Rs {item.product.price}</p>
                            </div>
                            <p className="text-sm font-bold text-amber-600">
                              Rs {(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">No orders yet</p>
            <p className="text-sm text-slate-500 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 font-sifonn"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

