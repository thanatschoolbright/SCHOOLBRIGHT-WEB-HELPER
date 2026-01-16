import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Button,
  Space,
  Typography,
  Card,
  Tag,
  AutoComplete,
  Flex,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserOutlined,
  MinusCircleOutlined,
  SwapOutlined,
  InteractionOutlined,
  RocketOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type {
  SubProject,
  SubProjectFormValues,
} from "../types/sub-project.types";
import { calculateWorkingHours } from "../utils/date-helpers";
import { ASSET_OPTIONS } from "../utils/constants";
import { getUserData } from "@helpers/local_storage/user.storage";

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface SubProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  data: SubProject | null;
  loading: boolean;
  onSubmit: (values: SubProjectFormValues) => Promise<boolean>;
  onCancel: () => void;
  statuses?: any[];
  allProjects?: any[];
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
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const watchedDateRange = Form.useWatch("dateRange", form);
  const [users, setUsers] = useState<any[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [moveConfirmText, setMoveConfirmText] = useState("");
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);

  const statusOptions = statuses
    .sort((a, b) => a.priority - b.priority)
    .map((s) => ({ label: s.nameTh, value: s.id }));

  useEffect(() => {
    if (open) {
      const userData = getUserData();
      if (userData) setUsers(userData);

      if (mode === "create") {
        form.resetFields();
        form.setFieldsValue({
          asset_capture_type: "CAPTUREABLE",
          projectStatusId: statusOptions[0]?.value,
        });
      } else if (mode === "edit" && data) {
        const range =
          data.startDate && data.endDate
            ? [dayjs(data.startDate), dayjs(data.endDate)]
            : [];

        form.setFieldsValue({
          name: data.name,
          name_en: data.name_en,
          asset_capture_type: data.assetCaptureType,
          projectStatusId: data.projectStatusId,
          dateRange: range,
          estimate_time: calculateWorkingHours(
            data.startDate || "",
            data.endDate || ""
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
  }, [open, mode, data, form, statusOptions.length]);

  useEffect(() => {
    if (!open) {
      setIsMoving(false);
      setMoveConfirmText("");
      setTargetProjectId(null);
    }
  }, [open]);

  useEffect(() => {
    if (watchedDateRange) {
      const { text } = calculateWorkingHours(
        watchedDateRange[0],
        watchedDateRange[1]
      );
      form.setFieldValue("estimate_time", text);
    }
  }, [watchedDateRange, form]);

  const handleFinish = async (values: SubProjectFormValues) => {
    const payload = {
      id: data?.id,
      name: values.name,
      name_en: values.name_en,
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

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Space>
          {mode === "create" ? <PlusOutlined /> : <EditOutlined />}
          <Text strong>
            {mode === "create"
              ? t("sub_project_page.modal_create_title")
              : t("sub_project_page.modal_edit_title")}
          </Text>
        </Space>
      }
      width={800}
      footer={null}
      destroyOnClose
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="pt-4"
        size="large"
      >
        <Row gutter={16}>
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
                prefix={<FileTextOutlined />}
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
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="projectStatusId"
              label="สถานะการดำเนินงาน"
              rules={[{ required: true }]}
            >
              <Select options={statusOptions} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="asset_capture_type"
              label={t("sub_project_page.form_asset_type")}
              rules={[{ required: true }]}
            >
              <Select options={ASSET_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="estimate_time"
              label={t("sub_project_page.form_estimate_time")}
            >
              <Input readOnly prefix={<ClockCircleOutlined />} />
            </Form.Item>
          </Col>
        </Row>

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
          <RangePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <Divider orientation="left" plain>
          <Space>
            <TeamOutlined /> ทีมงานผู้รับผิดชอบ
          </Space>
        </Divider>

        <Form.List name="assignees">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={12} align="middle" className="mb-2">
                  <Col span={11}>
                    <Form.Item
                      {...restField}
                      name={[name, "userId"]}
                      rules={[
                        { required: true, message: "ระบุผู้รับผิดชอบ" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const assignees = getFieldValue("assignees") || [];
                            const duplicates = assignees.filter(
                              (a: any) =>
                                a?.userId === value && value !== undefined
                            );
                            if (duplicates.length > 1) {
                              return Promise.reject(
                                new Error("ชื่อผู้ใช้ซ้ำกัน!")
                              );
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                      className="mb-0"
                    >
                      <Select
                        placeholder="เลือกผู้รับผิดชอบ (ค้นหาชื่อ/ชื่อเล่น)"
                        showSearch
                        filterOption={(input, option) => {
                          const label = (option?.label ?? "").toLowerCase();
                          const searchStr = input.toLowerCase();
                          return label.includes(searchStr);
                        }}
                        onChange={(userId) => {
                          const user = users.find((u) => u.admin_id === userId);
                          if (user?.position) {
                            const currentAssignees =
                              form.getFieldValue("assignees");
                            currentAssignees[name].position = user.position;
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
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  เพิ่มผู้รับผิดชอบ
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider orientation="left" plain>
          {t("sub_project_page.form_additional_details")}
        </Divider>

        <Form.Item
          name={["backlogDescription", "note"]}
          label={t("sub_project_page.form_note")}
        >
          <Input.TextArea
            rows={3}
            placeholder={t("sub_project_page.form_note_placeholder")}
          />
        </Form.Item>

        <Form.List name={["backlogDescription", "backlogs"]}>
          {(fields, { add, remove }) => (
            <Card style={{ borderStyle: "dashed" }} size="small">
              <div className="flex justify-between mb-3">
                <Text strong>
                  <LinkOutlined /> {t("sub_project_page.form_attachments")}
                </Text>
                <Button
                  type="dashed"
                  size="small"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  {t("sub_project_page.form_add_link")}
                </Button>
              </div>
              {fields.map((field) => (
                <Row key={field.key} gutter={8} className="mb-2">
                  <Col span={10}>
                    <Form.Item
                      {...field}
                      name={[field.name, "title"]}
                      rules={[
                        {
                          required: true,
                          message: t(
                            "sub_project_page.form_link_title_required"
                          ),
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder={t(
                          "sub_project_page.form_link_title_placeholder"
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "link"]}
                      rules={[
                        {
                          required: true,
                          message: t("sub_project_page.form_link_url_required"),
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder={t(
                          "sub_project_page.form_link_url_placeholder"
                        )}
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
              {!fields.length && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <Text type="secondary">
                    {t("sub_project_page.form_no_attachments")}
                  </Text>
                </div>
              )}
            </Card>
          )}
        </Form.List>

        {mode === "edit" && (
          <div className="mt-8 p-6 bg-orange-50 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <RocketOutlined style={{ fontSize: "80px" }} />
            </div>

            <Flex align="center" justify="space-between">
              <Space direction="vertical" size={2}>
                <Text
                  strong
                  className="text-orange-800 text-lg flex align-center gap-2"
                >
                  <InteractionOutlined /> พื้นที่อันตราย: การย้ายโครงการหลัก
                </Text>
                <Text className="text-orange-600/80">
                  ย้ายโครงการย่อยนี้ไปยังโครงการหลักอื่น
                  ประวัติและข้อมูลจะถูกย้ายตามไปด้วย
                </Text>
              </Space>
              <Button
                danger
                type={isMoving ? "default" : "primary"}
                onClick={() => setIsMoving(!isMoving)}
                className={`rounded-lg transition-all duration-300 ${
                  !isMoving ? "hover:scale-105 shadow-md shadow-orange-200" : ""
                }`}
                icon={isMoving ? <CloseOutlined /> : <SwapOutlined />}
              >
                {isMoving ? "ยกเลิกการย้าย" : "ย้ายโครงการ"}
              </Button>
            </Flex>

            {isMoving && (
              <div className="mt-6 p-6 bg-white rounded-xl border border-orange-200 shadow-inner animate-in slide-in-from-top-4 duration-300">
                <Row gutter={24} align="bottom">
                  <Col span={24} className="mb-4">
                    <Form.Item
                      label={
                        <Text strong className="text-gray-700">
                          เลือกโครงการปลายทาง
                        </Text>
                      }
                    >
                      <Select
                        showSearch
                        className="w-full rounded-lg h-11"
                        placeholder="ค้นหาโครงการที่ต้องการย้ายไป..."
                        optionFilterProp="children"
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
                      label={
                        <Text strong className="text-gray-700">
                          ยืนยันการเพิ่มพื้นที่อันตราย
                        </Text>
                      }
                      extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          พิมพ์คำว่า{" "}
                          <Text strong className="text-orange-600 italic">
                            Confirm
                          </Text>{" "}
                          เพื่อปลดล็อคการยืนยัน
                        </Text>
                      }
                    >
                      <Input
                        placeholder='พิมพ์คำว่า "Confirm" เพื่อยืนยัน'
                        value={moveConfirmText}
                        onChange={(e) => setMoveConfirmText(e.target.value)}
                        className="rounded-lg h-11 border-orange-200 focus:border-red-500 focus:ring-red-200"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel}>
            {t("sub_project_page.form_cancel")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<CheckCircleOutlined />}
          >
            {t("sub_project_page.form_save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
