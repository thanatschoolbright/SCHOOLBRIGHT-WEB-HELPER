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

  // Add CSS animation for pulse effect
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scaleY(1);
        }
        50% {
          opacity: 0.8;
          transform: scaleY(0.95);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
        paddingTop: 16,
        paddingBottom: 8,
        background: `linear-gradient(180deg, transparent 0%, ${token.colorFillAlter}40 100%)`,
        borderRadius: token.borderRadiusLG,
        padding: "16px 24px 8px",
        marginTop: 8,
      }}
    >
      <Typography.Text
        type="secondary"
        style={{
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 16 }}>💡</span>
        กรุณาตรวจสอบความถูกต้องก่อนบันทึก
      </Typography.Text>
      <Space>
        <Button
          onClick={onCancel}
          size="large"
          style={{
            borderRadius: token.borderRadiusLG,
            border: "none",
            background: token.colorFillAlter,
            fontWeight: 500,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 4px 12px ${token.colorFill}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
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
            background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
            border: "none",
            boxShadow: `0 4px 16px ${token.colorPrimary}40`,
            fontWeight: 600,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 6px 20px ${token.colorPrimary}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 4px 16px ${token.colorPrimary}40`;
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
              width: 6,
              height: 32,
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive}, ${token.colorPrimaryBorder})`,
              borderRadius: 8,
              boxShadow: `0 0 20px ${token.colorPrimary}40`,
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <Typography.Title
            level={3}
            style={{
              margin: 0,
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            ⚡ ลงเวลาทำงาน
          </Typography.Title>
        </Space>
      }
      footer={modalFooter}
      onCancel={onCancel}
      width={900}
      centered
      maskClosable={false}
      styles={{
        body: { padding: "24px 0 0 0" },
        mask: {
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
        },
      }}
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
            background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
            marginBottom: 24,
            borderRadius: token.borderRadiusLG,
            border: `2px solid ${token.colorPrimary}20`,
            boxShadow: `0 8px 32px ${token.colorPrimary}15, inset 0 1px 0 rgba(255,255,255,0.5)`,
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
          bodyStyle={{ padding: 24, position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: `radial-gradient(circle, ${token.colorPrimary}15, transparent)`,
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          <Row gutter={16}>
            <Col span={24}>
              <Typography.Text
                strong
                style={{
                  color: token.colorPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                <ProjectOutlined
                  style={{
                    fontSize: 20,
                    padding: 8,
                    background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
                    color: "white",
                    borderRadius: 8,
                    boxShadow: `0 4px 12px ${token.colorPrimary}40`,
                  }}
                />
                โครงการที่รับผิดชอบ
              </Typography.Text>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 600,
                      color: token.colorText,
                      fontSize: 14,
                    }}
                  >
                    โครงการหลัก
                  </span>
                }
                name="project_id"
                rules={[{ required: true, message: "ระบุโครงการ" }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  showSearch
                  placeholder="เลือกโครงการ..."
                  size="large"
                  variant="filled"
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
                  style={{
                    boxShadow: `0 2px 8px ${token.colorPrimary}10`,
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 600,
                      color: token.colorText,
                      fontSize: 14,
                    }}
                  >
                    งานย่อย / ฟีเจอร์
                  </span>
                }
                name="sub_project_id"
                rules={[{ required: true, message: "ระบุงานย่อย" }]}
                style={{ marginBottom: 0 }}
                dependencies={["project_id"]}
              >
                <Select
                  showSearch
                  placeholder="เลือกงานย่อย..."
                  size="large"
                  variant="filled"
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
                  style={{
                    boxShadow: `0 2px 8px ${token.colorWarning}10`,
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Section 2: Details (Time & Status) */}
        <div
          style={{
            paddingInline: 8,
            background: `linear-gradient(180deg, transparent 0%, ${token.colorFillAlter}30 100%)`,
            borderRadius: token.borderRadiusLG,
            padding: "24px 16px",
          }}
        >
          <Row gutter={20}>
            <Col xs={12} sm={8}>
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 600,
                      color: token.colorText,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CalendarOutlined style={{ color: token.colorPrimary }} />
                    วันที่
                  </span>
                }
                name="date"
                rules={[{ required: true, message: "ระบุวันที่" }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{
                    width: "100%",
                    boxShadow: `0 2px 8px ${token.colorPrimary}10`,
                  }}
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
                label={
                  <span
                    style={{
                      fontWeight: 600,
                      color: token.colorText,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ClockCircleOutlined
                      style={{ color: token.colorWarning }}
                    />
                    ระยะเวลา (ชม.)
                  </span>
                }
                name="work_hour"
                rules={[
                  { required: true, message: "ระบุเวลา" },
                  { type: "number", min: 0.1, max: 24, message: "ไม่ถูกต้อง" },
                ]}
              >
                <InputNumber
                  style={{
                    width: "100%",
                    boxShadow: `0 2px 8px ${token.colorWarning}10`,
                  }}
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
              <Form.Item
                label={
                  <span
                    style={{
                      fontWeight: 600,
                      color: token.colorText,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <TagOutlined style={{ color: token.colorSuccess }} />
                    สถานะ
                  </span>
                }
                name="status"
              >
                <Select
                  options={statusOptions}
                  size="large"
                  variant="filled"
                  suffixIcon={
                    <TagOutlined
                      style={{ color: token.colorTextDescription }}
                    />
                  }
                  style={{
                    boxShadow: `0 2px 8px ${token.colorSuccess}10`,
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider
            style={{
              margin: "8px 0 24px 0",
              borderColor: `${token.colorPrimary}20`,
            }}
          />

          <Form.Item
            label={
              <Space
                style={{
                  fontWeight: 600,
                  color: token.colorText,
                  fontSize: 14,
                }}
              >
                <EditOutlined
                  style={{
                    fontSize: 16,
                    padding: 6,
                    background: `linear-gradient(135deg, ${token.colorInfo}, ${token.colorInfoActive})`,
                    color: "white",
                    borderRadius: 6,
                  }}
                />
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
              style={{
                resize: "none",
                borderRadius: token.borderRadiusLG,
                border: `2px solid ${token.colorBorder}`,
                boxShadow: `0 4px 16px ${token.colorInfo}08`,
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = token.colorPrimary;
                e.currentTarget.style.boxShadow = `0 4px 20px ${token.colorPrimary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = token.colorBorder;
                e.currentTarget.style.boxShadow = `0 4px 16px ${token.colorInfo}08`;
              }}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
