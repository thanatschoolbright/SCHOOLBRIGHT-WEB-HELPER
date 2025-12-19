import axios from "axios";

export interface HealthCheckResult {
  module: string;
  status: string;
  service: string;
  curl: string;
  request: any;
  response: any;
}

const VERIFICATION_CONFIG = {
  url: "https://sbapi.schoolbright.co/api/verification",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "JabjaiKey-849-1230336":
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjIyNTAiLCJlbWFpbCI6IjIyNTBfODQ5XzBAc2Nob29sYnJpZ2h0LmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3Bvc3RhbGNvZGUiOiI4NDkiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxMjMwMzM2IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvaGFzaCI6IjAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiIxMi8yMi8yMDI1IDU6MDQ6MzAgUE0iLCJuYmYiOjE3NjYwNzc0NzAsImV4cCI6MTc2NjQyMzA3MCwiaWF0IjoxNzY2MDc3NDcwfQ.KUxHL2df_Yg04IaFE2UVQuMQRFzQLF9tyTNd3sQ-2sA",
    Cookie: "HWWAFSESID=338158557dbf249f84; HWWAFSESTIME=1766118216669",
  },
  data: {
    Token:
      "cZmeyu1l0knCiurwxBqAK0:APA91bEhLjXJSNRSR9CYv6AxW_x4tS9cU9GQZQjkPLXF33zjKF1tfrwnrPgmtXDvUZRvDxW4Gku1eg2ty4GO9r1kuFUYV96dwyqwWFPcB_tYj50IVdYs6CM",
    UserID: 1400761,
    SchoolID: 849,
    Imei: "B1199AF3-36D9-416F-BB0D-4D334E3BE43B",
    IPAddress: "",
    Location: "test",
    model: "",
    System: "",
    Type: "",
    Mode: "",
    appVersion: "1",
  },
};

function generateCurl(config: typeof VERIFICATION_CONFIG): string {
  let curl = `curl --location --request ${config.method} '${config.url}'`;

  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n--header '${key}: ${value}'`;
    });
  }

  if (config.data) {
    const dataStr = JSON.stringify(config.data);
    curl += ` \\\n--data '${dataStr}'`;
  }

  return curl;
}

export async function checkVerificationService(): Promise<HealthCheckResult> {
  const domain = new URL(VERIFICATION_CONFIG.url).hostname;
  const curlCommand = generateCurl(VERIFICATION_CONFIG);

  const requestInfo = {
    url: VERIFICATION_CONFIG.url,
    method: VERIFICATION_CONFIG.method,
    headers: VERIFICATION_CONFIG.headers,
    body: VERIFICATION_CONFIG.data,
  };

  try {
    const res = await axios({
      method: VERIFICATION_CONFIG.method,
      url: VERIFICATION_CONFIG.url,
      headers: VERIFICATION_CONFIG.headers,
      data: VERIFICATION_CONFIG.data,
    });

    return {
      module: "verification",
      status: String(res.status),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: res.data,
    };
  } catch (error: any) {
    return {
      module: "verification",
      status: String(error.response?.status || 500),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: error.response?.data || error.message,
    };
  }
}
