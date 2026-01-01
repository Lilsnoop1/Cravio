import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type SessionWithRole = Session & { user: { id?: string; role?: string } };

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = session.user?.role;
    const vendors = await prisma.p2PVendor.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include:
        role === "ADMIN"
          ? {
              orders: {
                include: {
                  orderProducts: { include: { product: true } },
                  user: { select: { id: true, name: true, email: true, role: true } },
                },
              },
            }
          : undefined,
    });
    return NextResponse.json(vendors);
  } catch (err) {
    console.error("Failed to fetch vendors", err);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = session.user?.role;
    if (role !== "EMPLOYEE" && role !== "ADMIN") {
      return NextResponse.json({ error: "Only employees or admins can create vendors" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phoneNumber } = body;
    if (!name || !phoneNumber) {
      return NextResponse.json({ error: "Name and phoneNumber are required" }, { status: 400 });
    }

    const vendor = await prisma.p2PVendor.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phoneNumber: phoneNumber.trim(),
        createdById: session.user.id,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (err) {
    console.error("Failed to create vendor", err);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

