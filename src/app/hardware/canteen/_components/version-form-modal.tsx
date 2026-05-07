"use client";

import {
  CloudUploadOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Typography,
  Upload,
  theme,
} from "antd";
import { useMemo, useState } from "react";

import type { ApplicationRecord, VersionFormValues } from "@/types/canteen.type";

const ENVIRONMENT_OPTIONS = [
  { label: "ใช้งานจริง (Production)", value: "Production", color: "green" },
  { label: "ทดสอบเบต้า (Beta)", value: "Beta", color: "orange" },
  { label: "กำลังพัฒนา (Development)", value: "Development", color: "blue" },
];

const VERSION_FORM_STEPS = [
  { title: "ข้อมูลพื้นฐาน", description: "รายละเอียดเวอร์ชัน" },
  { title: "อัปโหลดไฟล์", description: "ไฟล์ .apk หรือ .zip" },
  { title: "การตั้งค่า", description: "กำหนดเงื่อนไขการอัปเดต" },
];

interface VersionFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  currentStep: number;
  selectedApplication: ApplicationRecord | null;
  schoolOptions: Array<{ label: string; value: string }>;
  formInstance: ReturnType<typeof Form.useForm<VersionFormValues>>[0];
  onClose: () => void;
  onStepChange: (step: number) => void;
  onSubmit: () => Promise<void>;
}

