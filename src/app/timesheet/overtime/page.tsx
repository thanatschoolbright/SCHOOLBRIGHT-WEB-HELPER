"use client";

import { useState, useEffect, useRef } from "react";
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
} from "antd";
import type { InputRef, MenuProps } from "antd";
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
  { text: "รออนุมัติ", value: "pending" },
  { text: "อนุมัติ", value: "approved" },
  { text: "ปฏิเสธ", value: "rejected" },
];

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

const ActionDropdown = ({
  record,
  router,
  onViewDetails,
  onDelete,
  onSendEmail,
  fetchDetails,
  onApprove,
}: {
  record: OvertimeRecord;
  router: any;
  onViewDetails: (items: any[]) => void;
  onDelete: (id: string | number) => Promise<void>;
  onSendEmail: (id: string | number) => Promise<void>;
  fetchDetails: (id: string | number) => Promise<any[]>;
  onApprove: (id: string | number, status: string) => Promise<void>;
}) => {
  const authentication = useAppSelector((state) => state.callAdminLogin);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    (record.status as string) || "pending"
  );
  const handleView = async () => {
    try {
      const items = await fetchDetails(record.id);
      if (Array.isArray(items) && items.length > 0) {
        onViewDetails(items);
      } else {
        toast.error("ไม่พบข้อมูลรายละเอียด");
      }
    } catch (error) {
      console.error("Error viewing details:", error);
      toast.error("เกิดข้อผิดพลาดขณะโหลดรายละเอียด");
    }
  };

  const handlePreview = () => {
    router.push(`/timesheet/overtime/preview/${record.id}`);
  };

  const handleSendEmail = async () => {
    try {
      const currentUserId = await getCurrentUserId(authentication);
      if (currentUserId !== BYPASS_ADMIN_ID)
        return toast.error("คุณไม่มีสิทธิ์ส่งอีเมลนี้");
      await onSendEmail(record.id);
      toast.success("ส่งอีเมลเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("ไม่สามารถส่งอีเมลได้");
    }
  };

  const handleOTChangeStatus = async () => {
    // open status picker modal
    const currentUserId = await getCurrentUserId(authentication);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");
    setSelectedStatus((record.status as string) || "pending");
    setStatusModalVisible(true);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "view",
      label: "ดูรายละเอียด",
      icon: <EyeOutlined style={{ fontSize: 14 }} />,
      onClick: handleView,
    },
    {
      key: "preview",
      label: "ดูในรูปแบบ PDF",
      icon: <FilePdfOutlined style={{ fontSize: 14 }} />,
      onClick: handlePreview,
    },
    {
      key: "change_status",
      label: "ปรับสถานะใบโอที",
      icon: <CheckOutlined style={{ fontSize: 14 }} />,
      onClick: handleOTChangeStatus,
    },
    {
      key: "email",
      label: "ส่งอีเมล",
      icon: <MailOutlined style={{ fontSize: 14 }} />,
      onClick: handleSendEmail,
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: (
        <ConfirmDelete
          id={record.id}
          onConfirm={async (id) => {
            await onDelete(id!);
            toast.success("ลบรายการเรียบร้อยแล้ว");
          }}
          title="ต้องการลบรายการ OT นี้หรือไม่?"
          okText="ลบ"
          cancelText="ยกเลิก"
        >
          <span style={{ color: "inherit" }}>ลบรายการ</span>
        </ConfirmDelete>
      ),
      icon: <DeleteOutlined style={{ fontSize: 14 }} />,
      danger: true,
    },
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomRight"
        overlayStyle={{ minWidth: 180 }}
      >
        <Button
          type="text"
          icon={<MoreOutlined />}
          size="middle"
          style={{
            width: 32,
            height: 32,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </Dropdown>

      <Modal
        title="ปรับสถานะใบโอที"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={async () => {
          try {
            setStatusModalVisible(false);
            await onApprove(record.id, selectedStatus);
          } catch (err) {
            console.error(err);
          }
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ minWidth: 120 }}>สถานะ</div>
          <Select
            value={selectedStatus}
            onChange={(v) => setSelectedStatus(String(v))}
            options={[
              { label: "รออนุมัติ", value: "pending" },
              { label: "อนุมัติ", value: "approved" },
              { label: "ปฏิเสธ", value: "rejected" },
            ]}
            style={{ minWidth: 220 }}
          />
        </div>
      </Modal>
    </>
  );
};

export default function OvertimeManagementPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const authentication = useAppSelector((state) => state.callAdminLogin);
  const searchInputRef = useRef<InputRef | null>(null);

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

  const fetchUserList = async () => {
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
  };

  const fetchDescriptionList = async () => {
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
  };

  const fetchOvertimeList = async (options?: {
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

      if (isBypassUser) {
        toast.info("คุณกำลังใช้สิทธิ์ผู้ดูแลระบบ");
      }

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
        toast.error("ไม่สามารถดึงข้อมูลโอทีได้");
        return null;
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
      console.error("Error fetching overtime list:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      return null;
    } finally {
      setLoading(false);
    }
  };

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

      toast.error(body?.message_th ?? "ไม่สามารถสร้างรายการได้");
      return null;
    } catch (error) {
      console.error("Error creating overtime:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างรายการ");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteOvertime = async (id?: string | number) => {
    if (!id) {
      toast.error("ไม่พบ ID สำหรับลบรายการ");
      return null;
    }

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
        await fetchOvertimeList({
          page: paginationState.current,
          pageSize: paginationState.pageSize,
        });
        return body.data;
      }

      toast.error(body?.message_th ?? "ไม่สามารถลบรายการได้");
      return null;
    } catch (error) {
      console.error("Error deleting overtime:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveOvertime = async (
    id?: string | number,
    status: string = "approved"
  ) => {
    if (!id) {
      toast.error("ไม่พบ ID สำหรับอนุมัติ");
      return null;
    }

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
        await fetchOvertimeList({
          page: paginationState.current,
          pageSize: paginationState.pageSize,
        });
        return body.data;
      }

      toast.error(body?.message_th ?? "ไม่สามารถอนุมัติได้");
      return null;
    } catch (error) {
      console.error("Error approving overtime:", error);
      toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailToHR = async (id?: string | number) => {
    if (!id) {
      toast.error("ไม่พบ ID สำหรับส่งอีเมล");
      return null;
    }

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

      toast.error(body?.message_th ?? "ไม่สามารถส่งอีเมลได้");
      return null;
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("เกิดข้อผิดพลาดขณะส่งอีเมล");
      return null;
    } finally {
      setLoading(false);
    }
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
      await fetchOvertimeList({
        page: paginationState.current,
        pageSize: paginationState.pageSize,
      });
    }
  };

  const handleTableChange = (pagination: any, filters: any) => {
    const { current, pageSize } = pagination;
    const payloadFilters: any = {};

    if (filters.status && filters.status.length > 0) {
      payloadFilters.status = filters.status[0];
    }

    fetchOvertimeList({ page: current, pageSize, filters: payloadFilters });
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: any) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInputRef}
          placeholder={`ค้นหา ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => {
            confirm();
            fetchOvertimeList({
              page: 1,
              pageSize: paginationState.pageSize,
              filters: { [dataIndex]: selectedKeys[0] },
            });
          }}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm();
              fetchOvertimeList({
                page: 1,
                pageSize: paginationState.pageSize,
                filters: { [dataIndex]: selectedKeys[0] },
              });
            }}
            size="small"
            style={{ width: 90 }}
          >
            ค้นหา
          </Button>
          <Button
            onClick={() => {
              clearFilters();
              fetchOvertimeList({
                page: 1,
                pageSize: paginationState.pageSize,
              });
            }}
            size="small"
            style={{ width: 90 }}
          >
            ล้าง
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={filtered ? "#1890ff" : "currentColor"}
      >
        <path d="M3 5h18v2L13 13v6l-2 1v-7L3 7V5z" />
      </svg>
    ),
  });

  const descriptionColumns = [
    { title: "รหัส", dataIndex: "id", key: "id", width: 80 },
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "จำนวน (ชั่วโมง)",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "ผู้มอบหมาย",
      dataIndex: "assignee",
      key: "assignee",
    },
  ];

  const mainColumns = [
    {
      title: "รหัส",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "ผู้ร้องขอ",
      dataIndex: "requester_id",
      key: "requester_id",
      ...getColumnSearchProps("requester_id"),
      render: (value: string) => {
        const firstname = getUserById(value)?.firstname;
        const lastname = getUserById(value)?.lastname;
        const employee_code = getUserById(value)?.employee_code;
        return (
          <Typography.Text>
            {`${firstname ?? ""} ${lastname ?? ""} (${
              employee_code ?? ""
            })`.trim() || "-"}
          </Typography.Text>
        );
      },
    },
    {
      title: "วันที่ขอ",
      dataIndex: "request_date",
      key: "request_date",
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "รออนุมัติ", value: "pending" },
        { text: "อนุมัติ", value: "approved" },
        { text: "ปฏิเสธ", value: "rejected" },
      ],
      render: (status: string) => {
        const statusConfig = {
          approved: { color: "green", label: "อนุมัติ" },
          rejected: { color: "red", label: "ปฏิเสธ" },
          pending: { color: "gold", label: "รออนุมัติ" },
        };
        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.pending;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "สร้างโดย",
      dataIndex: "created_by",
      key: "created_by",
      render: (value: string) => {
        const firstname = getUserById(value)?.firstname;
        const lastname = getUserById(value)?.lastname;
        const employee_code = getUserById(value)?.employee_code;
        return (
          <Typography.Text>
            {`${firstname ?? ""} ${lastname ?? ""} (${
              employee_code ?? ""
            })`.trim() || "-"}
          </Typography.Text>
        );
      },
      ...getColumnSearchProps("created_by"),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "",
      key: "actions",
      width: 60,
      fixed: "right" as const,
      align: "center" as const,
      render: (_: any, record: OvertimeRecord) => (
        <ActionDropdown
          record={record}
          router={router}
          onViewDetails={(items) => {
            setSelectedDetail(items[0]);
            setDetailVisible(true);
          }}
          onDelete={deleteOvertime}
          onSendEmail={sendEmailToHR}
          onApprove={approveOvertime}
          fetchDetails={async (id) => {
            const result = await fetchOvertimeList({ id });
            return Array.isArray(result) ? result : [];
          }}
        />
      ),
    },
  ];

  useEffect(() => {
    fetchUserList();
    fetchDescriptionList();
    fetchOvertimeList();
  }, []);

  return (
    <DashboardLayout>
      <HeaderBar
        icon={<TeamOutlined />}
        title="ระบบโอที"
        subTitle="จัดการบันทึกเวลาทำงานล่วงเวลา"
        color="none"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button type="primary" onClick={() => setVisible(true)}>
          เพิ่มบันทึกโอที
        </Button>
      </div>

      <Modal
        title="ฟอร์มขออนุมัติโอที"
        open={visible}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnHidden
        width={880}
        centered
        maskClosable={false}
        styles={{
          body: {
            maxHeight: "70vh",
            overflowY: "auto",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="วันที่"
                name="request_date"
                rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="ผู้มอบหมายงาน"
                name="assignee"
                rules={[{ required: true, message: "กรุณาเลือกผู้มอบหมายงาน" }]}
              >
                <Select
                  placeholder="เลือกผู้มอบหมายงาน"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={userOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="ประเภททำงานล่วงเวลา (โอที)"
                name="overtimeType"
                rules={[
                  { required: true, message: "กรุณาเลือกประเภททำงานล่วงเวลา" },
                ]}
              >
                <Select placeholder="เลือกประเภททำงานล่วงเวลา">
                  <Select.Option value="normal">วันทำงานปกติ</Select.Option>
                  <Select.Option value="holiday">วันหยุด</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.List name="descriptions">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => {
                      const { key, ...restField } = field as any;
                      return (
                        <Row
                          gutter={16}
                          key={field.key}
                          style={{ marginBottom: 8 }}
                        >
                          <Col xs={24} sm={8} md={6}>
                            <Form.Item
                              {...restField}
                              label={`จำนวน (ชั่วโมง) #${field.name + 1}`}
                              name={[field.name, "duration"]}
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณากรอกจำนวนชั่วโมง",
                                },
                              ]}
                            >
                              <Input placeholder="เช่น 2.5" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={14} md={16}>
                            <Form.Item
                              {...restField}
                              label={`รายละเอียด #${field.name + 1}`}
                              name={[field.name, "description"]}
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณากรอกรายละเอียด",
                                },
                              ]}
                            >
                              <AutoComplete
                                options={descriptionOptions}
                                placeholder="ระบุรายละเอียดการทำงาน"
                                filterOption={(inputValue, option) =>
                                  String(option?.value ?? "")
                                    .toLowerCase()
                                    .includes(String(inputValue).toLowerCase())
                                }
                                allowClear
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>

                          {/* ซ่อน วันที่ต้องมีค่าเท่ากับ request_date */}
                          <Col xs={0} sm={0} md={0}>
                            <Form.Item
                              {...restField}
                              label={`วันที่ #${field.name + 1}`}
                              name={[field.name, "date"]}
                              initialValue={form.getFieldValue("request_date")}
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณาเลือกวันที่",
                                },
                              ]}
                            >
                              <DatePicker
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                              />
                            </Form.Item>
                          </Col>

                          {/* ซ่อน ผู้มอบหมายงาน */}
                          <Col xs={0} sm={0} md={0}>
                            <Form.Item
                              {...restField}
                              label={`ผู้มอบหมายงาน #${field.name + 1}`}
                              name={[field.name, "assignee"]}
                              initialValue={form.getFieldValue("assignee")}
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณาเลือกผู้มอบหมายงาน",
                                },
                              ]}
                            >
                              <Select
                                placeholder="เลือกผู้มอบหมายงาน"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                options={userOptions}
                              />
                            </Form.Item>
                          </Col>

                          <Col
                            xs={24}
                            sm={2}
                            md={2}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              type="text"
                              danger
                              onClick={() => remove(field.name)}
                              icon={
                                <MinusCircleOutlined style={{ fontSize: 20 }} />
                              }
                            />
                          </Col>
                        </Row>
                      );
                    })}

                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        disabled={fields.length >= 10}
                        style={{ width: "100%" }}
                      >
                        เพิ่มรายละเอียดเพิ่มเติม
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>

          <Form.Item>
            <Row justify="end">
              <Col>
                <Button
                  style={{ marginRight: 8 }}
                  onClick={() => {
                    form.resetFields();
                    setVisible(false);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={loading}
                >
                  ส่งคำขอ
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      <Card
        title="ตารางแสดงข้อมูลโอที"
        loading={loading && dataSource.length === 0}
      >
        <Table
          columns={mainColumns}
          dataSource={dataSource}
          rowKey="id"
          pagination={{
            current: paginationState.current,
            pageSize: paginationState.pageSize,
            total: paginationState.total,
            showSizeChanger: true,
          }}
          loading={loading}
          onChange={handleTableChange}
          bordered
          expandable={{
            expandedRowRender: (record: OvertimeRecord) => (
              <div>
                {Array.isArray(record.descriptions) &&
                record.descriptions.length > 0 ? (
                  <Table
                    columns={descriptionColumns}
                    dataSource={record.descriptions}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                ) : (
                  <span>-</span>
                )}
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="รายละเอียดคำขอโอที"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDetail ? (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="รหัส">
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
                {OT_STATUS.find((data) => data.value === selectedDetail.status)?.text || ""}
              </Descriptions.Item>
              <Descriptions.Item label="สร้างโดย">
                {selectedDetail.created_by}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่สร้าง">
                {selectedDetail.created_at
                  ? dayjs(selectedDetail.created_at).format("DD/MM/YYYY HH:mm")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Typography.Title level={4}>รายการโอที</Typography.Title>
            {Array.isArray(selectedDetail.descriptions) &&
            selectedDetail.descriptions.length > 0 ? (
              <List
                itemLayout="vertical"
                grid={{ gutter: 16, column: 1 }}
                split={false}
                dataSource={selectedDetail.descriptions}
                renderItem={(item: OvertimeDescription) => (
                  <List.Item key={item.id}>
                    <Card hoverable variant="outlined">
                      <Card.Meta
                        title={
                          <Typography.Text strong>
                            {item.date
                              ? dayjs(item.date).format("DD/MM/YYYY")
                              : "-"}
                          </Typography.Text>
                        }
                        description={
                          <Typography.Paragraph ellipsis={{ rows: 2 }}>
                            {item.description || "-"}
                          </Typography.Paragraph>
                        }
                      />
                      <Space size={16}>
                        <Tag color="blue">{item.duration || 0} ชม.</Tag>
                        <Typography.Text>
                          ผู้มอบหมาย: {item.assignee || "-"}
                        </Typography.Text>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="ไม่มีรายการ">-</Descriptions.Item>
              </Descriptions>
            )}
          </>
        ) : (
          <Skeleton active paragraph={{ rows: 6 }} />
        )}
      </Modal>
    </DashboardLayout>
  );
}
