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
        try {
            const userId = await getUserByLocalStorage();

            // ตรวจสอบว่า userId มีค่าและไม่ใช่ null/undefined
            if (userId && userId !== null && userId !== undefined) {
                config.headers["x-request-user"] = String(userId);
                console.log("🔍 [Axios Interceptor] Adding header x-request-user:", config.headers["x-request-user"]);
            } else {
                // ไม่เพิ่ม header ถ้าไม่มี userId
                console.log("⚠️ [Axios Interceptor] No valid userId found, skipping x-request-user header");
                delete config.headers["x-request-user"];
            }
        } catch (error) {
            console.error("❌ [Axios Interceptor] Error getting user from localStorage:", error);
            delete config.headers["x-request-user"];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)


