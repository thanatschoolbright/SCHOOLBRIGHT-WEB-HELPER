export interface ProjectAssignee {
  id: number;
  projectId: number;
  featureId: number;
  userId: number;
  position?: string;
}

export interface SubProject {
  id: number;
  name: string;
  name_en?: string;
  ticket_number?: string;
  project_id: number;
  startDate?: string | Date;
  endDate?: string | Date;
  assetCaptureType: "CAPTUREABLE" | "UN_CAPTUREABLE";
  status?: string;
  projectStatusId?: number | null;
  projectStatus?: {
    id: number;
    priority: number;
    nameTh: string;
    nameEn?: string;
  };
  projectAssignees?: ProjectAssignee[];
  backlogDescription?: {
    note?: string;
    backlogs?: Array<{
      title: string;
      link: string;
    }>;
  };
  estimate_sub_feature_workhours?: number; // เพิ่มฟิลด์นี้
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface SubProjectFormValues {
  id?: number;
  name: string;
  name_en?: string;
  ticket_number?: string;
  asset_capture_type: "CAPTUREABLE" | "UN_CAPTUREABLE";
  dateRange: [any, any];
  estimate_time?: string;
  status?: string;
  projectStatusId?: number | null;
  assignees?: { userId: number; position?: string }[];
  backlogDescription?: {
    note?: string;
    backlogs?: Array<{
      title: string;
      link: string;
    }>;
  };
}

export interface SubProjectStats {
  total: number;
  processing: number;
  completed: number;
  totalHours: number;
}

export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface ModalState {
  type: "create" | "edit" | "detail" | "clone" | null;
  data: SubProject | null;
}

export interface ProjectStatus {
  label: string;
  status: "success" | "processing" | "default";
  color: string;
}

export interface WorkingHoursResult {
  hours: number;
  text: string;
}

export interface FilterState {
  searchText: string;
  assetType: string | null;
  statusFilter: string | null;
}
