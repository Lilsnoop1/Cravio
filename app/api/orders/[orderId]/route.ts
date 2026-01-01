import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { buildOrderEmail } from "@/lib/emailTemplates";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import type { Session } from "next-auth";

type SessionWithRole = Session & { user: { id?: string; role?: string; email?: string | null } };
type OrderUpdateBody = {
  status?: string;
  orderNumber?: number;
  accountEmail?: string;
  phoneNumber?: string;
  orderInfo?: string;
  address?: string;
  orderPerson?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = session.user?.role;

    // Only employees and admins can update orders
    if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { orderId } = await params;
    const body = (await request.json()) as OrderUpdateBody;

    const { status, orderNumber, accountEmail, phoneNumber, orderInfo, address, orderPerson } =
      body;

    // Validate status if provided
    if (status && !['ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Prisma.OrderUpdateInput = {};

    if (status) updateData.status = status as OrderStatus;
    if (orderNumber !== undefined) updateData.orderNumber = Number(orderNumber);
    if (accountEmail !== undefined) updateData.accountEmail = accountEmail;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (orderInfo !== undefined) updateData.orderInfo = orderInfo;
    if (address !== undefined) updateData.address = address;
    if (orderPerson !== undefined) updateData.orderPerson = orderPerson ?? undefined;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    });

    if (process.env.RESEND_API_KEY && updatedOrder.accountEmail && status) {
      if (status === "DELIVERED") {
        const email = buildOrderEmail({
          order: { ...updatedOrder, status: "DELIVERED" },
          type: "DELIVERED",
        });
        resend.emails
          .send({
            from: "Cravio <craviopk@gmail.com>",
            to: updatedOrder.accountEmail,
            subject: email.subject,
            html: email.html,
          })
          .catch((err) => console.error("Resend delivered email failed", err));
      } else if (status === "CANCELLED") {
        const email = buildOrderEmail({
          order: { ...updatedOrder, status: "CANCELLED" },
          type: "CANCELLED",
        });
        resend.emails
          .send({
            from: "Cravio <craviopk.com>",
            to: updatedOrder.accountEmail,
            subject: email.subject,
            html: email.html,
          })
          .catch((err) => console.error("Resend cancelled email failed", err));
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = (session as SessionWithRole | null)?.user?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only admins can delete orders." },
        { status: 403 }
      );
    }

    // Delete order products first
    await prisma.orderProduct.deleteMany({ where: { orderId } });

    // Delete the order
    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}


