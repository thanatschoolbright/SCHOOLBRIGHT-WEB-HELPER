// src/app/api/v1/health-check/server/system/helper/generate-curl.helper.ts

export interface CurlConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, any> | null;
  data?: any;
}

export function generateCurlCommand(config: CurlConfig): string {
  let curl = `curl --location --request ${config.method} '${config.url}`;

  // Handle Query Params (GET or others)
  if (config.params) {
    const searchParams = new URLSearchParams(config.params).toString();
    const separator = config.url.includes("?") ? "&" : "?";
    curl += `${separator}${searchParams}`;
  }

  curl += "'";

  // Handle Headers
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n--header '${key}: ${value}'`;
    });
  }

  // Handle Body Data
  if (config.method !== "GET" && config.data) {
    const dataStr =
      typeof config.data === "object"
        ? JSON.stringify(config.data) // เอา null, 0 ออกเพื่อให้ Standard ขึ้น หรือจะใส่กลับถ้าชอบแบบ Minify
        : config.data;
    curl += ` \\\n--data '${dataStr}'`;
  }

  return curl;
}
