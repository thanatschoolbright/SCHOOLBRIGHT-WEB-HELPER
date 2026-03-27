"use client";

import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Card,
  Empty,
  Flex,
  Modal,
  Skeleton,
  Space,
  Tag,
  theme,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text } = Typography;
const { useToken } = theme;

/**
 * Modal สำหรับแสดง Timeline การส่งต่องาน (Tracking)
 * ดึงข้อมูลจาก History ของ Issue ใน Backlog
 */
export const IssueTimelineModal = () => {
  const { token } = useToken();
  const { timelineData, timelineLoading, selectedIssueKey } =
    useBacklogDashboardStore();

  const isOpen = !!selectedIssueKey;

  // ปิด modal โดยการล้างค่า selectedIssueKey ผ่าน Store (ใช้ setSelectedAssigneeId(null) ร่วมด้วยถ้าจำเป็น)
  const handleClose = () => {
    useBacklogDashboardStore.setState({
      selectedIssueKey: null,
      timelineData: [],
    });
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Timeline ติดตามการส่งต่องาน: {selectedIssueKey}</span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={1200}
      centered
      styles={{
        body: { padding: "24px 24px 0 24px" },
      }}
    >
      {timelineLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : timelineData.length > 0 ? (
        <div
          style={{
            maxHeight: "65vh",
            overflowY: "auto",
            padding: "8px 16px",
          }}
        >
          <Timeline
            mode="alternate" // ใช้โหมดสลับซ้าย-ขวา เพื่อความสวยงามและใช้พื้นที่ได้คุ้มค่า
            items={timelineData.map((event, index) => ({
              // กำหนดสีตามลำดับงาน (อันล่าสุดให้เป็นสีเขียว)
              color: index === 0 ? "green" : "blue",
              // ใส่ไอคอนนาฬิกาสำหรับรายการล่าสุด
              icon:
                index === 0 ? (
                  <ClockCircleOutlined style={{ fontSize: "16px" }} />
                ) : undefined,
              children: (
                <div style={{ marginBottom: 16 }}>
                  <Card
                    size="small"
                    variant="outlined"
                    styles={{
                      body: { padding: "12px 16px" },
                    }}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      boxShadow: `0 4px 12px ${token.colorFillTertiary}`,
                      textAlign: "left", // บังคับให้ข้อความชิดซ้ายเสมอแม้จะอยู่ฝั่งขวาของ Timeline
                    }}
                  >
                    <Flex vertical gap={12}>
                      {/* ส่วนหัวแสดงวันที่และเวลา */}
                      <Flex justify="space-between" align="center">
                        <Space size={4}>
                          <Text
                            strong
                            style={{
                              fontSize: "0.9rem",
                              color: token.colorText,
                            }}
                          >
                            {dayjs(event.created_at).format("DD/MM/YYYY")}
                          </Text>
                          <Tag
                            color={index === 0 ? "success" : "processing"}
                            bordered={false}
                            style={{
                              margin: 0,
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          >
                            {dayjs(event.created_at).format("HH:mm น.")}
                          </Tag>
                        </Space>
                      </Flex>

                      {/* ข้อมูลผู้ส่งงาน */}
                      <Flex align="center" gap={8}>
                        <Avatar
                          size={28}
                          src={event.updated_by.avatar_url}
                          icon={<UserOutlined />}
                          style={{
                            border: `1px solid ${token.colorPrimaryBg}`,
                          }}
                        />
                        <Text strong style={{ fontSize: "0.9rem" }}>
                          {event.updated_by.name}
                        </Text>
                      </Flex>

                      {/* ส่วน Handoff (From -> To) */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background: token.colorFillQuaternary,
                          borderRadius: 12,
                          borderLeft: `3px solid ${index === 0 ? token.colorSuccess : token.colorPrimary}`,
                        }}
                      >
                        <Flex align="center" gap={8} wrap="wrap">
                          <Tag
                            color="default"
                            bordered={false}
                            style={{
                              margin: 0,
                              fontSize: "0.8rem",
                            }}
                          >
                            {event.from_user === "ไม่มี"
                              ? "N/A"
                              : event.from_user}
                          </Tag>
                          <Text
                            style={{
                              fontSize: "1rem",
                              color: token.colorTextQuaternary,
                            }}
                          >
                            →
                          </Text>
                          <Tag
                            color={index === 0 ? "green" : "blue"}
                            bordered={false}
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {event.to_user}
                          </Tag>
                        </Flex>
                      </div>

                      {/* หมายเหตุ */}
                      {event.content &&
                        event.content !== "ไม่มีข้อความเพิ่มเติม" && (
                          <div
                            style={{
                              borderTop: `1px dashed ${token.colorBorderSecondary}`,
                              paddingTop: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: token.colorTextDescription,
                                fontStyle: "italic",
                                lineHeight: 1.4,
                                fontSize: "0.85rem",
                                display: "block",
                              }}
                            >
                              "{event.content}"
                            </Text>
                          </div>
                        )}
                    </Flex>
                  </Card>
                </div>
              ),
            }))}
          />
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="ไม่พบประวัติการเปลี่ยนผู้รับผิดชอบ (Assignee) ในรายการนี้"
          style={{ padding: "40px 0" }}
        />
      )}
    </Modal>
  );
};
