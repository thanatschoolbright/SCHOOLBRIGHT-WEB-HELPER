"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Form,
  Input,
  AutoComplete,
  DatePicker,
  Select,
  Dropdown,
  Row,
  Col,
  Modal,
  Table,
  Space,
  Descriptions,
  Divider,
  List,
  Typography,
  Tag,
  Skeleton,
  Badge,
  Tooltip,
  Affix,
  ConfigProvider,
  Empty,
  Collapse,
  theme,
  Avatar,
  Statistic,
} from "antd";
import type { InputRef, MenuProps, TableProps } from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  EyeOutlined,
  FilePdfOutlined,
  MailOutlined,
  CheckOutlined,
  DeleteOutlined,
  MoreOutlined,
  TeamOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useAppSelector } from "@/stores/store";
import { getUserById, getUserData } from "@helpers/local_storage/user.storage";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { HeaderBar } from "@components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import ConfirmDelete from "@/components/popup/confirm-delete-component";
import type { SelectOption, UserProfile } from "@stores/type";
import type { TimesheetEntry } from "@/types/timesheet-table.types";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

// * ----------------------------------------------------------------------
// * Interfaces & Constants
// * ----------------------------------------------------------------------

interface OvertimeRecord {
  id: string | number;
  requester_id?: string;
  request_date?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  descriptions?: OvertimeDescription[];
  [key: string]: any;
}

