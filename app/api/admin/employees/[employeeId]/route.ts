import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { Session } from "next-auth";

type SessionWithRole = Session & { user: { id?: string; role?: string } };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = session.user?.role;

    // Only admins can update employees
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { employeeId } = await params;
    const body = (await request.json()) as {
      employeeId?: string;
      department?: string | null;
      position?: string | null;
      salary?: number | string | null;
      isActive?: boolean;
    };

    const { employeeId: newEmployeeId, department, position, salary, isActive } = body;

    const updateData: Prisma.EmployeeUpdateInput = {};

    if (newEmployeeId !== undefined) updateData.employeeId = newEmployeeId;
    if (department !== undefined) updateData.department = department || null;
    if (position !== undefined) updateData.position = position || null;
    if (salary !== undefined) {
      const salaryNumber =
        typeof salary === "string" ? parseFloat(salary) : salary ?? null;
      updateData.salary = salaryNumber;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
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

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

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
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithRole | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRole = session.user?.role;

    // Only admins can delete employees
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { employeeId } = await params;

    // Get the employee to find the user ID
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete the employee record
    await prisma.employee.delete({
      where: { id: employeeId }
    });

    // Optionally, you might want to change the user's role back to USER
    // But for now, we'll leave the user record intact

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}

