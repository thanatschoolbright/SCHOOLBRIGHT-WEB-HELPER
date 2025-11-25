import { ReactNode } from "react";
import { Dayjs } from "dayjs";
import {
  UpdateUserInput as BaseUpdateUserInput,
  UserProfile as BaseUserProfile,
  UserProfileForm as BaseUserProfileForm,
} from "@stores/type";

export type UserProfile = BaseUserProfile;
export type UserProfileForm = BaseUserProfileForm;
export type UpdateUserInput = BaseUpdateUserInput;

export type ModalType = "" | "create" | "edit" | "delete";

export interface UserFilters {
  searchTerm: string;
  position?: string;
  dateRange: [Dayjs, Dayjs] | null;
}

export interface UserSummaryMetric {
  key: string;
  label: string;
  value: number;
  tone: "primary" | "warning" | "success";
  icon: ReactNode;
  description: string;
}

export interface ModalState {
  type: ModalType;
}

export interface UpsertUserPayload {
  username: string;
  password?: string;
  name: string;
  lastname: string;
}

export interface UseUserProfileDataResult {
  loading: boolean;
  filteredUsers: UserProfile[];
  positions: string[];
  filters: UserFilters;
  summaryMetrics: UserSummaryMetric[];
  modalState: ModalState;
  selectedUser: UserProfile | null;
  confirmDeleteText: string;
  searchTerm: string;
  pageSize: number;
  hasError: boolean;
  handleSearchChange: (value: string) => void;
  handlePositionChange: (value?: string) => void;
  handleDateRangeChange: (value: [Dayjs, Dayjs] | null) => void;
  handleResetFilters: () => void;
  handlePageSizeChange: (size: number) => void;
  openCreateModal: () => void;
  openEditModal: (user: UserProfile) => Promise<void>;
  openDeleteModal: (id: number) => void;
  closeModal: () => void;
  submitCreateUser: (payload: UpsertUserPayload) => Promise<void>;
  submitUpdateUser: (payload: UpdateUserInput) => Promise<void>;
  submitDeleteUser: () => Promise<void>;
  setConfirmDeleteText: (value: string) => void;
  refreshData: () => Promise<void>;
  handleCopyUser: (user: UserProfile) => Promise<void>;
}
