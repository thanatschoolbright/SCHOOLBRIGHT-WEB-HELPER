import axios from "axios";

export interface CrmSummary {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export interface CrmItem {
  id: number;
  issue_date: string;
  school_id: number;
  channel: string | null;
  contact_id: string | null;
  type: string | null;
  sub_type: string | null;
  ref_code: string | null;
  support_detail: string | null;
  subject: string;
  question: string | null;
  answer: string | null;
  is_follow_up: boolean;
  follow_up_date: string | null;
  status: string | null;
  priority: string | null;
  backlog_project_id: number | null;
  backlog_issue_id: number | null;
  assign_staff_id: number | null;
  note: string | null;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  is_deleted: boolean;
  creator?: {
    id: number;
    firstname_th: string | null;
    lastname_th: string | null;
    employee_code: string | null;
  };
  updater?: {
    id: number;
    firstname_th: string | null;
    lastname_th: string | null;
    employee_code: string | null;
  };
}

export interface CrmListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  priority?: string;
  channel?: string;
  type?: string;
  sub_type?: string;
  school_id?: number;
  assign_staff_id?: number;
  created_by?: number;
  issue_date_from?: string;
  issue_date_to?: string;
  tab?: "all" | "upcoming" | "follow_up" | "overdue";
}

export interface CrmListResponse {
  summary: CrmSummary;
  items: CrmItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// ดึงรายการเคส CRM Support พร้อม Summary Dashboard
export const responseCrmList = async (
  params: CrmListParams,
): Promise<CrmListResponse> => {
  const { data } = await axios.get("/api/v1/support/crm/read", { params });
  return data.data;
};

// สร้างเคส CRM Support ใหม่
export const requestCreateCrmCase = async (
  payload: Record<string, unknown>,
): Promise<CrmItem> => {
  const { data } = await axios.post("/api/v1/support/crm/create", payload);
  return data.data;
};

// อัปเดตข้อมูลเคส CRM Support
export const requestUpdateCrmCase = async (
  payload: Record<string, unknown>,
): Promise<CrmItem> => {
  const { data } = await axios.patch("/api/v1/support/crm/update", payload);
  return data.data;
};

// ลบเคส CRM Support แบบ Soft Delete
export const requestDeleteCrmCase = async (
  id: number,
  deleted_by?: number,
): Promise<void> => {
  await axios.delete("/api/v1/support/crm/delete", {
    data: { id, deleted_by },
  });
};
