import { UserOrder, OrderProductItem, Product } from "@/app/Data/database";

type OrderEmailType = "PLACED" | "DELIVERED" | "CANCELLED";

const brandColor = "#f59e0b";
const textColor = "#0f172a";
const muted = "#475569";
const bg = "#f8fafc";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function orderTotals(orderProducts: OrderProductItem[]) {
  const subtotal = orderProducts.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function itemsTable(orderProducts: OrderProductItem[]) {
  return orderProducts
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;">${item.product.name}</td>
        <td style="padding:8px 0; text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0; text-align:right;">${formatCurrency(
          item.product.price
        )}</td>
        <td style="padding:8px 0; text-align:right; font-weight:600;">
          ${formatCurrency(item.product.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");
}

export function buildOrderEmail({
  order,
  type,
}: {
  order: {
    orderNumber: number;
    orderProducts: OrderProductItem[];
    address: string;
    orderPerson: string;
    accountEmail: string;
    status: string;
    createdAt: Date | string;
  };
  type: OrderEmailType;
}) {
  const { subtotal, tax, total } = orderTotals(order.orderProducts);
  const title =
    type === "PLACED"
      ? "Order placed successfully"
      : type === "DELIVERED"
      ? "Order delivered"
      : "Order cancelled";

  const note =
    type === "PLACED"
      ? "We’re preparing your items. You can track status in your account."
      : type === "DELIVERED"
      ? "Thanks for choosing Cravio. Enjoy your order!"
      : "Your order has been cancelled. If you have questions, reply to this email.";

  const statusBadge =
    type === "PLACED"
      ? "background:#dbeafe;color:#1d4ed8;"
      : type === "DELIVERED"
      ? "background:#dcfce7;color:#15803d;"
      : "background:#fee2e2;color:#b91c1c;";

  return {
    subject: `Order #${order.orderNumber} – ${title}`,
    html: `
    <div style="background:${bg};padding:24px;font-family:Inter,Arial,sans-serif;color:${textColor};">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:18px;font-weight:700;color:${textColor};">${title}</div>
            <div style="font-size:14px;color:${muted};">Order #${order.orderNumber}</div>
          </div>
          <div style="${statusBadge}padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
            ${order.status}
          </div>
        </div>

        <div style="padding:20px;">
          <p style="margin:0 0 12px;font-size:14px;color:${muted};">${note}</p>

          <div style="margin:16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:700;color:${textColor};">Deliver to</div>
                <div style="font-size:14px;color:${muted};">${order.address}</div>
              </div>
              <div style="text-align:right;font-size:14px;color:${muted};">
                Placed: ${new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:14px;color:${textColor};">
            <thead>
              <tr style="text-align:left;border-bottom:1px solid #e2e8f0;">
                <th style="padding:8px 0;">Item</th>
                <th style="padding:8px 0;text-align:center;">Qty</th>
                <th style="padding:8px 0;text-align:right;">Price</th>
                <th style="padding:8px 0;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTable(order.orderProducts)}
            </tbody>
          </table>

          <div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:14px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${muted};">
              <span>Subtotal</span><span>${formatCurrency(subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${muted};">
              <span>Tax (8%)</span><span>${formatCurrency(tax)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:700;color:${textColor};">
              <span>Total</span><span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div style="padding:16px 20px;background:${bg};border-top:1px solid #e2e8f0;font-size:12px;color:${muted};text-align:center;">
          Need help? Reply to this email or WhatsApp us at +92 314 394 2767.
        </div>
      </div>
    </div>
    `,
  };
}

export type OrderEmailPayload = Parameters<typeof buildOrderEmail>[0];

