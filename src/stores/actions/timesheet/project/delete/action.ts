import { createAsyncThunk } from "@reduxjs/toolkit";
import { callBackendAPI, CallBackendAPIProps } from "@services/api-gateway";
import { API_METHOD } from "@services/api-method";
import { RequestQRCodeGenerator } from "@stores/type";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/mobile/qrcode-health-check`;
export const CallAPI = createAsyncThunk(
  API_ENDPOINT,
  async (data: RequestQRCodeGenerator["draftValues"]) => {
    const payload: CallBackendAPIProps = {
      method: API_METHOD.POST,
      endpoint: API_ENDPOINT,
      data: {
        amount: data.amount,
        school_id: data.school_id,
        shop_id: data.shop_id,
      },
      extendHeader: {},
      backendUrl: "",
    };
    const response = await callBackendAPI(payload);
    return response;
  }
);
