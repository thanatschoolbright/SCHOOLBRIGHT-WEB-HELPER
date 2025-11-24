"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Typography,
  Badge,
  Breadcrumb,
  Statistic,
  Progress,
  Tag,
  Tooltip,
  Avatar,
  Divider,
} from "antd";
import {
  HomeOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { useParams, useRouter } from "next/navigation";
import { Project, SubProject, SubProjectForm } from "@stores/type";
import { HeaderBar } from "@/components/typhography/header-bar-component";

const assetOption = [
  { value: "CAPTUREABLE", label: "สามารถแคปทรัพย์สินได้" },
  {
    value: "UN_CAPTUREABLE",
    label: "ไม่สามารถแคปทรัพย์สินได้",
  },
];

// Compute estimated hours between two dates (inclusive), counting only weekdays (Mon-Fri).
// Each working day counts as 8 hours.
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
  const result = { hours, text: `${hours} ชั่วโมง` };
  return result;
};

// Determine project status (badge text and badge type) based on start/end vs today
const getProjectStatus = (
  startDate: any,
  endDate: any
): { statusText: string; badgeStatus: "processing" | "default" } => {
  const today = dayjs().startOf("day");
  const s = startDate ? dayjs(startDate).startOf("day") : null;
  const e = endDate ? dayjs(endDate).startOf("day") : null;

  let statusText = "ยังไม่ได้กำหนดวันที่";
  let badgeStatus: "processing" | "default" = "default";

  if (s && e && s.isValid() && e.isValid()) {
    if (!s.isAfter(e) && !today.isBefore(s) && !today.isAfter(e)) {
      statusText = "กำลังดำเนินการ";
      badgeStatus = "processing";
    } else if (today.isAfter(e)) {
      statusText = "สิ้นสุดแล้ว";
      badgeStatus = "default";
    } else {
      statusText = "ยังไม่เริ่ม";
      badgeStatus = "default";
    }
  }

  return { statusText, badgeStatus };
};

