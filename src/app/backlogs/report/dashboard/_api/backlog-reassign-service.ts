import axios from "axios";

export interface ReAssignRequest {
  space: string;
  issue_key_or_id: string | number;
  assignee_id: number;
  comment?: string;
}

export interface ReAssignResponse {
  status_code: number;
  message_th: string;
  message_en: string;
  data: {
    issue_key: string;
    summary: string;
    assignee: { id: number; name: string };
  };
}

// เรียก API เปลี่ยนผู้รับผิดชอบงาน (Quick Re-assign)
export const submitReAssign = async (
  payload: ReAssignRequest,
): Promise<ReAssignResponse> => {
  const response = await axios.patch(
    "/api/v1/backlog/issues/re-assign",
    payload,
  );
  return response.data;
};
