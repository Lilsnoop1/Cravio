import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { Session } from "next-auth";

type SessionWithRole = Session & { user: { id?: string; role?: string } };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { id } = await params;
    const vendor = await prisma.p2PVendor.findUnique({
      where: { id: Number(id) || 0 },
    });
    if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vendor);
  } catch (err) {
    console.error("Failed to fetch vendor", err);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const role = session.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can update vendors" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phoneNumber } = body;
    const { id } = await params;

    const vendor = await prisma.p2PVendor.update({
      where: { id: Number(id) || 0 },
      data: {
        name: name ?? undefined,
        address: address ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
      },
    });
    return NextResponse.json(vendor);
  } catch (err) {
    console.error("Failed to update vendor", err);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const role = session.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete vendors" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.p2PVendor.delete({
      where: { id: Number(id) || 0 },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete vendor", err);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}

