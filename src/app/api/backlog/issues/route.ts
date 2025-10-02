import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";

// Build domain candidates for Backlog (supports .com/.backlogtool.com/.jp)
const DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

async function callWithDomains<T>(
  space: string,
  path: string,
  params: Record<string, any>
) {
  let lastError: any;
  for (const domain of DOMAINS) {
    try {
      const url = `https://${space}.${domain}${path}`;
      const resp = await axios.get<T>(url, { params });
      return { data: resp.data, domain };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function GET(req: NextRequest) {
  try {
    const apiKey =
      process.env.BACKLOG_API_KEY ||
      new URL(req.url).searchParams.get("apiKey") ||
      undefined;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "BACKLOG_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
        }),
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space");
    const projectId = searchParams.get("projectId");
    const count = Number(searchParams.get("count") || 20);
    const page = Number(searchParams.get("page") || 1);
    const offset = Number(searchParams.get("offset") || (page - 1) * count);

    if (!space || !projectId) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space or projectId",
          message_th: "กรุณาระบุ space และ projectId",
        }),
        { status: 400 }
      );
    }

    // Build params for Backlog API — note: array params must use [] suffix.
    const params: Record<string, any> = { apiKey, count, offset };
    // Project filter (Backlog expects projectId[])
    if (projectId) params["projectId[]"] = [Number(projectId)];

    // Single-value filters
    const singleKeys = [
      "q",
      "createdSince",
      "createdUntil",
      "updatedSince",
      "updatedUntil",
      "sort",
      "order",
    ];
    for (const key of singleKeys) {
      const v = searchParams.get(key);
      if (v !== null) params[key] = v;
    }

    // Multi-value filters map (client sends keys without [], server converts)
    // รองรับทั้ง key ปกติ และรูปแบบ [] จาก client/axios
    const baseKeys = [
      "statusId",
      "priorityId",
      "issueTypeId",
      "assigneeId",
      "categoryId",
      "milestoneId",
      "versionId",
      "createdUserId",
    ];
    for (const base of baseKeys) {
      const normal = searchParams.getAll(base);
      const bracket = searchParams.getAll(`${base}[]`);
      const merged = [...normal, ...bracket];
      if (merged.length) {
        params[`${base}[]`] = merged.map((x) =>
          Number.isNaN(Number(x)) ? x : Number(x)
        );
      }
    }

    // Fetch issues list
    const { data: items } = await callWithDomains<any[]>(
      space,
      "/api/v2/issues",
      params
    );

    // Fetch total count with same filters
    const { data: countObj } = await callWithDomains<{ count: number }>(
      space,
      "/api/v2/issues/count",
      { ...params }
    );

    return NextResponse.json(
      successResponse({
        data: { items, total: countObj?.count ?? 0 },
        message_en: "Fetch Backlog issues successfully",
        message_th: "ดึงข้อมูล Issue สำเร็จ",
      })
    );
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason =
      error?.response?.data || error?.message || "Fetch issues failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en: typeof reason === "string" ? reason : "Fetch issues failed",
        message_th: "ดึงข้อมูล Issue ไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}
