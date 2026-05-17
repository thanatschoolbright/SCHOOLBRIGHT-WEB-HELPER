"use client";

import { BYPASS_USER_ID } from "@/constants/overtime-status";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  theme,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const OT_TEMPLATE_STORAGE_KEY = "sb_ot_form_templates";

interface OtTemplate {
  id: string;
  name: string;
  overtime_type: string;
  descriptions: Array<{
    description: string;
    duration: number;
    /** เก็บเฉพาะ offset ชั่วโมงจากเที่ยงคืน (HH:mm) สำหรับ startDate/endDate */
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>;
}

/** โหลด templates จาก localStorage */
const loadTemplates = (): OtTemplate[] => {
  try {
    const raw = localStorage.getItem(OT_TEMPLATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** บันทึก templates ลง localStorage */
const saveTemplates = (templates: OtTemplate[]) => {
  localStorage.setItem(OT_TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
};

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  userOptions: any[];
  requestCreateOvertimeSubmission: (values: any) => Promise<boolean>;
  loading: boolean;
  form: any;
  currentUserId: string;
}

/**
 * คอมโพเนนต์ย่อยสำหรับแสดง Card รายละเอียดงานแต่ละรายการ
 */
const TaskDescriptionCard = ({ fieldProps, remove, token }: any) => {
  const form = Form.useFormInstance();

  const validateEndDate = (_: any, value: any) => {
    const startDate = form.getFieldValue([
      "descriptions",
      fieldProps.name,
      "startDate",
    ]);
    if (!value || !startDate) return Promise.resolve();
    const diffMinutes = dayjs(value).diff(dayjs(startDate), "minute");
    // ต้องมากกว่าเวลาเริ่มต้น และห่างกันไม่เกิน 24 ชั่วโมง
    if (diffMinutes <= 0) {
      return Promise.reject(
        "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น (หากข้ามเที่ยงคืน โปรดเลือกวันที่ถัดไป)",
      );
    }
    if (diffMinutes > 24 * 60) {
      return Promise.reject("ระยะเวลาทำงานต้องไม่เกิน 24 ชั่วโมงต่อรายการ");
    }
    return Promise.resolve();
  };

  return (
    <Card
      size="small"
      variant="borderless"
      style={{
        borderRadius: 16,
        background: token.colorFillQuaternary,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center">
          <Typography.Text strong style={{ fontSize: 13 }}>
            รายการที่ {fieldProps.name + 1}
          </Typography.Text>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(fieldProps.name)}
            style={{ borderRadius: 8 }}
          >
            ลบรายการ
          </Button>
        </Flex>

        <Form.Item
          {...fieldProps}
          name={[fieldProps.name, "description"]}
          rules={[{ required: true, message: "โปรดระบุรายละเอียด" }]}
          label={<Typography.Text strong>รายละเอียดเนื้องาน</Typography.Text>}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            rows={3}
            placeholder="เช่น ตรวจสอบระบบหลังบ้าน, แก้ไข Bug หน้าลงทะเบียน..."
            style={{ borderRadius: 12, padding: 12 }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              {...fieldProps}
              name={[fieldProps.name, "startDate"]}
              label={<Typography.Text strong>เวลาเริ่มต้น</Typography.Text>}
              rules={[{ required: true, message: "โปรดระบุ" }]}
              style={{ marginBottom: 0 }}
              normalize={(val) =>
                val && !dayjs.isDayjs(val) ? dayjs(val) : val
              }
            >
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%", height: 40, borderRadius: 10 }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              {...fieldProps}
              name={[fieldProps.name, "endDate"]}
              label={<Typography.Text strong>เวลาสิ้นสุด</Typography.Text>}
              rules={[
                { required: true, message: "โปรดระบุ" },
                { validator: validateEndDate },
              ]}
              style={{ marginBottom: 0 }}
              normalize={(val) =>
                val && !dayjs.isDayjs(val) ? dayjs(val) : val
              }
            >
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%", height: 40, borderRadius: 10 }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              {...fieldProps}
              name={[fieldProps.name, "duration"]}
              label={
                <Typography.Text strong>จำนวนชั่วโมง (ชม.)</Typography.Text>
              }
              style={{ marginBottom: 0 }}
            >
              <Input
                type="number"
                step="0.01"
                suffix="ชม."
                disabled
                style={{ height: 40, borderRadius: 10 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Flex>
    </Card>
  );
};

/**
 * คอมโพเนนต์ย่อยสำหรับฟิลด์อัปโหลดรูปภาพ
 */
const UploadFieldItem = ({ name, label, required, form }: any) => {
  const [fileList, setFileList] = useState<any[]>([]);

  const handleChange = ({ fileList: newFileList }: any) => {
    // จำกัดให้เหลือรูปเดียว
    const latestFile = newFileList.slice(-1);
    setFileList(latestFile);
    // เก็บ UploadFile wrapper (plain object) แทน raw File เพื่อป้องกัน circular reference warning ของ AntD Form
    form.setFieldValue(name, latestFile[0] ?? null);
  };

  return (
    <Form.Item
      name={name}
      label={<Typography.Text strong>{label}</Typography.Text>}
      rules={[{ required, message: "โปรดอัปโหลดไฟล์หลักฐาน" }]}
      style={{ marginBottom: 12 }}
    >
      <Upload
        listType="picture"
        maxCount={1}
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={() => false} // ป้องกันการอัปโหลดอัตโนมัติ
        style={{ width: "100%" }}
      >
        <Button
          icon={<UploadOutlined />}
          style={{
            height: 48,
            width: "100%",
            borderRadius: 12,
            borderStyle: "dashed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {fileList.length > 0 ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพจากเครื่อง"}
        </Button>
      </Upload>
    </Form.Item>
  );
};

// ประเภทของตัวเลือกลายเซ็น
type SignatureMode = "default" | "upload";

/**
 * คอมโพเนนต์อัปโหลดลายเซ็นแบบเฉพาะทาง (แสดง preview เมื่อเลือกไฟล์แล้ว)
 */
const SignatureUploadField = ({ form }: { form: any }) => {
  const [fileList, setFileList] = useState<any[]>([]);

  const handleChange = ({ fileList: newList }: any) => {
    const latest = newList.slice(-1);
    setFileList(latest);
    // เก็บ UploadFile ตัวเดียว (ไม่ใช่ array) เพื่อให้สอดคล้องกับ proof_* fields
    form.setFieldValue("signature_file", latest[0] ?? null);
  };

  return (
    <Upload
      listType="picture"
      maxCount={1}
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={() => false}
      accept="image/*"
      style={{ width: "100%" }}
    >
      <Button
        icon={<UploadOutlined />}
        style={{
          height: 48,
          width: "100%",
          borderRadius: 12,
          borderStyle: "dashed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {fileList.length > 0
          ? "เปลี่ยนรูปลายเซ็น"
          : "เลือกรูปลายเซ็นจากเครื่อง"}
      </Button>
    </Upload>
  );
};

/**
 * หน้าต่างสำหรับเพิ่มรายการคำขอ OT ใหม่
 */
const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  userOptions,
  requestCreateOvertimeSubmission,
  loading,
  form,
  currentUserId,
}) => {
  const { token } = theme.useToken();
  const [requesterName, setRequesterName] = useState<string>("กำลังโหลด...");

  // สถานะลายเซ็น default ของผู้ใช้
  const [defaultSignatureUrl, setDefaultSignatureUrl] = useState<string | null>(
    null,
  );
  const [signatureLoading, setSignatureLoading] = useState<boolean>(false);
  const [signatureMode, setSignatureModeState] =
    useState<SignatureMode>("default");

  // Template state
  const [templates, setTemplates] = useState<OtTemplate[]>([]);
  const [templateName, setTemplateName] = useState<string>("");

  // โหลด templates จาก localStorage เมื่อ modal เปิด
  useEffect(() => {
    if (visible) setTemplates(loadTemplates());
  }, [visible]);

  // ดึงลายเซ็น default ของผู้ใช้เมื่อ modal เปิดหรือ currentUserId เปลี่ยน
  useEffect(() => {
    const fetchDefaultSignature = async () => {
      if (!visible || !currentUserId) return;
      setSignatureLoading(true);
      try {
        const response = await callApiService.get(
          `/api/v2/admin/user-management/signature/read?user_id=${currentUserId}`,
        );
        const url = response?.data?.data?.signature_url ?? null;
        setDefaultSignatureUrl(url);
        // ถ้ามีลายเซ็น default → ตั้งค่าเริ่มต้นเป็น "default"
        setSignatureModeState(url ? "default" : "upload");
        // เคลียร์ form field signature_file เมื่อเปลี่ยน mode
        form.setFieldValue("signature_file", undefined);
      } catch {
        setDefaultSignatureUrl(null);
        setSignatureModeState("upload");
      } finally {
        setSignatureLoading(false);
      }
    };

    void fetchDefaultSignature();
  }, [visible, currentUserId]);

  /** บันทึก template จาก form ปัจจุบัน */
  const handleSaveTemplate = () => {
    const name = templateName.trim();
    if (!name) {
      toast.warning("โปรดระบุชื่อ Template");
      return;
    }
    const descriptions = form.getFieldValue("descriptions") || [];
    const overtime_type = form.getFieldValue("overtime_type") || "weekday";

    const templateDescriptions = descriptions.map((d: any) => ({
      description: d.description || "",
      duration: Number(d.duration || 0),
      startHour: d.startDate ? dayjs(d.startDate).hour() : 18,
      startMinute: d.startDate ? dayjs(d.startDate).minute() : 0,
      endHour: d.endDate ? dayjs(d.endDate).hour() : 19,
      endMinute: d.endDate ? dayjs(d.endDate).minute() : 0,
    }));

    const newTemplate: OtTemplate = {
      id: Date.now().toString(),
      name,
      overtime_type,
      descriptions: templateDescriptions,
    };

    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setTemplateName("");
    toast.success(`บันทึก Template "${name}" แล้ว`);
  };

  /** Apply template ลง form */
  const handleApplyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const today = dayjs();
    const descriptions = tpl.descriptions.map((d) => ({
      description: d.description,
      duration: d.duration,
      startDate: today.hour(d.startHour).minute(d.startMinute).second(0),
      endDate: today.hour(d.endHour).minute(d.endMinute).second(0),
    }));

    form.setFieldsValue({ overtime_type: tpl.overtime_type, descriptions });
    toast.success(`Apply Template "${tpl.name}" แล้ว`);
  };

  /** ลบ template */
  const handleDeleteTemplate = (templateId: string) => {
    const updated = templates.filter((t) => t.id !== templateId);
    saveTemplates(updated);
    setTemplates(updated);
    toast.success("ลบ Template แล้ว");
  };

  // ดึงชื่อผู้ขอทำงานล่วงเวลา
  useEffect(() => {
    const fetchRequesterName = async () => {
      if (!currentUserId || !visible) return;
      try {
        const response = await callApiService.get(
          `/api/v2/admin/user-management/detail/${currentUserId}`,
        );
        if (response?.data?.status === 200 && response.data.data) {
          const user = response.data.data;
          setRequesterName(
            `${user.firstname_th || ""} ${user.lastname_th || ""}`.trim() ||
              "-",
          );
        } else {
          setRequesterName("-");
        }
      } catch (error) {
        console.error("Failed to fetch requester name:", error);
        setRequesterName("-");
      }
    };

    fetchRequesterName();
  }, [currentUserId, visible]);

  // ประมวลผลการคำนวณชั่วโมงทำงานอัตโนมัติ
  const calculateAutoDuration = (changedValues: any, allValues: any) => {
    if (!changedValues.descriptions) return;

    const updatedDescriptions = [...(allValues.descriptions || [])];
    let isChanged = false;

    Object.entries(changedValues.descriptions).forEach(
      ([indexStr, value]: [string, any]) => {
        const idx = parseInt(indexStr, 10);
        if (value && (value.startDate || value.endDate)) {
          const start = updatedDescriptions[idx].startDate;
          const end = updatedDescriptions[idx].endDate;

          if (start && end) {
            const diffMs = new Date(end).getTime() - new Date(start).getTime();
            const diffHours = diffMs / 1000 / 60 / 60;
            const duration =
              diffHours > 0 ? Math.round(diffHours * 100) / 100 : 0;

            if (updatedDescriptions[idx].duration !== duration) {
              updatedDescriptions[idx].duration = duration;
              isChanged = true;
            }
          }
        }
      },
    );

    if (isChanged) form.setFieldsValue({ descriptions: updatedDescriptions });
  };

  const handleSubmission = async (formValues: any) => {
    // แนบข้อมูลลายเซ็นตามที่ผู้ใช้เลือก
    const enrichedValues = {
      ...formValues,
      signature_mode: signatureMode,
      // กรณีใช้ลายเซ็น default → แนบ URL เข้าไปด้วย
      signature_default_url:
        signatureMode === "default" ? defaultSignatureUrl : null,
    };
    const success = await requestCreateOvertimeSubmission(enrichedValues);
    if (success) onClose();
  };

  return (
    <Modal
      title={
        <Flex
          align="center"
          gap={12}
          style={{
            background: `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorInfo})`,
            padding: "24px",
            margin: "-20px -24px 0",
            borderRadius: "20px 20px 0 0",
          }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              background: "rgba(255,255,255,0.2)",
              width: 40,
              height: 40,
              borderRadius: 12,
            }}
          >
            <PlusOutlined style={{ color: "#fff", fontSize: 20 }} />
          </Flex>
          <Flex vertical>
            <Typography.Text
              strong
              style={{ color: "#fff", fontSize: 18, lineHeight: 1.2 }}
            >
              เพิ่มรายการคำขอ OT ใหม่
            </Typography.Text>
            <Typography.Text
              style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}
            >
              กรุณาระบุข้อมูลการทำงานให้ครบถ้วนเพื่อการพิจารณา
            </Typography.Text>
          </Flex>
        </Flex>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmission}
        style={{ paddingTop: 32 }}
        onValuesChange={calculateAutoDuration}
      >
        {/* === Template Section === */}
        <Card
          size="small"
          style={{
            borderRadius: 16,
            marginBottom: 24,
            background: token.colorFillQuaternary,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          styles={{ body: { padding: "14px 20px" } }}
        >
          <Flex align="center" gap={12} wrap="wrap">
            <Flex align="center" gap={6}>
              <ThunderboltOutlined
                style={{ color: token.colorWarning, fontSize: 16 }}
              />
              <Typography.Text strong style={{ fontSize: 13 }}>
                เทมเพลต OT
              </Typography.Text>
            </Flex>

            {/* Dropdown เลือก Template */}
            {templates.length > 0 && (
              <Select
                placeholder="เลือก Template ที่บันทึกไว้..."
                style={{ minWidth: 220, flex: 1 }}
                onChange={handleApplyTemplate}
                value={null}
                options={templates.map((t) => ({
                  label: (
                    <Flex justify="space-between" align="center">
                      <Typography.Text style={{ fontSize: 13 }}>
                        {t.name}
                      </Typography.Text>
                      <Popconfirm
                        title="ลบ Template นี้?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDeleteTemplate(t.id);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="ลบ Template">
                          <DeleteOutlined
                            style={{
                              color: token.colorError,
                              fontSize: 12,
                              marginLeft: 8,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </Flex>
                  ),
                  value: t.id,
                }))}
              />
            )}

            {templates.length === 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                ยังไม่มี Template — กรอกข้อมูลแล้วบันทึกเป็น Template ด้านล่าง
              </Typography.Text>
            )}

            {/* บันทึก Template ใหม่ */}
            <Flex align="center" gap={8} style={{ marginLeft: "auto" }}>
              <Input
                placeholder="ชื่อ Template..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{ width: 160, borderRadius: 8 }}
                size="small"
                onPressEnter={handleSaveTemplate}
              />
              <Button
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSaveTemplate}
                style={{ borderRadius: 8 }}
              >
                บันทึก Template
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Typography.Text strong>ชื่อผู้ขอทำงานล่วงเวลา</Typography.Text>
              }
              style={{ marginBottom: 24 }}
            >
              <Input
                value={requesterName}
                disabled
                style={{
                  height: 48,
                  borderRadius: 12,
                  marginBottom: 4,
                  backgroundColor: "#f5f5f5",
                  color: "#000",
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="request_date"
              label={<Typography.Text strong>วันที่ปฏิบัติงาน</Typography.Text>}
              initialValue={dayjs()}
              rules={[{ required: true, message: "โปรดระบุวันที่" }]}
              style={{ marginBottom: 24 }}
              normalize={(val) =>
                val && !dayjs.isDayjs(val) ? dayjs(val) : val
              }
            >
              <DatePicker
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  marginBottom: 4,
                }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="assignee"
              label={<Typography.Text strong>ผู้มอบหมายงาน</Typography.Text>}
              initialValue={BYPASS_USER_ID}
              rules={[{ required: true, message: "โปรดเลือกผู้มอบหมายงาน" }]}
              style={{ marginBottom: 24 }}
            >
              <Select
                options={userOptions}
                disabled
                showSearch
                placeholder="ระบุชื่อผู้มอบหมายงาน..."
                optionFilterProp="label"
                loading={loading}
                style={{ height: 48, marginBottom: 4 }}
                styles={{ popup: { root: { borderRadius: 12 } } }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="overtime_type"
              label={
                <Typography.Text strong>ประเภทการทำงาน (OT)</Typography.Text>
              }
              rules={[{ required: true, message: "โปรดเลือกประเภท OT" }]}
              initialValue="weekday"
              style={{ marginBottom: 24 }}
            >
              <Select
                options={[
                  { label: "OT วันทำงานปกติ (Weekday OT)", value: "weekday" },
                  { label: "OT วันหยุด (Holiday OT)", value: "holiday" },
                ]}
                style={{ height: 48, marginBottom: 4 }}
                styles={{ popup: { root: { borderRadius: 12 } } }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginBlock: 32 }}>
          <Space>
            <FileTextOutlined />{" "}
            <Typography.Text strong>
              รายละเอียดงานที่ได้รับมอบหมาย
            </Typography.Text>
          </Space>
        </Divider>

        <Form.List
          name="descriptions"
          initialValue={[
            {
              description: "",
              duration: "1.00",
              startDate: dayjs().hour(18).minute(0).second(0),
              endDate: dayjs().hour(19).minute(0).second(0),
            },
          ]}
        >
          {(fields, { add, remove }) => {
            const descriptions = form.getFieldValue("descriptions") || [];
            const totalHours = descriptions.reduce(
              (sumValue: number, currentItem: any) =>
                sumValue + Number(currentItem?.duration || 0),
              0,
            );

            return (
              <Flex vertical gap={20}>
                {fields.map(({ key, ...fieldProps }) => (
                  <TaskDescriptionCard
                    key={key}
                    fieldProps={fieldProps}
                    remove={remove}
                    token={token}
                  />
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      description: "",
                      duration: "1.00",
                      startDate: dayjs().hour(18).minute(0).second(0),
                      endDate: dayjs().hour(19).minute(0).second(0),
                    })
                  }
                  icon={<PlusOutlined />}
                  block
                  style={{
                    height: 48,
                    borderRadius: 12,
                    borderStyle: "dashed",
                    borderWidth: 2,
                  }}
                >
                  เพิ่มรายการ
                </Button>

                <Flex
                  justify="flex-end"
                  align="center"
                  gap={12}
                  style={{
                    padding: "16px 20px",
                    background: token.colorInfoBg,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                >
                  <Typography.Text strong type="secondary">
                    รวมชั่วโมง OT ทั้งหมดในคำขอนี้:
                  </Typography.Text>
                  <Tag
                    color="blue"
                    style={{
                      fontSize: 16,
                      paddingInline: 16,
                      paddingBlock: 4,
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  >
                    {totalHours.toFixed(2)} ชั่วโมง
                  </Tag>
                </Flex>
              </Flex>
            );
          }}
        </Form.List>

        <div style={{ marginTop: 24 }}>
          <Divider orientation="left" style={{ marginBlock: 16 }}>
            <Space>
              <CameraOutlined style={{ color: token.colorWarning }} />
              <Typography.Text strong>หลักฐานการทำงาน</Typography.Text>
            </Space>
          </Divider>
          <Card
            size="small"
            style={{
              borderRadius: 16,
              background: token.colorFillAlter,
            }}
          >
            <Row gutter={[16, 24]}>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_checkin"
                  label="1. หลักฐานการเข้าทำงาน (Line Group)"
                  required
                  form={form}
                />
              </Col>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_checkout"
                  label="2. หลักฐานการออกทำงาน (Line Group)"
                  required
                  form={form}
                />
              </Col>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_work_1"
                  label="3. หลักฐานการทำงานจริง #1"
                  required
                  form={form}
                />
              </Col>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_work_2"
                  label="4. หลักฐานการทำงานจริง #2"
                  required
                  form={form}
                />
              </Col>
            </Row>
          </Card>
        </div>

        <div style={{ marginTop: 16 }}>
          <Divider orientation="left" style={{ marginBlock: 16 }}>
            <Space>
              <EditOutlined style={{ color: token.colorSuccess }} />
              <Typography.Text strong>ลายเซ็นผู้ปฏิบัติงาน</Typography.Text>
            </Space>
          </Divider>
          <Card
            size="small"
            style={{ borderRadius: 16, background: token.colorFillAlter }}
            styles={{ body: { padding: 20 } }}
          >
            <Flex vertical gap={16}>
              {signatureLoading ? (
                <Flex justify="center" align="center" style={{ minHeight: 80 }}>
                  <Spin spinning tip="กำลังโหลดลายเซ็น...">
                    <div style={{ minHeight: 40, minWidth: 220 }} />
                  </Spin>
                </Flex>
              ) : defaultSignatureUrl ? (
                <>
                  {/* มีลายเซ็น default ในระบบ — ให้เลือกว่าจะใช้ default หรืออัปโหลดใหม่ */}
                  <Radio.Group
                    value={signatureMode}
                    onChange={(e) => {
                      setSignatureModeState(e.target.value as SignatureMode);
                      form.setFieldValue("signature_file", undefined);
                    }}
                  >
                    <Flex vertical gap={12}>
                      <Radio value="default">
                        <Flex align="center" gap={8}>
                          <CheckCircleOutlined
                            style={{ color: token.colorSuccess }}
                          />
                          <Typography.Text strong>
                            ใช้ลายเซ็นของฉันในระบบ
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            (บันทึกไว้ที่โปรไฟล์ส่วนตัว)
                          </Typography.Text>
                        </Flex>
                      </Radio>
                      <Radio value="upload">
                        <Flex align="center" gap={8}>
                          <UploadOutlined />
                          <Typography.Text strong>
                            อัปโหลดลายเซ็นใหม่
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            (เก็บเป็น Log สำหรับคำขอนี้เท่านั้น)
                          </Typography.Text>
                        </Flex>
                      </Radio>
                    </Flex>
                  </Radio.Group>

                  {signatureMode === "default" && (
                    <Card
                      size="small"
                      style={{
                        borderRadius: 12,
                        border: `1px solid ${token.colorSuccessBorder}`,
                        background: token.colorSuccessBg,
                      }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <Flex align="center" gap={16}>
                        <Image
                          src={defaultSignatureUrl ?? ""}
                          alt="ลายเซ็นในระบบ"
                          height={80}
                          style={{
                            objectFit: "contain",
                            borderRadius: 8,
                            background: "#fff",
                          }}
                          preview={{ mask: "ดูลายเซ็น" }}
                        />
                        <Flex vertical gap={4}>
                          <Flex align="center" gap={6}>
                            <CheckCircleOutlined
                              style={{
                                color: token.colorSuccess,
                                fontSize: 16,
                              }}
                            />
                            <Typography.Text
                              strong
                              style={{ color: token.colorSuccess }}
                            >
                              ลายเซ็นพร้อมใช้งาน
                            </Typography.Text>
                          </Flex>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            ระบบจะใช้ลายเซ็นนี้แนบในเอกสารคำขอ OT อัตโนมัติ
                          </Typography.Text>
                        </Flex>
                      </Flex>
                    </Card>
                  )}

                  {signatureMode === "upload" && (
                    <Form.Item
                      name="signature_file"
                      label={
                        <Typography.Text strong>
                          อัปโหลดรูปภาพลายเซ็น (สำหรับคำขอนี้เท่านั้น)
                        </Typography.Text>
                      }
                      rules={[
                        { required: true, message: "โปรดอัปโหลดลายเซ็น" },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <SignatureUploadField form={form} />
                    </Form.Item>
                  )}
                </>
              ) : (
                <>
                  {/* ไม่มีลายเซ็น default — แนะนำให้ไปอัปโหลดที่โปรไฟล์ */}
                  <Alert
                    type="warning"
                    icon={<ExclamationCircleOutlined />}
                    showIcon
                    message={
                      <Typography.Text strong>
                        ยังไม่มีลายเซ็นในระบบ
                      </Typography.Text>
                    }
                    description={
                      <Flex vertical gap={8} style={{ marginTop: 4 }}>
                        <Typography.Text style={{ fontSize: 13 }}>
                          แนะนำให้อัปโหลดลายเซ็นไว้ที่โปรไฟล์ส่วนตัวก่อน
                          เพื่อไม่ต้องอัปโหลดซ้ำทุกครั้งที่ยื่นคำขอ OT
                        </Typography.Text>
                        <Button
                          type="link"
                          icon={<UserOutlined />}
                          href="/profile/personal-information"
                          target="_blank"
                          style={{ padding: 0, height: "auto", fontSize: 13 }}
                        >
                          ไปอัปโหลดลายเซ็นที่โปรไฟล์ส่วนตัว
                        </Button>
                      </Flex>
                    }
                    style={{ borderRadius: 12 }}
                  />
                  <Form.Item
                    name="signature_file"
                    label={
                      <Typography.Text strong>
                        อัปโหลดรูปภาพลายเซ็นรับรอง (สำหรับคำขอนี้)
                      </Typography.Text>
                    }
                    rules={[{ required: true, message: "โปรดอัปโหลดลายเซ็น" }]}
                    style={{ marginBottom: 0 }}
                  >
                    <SignatureUploadField form={form} />
                  </Form.Item>
                </>
              )}
            </Flex>
          </Card>
        </div>

        <Flex justify="flex-end" gap={16} style={{ marginTop: 48 }}>
          <Button
            onClick={onClose}
            style={{ borderRadius: 12, height: 48, paddingInline: 32 }}
          >
            ยกเลิกคำขอ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              borderRadius: 12,
              height: 48,
              paddingInline: 48,
              fontWeight: 600,
            }}
          >
            ส่งคำขออนุมัติ
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default CreateModal;
