import React from "react";
import { Modal, Row, Col, Space, Avatar, Typography, Flex, Tag, Descriptions, Button, theme, Grid } from "antd";
import { InfoCircleOutlined, DatabaseOutlined, EnvironmentOutlined, LinkOutlined, CopyOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { ServerStatus } from "../_state/server-status.state";
import { toast } from "sonner";

interface DetailsModalProps {
  server: ServerStatus | null;
  open: boolean;
  onClose: () => void;
}

/**
 * หน้าต่างแสดงรายละเอียดเซิร์ฟเวอร์ (Server Details Modal)
 * แสดงข้อมูลเชิงลึกและการเชื่อมต่อของเซิร์ฟเวอร์ที่เลือก
 */
const DetailsModal: React.FC<DetailsModalProps> = ({ server, open, onClose }) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  if (!server) return null;

  const isOnline = server.status === "Online";

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(server, null, 2));
      toast.success("คัดลอกข้อมูล JSON เรียบร้อยแล้ว");
    } catch {
      toast.error("ไม่สามารถคัดลอกข้อมูลได้");
    }
  };

  return (
    <Modal
      title={
        <Space size="small">
          <InfoCircleOutlined style={{ color: token.colorPrimary }} />
          <span>ข้อมูลเชิงลึกของเซิร์ฟเวอร์</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "95%" : 820}
      destroyOnHidden
      centered
    >
      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={16}>
              <Space size="large" align="center">
                <Avatar
                  size={64}
                  icon={<DatabaseOutlined />}
                  style={{
                    backgroundColor: isOnline ? token.colorSuccessBg : token.colorErrorBg,
                    color: isOnline ? token.colorSuccess : token.colorError,
                  }}
                />
                <Space direction="vertical" size={0}>
                  <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                    {server.server_name_th || server.server_name}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    {server.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </Typography.Text>
                </Space>
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Flex vertical align={isMobile ? "start" : "end"} gap={8}>
                <Tag
                  color={isOnline ? "success" : "error"}
                  icon={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  style={{ borderRadius: 12, padding: "2px 10px" }}
                >
                  {isOnline ? "ทำงานปกติ" : "หยุดทำงาน"}
                </Tag>
                <Space size={4}>
                  <Typography.Text type="secondary">Response Time:</Typography.Text>
                  <Tag color={server.response_time < 1 ? "success" : server.response_time < 2 ? "warning" : "error"} icon={<ClockCircleOutlined />}>
                    {server.response_time.toFixed(3)} ms
                  </Tag>
                </Space>
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Descriptions
            bordered
            column={isMobile ? 1 : 2}
            size="middle"
            labelStyle={{ width: isMobile ? "auto" : "25%", fontWeight: 600 }}
          >
            <Descriptions.Item label="ชื่อเซิร์ฟเวอร์ (System)">
              {server.server}
            </Descriptions.Item>
            <Descriptions.Item label="สภาพแวดล้อม (Env)">
              <Tag icon={<EnvironmentOutlined />} color="geekblue">
                {server.environment}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="URL เว็บไซต์" span={isMobile ? 1 : 2}>
              <Typography.Link href={server.url} target="_blank" rel="noreferrer">
                {server.url} <LinkOutlined />
              </Typography.Link>
            </Descriptions.Item>
            <Descriptions.Item label="จุดเชื่อมต่อ API" span={isMobile ? 1 : 2}>
              <Typography.Text code copyable>
                {server.endpoint}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="ตรวจสอบล่าสุด">
              {server.timestamp}
            </Descriptions.Item>
            <Descriptions.Item label="รหัสสถานะ HTTP">
              <Tag color={server.status_code === 200 ? "green" : "red"}>
                {server.status_code || "-"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Row gutter={[8, 8]} justify="end">
            <Col>
              <Button icon={<CopyOutlined />} onClick={handleCopyJson}>
                คัดลอก JSON
              </Button>
            </Col>
            <Col>
              <Button type="primary" onClick={onClose}>
                ปิดหน้าต่าง
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Modal>
  );
};

export default DetailsModal;
