"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
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
  Typography,
  Badge,
  Progress,
  Avatar,
  theme,
  Empty,
  Popconfirm,
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
  MoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useAppSelector } from "@stores/store";
import { Project, SubProject } from "@stores/type";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { useToken } = theme;

const ASSET_OPTIONS = [
  { value: "CAPTUREABLE", label: "สามารถแคปทรัพย์สินได้", color: "cyan" },
  {
    value: "UN_CAPTUREABLE",
    label: "ไม่สามารถแคปทรัพย์สินได้",
    color: "orange",
  },
];

const calculateWorkingHours = (
  startDate?: string | Date,
  endDate?: string | Date
) => {
  if (!startDate || !endDate)
    return { hours: 0, text: "ระบบคำนวณให้อัตโนมัติ" };

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return { hours: 0, text: "0 ชั่วโมง" };
  }

  let current = start.clone();
  let workingDays = 0;

  while (current.isBefore(end) || current.isSame(end, "day")) {
    const day = current.day();
    if (day !== 0 && day !== 6) workingDays += 1;
    current = current.add(1, "day");
  }

  const hours = workingDays * 8;
  return { hours, text: `${hours} ชั่วโมง` };
};

const determineProjectStatus = (
  startDate?: string | Date,
  endDate?: string | Date
) => {
  const today = dayjs().startOf("day");
  const s = startDate ? dayjs(startDate).startOf("day") : null;
  const e = endDate ? dayjs(endDate).startOf("day") : null;

  if (s && e && s.isValid() && e.isValid()) {
    if (today.isAfter(e))
      return { label: "สิ้นสุดแล้ว", status: "success", color: "green" };
    if (!s.isAfter(e) && !today.isBefore(s))
      return { label: "กำลังดำเนินการ", status: "processing", color: "blue" };
    return { label: "ยังไม่เริ่ม", status: "default", color: "default" };
  }
  return { label: "ยังไม่ระบุ", status: "default", color: "default" };
};

