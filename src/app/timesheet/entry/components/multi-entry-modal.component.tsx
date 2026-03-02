import React, { useState, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Select,
  InputNumber,
  Input,
  DatePicker,
  Divider,
  theme,
  Tag,
  Badge,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ProjectOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TagOutlined,
  EditOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

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

interface TimesheetEntryItem {
  id: string;
  project_id?: number;
  sub_project_id?: number;
  description?: string;
  work_hour?: number;
  status: string;
  date: Dayjs;
}

interface MultiEntryModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (entries: TimesheetEntryItem[]) => Promise<void>;
  projects: ProjectData[];
  subProjects: Record<string, SubProjectData[]>;
  fetchSubProjects: (id: string) => Promise<void>;
  disabled: boolean;
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

export const MultiEntryModal: React.FC<MultiEntryModalProps> = ({
  open,
  onCancel,
  onSubmit,
  projects,
  subProjects,
  fetchSubProjects,
  disabled,
}) => {
  const { token } = theme.useToken();
  const { t, i18n } = useTranslation("translate");
  const [form] = Form.useForm();

  const [entries, setEntries] = useState<TimesheetEntryItem[]>([
    {
      id: `entry-${Date.now()}`,
      status: "IN_PROGRESS",
      date: dayjs(),
    },
  ]);

  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}`,
        status: "IN_PROGRESS",
        date: dayjs(),
      },
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const updateEntry = useCallback(
    (id: string, field: keyof TimesheetEntryItem, value: any) => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, [field]: value } : entry,
        ),
      );
    },
    [],
  );

  const handleProjectChange = useCallback(
    async (id: string, projectId: number | string) => {
      // 1. รองรับ Type string

      // 2. อัปเดต Local State
      updateEntry(id, "project_id", projectId);
      updateEntry(id, "sub_project_id", undefined); // เคลียร์ค่า Sub Project ใน State

      // 3. (สำคัญ) อัปเดต Form State ให้ตรงกันทันที
      // เพื่อป้องกัน Form จำค่าเก่า และเพื่อให้ Validate ผ่านถูกต้อง
      form.setFieldsValue({
        [`project_id_${id}`]: projectId,
        [`sub_project_id_${id}`]: undefined, // เคลียร์ค่า Sub Project ใน Form
      });

      // 4. Fetch ข้อมูลใหม่
      await fetchSubProjects(String(projectId));
    },
    [updateEntry, fetchSubProjects, form], // เพิ่ม form ใน dependency
  );

  const handleSubmit = useCallback(async () => {
    try {
      await form.validateFields();
      await onSubmit(entries);
      setEntries([
        {
          id: `entry-${Date.now()}`,
          status: "IN_PROGRESS",
          date: dayjs(),
        },
      ]);
      form.resetFields();
    } catch (error) {
      // Validation error
    }
  }, [form, entries, onSubmit]);

  const handleCancel = useCallback(() => {
    setEntries([
      {
        id: `entry-${Date.now()}`,
        status: "IN_PROGRESS",
        date: dayjs(),
      },
    ]);
    form.resetFields();
    onCancel();
  }, [form, onCancel]);

  // แก้ไขจาก value: Number(p.id) เป็น value: p.id
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
        value: p.id, // <--- แก้ตรงนี้: ไม่ต้องแปลงเป็น Number ถ้า id เป็น string
        labelString: p.name,
      })),
    [projects, token.colorPrimary],
  );

  const getSubProjectOptions = useCallback(
    (projectId?: number) => {
      if (!projectId) return [];
      const subs = subProjects[String(projectId)] || [];
      return subs.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            <span>{s.name}</span>
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      }));
    },
    [subProjects, token.colorWarning],
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
    [i18n.language],
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
              background: `linear-gradient(to bottom, ${token.colorSuccess}, ${token.colorSuccessActive})`,
              borderRadius: 4,
            }}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            <AppstoreAddOutlined style={{ marginRight: 8 }} />
            {t("timesheet_entry_page.multi_entry_modal_title")}
          </Typography.Title>
          <Badge
            count={entries.length}
            style={{
              backgroundColor: token.colorSuccess,
              fontSize: 14,
              fontWeight: 600,
            }}
            showZero
          />
        </Space>
      }
      footer={
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
            {t("timesheet_entry_page.multi_entry_footer_note")}
          </Typography.Text>
          <Space>
            <Button
              onClick={handleCancel}
              size="large"
              style={{
                borderRadius: token.borderRadiusLG,
                border: "none",
                background: token.colorFillAlter,
              }}
            >
              {t("timesheet_entry_page.cancel_button")}
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              size="large"
              loading={disabled}
              icon={<SaveOutlined />}
              style={{
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
              }}
            >
              {t("timesheet_entry_page.save_all_entries", {
                count: entries.length,
              })}
            </Button>
          </Space>
        </div>
      }
      onCancel={handleCancel}
      width={1200}
      centered
      maskClosable={false}
      styles={{
        body: {
          padding: "20px 0 0 0",
          maxHeight: "70vh",
          overflowY: "auto",
        },
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Alert
          message={t("timesheet_entry_page.multi_entry_alert_title")}
          description={t("timesheet_entry_page.multi_entry_alert_description")}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {entries.map((entry, index) => (
            <Card
              key={entry.id}
              style={{
                backgroundColor: token.colorFillAlter,
                borderRadius: token.borderRadiusLG,
                border: `2px solid ${token.colorBorder}`,
              }}
              styles={{ body: { padding: 24 } }}
              title={
                <Space>
                  <Badge
                    count={index + 1}
                    style={{
                      backgroundColor: token.colorPrimary,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  />
                  <Typography.Text strong>
                    {t("timesheet_entry_page.entry_number", {
                      number: index + 1,
                    })}
                  </Typography.Text>
                </Space>
              }
              extra={
                entries.length > 1 && (
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => removeEntry(entry.id)}
                  >
                    {t("timesheet_entry_page.remove_entry")}
                  </Button>
                )
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t("timesheet_entry_page.project_label")}
                    name={`project_id_${entry.id}`}
                    rules={[
                      {
                        required: true,
                        message: t("timesheet_entry_page.project_required"),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder={t(
                        "timesheet_entry_page.project_placeholder",
                      )}
                      size="large"
                      variant="filled"
                      options={projectOptions}
                      value={entry.project_id}
                      onChange={(val) => handleProjectChange(entry.id, val)}
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
                    label={t("timesheet_entry_page.sub_project_label")}
                    name={`sub_project_id_${entry.id}`}
                    rules={[
                      {
                        required: true,
                        message: t("timesheet_entry_page.sub_project_required"),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder={t(
                        "timesheet_entry_page.sub_project_placeholder",
                      )}
                      size="large"
                      variant="filled"
                      options={getSubProjectOptions(entry.project_id)}
                      value={entry.sub_project_id}
                      onChange={(val) =>
                        updateEntry(entry.id, "sub_project_id", val)
                      }
                      disabled={!entry.project_id}
                      filterOption={(input, option) =>
                        (option?.labelString ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={12} sm={8}>
                  <Form.Item
                    label={t("timesheet_entry_page.date_label")}
                    name={`date_${entry.id}`}
                    rules={[
                      {
                        required: true,
                        message: t("timesheet_entry_page.date_required"),
                      },
                    ]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      size="large"
                      variant="filled"
                      value={entry.date}
                      onChange={(val) => updateEntry(entry.id, "date", val)}
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
                    label={t("timesheet_entry_page.work_hour_label")}
                    name={`work_hour_${entry.id}`}
                    rules={[
                      {
                        required: true,
                        message: t("timesheet_entry_page.work_hour_required"),
                      },
                      {
                        type: "number",
                        min: 0.1,
                        max: 24,
                        message: t("timesheet_entry_page.work_hour_invalid"),
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="0.0"
                      min={0}
                      step={0.5}
                      size="large"
                      variant="filled"
                      value={entry.work_hour}
                      onChange={(val) =>
                        updateEntry(entry.id, "work_hour", val)
                      }
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
                    label={t("timesheet_entry_page.status_label")}
                    name={`status_${entry.id}`}
                  >
                    <Select
                      options={statusOptions}
                      size="large"
                      variant="filled"
                      value={entry.status}
                      onChange={(val) => updateEntry(entry.id, "status", val)}
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
                    <span>{t("timesheet_entry_page.description_label")}</span>
                  </Space>
                }
                name={`description_${entry.id}`}
                rules={[
                  {
                    required: true,
                    message: t("timesheet_entry_page.description_required"),
                  },
                ]}
              >
                <Input.TextArea
                  placeholder={t(
                    "timesheet_entry_page.description_placeholder",
                  )}
                  rows={3}
                  size="large"
                  variant="filled"
                  showCount
                  maxLength={500}
                  value={entry.description}
                  onChange={(e) =>
                    updateEntry(entry.id, "description", e.target.value)
                  }
                  style={{ resize: "none", borderRadius: token.borderRadiusLG }}
                />
              </Form.Item>
            </Card>
          ))}
        </Space>

        <Button
          type="dashed"
          size="large"
          icon={<PlusOutlined />}
          onClick={addEntry}
          style={{
            width: "100%",
            marginTop: 16,
            height: 56,
            borderRadius: token.borderRadiusLG,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: token.colorPrimary,
            color: token.colorPrimary,
            fontWeight: 600,
          }}
        >
          {t("timesheet_entry_page.add_another_entry")}
        </Button>
      </Form>
    </Modal>
  );
};
