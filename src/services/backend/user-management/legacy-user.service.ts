import axios from "axios";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

// Hardcoded for now, can be env
const LEGACY_API_BASE_URL = "http://localhost:3000/api/v1/admin/user";

export const LegacyUserService = {
  // Fetch users from (Old) API
  async fetchLegacyUsers() {
    try {
      // Direct call to API
      const response = await axios.get(LEGACY_API_BASE_URL);
      return response.data?.data?.data || [];
    } catch (error) {
      console.error("Failed to fetch legacy users", error);
      return [];
    }
  },

  // Update user in Old API
  async updateLegacyUser(payload: any) {
    try {
      // Convert payload to FormData style if needed or JSON?
      // cURL example used multipart/form-data
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value ?? ""));
      });

      const response = await axios.post(
        `${LEGACY_API_BASE_URL}/update`,
        formData,
        {
          headers: {
            // Need to set content type? axios does automatically for FormData usually
            // But if server-side FormData (node), might need headers
            "Content-Type": "multipart/form-data",
            "x-request-user": "117", // Example user ID
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update legacy user", error);
      throw error;
    }
  },
};
