export interface Project {
  id: number;
  name: string;
  name_en?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  categoryType: string;
  status: string;
  features?: Array<{ is_deleted: boolean }>;
  start_date?: string;
  end_date?: string;
  is_deleted?: boolean;
}

export interface ModalState {
  type: "" | "create" | "edit" | "delete" | "detail";
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
  start_date?: any;
  end_date?: any;
}
