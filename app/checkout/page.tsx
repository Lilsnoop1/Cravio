"use client";
import { useCartContext } from "../context/CartContext";
import { useLocation } from '../context/LocationContext';
import { useUserInfo } from '../context/UserInfoContext';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, CreditCard, Banknote, ArrowLeft, Clock, Package } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVendorContext } from "../context/VendorContext";

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCartContext();
  const { selectedAddress, coordinates } = useLocation();
  const { phoneNumber, city, building, street } = useUserInfo();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subTotal, setSubTotal] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'visa' | 'cod'>('visa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkEligible, setBulkEligible] = useState(false);
  const { vendor, setOpenVendorModal } = useVendorContext();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isEmployee = role === "EMPLOYEE";

  useEffect(() => {
    const consumerSubtotal = cartItems.reduce(
      (sum, item) =>
        sum +
        (item.product.consumerPrice ?? item.product.price ?? 0) *
          item.quantity,
      0
    );
    const bulkFlag = role === "EMPLOYEE" || consumerSubtotal >= 20000;
    const saleSubtotal = cartItems.reduce((sum, item) => {
      const consumer = item.product.consumerPrice ?? item.product.price ?? 0;
      const retail = item.product.retailPrice ?? item.product.price ?? consumer;
      const bulk = item.product.bulkPrice ?? retail;
      const sale = bulkFlag ? bulk : consumer;
      return sum + sale * item.quantity;
    }, 0);
    setSubTotal(saleSubtotal);
    setBulkEligible(bulkFlag);
  }, [cartItems, role]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/");
    }
  }, [session, status, router]);

  const total = subTotal;

  const consumerSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum +
          (item.product.consumerPrice ?? item.product.price ?? 0) *
            item.quantity,
        0
      ),
    [cartItems]
  );

  const handlePlaceOrder = async () => {
    if (!session?.user) {
      alert("Please log in to place an order");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (role !== "EMPLOYEE") {
      if (!bulkEligible && consumerSubtotal < 3000) {
        alert("Minimum order amount is Rs 3000 for consumer pricing.");
        return;
      }
    }

    if (role === "EMPLOYEE" && !vendor) {
      setOpenVendorModal(true);
      return;
    }

    if (role !== "EMPLOYEE") {
      if (!selectedAddress || !phoneNumber || !city || !building || !street) {
        alert("Please complete your delivery information");
        router.push('/user-info');
        return;
      }
    } else {
      if (!phoneNumber) {
        alert("Please add a phone number before placing a vendor order.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Format order info (cart items as readable string)
      const orderInfo = cartItems
        .map((item) => {
          const consumer = item.product.consumerPrice ?? item.product.price;
          const retail = item.product.retailPrice ?? item.product.price ?? consumer;
          const bulk = item.product.bulkPrice ?? retail;
          const sale = bulkEligible ? bulk : consumer;
          return `${item.product.name} x${item.quantity} (Rs ${(sale * item.quantity).toFixed(2)})`;
        })
        .join(', ');

      // Format full address
      const fullAddress =
        role === "EMPLOYEE"
          ? vendor?.address || "Vendor order (P2P)"
          : `${selectedAddress}${street ? `, ${street}` : ''}${building ? `, ${building}` : ''}${city ? `, ${city}` : ''}`;

      // Get order person name from session
      const orderPerson = session.user.name || "Customer";

      // Prepare products array for order
      const products = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Create order
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          orderInfo,
          address: fullAddress,
          orderPerson,
          products,
          p2pVendorId: vendor?.id ?? null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const order = await response.json();
      
      // Clear cart after successful order
      clearCart();

      // Redirect to success page or show success message
      alert(`Order placed successfully! Order #${order.orderNumber}`);
      router.push('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-sifonn">Back to Menu</span>
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <h1 className="text-2xl font-bold text-primary font-brasika">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-brasika">Delivery Information</h2>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">Delivery Address</p>
                    <p className="font-medium text-slate-800">{selectedAddress || "No address selected"}</p>
                    {(street || building || city) && (
                      <div className="mt-2 space-y-1">
                        {street && (
                          <p className="text-sm text-slate-700">Street: <span className="font-medium">{street}</span></p>
                        )}
                        {building && (
                          <p className="text-sm text-slate-700">Building: <span className="font-medium">{building}</span></p>
                        )}
                        {city && (
                          <p className="text-sm text-slate-700">City: <span className="font-medium">{city}</span></p>
                        )}
                      </div>
                    )}
                    {coordinates && (
                      <p className="text-xs text-slate-500 mt-1">
                        Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Estimated delivery: 15-30 minutes</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-brasika">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {/* Visa Card Option */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedPaymentMethod === 'visa' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('visa')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedPaymentMethod === 'visa' ? 'bg-primary/10' : 'bg-slate-100'
                    }`}>
                      <CreditCard className={`w-5 h-5 ${
                        selectedPaymentMethod === 'visa' ? 'text-primary' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">Visa Card</span>
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                            <span className="text-white text-xs font-bold">VISA</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">Pay securely with your Visa card</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'visa' 
                        ? 'border-primary bg-primary' 
                        : 'border-slate-300'
                    }`}>
                      {selectedPaymentMethod === 'visa' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedPaymentMethod === 'cod' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('cod')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedPaymentMethod === 'cod' ? 'bg-primary/10' : 'bg-slate-100'
                    }`}>
                      <Banknote className={`w-5 h-5 ${
                        selectedPaymentMethod === 'cod' ? 'text-primary' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-slate-600">Pay cash when your order arrives</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'cod' 
                        ? 'border-primary bg-primary' 
                        : 'border-slate-300'
                    }`}>
                      {selectedPaymentMethod === 'cod' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-brasika">Order Summary</h2>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index: number) => (
                  <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="relative overflow-hidden rounded-lg w-16 h-16 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 text-sm truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-amber-600 font-bold text-sm">
                        Rs {(
                          isEmployee
                            ? item.product.bulkPrice ?? item.product.price
                            : bulkEligible
                                ? item.product.bulkPrice ?? item.product.price
                                : item.product.consumerPrice ?? item.product.price
                        ).toFixed(2)}{" "}
                        × {item.quantity} ({isEmployee || bulkEligible ? "bulk" : "consumer"})
                      </p>
                      {!isEmployee && (
                        <p className="text-xs text-slate-500">
                          Consumer: Rs {(item.product.consumerPrice ?? item.product.price).toFixed(2)} · Bulk: Rs {(item.product.bulkPrice ?? item.product.retailPrice ?? item.product.price).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Line total (applied): Rs {(
                          ((isEmployee || bulkEligible
                            ? item.product.bulkPrice ?? item.product.price
                            : item.product.consumerPrice ?? item.product.price)) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">Rs {subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-slate-800 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-amber-600">Rs {total.toFixed(2)}</span>
                </div>
              <p className="text-xs text-slate-500">
                {bulkEligible
                  ? "Bulk pricing applied (order ≥ Rs 20,000)."
                  : "Consumer pricing. Bulk applies automatically at Rs 20,000+. Minimum order Rs 3000."}
              </p>
              </div>

              {/* Place Order Button */}
              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting || cartItems.length === 0}
                className={`w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-sifonn ${
                  isSubmitting || cartItems.length === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                {isSubmitting 
                  ? 'Placing Order...' 
                  : selectedPaymentMethod === 'visa' 
                    ? 'Pay with Visa' 
                    : 'Place Order'
                }
              </button>

              <p className="text-xs text-slate-500 text-center mt-3">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
