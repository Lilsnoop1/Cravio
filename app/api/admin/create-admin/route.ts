import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { Session } from "next-auth";

type SessionWithRole = Session & { user: { id?: string; role?: string } };

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = session.user?.role;

    // Only admins can create other admins
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Only admins can create admins." }, { status: 403 });
    }

    const body = (await request.json()) as {
      email?: string;
      name?: string;
      adminId?: string;
      level?: number;
    };
    const { email, name, adminId, level = 1 } = body;

    if (!email || !adminId) {
      return NextResponse.json(
        { error: "Email and Admin ID are required" },
        { status: 400 }
      );
    }

    // Check if user exists or create them
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user with ADMIN role
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          role: "ADMIN"
        }
      });
    } else {
      // Update existing user to ADMIN role
      if (user.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" }
        });
      }
    }

    // Check if admin record already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { userId: user.id }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin record already exists for this user" },
        { status: 409 }
      );
    }

    // Create admin record
    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
        adminId,
        level: level || 1
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Admin created successfully",
      admin
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating admin:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Admin ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}

