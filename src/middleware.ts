// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const boldRed = "\x1b[1m\x1b[31m";
const reset = "\x1b[0m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";

function prettyPrintAndTruncate(value: any): string {
  let str = "";
  try {
    str = JSON.stringify(value, null, 2);
  } catch {
    str = String(value);
  }
  if (str.length > 500) {
    return str.slice(0, 500) + "...see more";
  }
  return str;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return green;
  } else if (status >= 400 && status < 500) {
    return yellow;
  } else if (status >= 500) {
    return boldRed;
  }
  return reset;
}

async function logRequestDetails(
  req: NextRequest,
  requestBody: any,
  duration: number,
  status: number,
  responseBody: any
) {
  const statusColor = getStatusColor(status);
  console.log(
    "\n ================================================================================================"
  );
  console.log(`${boldRed}รายละเอียด${reset}`);
  console.log(
    `${boldRed}Request Header${reset}: ${prettyPrintAndTruncate(
      Object.fromEntries(req.headers.entries())
    )}`
  );
  if (requestBody) {
    console.log(
      `${boldRed}Request Body${reset}: ${prettyPrintAndTruncate(requestBody)}`
    );
  } else {
    console.log(`${boldRed}Request Body${reset}: null`);
  }
  console.log(`${boldRed}Response Time${reset}: ${duration}ms`);
  console.log(`${statusColor}Status${reset}: ${status}`);
  if (responseBody !== null && responseBody !== undefined) {
    console.log(
      `${boldRed}Response Body${reset}: ${prettyPrintAndTruncate(responseBody)}`
    );
  } else {
    console.log(`${boldRed}Response Body${reset}: null`);
  }
  console.log(`${boldRed}URL${reset}: ${req.url}`);
  console.log(`${boldRed}Endpoint${reset}: ${new URL(req.url).pathname}`);

  // Detect if targeting external API
  if (req.url.includes("adminsystem.schoolbright.co")) {
    console.log(
      `${boldRed}External API Request${reset}: Placeholder for external API request details`
    );
    console.log(
      `${boldRed}External API Response${reset}: Placeholder for external API response details`
    );
  }

  console.log(
    "================================================================================================"
  );
}

export async function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname;
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const requestStartTime = Date.now();
  let requestBody: any = null;

  try {
    if (req.method !== "GET") {
      try {
        requestBody = await req.clone().json();
      } catch {
        try {
          const formData = await req.clone().formData();
          requestBody = Object.fromEntries(formData.entries());
        } catch {
          requestBody = null;
        }
      }
    }

    const res = NextResponse.next();

    let responseBody: any = null;
    try {
      const resClone = res.clone();
      const contentType = resClone.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        responseBody = await resClone.json();
      } else {
        responseBody = await resClone.text();
      }
    } catch {
      responseBody = null;
    }

    const duration = Date.now() - requestStartTime;

    await logRequestDetails(
      req,
      requestBody,
      duration,
      res.status,
      responseBody
    );

    return res;
  } catch (error) {
    console.error("Middleware error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
