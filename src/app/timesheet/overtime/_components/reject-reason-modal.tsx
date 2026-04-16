"use client";

import { CloseCircleOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Modal, Space, Tag, Typography } from "antd";
import React, { useEffect } from "react";

interface RejectReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  overtimeId?: string | number;
}

/**
 * หน้าต่างสำหรับให้ admin ระบุเหตุผลก่อนปฏิเสธคำขอ OT
 */
const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  overtimeId,
}) => {
  const [form] = Form.useForm();

  // รีเซ็ตฟอร์มทุกครั้งที่ปิด modal
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  // ยืนยันการปฏิเสธโดยตรวจสอบข้อมูลก่อน
  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values.reason);
    } catch {
      // ข้อผิดพลาดจากการ validate จะแสดงผ่าน Form.Item
    }
  };

  // ยกเลิกและปิด modal
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      centered
      width={520}
      maskClosable={!loading}
      closable={!loading}
      title={
        <Space>
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
          <span>
            ระบุเหตุผลการปฏิเสธ OT{overtimeId != null ? ` #${overtimeId}` : ""}
          </span>
        </Space>
      }
      footer={
        <Flex justify="end" gap={12}>
          <Button onClick={handleClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            type="primary"
            danger
            loading={loading}
            onClick={handleConfirm}
          >
            ยืนยันการปฏิเสธ
          </Button>
        </Flex>
      }
    >
      <Flex vertical gap={16} style={{ paddingBlock: 12 }}>
        {overtimeId != null && (
          <div>
            <Tag color="error">คำขอ OT #{overtimeId} จะถูกปฏิเสธ</Tag>
          </div>
        )}

        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="reason"
            label="เหตุผลการปฏิเสธ"
            rules={[
              { required: true, message: "กรุณาระบุเหตุผลการปฏิเสธ" },
              {
                min: 5,
                message: "เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร",
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="ระบุเหตุผลการปฏิเสธ..."
              disabled={loading}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          เหตุผลนี้จะถูกบันทึกใน Audit Trail และแจ้งให้พนักงานทราบ
        </Typography.Text>
      </Flex>
    </Modal>
  );
};

export default RejectReasonModal;
