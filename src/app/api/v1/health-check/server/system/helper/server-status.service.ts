import axios from "axios";

export interface HealthCheckResult {
  module: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: any;
  response: any;
}

const SERVER_STATUS_CONFIG = {
  url: "https://sbapi.schoolbright.co/api/SeverStatus",
  method: "GET",
  headers: {
    Cookie: "HWWAFSESID=338158557dbf249f84; HWWAFSESTIME=1766118216669",
  },
  data: null,
};

function generateCurl(config: typeof SERVER_STATUS_CONFIG): string {
  let curl = `curl --location --request ${config.method} '${config.url}'`;

  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n--header '${key}: ${value}'`;
    });
  }

  return curl;
}

export async function checkServerStatusService(): Promise<HealthCheckResult> {
  const domain = new URL(SERVER_STATUS_CONFIG.url).hostname;
  const curlCommand = generateCurl(SERVER_STATUS_CONFIG);

  const requestInfo = {
    url: SERVER_STATUS_CONFIG.url,
    method: SERVER_STATUS_CONFIG.method,
    headers: SERVER_STATUS_CONFIG.headers,
  };

  try {
    const res = await axios({
      method: SERVER_STATUS_CONFIG.method,
      url: SERVER_STATUS_CONFIG.url,
      headers: SERVER_STATUS_CONFIG.headers,
    });

    return {
      module: "server-status-v1",
      name_th: "สถานะเซิร์ฟเวอร์หลัก",
      name_en: "Core API Server Status",
      status: String(res.status),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: res.data,
    };
  } catch (error: any) {
    return {
      module: "server-status-v1",
      name_th: "สถานะเซิร์ฟเวอร์หลัก",
      name_en: "Core API Server Status",
      status: String(error.response?.status || 500),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: error.response?.data || error.message,
    };
  }
}
