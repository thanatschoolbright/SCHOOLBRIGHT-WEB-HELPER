import { NextRequest, NextResponse } from "next/server";

const BACKLOG_DOMAIN = "backlog.com";

/**
 * Proxy ไฟล์แนบจาก Backlog API กลับมาให้ client
 * GET /api/v1/backlog/issues/:issueKey/attachments/:attachmentId?space=jabjai
 *
 * Backlog API: GET /api/v2/issues/:issueIdOrKey/attachments/:attachmentId
 * → คืน binary stream พร้อม Content-Type ของไฟล์จริง
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueKey: string; attachmentId: string }> },
) {
  const { issueKey, attachmentId } = await params;
  const { searchParams } = new URL(req.url);
  const space = searchParams.get("space") || "jabjai";
  const apiKey = process.env.BACKLOG_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "BACKLOG_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const backlogUrl = `https://${space}.${BACKLOG_DOMAIN}/api/v2/issues/${issueKey}/attachments/${attachmentId}?apiKey=${apiKey}`;

  const upstream = await fetch(backlogUrl);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Backlog returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // cache 5 นาที — ไฟล์แนบไม่เปลี่ยนบ่อย
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}
