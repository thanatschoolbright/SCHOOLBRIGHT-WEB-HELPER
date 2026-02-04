import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Row,
  Col,
  Card,
  Typography,
  AutoComplete,
  Alert,
  Flex,
  theme,
} from "antd";
import {
  ProjectOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  MinusCircleOutlined,
  LinkOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { categoryType } from "@/data/timesheet.category.type";
import { ASSET_OPTIONS } from "../utils/timeline.helpers";
import { ModalState } from "../types/timeline.types";
import { getUserData } from "@helpers/local_storage/user.storage";
import { toast } from "sonner";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface ProjectEditModalProps {
  modal: ModalState;
  onCancel: () => void;
  onSuccess: () => void;
  currentAdminId: number;
  allProjects?: any[];
  projectStatuses?: any[];
}

const POSITION_OPTIONS = [
  { value: "Project Manager" },
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
  { value: "Data Engineer" },
];

const calculateWorkingHours = (startDate: any, endDate: any) => {
  if (!startDate || !endDate) return { hours: 0, text: "0 ชั่วโมง" };

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return { hours: 0, text: "0 ชั่วโมง" };
  }

  const months = end.diff(start, "month", true);
  const estimatedHours = Math.ceil(8 * 22 * months);
  return {
    hours: estimatedHours > 0 ? estimatedHours : 0,
    text: estimatedHours > 0 ? `${estimatedHours} ชั่วโมง` : "0 ชั่วโมง",
  };
};

