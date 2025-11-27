"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { toast } from "sonner";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Badge,
  Progress,
  Avatar,
  theme,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  PlusOutlined,
  ProjectOutlined,
  SyncOutlined,
  SearchOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";
import { Project, SubProject, SubProjectForm } from "@stores/type";

// * ----------------------------------------------------------------------
// * Constants & Helpers
// * ----------------------------------------------------------------------

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

const ASSET_OPTIONS = [
  { value: "CAPTUREABLE", label: "สามารถแคปทรัพย์สินได้", color: "cyan" },
  {
    value: "UN_CAPTUREABLE",
    label: "ไม่สามารถแคปทรัพย์สินได้",
    color: "orange",
  },
];

/**
 * * Helper: Compute estimated hours (Mon-Fri, 8 hours/day)
 */
const computeEstimateHours = (
  startDate: any,
  endDate: any
): { hours: number; text: string } => {
  if (!startDate || !endDate) {
    return { hours: 0, text: "ระบบคำนวณให้อัตโนมัติ" };
  }

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return { hours: 0, text: "0 ชั่วโมง" };
  }

  let current = start.clone();
  let workingDays = 0;
  while (current.isBefore(end) || current.isSame(end, "day")) {
    const day = current.day(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
    current = current.add(1, "day");
  }

  const hours = workingDays * 8;
  return { hours, text: `${hours} ชั่วโมง` };
};

/**
 * * Helper: Determine project status based on dates
 */
const getProjectStatus = (
  startDate: any,
  endDate: any
): {
  statusText: string;
  badgeStatus: "processing" | "default" | "success" | "error";
} => {
  const today = dayjs().startOf("day");
  const s = startDate ? dayjs(startDate).startOf("day") : null;
  const e = endDate ? dayjs(endDate).startOf("day") : null;

  if (s && e && s.isValid() && e.isValid()) {
    if (!s.isAfter(e) && !today.isBefore(s) && !today.isAfter(e)) {
      return { statusText: "กำลังดำเนินการ", badgeStatus: "processing" };
    } else if (today.isAfter(e)) {
      return { statusText: "สิ้นสุดแล้ว", badgeStatus: "success" }; // Changed to success for completed
    } else {
      return { statusText: "ยังไม่เริ่ม", badgeStatus: "default" };
    }
  }
  return { statusText: "ยังไม่ได้กำหนดวันที่", badgeStatus: "default" };
};

// * ----------------------------------------------------------------------
// * Sub-Components (Enterprise Level Extraction)
// * ----------------------------------------------------------------------

/**
 * * Component: StatCard
 * * Displays a single statistic with an icon and hover effect.
 */
