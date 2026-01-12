export interface TimesheetEntry {
  id: number;
  date: string;
  project_id: number;
  project_name: string;
  feature_id?: number | null;
  feature_name?: string | null;
  status: string;
  hours: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  category_type?: string;
}

export type SearchableColumnKey =
  | "date"
  | "project_name"
  | "feature_name"
  | "status"
  | "hours"
  | "description";

export interface StatusConfig {
  color: string;
  icon: React.ReactNode;
  text: string;
}

export interface DailySummary {
  date: string;
  totalHours: number;
  entries: TimesheetEntry[];
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  dailySummaries: DailySummary[];
}

export interface TopUsage {
  name: string;
  hours: number;
}

export interface TimesheetFormValues {
  project_id: number;
  sub_project_id?: number;
  description: string;
  work_hour: number;
  status: string;
  date: any;
}

export interface Project {
  id: number;
  name: string;
}

export interface SubProject {
  id: number;
  name: string;
  project_id: number;
}
