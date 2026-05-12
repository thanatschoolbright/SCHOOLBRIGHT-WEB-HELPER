"use client";

import { LineOutlined, SendOutlined } from "@ant-design/icons";
import {
  Card,
  Flex,
  List,
  Modal,
  Progress,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";

/**
 * Modal สำหรับแสดง Preview ข้อความ LINE ก่อนส่งจริง
 * พร้อมแสดง Progress Bar ขณะกำลังส่ง
 */
export const LinePreviewModal = () => {
  const { previewModal, closePreview, confirmSend, sendingId, sendProgress } =
    useSchoolLineGroupStore();

  const isSending = sendProgress > 0;

  return (
    <>
      <Modal
        title={
          <Typography.Text strong style={{ fontSize: "1.1rem" }}>
            <LineOutlined style={{ marginRight: 8, color: "#06C755" }} />
            Preview ข้อความรายงาน LINE
          </Typography.Text>
        }
        open={previewModal.open}
        onCancel={closePreview}
        onOk={confirmSend}
        okText="ยืนยันการส่ง"
        cancelText="ยกเลิก"
        confirmLoading={previewModal.loading}
        width={600}
        styles={{ body: { padding: "12px 0" } }}
      >
        {previewModal.loading ? (
          <div style={{ padding: "0 24px" }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <div
            style={{ maxHeight: "60vh", overflowY: "auto", padding: "0 24px" }}
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              ตรวจสอบข้อมูลที่จะส่งไปยังกลุ่ม LINE ของ{" "}
              {previewModal.data?.school_name}
            </Typography.Paragraph>

            <Flex gap="small" style={{ marginBottom: 16 }}>
              <Tag color="blue">
                อุปกรณ์ทั้งหมด: {previewModal.data?.total_devices}
              </Tag>
              <Tag color="success">
                ปกติ: {previewModal.data?.online_devices}
              </Tag>
              <Tag color="error">
                ออฟไลน์: {previewModal.data?.offline_devices}
              </Tag>
            </Flex>

            <Card
              size="small"
              title="ข้อความตัวอย่าง"
              styles={{
                body: {
                  borderRadius: "0 0 8px 8px",
                },
              }}
            >
              <List
                dataSource={previewModal.data?.preview_messages || []}
                renderItem={(msg: any, index) => (
                  <List.Item style={{ padding: "8px 0" }}>
                    <div style={{ whiteSpace: "pre-wrap", width: "100%" }}>
                      {msg.type === "flex" ? (
                        <Typography.Text type="secondary" italic>
                          [Flex Message: {msg.altText}]
                        </Typography.Text>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Modal>

      {/* Progress Modal เมื่อกดส่ง */}
      <Modal
        open={isSending}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <SendOutlined
            style={{ fontSize: 48, color: "#1677ff", marginBottom: 16 }}
          />
          <Typography.Title level={4}>
            กำลังส่งรายงานไปยัง LINE
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            กรุณารอสักครู่ ระบบกำลังดำเนินการส่งข้อมูล...
          </Typography.Paragraph>
          <Progress
            percent={sendProgress}
            status={sendProgress === 100 ? "success" : "active"}
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
          <div style={{ marginTop: 8 }}>
            <Typography.Text type="secondary">{sendProgress}%</Typography.Text>
          </div>
        </div>
      </Modal>
    </>
  );
};
