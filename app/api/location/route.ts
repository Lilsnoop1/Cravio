import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, city, street, building, latitude, longitude,placesauto,phoneNumber } = await req.json();

  const location = await prisma.location.upsert({
    where: { userId },
    update: { city, street, building, latitude, longitude,placesauto },
    create: { userId, city, street, building, latitude, longitude,placesauto },
  });
  if (phoneNumber) {
      await prisma.user.update({
        where: { id: userId },
        data: { phoneNumber },
      });
    }

  return NextResponse.json(location);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({
      where: { userId },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (err) {
    console.error("Error fetching location:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
