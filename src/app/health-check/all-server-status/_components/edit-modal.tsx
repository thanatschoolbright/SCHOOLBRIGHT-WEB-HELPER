import React, { useState, useEffect } from "react";
import { Modal, Space, Flex, Alert, Input, Button, theme } from "antd";
import { EditOutlined, InfoCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ServerStatus, useServerStatusStore } from "../_state/server-status.state";

interface EditModalProps {
  server: ServerStatus | null;
  open: boolean;
  onClose: () => void;
}

/**
 * หน้าต่างแก้ไขรายละเอียด (Edit Description Modal)
 * สำหรับบันทึกหมายเหตุเพิ่มเติมของแต่ละเซิร์ฟเวอร์
 */
const EditModal: React.FC<EditModalProps> = ({ server, open, onClose }) => {
  const { token } = theme.useToken();
  const [editValue, setEditValue] = useState("");
  const { updateServerDescription } = useServerStatusStore();

  useEffect(() => {
    if (server && open) {
      setEditValue(server.description || "");
    }
  }, [server, open]);

  const handleSave = () => {
    if (!server) return;
    updateServerDescription(server.server_name_th, server.timestamp, editValue);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: token.colorPrimary }} />
          <span>แก้ไขหมายเหตุ / รายละเอียด</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
      centered
    >
      <Flex vertical gap="middle">
        <Alert
          message="คำแนะนำการจัดการ"
          description="บันทึกข้อความสำคัญเพื่อให้ทีมงาน (CS/QA/Dev) รับทราบสถานะพิเศษของเซิร์ฟเวอร์นี้"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
        <Input.TextArea
          rows={6}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="พิมพ์รายละเอียดที่ต้องการบันทึก..."
          showCount
          maxLength={500}
          style={{ borderRadius: 8 }}
        />
        <Flex justify="flex-end" gap="small">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            type="primary"
            onClick={handleSave}
            icon={<CheckCircleOutlined />}
          >
            บันทึกข้อมูล
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default EditModal;
