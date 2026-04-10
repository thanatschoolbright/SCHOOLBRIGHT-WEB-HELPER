import axios from "axios";

export interface HeatmapAssignee {
  id: number;
  name: string;
}

export interface HeatmapCell {
  assignee_id: number;
  date: string;
  count: number;
  issue_keys: string[];
}

export interface HeatmapResponse {
  status_code: number;
  message_th: string;
  message_en: string;
  data: {
    dates: string[];
    assignees: HeatmapAssignee[];
    matrix: HeatmapCell[];
  };
}

/**
 * ดึงข้อมูล Workload Heatmap รายคน × รายวัน
 */
export const fetchHeatmapData = async (params: {
  space: string;
  createdSince?: string;
  createdUntil?: string;
  "projectId[]"?: string[];
  "issueTypeId[]"?: string[];
  "priorityId[]"?: string[];
  "statusId[]"?: string[];
  "assigneeId[]"?: string[];
}): Promise<HeatmapResponse> => {
  const response = await axios.get("/api/v1/backlog/dashboard/heatmap", {
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
