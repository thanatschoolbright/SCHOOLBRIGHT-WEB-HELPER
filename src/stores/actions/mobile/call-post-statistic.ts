import {createAsyncThunk} from "@reduxjs/toolkit";
import {callBackendAPI, CallBackendAPIProps} from "@services/api-gateway";
import {API_METHOD} from "@/services/api-method";
import {RequestStatistic} from "@/stores/type";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
const API_ENDPOINT = `/api/v1/mobile/statistic`;
export const CallAPI = createAsyncThunk(
    API_METHOD.POST + API_ENDPOINT,
    async (request: RequestStatistic["draftValues"]) => {
        const payload: CallBackendAPIProps = {
            method: API_METHOD.POST,
            endpoint: API_ENDPOINT,
            data: {
                user_id: request.user_id,
                school_id: request.school_id,
                start_date: request.start_date,
                end_date: request.end_date,

            },
            extendHeader: {},
            backendUrl: "",
        };
        const response = await callBackendAPI(payload);
        return response;
    }
);