const calculateProgress = (
  startDate?: string | Date,
  endDate?: string | Date
) => {
  if (!startDate || !endDate) return 0;

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const today = dayjs();

  if (today.isAfter(end)) return 100;
  if (today.isBefore(start)) return 0;

  const totalDuration = end.diff(start, "day");
  const elapsed = today.diff(start, "day");

  return totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0;
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  suffix,
  loading,
}) => {
  const { token } = theme.useToken();
  return (
    <Card
      className="shadow-sm hover:shadow-md transition-all duration-300 h-full"
      style={{ borderRadius: token.borderRadiusLG }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
        <Statistic
          title={<Text type="secondary">{title}</Text>}
          value={value}
          prefix={
            <span style={{ color, marginRight: 8, fontSize: 20 }}>{icon}</span>
          }
          suffix={
            suffix && <span className="text-sm text-gray-400">{suffix}</span>
          }
          valueStyle={{ fontWeight: 700, color: token.colorTextHeading }}
        />
      </Skeleton>
    </Card>
  );
};

export default function SubProjectPage() {
  const { token } = useToken();
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params?.project_id);

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id;

  const [form] = Form.useForm();
  const watchedDateRange = Form.useWatch("dateRange", form);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalState, setModalState] = useState<{
    type: "create" | "edit" | "detail" | null;
    data: SubProject | null;
  }>({ type: null, data: null });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectRes, subProjectRes] = await Promise.all([
        fetch("/api/v1/timesheet/project/read/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 1, page: 1, id: projectId }),
        }),
        fetch("/api/v1/timesheet/project/sub-project/read/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            limit: pagination.pageSize,
            page: pagination.current,
            project_id: projectId,
          }),
        }),
      ]);

      const projectJson = await projectRes.json();
      const subProjectJson = await subProjectRes.json();

      if (projectJson?.data?.items?.length)
        setProjectData(projectJson.data.items[0]);

      setSubProjects(subProjectJson?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: (subProjectJson.pagination?.total_pages || 1) * prev.pageSize,
      }));
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (watchedDateRange) {
      const { text } = calculateWorkingHours(
        watchedDateRange[0],
        watchedDateRange[1]
      );
      form.setFieldValue("estimate_time", text);
    }
  }, [watchedDateRange, form]);

  const stats = useMemo(() => {
    return subProjects.reduce(
      (acc, curr) => {
        const { status } = determineProjectStatus(
          curr.startDate || "",
          curr.endDate || ""
        );
        const { hours } = calculateWorkingHours(
          curr.startDate || "",
          curr.endDate || ""
        );

        acc.total++;
        acc.totalHours += hours;
        if (status === "processing") acc.processing++;
        if (status === "success") acc.completed++;

        return acc;
      },
      { total: 0, processing: 0, completed: 0, totalHours: 0 }
    );
  }, [subProjects]);

  const handleSubmit = async (values: any) => {
    setIsActionLoading(true);
    try {
      const payload = {
        ...values,
        id: modalState.data?.id,
        project_id: projectId,
        by: adminId,
      };

      const res = await fetch("/api/v1/timesheet/project/sub-project/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      toast.success(
        modalState.data ? "อัปเดตข้อมูลสำเร็จ" : "สร้างข้อมูลสำเร็จ"
      );
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch("/api/v1/timesheet/project/sub-project/delete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, by: adminId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("ลบข้อมูลสำเร็จ");
      fetchData();
    } catch (error) {
      toast.error("ลบข้อมูลล้มเหลว");
    }
  };

  const handleOpenCreate = () => {
    form.resetFields();
    form.setFieldsValue({ asset_capture_type: "CAPTUREABLE" });
    setModalState({ type: "create", data: null });
  };

  const handleOpenEdit = (record: SubProject) => {
    const range =
      record.startDate && record.endDate
        ? [dayjs(record.startDate), dayjs(record.endDate)]
        : [];

    form.setFieldsValue({
      ...record,
      dateRange: range,
      estimate_time: calculateWorkingHours(
        record.startDate || "",
        record.endDate || ""
      ).text,
    });
    setModalState({ type: "edit", data: record });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, data: null });
    form.resetFields();
  };

  const columns: ColumnsType<SubProject> = useMemo(
    () => [
      {
        title: "#",
        key: "index",
        width: 60,
        align: "center",
        render: (_, __, idx) =>
          (pagination.current - 1) * pagination.pageSize + idx + 1,
      },
      {
        title: "ฟีเจอร์",
        dataIndex: "name",
        key: "name",
        width: 300,
        render: (name, record) => (
          <Space align="start">
            <Avatar
              shape="square"
              icon={<FileTextOutlined />}
              className="bg-blue-50 text-blue-500"
            />
            <div className="flex flex-col">
              <Text strong>{name}</Text>
              {record.name_en && (
                <Text type="secondary" className="text-xs">
                  {record.name_en}
                </Text>
              )}
              {record.backlogDescription?.note && (
                <Text
                  type="secondary"
                  className="text-xs italic truncate max-w-[200px]"
                >
                  {record.backlogDescription.note}
                </Text>
              )}
            </div>
          </Space>
        ),
      },
      {
        title: "ประเภท",
        dataIndex: "assetCaptureType",
        key: "type",
        width: 150,
        align: "center",
        render: (type) => {
          const option = ASSET_OPTIONS.find((o) => o.value === type);
          return <Tag color={option?.color}>{option?.label || type}</Tag>;
        },
      },
      {
        title: "สถานะ",
        key: "status",
        width: 200,
        render: (_, record) => {
          const { label, status } = determineProjectStatus(
            record.startDate || "",
            record.endDate || ""
          );
          const percent = calculateProgress(
            record.startDate || "",
            record.endDate || ""
          );

          return (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <Badge status={status as any} text={label} />
                <Text type="secondary" className="text-xs">
                  {record.endDate
                    ? dayjs(record.endDate).format("DD MMM")
                    : "-"}
                </Text>
              </div>
              <Progress
                percent={percent}
                size="small"
                showInfo={false}
                strokeColor={
                  status === "processing" ? token.colorPrimary : undefined
                }
              />
            </div>
          );
        },
      },
      {
        title: "เวลา (Est.)",
        key: "estimate",
        width: 120,
        align: "center",
        render: (_, record) => (
          <Tag icon={<ClockCircleOutlined />}>
            {
              calculateWorkingHours(
                record.startDate || "",
                record.endDate || ""
              ).text
            }
          </Tag>
        ),
      },
      {
        title: "จัดการ",
        key: "action",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: "ดูรายละเอียด",
                  icon: <InfoCircleOutlined />,
                  onClick: () =>
                    setModalState({ type: "detail", data: record }),
                },
                {
                  key: "edit",
                  label: "แก้ไข",
                  icon: <EditOutlined />,
                  onClick: () => handleOpenEdit(record),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: (
                    <Popconfirm
                      title="ลบข้อมูล"
                      description="ยืนยันการลบฟีเจอร์นี้หรือไม่?"
                      onConfirm={() => handleDelete(record.id)}
                      okText="ลบ"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true }}
                    >
                      <span className="w-full inline-block">ลบข้อมูล</span>
                    </Popconfirm>
                  ),
                  icon: <DeleteOutlined className="text-red-500" />,
                  danger: true,
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [pagination.current, pagination.pageSize, token.colorPrimary]
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 animate-fade-in">
        {/* Header & Navigation */}
        <div className="flex flex-col gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className="w-fit"
          >
            กลับไปหน้าโครงการ
          </Button>
          <HeaderBar
            title={projectData?.name || "Project Details"}
            subTitle="จัดการฟีเจอร์และติดตามสถานะโครงการย่อย"
            icon={<ProjectOutlined />}
            color="none"
          />
        </div>

        {/* Statistics Dashboard */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ฟีเจอร์ทั้งหมด"
              value={stats.total}
              icon={<FileTextOutlined />}
              color={token.colorPrimary}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="กำลังดำเนินการ"
              value={stats.processing}
              icon={<SyncOutlined spin />}
              color="#faad14"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="เสร็จสิ้น"
              value={stats.completed}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="ชั่วโมงรวม (Est.)"
              value={stats.totalHours}
              icon={<ClockCircleOutlined />}
              color="#722ed1"
              suffix="ชม."
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Data Table Section */}
        <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <Text strong className="text-lg">
            รายการฟีเจอร์ ({stats.total})
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleOpenCreate}
          >
            เพิ่มฟีเจอร์ใหม่
          </Button>
        </div>

        <Card className="shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={subProjects}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) =>
                setPagination((prev) => ({ ...prev, current: page })),
              showSizeChanger: false,
            }}
            locale={{ emptyText: <Empty description="ไม่พบข้อมูลฟีเจอร์" /> }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={modalState.type === "create" || modalState.type === "edit"}
          onCancel={handleCloseModal}
          title={
            <Space>
              {modalState.type === "create" ? (
                <PlusOutlined />
              ) : (
                <EditOutlined />
              )}
              <Text strong>
                {modalState.type === "create"
                  ? "เพิ่มฟีเจอร์ใหม่"
                  : "แก้ไขฟีเจอร์"}
              </Text>
            </Space>
          }
          width={720}
          footer={null}
          destroyOnHidden
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="pt-4"
          >
            <Form.Item
              name="name"
              label="ชื่อฟีเจอร์ (TH)"
              rules={[{ required: true, message: "กรุณาระบุชื่อฟีเจอร์" }]}
            >
              <Input
                placeholder="ระบุชื่อฟีเจอร์ภาษาไทย"
                size="large"
                prefix={<FileTextOutlined />}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={16}>
                <Form.Item name="name_en" label="ชื่อฟีเจอร์ (EN)">
                  <Input placeholder="Feature Name (English)" size="large" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="asset_capture_type"
                  label="ประเภท Assets"
                  rules={[{ required: true }]}
                >
                  <Select options={ASSET_OPTIONS} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dateRange"
                  label="ช่วงเวลาดำเนินงาน"
                  rules={[{ required: true, message: "กรุณาระบุช่วงเวลา" }]}
                >
                  <RangePicker
                    className="w-full"
                    size="large"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="estimate_time" label="เวลาที่ใช้ (ประมาณการ)">
                  <Input
                    readOnly
                    prefix={<ClockCircleOutlined />}
                    size="large"
                    className=""
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" plain>
              รายละเอียดเพิ่มเติม
            </Divider>

            <Form.Item name={["backlogDescription", "note"]} label="หมายเหตุ">
              <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
            </Form.Item>

            <Form.List name={["backlogDescription", "backlogs"]}>
              {(fields, { add, remove }) => (
                <div className=" p-4 rounded-lg border border-dashed border-gray-300">
                  <div className="flex justify-between mb-3">
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
                          rules={[{ required: true, message: "ระบุ URL" }]}
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
                  {!fields.length && (
                    <div className="text-center text-gray-400 py-2">
                      ไม่มีเอกสารแนบ
                    </div>
                  )}
                </div>
              )}
            </Form.List>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={handleCloseModal}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isActionLoading}
                icon={<CheckCircleOutlined />}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Detail Modal */}
        <Modal
          open={modalState.type === "detail" && !!modalState.data}
          onCancel={handleCloseModal}
          title={
            <Space>
              <InfoCircleOutlined className="text-blue-500" /> รายละเอียดฟีเจอร์
            </Space>
          }
          footer={<Button onClick={handleCloseModal}>ปิด</Button>}
          width={600}
          centered
        >
          {modalState.data && (
            <div className="space-y-6 pt-4">
              <div className=" p-4 rounded-lg border border-gray-100 flex justify-between items-start">
                <div>
                  <Title level={4} className="m-0">
                    {modalState.data.name}
                  </Title>
                  <Text type="secondary">ID: {modalState.data.id}</Text>
                </div>
                {(() => {
                  const option = ASSET_OPTIONS.find(
                    (o) => o.value === (modalState.data as any).assetCaptureType
                  );
                  return <Tag color={option?.color}>{option?.label}</Tag>;
                })()}
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" className="">
                    <Text type="secondary">วันเริ่มต้น</Text>
                    <div className="font-semibold text-blue-600 flex items-center gap-2">
                      <CalendarOutlined />
                      {modalState.data.startDate
                        ? dayjs(modalState.data.startDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" className="">
                    <Text type="secondary">วันสิ้นสุด</Text>
                    <div className="font-semibold text-red-600 flex items-center gap-2">
                      <CalendarOutlined />
                      {modalState.data.endDate
                        ? dayjs(modalState.data.endDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </Card>
                </Col>
              </Row>

              <div>
                <Text strong>หมายเหตุ</Text>
                <div className="border border-gray-200 p-3 rounded mt-1 min-h-[60px]">
                  {modalState.data.backlogDescription?.note || (
                    <Text type="secondary">-</Text>
                  )}
                </div>
              </div>

              <div>
                <Text strong>เอกสารแนบ</Text>
                <div className="mt-2 space-y-2">
                  {modalState.data.backlogDescription?.backlogs?.length ? (
                    modalState.data.backlogDescription.backlogs.map(
                      (item: any, idx: number) => (
                        <a
                          key={idx}
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center p-3  border border-gray-200 hover:border-blue-200 rounded transition-all group no-underline"
                        >
                          <LinkOutlined className="mr-3 text-gray-400 group-hover:text-blue-500" />
                          <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                            {item.title}
                          </span>
                        </a>
                      )
                    )
                  ) : (
                    <div className="text-center py-4 bg-gray-5 rounded text-gray-400">
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
