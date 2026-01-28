import { NextRequest, NextResponse } from "next/server";

import axios, { AxiosError, AxiosResponse } from "axios";

import { convertToCurl } from "@helpers/api/convert-to-curl";
import { API_URL } from "@services/api-url";

// Types
interface RequestHeaders {
  [key: string]: string;
}

interface ApiResponseData {
  data: any;
  curl: string;
}

interface ErrorDebugInfo {
  url: string;
  status?: number;
  statusText?: string;
  contentType: string | null;
  error: string;
  type: string;
}

interface ApiErrorResponse {
  message: string;
  raw: any;
  debug: ErrorDebugInfo;
  _curl?: string;
}

// Constants
const API_ENDPOINT = "/api/v2/applications/version";
const MULTIPART_CONTENT_TYPE = "multipart/form-data";
const JSON_CONTENT_TYPE = "application/json";
const TEXT_CONTENT_TYPE = "text/plain";

const TIMEOUT_CONFIG = {
  FILE_UPLOAD: 300000, // 5 minutes for large files
  API_REQUEST: 30000, // 30 seconds for regular API calls
} as const;

const ALLOWED_HEADERS = [
  "jabjai",
  "cookie",
  "authorization",
  "content-type",
] as const;

//** การทำงาน: กรองและคัดลอก headers ที่จำเป็นสำหรับส่งต่อไปยัง external API */
function extractForwardHeaders(requestHeaders: Headers): RequestHeaders {
  const forwardHeaders: RequestHeaders = {};

  for (const [headerKey, headerValue] of requestHeaders.entries()) {
    const lowerCaseKey = headerKey.toLowerCase();
    const isAllowedHeader = ALLOWED_HEADERS.some(
      (allowedHeader) =>
        lowerCaseKey.startsWith(allowedHeader) ||
        lowerCaseKey === allowedHeader,
    );

    if (isAllowedHeader) {
      // ยกเว้น content-length เพื่อให้ axios คำนวณใหม่
      if (lowerCaseKey !== "content-length") {
        forwardHeaders[headerKey] = headerValue;
      }
    }
  }

  return forwardHeaders;
}

//** การทำงาน: จัดการการส่งข้อมูล multipart/form-data ไปยัง external API */
async function handleMultipartFormData(
  request: NextRequest,
  targetUrl: string,
): Promise<AxiosResponse> {
  const requestClone = request.clone();
  const requestBody = await requestClone.arrayBuffer();
  const forwardHeaders = extractForwardHeaders(request.headers);

  console.log("Forwarding headers:", Object.keys(forwardHeaders));
  console.log("Request body size:", requestBody.byteLength);
  console.log("Request Body Value", requestBody);

  const axiosResponse = await axios({
    method: "POST",
    url: targetUrl,
    data: requestBody,
    headers: forwardHeaders,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: TIMEOUT_CONFIG.FILE_UPLOAD,
  });

  console.log("External API response:", axiosResponse.data);
  return axiosResponse;
}

//** การทำงาน: จัดการการส่งข้อมูล JSON ไปยัง external API */
async function handleJsonData(
  request: NextRequest,
  targetUrl: string,
): Promise<AxiosResponse> {
  const jsonData = await request.json();
  const authHeaders = extractAuthHeaders(request.headers);

  const axiosResponse = await axios({
    method: "POST",
    url: targetUrl,
    data: jsonData,
    headers: {
      "Content-Type": JSON_CONTENT_TYPE,
      ...authHeaders,
    },
    timeout: TIMEOUT_CONFIG.API_REQUEST,
  });

  return axiosResponse;
}

//** การทำงาน: จัดการการส่งข้อมูล text/plain ไปยัง external API */
async function handleTextData(
  request: NextRequest,
  targetUrl: string,
  contentType: string,
): Promise<AxiosResponse> {
  const textData = await request.text();
  const authHeaders = extractAuthHeaders(request.headers);

  const axiosResponse = await axios({
    method: "POST",
    url: targetUrl,
    data: textData,
    headers: {
      "Content-Type": contentType || TEXT_CONTENT_TYPE,
      ...authHeaders,
    },
    timeout: TIMEOUT_CONFIG.API_REQUEST,
  });

  return axiosResponse;
}

//** การทำงาน: ดึงเฉพาะ headers ที่เกี่ยวกับ authentication */
function extractAuthHeaders(requestHeaders: Headers): RequestHeaders {
  return Object.fromEntries(
    Array.from(requestHeaders.entries()).filter(([headerKey]) => {
      const lowerKey = headerKey.toLowerCase();
      return lowerKey.startsWith("jabjai") || lowerKey === "authorization";
    }),
  );
}

