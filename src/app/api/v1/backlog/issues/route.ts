import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// Backlog API domain
const BACKLOG_DOMAIN = "backlog.com";

async function callBacklogAPI<T>(
  space: string,
  path: string,
  params: Record<string, any>,
) {
  const baseUrl = `https://${space}.${BACKLOG_DOMAIN}${path}`;

  // Manually build query string to ensure proper array serialization
  // Backlog API expects array parameters as: key[]=value1&key[]=value2
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      // For arrays, add each value separately with the same key
      value.forEach((v) => searchParams.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const url = `${baseUrl}?${searchParams.toString()}`;
  const resp = await axios.get<T>(url);
  return resp.data;
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
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space");
    const projectId = searchParams.get("projectId");
    const requestedCount = Math.max(
      1,
      Math.min(Number(searchParams.get("count") || 20), 500),
    );
    const page = Number(searchParams.get("page") || 1);
    const offset = Math.max(
      0,
      Number(searchParams.get("offset") || (page - 1) * requestedCount),
    );

    if (!space) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space",
          message_th: "กรุณาระบุ space",
        }),
        { status: 400 },
      );
    }

    // Build params for Backlog API — note: array params must use [] suffix.
    const filterParams: Record<string, any> = { apiKey };

    // Project filter (Backlog expects projectId[] as array)
    if (projectId) {
      filterParams["projectId[]"] = Number(projectId);
    }

    // Search keyword - frontend sends 'q', Backlog API expects 'keyword'
    const searchQuery = searchParams.get("q");
    if (searchQuery !== null) {
      filterParams["keyword"] = searchQuery;
    }

    // Single-value filters (date and sort parameters)
    const singleKeys = [
      "createdSince",
      "createdUntil",
      "updatedSince",
      "updatedUntil",
      "sort",
      "order",
    ];
    for (const key of singleKeys) {
      const v = searchParams.get(key);
      if (v !== null) filterParams[key] = v;
    }

    // Multi-value filters - collect all values for array parameters
    // Frontend sends as statusId[]=1&statusId[]=2, we need to preserve the [] in key name
    const arrayKeys = [
      "issueKey",
      "statusId",
      "priorityId",
      "issueTypeId",
      "assigneeId",
      "categoryId",
      "milestoneId",
      "versionId",
      "createdUserId",
    ];

    for (const base of arrayKeys) {
      // Get values from both formats: key and key[]
      const normal = searchParams.getAll(base);
      const bracket = searchParams.getAll(`${base}[]`);
      const merged = [...normal, ...bracket];

      if (merged.length > 0) {
        // Convert to numbers if possible, keep as string otherwise
        const values = merged.map((x) => {
          const num = Number(x);
          return Number.isNaN(num) ? x : num;
        });
        // Store with [] suffix for Backlog API
        filterParams[`${base}[]`] = values;
      }
    }

    const MAX_BACKLOG_COUNT = 100;
    let issues: any[] = [];
    let fetched = 0;

    while (fetched < requestedCount) {
      const batchCount = Math.min(MAX_BACKLOG_COUNT, requestedCount - fetched);
      const batchParams = {
        ...filterParams,
        count: batchCount,
        offset: offset + fetched,
      };
      const batchItems = await callBacklogAPI<any[]>(
        space,
        "/api/v2/issues",
        batchParams,
      );
      issues = issues.concat(batchItems);
      fetched += batchCount;
      if (batchItems.length < batchCount) break;
    }

    // Fetch total count with same filters
    const countObj = await callBacklogAPI<{ count: number }>(
      space,
      "/api/v2/issues/count",
      { ...filterParams },
    );

    return NextResponse.json(
      successResponse({
        data: { items: issues, total: countObj?.count ?? 0 },
        message_en: "Fetch Backlog issues successfully",
        message_th: "ดึงข้อมูล Issue สำเร็จ",
      }),
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
      { status },
    );
  }
}
