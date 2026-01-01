import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { Session } from "next-auth";

type SessionWithRole = Session & { user: { id?: string; role?: string } };

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = session.user?.role;

    // Only admins can access this
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = session.user?.role;

    // Only admins can create employees
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as {
      email?: string;
      name?: string;
      employeeId?: string;
      department?: string;
      position?: string;
      salary?: number | string;
      isActive?: boolean;
    };
    const { email, name, employeeId, department, position, salary, isActive } = body;

    if (!email || !employeeId) {
      return NextResponse.json(
        { error: "Email and Employee ID are required" },
        { status: 400 }
      );
    }

    // Check if user exists or create them
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user with EMPLOYEE role
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          role: "EMPLOYEE"
        }
      });
    } else {
      // Update existing user to EMPLOYEE role if they weren't already
      if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "EMPLOYEE" }
        });
      }
    }

    // Check if employee record already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Employee record already exists for this user" },
        { status: 409 }
      );
    }

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        department: department || null,
        position: position || null,
        salary: salary ? parseFloat(String(salary)) : null,
        isActive: isActive !== undefined ? isActive : true
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

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

