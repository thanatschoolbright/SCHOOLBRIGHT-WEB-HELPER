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
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import type { TabsProps } from "antd";
import { SearchOutlined } from "@ant-design/icons";
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
            description: curlToCopy ? "คัดลอก CURL แล้วแจ้งทีมพัฒนา" : undefined,
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
        width: 80,
        align: "center",
      },
      {
        title: "รหัสข้อความ",
        dataIndex: "nMessageID",
        sorter: (a, b) => Number(a.nMessageID) - Number(b.nMessageID),
        ...getColumnSearchProps("nMessageID", "รหัสข้อความ"),
      },
      {
        title: "วันที่ส่ง",
        dataIndex: "dSend",
        sorter: (a, b) => dayjs(a.dSend).valueOf() - dayjs(b.dSend).valueOf(),
        render: (value: string) => convertTimeZoneToThai(new Date(value)),
        ...getColumnSearchProps("dSend", "วันที่ส่ง"),
      },
      {
        title: "ประเภท",
        dataIndex: "nType",
        key: "nType",
        sorter: (a, b) => Number(a.nType) - Number(b.nType),
        render: (value: number) => getNotificationType(value),
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
        sorter: (a, b) => Number(a.nStatus) - Number(b.nStatus),
        render: (value: number) => (
          <Tag color={value === 1 ? "green" : "red"}>
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
        ellipsis: true,
        ...getColumnSearchProps("sTitle", "หัวข้อ"),
      },
      {
        title: "ข้อความ",
        dataIndex: "sMessage",
        ellipsis: true,
        ...getColumnSearchProps("sMessage", "ข้อความ"),
      },
      {
        title: "โลโก้",
        dataIndex: "logo",
        key: "logo",
        render: (value: string | null) =>
          value ? (
            <Image
              src={value}
              alt="logo"
              width={40}
              height={40}
              className="object-contain rounded"
            />
          ) : (
            <Typography.Text type="secondary">ไม่มีรูป</Typography.Text>
          ),
      },
      {
        title: "การกระทำ",
        key: "actions",
        render: (_value, record) => (
          <Space>
            <Button onClick={() => openDetailModal(record.nMessageID)}>
              รายละเอียด
            </Button>
            <Button
              onClick={() => {
                const curlCommand = activeTab === TODAY ? curlToday : curlWeek;
                if (!curlCommand) {
                  toast.info("ไม่พบคำสั่ง CURL");
                  return;
                }
                navigator.clipboard.writeText(curlCommand);
                toast.success("คัดลอกคำสั่ง CURL แล้ว");
              }}
            >
              คัดลอก CURL
            </Button>
          </Space>
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
    console.info("Trigger Use Effect!");
    const selectedSchoolId = form.getFieldValue("schoolID");
    if (!selectedSchoolId) {
      form.setFieldsValue({ userID: undefined });
      return;
    }

    form.setFieldsValue({ userID: undefined });
    fetchUsersBySchool(selectedSchoolId);
  }, [fetchUsersBySchool, form, selectedSchoolID]);

  const tabs: TabsProps["items"] = [
    {
      key: TODAY,
      label: "ข้อความวันนี้",
      children: (
        <Table<ResponseNotification>
          dataSource={todayDataset.data}
          loading={todayDataset.loading}
          columns={columns}
          rowKey={(record) => String(record.nMessageID)}
          pagination={false}
          scroll={{ x: 1300 }}
        />
      ),
    },
    {
      key: SEVEN_DAYS,
      label: "ข้อความ 7 วันล่าสุด",
      children: (
        <Table<ResponseNotification>
          dataSource={weekDataset.data}
          loading={weekDataset.loading}
          columns={columns}
          rowKey={(record) => String(record.nMessageID)}
          pagination={false}
          scroll={{ x: 1300 }}
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
        title="รายละเอียดข้อความแจ้งเตือน"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
        }}
        footer={null}
        width={720}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Typography.Paragraph>{detail.sMessage ?? "-"}</Typography.Paragraph>

          <Card size="small" title="ข้อมูลทั่วไป">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text>
                Message ID : {detail.nMessageID ?? "-"}
              </Typography.Text>
              <Typography.Text>
                วันที่ส่ง :
                {detail.dSend
                  ? convertTimeZoneToThai(new Date(detail.dSend))
                  : "-"}
              </Typography.Text>
              <Typography.Text>
                สถานะ : {getNotificationRead(detail.nStatus ?? 0)}
              </Typography.Text>
              <Typography.Text>
                ประเภท : {getNotificationType(detail.nType ?? 0)}
              </Typography.Text>
              <Typography.Text>
                School ID : {detail.school_id ?? "-"}
              </Typography.Text>
              <Typography.Text>
                ไฟล์แนบ : {detail.file ? "มีไฟล์แนบ" : "ไม่มีไฟล์แนบ"}
              </Typography.Text>
              <Typography.Text>Logo : {detail.logo ?? "-"}</Typography.Text>
            </Space>
          </Card>

          {detail.homework && (
            <Card size="small" title="รายละเอียดการบ้าน">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Typography.Text>
                  Day Start : {detail.homework.daystart ?? "-"}
                </Typography.Text>
                <Typography.Text>
                  Day End : {detail.homework.dayend ?? "-"}
                </Typography.Text>
                <Typography.Text>
                  Detail : {detail.homework.detail ?? "-"}
                </Typography.Text>
                <Typography.Text>
                  Teacher : {detail.homework.teachername ?? "-"}
                </Typography.Text>
                <Typography.Text>
                  School ID : {detail.homework.SchoolID ?? "-"}
                </Typography.Text>
              </Space>
            </Card>
          )}

          {notificationMessageState?.response?.curl && (
            <Card size="small" title="Curl Command">
              <pre className="whitespace-pre-wrap text-xs">
                {notificationMessageState.response.curl}
              </pre>
            </Card>
          )}
        </Space>
      </Modal>
    );
  };

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="ค้นหาการแจ้งเตือนในแอป" variant="borderless">
          <Form
            layout="vertical"
            form={form}
            onFinish={handleFormSubmit}
            initialValues={{ schoolID: "", userID: "" }}
          >
            <Form.Item
              label="เลือกโรงเรียน"
              name="schoolID"
              rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
            >
              <Select
                showSearch
                placeholder="เลือกโรงเรียน"
                options={schoolOptions}
                loading={schoolState.loading}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label="เลือกผู้ใช้"
              name="userID"
              rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
            >
              <Select
                showSearch
                placeholder="เลือกผู้ใช้"
                options={userOptions}
                loading={userState.loading}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={overallLoading}>
                ค้นหา
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card
          title="ผลการค้นหา"
          variant="borderless"
          extra={
            <Space>
              <Button
                onClick={() => handlePageChange(Math.max(page - 1, 1))}
                disabled={page <= 1}
              >
                หน้าก่อนหน้า
              </Button>
              <Button onClick={() => handlePageChange(page + 1)}>
                หน้าถัดไป
              </Button>
            </Space>
          }
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
        </Card>
      </Space>

      {detailModalVisible && renderDetailModal()}
    </DashboardLayout>
  );
}
