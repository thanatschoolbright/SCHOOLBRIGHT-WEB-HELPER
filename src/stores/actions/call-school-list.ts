import { API_METHOD } from "@/services/api-method";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { CallBackendAPIProps } from "@services/api-gateway";

// AsyncThunk สำหรับเรียก API
export const CallAPI = createAsyncThunk("/api/v1/school", async () => {
  const { callBackendAPI } = await import("@/services/api-gateway");

  const payload: CallBackendAPIProps = {
    method: API_METHOD.GET,
    endpoint: `/api/v1/school`,
    data: {},
    extendHeader: {},
    backendUrl: "",
  };
  const response = await callBackendAPI(payload);
  return response;
});
