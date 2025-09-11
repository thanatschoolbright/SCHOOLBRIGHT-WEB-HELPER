import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

function prettyPrint(data: any) {
  if (typeof data === "string") {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

axios.interceptors.request.use(
  (config) => {
    console.log(
      `${colors.cyan}================ Axios Request ================${colors.reset}`
    );
    console.log(
      `${colors.cyan}Request: ${config.method?.toUpperCase()} ${config.url}${
        colors.reset
      }`
    );
    console.log(`${colors.cyan}  Headers:${colors.reset}`);
    console.log(
      prettyPrint(config.headers)
        .split("\n")
        .map((line) => "    " + line)
        .join("\n")
    );
    if (config.data) {
      console.log(`${colors.cyan}  Data:${colors.reset}`);
      console.log(
        prettyPrint(config.data)
          .split("\n")
          .map((line) => "    " + line)
          .join("\n")
      );
    }
    console.log(
      `${colors.cyan}==============================================${colors.reset}`
    );
    return config;
  },
  (error) => {
    console.log(
      `${colors.red}================ Axios Request Error ================${colors.reset}`
    );
    console.log(`${colors.red}Error: ${error}${colors.reset}`);
    console.log(
      `${colors.red}====================================================${colors.reset}`
    );
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log(
      `${colors.green}================ Axios Response =================${colors.reset}`
    );
    console.log(
      `${colors.green}Response: ${response.config.url} - Status: ${response.status}${colors.reset}`
    );
    console.log(`${colors.green}  Data:${colors.reset}`);
    console.log(
      prettyPrint(response.data)
        .split("\n")
        .map((line) => "    " + line)
        .join("\n")
    );
    console.log(
      `${colors.green}================================================${colors.reset}`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.log(
        `${colors.red}================ Axios Response Error =================${colors.reset}`
      );
      console.log(
        `${colors.red}Error Response: ${error.response.config.url} - Status: ${error.response.status}${colors.reset}`
      );
      console.log(`${colors.red}  Data:${colors.reset}`);
      console.log(
        prettyPrint(error.response.data)
          .split("\n")
          .map((line) => "    " + line)
          .join("\n")
      );
      console.log(
        `${colors.red}======================================================${colors.reset}`
      );
    } else {
      console.log(
        `${colors.yellow}================ Axios Warning =================${colors.reset}`
      );
      console.log(`${colors.yellow}Warning: ${error.message}${colors.reset}`);
      console.log(
        `${colors.yellow}===============================================${colors.reset}`
      );
    }
    return Promise.reject(error);
  }
);

export function apiLog(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  async function wrappedHandler(req: NextRequest): Promise<NextResponse> {
    const start = Date.now();

    // รัน API route ปกติ
    const res = await handler(req);

    // clone response เพื่ออ่าน body
    let responseBody: any = null;
    try {
      const contentType = res.headers.get("content-type") || "";
      const clone = res.clone();
      if (contentType.includes("application/json")) {
        responseBody = await clone.json();
      } else {
        responseBody = await clone.text();
      }
    } catch {
      responseBody = null;
    }

    // log
    console.log("=====================================");
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("Status:", res.status);
    console.log("Duration:", Date.now() - start, "ms");
    console.log("Response Body:", responseBody);
    console.log("=====================================");

    return res;
  }

  return wrappedHandler;
}

export { axios };
