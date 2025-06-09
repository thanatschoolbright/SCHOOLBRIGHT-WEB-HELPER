import { store } from "@stores/store";
import { NextRequest } from "next/server";

export const getHeaders = () => {
  const state = store.getState();
  const { school_id, user_id } = state.callRefreshToken.draftValues;
  const token = state.callRefreshToken.response?.data?.token;

  console.log(state.callRefreshToken);

  return {
    "Content-Type": "application/json",
    [`JabjaiKey-${school_id}-${user_id}`]: token,
  };
};

export function sanitizeForwardHeaders(
  request: NextRequest
): Record<string, string> {
  const headers = Object.fromEntries(request.headers.entries());
  delete headers.host;
  delete headers["x-forwarded-host"];
  delete headers["x-forwarded-port"];
  delete headers["x-forwarded-proto"];
  delete headers.referer;
  headers.host = "sbapi.schoolbright.co";

  const state = store.getState();
  const { school_id, user_id } = state.callRefreshToken.draftValues;
  const token = state.callRefreshToken.response?.data?.token;

  if (school_id && user_id && token) {
    headers[`JabjaiKey-${school_id}-${user_id}`] = token;
  }

  return headers;
}

export function normalHeader(request: NextRequest): Record<string, string> {
  const headers = Object.fromEntries(request.headers.entries());
  delete headers.host;
  delete headers["x-forwarded-host"];
  delete headers["x-forwarded-port"];
  delete headers["x-forwarded-proto"];
  delete headers.referer;
  headers.host = "sbapi.schoolbright.co";

  const state = store.getState();
  const { school_id, user_id } = state.callRefreshToken.draftValues;
  const token = state.callRefreshToken.response?.data?.token;

  if (school_id && user_id && token) {
    headers[`JabjaiKey-${school_id}-${user_id}`] = token;
  }

  return headers;
}
