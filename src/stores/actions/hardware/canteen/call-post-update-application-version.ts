import {createAsyncThunk} from "@reduxjs/toolkit";
import {API_METHOD} from "@/services/api-method";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";

type CreateApplicationVersionRequest = {
    schoolID: string | string[];
    appID: string;
    versionName: string;
    env: string;
    note: string;
    file: File | null;
};


const API_ENDPOINT = `/api/v1/hardware/canteen/update`;
export const CallAPI = createAsyncThunk(
    API_METHOD.POST + API_ENDPOINT,
    async (formData: FormData) => {
        const response = await axios.post(API_ENDPOINT, formData); // <-- ไม่มี headers
        console.log("response", response);
        return response.data;
    }
);
