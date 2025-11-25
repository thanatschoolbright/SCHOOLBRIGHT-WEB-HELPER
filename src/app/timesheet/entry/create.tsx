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
} from "antd";
import {
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SaveOutlined,
  TagOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";

// --- Enterprise Type Definitions ---
// นิยาม Type ให้ชัดเจนแทนการใช้ any
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
}

// --- Helper for Status Colors ---
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
}: CreateModalProps) {
  // ใช้ Design Token เพื่อความสวยงามที่สม่ำเสมอ
  const { token } = theme.useToken();

  // Set Default Values
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        status: "IN_PROGRESS",
        // แนะนำให้ set date เป็นวันนี้เป็นค่าเริ่มต้นเพื่อ UX ที่ดี
        date: dayjs(),
      });
    }
  }, [open, form]);

  // --- Memoized Options (Performance) ---
  // แปลงข้อมูลเตรียมไว้ เพื่อไม่ให้ map ใหม่ทุกครั้งที่ render
  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            <span>{p.name}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              (#{p.id})
            </Typography.Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name, // ใช้สำหรับ search
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
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              (#{s.id})
            </Typography.Text>
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
  // ย้ายปุ่มมาจัดการที่นี่เพื่อให้ Modal จัด Layout ได้ถูกต้องตาม Design System
  const modalFooter = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        * กรุณากรอกข้อมูลให้ครบถ้วน
      </Typography.Text>
      <Space>
        <Button
          onClick={onCancel}
          size="large"
          icon={<CloseOutlined />}
          style={{ borderRadius: token.borderRadiusLG }}
        >
          ยกเลิก
        </Button>
        <Button
          type="primary"
          onClick={form.submit} // Trigger form submit
          size="large"
          loading={disabled}
          disabled={disabled}
          icon={<SaveOutlined />}
          style={{
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowSecondary,
          }}
        >
          บันทึกรายการ
        </Button>
      </Space>
    </div>
  );

  return (
    <Modal
      open={open}
      title={
        <Space>
          <div
            style={{
              width: 4,
              height: 20,
              backgroundColor: token.colorPrimary,
              borderRadius: 2,
            }}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            ลงเวลาทำงานใหม่
          </Typography.Title>
        </Space>
      }
      footer={modalFooter}
      onCancel={onCancel}
      forceRender
      width={720}
      centered
      maskClosable={false}
      styles={{
        body: { padding: "24px 0 0 0" },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        requiredMark="optional" // Modern style: ซ่อนดอกจันสีแดงแบบเก่า (ใช้ validation message แทน)
      >
        {/* Section 1: Project Context */}
        <div
          style={{
            backgroundColor: token.colorFillAlter,
            padding: 24,
            borderRadius: token.borderRadiusLG,
            marginBottom: 24,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Typography.Text
            strong
            style={{
              display: "block",
              marginBottom: 16,
              color: token.colorTextSecondary,
            }}
          >
            <ProjectOutlined /> ข้อมูลโครงการ
          </Typography.Text>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="โครงการหลัก"
                name="project_id"
                rules={[{ required: true, message: "โปรดระบุโครงการหลัก" }]}
              >
                <Select
                  showSearch
                  placeholder="ค้นหาโครงการ..."
                  onChange={(value) => {
                    // Reset sub-project when project changes
                    form.setFieldsValue({ sub_project_id: undefined });
                    // Fetch sub-projects for selected project
                    if (value) {
                      fetchSubProjects(String(value));
                    }
                  }}
                  options={projectOptions}
                  size="large"
                  filterOption={(input, option) =>
                    (option?.labelString ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  variant="filled" // Modern Input style
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="ฟีเจอร์ / งานย่อย"
                name="sub_project_id"
                dependencies={["project_id"]} // Re-render when project changes
                rules={[{ required: true, message: "โปรดระบุงานย่อย" }]}
              >
                <Select
                  showSearch
                  placeholder={
                    !form.getFieldValue("project_id")
                      ? "กรุณาเลือกโครงการหลักก่อน"
                      : subProjectOptions.length === 0
                      ? "กำลังโหลดงานย่อย..."
                      : "ค้นหางานย่อย..."
                  }
                  options={subProjectOptions}
                  size="large"
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
                  variant="filled"
                  notFoundContent={
                    form.getFieldValue("project_id")
                      ? "ไม่พบงานย่อยในโครงการนี้"
                      : "กรุณาเลือกโครงการหลักก่อน"
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Time & Details */}
        <div style={{ paddingInline: 8 }}>
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="วันที่ทำงาน"
                name="date"
                rules={[{ required: true, message: "โปรดระบุวันที่" }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  placeholder="เลือกวันที่"
                  suffixIcon={
                    <CalendarOutlined
                      style={{ color: token.colorTextDescription }}
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="ระยะเวลา (ชั่วโมง)"
                name="work_hour"
                rules={[
                  { required: true, message: "ระบุชั่วโมง" },
                  { type: "number", min: 0.1, message: "> 0" },
                  { type: "number", max: 8, message: "สูงสุด 8 ชม." },
                ]}
              >
                <InputNumber
                  min={0}
                  max={8}
                  step={0.5} // เพิ่ม Step ให้กดง่ายขึ้น
                  placeholder="0.0"
                  size="large"
                  style={{ width: "100%" }}
                  addonAfter={<ClockCircleOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="สถานะงาน"
                name="status"
                rules={[{ required: true, message: "ระบุสถานะ" }]}
              >
                <Select
                  options={statusOptions}
                  placeholder="เลือกสถานะ"
                  size="large"
                  suffixIcon={<TagOutlined />}
                  optionFilterProp="rawLabel"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider dashed style={{ margin: "8px 0 24px 0" }} />

          <Form.Item label="รายละเอียดการทำงาน" name="description">
            <Input.TextArea
              rows={4}
              placeholder="ระบุสิ่งที่ทำไปในวันนี้..."
              size="large"
              showCount
              maxLength={500}
              style={{ resize: "none" }}
              allowClear
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
