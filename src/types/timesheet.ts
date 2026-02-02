export interface SummaryRecord {
  admin_id: number;
  full_name: string;
  nickname: string | null;
  employee_code: string | null;
  position: string | null;
  total_hours: number;
  expected_hours: number;
  completion_rate: number;
  rank: string;
  rank_description: string;
  order: number;
}

export interface SummaryMetadata {
  range?: {
    start_date?: string;
    end_date?: string;
    label_th?: string;
  };
  working_days?: number;
  working_days_full_month?: number;
  expected_hours_per_member?: number;
  generated_at?: string;
  notes?: string;
}

export interface ApiResponse {
  status?: number;
  data?: {
    records?: SummaryRecord[];
    metadata?: SummaryMetadata;
  };
}
