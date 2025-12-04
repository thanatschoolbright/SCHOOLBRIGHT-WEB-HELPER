"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs, { Dayjs } from "dayjs";
import Swal from "sweetalert2";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";
import { getUserById } from "@helpers/local_storage/user.storage";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { categoryType } from "@data/timesheet.category.type";

import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Tag,
  Select,
  Descriptions,
  Tooltip,
  Badge,
  DatePicker,
  Row,
  Col,
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ProjectOutlined,
  CalendarOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { MenuProps } from "antd/lib";

interface Project {
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
}

interface ModalState {
  type: "" | "create" | "edit" | "delete" | "detail";
  data?: Project | null;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface FormValues {
  name: string;
  name_en?: string;
  description?: string;
  categoryType: string;
  status: string;
  start_date?: Dayjs;
  end_date?: Dayjs;
}

const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];
const PASSCODE = "LIGHT";

export default function ProjectManagementPage() {
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id || 0;
  const userRole = userAuth?.response?.data?.user_data?.position;

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [modalState, setModalState] = useState<ModalState>({
    type: "",
    data: null,
  });
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit: pagination.pageSize,
        page: pagination.current,
      });
      setProjects(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการได้");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  const handleSubmitForm = async (values: FormValues) => {
    setActionLoading(true);
    try {
      const payload = {
        ...values,
        by: adminId,
        start_date: values.start_date?.toISOString(),
        end_date: values.end_date?.toISOString(),
      };

      if (modalState.data?.id) {
        await axios.post("/api/v1/timesheet/project/insert/", {
          ...payload,
          id: modalState.data.id,
        });
        toast.success("อัปเดตโครงการสำเร็จ");
      } else {
        await axios.post("/api/v1/timesheet/project/insert/", payload);
        toast.success("สร้างโครงการสำเร็จ");
      }

      closeModal();
      fetchProjects();
    } catch {
      toast.error("ทำรายการล้มเหลว กรุณาลองใหม่");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.data?.id) return;

    try {
      await axios.post("/api/v1/timesheet/project/delete/", {
        id: modalState.data.id,
        by: adminId,
      });
      toast.success("ลบโครงการเรียบร้อยแล้ว");
      closeModal();
      fetchProjects();
    } catch {
      toast.error("ลบข้อมูลล้มเหลว");
    }
  };

  const closeModal = () => {
    setModalState({ type: "", data: null });
    setConfirmDeleteText("");
    form.resetFields();
  };

  const openCreateModal = () => {
    form.setFieldsValue({
      status: "open",
      start_date: dayjs(),
      end_date: dayjs(),
    });
    setModalState({ type: "create" });
  };

  const openEditModal = (record: Project) => {
    form.setFieldsValue({
      name: record.name,
      name_en: record.name_en,
      description: record.description,
      categoryType: record.categoryType,
      status: record.status,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    });
    setModalState({ type: "edit", data: record });
  };

  const calculateProjectProgress = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const now = dayjs();
    const total = end.diff(start, "day");
    const elapsed = now.diff(start, "day");
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getCategoryName = (categoryId: string) => {
    return (
      categoryType.find((c) => String(c.id) === String(categoryId))?.name ||
      categoryId
    );
  };

  const getSubProjectCount = (features?: Array<{ is_deleted: boolean }>) => {
    return features?.filter((f) => !f.is_deleted).length || 0;
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (userRole && userRole.trim().toLowerCase() !== "admin") {
      Swal.fire({
        icon: "warning",
        title: "Restricted Access",
        text: "Please enter passcode",
        input: "password",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value !== PASSCODE) window.location.href = "/";
      });
    }
  }, [userRole]);

  const columns: ColumnsType<Project> = useMemo(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        align: "center",
        width: 60,
        render: (_, __, idx) => (
          <span className=" font-medium">
            {(pagination.current - 1) * pagination.pageSize + idx + 1}
          </span>
        ),
      },
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        align: "center",
        width: 80,
        render: (id: number) => (
          <Typography.Text copyable={{ text: String(id) }} code>
            {String(id).padStart(4, "0")}
          </Typography.Text>
        ),
      },
      {
        title: "โครงการ",
        key: "project_name",
        width: 280,
        render: (_, record) => (
          <div className="flex items-start gap-3">
            {/* Project Icon */}
            <div className="min-w-[40px] h-[40px] rounded-lg flex items-center justify-center border border-blue-100">
              <ProjectOutlined className="text-blue-500 text-lg" />
            </div>

            {/* Project Names */}
            <div className="flex flex-col">
              <Typography.Text
                strong
                className=" text-[15px] leading-tight hover:text-blue-600 transition-colors cursor-pointer"
              >
                {record.name}
              </Typography.Text>
              {record.name_en ? (
                <Typography.Text type="secondary" className="text-xs mt-1">
                  {record.name_en}
                </Typography.Text>
              ) : (
                <Typography.Text
                  type="secondary"
                  className="text-xs mt-1 italic "
                >
                  - No English Name -
                </Typography.Text>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "ระยะเวลาดำเนินการ",
        key: "duration",
        width: 200,
        render: (_, record) => {
          if (!record.start_date || !record.end_date) {
            return <span className="">-</span>;
          }

          const isExpired = dayjs(record.end_date).isBefore(dayjs());
          const progress = calculateProjectProgress(
            record.start_date,
            record.end_date
          );

          return (
            <div className="flex flex-col gap-1">
              {/* Date Range */}
              <div className={`flex items-center text-xs`}>
                <CalendarOutlined className="mr-2 opacity-70" />
                <span>{convertToThaiDateDDMMYYY(record.start_date)}</span>
                <ArrowRightOutlined className="mx-2 text-[10px] opacity-50" />
                <span className={isExpired ? "line-through" : ""}>
                  {convertToThaiDateDDMMYYY(record.end_date)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${
                    isExpired ? "bg-gray-300" : "bg-blue-400"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        title: "ย่อย",
        key: "features",
        align: "center",
        width: 80,
        render: (_, record) => {
          const count = getSubProjectCount(record.features);
          return (
            <Tooltip title={`${count} โครงการย่อย`}>
              <div
                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  count > 0
                    ? "border border-indigo-100"
                    : " border border-gray-100"
                }`}
              >
                {count}
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: "สถานะ & ประเภท",
        key: "status_type",
        width: 160,
        render: (_, record) => {
          const categoryName = getCategoryName(record.categoryType);
          const isOpen = record.status === "open";

          return (
            <div className="flex flex-col gap-2 items-start">
              {/* Status Badge */}
              <Badge
                status={isOpen ? "processing" : "default"}
                text={
                  <span
                    className={
                      isOpen ? "text-green-600 font-medium" : "text-gray-400"
                    }
                  >
                    {isOpen ? "Active" : "Closed"}
                  </span>
                }
              />

              {/* Category Tag */}
              <Tag bordered={false} className="m-0 text-[10px] rounded-md px-2">
                {categoryName}
              </Tag>
            </div>
          );
        },
      },
      {
        title: "",
        key: "action",
        align: "center",
        width: 140,
        fixed: "right",
        render: (_, record) => {
          const menuItems: MenuProps["items"] = [
            {
              key: "detail",
              label: "ดูรายละเอียด",
              icon: <InfoCircleOutlined />,
              onClick: () => setModalState({ type: "detail", data: record }),
            },
            {
              type: "divider",
            },
            {
              key: "delete",
              label: "ลบโครงการ",
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => setModalState({ type: "delete", data: record }),
            },
          ];

          return (
            <div className="flex items-center justify-center gap-2">
              {/* Action Buttons Group */}
              <div className="flex gap-1 p-1 px-2 rounded-full border border-gray-200 shadow-sm">
                <Tooltip title="แก้ไข">
                  <Button
                    type="text"
                    size="small"
                    shape="circle"
                    className=" hover:text-orange-500"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(record)}
                  />
                </Tooltip>

                <Dropdown
                  menu={{ items: menuItems }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Tooltip title="เพิ่มเติม">
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      className=" hover:text-blue-500"
                      icon={<MoreOutlined />}
                    />
                  </Tooltip>
                </Dropdown>
              </div>

              {/* Primary Action */}
              <Tooltip title="เข้าสู่โครงการย่อย">
                <Link href={`/timesheet/project/sub-project/${record.id}`}>
                  <Button
                    type="primary"
                    size="small"
                    shape="circle"
                    icon={<ArrowRightOutlined />}
                    className="shadow-md hover:scale-105 transition-transform"
                  />
                </Link>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [pagination]
  );

  const handlePaginationChange = (page: number, size: number) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: size,
    });
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          title="Projects Management"
          subTitle="จัดการข้อมูลโครงการ"
          icon={<ProjectOutlined />}
        />

        <div className="flex flex-col gap-4 w-full">
          {/* Action Toolbar */}
          <div className="flex justify-end gap-3">
            <Button
              icon={<ArrowRightOutlined />}
              size="large"
              onClick={() => router.push("/timesheet/timeline")}
            >
              Timeline View
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={openCreateModal}
            >
              สร้างโครงการใหม่
            </Button>
          </div>

          {/* Projects Table */}
          <Card className="shadow-sm">
            <Table
              rowKey={(r) => r.id}
              columns={columns}
              dataSource={projects}
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onChange: handlePaginationChange,
              }}
            />
          </Card>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          open={modalState.type === "create" || modalState.type === "edit"}
          title={
            modalState.type === "edit" ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"
          }
          onCancel={closeModal}
          footer={null}
          destroyOnHidden
          width={800}
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="ชื่อโครงการ (TH)"
                  rules={[{ required: true, message: "กรุณากรอกชื่อโครงการ" }]}
                >
                  <Input
                    prefix={<InfoCircleOutlined />}
                    placeholder="ระบุชื่อโครงการ"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name_en"
                  label="ชื่อโครงการ (EN)"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อภาษาอังกฤษ" },
                  ]}
                >
                  <Input
                    prefix={<InfoCircleOutlined />}
                    placeholder="English Name"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="categoryType"
                  label="ประเภท"
                  rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
                >
                  <Select
                    placeholder="เลือกประเภท"
                    options={categoryType.map((c) => ({
                      label: c.name,
                      value: String(c.id),
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="สถานะ"
                  rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                >
                  <Select
                    options={[
                      { label: "เปิดโครงการ", value: "open" },
                      { label: "ปิดโครงการ", value: "close" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="start_date" label="วันเริ่มโครงการ">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="end_date" label="วันสิ้นสุดโครงการ">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="คำอธิบาย">
              <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={closeModal}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading}
                icon={<CheckCircleOutlined />}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="ยืนยันการลบโครงการ"
          open={modalState.type === "delete"}
          onCancel={closeModal}
          onOk={handleDelete}
          okButtonProps={{
            danger: true,
            disabled: confirmDeleteText !== "Delete",
          }}
          okText="ยืนยันลบ"
        >
          <div className="space-y-3">
            <Typography.Text type="danger">
              การกระทำนี้ไม่สามารถย้อนกลับได้ กรุณาพิมพ์ <b>Delete</b>{" "}
              เพื่อยืนยัน
            </Typography.Text>
            <Input
              placeholder="Type 'Delete' to confirm"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="รายละเอียดโครงการ"
          open={modalState.type === "detail"}
          onCancel={closeModal}
          footer={[
            <Button key="close" onClick={closeModal}>
              ปิด
            </Button>,
          ]}
        >
          {modalState.data && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ชื่อโครงการ">
                {modalState.data.name}
              </Descriptions.Item>
              <Descriptions.Item label="English Name">
                {modalState.data.name_en || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="รายละเอียด">
                {modalState.data.description || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="สร้างเมื่อ">
                {convertToThaiDateDDMMYYY(modalState.data.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="โดย">
                {getUserById(modalState.data.createdBy)?.firstname ?? "Unknown"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
