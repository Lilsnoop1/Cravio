import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
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

    const admins = await prisma.admin.findMany({
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

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

