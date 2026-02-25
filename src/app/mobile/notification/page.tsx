"use client";

import SummaryCard from "@/components/card/summary-card";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import type { ResponseNotification, ResponseUserList } from "@/stores/type";
import {
  BankOutlined,
  BookOutlined,
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
import {
  App,
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
import type { InputRef, TabsProps } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const SEVEN_DAYS_KEY = "week";
const TODAY_KEY = "today";

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

const NotificationPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus, update } = useSession();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const { user_id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { Title, Text } = Typography;

  const [formInstance] = Form.useForm<{ schoolID: string; userID: string }>();
  const [activeTabKey, setActiveTabKey] = useState<string>(TODAY_KEY);
  const [currentFilterStep, setCurrentFilterStep] = useState(0);
  const [todayNotificationDataset, setTodayNotificationDataset] =
    useState<NotificationDataset>({
      data: [],
      loading: false,
    });
  const [weekNotificationDataset, setWeekNotificationDataset] =
    useState<NotificationDataset>({
      data: [],
      loading: false,
    });
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [statusModalState, setStatusModalState] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title?: string;
    message?: string;
  }>({ open: false, type: "success" });
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [curlTodayCommand, setCurlTodayCommand] = useState<string>("");
  const [curlWeekCommand, setCurlWeekCommand] = useState<string>("");

  const schoolListState = useAppSelector((state) => state.callSchoolList);
  const userListBySchoolState = useAppSelector(
    (state) => state.callGetuserBySchoolId,
  );
  const notificationMessageDetailState = useAppSelector(
    (state) => state.callGetNotificationMessage,
  );

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const schoolListOptions = useMemo(() => {
    const rawSchoolData = schoolListState?.response?.data;
    const schoolListArray = Array.isArray(rawSchoolData)
      ? rawSchoolData
      : rawSchoolData?.data;

    return (
      (Array.isArray(schoolListArray) ? schoolListArray : []).map(
        (schoolItem: any) => ({
          label: `${schoolItem.SchoolName} (${schoolItem.SchoolID})`,
          value: String(schoolItem.SchoolID),
        }),
      ) ?? []
    );
  }, [schoolListState]);

  const userListOptions = useMemo(() => {
    const rawUserData = userListBySchoolState?.response?.data;
    const userListArray = Array.isArray(rawUserData)
      ? rawUserData
      : rawUserData?.data;

    return (
      (Array.isArray(userListArray) ? userListArray : []).map(
        (userItem: ResponseUserList["draftValues"]) => ({
          label: `${userItem?.Name ?? ""} ${userItem?.LastName ?? ""} (ID: ${
            userItem?.UserID
          })`,
          value: String(userItem?.UserID),
        }),
      ) ?? []
    );
  }, [userListBySchoolState]);

  const isOverallLoading = Boolean(
    schoolListState.loading ||
    userListBySchoolState.loading ||
    todayNotificationDataset.loading ||
    weekNotificationDataset.loading,
  );

  const currentNotificationDataset =
    activeTabKey === TODAY_KEY
      ? todayNotificationDataset.data
      : weekNotificationDataset.data;

  const notificationSummaryStatistics = useMemo(() => {
    const totalCount = currentNotificationDataset.length;
    const readCount = currentNotificationDataset.filter(
      (notificationRecord) => Number(notificationRecord.nStatus) === 1,
    ).length;
    const unreadCount = totalCount - readCount;
    return { totalCount, readCount, unreadCount };
  }, [currentNotificationDataset]);

  const fetchUsersBySchoolId = useCallback(
    async (schoolID?: string) => {
      if (!schoolID) return;

      const loadingToastId = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");
      try {
        await dispatch(GET_USER_BY_SCHOOLID({ schoolId: schoolID })).unwrap();
        toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: loadingToastId });
        setCurrentFilterStep(1);
      } catch (errorResponse: any) {
        toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้", { id: loadingToastId });
      }
    },
    [dispatch],
  );

  const fetchNotificationList = useCallback(
    async (userID: string, pageParameter = 1) => {
      if (!userID) return;

      const pageText = String(pageParameter);

      setTodayNotificationDataset((previousState) => ({
        ...previousState,
        loading: true,
      }));
      setWeekNotificationDataset((previousState) => ({
        ...previousState,
        loading: true,
      }));

      const loadingToastId = toast.loading("กำลังโหลดข้อมูลแจ้งเตือน...");

      try {
        const weeklyResponse = await dispatch(
          GET_NOTIFICATION_WEEK_LIST({ user_id: userID, page: pageText }),
        ).unwrap();
        const todayResponse = await dispatch(
          GET_NOTIFICATION_TODAY_LIST({ user_id: userID, page: pageText }),
        ).unwrap();

        const hasApiErrorStatus =
          weeklyResponse?.raw?.Status === "Error" ||
          todayResponse?.raw?.Status === "Error";

        if (hasApiErrorStatus) {
          const curlCommandToCopy =
            weeklyResponse?.curl ?? todayResponse?.curl ?? "";
          toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน", {
            id: loadingToastId,
            description: curlCommandToCopy
              ? "คัดลอก CURL แล้วแจ้งทีมพัฒนา"
              : undefined,
            action: curlCommandToCopy
              ? {
                  label: "คัดลอก CURL",
                  onClick: () =>
                    navigator.clipboard.writeText(curlCommandToCopy),
                }
              : undefined,
          });
        }

        setWeekNotificationDataset({
          data: weeklyResponse?.data ?? [],
          loading: false,
        });
        setTodayNotificationDataset({
          data: todayResponse?.data ?? [],
          loading: false,
        });
        setCurlWeekCommand(weeklyResponse?.curl ?? "");
        setCurlTodayCommand(todayResponse?.curl ?? "");
        if (!hasApiErrorStatus) {
          toast.success("โหลดข้อมูลแจ้งเตือนสำเร็จ", { id: loadingToastId });
        }
      } catch (errorResponse: any) {
        setWeekNotificationDataset((previousState) => ({
          ...previousState,
          loading: false,
        }));
        setTodayNotificationDataset((previousState) => ({
          ...previousState,
          loading: false,
        }));
        toast.error(
          errorResponse?.message ?? "ไม่สามารถโหลดข้อมูลแจ้งเตือนได้",
          {
            id: loadingToastId,
          },
        );
      }
    },
    [dispatch],
  );

  const handleFormSubmit = useCallback(async () => {
    try {
      const formValues = await formInstance.validateFields();
      setCurrentPageNumber(1);
      await fetchNotificationList(formValues.userID, 1);
    } catch (errorResponse) {}
  }, [fetchNotificationList, formInstance]);

  const handleClearForm = useCallback(() => {
    formInstance.resetFields();
    setCurrentFilterStep(0);
    setTodayNotificationDataset({ data: [], loading: false });
    setWeekNotificationDataset({ data: [], loading: false });
    setCurlTodayCommand("");
    setCurlWeekCommand("");
    toast.success("ล้างข้อมูลการค้นหาเรียบร้อยแล้ว");
  }, [formInstance]);

  const handlePageChange = useCallback(
    async (nextPageNumber: number) => {
      const formValues = formInstance.getFieldsValue();
      if (!formValues?.userID) return;
      setCurrentPageNumber(nextPageNumber);
      await fetchNotificationList(formValues.userID, nextPageNumber);
    },
    [fetchNotificationList, formInstance],
  );

  const handleOpenDetailModal = useCallback(
    async (notificationMessageId: number) => {
      const formValues = formInstance.getFieldsValue();
      if (!formValues?.userID) {
        toast.warning("กรุณาเลือกผู้ใช้ก่อน");
        return;
      }

      const loadingToastId = toast.loading("กำลังโหลดรายละเอียดข้อความ...");
      try {
        await dispatch(
          GET_NOTIFICATION_MESSAGE({
            user_id: formValues.userID,
            message_id: String(notificationMessageId),
          }),
        ).unwrap();
        setIsDetailModalVisible(true);
        toast.success("โหลดรายละเอียดสำเร็จ", { id: loadingToastId });
      } catch (errorResponse: any) {
        toast.error(errorResponse?.message ?? "ไม่สามารถโหลดรายละเอียดได้", {
          id: loadingToastId,
        });
      }
    },
    [dispatch, formInstance],
  );

  const getColumnSearchProps = useCallback(
    (dataFieldKey: SearchableColumnKey, columnTitle: string): TableColumn => ({
      key: dataFieldKey,
      filterDropdown: ({
        setSelectedKeys: setSelectedFilterKeys,
        selectedKeys: selectedFilterKeys,
        confirm: confirmFilter,
        clearFilters: clearTableFilters,
      }) => {
        const filterCellValue =
          (selectedFilterKeys[0] as string | undefined) ?? "";

        return (
          <Flex
            vertical
            style={{ padding: 12 }}
            onKeyDown={(interactionEvent) => interactionEvent.stopPropagation()}
          >
            <Input
              ref={(inputNode) => {
                searchInputRefs.current[dataFieldKey] = inputNode;
              }}
              placeholder={`ค้นหา ${columnTitle}`}
              value={filterCellValue}
              onChange={(interactionEvent) => {
                const { value: inputFilterValue } = interactionEvent.target;
                setSelectedFilterKeys(
                  inputFilterValue ? [inputFilterValue] : [],
                );
              }}
              onPressEnter={() => confirmFilter()}
              style={{ marginBottom: 8, display: "block" }}
              suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            />
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={() => confirmFilter()}
              >
                ค้นหา
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearTableFilters?.();
                  confirmFilter({ closeDropdown: true });
                }}
              >
                รีเซ็ต
              </Button>
            </Space>
          </Flex>
        );
      },
      filterIcon: (isColumnFiltered) => (
        <SearchOutlined
          style={{ color: isColumnFiltered ? "#1677ff" : undefined }}
        />
      ),
      onFilter: (filterCellValue, notificationRecord) => {
        const rawCellValue = notificationRecord[dataFieldKey];
        if (!rawCellValue) return false;
        return String(rawCellValue)
          .toLowerCase()
          .includes(String(filterCellValue).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (isFilterVisible) => {
          if (isFilterVisible) {
            setTimeout(
              () => searchInputRefs.current[dataFieldKey]?.select(),
              100,
            );
          }
        },
      },
    }),
    [],
  );

  const tableColumns = useMemo<ColumnsType<ResponseNotification>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        render: (_textValue, _notificationRecord, indexNumber) =>
          indexNumber + 1 + (currentPageNumber - 1) * 10,
        width: 70,
        align: "center",
        fixed: "left",
      },
      {
        title: "Message ID",
        dataIndex: "nMessageID",
        width: 120,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          Number(firstRecord.nMessageID) - Number(secondRecord.nMessageID),
        ...getColumnSearchProps("nMessageID", "รหัสข้อความ"),
        render: (cellValue) => (
          <Typography.Text copyable style={{ fontFamily: "monospace" }}>
            {cellValue}
          </Typography.Text>
        ),
      },
      {
        title: "Letter ID",
        dataIndex: "letter_id",
        width: 120,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          Number(firstRecord.letter_id || 0) -
          Number(secondRecord.letter_id || 0),
        ...getColumnSearchProps("letter_id", "Letter ID"),
        render: (cellValue) => (
          <Text type="secondary" style={{ fontFamily: "monospace" }}>
            {cellValue || "-"}
          </Text>
        ),
      },
      {
        title: "School ID",
        dataIndex: "school_id",
        width: 100,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          Number(firstRecord.school_id || 0) -
          Number(secondRecord.school_id || 0),
        ...getColumnSearchProps("school_id", "รหัสโรงเรียน"),
        render: (cellValue) => <Tag color="orange">{cellValue || "-"}</Tag>,
      },
      {
        title: "วันที่ส่ง",
        dataIndex: "dSend",
        width: 160,
        sorter: (firstRecord, secondRecord) =>
          dayjs(firstRecord.dSend).valueOf() -
          dayjs(secondRecord.dSend).valueOf(),
        render: (cellValue: string) => (
          <Text style={{ fontSize: 13, whiteSpace: "nowrap" }}>
            {convertTimeZoneToThai(new Date(cellValue))}
          </Text>
        ),
      },
      {
        title: "ประเภท",
        dataIndex: "nType",
        key: "nType",
        width: 130,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          Number(firstRecord.nType) - Number(secondRecord.nType),
        render: (cellValue: number) => (
          <Tag color="geekblue" style={{ margin: 0, borderRadius: 4 }}>
            {getNotificationType(cellValue)}
          </Tag>
        ),
        filters: [1, 2, 3, 5, 8].map((typeValue) => ({
          text: getNotificationType(typeValue),
          value: typeValue,
        })),
        onFilter: (filterValue, notificationRecord) =>
          Number(notificationRecord.nType) === Number(filterValue),
      },
      {
        title: "สถานะ",
        dataIndex: "nStatus",
        key: "nStatus",
        width: 110,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          Number(firstRecord.nStatus) - Number(secondRecord.nStatus),
        render: (cellValue: number) => (
          <Tag
            color={cellValue === 1 ? "success" : "default"}
            icon={
              cellValue === 1 ? (
                <CheckCircleOutlined />
              ) : (
                <CloseCircleOutlined />
              )
            }
            style={{ borderRadius: "12px", padding: "0 10px", margin: 0 }}
          >
            {getNotificationRead(cellValue)}
          </Tag>
        ),
        filters: [
          { text: "อ่านแล้ว", value: 1 },
          { text: "ยังไม่อ่าน", value: 0 },
        ],
        onFilter: (filterValue, notificationRecord) =>
          Number(notificationRecord.nStatus) === Number(filterValue),
      },
      {
        title: "หัวข้อ",
        dataIndex: "sTitle",
        width: 180,
        sorter: (firstRecord, secondRecord) =>
          (firstRecord.sTitle || "").localeCompare(secondRecord.sTitle || ""),
        ...getColumnSearchProps("sTitle", "หัวข้อ"),
        render: (textValue: string) => (
          <Text strong style={{ fontSize: 13, display: "block" }}>
            {textValue || "-"}
          </Text>
        ),
      },
      {
        title: "ข้อความ",
        dataIndex: "sMessage",
        width: 350,
        sorter: (firstRecord, secondRecord) =>
          (firstRecord.sMessage || "").localeCompare(
            secondRecord.sMessage || "",
          ),
        ...getColumnSearchProps("sMessage", "ข้อความ"),
        render: (textValue: string) => (
          <Typography.Paragraph
            style={{
              width: "100%",
              margin: 0,
              fontSize: 13,
              lineHeight: "1.5",
            }}
            ellipsis={{ rows: 2, tooltip: true }}
          >
            {textValue || "-"}
          </Typography.Paragraph>
        ),
      },
      {
        title: "Log Status",
        dataIndex: "LogStatus",
        width: 100,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          Number(firstRecord.LogStatus || 0) -
          Number(secondRecord.LogStatus || 0),
        render: (cellValue) =>
          cellValue ? (
            <Tag bordered={false} color="purple">
              {cellValue}
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
        render: (hasAttachmentFile) =>
          hasAttachmentFile ? (
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
        render: (cellValue: string | null) =>
          cellValue ? (
            <Image
              src={cellValue}
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
        render: (_textValue, notificationRecord) => (
          <Tooltip title="ดูรายละเอียดเต็ม">
            <Button
              type="primary"
              variant="text"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() =>
                handleOpenDetailModal(notificationRecord.nMessageID)
              }
            />
          </Tooltip>
        ),
      },
    ],
    [
      activeTabKey,
      curlTodayCommand,
      curlWeekCommand,
      getColumnSearchProps,
      handleOpenDetailModal,
      currentPageNumber,
    ],
  );

  const handleSchoolSelectionChange = (schoolId: string) => {
    formInstance.setFieldsValue({ userID: undefined });
    setCurrentFilterStep(0);
    fetchUsersBySchoolId(schoolId);
  };

  const handleCopyCurlCommand = () => {
    const curlCommandString =
      activeTabKey === TODAY_KEY ? curlTodayCommand : curlWeekCommand;
    if (!curlCommandString) {
      toast.info("ไม่พบคำสั่ง CURL");
      return;
    }
    navigator.clipboard.writeText(curlCommandString);
    toast.success("คัดลอกคำสั่ง CURL แล้ว");
  };

  const notificationTabsItems: TabsProps["items"] = [
    {
      key: TODAY_KEY,
      label: (
        <span>
          <MessageOutlined /> ข้อความวันนี้
        </span>
      ),
      children: (
        <Table<ResponseNotification>
          dataSource={todayNotificationDataset.data}
          loading={todayNotificationDataset.loading}
          columns={tableColumns}
          rowKey={(notificationRecord) => String(notificationRecord.nMessageID)}
          pagination={false}
          scroll={{ x: 1620 }}
          size="middle"
        />
      ),
    },
    {
      key: SEVEN_DAYS_KEY,
      label: (
        <span>
          <FileTextOutlined /> ย้อนหลัง 7 วัน
        </span>
      ),
      children: (
        <Table<ResponseNotification>
          dataSource={weekNotificationDataset.data}
          loading={weekNotificationDataset.loading}
          columns={tableColumns}
          rowKey={(notificationRecord) => String(notificationRecord.nMessageID)}
          pagination={false}
          scroll={{ x: 1620 }}
          size="middle"
        />
      ),
    },
  ];

  const renderDetailModalContent = () => {
    const notificationDetail = notificationMessageDetailState?.response?.data;
    if (!notificationDetail) {
      return null;
    }

    return (
      <Modal
        title={
          <Space>
            <MessageOutlined style={{ color: token.colorPrimary }} />
            <Typography.Title level={5} style={{ margin: 0 }}>
              รายละเอียดข้อความแจ้งเตือน
            </Typography.Title>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            ปิดหน้าต่าง
          </Button>,
        ]}
        width={800}
        centered
        styles={{ body: { padding: "20px" } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Card
            bordered={false}
            style={{
              background: token.colorFillAlter,
              borderRadius: 12,
              borderLeft: `4px solid ${token.colorPrimary}`,
            }}
          >
            <Flex vertical gap="small">
              <Typography.Title level={4} style={{ margin: 0 }}>
                {notificationDetail.sTitle || "ไม่มีหัวข้อ"}
              </Typography.Title>
              <Typography.Paragraph
                style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: token.colorText,
                  whiteSpace: "pre-wrap",
                  marginBottom: 0,
                  padding: "8px 0",
                }}
              >
                {notificationDetail.sMessage ?? "-"}
              </Typography.Paragraph>
              <Flex align="center" gap="small" wrap="wrap">
                <Tag color="geekblue" icon={<InfoCircleOutlined />}>
                  {getNotificationType(notificationDetail.nType ?? 0)}
                </Tag>
                <Tag
                  color={
                    notificationDetail.nStatus === 1 ? "success" : "warning"
                  }
                  icon={
                    notificationDetail.nStatus === 1 ? (
                      <CheckCircleOutlined />
                    ) : (
                      <EyeOutlined />
                    )
                  }
                >
                  {getNotificationRead(notificationDetail.nStatus ?? 0)}
                </Tag>
                {notificationDetail.LogStatus !== undefined && (
                  <Tag bordered={false} color="purple">
                    Log Status: {notificationDetail.LogStatus}
                  </Tag>
                )}
              </Flex>
            </Flex>
          </Card>

          <Descriptions
            title={
              <Space>
                <UnorderedListOutlined />
                ข้อมูลพื้นฐาน
              </Space>
            }
            bordered
            size="small"
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            labelStyle={{
              width: "140px",
              background: token.colorFillAlter,
              fontWeight: 600,
            }}
          >
            <Descriptions.Item label="Message ID">
              <Typography.Text copyable strong>
                {notificationDetail.nMessageID ?? "-"}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="School ID">
              <Tag color="orange">{notificationDetail.school_id ?? "-"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="วันที่ส่ง">
              {notificationDetail.dSend
                ? convertTimeZoneToThai(new Date(notificationDetail.dSend))
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Letter ID">
              <Typography.Text type="secondary">
                {notificationDetail.letter_id ?? "-"}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled ID">
              <Typography.Text type="secondary">
                {notificationDetail.scheduled_id ?? "-"}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Push ID">
              <Typography.Text type="secondary">
                {notificationDetail.push_id ?? "-"}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>

          {(notificationDetail.homework_id ||
            notificationDetail.sell_id ||
            notificationDetail.ReplyType ||
            notificationDetail.file) && (
            <Descriptions
              title={
                <Space>
                  <FileTextOutlined />
                  ข้อมูลระบบทางเทคนิค
                </Space>
              }
              bordered
              size="small"
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              labelStyle={{
                width: "140px",
                background: token.colorFillAlter,
                fontWeight: 600,
              }}
            >
              <Descriptions.Item label="Homework ID">
                {notificationDetail.homework_id ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Sell ID">
                {notificationDetail.sell_id ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Reply Type">
                {notificationDetail.ReplyType || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="ไฟล์แนบ">
                {notificationDetail.file ? (
                  <Tag color="blue" icon={<FileTextOutlined />}>
                    มีไฟล์แนบ
                  </Tag>
                ) : (
                  "ไม่มีไฟล์"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะการตอบกลับ">
                <Tag
                  color={notificationDetail.replyStatus ? "blue" : "default"}
                >
                  {notificationDetail.replyStatus ? "เปิดการตอบกลับ" : "ปิด"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ผู้สร้างข่าว">
                {notificationDetail.NewsCreatedBy ?? "-"}
              </Descriptions.Item>
            </Descriptions>
          )}

          {notificationDetail.homework &&
            (notificationDetail.homework.teachername ||
              notificationDetail.homework.detail) && (
              <Descriptions
                title={
                  <Space>
                    <BookOutlined />
                    รายละเอียดการบ้าน
                  </Space>
                }
                bordered
                size="small"
                column={1}
                labelStyle={{
                  width: "140px",
                  background: token.colorWarningBg,
                  color: token.colorWarningText,
                  fontWeight: 600,
                }}
              >
                <Descriptions.Item label="ครูผู้สอน">
                  {notificationDetail.homework.teachername ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="วิชาที่สอน">
                  {notificationDetail.homework.planename ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="ช่วงเวลา">
                  {notificationDetail.homework.daystart &&
                  notificationDetail.homework.dayend
                    ? `${notificationDetail.homework.daystart} - ${notificationDetail.homework.dayend}`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="รายละเอียด">
                  <Typography.Text
                    style={{ whiteSpace: "pre-wrap", display: "block" }}
                  >
                    {notificationDetail.homework.detail ?? "-"}
                  </Typography.Text>
                </Descriptions.Item>
              </Descriptions>
            )}

          {notificationMessageDetailState?.response?.curl && (
            <Flex vertical style={{ marginTop: 8 }}>
              <Flex
                align="center"
                justify="space-between"
                style={{ marginBottom: 8 }}
              >
                <Typography.Text type="secondary" strong>
                  <CodeOutlined /> Developer Info (CURL)
                </Typography.Text>
                <Button
                  size="small"
                  variant="filled"
                  color="default"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      notificationMessageDetailState.response.curl || "",
                    );
                    toast.success("คัดลอก CURL แล้ว");
                  }}
                >
                  คัดลอกคำสั่ง
                </Button>
              </Flex>
              <Flex
                vertical
                style={{
                  background: token.colorFillAlter,
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  marginTop: 8,
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: `1px solid ${token.colorBorderSecondary}`,
                  color: token.colorTextSecondary,
                }}
              >
                {notificationMessageDetailState.response.curl}
              </Flex>
            </Flex>
          )}
        </Space>
      </Modal>
    );
  };

  return (
    <DashboardLayout>
      <Flex vertical gap={24} style={{ width: "100%" }}>
        <HeaderBar
          icon={<MessageOutlined />}
          title="ตรวจสอบการแจ้งเตือน (Notification Logs)"
          subTitle="ค้นหาและตรวจสอบประวัติการแจ้งเตือนของผู้ใช้งานรายบุคคล"
        />

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
            current={currentFilterStep}
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
            form={formInstance}
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
                    options={schoolListOptions}
                    loading={schoolListState.loading}
                    onChange={handleSchoolSelectionChange}
                    filterOption={(inputFilterText, selectOption) =>
                      String(selectOption?.label ?? "")
                        .toLowerCase()
                        .includes(inputFilterText.toLowerCase())
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
                    disabled={currentFilterStep < 1}
                    placeholder={
                      currentFilterStep < 1
                        ? "กรุณาเลือกโรงเรียนก่อน"
                        : "พิมพ์ชื่อ หรือ ID เพื่อค้นหา..."
                    }
                    options={userListOptions}
                    loading={userListBySchoolState.loading}
                    filterOption={(inputFilterText, selectOption) =>
                      String(selectOption?.label ?? "")
                        .toLowerCase()
                        .includes(inputFilterText.toLowerCase())
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
                loading={isOverallLoading}
                size="large"
                icon={<SearchOutlined />}
                style={{ padding: "0 32px" }}
              >
                ค้นหาข้อมูล
              </Button>
            </Flex>
          </Form>
        </Card>

        {(todayNotificationDataset.data.length > 0 ||
          weekNotificationDataset.data.length > 0) && (
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={8}>
              <SummaryCard
                title="ข้อความทั้งหมด"
                value={notificationSummaryStatistics.totalCount.toLocaleString()}
                subtitle="จำนวนการแจ้งเตือนที่พบในระบบ"
                icon={<MessageOutlined />}
                color={token.colorPrimary}
              />
            </Col>
            <Col xs={24} sm={8}>
              <SummaryCard
                title="อ่านแล้ว"
                value={notificationSummaryStatistics.readCount.toLocaleString()}
                subtitle="จำนวนข้อความที่ผู้ใช้เปิดอ่านแล้ว"
                icon={<CheckCircleOutlined />}
                color={token.colorSuccess}
              />
            </Col>
            <Col xs={24} sm={8}>
              <SummaryCard
                title="ยังไม่อ่าน"
                value={notificationSummaryStatistics.unreadCount.toLocaleString()}
                subtitle="จำนวนข้อความที่ยังไม่ได้เปิดอ่าน"
                icon={<CloseCircleOutlined />}
                color={token.colorError}
              />
            </Col>
          </Row>
        )}

        {(todayNotificationDataset.data.length > 0 ||
          weekNotificationDataset.data.length > 0) && (
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
                  {(curlTodayCommand || curlWeekCommand) && (
                    <Tooltip title="คัดลอกคำสั่ง CURL สำหรับ QA/Dev">
                      <Button
                        type="text"
                        icon={<CodeOutlined />}
                        onClick={handleCopyCurlCommand}
                        style={{ color: token.colorWarning, fontWeight: 600 }}
                      >
                        Copy CURL
                      </Button>
                    </Tooltip>
                  )}
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() =>
                      handlePageChange(Math.max(currentPageNumber - 1, 1))
                    }
                    disabled={currentPageNumber <= 1}
                  />
                  <Tag
                    color="blue"
                    style={{ margin: 0, padding: "2px 12px", borderRadius: 6 }}
                  >
                    หน้า {currentPageNumber}
                  </Tag>
                  <Button
                    icon={<RightOutlined />}
                    onClick={() => handlePageChange(currentPageNumber + 1)}
                  />
                </Space>
              </Flex>

              <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                items={notificationTabsItems}
                type="card"
              />
            </Flex>
          </Card>
        )}
      </Flex>

      {isDetailModalVisible && renderDetailModalContent()}

      <StatusModalComponent
        open={statusModalState.open}
        type={statusModalState.type}
        title={statusModalState.title}
        message={statusModalState.message}
        onClose={() =>
          setStatusModalState((previousState) => ({
            ...previousState,
            open: false,
          }))
        }
      />
    </DashboardLayout>
  );
};

export default NotificationPage;
