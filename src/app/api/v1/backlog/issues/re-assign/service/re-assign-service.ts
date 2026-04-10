import axios from "axios";
import type { ReAssignPayload } from "../validation/re-assign-schema";

const BACKLOG_DOMAIN = "backlog.com";

// เปลี่ยนผู้รับผิดชอบงาน (Re-assign Issue) ผ่าน Backlog PATCH API
export const reAssignIssueService = async (payload: ReAssignPayload) => {
  const { space, issue_key_or_id, assignee_id, comment } = payload;
  const apiKey = process.env.BACKLOG_API_KEY;

  if (!apiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า BACKLOG_API_KEY ใน Environment");
  }

  const url = `https://${space}.${BACKLOG_DOMAIN}/api/v2/issues/${issue_key_or_id}`;

  // Backlog Update Issue API ต้องการ application/x-www-form-urlencoded
  const formBody = new URLSearchParams();
  formBody.append("assigneeId", String(assignee_id));
  if (comment) formBody.append("comment", comment);

  const response = await axios.patch(url, formBody.toString(), {
    params: { apiKey },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data;
};