//** การทำงาน: สร้าง error response สำหรับ axios errors */
function createAxiosErrorResponse(
  error: any,
  targetUrl: string,
  contentType: string | null,
  curlCommand?: string,
): NextResponse {
  if (error.response) {
    // มี response แต่ status code ผิดพลาด (4xx, 5xx)
    console.error("External API Error Response:", error.response.data);

    const errorResponse: ApiErrorResponse = {
      message:
        error.response.data?.message || error.message || "External API Error",
      raw: error.response.data || null,
      debug: {
        url: targetUrl,
        status: error.response.status,
        statusText: error.response.statusText,
        contentType,
        error: error.message,
        type: error.name || "AxiosError",
      },
      _curl: curlCommand || error.response.data?._curl,
    };

    return NextResponse.json(errorResponse, { status: error.response.status });
  }

  if (error.request) {
    // ส่ง request แล้วแต่ไม่ได้รับ response (network error)
    console.error("No response received:", error.request);

    const networkErrorResponse: ApiErrorResponse = {
      message: "No response from external API",
      raw: null,
      debug: {
        url: targetUrl,
        contentType,
        error: "Network error - no response received",
        type: "NetworkError",
      },
      _curl: curlCommand,
    };

    return NextResponse.json(networkErrorResponse, { status: 503 });
  }

  // ปัญหาในการ setup request
  const setupErrorResponse: ApiErrorResponse = {
    message: error.message || "Request setup error",
    raw: null,
    debug: {
      url: targetUrl,
      contentType,
      error: error.message,
      type: error.name || "RequestSetupError",
    },
    _curl: curlCommand,
  };

  return NextResponse.json(setupErrorResponse, { status: 500 });
}

//** การทำงาน: สร้าง error response สำหรับ errors ทั่วไป */
function createGenericErrorResponse(
  error: Error,
  targetUrl: string,
  contentType: string | null,
  curlCommand?: string,
): NextResponse {
  const genericErrorResponse: ApiErrorResponse = {
    message: error.message || "Internal Server Error",
    raw: null,
    debug: {
      url: targetUrl,
      contentType,
      error: error.message,
      type: error.name || "Unknown Error",
    },
    _curl: curlCommand,
  };

  return NextResponse.json(genericErrorResponse, { status: 500 });
}

//** การทำงาน: สร้าง success response */
function createSuccessResponse(
  axiosResponse: AxiosResponse,
  curlCommand: string,
): NextResponse {
  // ส่งคืนข้อมูลจาก external API โดยตรงแทนการ wrap
  const responseData = axiosResponse.data;

  // เพิ่ม curl command เข้าไปใน response (optional)
  if (typeof responseData === "object" && responseData !== null) {
    responseData._curl = curlCommand;
  }

  console.log("Final response to client:", responseData);

  return NextResponse.json(responseData, {
    status: axiosResponse.status,
  });
}

//** การทำงาน: API หลักสำหรับ proxy ข้อมูลไปยัง external hardware API รองรับ file upload และ multipart data */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const targetApiUrl = API_URL.PROD_HARDWARE_API_URL;
  const fullTargetUrl = `${targetApiUrl}${API_ENDPOINT}`;

  console.log("=== API Route Start ===");
  console.log("Target URL:", fullTargetUrl);
  console.log(
    "Request headers:",
    Object.fromEntries(request.headers.entries()),
  );

  const contentType = request.headers.get("content-type") || "";
  const curlCommand = convertToCurl(
    targetApiUrl,
    API_ENDPOINT,
    `Content-Type: ${contentType}`,
  );

  try {
    let axiosResponse: AxiosResponse;

    //** เลือกวิธีการประมวลผลตามประเภทของข้อมูล */
    if (contentType.includes(MULTIPART_CONTENT_TYPE)) {
      console.log("Processing multipart/form-data request");
      axiosResponse = await handleMultipartFormData(request, fullTargetUrl);
    } else if (contentType.includes(JSON_CONTENT_TYPE)) {
      console.log("Processing JSON request");
      axiosResponse = await handleJsonData(request, fullTargetUrl);
    } else {
      console.log("Processing text/plain request");
      axiosResponse = await handleTextData(request, fullTargetUrl, contentType);
    }

    console.log("External API response status:", axiosResponse.status);
    console.log("=== API Route Success ===");

    return createSuccessResponse(axiosResponse, curlCommand);
  } catch (error: any) {
    console.error("=== API Route Error ===");
    console.error("API Route Error:", error);
    console.error("Error message:", error.message);

    // Log axios-specific error details
    if (axios.isAxiosError(error)) {
      console.error("Axios error response:", error.response?.data);
      console.error("Axios error status:", error.response?.status);
      console.error("Axios error headers:", error.response?.headers);
    }

    console.error("Error stack:", error.stack);

    //** จัดการ error ตามประเภท */
    if (axios.isAxiosError(error)) {
      return createAxiosErrorResponse(
        error as AxiosError,
        fullTargetUrl,
        request.headers.get("content-type"),
        curlCommand,
      );
    }

    return createGenericErrorResponse(
      error as Error,
      fullTargetUrl,
      request.headers.get("content-type"),
      curlCommand,
    );
  }
}