export const ProjectEditModalComponent: React.FC<ProjectEditModalProps> = ({
  modal,
  onCancel,
  onSuccess,
  currentAdminId,
  allProjects = [],
  projectStatuses = [],
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [moveConfirmText, setMoveConfirmText] = useState("");
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);

  const { open, mode, type, initialValues, parentId } = modal;
  const watchedDateRange = Form.useWatch("dateRange", form);

  const statusOptions = projectStatuses
    .sort((a, b) => a.priority - b.priority)
    .map((s) => ({ label: s.nameTh, value: s.id }));

  useEffect(() => {
    if (open) {
      const userData = getUserData();
      if (userData) setUsers(userData);

      form.resetFields();
      setIsMoving(false);
      setMoveConfirmText("");
      setTargetProjectId(null);

      if (mode === "edit" && initialValues) {
        const values = { ...initialValues };
        if (values.start && values.end) {
          values.dateRange = [dayjs(values.start), dayjs(values.end)];
        }
        if (type === "sub-project") {
          values.asset_capture_type = values.assetCaptureType;
          values.estimate_time = calculateWorkingHours(
            values.start,
            values.end,
          ).text;
          values.assignees =
            values.projectAssignees?.map((a: any) => ({
              userId: a.userId,
              position: a.position,
            })) || [];
        }
        form.setFieldsValue(values);
      } else if (mode === "create") {
        form.setFieldsValue({
          status: "open",
          assetCaptureType: "CAPTUREABLE",
          asset_capture_type: "CAPTUREABLE",
          projectStatusId: statusOptions[0]?.value,
        });
      }
    }
  }, [open, mode, initialValues, form, type, statusOptions.length]);

  useEffect(() => {
    if (watchedDateRange && type === "sub-project") {
      const { text } = calculateWorkingHours(
        watchedDateRange[0],
        watchedDateRange[1],
      );
      form.setFieldValue("estimate_time", text);
    }
  }, [watchedDateRange, form, type]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (type === "sub-project" && isMoving && moveConfirmText !== "Confirm") {
        toast.error("กรุณาพิมพ์คำว่า Confirm เพื่อยืนยันการย้ายโครงการ");
        setLoading(false);
        return;
      }

      let apiUrl = "";
      let method = "POST";
      const payload: any = {
        by: currentAdminId,
      };

      if (type === "sub-project") {
        // Use sub-project API
        apiUrl = "/api/v1/timesheet/project/sub-project/insert";

        // Add id for update
        if (mode === "edit") {
          payload.id = initialValues.realId;
        }

        // Add required fields
        payload.name = values.name;
        payload.asset_capture_type = values.asset_capture_type;
        payload.projectStatusId = values.projectStatusId;

        // Optional fields
        if (values.name_en) payload.name_en = values.name_en;

        // Date range handling
        if (values.dateRange && values.dateRange.length === 2) {
          payload.startDate = values.dateRange[0].toISOString();
          payload.endDate = values.dateRange[1].toISOString();
        }

        // Backlog description handling
        if (values.backlogDescription) {
          payload.backlogDescription = values.backlogDescription;
        }

        // Move project handling (only for edit mode)
        if (mode === "edit" && isMoving && targetProjectId) {
          payload.project_id = targetProjectId;
        } else if (mode === "create" && parentId) {
          // Create mode: add project_id
          payload.project_id = parentId;
        } else if (mode === "edit" && initialValues?.projectId) {
          // Keep existing project_id for normal update
          payload.project_id = initialValues.projectId;
        }

        // Handle assignees
        if (values.assignees && values.assignees.length > 0) {
          payload.assignees = values.assignees.map((a: any) => ({
            userId: a.userId,
            position: a.position || null,
          }));
        }
      } else if (type === "project") {
        // Use timeline API for projects
        apiUrl = "/api/v1/timesheet/project/timeline";
        method = mode === "create" ? "POST" : "PATCH";
        payload.type = type;

        // Add id for update
        if (mode === "edit") {
          payload.id = initialValues.realId;
        }

        // Add required field
        payload.name = values.name;

        // Optional fields
        if (values.name_en) payload.name_en = values.name_en;
        if (values.description) payload.description = values.description;
        if (values.categoryType) payload.categoryType = values.categoryType;
        if (values.status) payload.status = values.status;

        // Date range handling
        if (values.dateRange && values.dateRange.length === 2) {
          payload.start_date = values.dateRange[0].toISOString();
          payload.end_date = values.dateRange[1].toISOString();
        }
      }

      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message_en || "Operation failed");

      message.success(
        mode === "create"
          ? t("timeline_page.modal.success_create")
          : t("timeline_page.modal.success_update"),
      );
      onSuccess();
    } catch (error: any) {
      console.error(error);
      message.error(error.message || t("timeline_page.modal.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialValues?.realId) return;
    Modal.confirm({
      title: t("timeline_page.modal.confirm_delete_title"),
      content: t("timeline_page.modal.confirm_delete_content"),
      okText: t("timeline_page.modal.delete"),
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/v1/timesheet/project/timeline", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              id: initialValues.realId,
              by: currentAdminId,
            }),
          });
          if (!res.ok) throw new Error("Delete failed");
          message.success(t("timeline_page.modal.success_delete"));
          onSuccess();
        } catch (error) {
          message.error(t("timeline_page.modal.error_generic"));
        } finally {
          setLoading(false);
        }
      },
    });
  };

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
            ) : (
              <EditOutlined style={{ color: "#fff" }} />
            )}
          </div>
          <Title level={4} style={{ margin: 0 }}>
            {mode === "create"
              ? t("timeline_page.modal.create")
              : t("timeline_page.modal.edit")}{" "}
            {type === "project"
              ? t("timeline_page.modal.project")
              : t("timeline_page.modal.sub_project")}
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
        onFinish={handleSubmit}
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
                  label={
                    type === "project"
                      ? t("timeline_page.modal.project_name")
                      : "ชื่อโครงการย่อย (ไทย)"
                  }
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อ" },
                    { min: 2, message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" },
                    { max: 200, message: "ชื่อต้องไม่เกิน 200 ตัวอักษร" },
                  ]}
                >
                  <Input
                    placeholder="ระบุชื่อ..."
                    prefix={
                      <FileTextOutlined
                        style={{ color: token.colorTextDescription }}
                      />
                    }
                    maxLength={200}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name_en"
                  label={
                    type === "project"
                      ? "ชื่อโครงการ (English)"
                      : "ชื่อโครงการย่อย (English)"
                  }
                  rules={[
                    { max: 200, message: "ชื่อต้องไม่เกิน 200 ตัวอักษร" },
                  ]}
                >
                  <Input placeholder="Enter name..." maxLength={200} />
                </Form.Item>
              </Col>

              {type === "project" && (
                <>
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label={t("timeline_page.modal.description")}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="รายละเอียดโครงการ..."
                        showCount
                        maxLength={500}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="categoryType"
                      label={t("timeline_page.modal.category")}
                    >
                      <Select options={categoryType} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="status"
                      label={t("timeline_page.modal.status")}
                    >
                      <Select>
                        <Select.Option value="open">Open</Select.Option>
                        <Select.Option value="close">Close</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </>
              )}

              {type === "sub-project" && (
                <>
                  <Col span={12}>
                    <Form.Item
                      name="asset_capture_type"
                      label="ประเภทงาน"
                      rules={[
                        { required: true, message: "กรุณาเลือกประเภทงาน" },
                      ]}
                    >
                      <Select
                        options={ASSET_OPTIONS}
                        placeholder="เลือกประเภทงาน"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="projectStatusId"
                      label="สถานะการดำเนินงาน"
                      rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                    >
                      <Select
                        options={statusOptions}
                        placeholder="เลือกสถานะการดำเนินงาน"
                      />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Col>

          {/* Timeline */}
          <Col span={24}>
            {renderSectionHeader("ระยะเวลาดำเนินงาน", <CalendarOutlined />)}
            <Row gutter={24}>
              <Col span={type === "sub-project" ? 16 : 24}>
                <Form.Item
                  name="dateRange"
                  label="วันที่เริ่ม - วันที่สิ้นสุด"
                  rules={[
                    {
                      required: type === "sub-project",
                      message: "กรุณาเลือกช่วงเวลา",
                    },
                    {
                      validator: async (_, value) => {
                        if (value && value.length === 2) {
                          if (value[1].isBefore(value[0])) {
                            return Promise.reject(
                              new Error(
                                "วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น",
                              ),
                            );
                          }
                        }
                        return Promise.resolve();
                      },
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
              {type === "sub-project" && (
                <Col span={8}>
                  <Form.Item name="estimate_time" label="ประมาณการชั่วโมง">
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
              )}
            </Row>
          </Col>

          {/* Team (Sub-project only) */}
          {type === "sub-project" && (
            <Col span={24}>
              {renderSectionHeader("ทีมงานผู้รับผิดชอบ", <TeamOutlined />)}
              <Card
                bordered={false}
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
                                filterOption={(input, option) => {
                                  const label = (
                                    option?.label ?? ""
                                  ).toLowerCase();
                                  const searchStr = input.toLowerCase();
                                  return label.includes(searchStr);
                                }}
                                onChange={(userId) => {
                                  const user = users.find(
                                    (u) => u.admin_id === userId,
                                  );
                                  if (user?.position) {
                                    const currentAssignees =
                                      form.getFieldValue("assignees");
                                    currentAssignees[name].position =
                                      user.position;
                                    form.setFieldsValue({
                                      assignees: currentAssignees,
                                    });
                                  }
                                }}
                                options={users.map((u) => ({
                                  label: `${u.firstname} ${u.lastname}${
                                    u.nickname ? ` (${u.nickname})` : ""
                                  }`,
                                  value: u.admin_id,
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
          )}

          {/* Link & Note (Sub-project only) */}
          {type === "sub-project" && (
            <Col span={24}>
              {renderSectionHeader(
                "รายละเอียดเพิ่มเติม",
                <InfoCircleOutlined />,
              )}
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    name={["backlogDescription", "note"]}
                    label="หมายเหตุ"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="บันทึกข้อมูลเพิ่มเติม..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Text strong style={{ marginBottom: 12, display: "block" }}>
                    เอกสารอ้างอิง / ลิงก์ที่เกี่ยวข้อง
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
                                    message: "กรุณากรอกชื่อลิงก์",
                                  },
                                ]}
                                noStyle
                              >
                                <Input placeholder="ชื่อลิงก์" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "link"]}
                                rules={[
                                  {
                                    required: true,
                                    message: "กรุณากรอก URL",
                                  },
                                ]}
                                noStyle
                              >
                                <Input
                                  placeholder="https://..."
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
                          เพิ่มลิงก์
                        </Button>
                      </Card>
                    )}
                  </Form.List>
                </Col>
              </Row>
            </Col>
          )}

          {/* Move Project Zone (Sub-project edit only) */}
          {mode === "edit" && type === "sub-project" && (
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
                            .filter(
                              (p: any) => p.realId !== initialValues?.projectId,
                            )
                            .map((p: any) => ({
                              label: p.name,
                              value: p.realId,
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
            justifyContent: mode === "edit" ? "space-between" : "flex-end",
            gap: 12,
            zIndex: 10,
          }}
        >
          {mode === "edit" && (
            <Button
              danger
              onClick={handleDelete}
              icon={<DeleteOutlined />}
              size="large"
            >
              {t("timeline_page.modal.delete")}
            </Button>
          )}
          <Space>
            <Button onClick={onCancel} size="large">
              {t("timeline_page.modal.cancel")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
              size="large"
            >
              {t("timeline_page.modal.save")}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};
