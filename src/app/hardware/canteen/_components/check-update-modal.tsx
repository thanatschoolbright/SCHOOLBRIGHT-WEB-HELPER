"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  RocketOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";

import { GET_CHECK_VERSION } from "@/app/hardware/canteen/canteen-api.helper";
import type { ApplicationRecord } from "@/types/canteen.type";

dayjs.extend(buddhistEra);

interface CheckUpdateModalProps {
  open: boolean;
  isChecking: boolean;
  checkResult: any;
  selectedApplication: ApplicationRecord | null;
  schoolOptions: Array<{ label: string; value: string }>;
  availableVersionOptions: Array<{ label: string; value: string }>;
  checkFormInstance: ReturnType<typeof Form.useForm>[0];
  onClose: () => void;
  onSetIsChecking: (value: boolean) => void;
  onSetCheckResult: (result: any) => void;
}

// ✨ Modal จำลองการตรวจสอบสถานะอัปเดตของแอปพลิเคชันสำหรับโรงเรียนที่ระบุ
export const CheckUpdateModal = ({
  open,
  isChecking,
  checkResult,
  selectedApplication,
  schoolOptions,
  availableVersionOptions,
  checkFormInstance,
  onClose,
  onSetIsChecking,
  onSetCheckResult,
}: CheckUpdateModalProps) => {
  const { token } = theme.useToken();

  // ✨ ส่งคำขอตรวจสอบเวอร์ชันไปยัง API
  const handleCheckUpdateSimulation = async () => {
    try {
      const values = await checkFormInstance.validateFields();
      onSetIsChecking(true);
      onSetCheckResult(null);

      const response = await GET_CHECK_VERSION({
        app_id: String(selectedApplication?.app_id ?? ""),
        version_name: values.versionName,
        school_id: values.schoolID,
      });

      onSetCheckResult(response);
    } catch (error: any) {
      const apiErrorData = error.response?.data;
      onSetCheckResult({
        error: true,
        message:
          apiErrorData?.message ??
          error.message ??
          "เกิดข้อผิดพลาดในการตรวจสอบ",
        debug: apiErrorData,
      });
    } finally {
      onSetIsChecking(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SearchOutlined style={{ color: token.colorPrimary }} />
          <span>จำลองการตรวจสอบการอัปเดต (Update Simulator)</span>
        </Space>
      }
      open={open}
      onCancel={() => {
        if (!isChecking) onClose();
      }}
      footer={null}
      width={850}
      centered
    >
      <Flex vertical gap={24} style={{ marginBottom: 24 }}>
        <Typography.Text type="secondary">
          ใช้สำหรับจำลองการตรวจสอบว่าโรงเรียนที่ระบุจะได้รับแจ้งเตือนให้อัปเดตแอปพลิเคชันหรือไม่ โดยอ้างอิงจาก App ID:{" "}
          <Typography.Text code>{selectedApplication?.app_id}</Typography.Text>
        </Typography.Text>
      </Flex>

      <Form
        form={checkFormInstance}
        layout="vertical"
        onFinish={handleCheckUpdateSimulation}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="schoolID"
              label="เลือกโรงเรียนที่ต้องการทดสอบ"
              rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
            >
              <Select
                showSearch
                placeholder="ค้นหาชื่อโรงเรียน..."
                options={schoolOptions}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="versionName"
              label="เวอร์ชันที่ต้องการทดสอบ"
              rules={[{ required: true, message: "กรุณาเลือกเวอร์ชัน" }]}
            >
              <Select
                showSearch
                placeholder="เลือกหรือพิมพ์เวอร์ชัน..."
                options={availableVersionOptions}
                popupRender={(menu) => (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {menu}
                    <Flex
                      style={{
                        padding: "8px 12px",
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        * สามารถพิมพ์เวอร์ชันใหม่ที่ไม่มีในรายการได้
                      </Typography.Text>
                    </Flex>
                  </Space>
                )}
                onSearch={() => {
                  // อนุญาตให้พิมพ์ค่าใหม่ได้ หากไม่มีในตัวเลือก
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isChecking}
              block
              size="large"
              icon={<SearchOutlined />}
            >
              {isChecking ? "กำลังตรวจสอบ..." : "ตรวจสอบสถานะการอัปเดต"}
            </Button>
          </Col>
        </Row>
      </Form>

      {checkResult && (
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card
              variant="borderless"
              styles={{
                body: {
                  padding: 24,
                  borderRadius: 12,
                  border: `1px solid ${
                    checkResult.error
                      ? token.colorErrorBorder
                      : checkResult.data?.data?.update_required
                        ? token.colorWarningBorder
                        : token.colorSuccessBorder
                  }`,
                  backgroundColor: checkResult.error
                    ? token.colorErrorBg
                    : checkResult.data?.data?.update_required
                      ? token.colorWarningBg
                      : token.colorSuccessBg,
                },
              }}
            >
              {checkResult.error ? (
                <Flex align="start" gap={12}>
                  <Col flex="none">
                    <CloseCircleOutlined
                      style={{ color: token.colorError, fontSize: 24 }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      เกิดข้อผิดพลาด
                    </Typography.Title>
                    <Typography.Text>{checkResult.message}</Typography.Text>
                  </Col>
                </Flex>
              ) : (
                <Flex align="start" gap={12}>
                  <Col flex="none">
                    {checkResult.data?.data?.update_required ? (
                      <RocketOutlined
                        style={{ color: "#faad14", fontSize: 28 }}
                      />
                    ) : (
                      <CheckCircleOutlined
                        style={{ color: token.colorSuccess, fontSize: 28 }}
                      />
                    )}
                  </Col>
                  <Col flex="auto">
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {checkResult.data?.data?.update_required
                        ? "พบเวอร์ชันใหม่ (Update Available)"
                        : "เป็นเวอร์ชันล่าสุดแล้ว (Up to Date)"}
                    </Typography.Title>
                    <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                      <Typography.Text>
                        {checkResult.data?.data?.message}
                      </Typography.Text>
                    </Typography.Paragraph>

                    {checkResult.data?.data?.update_required && (
                      <Card
                        size="small"
                        style={{
                          marginTop: 16,
                          backgroundColor: token.colorBgContainer,
                          borderRadius: 12,
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                      >
                        <Row gutter={[24, 16]}>
                          <Col span={12}>
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                              <Space direction="vertical" size={4}>
                                <Typography.Text
                                  type="secondary"
                                  style={{ display: "block", fontSize: 12 }}
                                >
                                  เวอร์ชันล่าสุดที่ปล่อย
                                </Typography.Text>
                                <Tag
                                  color="processing"
                                  style={{
                                    fontSize: 16,
                                    padding: "4px 12px",
                                    borderRadius: 6,
                                    margin: 0,
                                  }}
                                >
                                  {checkResult.data?.data?.latest_version}
                                </Tag>
                              </Space>
                              <Space direction="vertical" size={4}>
                                <Typography.Text
                                  type="secondary"
                                  style={{ display: "block", fontSize: 12 }}
                                >
                                  วันที่ปล่อยอัปเดต
                                </Typography.Text>
                                <Typography.Text strong style={{ fontSize: 14 }}>
                                  {dayjs(checkResult.data?.data?.updated_at).format(
                                    "DD/MM/BBBB HH:mm",
                                  )}
                                </Typography.Text>
                              </Space>
                            </Space>
                          </Col>
                          <Col span={12}>
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                              <Space direction="vertical" size={4}>
                                <Typography.Text
                                  type="secondary"
                                  style={{ display: "block", fontSize: 12 }}
                                >
                                  ลิงก์ดาวน์โหลด
                                </Typography.Text>
                                <Button
                                  type="link"
                                  icon={<DownloadOutlined />}
                                  style={{ padding: 0, height: "auto" }}
                                  onClick={() =>
                                    window.open(
                                      checkResult.data?.data?.url,
                                      "_blank",
                                    )
                                  }
                                >
                                  คลิกเพื่อดาวน์โหลด .apk
                                </Button>
                              </Space>
                              <Typography.Text
                                copyable={{ text: checkResult.data?.data?.url }}
                                type="secondary"
                                style={{ fontSize: 11 }}
                              >
                                คัดลอก URL
                              </Typography.Text>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    )}
                  </Col>
                </Flex>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </Modal>
  );
};
