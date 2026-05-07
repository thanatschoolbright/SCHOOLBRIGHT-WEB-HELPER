import { auth } from "@/auth";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest } from "next/server";
import { z } from "zod";

const BATCH_SIZE = 500;

const BodySchema = z.object({
  mode: z.enum(["30d", "90d", "all"]),
});

// ✨ ลบ API Log แบบ Bulk พร้อม SSE Progress Streaming (เฉพาะ Admin)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const adminId = Number((session.user as any).admin_id);
  if (adminId !== 117) {
    return new Response(JSON.stringify({ error: "Forbidden — Admin เท่านั้น" }), { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "mode ต้องเป็น 30d, 90d หรือ all" }), { status: 400 });
  }

  const { mode } = parsed.data;

  // สร้าง where condition ตาม mode
  const where: { created_at?: { lt: Date } } = {};
  if (mode === "30d") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    where.created_at = { lt: cutoff };
  } else if (mode === "90d") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    where.created_at = { lt: cutoff };
  }
  // mode === "all" → where ว่าง = ลบทั้งหมด

  const encoder = new TextEncoder();

  // ✨ SSE Stream — ส่ง progress กลับเป็น percent ที่แม่นยำ
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // นับจำนวน record ที่จะลบก่อน
        const total = await PrismaTimesheet.apiLog.count({ where });

        if (total === 0) {
          send({ type: "done", deleted: 0, total: 0, percent: 100 });
          controller.close();
          return;
        }

        send({ type: "start", total, percent: 0 });

        let deleted = 0;

        // ลบแบบ batch เพื่อให้ progress แม่นยำและไม่ lock DB นาน
        while (deleted < total) {
          // ดึง IDs ของ batch ถัดไป
          const ids = await PrismaTimesheet.apiLog.findMany({
            where,
            select: { id: true },
            take: BATCH_SIZE,
            orderBy: { id: "asc" },
          });

          if (ids.length === 0) break;

          await PrismaTimesheet.apiLog.deleteMany({
            where: { id: { in: ids.map((r) => r.id) } },
          });

          deleted += ids.length;
          const percent = Math.min(Math.round((deleted / total) * 100), 99);
          send({ type: "progress", deleted, total, percent });
        }

        send({ type: "done", deleted, total, percent: 100 });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
