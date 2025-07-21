import {createAsyncThunk} from "@reduxjs/toolkit";
import {API_METHOD} from "@/services/api-method";
import axios from "axios";

type CreateApplicationVersionRequest = {
    school_id: string | string[];
    app_id: string;
    version_name: string;
    env: string;
    note: string;
    file: File | null;
};


const API_ENDPOINT = `/api/v1/hardware/canteen/create`;
export const CallAPI = createAsyncThunk(
    API_METHOD.POST + API_ENDPOINT,
  async (formData: FormData) => {
    const response = await axios.post(API_ENDPOINT, formData);
    return response.data;
  }
);
