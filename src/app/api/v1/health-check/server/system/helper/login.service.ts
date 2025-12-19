import axios from "axios";

export interface HealthCheckResult {
  module: string;
  status: string;
  service: string;
  curl: string;
  request: any;
  response: any;
}

const LOGIN_CONFIG = {
  url: "https://sbapi.schoolbright.co/api/login",
  method: "GET",
  params: {
    user: "2250",
    pass: "0",
    schoolid: "849",
    imei: "",
  },
  headers: {
    Cookie: "HWWAFSESID=338158557dbf249f84; HWWAFSESTIME=1766118216669",
  },
  data: null,
};

function generateCurl(config: typeof LOGIN_CONFIG): string {
  let curl = `curl --location --request ${config.method} '${config.url}`;

  if (config.method === "GET" && config.params) {
    const searchParams = new URLSearchParams(config.params).toString();
    const separator = config.url.includes("?") ? "&" : "?";
    curl += `${separator}${searchParams}`;
  }

  curl += "'";

  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n--header '${key}: ${value}'`;
    });
  }

  if (config.method !== "GET" && config.data) {
    const dataStr =
      typeof config.data === "object"
        ? JSON.stringify(config.data)
        : config.data;
    curl += ` \\\n--data '${dataStr}'`;
  }

  return curl;
}

export async function checkLoginService(): Promise<HealthCheckResult> {
  const domain = new URL(LOGIN_CONFIG.url).hostname;
  const curlCommand = generateCurl(LOGIN_CONFIG);

  const requestInfo = {
    url: LOGIN_CONFIG.url,
    method: LOGIN_CONFIG.method,
    params: LOGIN_CONFIG.params,
    headers: LOGIN_CONFIG.headers,
  };

  try {
    const res = await axios({
      method: LOGIN_CONFIG.method,
      url: LOGIN_CONFIG.url,
      params: LOGIN_CONFIG.params,
      headers: LOGIN_CONFIG.headers,
    });

    return {
      module: "login",
      status: String(res.status),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: res.data,
    };
  } catch (error: any) {
    return {
      module: "login",
      status: String(error.response?.status || 500),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: error.response?.data || error.message,
    };
  }
}
