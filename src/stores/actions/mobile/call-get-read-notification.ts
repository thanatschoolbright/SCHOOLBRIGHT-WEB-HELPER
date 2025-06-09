import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";
import { API_METHOD } from "@/services/api-method";
import { RequestGetUserBySchoolId } from "@/types/device-daily-status.types";
import { RequestNotificationReadMessage } from "@/stores/type";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/mobile/notification/read-message`;
export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: RequestNotificationReadMessage["draftValues"]) => {
    const PARAMETER = `?user_id=${request.user_id}&message_id=${request.message_id}`;
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
