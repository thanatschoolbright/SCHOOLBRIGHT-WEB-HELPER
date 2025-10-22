import axios from 'axios';
import {getUserByLocalStorage} from "@helpers/local_storage/user.storage";

export const callApiService = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SB_HELPER_URL || 'http://localhost:3000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

callApiService.interceptors.request.use(
    async (config) => {
        config.headers["x-request-user"] = await getUserByLocalStorage() || "Unknown";
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)


