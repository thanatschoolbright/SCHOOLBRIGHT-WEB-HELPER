import axios from "axios";
import { API_URL } from "@services/api-url";
import https from "https";
// Helper: สร้าง Axios instance (async เพื่อดึง token)
export const API_CLIENT_WITH_REFRESH_TOKEN = async () => {
  const tokenData = await axios.get(
    `${API_URL.SB_HELPER_URL}/api/v1/authentication/refresh-token`,
    {}
  );

  if (!tokenData) {
    throw new Error("Failed to refresh token");
  }

  return axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false, // ⚠️ Development only
    }),
    headers: {
      "Content-Type": "application/json",
      [tokenData.data.header_key]: tokenData.data.token,
    },
  });
};
