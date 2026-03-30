import axios from "axios";

/**
 * ดึงข้อมูลวิเคราะห์ประสิทธิภาพรายบุคคลจากระบบ Backlog
 */
export const fetchBacklogAnalytics = async (params: {
  space: string;
  createdSince?: string;
  createdUntil?: string;
  "projectId[]"?: string[];
  "issueTypeId[]"?: string[];
  "priorityId[]"?: string[];
  "statusId[]"?: string[];
  "assigneeId[]"?: string[];
}) => {
  const response = await axios.get("/api/v1/backlog/dashboard/analytics", {
    params,
    paramsSerializer: (p) => {
      const parts: string[] = [];
      for (const [key, value] of Object.entries(p)) {
        if (Array.isArray(value)) {
          value.forEach((v) =>
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`),
          );
        } else if (value !== undefined && value !== null) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`);
        }
      }
      return parts.join("&");
    },
  });
  return response.data;
};

/**
 * ดึงข้อมูล Timeline การส่งต่องาน (Issue Assignment History)
 */
export const fetchIssueTimeline = async (issueKey: string, space: string) => {
  const response = await axios.get("/api/v1/backlog/issues/timeline", {
    params: { issueIdOrKey: issueKey, space },
  });
  return response.data;
};

/**
 * ดึงรายการ Projects ทั้งหมดใน Space
 */
export const fetchProjects = async (space: string) => {
  const response = await axios.get("/api/v1/backlog/projects", {
    params: { space },
  });
  return response.data;
};

/**
 * ดึงประเภท Issue (Issue Types) ของ Project
 */
export const fetchIssueTypes = async (space: string, projectId: string) => {
  const response = await axios.get("/api/v1/backlog/issue-types", {
    params: { space, projectId },
  });
  return response.data;
};

/**
 * ดึงลำดับความสำคัญ (Priorities)
 */
export const fetchPriorities = async (space: string) => {
  const response = await axios.get("/api/v1/backlog/priorities", {
    params: { space },
  });
  return response.data;
};

/**
 * ดึงสถานะงาน (Statuses) ของ Project
 */
export const fetchStatuses = async (space: string, projectId?: string) => {
  const params: Record<string, string> = { space };
  if (projectId) params.projectId = projectId;
  const response = await axios.get("/api/v1/backlog/statuses", { params });
  return response.data;
};

/**
 * ดึงรายชื่อสมาชิกใน Project (Assignees)
 */
export const fetchProjectUsers = async (space: string, projectId: string) => {
  const response = await axios.get("/api/v1/backlog/users", {
    params: { space, projectId },
  });
  return response.data;
};
