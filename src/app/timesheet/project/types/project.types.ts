export interface ProjectAssignee {
  id: number;
  userId: number;
  position?: string;
  profile_image?: any;
}

export interface Project {
  id: number;
  name: string;
  name_en?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
  categoryType: string;
  status: string;
  features?: Array<{
    id: number;
    name: string;
    status: string;
    is_deleted: boolean;
  }>;
  projectAssignees?: ProjectAssignee[];
  start_date?: string;
  end_date?: string;
  completeDate?: string | null;
  estimateWorkhours?: number | null;
  assetCaptureType: "CAPTUREABLE" | "UN_CAPTUREABLE";
  estimate_hour?: number;
  is_deleted?: boolean;
  projectStatusId?: number | null;
}

export interface ModalState {
  type: "" | "create" | "edit" | "delete" | "detail" | "assignees" | "tracking";
  data?: Project | null;
}

export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface FormValues {
  name: string;
  name_en?: string;
  description?: string;
  categoryType: string;
  status: string;
  projectStatusId?: number | null;
  projectStatusId_display?: number | null;
  start_date?: any;
  end_date?: any;
  completeDate?: any;
  estimateWorkhours?: number;
  assetCaptureType?: "CAPTUREABLE" | "UN_CAPTUREABLE";
  assignees?: { userId: number; position?: string }[];
}

export interface ProjectStatus {
  id: number;
  priority: number;
  nameTh: string;
  nameEn?: string | null;
}
