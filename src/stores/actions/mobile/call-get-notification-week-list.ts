import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";
import { API_METHOD } from "@/services/api-method";
import { RequestGetUserBySchoolId } from "@/types/device-daily-status.types";
import { RequestNotification } from "@/stores/type";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/mobile/notification/week`;
export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: RequestNotification["draftValues"]) => {
    const PARAMETER = `?user_id=${request.user_id}&page=${request.page}`;
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
