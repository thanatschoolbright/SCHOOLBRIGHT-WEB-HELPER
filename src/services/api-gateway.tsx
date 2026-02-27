import { createLogger, logger } from "@/helpers/logger";
import { CallAPI } from "@/stores/actions/authentication/call-post-refresh-token";
import { APIMethodProps, API_METHOD } from "@services/api-method";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { store } from "@stores/store"; // assuming you have access to the redux store

export interface CallBackendAPIProps {
  method: APIMethodProps;
  endpoint: string;
  data?: any;
  extendHeader?: Record<string, string>;
  backendUrl?: string;
}

let newToken: string = "";

const refreshToken = async () => {
  const state = store.getState();
  const { school_id, user_id, token } = state.callRefreshToken.draftValues;

  try {
    const payload = await store
      .dispatch(CallAPI({ school_id, user_id, token }))
      .unwrap(); // รอผลลัพธ์จริง

    if (payload?.data?.token) {
      newToken = payload.data.token;
      return newToken;
    }
    return null;
  } catch (error) {
    logger.error("[API-GATEWAY] Error while refreshing token:", error);
    return null;
  }
};

export const callBackendAPI = async ({
  method,
  endpoint,
  data,
  extendHeader,
  backendUrl,
}: CallBackendAPIProps) => {
  const defaultRequest = {
    method,
    endpoint,
    data,
    extendHeader,
    backendUrl,
  };
  const lg = createLogger({ module: "api-gateway" });
  lg.info(
    "[API-GATEWAY] Sending request:",
    JSON.stringify(defaultRequest, null, 2),
  );
  const url = `${backendUrl}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  // Get school_id and user_id from Redux state
  const { school_id, user_id, token } =
    store.getState().callRefreshToken.draftValues;

  const headers = {
    ...extendHeader,
    [`JabjaiKey-${school_id}-${user_id}`]: newToken,
    "Content-Type": "application/json",
  };

  try {
    let response;
    switch (method) {
      case API_METHOD.GET:
        response = await axios.get(url, { headers });
        break;
      case API_METHOD.POST:
        response = await axios.post(url, data, { headers });
        break;
      case API_METHOD.PUT:
        response = await axios.put(url, data, { headers });
        break;
      case API_METHOD.DELETE:
        response = await axios.delete(url, { headers });
        break;
      default:
        throw new Error("Unsupported HTTP method");
    }

    return response.data;
  } catch (error: any) {
    // ถ้าเจอ 401 ค่อยเรียก refreshToken และ retry ใหม่
    if (error.response?.status === 401) {
      await refreshToken();

      // Re-create headers after refreshToken to include updated newToken
      const retryHeaders = {
        ...extendHeader,
        [`JabjaiKey-${school_id}-${user_id}`]: newToken,
        "Content-Type": "application/json",
      };

      lg.info(
        "[API-GATEWAY] Retrying request with new token headers:",
        JSON.stringify(retryHeaders),
      );

      // ลองเรียก API ใหม่อีกรอบ
      const retryConfig = { headers: retryHeaders };
      let retryResponse;
      switch (method) {
        case API_METHOD.GET:
          retryResponse = await axios.get(url, retryConfig);
          break;
        case API_METHOD.POST:
          retryResponse = await axios.post(url, data, retryConfig);
          break;
        case API_METHOD.PUT:
          retryResponse = await axios.put(url, data, retryConfig);
          break;
        case API_METHOD.DELETE:
          retryResponse = await axios.delete(url, retryConfig);
          break;
      }
      lg.info(
        "[API-GATEWAY] Retry success. Response data:",
        JSON.stringify(retryResponse?.data),
      );
      return retryResponse?.data;
    }

    throw new Error(error.message);
  } finally {
    lg.info("[API-GATEWAY] API call completed.");
  }
};
