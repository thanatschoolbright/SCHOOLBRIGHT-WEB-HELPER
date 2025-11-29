export interface OvertimeRecord {
  id: string | number;
  requester_id?: string;
  request_date?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  descriptions?: OvertimeDescription[];
  [key: string]: any;
}

export interface OvertimeDescription {
  id?: string | number;
  date?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  description?: string;
  assignee?: string;
}

export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface OvertimeStats {
  total: number;
  pending: number;
  approved: number;
}

export const OT_STATUS = [
  {
    text: "รออนุมัติ",
    value: "pending",
    color: "gold",
  },
  {
    text: "อนุมัติ",
    value: "approved",
    color: "green",
  },
  {
    text: "ปฏิเสธ",
    value: "rejected",
    color: "red",
  },
];
