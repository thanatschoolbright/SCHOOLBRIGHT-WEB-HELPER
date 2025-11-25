import type { HookAPI } from "antd/es/modal/useModal";

export type IssueOption = {
  label: string;
  value: string | number;
};

export type IssuesPageParams = {
  projectId: number;
  space: string;
  projectReady: boolean;
  modalApi?: HookAPI;
};

export type ProjectMetadataResponse = {
  data?: {
    categories?: { id: number | string; name: string }[];
    milestones?: { id: number | string; name: string }[];
  };
};
