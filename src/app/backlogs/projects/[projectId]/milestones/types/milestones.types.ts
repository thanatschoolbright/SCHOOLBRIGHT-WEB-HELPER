"use client";

import type { Dayjs } from "dayjs";

export type Milestone = {
  id: number;
  projectId: number;
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
  archived: boolean;
};
