import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { API_METHOD } from "@/services/api-method";

const API_ENDPOINT = `/api/v2/authentication/sign-in`;

type SignInRequest = { username: string; password: string };

export const CallAPI = createAsyncThunk(
  API_METHOD.POST + API_ENDPOINT,
  async (formData: FormData) => {
    const response = await axios.post(API_ENDPOINT, formData);
    return response.data;
  }
);
