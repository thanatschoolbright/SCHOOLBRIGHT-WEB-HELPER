import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";
import { API_METHOD } from "@/services/api-method";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/health-check/server/heartbeats`;
export const CallAPI = createAsyncThunk(API_ENDPOINT, async () => {
  const payload: CallBackendAPIProps = {
    method: API_METHOD.GET,
    endpoint: API_ENDPOINT,
    data: {},
    extendHeader: {},
    backendUrl: "",
  };
  const response = await callBackendAPI(payload);
  return response;
});
