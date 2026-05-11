"use client";

import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Flex, Form, Input, Modal, Select, Typography } from "antd";
import { useEffect } from "react";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";

const { Text } = Typography;

/**
 * Modal สำหรับเพิ่มและแก้ไขข้อมูลกลุ่ม LINE
 * ปรับปรุง Spacing และ Form Layout ให้ดูโปร่งและใช้งานง่ายขึ้น
 */
export const SchoolLineGroupModal = () => {
  const [form] = Form.useForm();
  const {
    isModalOpen,
    modalMode,
    editItem,
    loading,
    closeFormModal,
    submitForm,
    schoolOptions,
    schoolOptionsLoading,
  } = useSchoolLineGroupStore();

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
      title={
        <Flex align="center" gap={12} className="mb-2">
          <div
            className={`p-2 rounded-xl ${
              modalMode === "create"
                ? "bg-blue-50 text-blue-600"
                : "bg-purple-50 text-purple-600"
            } dark:bg-slate-800 shadow-sm`}
          >
            {modalMode === "create" ? <PlusOutlined /> : <EditOutlined />}
          </div>
          <Flex vertical gap={2}>
            <Text strong className="text-lg tracking-tight">
              {modalMode === "create"
                ? "เพิ่มกลุ่ม LINE ใหม่"
                : "แก้ไขข้อมูลกลุ่ม LINE"}
            </Text>
            <Text
              type="secondary"
              className="text-[10px] uppercase tracking-widest font-bold"
            >
              {modalMode === "create"
                ? "Create New Entry"
                : "Update Existing Entry"}
            </Text>
          </Flex>
        </Flex>
      }
      open={isModalOpen}
      onOk={handleOk}
      onCancel={closeFormModal}
      confirmLoading={loading}
      okText="บันทึกข้อมูล"
      cancelText="ยกเลิก"
      destroyOnHidden
      maskClosable={false}
      centered
      width={560}
      className="modern-modal"
      styles={{
        mask: { backdropFilter: "blur(6px)" },
        body: { padding: "24px 32px 8px 32px" },
      }}
      okButtonProps={{
        className:
          "h-12 px-10 rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none border-none bg-blue-600 hover:bg-blue-500 transition-all active:scale-95",
      }}
      cancelButtonProps={{
        className:
          "h-12 px-10 rounded-xl font-bold border-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all active:scale-95",
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ group_type: "general" }}
        className="flex flex-col gap-5"
      >
        <Form.Item
          label={
            <Text
              type="secondary"
              className="text-xs font-bold uppercase tracking-widest ml-1 mb-1"
            >
              โรงเรียน
            </Text>
          }
          name="school_id"
          rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
          className="mb-0"
        >
          <Select
            showSearch
            loading={schoolOptionsLoading}
            placeholder="ค้นหาหรือเลือกโรงเรียน..."
            options={schoolOptions}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            className="h-12 rounded-xl transition-all"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label={
            <Text
              type="secondary"
              className="text-xs font-bold uppercase tracking-widest ml-1 mb-1"
            >
              Group ID
            </Text>
          }
          name="group_id"
          rules={[{ required: true, message: "กรุณาระบุ Group ID" }]}
          className="mb-0"
        >
          <Input
            placeholder="ระบุ Group ID ของ LINE"
            className="h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all px-4 text-sm"
          />
        </Form.Item>

        <Form.Item
          label={
            <Text
              type="secondary"
              className="text-xs font-bold uppercase tracking-widest ml-1 mb-1"
            >
              Line Notification Access Token
            </Text>
          }
          name="line_notification_access_token"
          rules={[{ required: true, message: "กรุณาระบุ Access Token" }]}
          className="mb-0"
        >
          <Input.Password
            placeholder="ระบุ Access Token สำหรับการแจ้งเตือน"
            className="h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all px-4 text-sm"
          />
        </Form.Item>

        <Form.Item
          label={
            <Text
              type="secondary"
              className="text-xs font-bold uppercase tracking-widest ml-1 mb-1"
            >
              ประเภทกลุ่ม (Group Category)
            </Text>
          }
          name="group_type"
          className="mb-4"
        >
          <Select
            placeholder="เลือกประเภทกลุ่ม"
            className="modern-select h-12 rounded-xl transition-all"
            popupClassName="rounded-xl overflow-hidden"
          >
            <Select.Option value="general">ทั่วไป (General)</Select.Option>
            <Select.Option value="emergency">ฉุกเฉิน (Emergency)</Select.Option>
            <Select.Option value="test">ทดสอบ (Test)</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
