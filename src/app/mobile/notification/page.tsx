"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import type { TabsProps } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  MessageOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Image from "next/image";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import {
  getNotificationRead,
  getNotificationType,
} from "@helpers/get-notification-type";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { CallAPI as GET_NOTIFICATION_TODAY_LIST } from "@stores/actions/mobile/call-get-notification-today-list";
import { CallAPI as GET_NOTIFICATION_WEEK_LIST } from "@stores/actions/mobile/call-get-notification-week-list";
import { CallAPI as GET_NOTIFICATION_MESSAGE } from "@stores/actions/mobile/call-get-read-notification";
import type { ResponseNotification, ResponseUserList } from "@/stores/type";
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
  | "sMessage";

type TableColumn = ColumnType<ResponseNotification> & {
  key: keyof ResponseNotification | string;
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();

  const [form] = Form.useForm<{ schoolID: string; userID: string }>();
  const [activeTab, setActiveTab] = useState<string>(TODAY);
  const [todayDataset, setTodayDataset] = useState<NotificationDataset>({
    data: [],
    loading: false,
  });
  const [weekDataset, setWeekDataset] = useState<NotificationDataset>({
    data: [],
    loading: false,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [curlToday, setCurlToday] = useState<string>("");
  const [curlWeek, setCurlWeek] = useState<string>("");

  const schoolState = useAppSelector((state) => state.callSchoolList);
  const userState = useAppSelector((state) => state.callGetuserBySchoolId);
  const notificationMessageState = useAppSelector(
    (state) => state.callGetNotificationMessage
  );

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const schoolOptions = useMemo(() => {
    return (
      schoolState?.response?.data?.map((item: any) => ({
        label: `${item.SchoolName} (${item.SchoolID})`,
        value: String(item.SchoolID),
      })) ?? []
    );
  }, [schoolState]);

  const userOptions = useMemo(() => {
    return (
      userState?.response?.data?.data?.map(
        (item: ResponseUserList["draftValues"]) => ({
          label: `${item?.Name ?? ""} ${item?.LastName ?? ""} (ID: ${
            item?.UserID
          })`,
          value: String(item?.UserID),
        })
      ) ?? []
    );
  }, [userState]);

  const overallLoading = Boolean(
    schoolState.loading ||
      userState.loading ||
      todayDataset.loading ||
      weekDataset.loading
  );

  const currentDataset =
    activeTab === TODAY ? todayDataset.data : weekDataset.data;

  // Calculate Summary Stats
  const summaryStats = useMemo(() => {
    const total = currentDataset.length;
    const read = currentDataset.filter(
      (item) => Number(item.nStatus) === 1
    ).length;
    const unread = total - read;
    return { total, read, unread };
  }, [currentDataset]);

  const fetchUsersBySchool = useCallback(
    async (schoolID?: string) => {
      if (!schoolID) {
        return;
      }

      const loadingToast = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");
      try {
        await dispatch(GET_USER_BY_SCHOOLID({ schoolId: schoolID })).unwrap();
        toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: loadingToast });
      } catch (error: any) {
        toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้", { id: loadingToast });
      }
    },
    [dispatch]
  );

  const fetchNotifications = useCallback(
    async (userID: string, pageParam = 1) => {
      if (!userID) {
        return;
      }

      const pageText = String(pageParam);

      setTodayDataset((prev) => ({ ...prev, loading: true }));
      setWeekDataset((prev) => ({ ...prev, loading: true }));

      const loadingToast = toast.loading("กำลังโหลดข้อมูลแจ้งเตือน...");

      try {
        const weekly = await dispatch(
          GET_NOTIFICATION_WEEK_LIST({ user_id: userID, page: pageText })
        ).unwrap();
        const today = await dispatch(
          GET_NOTIFICATION_TODAY_LIST({ user_id: userID, page: pageText })
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
    [dispatch]
  );

  const handleFormSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setPage(1);
    await fetchNotifications(values.userID, 1);
  }, [fetchNotifications, form]);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      const values = form.getFieldsValue();
      if (!values?.userID) {
        return;
      }
      setPage(nextPage);
      await fetchNotifications(values.userID, nextPage);
    },
    [fetchNotifications, form]
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
          })
        ).unwrap();
        setDetailModalVisible(true);
        toast.success("โหลดรายละเอียดสำเร็จ", { id: loadingToast });
      } catch (error: any) {
        toast.error(error?.message ?? "ไม่สามารถโหลดรายละเอียดได้", {
          id: loadingToast,
        });
      }
    },
    [dispatch, form]
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
        if (!raw) {
          return false;
        }
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
    []
  );

  const columns = useMemo<ColumnsType<ResponseNotification>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        render: (_value, _record, index) => index + 1 + (page - 1) * 10,
        width: 70,
        align: "center",
        fixed: "left", // ล็อคลำดับไว้ซ้ายสุด
      },
      {
        title: "รหัสข้อความ",
        dataIndex: "nMessageID",
        width: 120, // กำหนดความกว้าง
        sorter: (a, b) => Number(a.nMessageID) - Number(b.nMessageID),
        ...getColumnSearchProps("nMessageID", "รหัสข้อความ"),
      },
      {
        title: "วันที่ส่ง",
        dataIndex: "dSend",
        width: 150, // กำหนดความกว้าง
        sorter: (a, b) => dayjs(a.dSend).valueOf() - dayjs(b.dSend).valueOf(),
        render: (value: string) => (
          <div style={{ whiteSpace: "nowrap" }}>
            {convertTimeZoneToThai(new Date(value))}
          </div>
        ),
        ...getColumnSearchProps("dSend", "วันที่ส่ง"),
      },
      {
        title: "ประเภท",
        dataIndex: "nType",
        key: "nType",
        width: 120,
        align: "center",
        sorter: (a, b) => Number(a.nType) - Number(b.nType),
        render: (value: number) => (
          <Tag color="blue" style={{ marginRight: 0 }}>
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
        width: 100,
        align: "center",
        sorter: (a, b) => Number(a.nStatus) - Number(b.nStatus),
        render: (value: number) => (
          <Tag
            color={value === 1 ? "success" : "error"}
            icon={
              value === 1 ? <CheckCircleOutlined /> : <CloseCircleOutlined />
            }
            style={{ borderRadius: "20px", padding: "0 10px", marginRight: 0 }}
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
      // --- ส่วนที่แก้ไขเรื่องข้อความทะลุ ---
      {
        title: "หัวข้อ",
        dataIndex: "sTitle",
        width: 200, // 1. กำหนดความกว้าง
        ...getColumnSearchProps("sTitle", "หัวข้อ"),
        render: (text: string) => (
          // 2. ใช้ Typography.Text ตัดคำบรรทัดเดียว + Tooltip
          <Typography.Text
            style={{ width: "100%", margin: 0 }}
            ellipsis={{ tooltip: true }}
          >
            {text || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "ข้อความ",
        dataIndex: "sMessage",
        width: 300, // 1. กำหนดความกว้างให้เยอะหน่อย
        ...getColumnSearchProps("sMessage", "ข้อความ"),
        render: (text: string) => (
          // 2. ใช้ Typography.Paragraph ตัดคำเมื่อเกิน 2 บรรทัด + Tooltip
          <Typography.Paragraph
            style={{ width: "100%", margin: 0 }}
            ellipsis={{ rows: 2, tooltip: true, expandable: false }}
          >
            {text || "-"}
          </Typography.Paragraph>
        ),
      },
      // ----------------------------------
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
        fixed: "right", // ล็อคปุ่มไว้ขวาสุด
        render: (_value, record) => (
          <Tooltip title="ดูรายละเอียดเต็ม">
            <Button
              type="text"
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
    ]
  );

  // * ตรวจการทำงานของ Select School ID
  const selectedSchoolID = Form.useWatch("schoolID", form);

  useEffect(() => {
    const selectedSchoolId = form.getFieldValue("schoolID");
    if (!selectedSchoolId) {
      form.setFieldsValue({ userID: undefined });
      return;
    }

    form.setFieldsValue({ userID: undefined });
    fetchUsersBySchool(selectedSchoolId);
  }, [fetchUsersBySchool, form, selectedSchoolID]);

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
          scroll={{ x: 1000 }}
          bordered
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
          scroll={{ x: 1000 }}
          bordered
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

    return (
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>รายละเอียดข้อความแจ้งเตือน</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            ปิด
          </Button>,
        ]}
        width={800}
        centered
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Card bordered={false} style={{ background: "#f5f5f5" }}>
            <Typography.Title level={5}>{detail.sTitle}</Typography.Title>
            <Typography.Paragraph>
              {detail.sMessage ?? "-"}
            </Typography.Paragraph>
          </Card>

          <Descriptions title="ข้อมูลทั่วไป" bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Message ID">
              {detail.nMessageID ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="วันที่ส่ง">
              {detail.dSend
                ? convertTimeZoneToThai(new Date(detail.dSend))
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะ">
              <Tag color={detail.nStatus === 1 ? "green" : "red"}>
                {getNotificationRead(detail.nStatus ?? 0)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="ประเภท">
              {getNotificationType(detail.nType ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="School ID">
              {detail.school_id ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="ไฟล์แนบ">
              {detail.file ? <Tag color="blue">มีไฟล์</Tag> : "ไม่มี"}
            </Descriptions.Item>
          </Descriptions>

          {detail.homework && (
            <Card size="small" title="รายละเอียดการบ้าน" type="inner">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="ช่วงเวลา">
                  {detail.homework.daystart} - {detail.homework.dayend}
                </Descriptions.Item>
                <Descriptions.Item label="รายละเอียด">
                  {detail.homework.detail ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="ครูผู้สอน">
                  {detail.homework.teachername ?? "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {notificationMessageState?.response?.curl && (
            <div style={{ position: "relative" }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <CodeOutlined /> Developer Info (CURL)
              </Typography.Text>
              <div
                style={{
                  background: "#1e1e1e",
                  color: "#d4d4d4",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  maxHeight: "100px",
                  overflowY: "auto",
                  marginTop: "5px",
                }}
              >
                {notificationMessageState.response.curl}
              </div>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                style={{
                  position: "absolute",
                  top: "25px",
                  right: "10px",
                  color: "white",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(
                    notificationMessageState.response.curl || ""
                  );
                  toast.success("คัดลอก CURL แล้ว");
                }}
              />
            </div>
          )}
        </Space>
      </Modal>
    );
  };

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              ตรวจสอบการแจ้งเตือน (Notification Logs)
            </Typography.Title>
            <Typography.Text type="secondary">
              ค้นหาและตรวจสอบประวัติการแจ้งเตือนของผู้ใช้งานรายบุคคล
            </Typography.Text>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            {/* Future Actions can be here */}
          </Col>
        </Row>

        {/* Search Card */}
        <Card
          variant="borderless"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <Form
            layout="vertical"
            form={form}
            onFinish={handleFormSubmit}
            initialValues={{ schoolID: "", userID: "" }}
          >
            <Row gutter={16}>
              <Col xs={24} md={10}>
                <Form.Item
                  label="เลือกโรงเรียน"
                  name="schoolID"
                  rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
                >
                  <Select
                    showSearch
                    placeholder="ค้นหาชื่อโรงเรียน..."
                    options={schoolOptions}
                    loading={schoolState.loading}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item
                  label="เลือกผู้ใช้"
                  name="userID"
                  rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
                >
                  <Select
                    showSearch
                    placeholder="ค้นหาชื่อ หรือ User ID..."
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
              <Col
                xs={24}
                md={4}
                style={{ display: "flex", alignItems: "end" }}
              >
                <Form.Item style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={overallLoading}
                    size="large"
                    block
                    icon={<SearchOutlined />}
                  >
                    ตรวจสอบ
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Summary Stats (Only visible when data is loaded) */}
        {(todayDataset.data.length > 0 || weekDataset.data.length > 0) && (
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card
                variant="borderless"
                style={{ background: "#e6f7ff", borderColor: "#91d5ff" }}
              >
                <Statistic
                  title="ข้อความทั้งหมด"
                  value={summaryStats.total}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                variant="borderless"
                style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
              >
                <Statistic
                  title="อ่านแล้ว"
                  value={summaryStats.read}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                variant="borderless"
                style={{ background: "#fff1f0", borderColor: "#ffa39e" }}
              >
                <Statistic
                  title="ยังไม่อ่าน"
                  value={summaryStats.unread}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Results Section */}
        <Card
          variant="borderless"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          extra={
            <Space>
              {(curlToday || curlWeek) && (
                <Tooltip title="สำหรับ QA/Dev เพื่อ Debug API">
                  <Button icon={<CodeOutlined />} onClick={copyCurl}>
                    Copy CURL Log
                  </Button>
                </Tooltip>
              )}
              <Button
                onClick={() => handlePageChange(Math.max(page - 1, 1))}
                disabled={page <= 1}
              >
                ก่อนหน้า
              </Button>
              <Button onClick={() => handlePageChange(page + 1)}>ถัดไป</Button>
            </Space>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabs}
            type="card"
            size="large"
          />
        </Card>
      </Space>

      {detailModalVisible && renderDetailModal()}
    </DashboardLayout>
  );
}
