import { API_METHOD } from "@/services/api-method";
import { RequestDeviceDailyStatusTypes } from "@/types/device-daily-status.types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/hardware/check-online`;
export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: RequestDeviceDailyStatusTypes) => {
    const PARAMETER = `?schoolId=${request.schoolId}&deviceId=${request.deviceId}&limit=${request.limit}`;
    const payload: CallBackendAPIProps = {
      method: API_METHOD.GET,
      endpoint: API_ENDPOINT + PARAMETER,
      data: {},
      extendHeader: {},
      backendUrl: "",
    };
    const response = await callBackendAPI(payload);
    return response;
  },
);
