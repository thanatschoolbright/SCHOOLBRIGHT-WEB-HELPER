"use client";

import {
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  SaveOutlined,
  SearchOutlined,
  TagOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TimesheetEntry } from "../types";

// Note: Ensure dayjs is configured for Buddhist Era if needed in a global config or helper.

interface ProjectData {
  id: number | string;
  name: string;
}

interface SubProjectData {
  id: number | string;
  name: string;
  ticket_number?: any;
}

interface CreateModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  form: FormInstance;
  projects: ProjectData[];
  subProject: SubProjectData[];
  fetchSubProjects: (id: string) => void;
  i18n: any;
  disabled: boolean;
  formMode?: "create" | "edit" | "copy";
  record?: TimesheetEntry | null;
  afterClose?: () => void;
  statusOptions: Array<{ label: React.ReactNode; value: string }>;
}

/**
 * ฟอร์ม Modal สำหรับเพิ่มหรือแก้ไขข้อมูล Timesheet (ลงเวลาทำงาน)
 */
export const CreateModalForm: React.FC<CreateModalProps> = ({
  open,
  onCancel,
  onSubmit,
  form,
  projects,
  subProject,
  fetchSubProjects,
  i18n,
  disabled,
  formMode = "create",
  record,
  afterClose,
  statusOptions,
}) => {
  const { t } = useTranslation("timesheet");
  const { token } = theme.useToken();
  const { Text, Title } = Typography;
  const [searchMode, setSearchMode] = useState<"hierarchy" | "direct">(
    "hierarchy",
  );
  const [subProjectOptionsSearch, setSubProjectOptionsSearch] = useState<any[]>(
    [],
  );
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewResult, setAiPreviewResult] = useState<{
    original: string;
    suggested: string;
  } | null>(null);

  // ── Recent Descriptions (localStorage) ──
  const RECENT_KEY = "timesheet_recent_descriptions";
  const MAX_RECENT = 5;

  const getRecentDescriptions = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
  }, []);

  const saveRecentDescription = useCallback((text: string) => {
    if (!text.trim()) return;
    const prev = getRecentDescriptions();
    // ตัดซ้ำ + เอาอันใหม่ไว้หน้าสุด
    const updated = [
      text.trim(),
      ...prev.filter((d) => d !== text.trim()),
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  }, [getRecentDescriptions]);

  const recentDescriptions = getRecentDescriptions();

  // ตรวจสอบว่ามีข้อมูลที่กรอกค้างอยู่ไหม
  const hasUnsavedData = useCallback((): boolean => {
    if (formMode === "edit") return false; // edit mode ไม่ต้อง confirm
    const values = form.getFieldsValue();
    return !!(
      values.description?.trim() ||
      values.project_id ||
      values.sub_project_id ||
      values.sub_project_search
    );
  }, [form, formMode]);

  // handler แทน onCancel — เช็คก่อนปิด
  const handleCancel = useCallback(() => {
    if (hasUnsavedData()) {
      setConfirmCloseOpen(true);
    } else {
      onCancel();
    }
  }, [hasUnsavedData, onCancel]);

  // ✨ เรียก AI ช่วยขยายความรายละเอียดการทำงาน
  const handleAiExpand = useCallback(async () => {
    const draft: string = form.getFieldValue("description") ?? "";
    if (!draft.trim()) return;

    const projectId: number | undefined = form.getFieldValue("project_id");
    const projectName = projects.find((p) => Number(p.id) === projectId)?.name;
    const subProjectId: number | undefined = form.getFieldValue("sub_project_id");
    const featureName = subProject.find((s) => Number(s.id) === subProjectId)?.name;

    setAiLoading(true);
    try {
      const response = await axios.post("/api/v1/timesheet/ai-description", {
        draft,
        project_name: projectName,
        feature_name: featureName,
      });
      const result: string = response.data?.data?.description ?? "";
      if (result) {
        form.setFieldsValue({ description: result });
      }
    } catch {
      // ไม่ขัดจังหวะผู้ใช้ — ปล่อยให้ข้อความเดิมอยู่ครบ
    } finally {
      setAiLoading(false);
    }
  }, [form, projects, subProject]);

  // ฟังก์ชันค้นหา Sub-project แบบ Direct Search
  const handleSearchSubProject = (value: string) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!value) {
      setSubProjectOptionsSearch([]);
      return;
    }
    setSearching(true);
    searchRef.current = setTimeout(async () => {
      try {
        const responseSubProjectSearch = await axios.get(
          `/api/v1/timesheet/project/sub-project/search?q=${encodeURIComponent(
            value,
          )}`,
        );
        if (responseSubProjectSearch.data?.data) {
          setSubProjectOptionsSearch(
            responseSubProjectSearch.data.data.map((item: any) => ({
              label: item.display_label,
              value: item.id,
              item: item,
            })),
          );
        }
      } catch (err) {
        console.error("Error searching sub-project:", err);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (formMode === "create") {
          form.resetFields();
          form.setFieldsValue({
            status: "DONE",
            date: dayjs(),
            work_hour: 2.0,
          });
        } else if ((formMode === "edit" || formMode === "copy") && record) {
          form.setFieldsValue({
            project_id: Number(record.project_id),
            sub_project_id: record.feature_id
              ? Number(record.feature_id)
              : undefined,
            description: record.description ?? "",
            work_hour: Number(record.hours) || undefined,
            status: record.status,
            date: formMode === "copy" ? dayjs() : dayjs(record.date),
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, formMode, form, record]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (searchMode === "hierarchy") {
        form.setFieldsValue({ sub_project_search: undefined });
      } else {
        form.setFieldsValue({
          project_id: undefined,
          sub_project_id: undefined,
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [searchMode, form, open]);

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            {p.name}
            <Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {p.id})
            </Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name,
      })),
    [projects, token, Text],
  );

  const subProjectOptions = useMemo(
    () =>
      subProject.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            {s.ticket_number && (
              <Tag color="blue" bordered={false}>
                {s.ticket_number}
              </Tag>
            )}
            {s.name}
            <Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {s.id})
            </Text>
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token, Text],
  );

  return (
    <Modal
      open={open}
      title={
        <Space size={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: token.colorPrimaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ThunderboltOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {t("logWorkTime", "ลงเวลาทำงาน")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              บันทึกรายละเอียดการปฏิบัติงานประจำวันเข้าสู่ระบบ
            </Text>
          </div>
        </Space>
      }
      onCancel={handleCancel}
      width={1200}
      centered
      footer={null}
      forceRender
      afterClose={afterClose}
      styles={{
        body: { padding: "8px 0" },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          saveRecentDescription(values.description ?? "");
          onSubmit(values);
        }}
      >
        <Flex vertical gap={24}>
          <Card
            variant="borderless"
            styles={{ body: { padding: 24 } }}
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 16,
              background: token.colorBgContainer,
            }}
          >
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: 20 }}
            >
              <Space>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: token.colorInfoBg,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ProjectOutlined style={{ color: token.colorInfo }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {t("responsibleProject", "โครงการที่รับผิดชอบ")}
                </Text>
              </Space>
              <Radio.Group
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="hierarchy">
                  {t("selectByProject", "เลือกตามโครงการ")}
                </Radio.Button>
                <Radio.Button value="direct">
                  {t("searchSubTask", "ค้นหางานย่อย")}
                </Radio.Button>
              </Radio.Group>
            </Flex>

            {searchMode === "hierarchy" ? (
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <span style={{ fontWeight: 500 }}>
                          {t("mainProject", "โครงการหลัก")}
                        </span>
                        <Tooltip
                          title={t(
                            "searchProjectTip",
                            "ค้นหาได้ทั้ง ชื่อโครงการ และ Project ID",
                          )}
                        >
                          <InfoCircleOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    name="project_id"
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      placeholder="เลือกโครงการ..."
                      options={projectOptions}
                      onChange={(v) => {
                        form.setFieldsValue({ sub_project_id: undefined });
                        if (v) fetchSubProjects(String(v));
                      }}
                      showSearch
                      filterOption={(input, option) => {
                        const labelStr = (
                          option?.labelString ?? ""
                        ).toLowerCase();
                        const inputStr = input.toLowerCase();
                        const valueStr = String(option?.value).toLowerCase();
                        return (
                          labelStr.includes(inputStr) ||
                          valueStr.includes(inputStr)
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <span style={{ fontWeight: 500 }}>
                          {t("subTaskFeature", "งานย่อย / ฟีเจอร์")}
                        </span>
                        <Tooltip
                          title={t(
                            "searchSubTaskTip",
                            "ค้นหาได้ทั้ง ชื่องานย่อย และ Feature ID",
                          )}
                        >
                          <InfoCircleOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    name="sub_project_id"
                    rules={[{ required: true }]}
                    dependencies={["project_id"]}
                  >
                    <Select
                      size="large"
                      placeholder="เลือกงานย่อย..."
                      options={subProjectOptions}
                      disabled={!form.getFieldValue("project_id")}
                      showSearch
                      filterOption={(input, option) => {
                        const labelStr = (
                          option?.labelString ?? ""
                        ).toLowerCase();
                        const inputStr = input.toLowerCase();
                        const valueStr = String(option?.value).toLowerCase();
                        return (
                          labelStr.includes(inputStr) ||
                          valueStr.includes(inputStr)
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Form.Item
                label={
                  <span style={{ fontWeight: 500 }}>
                    {t("searchSubTask", "ค้นหางานย่อย")}
                  </span>
                }
                name="sub_project_search"
                rules={[
                  {
                    required: true,
                    message: t(
                      "pleaseSelectSubTask",
                      "กรุณาค้นหาและเลือกงานย่อย",
                    ),
                  },
                  {
                    validator: async (_, value) => {
                      const projectId = form.getFieldValue("project_id");
                      const subProjectId = form.getFieldValue("sub_project_id");
                      if (!projectId || !subProjectId) {
                        return Promise.reject(
                          new Error(
                            t("selectFromList", "กรุณาเลือกงานย่อยจากรายการ"),
                          ),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Select
                  size="large"
                  showSearch
                  placeholder={t(
                    "searchPlaceholderDirect",
                    "พิมพ์ชื่องานย่อย, โครงการหลัก หรือ ID...",
                  )}
                  options={subProjectOptionsSearch}
                  onSearch={handleSearchSubProject}
                  loading={searching}
                  filterOption={false}
                  notFoundContent={
                    searching
                      ? t("searching", "กำลังค้นหา...")
                      : t("notFound", "ไม่พบข้อมูล")
                  }
                  onChange={(value, option: any) => {
                    if (option?.item) {
                      form.setFieldsValue({
                        project_id: option.item.main_project_id,
                        sub_project_id: option.item.id,
                      });
                      fetchSubProjects(String(option.item.main_project_id));
                    }
                  }}
                  suffixIcon={<SearchOutlined />}
                />
              </Form.Item>
            )}
          </Card>

          <Card
            variant="borderless"
            styles={{ body: { padding: 24 } }}
            style={{
              borderRadius: 16,
              background: token.colorFillAlter,
              border: "none",
            }}
          >
            <Flex vertical gap={20}>
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 500 }}>
                        <CalendarOutlined /> {t("date", "วันที่")}
                      </span>
                    }
                    name="date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      size="large"
                      format="DD/MM/BBBB"
                      style={{ width: "100%" }}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf("day")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 500 }}>
                        <ClockCircleOutlined />{" "}
                        {t("durationHours", "ระยะเวลา (ชม.)")}
                      </span>
                    }
                    name="work_hour"
                    rules={[
                      { required: true },
                      { type: "number", min: 0.1, max: 24 },
                    ]}
                    extra={
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) =>
                          prev.work_hour !== curr.work_hour
                        }
                      >
                        {({ getFieldValue }) => {
                          const hours = getFieldValue("work_hour");
                          return hours > 8 ? (
                            <Text type="warning" style={{ fontSize: 12 }}>
                              <ExclamationCircleOutlined />{" "}
                              {t(
                                "over8HoursWarning",
                                "คุณกำลังกรอกเวลาเกิน 8 ชั่วโมง",
                              )}
                            </Text>
                          ) : null;
                        }}
                      </Form.Item>
                    }
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0}
                      step={0.5}
                      placeholder="0.0"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 500 }}>
                        <TagOutlined /> {t("status", "สถานะ")}
                      </span>
                    }
                    name="status"
                  >
                    <Select size="large" options={statusOptions} />
                  </Form.Item>
                </Col>
              </Row>

              {/* ── รายละเอียดการทำงาน ── */}
              <div
                style={{
                  borderRadius: token.borderRadiusLG,
                  border: `1.5px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header bar */}
                <Flex
                  align="center"
                  justify="space-between"
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}
                >
                  <Flex align="center" gap={8}>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: token.borderRadius,
                        background: token.colorPrimaryBg,
                      }}
                    >
                      <FileTextOutlined
                        style={{ fontSize: 14, color: token.colorPrimary }}
                      />
                    </Flex>
                    <Flex vertical gap={0}>
                      <Text strong style={{ fontSize: 13, lineHeight: 1.3 }}>
                        {t("workDescription", "รายละเอียดการทำงาน")}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        อธิบายสิ่งที่ทำในวันนี้ หรือพิมพ์สั้นๆ แล้วให้ AI ช่วยขยาย
                      </Text>
                    </Flex>
                  </Flex>

                  {/* Recent + AI Buttons */}
                  <Flex align="center" gap={8}>
                  {recentDescriptions.length > 0 && (
                    <Tooltip
                      open={recentOpen}
                      onOpenChange={setRecentOpen}
                      trigger="click"
                      placement="bottomRight"
                      color={token.colorBgElevated}
                      title={
                        <Flex vertical gap={0} style={{ minWidth: 280 }}>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 11,
                              padding: "8px 12px 6px",
                              borderBottom: `1px solid ${token.colorBorderSecondary}`,
                              display: "block",
                            }}
                          >
                            ประวัติล่าสุด (กดเพื่อใช้)
                          </Text>
                          {recentDescriptions.map((desc, i) => (
                            <Flex
                              key={i}
                              align="flex-start"
                              gap={8}
                              onClick={() => {
                                form.setFieldsValue({ description: desc });
                                setRecentOpen(false);
                              }}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                borderBottom:
                                  i < recentDescriptions.length - 1
                                    ? `1px solid ${token.colorBorderSecondary}`
                                    : "none",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  token.colorFillAlter;
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  "transparent";
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: token.colorText,
                                  lineHeight: 1.5,
                                  flex: 1,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {desc}
                              </Text>
                            </Flex>
                          ))}
                        </Flex>
                      }
                    >
                      <Button
                        size="small"
                        style={{
                          borderRadius: 99,
                          fontSize: 12,
                          height: 32,
                          padding: "0 12px",
                          border: `1px solid ${token.colorBorderSecondary}`,
                          color: token.colorTextSecondary,
                          background: token.colorBgContainer,
                        }}
                      >
                        🕐 ล่าสุด ({recentDescriptions.length})
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="พิมพ์ข้อความสั้นๆ ก่อน แล้วกด AI จะขยายความให้สมบูรณ์">
                    <Button
                      loading={aiLoading}
                      disabled={aiLoading}
                      onClick={handleAiExpand}
                      style={{
                        borderRadius: 99,
                        fontSize: 12,
                        height: 32,
                        padding: "0 14px",
                        background: aiLoading
                          ? token.colorFillSecondary
                          : `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                        border: "none",
                        color: aiLoading ? token.colorTextSecondary : "#fff",
                        fontWeight: 600,
                        boxShadow: aiLoading
                          ? "none"
                          : `0 3px 10px ${token.colorPrimaryBorder}`,
                        letterSpacing: "0.3px",
                      }}
                    >
                      {aiLoading ? "✦ กำลังคิด..." : "✦ AI ช่วยเขียน"}
                    </Button>
                  </Tooltip>
                  </Flex>
                </Flex>

                {/* Quick Preset Buttons */}
                <Flex
                  wrap="wrap"
                  gap={6}
                  style={{
                    padding: "10px 16px",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                  }}
                >
                  {[
                    { label: "🐛 แก้ไขบัค", text: "แก้ไขบัคระบบ" },
                    { label: "✨ พัฒนาฟีเจอร์", text: "พัฒนาฟีเจอร์" },
                    { label: "🧪 ทดสอบระบบ", text: "ทดสอบระบบ" },
                    { label: "📋 ประชุม", text: "เข้าร่วมประชุม" },
                    { label: "📝 เขียน Spec", text: "เขียน Spec / เอกสาร" },
                    { label: "🔍 Code Review", text: "ตรวจสอบ Code Review" },
                    { label: "🚀 Deploy", text: "Deploy ระบบขึ้น Production" },
                    { label: "🔧 ปรับปรุง UI", text: "ปรับปรุง UI/UX" },
                  ].map((preset) => (
                    <Tag
                      key={preset.label}
                      style={{
                        cursor: "pointer",
                        borderRadius: 99,
                        padding: "2px 10px",
                        fontSize: 12,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        background: token.colorFillAlter,
                        color: token.colorText,
                        userSelect: "none",
                        transition: "all 0.15s",
                      }}
                      onClick={() => {
                        const current: string =
                          form.getFieldValue("description") ?? "";
                        const separator =
                          current && !current.endsWith(" ") ? " " : "";
                        form.setFieldsValue({
                          description: current + separator + preset.text,
                        });
                      }}
                    >
                      {preset.label}
                    </Tag>
                  ))}
                </Flex>

                {/* Textarea area — ไม่มี label ซ้ำ ใช้ Form.Item แบบ noLabel */}
                <Form.Item
                  name="description"
                  style={{ margin: "12px 16px 0" }}
                  rules={[
                    {
                      required: true,
                      message: t(
                        "timesheet_entry_page.description_required",
                        "กรุณาระบุรายละเอียดการทำงาน",
                      ),
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={5}
                    showCount
                    maxLength={500}
                    style={{
                      borderRadius: token.borderRadius,
                      resize: "vertical",
                      fontSize: 14,
                      lineHeight: 1.7,
                      border: `1.5px solid ${token.colorBorder}`,
                      background: token.colorBgLayout,
                      marginBottom: 12,
                    }}
                    placeholder={t(
                      "timesheet_entry_page.description_placeholder",
                      "เช่น  แก้บัค login SBAPP  หรือ  พัฒนาหน้า dashboard ระบบการเงิน  แล้วกด ✦ AI ช่วยเขียน",
                    )}
                  />
                </Form.Item>
              </div>
            </Flex>
          </Card>

          <Flex justify="end" gap={12} style={{ padding: "8px 0" }}>
            <Button
              onClick={handleCancel}
              disabled={disabled}
              size="large"
              style={{ minWidth: 100, borderRadius: 10 }}
            >
              {t("cancel", "ยกเลิก")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={disabled}
              icon={<SaveOutlined />}
              size="large"
              style={{ minWidth: 160, borderRadius: 10, fontWeight: 600 }}
            >
              {t("saveData", "บันทึกข้อมูล")}
            </Button>
          </Flex>
        </Flex>
      </Form>

      {/* ── Confirm ก่อนปิด Modal ── */}
      <Modal
        open={confirmCloseOpen}
        onCancel={() => setConfirmCloseOpen(false)}
        onOk={() => {
          setConfirmCloseOpen(false);
          onCancel();
        }}
        title={
          <Flex align="center" gap={10}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 36,
                height: 36,
                borderRadius: token.borderRadiusLG,
                background: token.colorWarningBg,
                flexShrink: 0,
              }}
            >
              <ExclamationCircleOutlined
                style={{ fontSize: 18, color: token.colorWarning }}
              />
            </Flex>
            <Text strong style={{ fontSize: 15 }}>
              มีข้อมูลที่ยังไม่ได้บันทึก
            </Text>
          </Flex>
        }
        okText="ออกโดยไม่บันทึก"
        cancelText="ยังอยู่ที่นี่"
        okButtonProps={{
          danger: true,
          size: "middle",
          style: { borderRadius: token.borderRadius },
        }}
        cancelButtonProps={{
          size: "middle",
          style: { borderRadius: token.borderRadius },
        }}
        width={420}
        centered
        styles={{
          body: { padding: "12px 0 4px" },
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          คุณกรอกข้อมูลไว้แล้วแต่ยังไม่ได้กด <Text strong>"บันทึกข้อมูล"</Text>
          <br />
          ถ้าออกตอนนี้ ข้อมูลที่กรอกไว้จะหายทั้งหมด
        </Text>
      </Modal>
    </Modal>
  );
};
