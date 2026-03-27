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
import React, { useEffect, useMemo, useRef, useState } from "react";
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
      onCancel={onCancel}
      width={1200}
      centered
      footer={null}
      forceRender
      afterClose={afterClose}
      styles={{
        body: { padding: "8px 0" },
      }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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

              <Form.Item
                label={
                  <span style={{ fontWeight: 500 }}>
                    <FileTextOutlined />{" "}
                    {t("workDescription", "รายละเอียดการทำงาน")}
                  </span>
                }
                name="description"
                style={{ marginBottom: 0 }}
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
                  style={{ borderRadius: 12 }}
                  placeholder={t(
                    "timesheet_entry_page.description_placeholder",
                    "อธิบายรายละเอียดตัวอย่างงาน เช่น SBAPP-1927 Grade (A+) 215 โรงเรียนเทศบาล ๒ (บ้านมลายูบางกอก) ลิงค์ยืนยันอุปกรณ์ของคุณครูไม่สามารถกดได้",
                  )}
                />
              </Form.Item>
            </Flex>
          </Card>

          <Flex justify="end" gap={12} style={{ padding: "8px 0" }}>
            <Button
              onClick={onCancel}
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
    </Modal>
  );
};
