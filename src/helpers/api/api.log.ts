import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { NextRequest, NextResponse } from "next/server";

axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export function apiLog(
  handler: (req: NextRequest) => Promise<NextResponse>,
): (req: NextRequest) => Promise<NextResponse> {
  async function wrappedHandler(req: NextRequest): Promise<NextResponse> {
    // รัน API route ปกติ
    return await handler(req);
  }

  return wrappedHandler;
}

export { axios };
