import { createAsyncThunk } from "@reduxjs/toolkit";
import type { CallBackendAPIProps } from "@services/api-gateway";
import { API_METHOD } from "@/services/api-method";
import { RequestGetUserBySchoolId } from "@/types/device-daily-status.types";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/school/get-user`;
export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: RequestGetUserBySchoolId) => {
    const PARAMETER = `?school_id=${request.schoolId}`;
    const { callBackendAPI } = await import("@/services/api-gateway");
    const payload: CallBackendAPIProps = {
      method: API_METHOD.GET,
      endpoint: API_ENDPOINT + PARAMETER,
      data: {},
      extendHeader: {},
      backendUrl: "",
    };
    const response = await callBackendAPI(payload);
    return response;
  }
);
