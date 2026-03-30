import type { Dayjs } from "dayjs";

export interface AllIssuesFilters {
  keyword: string;
  projectIds: number[];
  issueTypeIds: number[];
  statusIds: number[];
  priorityIds: number[];
  assigneeIds: number[];
  dateRange: [Dayjs | null, Dayjs | null] | null;
  aiSummaryFilter: "all" | "with_ai" | "without_ai";
}

export interface ProjectOption {
  label: string;
  value: number;
  projectKey: string;
}

export interface IssueOption {
  label: string;
  value: number | string;
}

export interface SummaryStats {
  total: number;
  closed: number;
  progress: number;
}
