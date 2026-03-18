import { NextResponse } from "next/server";

/**
 * Health-check / ping endpoint for POS and other API consumers.
 * No auth required. Allows CravioPos and other clients to verify API availability.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Cravio API",
    timestamp: new Date().toISOString(),
  });
}
