import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";
import { API_METHOD } from "@/services/api-method";
import { RequestFixStatusLeaveLetter } from "@/stores/type";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/mobile/leave-letter/fix-status`;
export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: RequestFixStatusLeaveLetter["draftValues"]) => {
    const PARAMETER = `?letter_id=${request.letter_id}&school_id=${request.school_id}`;
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
