import { axios } from "@/helpers/api/api.log";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SwapOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type {
  SubProject,
  SubProjectFormValues,
} from "../types/sub-project.types";
import { ASSET_OPTIONS } from "../utils/constants";
import { calculateWorkingHours } from "../utils/date-helpers";

const { RangePicker } = DatePicker;
const { Text, Title, Paragraph } = Typography;

interface SubProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit" | "clone";
  data: SubProject | null;
  loading: boolean;
  onSubmit: (values: SubProjectFormValues) => Promise<boolean>;
  onCancel: () => void;
  statuses?: any[];
  allProjects?: any[];
}

const POSITION_OPTIONS = [
  { value: "Project Manager" },
  { value: "Developer" },
  { value: "Tech Lead" },
  { value: "Customer Support" },
  { value: "พนักงาน" },
  { value: "Full-stack Developer" },
  { value: "Frontend Developer" },
  { value: "Backend Developer" },
  { value: "QA / Tester" },
  { value: "UI/UX Designer" },
  { value: "System Analyst" },
  { value: "Head of Technology" },
  { value: "Chief Technology Officer" },
  { value: "DevOps Engineer" },
  { value: "Mobile Developer" },
];

export const SubProjectFormModal: React.FC<SubProjectFormModalProps> = ({
  open,
  mode,
  data,
  loading,
  onSubmit,
  onCancel,
  statuses = [],
  allProjects = [],
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const watchedDateRange = Form.useWatch("dateRange", form);
  const [users, setUsers] = useState<any[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [backlogIssues, setBacklogIssues] = useState<any[]>([]);
  const [isFetchingBacklog, setIsFetchingBacklog] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveConfirmText, setMoveConfirmText] = useState("");
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);

  const statusOptions = useMemo(
    () =>
      statuses
        .sort((a, b) => a.priority - b.priority)
        .map((s) => ({ label: s.nameTh, value: s.id })),
    [statuses],
  );

  /**
   * 🔍 ค้นหารายชื่อพนักงานจาก Server (Debounced)
   */
  const handleUserSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        setIsFetchingUsers(true);
        try {
          const res = await axios.get(
            `/api/v1/timesheet/project/sub-project/assignee-search?q=${encodeURIComponent(query)}`,
          );
          if (res.data?.status === 200) {
            // ✅ คัดลอกข้อมูลเฉพาะที่จำเป็นเพื่อป้องกันโครงสร้างข้อมูลพัวพัน (Circular References)
            const results = res.data.data.map((u: any) => ({
              admin_id: u.admin_id,
              firstname: u.firstname,
              lastname: u.lastname,
              nickname: u.nickname,
              position: u.position,
              profile_image_path: u.profile_image_path,
            }));

            setUsers((prev) => {
              // 🔍 ดึง ID ของพนักงานที่เลือกอยู่ในฟอร์มปัจจุบัน
              const currentValues = form.getFieldsValue();
              const currentAssignees = currentValues.assignees || [];
              const selectedUserIds = new Set(
                currentAssignees.map((a: any) => a.userId).filter(Boolean),
              );

              const newMap = new Map();
              // 1. ใส่ผลการค้นหาใหม่
              results.forEach((u: any) => newMap.set(u.admin_id, u));
              // 2. รักษาพนักงานที่เลือกไว้แล้ว (เพื่อให้ Label ใน Select แสดงผลถูกต้อง)
              prev.forEach((u) => {
                if (
                  selectedUserIds.has(u.admin_id) &&
                  !newMap.has(u.admin_id)
                ) {
                  newMap.set(u.admin_id, u);
                }
              });

              return Array.from(newMap.values());
            });
          }
        } catch (error) {
          console.error("Search users error:", error);
        } finally {
          setIsFetchingUsers(false);
        }
      }, 500),
    [form],
  );

  /**
   * 🔍 ค้นหา Backlog Issues จากระบบ (Debounced)
   */
  const handleBacklogSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query || query.length < 2) {
          setBacklogIssues([]);
          return;
        }

        setIsFetchingBacklog(true);
        try {
          // ใช้ space jabjai เป็นค่าเริ่มต้น (หรือค่าที่ตั้งไว้ใน Cookie)
          const res = await axios.get("/api/v1/backlog/issues", {
            params: {
              q: query,
              space: "jabjai", // สามารถปรับเป็นดึงจาก config หรือ context อื่นได้
              count: 20,
            },
          });

          if (res.data?.status === 200) {
            const issues = res.data.data?.items || [];
            setBacklogIssues(
              issues.map((issue: any) => ({
                value: issue.issueKey,
                label: (
                  <Flex vertical gap={0}>
                    <Text strong style={{ fontSize: 13 }}>
                      {issue.issueKey}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                      {issue.summary}
                    </Text>
                  </Flex>
                ),
                key: issue.id,
                summary: issue.summary,
              })),
            );
          }
        } catch (error) {
          console.error("Search backlog error:", error);
        } finally {
          setIsFetchingBacklog(false);
        }
      }, 500),
    [],
  );

  useEffect(() => {
    const initData = async () => {
      if (open) {
        // 1. โหลดรายชื่อเริ่มต้น (50 คนแรก)
        handleUserSearch("");

        if (mode === "create") {
          form.resetFields();
          form.setFieldsValue({
            asset_capture_type: "CAPTUREABLE",
            projectStatusId: statusOptions[0]?.value,
          });
        } else if ((mode === "edit" || mode === "clone") && data) {
          // 2. ถ้าเป็นโหมดการแก้ไข หรือการคัดลอก (Clone) และมีข้อมูลอยู่แล้ว
          // ให้โหลดข้อมูลรายชื่อพนักงานที่รับผิดชอบอยู่เดิมด้วย
          const assigneeIds =
            data.projectAssignees
              ?.map((a) => a.userId)
              .filter(Boolean)
              .join(",") || "";

          if (assigneeIds) {
            try {
              const res = await axios.get(
                `/api/v1/timesheet/project/sub-project/assignee-search?ids=${assigneeIds}`,
              );
              if (res.data?.status === 200) {
                const fetchedUsers = res.data.data;
                setUsers((prev) => {
                  const newMap = new Map();
                  prev.forEach((u) => newMap.set(u.admin_id, u));
                  fetchedUsers.forEach((u: any) => {
                    // ✅ เก็บเฉพาะข้อมูลที่จำเป็น
                    newMap.set(u.admin_id, {
                      admin_id: u.admin_id,
                      firstname: u.firstname,
                      lastname: u.lastname,
                      nickname: u.nickname,
                      position: u.position,
                      profile_image_path: u.profile_image_path,
                    });
                  });
                  return Array.from(newMap.values());
                });
              }
            } catch (err) {
              console.error("Failed to fetch initial assignees:", err);
            }
          }

          const range =
            data.startDate && data.endDate
              ? [dayjs(data.startDate), dayjs(data.endDate)]
              : [];

          form.setFieldsValue({
            id: mode === "clone" ? undefined : data.id,
            name: mode === "clone" ? `${data.name} (Copy)` : data.name,
            name_en: mode === "clone" ? `${data.name_en} (Copy)` : data.name_en,
            ticket_number: data.ticket_number,
            asset_capture_type: data.assetCaptureType,
            projectStatusId: data.projectStatusId,
            dateRange: range,
            estimate_time: calculateWorkingHours(
              data.startDate || "",
              data.endDate || "",
            ).text,
            backlogDescription: data.backlogDescription,
            assignees:
              data.projectAssignees?.map((a) => ({
                userId: a.userId,
                position: a.position,
              })) || [],
          });
        }
      }
    };

    initData();
  }, [open, mode, data, form, statusOptions]);

  useEffect(() => {
    if (!open) {
      setIsMoving(false);
      setMoveConfirmText("");
      setTargetProjectId(null);
    }
  }, [open]);

  useEffect(() => {
    if (watchedDateRange && watchedDateRange[0] && watchedDateRange[1]) {
      const { text } = calculateWorkingHours(
        watchedDateRange[0],
        watchedDateRange[1],
      );

      // 🔍 ตรวจสอบค่าปัจจุบันก่อนอัปเดตเพื่อลดการ Re-render และป้องกัน Circular Reference
      const currentVal = form.getFieldValue("estimate_time");
      if (currentVal !== text) {
        // 🔥 ใช้ setTimeout เพื่อขยับการอัปเดตไปที่ Queue ถัดไป ป้องกันการเตือนเรื่องโครงสร้างข้อมูลพัวพันกัน (Circular references)
        const timer = setTimeout(() => {
          form.setFieldValue("estimate_time", text);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [watchedDateRange, form]);

  const handleFinish = async (values: SubProjectFormValues) => {
    const payload = {
      id: mode === "clone" ? undefined : data?.id,
      name: values.name,
      name_en: values.name_en,
      ticket_number: values.ticket_number,
      assetCaptureType: values.asset_capture_type,
      startDate: values.dateRange?.[0]?.toISOString(),
      endDate: values.dateRange?.[1]?.toISOString(),
      backlogDescription: values.backlogDescription,
      projectStatusId: values.projectStatusId,
      status: statuses.find((s) => s.id === values.projectStatusId)?.nameTh,
      assignees: values.assignees,
      project_id:
        isMoving && targetProjectId ? targetProjectId : data?.project_id,
    };

    if (isMoving && moveConfirmText !== "Confirm") {
      toast.error("กรุณาพิมพ์คำว่า Confirm เพื่อยืนยันการย้ายโครงการ");
      return;
    }

    const success = await onSubmit(payload as any);
    if (success) {
      form.resetFields();
      onCancel();
    }
  };

  const isDark = token.colorBgBase === "#0B0F19";

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div
        style={{
          background: token.colorFillSecondary,
          padding: 6,
          borderRadius: 6,
          display: "flex",
        }}
      >
        {React.cloneElement(icon as React.ReactElement, {
          style: { color: token.colorPrimary },
        })}
      </div>
      <Text strong style={{ fontSize: 16 }}>
        {title}
      </Text>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Space>
          <div
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              padding: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mode === "create" ? (
              <PlusOutlined style={{ color: "#fff" }} />
            ) : mode === "clone" ? (
              <CopyOutlined style={{ color: "#fff" }} />
            ) : (
              <EditOutlined style={{ color: "#fff" }} />
            )}
          </div>
          <Title level={4} style={{ margin: 0 }}>
            {mode === "create"
              ? t("sub_project_page.modal_create_title")
              : mode === "clone"
                ? "คัดลอกฟีเจอร์เดิม"
                : t("sub_project_page.modal_edit_title")}
          </Title>
        </Space>
      }
      width={900}
      footer={null}
      destroyOnHidden
      centered
      styles={{
        content: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 20,
        },
        header: {
          padding: "20px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          marginBottom: 0,
        },
        body: {
          padding: "24px",
          maxHeight: "75vh",
          overflowY: "auto",
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        size="large"
        requiredMark="optional"
      >
        <Row gutter={[24, 24]}>
          {/* Main Info */}
          <Col span={24}>
            {renderSectionHeader("ข้อมูลทั่วไป", <FileTextOutlined />)}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={t("sub_project_page.form_name_th")}
                  rules={[
                    {
                      required: true,
                      message: t("sub_project_page.form_name_required"),
                    },
                  ]}
                >
                  <Input
                    placeholder={t("sub_project_page.form_name_placeholder")}
                    prefix={
                      <FileTextOutlined
                        style={{ color: token.colorTextDescription }}
                      />
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name_en"
                  label={t("sub_project_page.form_name_en")}
                >
                  <Input
                    placeholder={t("sub_project_page.form_name_en_placeholder")}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="ticket_number"
                  label="เชื่อมต่อ backlog (เช่น SB-1234)"
                >
                  <AutoComplete
                    placeholder="ระบุรหัส Ticket เช่น SB-1234 หรือค้นหาด้วยชื่อ Task"
                    onSearch={handleBacklogSearch}
                    options={backlogIssues}
                  >
                    <Input
                      prefix={
                        isFetchingBacklog ? (
                          <SyncOutlined spin />
                        ) : (
                          <LinkOutlined
                            style={{ color: token.colorTextDescription }}
                          />
                        )
                      }
                    />
                  </AutoComplete>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="asset_capture_type"
                  label={t("sub_project_page.form_asset_type")}
                  rules={[{ required: true }]}
                >
                  <Select options={ASSET_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="projectStatusId"
                  label="สถานะการดำเนินงาน"
                  rules={[{ required: true }]}
                >
                  <Select options={statusOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* Timeline */}
          <Col span={24}>
            {renderSectionHeader("ระยะเวลาดำเนินงาน", <CalendarOutlined />)}
            <Row gutter={24}>
              <Col span={16}>
                <Form.Item
                  name="dateRange"
                  label={t("sub_project_page.form_date_range")}
                  rules={[
                    {
                      required: true,
                      message: t("sub_project_page.form_date_range_required"),
                    },
                  ]}
                >
                  <RangePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    separator={<SwapOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="estimate_time"
                  label={t("sub_project_page.form_estimate_time")}
                >
                  <Input
                    readOnly
                    prefix={
                      <ClockCircleOutlined
                        style={{ color: token.colorTextDescription }}
                      />
                    }
                    style={{
                      background: token.colorFillQuaternary,
                      color: token.colorTextSecondary,
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* Team */}
          <Col span={24}>
            {renderSectionHeader("ทีมงานผู้รับผิดชอบ", <TeamOutlined />)}
            <Card
              variant="borderless"
              style={{
                background: token.colorFillQuaternary,
                borderRadius: 12,
              }}
              styles={{ body: { padding: 16 } }}
            >
              <Form.List name="assignees">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row
                        key={key}
                        gutter={12}
                        align="middle"
                        className="mb-3"
                      >
                        <Col span={11}>
                          <Form.Item
                            {...restField}
                            name={[name, "userId"]}
                            rules={[
                              { required: true, message: "ระบุผู้รับผิดชอบ" },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  const assignees =
                                    getFieldValue("assignees") || [];
                                  const duplicates = assignees.filter(
                                    (a: any) =>
                                      a?.userId === value &&
                                      value !== undefined,
                                  );
                                  if (duplicates.length > 1) {
                                    return Promise.reject(
                                      new Error("ชื่อผู้ใช้ซ้ำกัน!"),
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              }),
                            ]}
                            className="mb-0"
                          >
                            <Select
                              placeholder="เลือกผู้รับผิดชอบ"
                              showSearch
                              onSearch={handleUserSearch}
                              filterOption={false}
                              loading={isFetchingUsers}
                              notFoundContent={
                                isFetchingUsers
                                  ? "กำลังค้นหา..."
                                  : "ไม่พบข้อมูล"
                              }
                              onChange={(userId, option: any) => {
                                if (option) {
                                  // อัปเดตตำแหน่งอัตโนมัติเมื่อเลือกผู้ใช้งาน
                                  form.setFieldValue(
                                    ["assignees", name, "position"],
                                    option.position || "พนักงาน",
                                  );
                                }
                              }}
                              options={users.map((u) => ({
                                label: (
                                  <Flex justify="space-between" align="center">
                                    <Space>
                                      <Typography.Text strong>
                                        {u.firstname} {u.lastname}
                                      </Typography.Text>
                                      {u.nickname && (
                                        <Typography.Text type="secondary">
                                          ({u.nickname})
                                        </Typography.Text>
                                      )}
                                    </Space>
                                    <Tag color="blue" bordered={false}>
                                      {u.position}
                                    </Tag>
                                  </Flex>
                                ),
                                value: u.admin_id,
                                position: u.position, // เก็บไว้ใช้ใน onChange
                              }))}
                              prefix={<UserOutlined />}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={11}>
                          <Form.Item
                            {...restField}
                            name={[name, "position"]}
                            className="mb-0"
                          >
                            <AutoComplete
                              options={POSITION_OPTIONS}
                              placeholder="ตำแหน่ง / หน้าที่"
                              filterOption={(inputValue, option) =>
                                (option?.value ?? "")
                                  .toUpperCase()
                                  .indexOf(inputValue.toUpperCase()) !== -1
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      style={{ marginTop: 8 }}
                    >
                      เพิ่มผู้รับผิดชอบ
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>
          </Col>

          {/* Link & Note */}
          <Col span={24}>
            {renderSectionHeader(
              t("sub_project_page.form_additional_details"),
              <InfoCircleOutlined />,
            )}
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name={["backlogDescription", "note"]}
                  label={t("sub_project_page.form_note")}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder={t("sub_project_page.form_note_placeholder")}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Text strong style={{ marginBottom: 12, display: "block" }}>
                  {t("sub_project_page.form_attachments")}
                </Text>
                <Form.List name={["backlogDescription", "backlogs"]}>
                  {(fields, { add, remove }) => (
                    <Card
                      size="small"
                      style={{
                        background: token.colorBgContainer,
                        border: `1px dashed ${token.colorBorder}`,
                      }}
                    >
                      {fields.map(({ key, name, ...restField }) => (
                        <Row key={key} gutter={8} className="mb-2">
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              name={[name, "title"]}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    "sub_project_page.form_link_title_required",
                                  ),
                                },
                              ]}
                              noStyle
                            >
                              <Input
                                placeholder={t(
                                  "sub_project_page.form_link_title_placeholder",
                                )}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "link"]}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    "sub_project_page.form_link_url_required",
                                  ),
                                },
                              ]}
                              noStyle
                            >
                              <Input
                                placeholder={t(
                                  "sub_project_page.form_link_url_placeholder",
                                )}
                                prefix={
                                  <LinkOutlined
                                    style={{
                                      color: token.colorTextDescription,
                                    }}
                                  />
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        size="small"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        block
                      >
                        {t("sub_project_page.form_add_link")}
                      </Button>
                    </Card>
                  )}
                </Form.List>
              </Col>
            </Row>
          </Col>

          {/* Move Project Zone */}
          {mode === "edit" && (
            <Col span={24} className="mb-4">
              <Alert
                message={
                  <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={16}
                  >
                    <Space>
                      <WarningOutlined
                        style={{ fontSize: 24, color: token.colorWarning }}
                      />
                      <div>
                        <Text strong>
                          พื้นที่อันตราย: การย้ายโครงการหลัก (Dangerous Zone)
                        </Text>
                        <div
                          style={{
                            fontSize: 13,
                            color: token.colorTextSecondary,
                          }}
                        >
                          ย้ายโครงการย่อยนี้ไปยังโครงการหลักอื่น
                        </div>
                      </div>
                    </Space>
                    <Button
                      type={isMoving ? "default" : "primary"}
                      danger
                      icon={isMoving ? <CloseOutlined /> : <SwapOutlined />}
                      onClick={() => setIsMoving(!isMoving)}
                    >
                      {isMoving ? "ยกเลิกการย้าย" : "ย้ายโครงการ"}
                    </Button>
                  </Flex>
                }
                type="warning"
                style={{
                  background: token.colorWarningBg,
                  border: `1px solid ${token.colorWarningBorder}`,
                }}
              />

              {isMoving && (
                <Card
                  className="mt-4 animate-in fade-in zoom-in duration-300"
                  style={{
                    border: `1px solid ${token.colorErrorBorder}`,
                    background: token.colorBgContainer,
                  }}
                >
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item
                        label="เลือกโครงการปลายทาง"
                        rules={[{ required: isMoving }]}
                      >
                        <Select
                          showSearch
                          placeholder="ค้นหาโครงการที่ต้องการย้ายไป..."
                          onChange={(val) => setTargetProjectId(val)}
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={allProjects
                            .filter((p: any) => p.id !== data?.project_id)
                            .map((p: any) => ({
                              label: p.name,
                              value: p.id,
                            }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label="ยืนยันการย้าย"
                        help='พิมพ์คำว่า "Confirm" เพื่อยืนยัน'
                      >
                        <Input
                          placeholder="Confirm"
                          value={moveConfirmText}
                          onChange={(e) => setMoveConfirmText(e.target.value)}
                          status={
                            moveConfirmText && moveConfirmText !== "Confirm"
                              ? "error"
                              : ""
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              )}
            </Col>
          )}
        </Row>

        <div
          style={{
            position: "sticky",
            bottom: -24,
            margin: "0 -24px -24px -24px",
            padding: "16px 24px",
            background: token.colorBgContainer,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            zIndex: 10,
          }}
        >
          <Button onClick={onCancel} size="large">
            {t("sub_project_page.form_cancel")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<CheckCircleOutlined />}
            size="large"
          >
            {t("sub_project_page.form_save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
