import { createAsyncThunk } from "@reduxjs/toolkit";
import type { CallBackendAPIProps } from "@services/api-gateway";
import { CancelSalesState } from "@stores/type";

import { API_METHOD } from "@/services/api-method";

const API_ENDPOINT = `/api/v1/support/cancle-sales`;

export const CallAPI = createAsyncThunk(
  API_METHOD.GET + API_ENDPOINT,
  async (request: CancelSalesState) => {
    const { callBackendAPI } = await import("@/services/api-gateway");
    const payload: CallBackendAPIProps = {
      method: API_METHOD.POST,
      endpoint: API_ENDPOINT,
      data: request.draftValues,
      extendHeader: {},
      backendUrl: "",
    };
    const response = await callBackendAPI(payload);
    return response;
  }
);
