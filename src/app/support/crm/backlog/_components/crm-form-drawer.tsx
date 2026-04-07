"use client";

import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useCrmStore } from "../_state/crm-store";

const { Text } = Typography;
const { TextArea } = Input;

const STATUS_OPTIONS = [
  { label: "รอดำเนินการ", value: "OPEN" },
  { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
  { label: "แก้ไขแล้ว", value: "RESOLVED" },
  { label: "ปิดเคส", value: "CLOSED" },
];

const PRIORITY_OPTIONS = [
  { label: "สูงมาก", value: "CRITICAL" },
  { label: "สูง", value: "HIGH" },
  { label: "ปานกลาง", value: "MEDIUM" },
  { label: "ต่ำ", value: "LOW" },
];

const CHANNEL_OPTIONS = [
  { label: "โทรศัพท์", value: "PHONE" },
  { label: "Line", value: "LINE" },
  { label: "อีเมล", value: "EMAIL" },
  { label: "Walk-in", value: "WALK_IN" },
];

export const CrmFormDrawer: React.FC = () => {
  const { token } = theme.useToken();
  const {
    drawerOpen,
    editingItem,
    closeDrawer,
    createCase,
    updateCase,
    isSubmitting,
  } = useCrmStore();
  const [form] = Form.useForm();

  const isEdit = !!editingItem;

  // โหลดข้อมูลเดิมเมื่อเปิดแก้ไข
  useEffect(() => {
    if (drawerOpen && editingItem) {
      form.setFieldsValue({
        ...editingItem,
        issue_date: editingItem.issue_date
          ? dayjs(editingItem.issue_date)
          : null,
        follow_up_date: editingItem.follow_up_date
          ? dayjs(editingItem.follow_up_date)
          : null,
        start_date: editingItem.start_date
          ? dayjs(editingItem.start_date)
          : null,
        due_date: editingItem.due_date ? dayjs(editingItem.due_date) : null,
      });
    } else if (drawerOpen && !editingItem) {
      form.resetFields();
      form.setFieldsValue({
        status: "OPEN",
        is_follow_up: false,
        onboarding: false,
      });
    }
  }, [drawerOpen, editingItem, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    // แปลง DatePicker → ISO string
    const dateFields = [
      "issue_date",
      "follow_up_date",
      "start_date",
      "due_date",
    ];
    for (const field of dateFields) {
      if (values[field]) {
        values[field] = dayjs(values[field]).toISOString();
      }
    }

    if (isEdit && editingItem) {
      await updateCase({ ...values, id: editingItem.id });
    } else {
      await createCase(values);
    }
  };

  return (
    <Drawer
      title={
        <Text style={{ fontWeight: 600 }}>
          {isEdit ? `แก้ไขเคส #${editingItem?.id}` : "เพิ่มเคสใหม่"}
        </Text>
      }
      open={drawerOpen}
      onClose={closeDrawer}
      width={720}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={closeDrawer} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
            {isEdit ? "บันทึกการแก้ไข" : "สร้างเคส"}
          </Button>
        </Flex>
      }
      styles={{
        body: { padding: 24, backgroundColor: token.colorBgLayout },
      }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={[16, 0]}>
          {/* ข้อมูลพื้นฐาน */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="วันที่เกิดเหตุ"
              name="issue_date"
              rules={[{ required: true, message: "กรุณาระบุวันที่เกิดเหตุ" }]}
            >
              <DatePicker style={{ width: "100%" }} placeholder="เลือกวันที่" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="รหัสโรงเรียน"
              name="school_id"
              rules={[{ required: true, message: "กรุณาระบุรหัสโรงเรียน" }]}
            >
              <Input type="number" placeholder="รหัสโรงเรียน" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ช่องทางติดต่อ" name="channel">
              <Select
                options={CHANNEL_OPTIONS}
                placeholder="เลือกช่องทาง"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ผู้ติดต่อ" name="contact_id">
              <Input placeholder="รหัสหรือชื่อผู้ติดต่อ" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ประเภท" name="type">
              <Input placeholder="ประเภทเคส" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ประเภทย่อย" name="sub_type">
              <Input placeholder="ประเภทย่อย" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="รหัสอ้างอิง" name="ref_code">
              <Input placeholder="รหัสอ้างอิง" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="รหัสผู้รับมอบหมาย" name="assign_staff_id">
              <Input type="number" placeholder="รหัสพนักงาน" />
            </Form.Item>
          </Col>

          {/* หัวข้อและรายละเอียด */}
          <Col xs={24}>
            <Form.Item
              label="หัวข้อเคส"
              name="subject"
              rules={[{ required: true, message: "กรุณาระบุหัวข้อเคส" }]}
            >
              <Input placeholder="หัวข้อเคส" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="รายละเอียดการสนับสนุน" name="support_detail">
              <TextArea rows={3} placeholder="รายละเอียด" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="คำถาม" name="question">
              <TextArea rows={3} placeholder="คำถาม" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="คำตอบ" name="answer">
              <TextArea rows={3} placeholder="คำตอบ" />
            </Form.Item>
          </Col>

          {/* สถานะและความสำคัญ */}
          <Col xs={24} sm={12}>
            <Form.Item label="สถานะ" name="status">
              <Select options={STATUS_OPTIONS} placeholder="สถานะ" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ระดับความสำคัญ" name="priority">
              <Select
                options={PRIORITY_OPTIONS}
                placeholder="ระดับความสำคัญ"
                allowClear
              />
            </Form.Item>
          </Col>

          {/* วันที่ */}
          <Col xs={24} sm={12}>
            <Form.Item label="วันเริ่มต้น" name="start_date">
              <DatePicker style={{ width: "100%" }} placeholder="เลือกวันที่" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="วันครบกำหนด" name="due_date">
              <DatePicker style={{ width: "100%" }} placeholder="เลือกวันที่" />
            </Form.Item>
          </Col>

          {/* ติดตาม */}
          <Col xs={24} sm={12}>
            <Form.Item
              label="ต้องติดตาม"
              name="is_follow_up"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="วันติดตาม" name="follow_up_date">
              <DatePicker style={{ width: "100%" }} placeholder="เลือกวันที่" />
            </Form.Item>
          </Col>

          {/* Backlog */}
          <Col xs={24} sm={12}>
            <Form.Item label="รหัส Backlog Project" name="backlog_project_id">
              <Input type="number" placeholder="Backlog Project ID" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="รหัส Backlog Issue" name="backlog_issue_id">
              <Input type="number" placeholder="Backlog Issue ID" />
            </Form.Item>
          </Col>

          {/* หมายเหตุ */}
          <Col xs={24}>
            <Form.Item label="หมายเหตุ" name="note">
              <TextArea rows={2} placeholder="หมายเหตุเพิ่มเติม" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};
