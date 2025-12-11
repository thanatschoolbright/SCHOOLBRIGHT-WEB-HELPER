import React, { useEffect, useMemo } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Typography,
  Divider,
  theme,
  Tag,
  Space,
  Card,
} from "antd";
import {
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  SaveOutlined,
  TagOutlined,
  CloseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
// สมมติว่า import constants มาจาก path นี้
// import { STATUS_OPTIONS } from "@constants/timesheet.constants";

// Mock constants เพื่อให้ Code ทำงานได้ในตัวอย่างนี้
const STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label_th: "กำลังดำเนินการ", label_en: "In Progress" },
  { value: "DONE", label_th: "เสร็จสิ้น", label_en: "Done" },
  { value: "REVIEW", label_th: "รอตรวจสอบ", label_en: "Review" },
  { value: "CANCELLED", label_th: "ยกเลิก", label_en: "Cancelled" },
];

interface ProjectData {
  id: number | string;
  name: string;
}

interface SubProjectData {
  id: number | string;
  name: string;
}

interface CreateModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  form: FormInstance;
  projects: ProjectData[];
  subProject: SubProjectData[];
  fetchSubProjects: (id: string) => void;
  i18n: { language: string };
  disabled: boolean;
  formMode?: "create" | "edit" | "copy"; // เพิ่ม prop นี้
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "processing";
    case "REVIEW":
      return "warning";
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
};

export function CreateModalForm({
  open,
  onCancel,
  onSubmit,
  form,
  projects,
  subProject,
  fetchSubProjects,
  i18n,
  disabled,
  formMode = "create", // เพิ่ม prop นี้
}: CreateModalProps) {
  const { token } = theme.useToken();

  // Set Default Values - เฉพาะโหมด create เท่านั้น
  useEffect(() => {
    if (open && formMode === "create") {
      // ✅ เช็คว่าเป็นโหมด create เท่านั้น
      form.resetFields();
      form.setFieldsValue({
        status: "IN_PROGRESS",
        date: dayjs(),
      });
    }
  }, [open, formMode, form]);

  // --- Memoized Options ---
  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontWeight: 500 }}>{p.name}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {p.id})
            </Typography.Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name,
      })),
    [projects, token.colorPrimary]
  );

  const subProjectOptions = useMemo(
    () =>
      subProject.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            <span>{s.name}</span>
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token.colorWarning]
  );

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => {
        const label = i18n.language === "th" ? s.label_th : s.label_en;
        return {
          label: (
            <Tag bordered={false} color={getStatusColor(s.value)}>
              {label}
            </Tag>
          ),
          value: s.value,
          rawLabel: label,
        };
      }),
    [i18n.language]
  );

  // --- Custom Footer ---
  const modalFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingTop: 12,
      }}
    >
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        * กรุณาตรวจสอบความถูกต้องก่อนบันทึก
      </Typography.Text>
      <Space>
        <Button
          onClick={onCancel}
          size="large"
          style={{
            borderRadius: token.borderRadiusLG,
            border: "none",
            background: token.colorFillAlter,
          }}
        >
          ยกเลิก
        </Button>
        <Button
          type="primary"
          onClick={form.submit}
          size="large"
          loading={disabled}
          icon={<SaveOutlined />}
          style={{
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowSecondary,
          }}
        >
          บันทึก Timesheet
        </Button>
      </Space>
    </div>
  );

  return (
    <Modal
      open={open}
      title={
        <Space align="center" style={{ marginBottom: 8 }}>
          <div
            style={{
              width: 4,
              height: 24,
              background: `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
              borderRadius: 4,
            }}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            ลงเวลาทำงาน
          </Typography.Title>
        </Space>
      }
      footer={modalFooter}
      onCancel={onCancel}
      width={700}
      centered
      maskClosable={false}
      styles={{ body: { padding: "20px 0 0 0" } }} // Modern padding reset
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        requiredMark={false}
      >
        {/* Section 1: Context (Project Selection) - Highlighted Box */}
        <Card
          bordered={false}
          style={{
            backgroundColor: token.colorFillAlter,
            marginBottom: 24,
            borderRadius: token.borderRadiusLG,
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Typography.Text
                strong
                style={{
                  color: token.colorTextSecondary,
                  display: "block",
                  marginBottom: 12,
                }}
              >
                <ProjectOutlined /> โครงการที่รับผิดชอบ
              </Typography.Text>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="โครงการหลัก"
                name="project_id"
                rules={[{ required: true, message: "ระบุโครงการ" }]}
                style={{ marginBottom: 0 }} // Remove bottom margin for alignment inside card
              >
                <Select
                  showSearch
                  placeholder="เลือกโครงการ..."
                  size="large"
                  variant="filled" // Modern Style
                  options={projectOptions}
                  onChange={(val) => {
                    form.setFieldsValue({ sub_project_id: undefined });
                    if (val) fetchSubProjects(String(val));
                  }}
                  filterOption={(input, option) =>
                    (option?.labelString ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="งานย่อย / ฟีเจอร์"
                name="sub_project_id"
                rules={[{ required: true, message: "ระบุงานย่อย" }]}
                style={{ marginBottom: 0 }}
                dependencies={["project_id"]}
              >
                <Select
                  showSearch
                  placeholder="เลือกงานย่อย..."
                  size="large"
                  variant="filled" // Modern Style
                  options={subProjectOptions}
                  disabled={!form.getFieldValue("project_id")}
                  loading={
                    form.getFieldValue("project_id") &&
                    subProjectOptions.length === 0
                  }
                  filterOption={(input, option) =>
                    (option?.labelString ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Section 2: Details (Time & Status) */}
        <div style={{ paddingInline: 8 }}>
          <Row gutter={20}>
            <Col xs={12} sm={8}>
              <Form.Item
                label="วันที่"
                name="date"
                rules={[{ required: true, message: "ระบุวันที่" }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  variant="filled"
                  suffixIcon={
                    <CalendarOutlined
                      style={{ color: token.colorTextDescription }}
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label="ระยะเวลา (ชม.)"
                name="work_hour"
                rules={[
                  { required: true, message: "ระบุเวลา" },
                  { type: "number", min: 0.1, max: 24, message: "ไม่ถูกต้อง" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0.0"
                  min={0}
                  step={0.5}
                  size="large"
                  variant="filled"
                  addonAfter={
                    <ClockCircleOutlined
                      style={{ color: token.colorTextDescription }}
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="สถานะ" name="status">
                <Select
                  options={statusOptions}
                  size="large"
                  variant="filled"
                  suffixIcon={
                    <TagOutlined
                      style={{ color: token.colorTextDescription }}
                    />
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "4px 0 24px 0" }} />

          <Form.Item
            label={
              <Space>
                <EditOutlined />
                <span>รายละเอียดการทำงาน</span>
              </Space>
            }
            name="description"
          >
            <Input.TextArea
              placeholder="อธิบายรายละเอียดงานที่ทำในวันนี้..."
              rows={4}
              size="large"
              variant="filled"
              showCount
              maxLength={500}
              style={{ resize: "none", borderRadius: token.borderRadiusLG }}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
