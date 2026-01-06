"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  Card,
  Skeleton,
  Space,
  Button,
  Typography,
  Flex,
  theme,
  Avatar,
  Statistic,
  DatePicker,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Badge,
  Table,
  Collapse,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FilterOutlined,
  SearchOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SmileOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { toast } from "sonner";
import dayjs, { Dayjs } from "dayjs";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import {
  UpdateUserInput as BaseUpdateUserInput,
  UserProfile as BaseUserProfile,
  UserProfileForm as BaseUserProfileForm,
} from "@stores/type";

// ==========================================
// TYPES
// ==========================================

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

// ==========================================
// HELPERS
// ==========================================

const getPositionTagColor = (position?: string): string => {
  const colorMap: Record<string, string> = {
    ADMIN: "red",
    Manager: "blue",
    Developer: "green",
    QA: "purple",
    Support: "orange",
  };

  if (!position) return "default";
  return colorMap[position] ?? "geekblue";
};

const persistUsersToLocal = (users: UserProfile[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("users", JSON.stringify(users));
};

const filterUsers = (
  users: UserProfile[],
  filters: UserFilters,
  debouncedSearch: string
): UserProfile[] => {
  const query = debouncedSearch.toLowerCase();
  return users.filter((user) => {
    const matchesSearch =
      !query ||
      [
        user.email,
        user.employee_code,
        user.firstname,
        user.lastname,
        user.nickname,
      ]
        .filter(Boolean)
        .some((field) => field?.toLowerCase().includes(query));

    const matchesPosition = filters.position
      ? user.position === filters.position
      : true;

    const matchesDate = (() => {
      if (!filters.dateRange) return true;
      const [start, end] = filters.dateRange;
      if (!start || !end) return true;
      const createdAt =
        (user as Partial<UserProfile>).createdAt ??
        (user as Partial<UserProfile>).updatedAt;
      if (!createdAt) return true;
      const targetDate = dayjs(createdAt);
      if (!targetDate.isValid()) return true;
      const startOfRange = start.startOf("day");
      const endOfRange = end.endOf("day");
      return (
        targetDate.isSame(startOfRange) ||
        targetDate.isSame(endOfRange) ||
        (targetDate.isAfter(startOfRange) && targetDate.isBefore(endOfRange))
      );
    })();

    return matchesSearch && matchesPosition && matchesDate;
  });
};

const buildSummaryMetrics = (
  users: UserProfile[],
  translation: TFunction<"translate">
): UserSummaryMetric[] => {
  const total = users.length;
  const withEmail = users.filter((user) => Boolean(user.email)).length;
  const uniquePositions = new Set(
    users.map((user) => user.position).filter(Boolean)
  ).size;

  return [
    {
      key: "total_users",
      label: translation("user_profile_page.summary_total_users"),
      value: total,
      tone: "primary",
      icon: "👥",
      description: translation("user_profile_page.summary_total_users_desc"),
    },
    {
      key: "contactable",
      label: translation("user_profile_page.summary_contactable"),
      value: withEmail,
      tone: "success",
      icon: "✉️",
      description: translation("user_profile_page.summary_contactable_desc"),
    },
    {
      key: "unique_positions",
      label: translation("user_profile_page.summary_unique_positions"),
      value: uniquePositions,
      tone: "warning",
      icon: "📌",
      description: translation(
        "user_profile_page.summary_unique_positions_desc"
      ),
    },
  ];
};

const formatUserCopyText = (
  user: UserProfile,
  translation: TFunction<"translate">
): string =>
  [
    `╔═══════════════════════════════════════════╗`,
    `   ${translation("user_profile_page.copy_header")}`,
    `╚═══════════════════════════════════════════╝`,
    "",
    `🌐 ${translation("user_profile_page.copy_platforms")}`,
    `   • https://sb-helper.schoolbright.co`,
    `   • https://adminsystem.schoolbright.co`,
    "",
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 ${translation("user_profile_page.copy_name")}`,
    `   ${user.firstname ?? "-"} ${user.lastname ?? "-"}`,
    "",
    `🆔 ${translation("user_profile_page.copy_id")}`,
    `   ${user.admin_id ?? "-"}`,
    "",
    `📧 ${translation("user_profile_page.copy_email")}`,
    `   ${user.email ?? "-"}`,
    "",
    `📱 ${translation("user_profile_page.copy_phone")}`,
    `   ${user.tel ?? "-"}`,
    "",
    `💼 ${translation("user_profile_page.copy_position")}`,
    `   ${user.position ?? "-"}`,
    "",
    `🏷️ ${translation("user_profile_page.copy_employee_code")}`,
    `   ${user.employee_code ?? "-"}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

const extractErrorMessage = (
  error: unknown
): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return { message: JSON.stringify(error) };
};

const showErrorModal = (
  translation: TFunction<"translate">,
  titleKey: string,
  error: unknown
): void => {
  const { message, stack } = extractErrorMessage(error);
  Modal.error({
    title: translation(titleKey),
    content: (
      <div className="space-y-2">
        <Typography.Text type="danger">{message}</Typography.Text>
        <Collapse
          size="small"
          items={[
            {
              key: "details",
              label: translation("user_profile_page.error_view_details"),
              children: (
                <Typography.Paragraph className="whitespace-pre-wrap text-xs">
                  {stack ?? message}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      </div>
    ),
  });
};

// ==========================================
// HOOKS
// ==========================================

const useUserProfileData = (
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

// ==========================================
// SUB-COMPONENTS
// ==========================================

const { Title: HeaderTitle, Text: HeaderText } = Typography;

interface HeaderProps {
  title: string;
  subtitle: string;
  refreshLabel: string;
  onRefresh: () => void;
}

const HeaderSection = ({
  title,
  subtitle,
  refreshLabel,
  onRefresh,
}: HeaderProps) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: "16px 0",
        marginBottom: 8,
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
        {/* Left Side: Title & Description */}
        <Space size={20} align="start">
          <Avatar
            size={54}
            shape="square"
            icon={<TeamOutlined style={{ fontSize: 28 }} />}
            style={{
              backgroundColor: token.colorPrimaryBg,
              color: token.colorPrimary,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${token.colorPrimaryBorder}`,
            }}
          />
          <Flex vertical gap={4}>
            <HeaderTitle
              level={2}
              style={{
                margin: 0,
                letterSpacing: "-0.02em",
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              {title}
            </HeaderTitle>
            <HeaderText
              type="secondary"
              style={{
                fontSize: 15,
                color: token.colorTextDescription,
              }}
            >
              {subtitle}
            </HeaderText>
          </Flex>
        </Space>

        {/* Right Side: Actions */}
        <Space>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            style={{
              borderRadius: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {refreshLabel}
          </Button>
        </Space>
      </Flex>
    </div>
  );
};

interface SummaryCardsProps {
  metrics: UserSummaryMetric[];
}

const SummaryCards = ({ metrics }: SummaryCardsProps) => (
  <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
    {metrics.map((metric) => (
      <Card
        key={metric.key}
        className="group border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <Typography.Text className="text-sm text-slate-500">
              {metric.label}
            </Typography.Text>
            <Statistic
              value={metric.value}
              valueStyle={{
                color:
                  metric.tone === "primary"
                    ? "#1677ff"
                    : metric.tone === "success"
                    ? "#16a34a"
                    : "#d97706",
              }}
            />
            <Typography.Text className="text-xs text-slate-500">
              {metric.description}
            </Typography.Text>
          </div>
          <div className="rounded-full  px-3 py-2 text-lg shadow-inner">
            {metric.icon}
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const { RangePicker } = DatePicker;

interface FiltersProps {
  title: string;
  searchPlaceholder: string;
  positionPlaceholder: string;
  dateRangeLabel: string;
  resetLabel: string;
  filters: UserFilters;
  positions: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPositionChange: (value?: string) => void;
  onDateRangeChange: (value: [Dayjs, Dayjs] | null) => void;
  onReset: () => void;
}

const Filters = ({
  title,
  searchPlaceholder,
  positionPlaceholder,
  dateRangeLabel,
  resetLabel,
  filters,
  positions,
  searchValue,
  onSearchChange,
  onPositionChange,
  onDateRangeChange,
  onReset,
}: FiltersProps) => (
  <Card
    title={
      <Space>
        <FilterOutlined />
        <Typography.Text strong>{title}</Typography.Text>
      </Space>
    }
    className="border-none shadow-sm"
  >
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Space direction="vertical" className="w-full md:max-w-md">
        <Input
          allowClear
          value={searchValue}
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined />}
          onChange={(e) => onSearchChange(e.target.value)}
          className="transition-all duration-200 hover:shadow-sm"
        />
      </Space>
      <Space className="w-full flex-wrap justify-end gap-2 md:w-auto">
        <Select
          allowClear
          className="min-w-[180px]"
          placeholder={positionPlaceholder}
          value={filters.position}
          options={positions.map((pos) => ({ label: pos, value: pos }))}
          onChange={onPositionChange}
        />
        <RangePicker
          value={filters.dateRange ?? null}
          onChange={(dates) =>
            onDateRangeChange(dates as [Dayjs, Dayjs] | null)
          }
          placeholder={[dateRangeLabel, dateRangeLabel]}
          allowClear
          suffixIcon={<CalendarOutlined />}
          className="w-full md:w-auto"
        />
        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={onReset}
          className="transition-all duration-200 hover:shadow"
        >
          {resetLabel}
        </Button>
      </Space>
    </div>
  </Card>
);

const { Text: TableText } = Typography;

interface UsersTableProps {
  data: UserProfile[];
  loading: boolean;
  pageSize: number;
  titles: {
    index: string;
    email: string;
    fullname: string;
    nickname: string;
    position: string;
    phone: string;
    actions: string;
    employeeCode: string;
    empty: string;
    edit: string;
    delete: string;
    copy: string;
  };
  onPageSizeChange: (size: number) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (id: number) => void;
  onCopy: (user: UserProfile) => void;
}

const UsersTable = ({
  data,
  loading,
  pageSize,
  titles,
  onPageSizeChange,
  onEdit,
  onDelete,
  onCopy,
}: UsersTableProps) => {
  const { token } = theme.useToken();

  const handleDirectCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} เรียบร้อยแล้ว`);
  };

  const columns: ColumnsType<UserProfile> = [
    {
      title: titles.index,
      key: "index",
      align: "center",
      width: 70,
      fixed: "left",
      render: (_v, _r, idx) => (
        <TableText type="secondary">{idx + 1}</TableText>
      ),
    },
    {
      title: titles.fullname,
      dataIndex: "fullname",
      fixed: "left",
      width: 250,
      render: (_value, record) => (
        <Space size="middle">
          <Badge
            dot
            status={record.status === "ACTIVE" ? "success" : "default"}
            offset={[-4, 32]}
          >
            <Avatar
              src={record.image_profile}
              style={{
                backgroundColor: token.colorPrimaryBg,
                color: token.colorPrimary,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
              icon={<UserOutlined />}
            >
              {record.firstname?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Flex vertical gap={0}>
            <Space size={4}>
              <TableText strong className="text-sm">
                {record.firstname} {record.lastname}
              </TableText>
              <Tooltip title="คัดลอกชื่อ-สกุล">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <CopyOutlined
                      style={{ fontSize: 11, color: token.colorTextQuaternary }}
                    />
                  }
                  onClick={() =>
                    handleDirectCopy(
                      `${record.firstname} ${record.lastname}`,
                      "ชื่อ-สกุล"
                    )
                  }
                  className="!flex !items-center !justify-center"
                />
              </Tooltip>
            </Space>
            <TableText type="secondary" className="text-[11px]">
              {titles.nickname}: {record.nickname || "-"}
            </TableText>
          </Flex>
        </Space>
      ),
      sorter: (a, b) =>
        `${a.firstname} ${a.lastname}`.localeCompare(
          `${b.firstname} ${b.lastname}`
        ),
    },
    {
      title: "ข้อมูลติดต่อ",
      key: "contact",
      width: 280,
      render: (_value, record) => (
        <Flex vertical gap={4}>
          <Space size={8}>
            <MailOutlined
              style={{ color: token.colorTextTertiary, fontSize: 12 }}
            />
            <TableText className="text-xs">{record.email}</TableText>
            <Tooltip title="คัดลอกอีเมล">
              <Button
                type="text"
                size="small"
                className="!p-0 !h-auto"
                icon={
                  <CopyOutlined
                    style={{ fontSize: 10, color: token.colorPrimary }}
                  />
                }
                onClick={() => handleDirectCopy(record.email || "", "อีเมล")}
              />
            </Tooltip>
          </Space>
          <Space size={8}>
            <PhoneOutlined
              style={{ color: token.colorTextTertiary, fontSize: 12 }}
            />
            <TableText type="secondary" className="text-xs">
              {record.tel || "-"}
            </TableText>
          </Space>
        </Flex>
      ),
    },
    {
      title: titles.position,
      dataIndex: "position",
      width: 150,
      render: (value: string) => (
        <Tag
          bordered={false}
          style={{
            backgroundColor: token.colorPrimaryBg,
            color: token.colorPrimary,
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          {value || "-"}
        </Tag>
      ),
      sorter: (a, b) => (a.position ?? "").localeCompare(b.position ?? ""),
    },
    {
      title: titles.employeeCode,
      dataIndex: "employee_code",
      width: 140,
      render: (value: string) => (
        <Space size={4}>
          <IdcardOutlined style={{ color: token.colorTextQuaternary }} />
          <TableText code className="text-[12px]">
            {value || "-"}
          </TableText>
        </Space>
      ),
    },
    {
      title: titles.actions,
      key: "actions",
      align: "center",
      width: 160,
      fixed: "right",
      render: (_value, record) => (
        <Space size="small">
          <Tooltip title={titles.copy}>
            <Button
              type="text"
              shape="circle"
              icon={<FileTextOutlined style={{ color: token.colorInfo }} />}
              onClick={() => onCopy(record)}
            />
          </Tooltip>
          <Tooltip title={titles.edit}>
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title={titles.delete}>
            <Button
              type="text"
              shape="circle"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
      }}
    >
      <Table<UserProfile>
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={(record) =>
          record.id || record.email || Math.random().toString()
        }
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          onShowSizeChange: (_current, size) => onPageSizeChange(size),
          position: ["bottomRight"],
          className: "pr-4 pb-4",
        }}
        locale={{ emptyText: titles.empty }}
        scroll={{ x: 1100 }}
        style={{ borderRadius: token.borderRadiusLG }}
      />
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <Card className="border-dashed bg-gradient-to-b from-slate-50 to-white text-center shadow-none">
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
        <FileSearchOutlined className="text-2xl" />
      </div>
      <Typography.Title level={4} className="!mb-1">
        {title}
      </Typography.Title>
      <Typography.Text type="secondary">{description}</Typography.Text>
      {onAction ? (
        <Button type="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  </Card>
);

interface CreateUserModalProps {
  open: boolean;
  translation: TFunction<"translate">;
  onCancel: () => void;
  onSubmit: (payload: UpsertUserPayload) => Promise<void>;
}

const CreateUserModal = ({
  open,
  translation,
  onCancel,
  onSubmit,
}: CreateUserModalProps) => {
  const [form] = Form.useForm<UpsertUserPayload>();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values: UpsertUserPayload) => {
    try {
      await onSubmit({
        username: values.username.trim(),
        password: values.password?.trim(),
        name: values.name.trim(),
        lastname: values.lastname.trim(),
      });
      toast.success(translation("user_profile_page.toast_create_success"));
    } catch (err) {
      toast.error(translation("user_profile_page.toast_create_error"));
      throw err;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={translation("user_profile_page.create_modal_title")}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label={translation("user_profile_page.username_label")}
          name="username"
          rules={[
            {
              required: true,
              message: translation("user_profile_page.username_required"),
            },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.username_placeholder")}
            prefix={<InfoCircleOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.password_label")}
          name="password"
          rules={[
            {
              required: true,
              message: translation("user_profile_page.password_required"),
            },
            { min: 6, message: translation("user_profile_page.password_min") },
          ]}
        >
          <Input.Password
            placeholder={translation("user_profile_page.password_placeholder")}
            prefix={<LockOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.firstname_label")}
          name="name"
          rules={[
            {
              required: true,
              message: translation("user_profile_page.firstname_required"),
            },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.firstname_placeholder")}
            prefix={<EditOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.lastname_label")}
          name="lastname"
          rules={[
            {
              required: true,
              message: translation("user_profile_page.lastname_required"),
            },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.lastname_placeholder")}
            prefix={<EditOutlined />}
          />
        </Form.Item>
        <Form.Item>
          <Space className="flex w-full justify-end">
            <Button onClick={onCancel}>
              {translation("user_profile_page.cancel_button")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<CheckCircleOutlined />}
            >
              {translation("user_profile_page.save_button")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

interface EditUserModalProps {
  open: boolean;
  translation: TFunction<"translate">;
  positions: string[];
  user: UserProfile | null;
  onCancel: () => void;
  onSubmit: (payload: UpdateUserInput) => Promise<void>;
}

interface EditFormValues {
  admin_id: number | string;
  employee_code?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  position?: string;
  email?: string;
  backlog_email?: string;
  tel?: string;
}

const EditUserModal = ({
  open,
  translation,
  positions,
  user,
  onCancel,
  onSubmit,
}: EditUserModalProps) => {
  const [form] = Form.useForm<EditFormValues>();

  useEffect(() => {
    console.info("user", user);
    if (open && user) {
      form.setFieldsValue({
        admin_id: user.admin_id,
        employee_code: user.employee_code,
        firstname: user.firstname,
        lastname: user.lastname,
        nickname: user.nickname,
        position: user.position,
        email: user.email,
        backlog_email: user.backlog_email,
        tel: user.tel,
      });
    } else {
      form.resetFields();
    }
  }, [form, open, user]);

  const handleFinish = async (values: EditFormValues) => {
    if (!user) return;
    try {
      await onSubmit({
        admin_id: Number(values.admin_id),
        employee_code: values.employee_code ?? "",
        firstname: values.firstname ?? "",
        lastname: values.lastname ?? "",
        nickname: values.nickname ?? "",
        position: values.position ?? "",
        email: values.email ?? "",
        backlog_email: values.backlog_email ?? "",
        tel: values.tel ?? "",
      });
      toast.success(translation("user_profile_page.toast_update_success"));
    } catch (err) {
      toast.error(translation("user_profile_page.toast_update_error"));
      throw err;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={translation("user_profile_page.edit_modal_title")}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="admin_id" hidden>
          <Input type="hidden" />
        </Form.Item>

        <Form.Item
          label={translation("user_profile_page.firstname_label")}
          name="firstname"
          rules={[
            {
              required: true,
              message: translation("user_profile_page.firstname_required"),
            },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.firstname_placeholder")}
            prefix={<UserOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.lastname_label")}
          name="lastname"
          rules={[
            {
              required: true,
              message: translation("user_profile_page.lastname_required"),
            },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.lastname_placeholder")}
            prefix={<UserOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.nickname_label")}
          name="nickname"
        >
          <Input
            placeholder={translation("user_profile_page.nickname_placeholder")}
            prefix={<SmileOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.employee_code_label")}
          name="employee_code"
        >
          <Input
            placeholder={translation(
              "user_profile_page.employee_code_placeholder"
            )}
            prefix={<IdcardOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.position_label")}
          name="position"
        >
          <Select
            allowClear
            options={positions.map((pos) => ({ label: pos, value: pos }))}
            placeholder={translation("user_profile_page.position_placeholder")}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.email_label")}
          name="email"
          rules={[
            {
              type: "email",
              message: translation("user_profile_page.email_invalid"),
            },
          ]}
        >
          <Input
            placeholder={translation("user_profile_page.email_placeholder")}
            prefix={<MailOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.backlog_email_label")}
          name="backlog_email"
          rules={[
            {
              type: "email",
              message: translation("user_profile_page.email_invalid"),
            },
          ]}
        >
          <Input
            placeholder={translation(
              "user_profile_page.backlog_email_placeholder"
            )}
            prefix={<MailOutlined />}
          />
        </Form.Item>
        <Form.Item
          label={translation("user_profile_page.tel_label")}
          name="tel"
        >
          <Input
            placeholder={translation("user_profile_page.tel_placeholder")}
            prefix={<PhoneOutlined />}
          />
        </Form.Item>
        <Form.Item>
          <Space className="flex w-full justify-end">
            <Button onClick={onCancel}>
              {translation("user_profile_page.cancel_button")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<CheckCircleOutlined />}
            >
              {translation("user_profile_page.save_button")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

interface DeleteUserModalProps {
  open: boolean;
  confirmText: string;
  translation: TFunction<"translate">;
  keyword: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onConfirmTextChange: (value: string) => void;
}

const DeleteUserModal = ({
  open,
  confirmText,
  translation,
  keyword,
  onCancel,
  onConfirm,
  onConfirmTextChange,
}: DeleteUserModalProps) => (
  <Modal
    open={open}
    onCancel={onCancel}
    onOk={onConfirm}
    okText={translation("user_profile_page.delete_button")}
    cancelText={translation("user_profile_page.cancel_button")}
    title={translation("user_profile_page.delete_modal_title")}
    okButtonProps={{
      disabled: confirmText !== keyword,
      className: "bg-rose-500",
    }}
    destroyOnHidden
  >
    <div className="space-y-2">
      <Typography.Text type="danger" className="flex items-center gap-2">
        <ExclamationCircleOutlined />
        {translation("user_profile_page.delete_modal_description")}
      </Typography.Text>
      <Typography.Text>
        {translation("user_profile_page.delete_modal_instruction")}{" "}
        <Typography.Text strong className="text-rose-500">
          {keyword}
        </Typography.Text>
      </Typography.Text>
      <Input
        value={confirmText}
        placeholder={translation("user_profile_page.delete_modal_placeholder")}
        onChange={(e) => onConfirmTextChange(e.target.value)}
      />
    </div>
  </Modal>
);

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function Page() {
  const { t: TRANSLATION } = useTranslation("translate");
  const {
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
  } = useUserProfileData(TRANSLATION);

  const deleteKeyword = TRANSLATION("user_profile_page.delete_keyword");

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <div className="space-y-4">
          {/* Header Section */}
          <HeaderSection
            title={TRANSLATION("user_profile_page.title")}
            subtitle={TRANSLATION("user_profile_page.subtitle")}
            refreshLabel={TRANSLATION("user_profile_page.refresh")}
            onRefresh={refreshData}
          />

          {/* Summary Cards */}
          <SummaryCards metrics={summaryMetrics} />

          {/* Filters */}
          <Filters
            title={TRANSLATION("user_profile_page.filter_title")}
            searchPlaceholder={TRANSLATION(
              "user_profile_page.search_placeholder"
            )}
            positionPlaceholder={TRANSLATION(
              "user_profile_page.position_placeholder"
            )}
            dateRangeLabel={TRANSLATION("user_profile_page.date_range_label")}
            resetLabel={TRANSLATION("user_profile_page.reset_filters")}
            filters={filters}
            positions={positions}
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            onPositionChange={handlePositionChange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetFilters}
          />

          {/* Table Section */}
          <Card
            title={
              <Space className="justify-between">
                {TRANSLATION("user_profile_page.table_title")}
                <span className="text-sm text-slate-500">
                  {TRANSLATION("user_profile_page.total_records", {
                    total: filteredUsers.length,
                  })}
                </span>
              </Space>
            }
            className="border-none shadow-sm"
            extra={
              <Space>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  {TRANSLATION("user_profile_page.add_user")}
                </button>
              </Space>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                title={
                  hasError
                    ? TRANSLATION("user_profile_page.error_title")
                    : TRANSLATION("user_profile_page.empty_title")
                }
                description={
                  hasError
                    ? TRANSLATION("user_profile_page.error_description")
                    : TRANSLATION("user_profile_page.empty_description")
                }
                actionLabel={TRANSLATION("user_profile_page.refresh")}
                onAction={refreshData}
              />
            ) : (
              <UsersTable
                data={filteredUsers}
                loading={loading}
                pageSize={pageSize}
                titles={{
                  index: TRANSLATION("user_profile_page.table_index"),
                  email: TRANSLATION("user_profile_page.table_email"),
                  fullname: TRANSLATION("user_profile_page.table_fullname"),
                  nickname: TRANSLATION("user_profile_page.table_nickname"),
                  position: TRANSLATION("user_profile_page.table_position"),
                  phone: TRANSLATION("user_profile_page.table_phone"),
                  actions: TRANSLATION("user_profile_page.table_actions"),
                  employeeCode: TRANSLATION(
                    "user_profile_page.table_employee_code"
                  ),
                  empty: TRANSLATION("user_profile_page.empty_description"),
                  edit: TRANSLATION("user_profile_page.edit_action"),
                  delete: TRANSLATION("user_profile_page.delete_action"),
                  copy: TRANSLATION("user_profile_page.copy_action"),
                }}
                onPageSizeChange={handlePageSizeChange}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onCopy={handleCopyUser}
              />
            )}
          </Card>

          {/* Modal Section */}
          <CreateUserModal
            open={modalState.type === "create"}
            translation={TRANSLATION}
            onCancel={closeModal}
            onSubmit={submitCreateUser}
          />
          <EditUserModal
            open={modalState.type === "edit"}
            translation={TRANSLATION}
            positions={positions}
            user={selectedUser}
            onCancel={closeModal}
            onSubmit={submitUpdateUser}
          />
          <DeleteUserModal
            open={modalState.type === "delete"}
            translation={TRANSLATION}
            confirmText={confirmDeleteText}
            keyword={deleteKeyword}
            onCancel={closeModal}
            onConfirm={submitDeleteUser}
            onConfirmTextChange={setConfirmDeleteText}
          />
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
