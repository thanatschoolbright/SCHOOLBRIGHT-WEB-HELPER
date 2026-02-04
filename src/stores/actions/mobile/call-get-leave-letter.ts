import { API_METHOD } from "@/services/api-method";
import { RequestLeaveLetter } from "@/stores/type";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/mobile/leave-letter/read`;
export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: RequestLeaveLetter["draftValues"]) => {
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
  },
);
