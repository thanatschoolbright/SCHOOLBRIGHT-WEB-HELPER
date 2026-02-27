import axios from "axios";

// Hardcoded for now, can be env
const LEGACY_API_BASE_URL = "https://adminsystem.schoolbright.co/v1/api";

export const LegacyUserService = {
  // Fetch users from (Old) API
  async fetchLegacyUsers() {
    try {
      // Direct call to API
      const targetUrl = `${LEGACY_API_BASE_URL}/get-profile/0`;
      const response = await axios.get(targetUrl, { timeout: 15000 });

      // Handle response format { success: true, data: [...] }
      const users = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      return users;
    } catch (error: any) {
      console.error("Failed to fetch legacy users: %s", error.message);
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
