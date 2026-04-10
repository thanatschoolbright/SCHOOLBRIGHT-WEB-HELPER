import axios from "axios";

export interface BurndownPoint {
  week_label: string;
  ideal_remaining: number;
  actual_remaining: number;
  velocity: number;
  week_start: string;
  week_end: string;
}

export interface BurndownResponse {
  status_code: number;
  message_th: string;
  message_en: string;
  data: {
    total_issues: number;
    points: BurndownPoint[];
  };
}

/**
 * ดึงข้อมูล Burndown และ Velocity Chart รายสัปดาห์
 */
export const fetchBurndownData = async (params: {
  space: string;
  createdSince?: string;
  createdUntil?: string;
  "projectId[]"?: string[];
  "issueTypeId[]"?: string[];
  "priorityId[]"?: string[];
  "statusId[]"?: string[];
  "assigneeId[]"?: string[];
}): Promise<BurndownResponse> => {
  const response = await axios.get("/api/v1/backlog/dashboard/burndown", {
    params,
    paramsSerializer: (p) => {
      const parts: string[] = [];
      for (const [key, value] of Object.entries(p)) {
        if (Array.isArray(value)) {
          value.forEach((v) =>
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`),
          );
        } else if (value !== undefined && value !== null) {
          parts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`,
          );
        }
      }
      return parts.join("&");
    },
  });
  return response.data;
};