interface OvertimeDescription {
  id?: string | number;
  date?: string;
  duration?: number;
  description?: string;
  assignee?: string;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const BYPASS_ADMIN_ID = "117";
const DEFAULT_HR_EMAIL =
  process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co";

export const OT_STATUS = [
  {
    text: "รออนุมัติ",
    value: "pending",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  {
    text: "อนุมัติ",
    value: "approved",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  {
    text: "ปฏิเสธ",
    value: "rejected",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
];

// * ----------------------------------------------------------------------
// * Helper Functions
// * ----------------------------------------------------------------------

const getCurrentUserId = async (authentication: any): Promise<string> => {
  try {
    const authId = authentication?.response?.data?.user_data?.admin_id;
    if (authId) return String(authId);

    const users = await getUserData();
    if (Array.isArray(users) && users.length > 0) {
      return String(users[0].admin_id ?? users[0].id ?? "system");
    }
  } catch (error) {
    console.error("Error getting current user ID:", error);
  }
  return "system";
};

const handleError = (error: any, title: string = "เกิดข้อผิดพลาด") => {
  console.error(error);
  Modal.error({
    title: (
      <Space>
        <WarningOutlined className="text-red-500" /> {title}
      </Space>
    ),
    content: (
      <div>
        <Text>ระบบไม่สามารถดำเนินการได้ในขณะนี้</Text>
        <Collapse ghost size="small" className="mt-2">
          <Collapse.Panel
            header="ดูรายละเอียดเพิ่มเติม (Technical Details)"
            key="1"
          >
            <Paragraph className="font-mono text-xs text-red-500 bg-red-50 p-2 rounded">
              {error?.message || JSON.stringify(error)}
            </Paragraph>
          </Collapse.Panel>
        </Collapse>
      </div>
    ),
    okText: "รับทราบ",
  });
};

// * ----------------------------------------------------------------------
// * Components
// * ----------------------------------------------------------------------

/**
 * * Component: SummaryCard
 * * Displays a metric with an icon and trend/status style.
 */
const SummaryCard = ({
  title,
  value,
  icon,
  color,
  loading,
  subValue,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  subValue?: string;
}) => {
  const { token } = useToken();

  return (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-all duration-300 h-full border-b-4"
      style={{ borderBottomColor: color, borderRadius: token.borderRadiusLG }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div>
            <Text
              type="secondary"
              className="text-sm font-medium uppercase tracking-wide"
            >
              {title}
            </Text>
            <div className="mt-1">
              <Text strong style={{ fontSize: "28px", lineHeight: 1.2 }}>
                {value}
              </Text>
            </div>
            {subValue && (
              <div className="mt-1">
                <Text type="secondary" className="text-xs">
                  {subValue}
                </Text>
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            <span style={{ fontSize: "24px" }}>{icon}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

// * ----------------------------------------------------------------------
// * Main Page Component
// * ----------------------------------------------------------------------

export default function OvertimeManagementPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { token } = useToken();
  const authentication = useAppSelector((state) => state.callAdminLogin);
  const searchInputRef = useRef<InputRef | null>(null);

  // * State
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<OvertimeRecord | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<OvertimeRecord[]>([]);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [descriptionOptions, setDescriptionOptions] = useState<SelectOption[]>(
    []
  );
  const [paginationState, setPaginationState] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [processedItems, setProcessedItems] = useState<Set<React.Key>>(
    new Set()
  );
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  const [batchSelectedStatus, setBatchSelectedStatus] =
    useState<string>("approved");
  const [searchText, setSearchText] = useState("");

  // * Computed Stats
  const stats = useMemo(() => {
    const total = paginationState.total;
    const pending = dataSource.filter(
      (item) => item.status === "pending"
    ).length; // Note: Only for current page
    const approved = dataSource.filter(
      (item) => item.status === "approved"
    ).length; // Note: Only for current page

    return { total, pending, approved };
  }, [dataSource, paginationState.total]);

  // * Data Fetching
  const fetchUserList = useCallback(async () => {
    try {
      const users = await getUserData();
      const options = users.map((user: UserProfile) => ({
        label: `${user.firstname} ${user.lastname}`,
        value: user.admin_id,
      }));
      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  }, []);

  const fetchDescriptionList = useCallback(async () => {
    try {
      const payload = {
        limit: 30,
        page: 1,
        user_id: authentication?.response?.data?.user_data?.admin_id || "0",
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/entry/read/",
        payload
      );
      const result = response?.data ?? {};
      const items = result?.data ?? [];

      const options = items.map((item: TimesheetEntry) => ({
        label: item.description,
        value: item.description,
      }));

      const uniqueOptions = options.reduce(
        (acc: SelectOption[], cur: SelectOption) => {
          if (!acc.find((item) => item.value === cur.value)) {
            acc.push(cur);
          }
          return acc;
        },
        []
      );

      setDescriptionOptions(uniqueOptions);
    } catch (error) {
      console.error("Error fetching description list:", error);
    }
  }, [authentication]);

  const fetchOvertimeList = useCallback(
    async (options?: {
      page?: number;
      pageSize?: number;
      filters?: any;
      id?: string | number;
    }) => {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? paginationState.pageSize;
      const filters = options?.filters ?? {};
      const id = options?.id;

      try {
        setLoading(true);

        const currentUserId = await getCurrentUserId(authentication);
        const isBypassUser = currentUserId === BYPASS_ADMIN_ID;

        const payload = id
          ? isBypassUser
            ? { id: String(id) }
            : { id: String(id), request_id: currentUserId }
          : isBypassUser
          ? {
              limit: pageSize,
              offset: (page - 1) * pageSize,
              ...filters,
            }
          : {
              limit: pageSize,
              offset: (page - 1) * pageSize,
              request_id: currentUserId,
              ...filters,
            };

        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          payload
        );
        const body = response?.data;

        if (!body || body.status !== 200) {
          throw new Error(body?.message_th || "ไม่สามารถดึงข้อมูลโอทีได้");
        }

        const items = Array.isArray(body.data) ? body.data : [];

        if (id) {
          return items;
        }

        setDataSource(items.map((item: any) => ({ key: item.id, ...item })));
        setPaginationState({
          current: body.pagination?.page ?? page,
          pageSize: body.pagination?.page_size ?? pageSize,
          total: body.pagination?.total ?? items.length,
        });

        return items;
      } catch (error) {
        handleError(error, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authentication, paginationState.pageSize]
  );

  useEffect(() => {
    fetchUserList();
    fetchDescriptionList();
    fetchOvertimeList();
  }, [fetchUserList, fetchDescriptionList, fetchOvertimeList]);

  // * Actions
  const createOvertime = async (payload: any) => {
    try {
      setLoading(true);
      const adminId = await getCurrentUserId(authentication);
      const bodyPayload = {
        ...payload,
        created_by: String(adminId),
        requester_id: String(adminId),
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/create",
        bodyPayload
      );
      const body = response?.data;

      if (body && (body.status === 200 || body.status === 201)) {
        toast.success(body.message_th ?? "สร้างรายการสำเร็จ");
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถสร้างรายการได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการสร้างรายการ");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteOvertime = async (id?: string | number) => {
    if (!id) return;
    try {
      setLoading(true);
      const deleterId = await getCurrentUserId(authentication);
      const response = await callApiService.post(
        `/api/v1/timesheet/overtime/delete?id=${id}`,
        { deleted_by: String(deleterId) }
      );
      const body = response?.data;

      if (body && body.status === 200) {
        toast.success(body.message_th ?? "ลบรายการสำเร็จ");
        await fetchOvertimeList({ page: paginationState.current });
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถลบรายการได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const approveOvertime = async (
    id?: string | number,
    status: string = "approved"
  ) => {
    if (!id) return;
    try {
      setLoading(true);
      const approverId = await getCurrentUserId(authentication);
      const response = await callApiService.post(
        `/api/v1/timesheet/overtime/change-status?id=${id}`,
        { status, updated_by: Number(approverId) }
      );
      const body = response?.data;

      if (body && body.status === 200) {
        toast.success(body.message_th ?? "อนุมัติเรียบร้อยแล้ว");
        await fetchOvertimeList({ page: paginationState.current });
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถอนุมัติได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setLoading(false);
    }
  };

  const sendEmailToHR = async (id?: string | number) => {
    if (!id) return;
    try {
      setLoading(true);
      const previewLink = `${window.location.origin}/timesheet/overtime/preview/${id}`;
      const payload = {
        id: String(id),
        link: previewLink,
        to: DEFAULT_HR_EMAIL,
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/send-email",
        payload
      );
      const body = response?.data;

      if (body && (body.status === 200 || body.status === 201)) {
        toast.success(body.message_th ?? "ส่งอีเมลไปยัง HR เรียบร้อยแล้ว");
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถส่งอีเมลได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดขณะส่งอีเมล");
    } finally {
      setLoading(false);
    }
  };

  // * Batch Actions
  const batchApproveOvertime = async (status: string = "approved") => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserId = await getCurrentUserId(authentication);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");

    setBatchProcessing(true);
    setProcessedItems(new Set());
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRowKeys) {
      try {
        const approverId = await getCurrentUserId(authentication);
        const response = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${id}`,
          { status, updated_by: Number(approverId) }
        );
        if (response?.data?.status === 200) {
          successCount++;
          setProcessedItems((prev) => new Set([...prev, id]));
        } else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    setBatchProcessing(false);
    if (successCount > 0) {
      toast.success(
        `สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`
      );
      await fetchOvertimeList({ page: paginationState.current });
    }
    setSelectedRowKeys([]);
    setProcessedItems(new Set());
  };

  const batchSendEmail = async () => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserId = await getCurrentUserId(authentication);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ส่งอีเมล");

    setBatchProcessing(true);
    setProcessedItems(new Set());
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRowKeys) {
      try {
        const previewLink = `${window.location.origin}/timesheet/overtime/preview/${id}`;
        const payload = {
          id: String(id),
          link: previewLink,
          to: DEFAULT_HR_EMAIL,
        };
        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/send-email",
          payload
        );

        if (response?.data?.status === 200 || response?.data?.status === 201) {
          successCount++;
          setProcessedItems((prev) => new Set([...prev, id]));
        } else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    setBatchProcessing(false);
    if (successCount > 0) toast.success(`สำเร็จ ${successCount} รายการ`);
    setSelectedRowKeys([]);
    setProcessedItems(new Set());
  };

  const handleFormSubmit = async (values: any) => {
    const formattedValues = {
      ...values,
      submittedAt: new Date().toISOString(),
    };
    const created = await createOvertime(formattedValues);
    if (created) {
      setVisible(false);
      form.resetFields();
      await fetchOvertimeList({ page: paginationState.current });
    }
  };

  const handleTableChange: TableProps<OvertimeRecord>["onChange"] = (
    pagination,
    filters
  ) => {
    const { current, pageSize } = pagination;
    const payloadFilters: any = {};
    if (filters.status && filters.status.length > 0)
      payloadFilters.status = filters.status[0];
    fetchOvertimeList({
      page: current || 1,
      pageSize,
      filters: payloadFilters,
    });
  };

  // * Columns
  const columns: TableProps<OvertimeRecord>["columns"] = [
    {
      title: "",
      key: "processed",
      width: 50,
      align: "center",
      render: (_, record) =>
        processedItems.has(record.id) && (
          <CheckOutlined className="text-green-500 text-lg font-bold" />
        ),
    },
    {
      title: "วันที่ขอ",
      dataIndex: "request_date",
      width: 120,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) =>
        dayjs(a.request_date).valueOf() - dayjs(b.request_date).valueOf(),
    },
    {
      title: "ผู้ร้องขอ",
      dataIndex: "requester_id",
      width: 200,
      render: (value) => {
        const user = getUserById(value);
        return (
          <Space>
            <Avatar
              style={{ backgroundColor: token.colorPrimary }}
              icon={<UserOutlined />}
              size="small"
            >
              {user?.firstname?.[0]}
            </Avatar>
            <Text>{user ? `${user.firstname} ${user.lastname}` : "-"}</Text>
          </Space>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 140,
      filters: OT_STATUS.map((s) => ({ text: s.text, value: s.value })),
      render: (status) => {
        const s = OT_STATUS.find((o) => o.value === status) || OT_STATUS[0];
        return (
          <Tag color={s.color} icon={s.icon} className="px-2 py-1 rounded-full">
            {s.text}
          </Tag>
        );
      },
    },
    {
      title: "สร้างโดย",
      dataIndex: "created_by",
      width: 180,
      render: (value) => {
        const user = getUserById(value);
        return (
          <Text type="secondary">
            {user ? `${user.firstname} ${user.lastname}` : "-"}
          </Text>
        );
      },
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      width: 160,
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "ดูรายละเอียด",
                icon: <EyeOutlined />,
                onClick: async () => {
                  const items = await fetchOvertimeList({ id: record.id });
                  if (items && items.length > 0) {
                    setSelectedDetail(items[0]);
                    setDetailVisible(true);
                  }
                },
              },
              {
                key: "preview",
                label: "ดู PDF",
                icon: <FilePdfOutlined />,
                onClick: () =>
                  router.push(`/timesheet/overtime/preview/${record.id}`),
              },
              {
                key: "status",
                label: "ปรับสถานะ",
                icon: <CheckOutlined />,
                onClick: async () => {
                  const currentUserId = await getCurrentUserId(authentication);
                  if (currentUserId !== BYPASS_ADMIN_ID)
                    return toast.error("ไม่มีสิทธิ์");
                  Modal.confirm({
                    title: "ปรับสถานะ",
                    content: (
                      <div className="pt-4">
                        <Select
                          defaultValue={record.status || "pending"}
                          style={{ width: "100%" }}
                          onChange={(v) => approveOvertime(record.id, v)}
                          options={OT_STATUS.map((s) => ({
                            label: s.text,
                            value: s.value,
                          }))}
                        />
                      </div>
                    ),
                    footer: null,
                    closable: true,
                  });
                },
              },
              {
                key: "email",
                label: "ส่งอีเมล",
                icon: <MailOutlined />,
                onClick: async () => {
                  const currentUserId = await getCurrentUserId(authentication);
                  if (currentUserId !== BYPASS_ADMIN_ID)
                    return toast.error("ไม่มีสิทธิ์");
                  sendEmailToHR(record.id);
                },
              },
              { type: "divider" },
              {
                key: "delete",
                label: "ลบรายการ",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                  Modal.confirm({
                    title: "ยืนยันการลบ",
                    content: "คุณต้องการลบรายการนี้ใช่หรือไม่?",
                    okText: "ลบ",
                    okType: "danger",
                    cancelText: "ยกเลิก",
                    onOk: () => deleteOvertime(record.id),
                  });
                },
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "#fafafa",
              headerColor: "#595959",
              rowHoverBg: "#f0f7ff",
              borderRadiusLG: 12,
            },
            Card: {
              borderRadiusLG: 16,
            },
          },
        }}
      >
        <div className="w-full space-y-6 animate-fade-in pb-10">
          {/* Header Section */}
          <HeaderBar
            icon={<TeamOutlined />}
            title="Overtime Management"
            subTitle="ระบบจัดการและอนุมัติการทำงานล่วงเวลา"
            color="none"
          />

          {/* Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <SummaryCard
                title="รายการทั้งหมด"
                value={stats.total}
                subValue="Total Requests"
                icon={<FileTextOutlined />}
                color="#1890ff"
                loading={loading && !dataSource.length}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <SummaryCard
                title="รออนุมัติ (หน้านี้)"
                value={stats.pending}
                subValue="Pending (Page)"
                icon={<ClockCircleOutlined />}
                color="#faad14"
                loading={loading && !dataSource.length}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <SummaryCard
                title="อนุมัติแล้ว (หน้านี้)"
                value={stats.approved}
                subValue="Approved (Page)"
                icon={<CheckCircleOutlined />}
                color="#52c41a"
                loading={loading && !dataSource.length}
              />
            </Col>
          </Row>

          {/* Filter & Actions Bar */}
          <Affix offsetTop={20}>
            <Card
              bordered={false}
              className="shadow-md rounded-xl"
              bodyStyle={{ padding: "12px 24px" }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Left: Search & Filter */}
                <Space wrap>
                  <Input
                    placeholder="ค้นหา..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 220, borderRadius: 8 }}
                    allowClear
                  />
                  <Select
                    placeholder="สถานะ"
                    style={{ width: 150 }}
                    allowClear
                    options={OT_STATUS.map((s) => ({
                      label: s.text,
                      value: s.value,
                    }))}
                    onChange={(val) =>
                      handleTableChange(
                        { current: 1, pageSize: paginationState.pageSize },
                        { status: val ? [val] : [] }
                      )
                    }
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchOvertimeList({ page: 1 })}
                    loading={loading}
                  >
                    รีโหลด
                  </Button>
                </Space>

                {/* Right: Actions */}
                <Space wrap>
                  {selectedRowKeys.length > 0 && (
                    <>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => setBatchStatusModalVisible(true)}
                        loading={batchProcessing}
                      >
                        ปรับสถานะ ({selectedRowKeys.length})
                      </Button>
                      <Button
                        icon={<MailOutlined />}
                        onClick={batchSendEmail}
                        loading={batchProcessing}
                      >
                        ส่งอีเมล ({selectedRowKeys.length})
                      </Button>
                      <Button
                        type="text"
                        danger
                        onClick={() => {
                          setSelectedRowKeys([]);
                          setProcessedItems(new Set());
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Divider type="vertical" />
                    </>
                  )}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setVisible(true)}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    เพิ่มรายการโอที
                  </Button>
                </Space>
              </div>
            </Card>
          </Affix>

          {/* Data Table */}
          <Card
            bordered={false}
            className="shadow-sm rounded-xl overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => {
                  setSelectedRowKeys(keys);
                  setProcessedItems(new Set());
                },
                getCheckboxProps: () => ({ disabled: batchProcessing }),
              }}
              pagination={{
                current: paginationState.current,
                pageSize: paginationState.pageSize,
                total: paginationState.total,
                showSizeChanger: true,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              loading={loading}
              onChange={handleTableChange}
              scroll={{ x: 1000 }}
              rowClassName={(record, index) =>
                index % 2 === 0
                  ? "bg-white hover:bg-blue-50 transition-colors"
                  : "bg-gray-50 hover:bg-blue-50 transition-colors"
              }
              expandable={{
                expandedRowRender: (record) => (
                  <div className="p-4 bg-gray-50 rounded-lg mx-4 mb-4 border border-gray-200">
                    <Text strong className="mb-2 block">
                      รายละเอียดการทำงาน:
                    </Text>
                    {record.descriptions && record.descriptions.length > 0 ? (
                      <List
                        dataSource={record.descriptions}
                        renderItem={(item) => (
                          <List.Item className="bg-white p-3 rounded mb-2 border border-gray-100 shadow-sm">
                            <List.Item.Meta
                              title={
                                <Text strong>
                                  {item.date
                                    ? dayjs(item.date).format("DD/MM/YYYY")
                                    : "-"}
                                </Text>
                              }
                              description={item.description}
                            />
                            <Space>
                              <Tag color="blue">{item.duration} ชม.</Tag>
                              <Text type="secondary">
                                ผู้มอบหมาย: {item.assignee || "-"}
                              </Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty
                        description="ไม่มีรายละเอียด"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                ),
              }}
            />
          </Card>

          {/* ---------------------------------------------------------------------- */}
          {/* Modals */}
          {/* ---------------------------------------------------------------------- */}

          {/* Create Modal */}
          <Modal
            title={
              <Space>
                <PlusOutlined className="text-blue-500" /> เพิ่มรายการโอทีใหม่
              </Space>
            }
            open={visible}
            onCancel={() => {
              setVisible(false);
              form.resetFields();
            }}
            footer={null}
            width={800}
            centered
            maskClosable={false}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              className="pt-4"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="วันที่"
                    name="request_date"
                    rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="ประเภท"
                    name="overtimeType"
                    rules={[{ required: true }]}
                  >
                    <Select size="large" placeholder="เลือกประเภท">
                      <Select.Option value="normal">วันทำงานปกติ</Select.Option>
                      <Select.Option value="holiday">วันหยุด</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="ผู้มอบหมายงาน"
                    name="assignee"
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      placeholder="เลือกผู้มอบหมายงาน"
                      showSearch
                      optionFilterProp="label"
                      options={userOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">รายละเอียดงาน</Divider>

              <Form.List name="descriptions">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        className="bg-gray-50 border-gray-200"
                      >
                        <Row gutter={16} align="middle">
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="จำนวน (ชม.)"
                              name={[field.name, "duration"]}
                              rules={[{ required: true, message: "ระบุจำนวน" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="2.5" />
                            </Form.Item>
                          </Col>
                          <Col span={16}>
                            <Form.Item
                              {...field}
                              label="รายละเอียด"
                              name={[field.name, "description"]}
                              rules={[
                                { required: true, message: "ระบุรายละเอียด" },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <AutoComplete
                                options={descriptionOptions}
                                placeholder="รายละเอียดงาน..."
                                filterOption={(inputValue, option) =>
                                  String(option?.value ?? "")
                                    .toLowerCase()
                                    .includes(String(inputValue).toLowerCase())
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col span={2} className="flex justify-end pt-6">
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          </Col>
                        </Row>
                        {/* Hidden Fields for API compatibility */}
                        <Form.Item
                          name={[field.name, "date"]}
                          hidden
                          initialValue={form.getFieldValue("request_date")}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "assignee"]}
                          hidden
                          initialValue={form.getFieldValue("assignee")}
                        >
                          <Input />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      size="large"
                    >
                      เพิ่มรายละเอียดงาน
                    </Button>
                  </div>
                )}
              </Form.List>

              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={() => setVisible(false)} size="large">
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  บันทึกข้อมูล
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Batch Status Modal */}
          <Modal
            title="ปรับสถานะรายการที่เลือก"
            open={batchStatusModalVisible}
            onCancel={() => setBatchStatusModalVisible(false)}
            onOk={async () => {
              setBatchStatusModalVisible(false);
              await batchApproveOvertime(batchSelectedStatus);
            }}
            okText="ยืนยัน"
            cancelText="ยกเลิก"
            confirmLoading={batchProcessing}
          >
            <div className="py-4">
              <Text>
                คุณกำลังจะปรับสถานะสำหรับ{" "}
                <strong>{selectedRowKeys.length}</strong> รายการ
              </Text>
              <div className="mt-4">
                <Text className="mb-2 block">เลือกสถานะใหม่:</Text>
                <Select
                  value={batchSelectedStatus}
                  onChange={setBatchSelectedStatus}
                  options={OT_STATUS.map((s) => ({
                    label: s.text,
                    value: s.value,
                  }))}
                  style={{ width: "100%" }}
                  size="large"
                />
              </div>
            </div>
          </Modal>

          {/* Detail Modal */}
          <Modal
            title={
              <Space>
                <FileTextOutlined className="text-blue-500" /> รายละเอียดคำขอ
              </Space>
            }
            open={detailVisible}
            onCancel={() => setDetailVisible(false)}
            footer={null}
            width={700}
            centered
          >
            {selectedDetail ? (
              <div className="pt-4 space-y-6">
                <Descriptions
                  bordered
                  column={1}
                  labelStyle={{ width: 150, fontWeight: 600 }}
                >
                  <Descriptions.Item label="รหัสเอกสาร">
                    {selectedDetail.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="ผู้ร้องขอ">
                    {selectedDetail.requester_id}
                  </Descriptions.Item>
                  <Descriptions.Item label="วันที่ขอ">
                    {selectedDetail.request_date
                      ? dayjs(selectedDetail.request_date).format("DD/MM/YYYY")
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {OT_STATUS.find((s) => s.value === selectedDetail.status)
                      ?.text || selectedDetail.status}
                  </Descriptions.Item>
                  <Descriptions.Item label="สร้างโดย">
                    {selectedDetail.created_by}
                  </Descriptions.Item>
                </Descriptions>

                <div>
                  <Title level={5}>รายการงาน</Title>
                  <div className="space-y-3">
                    {selectedDetail.descriptions?.map((item, idx) => (
                      <Card
                        key={idx}
                        size="small"
                        type="inner"
                        title={`รายการที่ ${idx + 1}`}
                      >
                        <div className="flex justify-between mb-2">
                          <Text type="secondary">รายละเอียด:</Text>
                          <Text strong>{item.description}</Text>
                        </div>
                        <div className="flex justify-between">
                          <Text type="secondary">จำนวนชั่วโมง:</Text>
                          <Tag color="blue">{item.duration} ชม.</Tag>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Skeleton active />
            )}
          </Modal>
        </div>
      </ConfigProvider>
    </DashboardLayout>
  );
}