export default function Page() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  const { project_id } = useParams() as { project_id: string };

  const router = useRouter();
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<
    SubProjectForm & { confirmText?: string; backlogDescription?: any }
  >({
    name: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
    project_id: Number(project_id),
    backlogDescription: null,
    dateRange: ["", ""],
  });
  const [antdForm] = Form.useForm();
  const watchedDateRange = Form.useWatch("dateRange", antdForm);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>(""); // replaced modalOpen and deleteModalOpen
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<SubProject | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total_pages, settotal_pages] = useState<number>(1);
  const limit = 10;

  // Calculate Statistics
  const stats = React.useMemo(() => {
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

  const fetchSubProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/sub-project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          page: currentPage,
          project_id: Number(project_id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      console.log("Fetched projects:", data);
      setSubProjects(data?.data?.items || []);
      settotal_pages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setSubProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsById = async (project_id: string | number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 10,
          page: 1,
          id: Number(project_id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data.items || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateProject = async (project: SubProjectForm) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/timesheet/project/sub-project/insert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        throw new Error("Failed to create or update project");
      }
      toast.success("สร้าง/อัปเดตฟีเจอร์สำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error creating or updating project:", error);
      toast.error("สร้าง/อัปเดตโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/sub-project/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          by: AUTHENTICATION.response.data.user_data.admin_id,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete project");
      }
      toast.success("ลบข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("ลบข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  useEffect(() => {
    fetchSubProjects();
  }, [currentPage]);

  useEffect(() => {
    fetchProjectsById(project_id);
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    await createOrUpdateProject(form);
    setForm({
      name: "",
      project_id: Number(project_id),
      by: AUTHENTICATION.response.data.user_data.admin_id,
      backlogDescription: null,
      dateRange: [],
      asset_capture_type: "CAPTUREABLE",
    });
    setModal("");
    setCurrentPage(1);
    await fetchSubProjects();
  };

  // Handler for RangePicker change to help debug and keep local state in sync
  const handleRangeChange = (dates: any, dateStrings: [string, string]) => {
    console.log("RangePicker onChange", { dates, dateStrings });
    try {
      antdForm.setFieldsValue({ dateRange: dates });
    } catch (e) {
      // ignore
    }
    setForm((prev) => ({ ...prev, dateRange: dates }));
  };

  // Log watchedDateRange changes for debugging
  useEffect(() => {
    console.log("watchedDateRange changed", watchedDateRange);
  }, [watchedDateRange]);

  // When the watched date range changes, compute estimate and set it into the Antd form
  useEffect(() => {
    try {
      const start = watchedDateRange?.[0] ?? form.dateRange?.[0];
      const end = watchedDateRange?.[1] ?? form.dateRange?.[1];
      const computed = computeEstimateHours(start, end);
      antdForm.setFieldsValue({ estimate_time: computed.text });
    } catch (e) {
      // ignore errors from form when not mounted
    }
  }, [watchedDateRange, form.dateRange, antdForm]);

  const openCreateModal = () => {
    setForm({
      name: "",
      project_id: Number(project_id),
      by: AUTHENTICATION.response.data.user_data.admin_id,
      backlogDescription: null,
      dateRange: [],
    });
    // populate the Antd Form so Form.useWatch sees the values immediately
    antdForm.setFieldsValue({
      name: "",
      backlogDescription: null,
      dateRange: [],
      asset_capture_type: "CAPTUREABLE",
      project_id: Number(project_id),
    });
    setModal("create");
  };

  const openEditModal = (project: SubProject) => {
    setForm({
      id: project.id,
      name: project.name,
      project_id: project.project_id,
      by: AUTHENTICATION.response.data.user_data.admin_id,
      backlogDescription: project.backlogDescription ?? null,
      dateRange:
        project.startDate && project.endDate
          ? [dayjs(project.startDate), dayjs(project.endDate)] // ✅ ใช้ dayjs ตรง ๆ
          : [],
    });
    // set Antd Form fields so the RangePicker and watch hook update immediately
    antdForm.setFieldsValue({
      name: project.name,
      backlogDescription: project.backlogDescription ?? null,
      dateRange:
        project.startDate && project.endDate
          ? [dayjs(project.startDate), dayjs(project.endDate)]
          : [],
      asset_capture_type: (project as any).asset_capture_type ?? "CAPTUREABLE",
      project_id: project.project_id,
    });
    setModal("edit");
  };

  // When modal closes, reset Antd form fields to keep state in sync
  useEffect(() => {
    if (modal === "") {
      try {
        antdForm.resetFields();
      } catch (e) {
        // ignore
      }
    }
  }, [modal, antdForm]);

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setModal("delete");
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    await deleteProject(deleteId);
    setModal("");
    setDeleteId(null);
    setCurrentPage(1);
    await fetchSubProjects();
  };

  const columns = React.useMemo(
    () => [
      {
        title: "ลำดับ",
        dataIndex: "index",
        key: "index",
        align: "center" as const,
        width: 80,
        render: (_: any, __: any, idx: number) => (
          <span style={{ fontWeight: 600, color: "#8c8c8c" }}>
            {idx + 1 + (currentPage - 1) * limit}
          </span>
        ),
      },
      {
        title: "ชื่อฟีเจอร์",
        dataIndex: "name",
        key: "name",
        align: "left" as const,
        sorter: (a: SubProject, b: SubProject) =>
          (a.name || "").toString().localeCompare((b.name || "").toString()),
        render: (text: string, record: SubProject) => (
          <Space align="start">
            <Avatar
              shape="square"
              size="small"
              icon={<FileTextOutlined />}
              style={{ backgroundColor: "#e6f7ff", color: "#1890ff" }}
            />
            <Space direction="vertical" size={0}>
              <Typography.Text strong style={{ fontSize: 15 }}>
                {text}
              </Typography.Text>
              {record.backlogDescription?.note && (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12 }}
                  ellipsis={{ tooltip: true }}
                >
                  {record.backlogDescription.note}
                </Typography.Text>
              )}
            </Space>
          </Space>
        ),
      },
      {
        title: "ประเภท Assets",
        dataIndex: "assetCaptureType",
        key: "assetCaptureType",
        align: "center" as const,
        width: 180,
        sorter: (a: SubProject, b: SubProject) => {
          const av =
            (a as any).asset_capture_type || (a as any).assetCaptureType || "";
          const bv =
            (b as any).asset_capture_type || (b as any).assetCaptureType || "";
          return av.toString().localeCompare(bv.toString());
        },
        render: (text: string) => {
          const isCaptureable = text === "CAPTUREABLE";
          return (
            <Tag
              color={isCaptureable ? "cyan" : "orange"}
              style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 500 }}
            >
              {assetOption.find((item) => item.value === text)?.label || text}
            </Tag>
          );
        },
      },
      {
        title: "สถานะ & ระยะเวลา",
        dataIndex: "status",
        key: "status",
        align: "left" as const,
        width: 280,
        render: (_: any, record: SubProject) => {
          const start = record.startDate;
          const end = record.endDate;
          const { statusText, badgeStatus } = getProjectStatus(start, end);

          // Calculate progress percentage based on today's date vs start/end
          let percent = 0;
          if (start && end) {
            const totalDuration = dayjs(end).diff(dayjs(start), "day");
            const elapsed = dayjs().diff(dayjs(start), "day");
            if (totalDuration > 0) {
              percent = Math.max(
                0,
                Math.min(100, Math.round((elapsed / totalDuration) * 100))
              );
            } else if (dayjs().isAfter(dayjs(end))) {
              percent = 100;
            }
          }

          return (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Badge
                  status={badgeStatus}
                  text={<span style={{ fontWeight: 500 }}>{statusText}</span>}
                />
                {start && end && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(start).format("DD MMM")} -{" "}
                    {dayjs(end).format("DD MMM")}
                  </Typography.Text>
                )}
              </div>
              <Progress
                percent={percent}
                size="small"
                showInfo={false}
                strokeColor={
                  badgeStatus === "processing" ? "#1890ff" : "#d9d9d9"
                }
              />
            </Space>
          );
        },
      },
      {
        title: "เวลาที่ใช้",
        dataIndex: "estimateTime",
        key: "estimateTime",
        align: "center" as const,
        width: 150,
        sorter: (a: SubProject, b: SubProject) => {
          const ca = computeEstimateHours(a.startDate, a.endDate).hours;
          const cb = computeEstimateHours(b.startDate, b.endDate).hours;
          return ca - cb;
        },
        render: (_: any, record: SubProject) => {
          const computed = computeEstimateHours(
            record.startDate,
            record.endDate
          );
          return (
            <Tag
              icon={<ClockCircleOutlined />}
              color="default"
              style={{ fontSize: 13, padding: "4px 8px" }}
            >
              {computed.text}
            </Tag>
          );
        },
      },
      {
        title: "จัดการ",
        key: "action",
        align: "center" as const,
        width: 150,
        render: (_: any, record: SubProject) => (
          <Space size="small">
            <Tooltip title="ดูรายละเอียด">
              <Button
                type="text"
                shape="circle"
                icon={<InfoCircleOutlined style={{ color: "#1890ff" }} />}
                onClick={() => {
                  setDetailProject(record);
                  setModal("detail");
                }}
              />
            </Tooltip>
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                shape="circle"
                icon={<EditOutlined style={{ color: "#faad14" }} />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
            <Tooltip title="ลบ">
              <Button
                type="text"
                shape="circle"
                danger
                icon={<DeleteOutlined />}
                onClick={() => openDeleteModal(record.id)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [currentPage, limit, assetOption]
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* Back Navigation */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          กลับไปหน้าโครงการ
        </Button>
        {/* Header & Stats */}
        <div className="flex flex-col gap-4">
          <HeaderBar
            title={projects[0]?.name || "Project Details"}
            subTitle="จัดการฟีเจอร์และติดตามสถานะโครงการย่อย"
            icon={<ProjectOutlined />}
            color="none"
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card
                bordered={false}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Statistic
                  title="ฟีเจอร์ทั้งหมด"
                  value={stats.total}
                  prefix={<FileTextOutlined style={{ color: "#1890ff" }} />}
                  valueStyle={{ color: "#1890ff", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                bordered={false}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Statistic
                  title="กำลังดำเนินการ"
                  value={stats.processing}
                  prefix={<SyncOutlined spin style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                bordered={false}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Statistic
                  title="เสร็จสิ้น"
                  value={stats.completed}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                bordered={false}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Statistic
                  title="ชั่วโมงรวม (ประมาณการ)"
                  value={stats.totalHours}
                  prefix={<ClockCircleOutlined style={{ color: "#722ed1" }} />}
                  suffix="ชม."
                  valueStyle={{ color: "#722ed1", fontWeight: 600 }}
                />
              </Card>
            </Col>
          </Row>
        </div>
        {/* Toolbar */}
        <div className="w-full flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreateModal}
            style={{ minWidth: 160, borderRadius: 8 }}
          >
            เพิ่มฟีเจอร์ใหม่
          </Button>
        </div>
        {/* Main Table Card */}
        <Card
          bordered={false}
          className="shadow-sm"
          bodyStyle={{ padding: "0" }}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 5 }} />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={subProjects}
              rowKey="id"
              pagination={{
                current: currentPage,
                total: total_pages * limit,
                pageSize: limit,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false,
              }}
              className="ant-table-striped"
            />
          )}
        </Card>
        {/* Create/Edit Modal */}
        <Modal
          open={modal === "create" || modal === "edit"}
          onCancel={() => setModal("")}
          title={
            <Space>
              {modal === "create" ? <PlusOutlined /> : <EditOutlined />}
              <span>{form.id ? "แก้ไขฟีเจอร์" : "เพิ่มฟีเจอร์ใหม่"}</span>
            </Space>
          }
          footer={null}
          destroyOnHidden
          width={700}
        >
          <Form
            form={antdForm}
            layout="vertical"
            initialValues={{
              name: form.name,
              backlogDescription: form.backlogDescription,
              dateRange: form.dateRange,
            }}
            onValuesChange={(_, allValues) =>
              setForm({ ...form, ...allValues })
            }
            onFinish={async () => {
              await handleSubmit();
              antdForm.resetFields();
            }}
          >
            <Form.Item
              name="project_id"
              initialValue={Number(project_id)}
              hidden
            >
              <Input type="hidden" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ชื่อฟีเจอร์"
                  name="name"
                  rules={[{ required: true, message: "กรุณากรอกชื่อฟีเจอร์" }]}
                >
                  <Input
                    placeholder="ระบุชื่อฟีเจอร์"
                    prefix={<FileTextOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ประเภทของ Assets"
                  name="asset_capture_type"
                  initialValue={form.asset_capture_type}
                  rules={[
                    { required: true, message: "กรุณาเลือกประเภทของ Assets" },
                  ]}
                >
                  <Select
                    onChange={(value) =>
                      setForm({
                        ...form,
                        asset_capture_type: value,
                      })
                    }
                    options={assetOption}
                    placeholder="เลือกประเภท"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Start Date & End Date */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ช่วงเวลาดำเนินงาน"
                  name="dateRange"
                  rules={[{ required: true, message: "กรุณาเลือกช่วงวันที่" }]}
                >
                  <DatePicker.RangePicker
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    placeholder={["เริ่มต้น", "สิ้นสุด"]}
                    onChange={handleRangeChange}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="เวลาที่ประมาณการ (ชั่วโมง)"
                  name="estimate_time"
                >
                  <Input
                    placeholder="คำนวณอัตโนมัติ"
                    disabled
                    prefix={<ClockCircleOutlined />}
                    style={{ backgroundColor: "#f5f5f5", color: "#595959" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" plain>
              รายละเอียดเพิ่มเติม
            </Divider>

            {/* Backlog Description: note and backlogs */}
            <Form.Item
              label="หมายเหตุ / Note"
              name={["backlogDescription", "note"]}
            >
              <Input.TextArea
                rows={3}
                placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับฟีเจอร์นี้"
              />
            </Form.Item>

            <Form.List name={["backlogDescription", "backlogs"]}>
              {(fields, { add, remove }) => (
                <div
                  style={{
                    backgroundColor: "#fafafa",
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <Typography.Text strong>
                      <LinkOutlined /> เอกสารแนบ / Links
                    </Typography.Text>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      size="small"
                    >
                      เพิ่มรายการ
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "16px 0",
                        color: "#999",
                      }}
                    >
                      ไม่มีเอกสารแนบ
                    </div>
                  )}

                  {fields.map((field, idx) => (
                    <Row key={field.key} gutter={8} style={{ marginBottom: 8 }}>
                      <Col span={10}>
                        <Form.Item
                          name={[field.name, "title"]}
                          rules={[{ required: true, message: "ระบุชื่อ" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="ชื่อเอกสาร" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, "link"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder="URL ลิงก์"
                            prefix={<LinkOutlined />}
                          />
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
                </div>
              )}
            </Form.List>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setModal("")}>ยกเลิก</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CheckCircleOutlined />}
                  loading={actionLoading}
                >
                  บันทึกข้อมูล
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
        {/* Delete Modal */}
        <Modal
          open={modal === "delete"}
          onCancel={() => setModal("")}
          title={
            <Space>
              <DeleteOutlined style={{ color: "red" }} />
              <span>ยืนยันการลบ</span>
            </Space>
          }
          onOk={confirmDelete}
          okText="ลบข้อมูล"
          okType="danger"
          cancelText="ยกเลิก"
          okButtonProps={{
            icon: <DeleteOutlined />,
          }}
          destroyOnHidden
        >
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <Typography.Title level={5}>
              คุณแน่ใจหรือไม่ที่จะลบฟีเจอร์นี้?
            </Typography.Title>
            <Typography.Text type="secondary">
              การกระทำนี้ไม่สามารถย้อนกลับได้
              ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบถาวร
            </Typography.Text>
          </div>
        </Modal>
        {/* Detail Modal */}
        <Modal
          open={modal === "detail" && !!detailProject}
          onCancel={() => {
            setModal("");
            setDetailProject(null);
          }}
          title={
            <Space>
              <InfoCircleOutlined style={{ color: "#1890ff" }} />
              <span>รายละเอียดฟีเจอร์</span>
            </Space>
          }
          footer={[
            <Button
              key="close"
              onClick={() => {
                setModal("");
                setDetailProject(null);
              }}
            >
              ปิด
            </Button>,
          ]}
          destroyOnHidden
          width={600}
        >
          {detailProject && (
            <div className="space-y-4 pt-2">
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <Typography.Title
                      level={5}
                      style={{ margin: 0, color: "#262626" }}
                    >
                      {detailProject.name}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      ID: {detailProject.id}
                    </Typography.Text>
                  </div>
                  <Tag color="cyan">
                    {assetOption.find(
                      (item) =>
                        item.value === (detailProject as any).asset_capture_type
                    )?.label || (detailProject as any).asset_capture_type}
                  </Tag>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="p-3 bg-white border border-gray-100 rounded-lg">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      วันที่เริ่มต้น
                    </Typography.Text>
                    <div style={{ fontWeight: 500 }}>
                      <CalendarOutlined
                        style={{ marginRight: 6, color: "#1890ff" }}
                      />
                      {detailProject.startDate
                        ? dayjs(detailProject.startDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-3 bg-white border border-gray-100 rounded-lg">
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      วันที่สิ้นสุด
                    </Typography.Text>
                    <div style={{ fontWeight: 500 }}>
                      <CalendarOutlined
                        style={{ marginRight: 6, color: "#ff4d4f" }}
                      />
                      {detailProject.endDate
                        ? dayjs(detailProject.endDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: "12px 0" }} />

              <div>
                <Typography.Text strong style={{ fontSize: 14 }}>
                  หมายเหตุ / Note
                </Typography.Text>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    backgroundColor: "#fff",
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                    minHeight: 60,
                  }}
                >
                  <Typography.Text type="secondary">
                    {detailProject.backlogDescription?.note || "-"}
                  </Typography.Text>
                </div>
              </div>

              <div>
                <Typography.Text strong style={{ fontSize: 14 }}>
                  เอกสารแนบ / Attachments
                </Typography.Text>
                <div style={{ marginTop: 8 }}>
                  {detailProject.backlogDescription?.backlogs &&
                  detailProject.backlogDescription.backlogs.length > 0 ? (
                    <div className="grid gap-2">
                      {detailProject.backlogDescription.backlogs.map(
                        (item: any, idx: number) => (
                          <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors text-blue-600"
                            style={{ textDecoration: "none" }}
                          >
                            <LinkOutlined
                              style={{ marginRight: 8, fontSize: 16 }}
                            />
                            <span style={{ fontWeight: 500 }}>
                              {item.title}
                            </span>
                          </a>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 12,
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        borderRadius: 6,
                        color: "#999",
                      }}
                    >
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
