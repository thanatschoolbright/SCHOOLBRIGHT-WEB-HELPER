export interface TimelineProject {
  
}

export interface TimelineItem {
  id: string;
  realId: number;
  type: "project" | "sub-project";
  name: string;
  start: string | null;
  end: string | null;
  status: string;
  progress?: number;
  children?: TimelineItem[];
  projectId?: number;
  description?: string;
  categoryType?: number;
  assetCaptureType?: string;
}

export interface TimelineMetrics {
  totalProjects: number;
  totalSubProjects: number;
  overdue: number;
  completed: number;
  inProgress: number;
}

export interface TimelineFilters {
  status: string;
  keyword: string;
  viewType: "all" | "project";
  dateRange: [any, any] | null;
  zoomLevel: "day" | "week" | "month";
}

export interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  type: "project" | "sub-project";
  initialValues?: any;
  parentId?: number;
}
