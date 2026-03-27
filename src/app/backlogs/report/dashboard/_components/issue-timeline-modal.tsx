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
  Timeline,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text, Title } = Typography;

/**
 * Modal สำหรับแสดง Timeline การส่งต่องาน (Tracking)
 * ดึงข้อมูลจาก History ของ Issue ใน Backlog
 */
export const IssueTimelineModal = () => {
  const {
    timelineData,
    timelineLoading,
    selectedIssueKey,
    setSelectedAssigneeId,
  } = useBacklogDashboardStore();

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
      width={700}
      centered
      styles={{
        body: { padding: "24px 24px 0 24px" },
      }}
    >
      {timelineLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : timelineData.length > 0 ? (
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
          <Timeline
            mode="left"
            items={timelineData.map((event) => ({
              label: (
                <div style={{ paddingRight: 12 }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: "0.85rem", display: "block" }}
                  >
                    {dayjs(event.created_at).format("DD MMM YYYY")}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: "1.1rem", fontWeight: 500 }}
                  >
                    {dayjs(event.created_at).format("HH:mm น.")}
                  </Text>
                </div>
              ),
              children: (
                <div style={{ marginBottom: 24, marginLeft: 8 }}>
                  <Card
                    size="small"
                    variant="outlined"
                    styles={{
                      body: { padding: "12px 16px" },
                    }}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Flex vertical gap={12}>
                      <Flex align="center" gap={10}>
                        <Avatar
                          size={32}
                          src={event.updated_by.avatar_url}
                          icon={<UserOutlined />}
                          style={{
                            border: `2px solid ${token.colorPrimaryBg}`,
                          }}
                        />
                        <Flex vertical>
                          <Text strong style={{ fontSize: "1rem" }}>
                            {event.updated_by.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "0.8rem" }}>
                            ผู้ดำเนินการส่งงาน
                          </Text>
                        </Flex>
                      </Flex>

                      <div
                        style={{
                          padding: "10px 14px",
                          background: token.colorFillAlter,
                          borderRadius: 8,
                          borderLeft: `4px solid ${token.colorPrimary}`,
                        }}
                      >
                        <Flex vertical gap={6}>
                          <Flex align="center" gap={8} wrap="wrap">
                            <Tag color="default" style={{ margin: 0 }}>
                              {event.from_user === "ไม่มี"
                                ? "ยังไม่ได้ระบุ"
                                : event.from_user}
                            </Tag>
                            <Text
                              type="secondary"
                              style={{ fontSize: "1.2rem", lineHeight: 1 }}
                            >
                              →
                            </Text>
                            <Tag
                              color="processing"
                              style={{ margin: 0, fontWeight: 600 }}
                            >
                              {event.to_user}
                            </Tag>
                          </Flex>
                        </Flex>
                      </div>

                      {event.content &&
                        event.content !== "ไม่มีข้อความเพิ่มเติม" && (
                          <div
                            style={{
                              borderTop: `1px dashed ${token.colorBorderSecondary}`,
                              paddingTop: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: token.colorTextDescription,
                                fontStyle: "italic",
                                lineHeight: 1.6,
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
              color: token.colorPrimary,
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
