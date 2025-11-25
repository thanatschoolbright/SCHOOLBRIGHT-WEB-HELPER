export type BreakdownRow = {
  date: string;
  weekday_th: string;
  hours: number;
};

export type SummaryRecord = {
  admin_id: number | string;
  full_name: string;
  nickname: string | null;
  employee_code: string | null;
  position: string;
  email: string | null;
  tel: string | null;
  total_hours: number;
  required_hours: number;
  hours_gap: number;
  status_label: string;
  completion_rate: number;
  progress_text: string;
  breakdown: BreakdownRow[];
  rank: number;
};

export type SummaryMetadata = {
  range: {
    start_date: string;
    end_date: string;
    label_th: string;
  };
  working_days: number;
  expected_hours_per_member: number;
  total_expected_hours_all_members: number;
  generated_at: string;
  notes?: string;
};

export type ApiPayload = {
  records: SummaryRecord[];
  metadata: SummaryMetadata;
};

export type ApiResponse = {
  status: number;
  message_th?: string;
  message_en?: string;
  data?: ApiPayload;
};

export type GradeConfig = {
  grade: "A" | "B" | "C" | "D" | "E" | "F";
  min: number;
  color: string;
  label: string;
  icon: React.ReactNode;
};

export type SummaryCardData = {
  title: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  color: string;
};

export type TimesheetFilters = {
  keyword: string;
  dateRange: [any, any];
  status?: string;
};
