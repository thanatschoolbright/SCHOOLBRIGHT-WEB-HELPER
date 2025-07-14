import {createAsyncThunk} from "@reduxjs/toolkit";
import {callBackendAPI, CallBackendAPIProps} from "@services/api-gateway";
import {FormCardNfcState} from "@stores/type";
import {API_URL} from "@services/api-url";
import {API_METHOD} from "@services/api-method";

// สร้าง async action สำหรับส่งข้อมูลผู้ใช้ไปยัง API
export const CallAPI = createAsyncThunk(
    "/api/v1/getuserinfo",
    async (data: any) => {
        const payload: CallBackendAPIProps = {
            method: API_METHOD.GET,
            endpoint: `api/v1/support/check-nfc?SchoolID=${data.draftValues.school_id}&NFC=${data.draftValues.nfc_card}`,
            data: data,
            extendHeader: {},
            backendUrl: "",
        };
        const response = await callBackendAPI(payload);
        return response;
    }
);
