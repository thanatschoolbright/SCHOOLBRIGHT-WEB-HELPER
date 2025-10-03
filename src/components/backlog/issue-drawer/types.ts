import type { Dayjs } from "dayjs";

export type Issue = {
  id: number;
  issueKey: string;
  summary: string;
  description?: string;
  created?: string;
  updated?: string;
  status?: { id: number; name: string };
  priority?: { id: number; name: string };
  assignee?: { id: number; name: string };
  issueType?: { id: number; name: string };
  category?: Array<{ id: number; name: string }>;
  versions?: Array<{ id: number; name: string }>;
  milestone?: Array<{ id: number; name: string }>;
  startDate?: string | null;
  dueDate?: string | null;
};

export type OptionItem = {
  label: string;
  value: number;
};

export type ProjectMetadata = {
  categories: Array<{ id: number; name: string }>;
  milestones: Milestone[];
};

export type Milestone = {
  id: number;
  name: string;
  description?: string | null;
  startDate?: string | null;
  releaseDueDate?: string | null;
  archived?: boolean;
};

export type MilestoneFormValues = {
  name: string;
  description?: string;
  startDate?: Dayjs | null;
  releaseDueDate?: Dayjs | null;
  archived?: boolean;
};

export type BulkUpdatePayload = {
  statusId?: number;
  priorityId?: number;
  startDate?: string | null;
  dueDate?: string | null;
  milestoneId?: number[] | number;
  categoryId?: number[] | number;
};

export type BulkProgressStatus = "idle" | "processing" | "success" | "error";

export type PerIssueUpdateEntry = {
  keyStr: string;
  payload: {
    space: string;
    entries: Array<{
      issueKeyOrId: string | number;
      updates: BulkUpdatePayload;
    }>;
  };
};

export type AiUpdateState = {
  generating: boolean;
  issue: Issue | null;
  newText: string;
  open: boolean;
};
