export interface TimesheetEntry {
  id: number;
  project_id: number;
  project_name: string;
  feature_id: number;
  feature_name: string;
  date: string;
  hours: string | number;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  category_type?: string;
}

export type SearchableColumnKey = keyof Pick<
  TimesheetEntry,
  "date" | "project_name" | "feature_name" | "description" | "status"
>;

export interface StatusConfig {
  color: string;
  icon: React.ReactNode;
  text: string;
}
