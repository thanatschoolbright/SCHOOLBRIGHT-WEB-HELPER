"use client";

import SummaryCard from "@/components/card/summary-card";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import type { ResponseNotification, ResponseUserList } from "@/stores/type";
import {
  BankOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  MessageOutlined,
  RightOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import {
  getNotificationRead,
  getNotificationType,
} from "@helpers/get-notification-type";
import { CallAPI as GET_NOTIFICATION_TODAY_LIST } from "@stores/actions/mobile/call-get-notification-today-list";
import { CallAPI as GET_NOTIFICATION_WEEK_LIST } from "@stores/actions/mobile/call-get-notification-week-list";
import { CallAPI as GET_NOTIFICATION_MESSAGE } from "@stores/actions/mobile/call-get-read-notification";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { AppDispatch, useAppSelector } from "@stores/store";
import type { InputRef, TabsProps } from "antd";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import Image from "next/image";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const SEVEN_DAYS = "week";
const TODAY = "today";

type NotificationDataset = {
  data: ResponseNotification[];
  loading: boolean;
};

type SearchableColumnKey =
  | "nMessageID"
  | "dSend"
  | "nType"
  | "nStatus"
  | "sTitle"
  | "sMessage"
  | "school_id"
  | "letter_id";

type TableColumn = ColumnType<ResponseNotification> & {
  key: keyof ResponseNotification | string;
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = theme.useToken();
  const { Title, Text } = Typography;

  const [form] = Form.useForm<{ schoolID: string; userID: string }>();
  const [activeTab, setActiveTab] = useState<string>(TODAY);
  const [currentStep, setCurrentStep] = useState(0); // New state for steps
  const [todayDataset, setTodayDataset] = useState<NotificationDataset>({
    data: [],
    loading: false,
  });
  const [weekDataset, setWeekDataset] = useState<NotificationDataset>({
    data: [],
    loading: false,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title?: string;
    message?: string;
  }>({ open: false, type: "success" });
  const [page, setPage] = useState<number>(1);
  const [curlToday, setCurlToday] = useState<string>("");
  const [curlWeek, setCurlWeek] = useState<string>("");

  const schoolState = useAppSelector((state) => state.callSchoolList);
  const userState = useAppSelector((state) => state.callGetuserBySchoolId);
  const notificationMessageState = useAppSelector(
    (state) => state.callGetNotificationMessage,
  );

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const schoolOptions = useMemo(() => {
    const rawData = schoolState?.response?.data;
    const list = Array.isArray(rawData) ? rawData : rawData?.data;

    return (
      (Array.isArray(list) ? list : []).map((item: any) => ({
        label: `${item.SchoolName} (${item.SchoolID})`,
        value: String(item.SchoolID),
      })) ?? []
    );
  }, [schoolState]);

  const userOptions = useMemo(() => {
    const rawData = userState?.response?.data;
    const list = Array.isArray(rawData) ? rawData : rawData?.data;

    return (
      (Array.isArray(list) ? list : []).map(
        (item: ResponseUserList["draftValues"]) => ({
          label: `${item?.Name ?? ""} ${item?.LastName ?? ""} (ID: ${
            item?.UserID
          })`,
          value: String(item?.UserID),
        }),
      ) ?? []
    );
  }, [userState]);

  const overallLoading = Boolean(
    schoolState.loading ||
    userState.loading ||
    todayDataset.loading ||
    weekDataset.loading,
  );

  const currentDataset =
    activeTab === TODAY ? todayDataset.data : weekDataset.data;

  // Calculate Summary Stats
  const summaryStats = useMemo(() => {
    const total = currentDataset.length;
    const read = currentDataset.filter(
      (item) => Number(item.nStatus) === 1,
    ).length;
    const unread = total - read;
    return { total, read, unread };
  }, [currentDataset]);

  const fetchUsersBySchool = useCallback(
    async (schoolID?: string) => {
      if (!schoolID) return;

      const loadingToast = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");
      try {
        await dispatch(GET_USER_BY_SCHOOLID({ schoolId: schoolID })).unwrap();
        toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: loadingToast });
        setCurrentStep(1); // Move to next step
      } catch (error: any) {
        toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้", { id: loadingToast });
      }
    },
    [dispatch],
  );

  const fetchNotifications = useCallback(
    async (userID: string, pageParam = 1) => {
      if (!userID) return;

      const pageText = String(pageParam);

      setTodayDataset((prev) => ({ ...prev, loading: true }));
      setWeekDataset((prev) => ({ ...prev, loading: true }));

      const loadingToast = toast.loading("กำลังโหลดข้อมูลแจ้งเตือน...");

      try {
        const weekly = await dispatch(
          GET_NOTIFICATION_WEEK_LIST({ user_id: userID, page: pageText }),
        ).unwrap();
        const today = await dispatch(
          GET_NOTIFICATION_TODAY_LIST({ user_id: userID, page: pageText }),
        ).unwrap();

        const hasErrorStatus =
          weekly?.raw?.Status === "Error" || today?.raw?.Status === "Error";

        if (hasErrorStatus) {
          const curlToCopy = weekly?.curl ?? today?.curl ?? "";
          toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน", {
            id: loadingToast,
            description: curlToCopy
              ? "คัดลอก CURL แล้วแจ้งทีมพัฒนา"
              : undefined,
            action: curlToCopy
              ? {
                  label: "คัดลอก CURL",
                  onClick: () => navigator.clipboard.writeText(curlToCopy),
                }
              : undefined,
          });
        }

        setWeekDataset({ data: weekly?.data ?? [], loading: false });
        setTodayDataset({ data: today?.data ?? [], loading: false });
        setCurlWeek(weekly?.curl ?? "");
        setCurlToday(today?.curl ?? "");
        if (!hasErrorStatus) {
          toast.success("โหลดข้อมูลแจ้งเตือนสำเร็จ", { id: loadingToast });
        }
      } catch (error: any) {
        setWeekDataset((prev) => ({ ...prev, loading: false }));
        setTodayDataset((prev) => ({ ...prev, loading: false }));
        toast.error(error?.message ?? "ไม่สามารถโหลดข้อมูลแจ้งเตือนได้", {
          id: loadingToast,
        });
      }
    },
    [dispatch],
  );

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setPage(1);
      await fetchNotifications(values.userID, 1);
    } catch (error) {
      //
    }
  }, [fetchNotifications, form]);

  /**
   * ล้างตัวกรองและข้อมูล
   */
  const handleClearForm = useCallback(() => {
    form.resetFields();
    setCurrentStep(0);
    setTodayDataset({ data: [], loading: false });
    setWeekDataset({ data: [], loading: false });
    setCurlToday("");
    setCurlWeek("");
    toast.success("ล้างข้อมูลการค้นหาเรียบร้อยแล้ว");
  }, [form]);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      const values = form.getFieldsValue();
      if (!values?.userID) return;
      setPage(nextPage);
      await fetchNotifications(values.userID, nextPage);
    },
    [fetchNotifications, form],
  );

  const openDetailModal = useCallback(
    async (notificationId: number) => {
      const values = form.getFieldsValue();
      if (!values?.userID) {
        toast.warning("กรุณาเลือกผู้ใช้ก่อน");
        return;
      }

      const loadingToast = toast.loading("กำลังโหลดรายละเอียดข้อความ...");
      try {
        await dispatch(
          GET_NOTIFICATION_MESSAGE({
            user_id: values.userID,
            message_id: String(notificationId),
          }),
        ).unwrap();
        setDetailModalVisible(true);
        toast.success("โหลดรายละเอียดสำเร็จ", { id: loadingToast });
      } catch (error: any) {
        toast.error(error?.message ?? "ไม่สามารถโหลดรายละเอียดได้", {
          id: loadingToast,
        });
      }
    },
    [dispatch, form],
  );

  const getColumnSearchProps = useCallback(
    (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const value = (selectedKeys[0] as string | undefined) ?? "";

        return (
          <div
            style={{ padding: 12 }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node;
              }}
              placeholder={`ค้นหา ${title}`}
              value={value}
              onChange={(event) => {
                const { value: inputValue } = event.target;
                setSelectedKeys(inputValue ? [inputValue] : []);
              }}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: "block" }}
              suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            />
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={() => confirm()}
              >
                ค้นหา
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
              >
                รีเซ็ต
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const raw = record[dataIndex];
        if (!raw) return false;
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible) {
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
          }
        },
      },
    }),
    [],
  );

  const columns = useMemo<ColumnsType<ResponseNotification>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        render: (_value, _record, index) => index + 1 + (page - 1) * 10,
        width: 70,
        align: "center",
        fixed: "left",
      },
      {
        title: "Message ID",
        dataIndex: "nMessageID",
        width: 120,
        align: "center",
        sorter: (a, b) => Number(a.nMessageID) - Number(b.nMessageID),
        ...getColumnSearchProps("nMessageID", "รหัสข้อความ"),
        render: (value) => (
          <Typography.Text copyable style={{ fontFamily: "monospace" }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: "Letter ID",
        dataIndex: "letter_id",
        width: 120,
        align: "center",
        sorter: (a, b) => Number(a.letter_id || 0) - Number(b.letter_id || 0),
        ...getColumnSearchProps("letter_id", "Letter ID"),
        render: (value) => (
          <Text type="secondary" style={{ fontFamily: "monospace" }}>
            {value || "-"}
          </Text>
        ),
      },
      {
        title: "School ID",
        dataIndex: "school_id",
        width: 100,
        align: "center",
        sorter: (a, b) => Number(a.school_id || 0) - Number(b.school_id || 0),
        ...getColumnSearchProps("school_id", "รหัสโรงเรียน"),
        render: (value) => <Tag color="orange">{value || "-"}</Tag>,
      },
      {
        title: "วันที่ส่ง",
        dataIndex: "dSend",
        width: 160,
        sorter: (a, b) => dayjs(a.dSend).valueOf() - dayjs(b.dSend).valueOf(),
        render: (value: string) => (
          <Text style={{ fontSize: 13, whiteSpace: "nowrap" }}>
            {convertTimeZoneToThai(new Date(value))}
          </Text>
        ),
      },
      {
        title: "ประเภท",
        dataIndex: "nType",
        key: "nType",
        width: 130,
        align: "center",
        sorter: (a, b) => Number(a.nType) - Number(b.nType),
        render: (value: number) => (
          <Tag color="geekblue" style={{ margin: 0, borderRadius: 4 }}>
            {getNotificationType(value)}
          </Tag>
        ),
        filters: [1, 2, 3, 5, 8].map((value) => ({
          text: getNotificationType(value),
          value,
        })),
        onFilter: (value, record) => Number(record.nType) === Number(value),
      },
      {
        title: "สถานะ",
        dataIndex: "nStatus",
        key: "nStatus",
        width: 110,
        align: "center",
        sorter: (a, b) => Number(a.nStatus) - Number(b.nStatus),
        render: (value: number) => (
          <Tag
            color={value === 1 ? "success" : "default"}
            icon={
              value === 1 ? <CheckCircleOutlined /> : <CloseCircleOutlined />
            }
            style={{ borderRadius: "12px", padding: "0 10px", margin: 0 }}
          >
            {getNotificationRead(value)}
          </Tag>
        ),
        filters: [
          { text: "อ่านแล้ว", value: 1 },
          { text: "ยังไม่อ่าน", value: 0 },
        ],
        onFilter: (value, record) => Number(record.nStatus) === Number(value),
      },
      {
        title: "หัวข้อ",
        dataIndex: "sTitle",
        width: 180,
        sorter: (a, b) => (a.sTitle || "").localeCompare(b.sTitle || ""),
        ...getColumnSearchProps("sTitle", "หัวข้อ"),
        render: (text: string) => (
          <Text strong style={{ fontSize: 13, display: "block" }}>
            {text || "-"}
          </Text>
        ),
      },
      {
        title: "ข้อความ",
        dataIndex: "sMessage",
        width: 350,
        sorter: (a, b) => (a.sMessage || "").localeCompare(b.sMessage || ""),
        ...getColumnSearchProps("sMessage", "ข้อความ"),
        render: (text: string) => (
          <Typography.Paragraph
            style={{
              width: "100%",
              margin: 0,
              fontSize: 13,
              lineHeight: "1.5",
            }}
            ellipsis={{ rows: 2, tooltip: true }}
          >
            {text || "-"}
          </Typography.Paragraph>
        ),
      },
      {
        title: "Log Status",
        dataIndex: "LogStatus",
        width: 100,
        align: "center",
        sorter: (a, b) => Number(a.LogStatus || 0) - Number(b.LogStatus || 0),
        render: (value) =>
          value ? (
            <Tag bordered={false} color="purple">
              {value}
            </Tag>
          ) : (
            "-"
          ),
      },
      {
        title: "ไฟล์แนบ",
        dataIndex: "file",
        width: 100,
        align: "center",
        render: (hasFile) =>
          hasFile ? (
            <Tag color="cyan" icon={<FileTextOutlined />}>
              YES
            </Tag>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: "โลโก้",
        dataIndex: "logo",
        key: "logo",
        width: 80,
        align: "center",
        render: (value: string | null) =>
          value ? (
            <Image
              src={value}
              alt="logo"
              width={32}
              height={32}
              className="object-contain rounded border"
            />
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              -
            </Typography.Text>
          ),
      },
      {
        title: "การกระทำ",
        key: "actions",
        width: 100,
        align: "center",
        fixed: "right",
        render: (_value, record) => (
          <Tooltip title="ดูรายละเอียดเต็ม">
            <Button
              type="primary"
              variant="text"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record.nMessageID)}
            />
          </Tooltip>
        ),
      },
    ],
    [
      activeTab,
      curlToday,
      curlWeek,
      getColumnSearchProps,
      openDetailModal,
      page,
    ],
  );

  // Handle school selection logic
  const handleSchoolChange = (schoolId: string) => {
    form.setFieldsValue({ userID: undefined }); // Reset user
    setCurrentStep(0); // Reset UI step if needed, but fetch will push it to 1
    fetchUsersBySchool(schoolId);
  };

  const copyCurl = () => {
    const curlCommand = activeTab === TODAY ? curlToday : curlWeek;
    if (!curlCommand) {
      toast.info("ไม่พบคำสั่ง CURL");
      return;
    }
    navigator.clipboard.writeText(curlCommand);
    toast.success("คัดลอกคำสั่ง CURL แล้ว");
  };

  const tabs: TabsProps["items"] = [
    {
      key: TODAY,
      label: (
        <span>
          <MessageOutlined /> ข้อความวันนี้
        </span>
      ),
      children: (
        <Table<ResponseNotification>
          dataSource={todayDataset.data}
          loading={todayDataset.loading}
          columns={columns}
          rowKey={(record) => String(record.nMessageID)}
          pagination={false}
          scroll={{ x: 1620 }}
          size="middle"
        />
      ),
    },
    {
      key: SEVEN_DAYS,
      label: (
        <span>
          <FileTextOutlined /> ย้อนหลัง 7 วัน
        </span>
      ),
      children: (
        <Table<ResponseNotification>
          dataSource={weekDataset.data}
          loading={weekDataset.loading}
          columns={columns}
          rowKey={(record) => String(record.nMessageID)}
          pagination={false}
          scroll={{ x: 1620 }}
          size="middle"
        />
      ),
    },
  ];

  const renderDetailModal = () => {
    const detail = notificationMessageState?.response?.data;
    if (!detail) {
      return null;
    }

    // Helper function สำหรับแสดง Label พร้อม Icon
    const LabelWithIcon = ({
      icon,
      label,
    }: {
      icon: React.ReactNode;
      label: string;
    }) => (
      <Space>
        {icon}
        <Typography.Text type="secondary">{label}</Typography.Text>
      </Space>
    );

    return (
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: "#1890ff" }} />
            <Typography.Title level={5} style={{ margin: 0 }}>
              รายละเอียดข้อความแจ้งเตือน
            </Typography.Title>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            ปิดหน้าต่าง
          </Button>,
        ]}
        width={700} // ปรับความกว้างให้พอดีกับ 1 Column
        centered
        styles={{ body: { padding: "24px" } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {/* ส่วนข้อความหลัก */}
          <Card
            bordered
            style={{
              background: "#fafafa",
              borderColor: "#f0f0f0",
            }}
          >
            <Typography.Title
              level={5}
              style={{ marginTop: 0, color: "#262626" }}
            >
              {detail.sTitle}
            </Typography.Title>
            <Typography.Paragraph
              style={{
                fontSize: "15px",
                color: "#595959",
                whiteSpace: "pre-wrap",
                marginBottom: 0,
              }}
            >
              {detail.sMessage ?? "-"}
            </Typography.Paragraph>
          </Card>

          {/* ส่วนข้อมูลทั่วไปแบบ 1:1 (Single Column) */}
          <Descriptions
            title="ข้อมูลทั่วไป"
            bordered
            column={1} // ✅ บังคับแสดง 1 Column
            size="small" // ใช้ size small เพื่อให้บรรทัดไม่ห่างกันเกินไป
            labelStyle={{ width: "180px", background: "#fafafa" }} // กำหนดความกว้าง Label ให้เท่ากันสวยงาม
          >
            <Descriptions.Item
              label={
                <LabelWithIcon icon={<CodeOutlined />} label="Message ID" />
              }
            >
              <Typography.Text copyable>
                {detail.nMessageID ?? "-"}
              </Typography.Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <LabelWithIcon icon={<BankOutlined />} label="School ID" />
              }
            >
              <Typography.Text>{detail.school_id ?? "-"}</Typography.Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <LabelWithIcon
                  icon={<CheckCircleOutlined />}
                  label="สถานะการอ่าน"
                />
              }
            >
              <Tag color={detail.nStatus === 1 ? "success" : "volcano"}>
                {getNotificationRead(detail.nStatus ?? 0)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <LabelWithIcon icon={<InfoCircleOutlined />} label="ประเภท" />
              }
            >
              <Tag color="geekblue">
                {getNotificationType(detail.nType ?? 0)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <LabelWithIcon
                  icon={<CheckCircleOutlined />}
                  label="วันที่ส่ง"
                />
              }
            >
              {detail.dSend
                ? convertTimeZoneToThai(new Date(detail.dSend))
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <LabelWithIcon icon={<FileTextOutlined />} label="ไฟล์แนบ" />
              }
            >
              {detail.file ? (
                <Tag color="blue">มีไฟล์แนบ</Tag>
              ) : (
                <Tag>ไม่มีไฟล์</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>

          {/* ส่วนรายละเอียดการบ้าน (ถ้ามี) แบบ 1:1 */}
          {detail.homework && (
            <Descriptions
              title="รายละเอียดการบ้าน"
              bordered
              column={1}
              size="small"
              labelStyle={{ width: "180px", background: "#fffbe6" }} // สีพื้นหลัง Label ต่างออกไปเล็กน้อย
              style={{ marginTop: 8 }}
            >
              <Descriptions.Item label="ช่วงเวลา">
                {detail.homework.daystart} - {detail.homework.dayend}
              </Descriptions.Item>
              <Descriptions.Item label="ครูผู้สอน">
                {detail.homework.teachername ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="รายละเอียดเพิ่มเติม">
                {detail.homework.detail ?? "-"}
              </Descriptions.Item>
            </Descriptions>
          )}

          {/* ส่วนสำหรับ Developer (CURL) */}
          {notificationMessageState?.response?.curl && (
            <div style={{ marginTop: 16 }}>
              <Space
                style={{
                  marginBottom: 8,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography.Text type="secondary" strong>
                  <CodeOutlined /> Developer Info (CURL)
                </Typography.Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      notificationMessageState.response.curl || "",
                    );
                    toast.success("คัดลอก CURL แล้ว");
                  }}
                >
                  Copy Command
                </Button>
              </Space>
              <div
                style={{
                  background: "#282c34",
                  color: "#abb2bf",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  maxHeight: "120px",
                  overflowY: "auto",
                  border: "1px solid #d9d9d9",
                }}
              >
                {notificationMessageState.response.curl}
              </div>
            </div>
          )}
        </Space>
      </Modal>
    );
  };

  return (
    <DashboardLayout>
      <Flex vertical gap={24} style={{ width: "100%" }}>
        {/* ส่วนที่ 1: ส่วนหัวของหน้า (Header Bar) */}
        <HeaderBar
          icon={<MessageOutlined />}
          title="ตรวจสอบการแจ้งเตือน (Notification Logs)"
          subTitle="ค้นหาและตรวจสอบประวัติการแจ้งเตือนของผู้ใช้งานรายบุคคล"
        />

        {/* ส่วนที่ 3: ฟิลเตอร์ข้อมูล (Filter) และ ปุ่มที่เกี่ยวข้อง */}
        <Card
          variant="borderless"
          styles={{ body: { padding: 24 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
            <FilterOutlined
              style={{ color: token.colorPrimary, fontSize: "1rem" }}
            />
            <Title
              level={4}
              style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}
            >
              ตัวกรอง
            </Title>
          </Flex>

          <Steps
            current={currentStep}
            items={[
              {
                title: "เลือกโรงเรียน",
                icon: <BankOutlined />,
              },
              {
                title: "เลือกผู้ใช้",
                icon: <UserOutlined />,
              },
            ]}
            style={{ marginBottom: 24 }}
          />

          <Form
            layout="vertical"
            form={form}
            onFinish={handleFormSubmit}
            initialValues={{ schoolID: undefined, userID: undefined }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <BankOutlined />
                      <span>เลือกโรงเรียน</span>
                    </Space>
                  }
                  name="schoolID"
                  rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
                >
                  <Select
                    showSearch
                    placeholder="พิมพ์ชื่อโรงเรียนเพื่อค้นหา..."
                    options={schoolOptions}
                    loading={schoolState.loading}
                    onChange={handleSchoolChange}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    size="large"
                    suffixIcon={<BankOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <UserOutlined />
                      <span>เลือกผู้ใช้</span>
                    </Space>
                  }
                  name="userID"
                  rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
                >
                  <Select
                    showSearch
                    disabled={currentStep < 1}
                    placeholder={
                      currentStep < 1
                        ? "กรุณาเลือกโรงเรียนก่อน"
                        : "พิมพ์ชื่อ หรือ ID เพื่อค้นหา..."
                    }
                    options={userOptions}
                    loading={userState.loading}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    size="large"
                    suffixIcon={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Flex justify="end" gap={12} style={{ marginTop: 24 }}>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={handleClearForm}
              >
                ล้างการค้นหา
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={overallLoading}
                size="large"
                icon={<SearchOutlined />}
                style={{ padding: "0 32px" }}
              >
                ค้นหาข้อมูล
              </Button>
            </Flex>
          </Form>
        </Card>

        {/* ส่วนที่ 2: Summary Metrics (สรุปภาพรวม) */}
        {(todayDataset.data.length > 0 || weekDataset.data.length > 0) && (
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={8}>
              <SummaryCard
                title="ข้อความทั้งหมด"
                value={summaryStats.total.toLocaleString()}
                subtitle="จำนวนการแจ้งเตือนที่พบในระบบ"
                icon={<MessageOutlined />}
                color={token.colorPrimary}
              />
            </Col>
            <Col xs={24} sm={8}>
              <SummaryCard
                title="อ่านแล้ว"
                value={summaryStats.read.toLocaleString()}
                subtitle="จำนวนข้อความที่ผู้ใช้เปิดอ่านแล้ว"
                icon={<CheckCircleOutlined />}
                color={token.colorSuccess}
              />
            </Col>
            <Col xs={24} sm={8}>
              <SummaryCard
                title="ยังไม่อ่าน"
                value={summaryStats.unread.toLocaleString()}
                subtitle="จำนวนข้อความที่ยังไม่ได้เปิดอ่าน"
                icon={<CloseCircleOutlined />}
                color={token.colorError}
              />
            </Col>
          </Row>
        )}

        {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
        {(todayDataset.data.length > 0 || weekDataset.data.length > 0) && (
          <Card
            variant="borderless"
            styles={{ body: { padding: 16 } }}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Flex vertical gap={16}>
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={12}>
                  <UnorderedListOutlined
                    style={{ color: token.colorPrimary, fontSize: "1rem" }}
                  />
                  <Title level={5} style={{ margin: 0, fontSize: "1rem" }}>
                    รายการแจ้งเตือน
                  </Title>
                </Flex>

                <Space>
                  {(curlToday || curlWeek) && (
                    <Tooltip title="คัดลอกคำสั่ง CURL สำหรับ QA/Dev">
                      <Button
                        type="text"
                        icon={<CodeOutlined />}
                        onClick={copyCurl}
                        style={{ color: token.colorWarning, fontWeight: 600 }}
                      >
                        Copy CURL
                      </Button>
                    </Tooltip>
                  )}
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => handlePageChange(Math.max(page - 1, 1))}
                    disabled={page <= 1}
                  />
                  <Tag
                    color="blue"
                    style={{ margin: 0, padding: "2px 12px", borderRadius: 6 }}
                  >
                    หน้า {page}
                  </Tag>
                  <Button
                    icon={<RightOutlined />}
                    onClick={() => handlePageChange(page + 1)}
                  />
                </Space>
              </Flex>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabs}
                type="card"
              />
            </Flex>
          </Card>
        )}
      </Flex>

      {/* Modals & Feedback */}
      {detailModalVisible && renderDetailModal()}

      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
      />
    </DashboardLayout>
  );
}
