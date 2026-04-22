import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";

/**
 * Modal สำหรับเพิ่มและแก้ไขข้อมูลกลุ่ม LINE
 */
export const SchoolLineGroupModal = () => {
  const [form] = Form.useForm();
  const { isModalOpen, modalMode, editItem, loading, closeFormModal, submitForm } = useSchoolLineGroupStore();

  // ตั้งค่าข้อมูลเริ่มต้นเมื่อเปิด Modal ในโหมดแก้ไข
  useEffect(() => {
    if (isModalOpen) {
      if (modalMode === "edit" && editItem) {
        form.setFieldsValue({
          school_id: editItem.SchoolId,
          group_id: editItem.GroupId,
          line_notification_access_token: editItem.LineNotificationAccessToken,
          group_type: editItem.GroupType,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isModalOpen, modalMode, editItem, form]);

  /**
   * จัดการการกดบันทึกข้อมูล
   */
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await submitForm(values);
    } catch (info) {
      // Validation failed
    }
  };

  return (
    <Modal
      title={modalMode === "create" ? "เพิ่มกลุ่ม LINE ใหม่" : "แก้ไขข้อมูลกลุ่ม LINE"}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={closeFormModal}
      confirmLoading={loading}
      okText="บันทึก"
      cancelText="ยกเลิก"
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ group_type: "general" }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="รหัสโรงเรียน"
          name="school_id"
          rules={[{ required: true, message: "กรุณาระบุรหัสโรงเรียน" }]}
        >
          <InputNumber style={{ width: "100%" }} placeholder="ระบุรหัสโรงเรียน" />
        </Form.Item>

        <Form.Item
          label="Group ID"
          name="group_id"
          rules={[{ required: true, message: "กรุณาระบุ Group ID" }]}
        >
          <Input placeholder="ระบุ Group ID ของ LINE" />
        </Form.Item>

        <Form.Item
          label="Line Notification Access Token"
          name="line_notification_access_token"
          rules={[{ required: true, message: "กรุณาระบุ Access Token" }]}
        >
          <Input.Password placeholder="ระบุ Access Token สำหรับการแจ้งเตือน" />
        </Form.Item>

        <Form.Item
          label="ประเภทกลุ่ม"
          name="group_type"
        >
          <Select placeholder="เลือกประเภทกลุ่ม">
            <Select.Option value="general">ทั่วไป (General)</Select.Option>
            <Select.Option value="emergency">ฉุกเฉิน (Emergency)</Select.Option>
            <Select.Option value="test">ทดสอบ (Test)</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
