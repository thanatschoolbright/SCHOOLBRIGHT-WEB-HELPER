import { useCallback, useEffect, useMemo, useState } from "react";
import { Dayjs } from "dayjs";
import { toast } from "sonner";
import { TFunction } from "i18next";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import {
  ModalState,
  UpdateUserInput,
  UpsertUserPayload,
  UseUserProfileDataResult,
  UserFilters,
  UserProfile,
} from "../types/user-profile.types";
import {
  buildSummaryMetrics,
  filterUsers,
  formatUserCopyText,
  persistUsersToLocal,
  showErrorModal,
} from "../utils/user-profile.helpers";

export const useUserProfileData = (
  translation: TFunction<"translate">
): UseUserProfileDataResult => {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: "",
    position: undefined,
    dateRange: null,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [modalState, setModalState] = useState<ModalState>({ type: "" });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [hasError, setHasError] = useState<boolean>(false);

  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/admin/user/");
      const fetchedUsers: UserProfile[] = response?.data?.data?.data ?? [];
      setUsers(fetchedUsers);
      persistUsersToLocal(fetchedUsers);
      setHasError(false);
    } catch (error) {
      setUsers([]);
      setHasError(true);
      showErrorModal(translation, "user_profile_page.error_load_users", error);
    } finally {
      setLoading(false);
    }
  }, [translation]);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await axios.get("/api/v1/admin/user/constants/position");
      const result: string[] = response?.data?.data?.response?.data ?? [];
      setPositions(result);
    } catch (error) {
      setPositions([]);
      showErrorModal(
        translation,
        "user_profile_page.error_load_positions",
        error
      );
    }
  }, [translation]);

  const fetchUserDetail = useCallback(
    async (userId: string | number) => {
      if (!userId) {
        setSelectedUser(null);
        return;
      }

      try {
        const response = await axios.get(`/api/v1/admin/user/read/${userId}`);
        const payload: UserProfile[] = response?.data?.data ?? [];
        console.debug(
          "fetchUserDetail: requested",
          userId,
          "payload length",
          payload?.length
        );
        let result: UserProfile | undefined;
        if (Array.isArray(payload)) {
          result = payload.find(
            (u) =>
              String(u.admin_id) === String(userId) ||
              String((u as any).id) === String(userId) ||
              String(u.email) === String(userId)
          );
          // fallback to first item if only one returned
          if (!result && payload.length === 1) result = payload[0];
        } else {
          result = payload as unknown as UserProfile;
        }

        if (result) {
          console.debug(
            "fetchUserDetail: matched user",
            result?.admin_id ?? result?.id ?? result?.email
          );
          setSelectedUser(result);
          setHasError(false);
        } else {
          console.debug(
            "fetchUserDetail: no match, keeping current selectedUser"
          );
          // keep current selectedUser (do not overwrite) when API doesn't return matching user
        }
      } catch (error) {
        showErrorModal(
          translation,
          "user_profile_page.error_load_user_detail",
          error
        );
        setHasError(true);
        // do not clear selectedUser on error to avoid losing clicked item
      }
    },
    [translation]
  );

  useEffect(() => {
    void fetchUsers();
    void fetchPositions();
  }, [fetchPositions, fetchUsers]);

  const filteredUsers = useMemo(
    () => filterUsers(users, filters, debouncedSearch),
    [users, filters, debouncedSearch]
  );

  const summaryMetrics = useMemo(
    () => buildSummaryMetrics(users, translation),
    [users, translation]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handlePositionChange = (value?: string) => {
    setFilters((prev) => ({ ...prev, position: value }));
  };

  const handleDateRangeChange = (value: [Dayjs, Dayjs] | null) => {
    setFilters((prev) => ({ ...prev, dateRange: value }));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters({
      searchTerm: "",
      position: undefined,
      dateRange: null,
    });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setModalState({ type: "create" });
  };

  const openEditModal = async (user: UserProfile) => {
    // Set clicked user immediately to avoid showing stale data in modal
    setSelectedUser(user);
    setModalState({ type: "edit" });

    // If we have a definitive admin_id, try to fetch latest details from API
    if (user.admin_id) {
      await fetchUserDetail(user.admin_id);
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteUserId(id);
    setConfirmDeleteText("");
    setModalState({ type: "delete" });
  };

  const closeModal = () => {
    setModalState({ type: "" });
    setConfirmDeleteText("");
    setSelectedUser(null);
    setDeleteUserId(null);
  };

  const submitCreateUser = async (payload: UpsertUserPayload) => {
    try {
      await axios.post("/api/v1/admin/user/create", payload, {
        headers: {
          "Content-Type": "application/json",
          "JabjaiKey-0-0": "",
        },
      });
      closeModal();
      await fetchUsers();
    } catch (error) {
      showErrorModal(
        translation,
        "user_profile_page.toast_create_error",
        error
      );
    }
  };

  const submitUpdateUser = async (payload: UpdateUserInput) => {
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value != null ? String(value) : "");
      });

      await axios.post("/api/v1/admin/user/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      closeModal();
      await fetchUsers();
    } catch (error) {
      showErrorModal(
        translation,
        "user_profile_page.toast_update_error",
        error
      );
    }
  };

  const submitDeleteUser = async () => {
    if (!deleteUserId) return;
    if (!adminId) {
      showErrorModal(
        translation,
        "user_profile_page.error_missing_admin",
        "Missing admin id"
      );
      return;
    }

    try {
      await axios.post(
        "/api/v1/timesheet/project/delete/",
        {
          id: deleteUserId,
          by: adminId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(translation("user_profile_page.toast_delete_success"));
      closeModal();
      setDeleteUserId(null);
      await fetchUsers();
    } catch (error) {
      showErrorModal(
        translation,
        "user_profile_page.toast_delete_error",
        error
      );
    }
  };

  const refreshData = async () => {
    await fetchUsers();
    await fetchPositions();
  };

  const handleCopyUser = async (user: UserProfile) => {
    try {
      const textFormat = formatUserCopyText(user, translation);
      await navigator.clipboard.writeText(textFormat);
      toast.success(translation("user_profile_page.toast_copy_success"));
    } catch (error) {
      showErrorModal(translation, "user_profile_page.toast_copy_error", error);
    }
  };

  return {
    loading,
    filteredUsers,
    positions,
    filters,
    summaryMetrics,
    modalState,
    selectedUser,
    confirmDeleteText,
    searchTerm,
    pageSize,
    hasError,
    handleSearchChange,
    handlePositionChange,
    handleDateRangeChange,
    handleResetFilters,
    handlePageSizeChange,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
    submitCreateUser,
    submitUpdateUser,
    submitDeleteUser,
    setConfirmDeleteText,
    refreshData,
    handleCopyUser,
  };
};
