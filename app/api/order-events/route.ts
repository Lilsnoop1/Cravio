// app/api/order-events/route.ts
import { NextRequest } from "next/server";
import { Client } from "pg";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("LISTEN order_updates");

  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // 1️⃣ Send initial pending orders
      try {
        const orders = await prisma.order.findMany({
          where: { status: 'ACCEPTED' },
        });

        controller.enqueue(
          `data: ${JSON.stringify({
            type: "PENDING_ORDERS",
            orders,
          })}\n\n`
        );
      } catch (err) {
        console.error("Failed to fetch initial orders:", err);
      }

      // 2️⃣ Listen for DB notifications
      client.on("notification", (msg) => {
        if (closed) return;

        try {
          const payload = msg.payload || "{}";
          controller.enqueue(`data: ${payload}\n\n`);
        } catch (err) {
          console.error("Failed to enqueue SSE:", err);
        }
      });

      client.on("error", (err) => {
        console.error("PG listener error:", err);
      });
    },

    cancel() {
      closed = true;
      client.removeAllListeners();
      client.end();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