const StatCard = ({
  title,
  value,
  icon,
  color,
  suffix,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
  loading?: boolean;
}) => {
  const { token } = useToken();
  return (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-all duration-300"
      style={{ borderRadius: token.borderRadiusLG, height: "100%" }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
        <Statistic
          title={<Text type="secondary">{title}</Text>}
          value={value}
          prefix={
            <span style={{ color, marginRight: 8, fontSize: 20 }}>{icon}</span>
          }
          suffix={
            suffix && (
              <span style={{ fontSize: 14, color: "#999" }}>{suffix}</span>
            )
          }
          valueStyle={{ fontWeight: 700, color: token.colorTextHeading }}
        />
      </Skeleton>
    </Card>
  );
};

// * ----------------------------------------------------------------------
// * Main Page Component
// * ----------------------------------------------------------------------

export default function SubProjectPage() {
  // * Hooks
  const { token } = useToken();
  const router = useRouter();
  const { project_id } = useParams() as { project_id: string };
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const [antdForm] = Form.useForm();
  const watchedDateRange = Form.useWatch("dateRange", antdForm);

  // * State
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // * Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;

  // * Modal State
  const [modalType, setModalType] = useState<
    "create" | "edit" | "delete" | "detail" | null
  >(null);
  const [selectedProject, setSelectedProject] = useState<SubProject | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // * Form State
  const [formData, setFormData] = useState<
    SubProjectForm & { backlogDescription?: any }
  >({
    name: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    project_id: Number(project_id),
    backlogDescription: null,
    dateRange: ["", ""],
  });

  // * ----------------------------------------------------------------------
  // * Data Fetching
  // * ----------------------------------------------------------------------

  const fetchSubProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/sub-project/read/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: pageSize,
          page: currentPage,
          project_id: Number(project_id),
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch sub-projects");
      const data = await res.json();
      setSubProjects(data?.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error(error);
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 1, page: 1, id: Number(project_id) }),
      });
      if (!res.ok) throw new Error("Failed to fetch project details");
      const data = await res.json();
      setProjects(data.data.items || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSubProjects();
  }, [currentPage]);

  useEffect(() => {
    fetchProjectDetails();
  }, []);

  // * ----------------------------------------------------------------------
  // * Computed Values (Statistics)
  // * ----------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = subProjects.length;
    const processing = subProjects.filter((p) => {
      const { badgeStatus } = getProjectStatus(p.startDate, p.endDate);
      return badgeStatus === "processing";
    }).length;
    const completed = subProjects.filter((p) => {
      const { statusText } = getProjectStatus(p.startDate, p.endDate);
      return statusText === "สิ้นสุดแล้ว";
    }).length;

    const totalHours = subProjects.reduce((acc, curr) => {
      const { hours } = computeEstimateHours(curr.startDate, curr.endDate);
      return acc + hours;
    }, 0);

    return { total, processing, completed, totalHours };
  }, [subProjects]);

  // * ----------------------------------------------------------------------
  // * Event Handlers
  // * ----------------------------------------------------------------------

  const handleCreateOrUpdate = async () => {
    try {
      await antdForm.validateFields();
      setActionLoading(true);

      // Prepare payload
      const formValues = antdForm.getFieldsValue();
      const payload = {
        ...formData,
        ...formValues,
        project_id: formData.project_id ?? Number(project_id),
      };

      const res = await fetch(`/api/v1/timesheet/project/sub-project/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      toast.success(formData.id ? "อัปเดตข้อมูลสำเร็จ" : "สร้างข้อมูลสำเร็จ");
      setModalType(null);
      antdForm.resetFields();
      fetchSubProjects();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาด โปรดลองอีกครั้ง");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/v1/timesheet/project/sub-project/delete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteId,
          by: AUTHENTICATION.response.data.user_data.admin_id,
        }),
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("ลบข้อมูลสำเร็จ");
      setModalType(null);
      setDeleteId(null);
      fetchSubProjects();
    } catch (error) {
      console.error(error);
      toast.error("ลบข้อมูลล้มเหลว");
    }
  };

  // * Watch Date Range for Estimate Calculation
  useEffect(() => {
    const start = watchedDateRange?.[0];
    const end = watchedDateRange?.[1];
    if (start && end) {
      const { text } = computeEstimateHours(start, end);
      antdForm.setFieldValue("estimate_time", text);
    }
  }, [watchedDateRange, antdForm]);

  // * ----------------------------------------------------------------------
  // * Table Configuration
  // * ----------------------------------------------------------------------

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, idx: number) => (
        <Text type="secondary">{(currentPage - 1) * pageSize + idx + 1}</Text>
      ),
    },
    {
      title: "ฟีเจอร์ / Feature",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: SubProject) => (
        <Space align="start">
          <Avatar
            shape="square"
            icon={<FileTextOutlined />}
            style={{
              backgroundColor: token.colorPrimaryBg,
              color: token.colorPrimary,
            }}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{text}</Text>
            {record.backlogDescription?.note && (
              <Text
                type="secondary"
                style={{ fontSize: 12 }}
                ellipsis={{ tooltip: true }}
              >
                {record.backlogDescription.note}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "ประเภท / Type",
      dataIndex: "assetCaptureType",
      key: "assetCaptureType",
      width: 180,
      align: "center" as const,
      render: (text: string) => {
        const option = ASSET_OPTIONS.find((o) => o.value === text);
        return (
          <Tag color={option?.color || "default"} style={{ borderRadius: 12 }}>
            {option?.label || text}
          </Tag>
        );
      },
    },
    {
      title: "สถานะ / Status",
      key: "status",
      width: 250,
      render: (_: any, record: SubProject) => {
        const { statusText, badgeStatus } = getProjectStatus(
          record.startDate,
          record.endDate
        );

        // Calculate Progress
        let percent = 0;
        if (record.startDate && record.endDate) {
          const total = dayjs(record.endDate).diff(
            dayjs(record.startDate),
            "day"
          );
          const elapsed = dayjs().diff(dayjs(record.startDate), "day");
          if (total > 0)
            percent = Math.max(
              0,
              Math.min(100, Math.round((elapsed / total) * 100))
            );
          else if (dayjs().isAfter(dayjs(record.endDate))) percent = 100;
        }

        return (
          <Space direction="vertical" size={2} style={{ width: "100%" }}>
            <div className="flex justify-between items-center">
              <Badge status={badgeStatus as any} text={statusText} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.startDate
                  ? dayjs(record.startDate).format("DD MMM")
                  : "-"}{" "}
                -{" "}
                {record.endDate ? dayjs(record.endDate).format("DD MMM") : "-"}
              </Text>
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={
                badgeStatus === "processing" ? token.colorPrimary : undefined
              }
            />
          </Space>
        );
      },
    },
    {
      title: "เวลา / Est.",
      key: "estimate",
      width: 120,
      align: "center" as const,
      render: (_: any, record: SubProject) => {
        const { text } = computeEstimateHours(record.startDate, record.endDate);
        return (
          <Tag icon={<ClockCircleOutlined />} bordered={false}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center" as const,
      render: (_: any, record: SubProject) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "ดูรายละเอียด",
                icon: <InfoCircleOutlined />,
                onClick: () => {
                  setSelectedProject(record);
                  setModalType("detail");
                },
              },
              {
                key: "edit",
                label: "แก้ไข",
                icon: <EditOutlined />,
                onClick: () => {
                  setFormData({
                    id: record.id,
                    name: record.name,
                    project_id: record.project_id ?? Number(project_id),
                    by: AUTHENTICATION.response.data.user_data.admin_id,
                    backlogDescription: record.backlogDescription,
                    dateRange:
                      record.startDate && record.endDate
                        ? [dayjs(record.startDate), dayjs(record.endDate)]
                        : [],
                  });
                  antdForm.setFieldsValue({
                    name: record.name,
                    asset_capture_type: (record as any).assetCaptureType,
                    dateRange:
                      record.startDate && record.endDate
                        ? [dayjs(record.startDate), dayjs(record.endDate)]
                        : [],
                    backlogDescription: record.backlogDescription,
                  });
                  setModalType("edit");
                },
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                label: "ลบข้อมูล",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                  setDeleteId(record.id);
                  setModalType("delete");
                },
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" shape="circle" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // * ----------------------------------------------------------------------
  // * Render
  // * ----------------------------------------------------------------------

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className="w-fit hover:bg-gray-100"
          >
            กลับไปหน้าโครงการ
          </Button>

          <HeaderBar
            title={projects[0]?.name || "Project Details"}
            subTitle="จัดการฟีเจอร์และติดตามสถานะโครงการย่อย"
            icon={<ProjectOutlined />}
            color="none"
          />
        </div>

        {/* Statistics Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ฟีเจอร์ทั้งหมด"
              value={stats.total}
              icon={<FileTextOutlined />}
              color={token.colorPrimary}
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="กำลังดำเนินการ"
              value={stats.processing}
              icon={<SyncOutlined spin />}
              color="#faad14"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="เสร็จสิ้น"
              value={stats.completed}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ชั่วโมงรวม (ประมาณการ)"
              value={stats.totalHours}
              icon={<ClockCircleOutlined />}
              color="#722ed1"
              suffix="ชม."
              loading={loading}
            />
          </Col>
        </Row>

        {/* Action Toolbar */}
        <div className="flex justify-between items-center p-4 rounded-lg shadow-sm ">
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              รายการฟีเจอร์ ({stats.total})
            </Text>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              setFormData({
                name: "",
                project_id: Number(project_id),
                by: AUTHENTICATION.response.data.user_data.admin_id,
                backlogDescription: null,
                dateRange: [],
              });
              antdForm.resetFields();
              antdForm.setFieldValue("asset_capture_type", "CAPTUREABLE");
              setModalType("create");
            }}
            className="shadow-md hover:shadow-lg transition-all"
          >
            เพิ่มฟีเจอร์ใหม่
          </Button>
        </div>

        {/* Data Table */}
        <Card
          bordered={false}
          className="shadow-sm overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={subProjects}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalPages * pageSize,
              onChange: setCurrentPage,
              showSizeChanger: false,
            }}
            locale={{ emptyText: <Empty description="ไม่พบข้อมูลฟีเจอร์" /> }}
          />
        </Card>

        {/* Modals */}
        <Modal
          open={modalType === "create" || modalType === "edit"}
          onCancel={() => setModalType(null)}
          title={
            <Space>
              {modalType === "create" ? <PlusOutlined /> : <EditOutlined />}
              <Text strong>
                {modalType === "create" ? "เพิ่มฟีเจอร์ใหม่" : "แก้ไขฟีเจอร์"}
              </Text>
            </Space>
          }
          width={720}
          footer={null}
          destroyOnHidden
          centered
        >
          <Form
            form={antdForm}
            layout="vertical"
            onFinish={handleCreateOrUpdate}
            initialValues={{ asset_capture_type: "CAPTUREABLE" }}
            className="pt-4"
          >
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label="ชื่อฟีเจอร์"
                  name="name"
                  rules={[{ required: true, message: "กรุณาระบุชื่อฟีเจอร์" }]}
                >
                  <Input
                    placeholder="ระบุชื่อฟีเจอร์"
                    size="large"
                    prefix={<FileTextOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="ประเภท Assets"
                  name="asset_capture_type"
                  rules={[{ required: true }]}
                >
                  <Select options={ASSET_OPTIONS} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ช่วงเวลาดำเนินงาน"
                  name="dateRange"
                  rules={[{ required: true, message: "กรุณาระบุช่วงเวลา" }]}
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    size="large"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="เวลาที่ใช้ (ประมาณการ)" name="estimate_time">
                  <Input
                    readOnly
                    prefix={<ClockCircleOutlined />}
                    size="large"
                    className="bg-gray-50"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">รายละเอียดเพิ่มเติม</Divider>

            <Form.Item
              label="หมายเหตุ / Note"
              name={["backlogDescription", "note"]}
            >
              <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
            </Form.Item>

            <Form.List name={["backlogDescription", "backlogs"]}>
              {(fields, { add, remove }) => (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between mb-2">
                    <Text strong>
                      <LinkOutlined /> เอกสารแนบ
                    </Text>
                    <Button
                      type="dashed"
                      size="small"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                    >
                      เพิ่มลิ้งค์
                    </Button>
                  </div>
                  {fields.map((field) => (
                    <Row key={field.key} gutter={8} className="mb-2">
                      <Col span={10}>
                        <Form.Item
                          {...field}
                          name={[field.name, "title"]}
                          rules={[{ required: true, message: "ระบุชื่อ" }]}
                          noStyle
                        >
                          <Input placeholder="ชื่อเอกสาร" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, "link"]}
                          rules={[{ required: true, message: "ระบุลิ้งค์" }]}
                          noStyle
                        >
                          <Input placeholder="URL" prefix={<LinkOutlined />} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center text-gray-400 py-2">
                      ไม่มีเอกสารแนบ
                    </div>
                  )}
                </div>
              )}
            </Form.List>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setModalType(null)}>ยกเลิก</Button>
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
          open={modalType === "delete"}
          onCancel={() => setModalType(null)}
          title={
            <Space>
              <DeleteOutlined className="text-red-500" /> ยืนยันการลบ
            </Space>
          }
          onOk={handleDelete}
          okText="ลบข้อมูล"
          okType="danger"
          cancelText="ยกเลิก"
          centered
        >
          <div className="text-center py-4">
            <Title level={5}>คุณแน่ใจหรือไม่ที่จะลบฟีเจอร์นี้?</Title>
            <Text type="secondary">
              การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบ
            </Text>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          open={modalType === "detail" && !!selectedProject}
          onCancel={() => setModalType(null)}
          title={
            <Space>
              <InfoCircleOutlined className="text-blue-500" /> รายละเอียดฟีเจอร์
            </Space>
          }
          footer={<Button onClick={() => setModalType(null)}>ปิด</Button>}
          width={600}
          centered
        >
          {selectedProject && (
            <div className="space-y-6 pt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-start">
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedProject.name}
                  </Title>
                  <Text type="secondary">ID: {selectedProject.id}</Text>
                </div>
                <Tag
                  color={
                    ASSET_OPTIONS.find(
                      (o) =>
                        o.value === (selectedProject as any).assetCaptureType
                    )?.color
                  }
                >
                  {
                    ASSET_OPTIONS.find(
                      (o) =>
                        o.value === (selectedProject as any).assetCaptureType
                    )?.label
                  }
                </Tag>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" bordered={false} className="bg-blue-50">
                    <Text type="secondary">วันเริ่มต้น</Text>
                    <div className="font-semibold text-blue-600 flex items-center gap-2">
                      <CalendarOutlined />
                      {selectedProject.startDate
                        ? dayjs(selectedProject.startDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" bordered={false} className="bg-red-50">
                    <Text type="secondary">วันสิ้นสุด</Text>
                    <div className="font-semibold text-red-600 flex items-center gap-2">
                      <CalendarOutlined />
                      {selectedProject.endDate
                        ? dayjs(selectedProject.endDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </Card>
                </Col>
              </Row>

              <div>
                <Text strong>หมายเหตุ</Text>
                <div className="bg-white border border-gray-200 p-3 rounded mt-1 min-h-[60px]">
                  {selectedProject.backlogDescription?.note || (
                    <Text type="secondary">-</Text>
                  )}
                </div>
              </div>

              <div>
                <Text strong>เอกสารแนบ</Text>
                <div className="mt-2 space-y-2">
                  {selectedProject.backlogDescription?.backlogs?.length ? (
                    selectedProject.backlogDescription.backlogs.map(
                      (item: any, idx: number) => (
                        <a
                          key={idx}
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded transition-all group no-underline"
                        >
                          <LinkOutlined className="mr-3 text-gray-400 group-hover:text-blue-500" />
                          <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                            {item.title}
                          </span>
                        </a>
                      )
                    )
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded text-gray-400">
                      ไม่มีเอกสารแนบ
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
