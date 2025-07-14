import {createAsyncThunk} from "@reduxjs/toolkit";
import {callBackendAPI, CallBackendAPIProps} from "@services/api-gateway";
import {API_METHOD} from "@/services/api-method";
import {RequestDeviceDailyStatusTypes} from "@/types/device-daily-status.types";

const API_ENDPOINT = `/api/v1/hardware/canteen/application`;
export const CallAPI = createAsyncThunk(
    API_METHOD.GET + API_ENDPOINT,
    async () => {
        const PARAMETER = null;
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