// ✨ Multi-step modal form สำหรับสร้าง/แก้ไขเวอร์ชันแอปพลิเคชัน
export const VersionFormModal = ({
  open,
  mode,
  currentStep,
  selectedApplication,
  schoolOptions,
  formInstance,
  onClose,
  onStepChange,
  onSubmit,
}: VersionFormModalProps) => {
  const { token } = theme.useToken();
  const [rolloutPercent, setRolloutPercent] = useState(0);

  // ✨ สุ่มเลือกโรงเรียนตามเปอร์เซ็นต์ Roll-out ที่กำหนด
  const handleApplyRollout = () => {
    const validSchools = schoolOptions.filter((opt) => opt.value !== "");
    if (validSchools.length === 0) return;

    let countToSelect = Math.round((rolloutPercent / 100) * validSchools.length);
    if (countToSelect === 0 && rolloutPercent > 0) countToSelect = 1;

    const shuffled = [...validSchools].sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, countToSelect).map((opt) => opt.value);
    formInstance.setFieldsValue({ schoolID: selectedIds });
  };

  const estimatedSchoolCount = useMemo(() => {
    const validCount = schoolOptions.filter((o) => o.value !== "").length;
    return Math.max(1, Math.round((rolloutPercent / 100) * validCount));
  }, [rolloutPercent, schoolOptions]);

  // ✨ เลื่อนขั้นตอนถัดไปพร้อม validate ฟิลด์ที่จำเป็น
  const handleNextStep = async () => {
    try {
      if (currentStep === 0)
        await formInstance.validateFields(["versionName", "env"]);
      if (currentStep === 1 && mode === "add")
        await formInstance.validateFields(["file"]);
      onStepChange(currentStep + 1);
    } catch (_) {
      // validation error — Ant Design แสดง error ใต้ field อัตโนมัติ ไม่ต้องจัดการเพิ่ม
    }
  };

  return (
    <Modal
      title={mode === "add" ? "ขั้นตอนการสร้างเวอร์ชันใหม่" : "แก้ไขรายละเอียดเวอร์ชัน"}
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button
          key="back"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
        >
          ย้อนกลับ
        </Button>,
        currentStep < 2 ? (
          <Button key="next" type="primary" onClick={handleNextStep}>
            ถัดไป
          </Button>
        ) : (
          <Button key="submit" type="primary" onClick={onSubmit}>
            บันทึกข้อมูลเวอร์ชัน
          </Button>
        ),
      ]}
    >
      <Steps
        current={currentStep}
        items={VERSION_FORM_STEPS}
        size="small"
        style={{ margin: "24px 0" }}
      />

      <Form form={formInstance} layout="vertical" preserve>
        {/* ขั้นตอนที่ 1: ข้อมูลพื้นฐาน */}
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appID" label="รหัสแอปพลิเคชัน (App ID)">
                <Input disabled />
              </Form.Item>
              {/* hidden field เก็บ versionID สำหรับ mode edit */}
              <Form.Item name="versionID" hidden>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="versionName"
                label="ชื่อเวอร์ชัน (เช่น 1.0.0)"
                rules={[{ required: true, message: "กรุณาระบุชื่อเวอร์ชัน" }]}
              >
                <Input placeholder="ระบุเวอร์ชัน" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="env"
                label="สภาพแวดล้อมระบบ"
                rules={[{ required: true, message: "กรุณาเลือกสภาพแวดล้อม" }]}
              >
                <Select options={ENVIRONMENT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="note" label="บันทึกรายละเอียด (Release Notes)">
                <Input.TextArea rows={4} placeholder="ระบุรายละเอียดการเปลี่ยนแปลง..." />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ขั้นตอนที่ 2: อัปโหลดไฟล์ */}
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <Form.Item
            name="file"
            label="ไฟล์ติดตั้งแอปพลิเคชัน"
            valuePropName="fileList"
            getValueFromEvent={(event) =>
              Array.isArray(event) ? event : event?.fileList
            }
            rules={[{ required: mode === "add", message: "กรุณาอัปโหลดไฟล์" }]}
          >
            <Upload.Dragger beforeUpload={() => false} maxCount={1} accept=".apk,.zip">
              <p>
                <CloudUploadOutlined style={{ fontSize: 40, color: "#1890ff" }} />
              </p>
              <p style={{ fontSize: 16 }}>
                คลิกหรือลากไฟล์ .apk หรือ .zip มาวางที่นี่เพื่ออัปโหลด
              </p>
              <p>แนะนำขนาดไฟล์ไม่ควรเกิน 200MB</p>
            </Upload.Dragger>
          </Form.Item>
        </div>

        {/* ขั้นตอนที่ 3: การตั้งค่า */}
        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Card
              size="small"
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>ตั้งค่าเป็นเวอร์ชันหลัก</span>
                </Space>
              }
            >
              <Flex justify="space-between" align="center">
                <Typography.Text>กำหนดให้เป็นเวอร์ชันล่าสุดในระบบ</Typography.Text>
                <Form.Item name="isLatestVersion" valuePropName="checked" noStyle>
                  <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
                </Form.Item>
              </Flex>
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <TeamOutlined />
                  <span>กลุ่มโรงเรียนเป้าหมาย</span>
                </Space>
              }
            >
              <Typography.Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
                เลือกโรงเรียนที่ต้องการให้ได้รับการเข้าถึงเวอร์ชันนี้ (หากไม่เลือกจะถือว่าปล่อยให้ "ทุกโรงเรียน")
              </Typography.Text>

              {/* Roll-out random selection */}
              <Flex
                gap="small"
                align="center"
                style={{
                  marginBottom: 16,
                  padding: "12px",
                  background: token.colorFillAlter,
                  borderRadius: 8,
                  border: `1px dashed ${token.colorBorder}`,
                }}
              >
                <Typography.Text strong style={{ fontSize: 13, minWidth: 100 }}>
                  สุ่มเลือก (Roll-out):
                </Typography.Text>
                <InputNumber
                  min={0}
                  max={100}
                  step={5}
                  value={rolloutPercent}
                  suffix="%"
                  onChange={(value) => setRolloutPercent(value ?? 0)}
                  style={{ width: 90 }}
                />
                <Button
                  icon={<RocketOutlined />}
                  onClick={handleApplyRollout}
                  disabled={rolloutPercent <= 0}
                >
                  สุ่มเลือกโรงเรียน
                </Button>
                {rolloutPercent > 0 && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    จะสุ่มเลือกประมาณ {estimatedSchoolCount} โรงเรียน
                  </Typography.Text>
                )}
              </Flex>

              <Form.Item name="schoolID" noStyle>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="ค้นหาหรือเลือกโรงเรียน..."
                  style={{ width: "100%" }}
                  options={schoolOptions}
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(values: string[]) => {
                    if (values.includes("")) {
                      const allSchoolIds = schoolOptions
                        .filter((opt) => opt.value !== "")
                        .map((opt) => opt.value);
                      formInstance.setFieldsValue({ schoolID: allSchoolIds });
                    }
                  }}
                />
              </Form.Item>
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <WarningOutlined style={{ color: "#faad14" }} />
                  <span>นโยบายการบังคับอัปเดต</span>
                </Space>
              }
            >
              <Flex justify="space-between" align="center">
                <Typography.Text>บังคับให้ผู้ใช้งานอัปเดตแอปพลิเคชันทันที</Typography.Text>
                <Form.Item name="forceUpdate" valuePropName="checked" noStyle>
                  <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
                </Form.Item>
              </Flex>
            </Card>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};
