import { callApiService as axios } from "@/services/axios-instance/sb-helper.axios";
import type { AxiosResponse } from "axios";

// Types mirrored from summary.service / page
export type SummaryRecord = {
  admin_id: number | string;
  full_name: string;
  nickname?: string | null;
  employee_code?: string | null;
  position?: string | null;
  email?: string | null;
  tel?: string | null;
  total_hours: number;
  expected_hours: number;
  completion_rate: number;
  rank: string;
  rank_description: string;
  order: number;
};

export type SummaryMetadata = {
  range: {
    start_date: string;
    end_date: string;
    label_th: string;
  };
  mode: string;
  working_days: number;
  expected_hours_per_member: number;
  working_days_full_month?: number;
  expected_hours_full_month?: number;
  generated_at?: string;
  notes?: string;
};

export type FindRankingRequest = {
  user_id: string | number;
  month: string;
  year: string;
  scope?: "elapsed" | "full";
};

export type FindRankingResponseData = {
  record: SummaryRecord | null;
  metadata: SummaryMetadata | null;
};

export type RawApiResponse = {
  status: number;
  message_th?: string;
  message_en?: string;
  data?: FindRankingResponseData;
};

/**
 * Call the find-ranking endpoint with Axios and return typed data.
 * Throws an Error on non-2xx or unexpected payloads.
 */
export async function fetchUserRanking(
  payload: FindRankingRequest
): Promise<FindRankingResponseData> {
  try {
    const res: AxiosResponse<RawApiResponse> = await axios.post(
      "/api/v1/timesheet/find-ranking",
      {
        user_id: String(payload.user_id),
        month: String(payload.month).padStart(2, "0"),
        year: String(payload.year),
        scope: payload.scope ?? "elapsed",
      }
    );

    if (!res?.data) throw new Error("Empty response from server");
    if (res.status >= 400) {
      throw new Error(res.data?.message_en || "Request failed");
    }

    const data = res.data.data;
    if (!data) return { record: null, metadata: null };
    return data;
  } catch (err: any) {
    // Normalize error
    const message = err?.response?.data?.message_en ?? err?.message ?? "Unknown error";
    throw new Error(message);
  }
}

export default fetchUserRanking;
