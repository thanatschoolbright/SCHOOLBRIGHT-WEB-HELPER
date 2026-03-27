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

const { Text, Title } = Typography;
const { useToken } = theme;

/**
 * Modal สำหรับแสดง Timeline การส่งต่องาน (Tracking)
 * ดึงข้อมูลจาก History ของ Issue ใน Backlog
 */
export const IssueTimelineModal = () => {
  const { token } = useToken();
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
        <div
          style={{
            maxHeight: "65vh",
            overflowY: "auto",
            paddingRight: 8,
            paddingLeft: 8,
          }}
        >
          <Timeline
            items={timelineData.map((event) => ({
              children: (
                <div style={{ marginBottom: 32, marginLeft: 4 }}>
                  <Card
                    size="small"
                    variant="outlined"
                    styles={{
                      body: { padding: "16px 20px" },
                    }}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      boxShadow: `0 4px 12px ${token.colorFillTertiary}`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Flex vertical gap={16}>
                      {/* ส่วนหัวแสดงวันที่และเวลา (ย้ายมาไว้ข้างใน Card มุมซ้ายบน) */}
                      <Flex justify="space-between" align="center">
                        <Space size={8}>
                          <ClockCircleOutlined
                            style={{
                              color: token.colorPrimary,
                              fontSize: "0.9rem",
                            }}
                          />
                          <Text
                            strong
                            style={{
                              fontSize: "1rem",
                              color: token.colorText,
                            }}
                          >
                            {dayjs(event.created_at).format("DD/MM/YYYY")}
                          </Text>
                          <Tag
                            color="blue"
                            bordered={false}
                            style={{ margin: 0, fontWeight: 600 }}
                          >
                            {dayjs(event.created_at).format("HH:mm น.")}
                          </Tag>
                        </Space>
                      </Flex>

                      <Flex align="center" gap={12}>
                        <Avatar
                          size={40}
                          src={event.updated_by.avatar_url}
                          icon={<UserOutlined />}
                          style={{
                            border: `2px solid ${token.colorPrimaryBg}`,
                            backgroundColor: token.colorFillSecondary,
                          }}
                        />
                        <Flex vertical>
                          <Text strong style={{ fontSize: "1.05rem" }}>
                            {event.updated_by.name}
                          </Text>
                          <Text
                            type="secondary"
                            style={{ fontSize: "0.85rem" }}
                          >
                            ผู้ดำเนินการเปลี่ยนสถานะ/ส่งงาน
                          </Text>
                        </Flex>
                      </Flex>

                      <Space
                        direction="vertical"
                        size={0}
                        style={{ width: "100%" }}
                      >
                        <div
                          style={{
                            padding: "16px",
                            background: token.colorFillQuaternary,
                            borderRadius: 12,
                            borderLeft: `5px solid ${token.colorPrimary}`,
                          }}
                        >
                          <Flex align="center" gap={12} wrap="wrap">
                            <Tag
                              color="default"
                              bordered={false}
                              style={{
                                margin: 0,
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: "0.9rem",
                              }}
                            >
                              {event.from_user === "ไม่มี"
                                ? "ยังไม่ได้ระบุ"
                                : event.from_user}
                            </Tag>
                            <Text
                              style={{
                                fontSize: "1.4rem",
                                lineHeight: 1,
                                color: token.colorTextQuaternary,
                              }}
                            >
                              →
                            </Text>
                            <Tag
                              color="blue"
                              bordered={false}
                              style={{
                                margin: 0,
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: "0.9rem",
                              }}
                            >
                              {event.to_user}
                            </Tag>
                          </Flex>
                        </div>
                      </Space>

                      {event.content &&
                        event.content !== "ไม่มีข้อความเพิ่มเติม" && (
                          <div
                            style={{
                              borderTop: `1px dashed ${token.colorBorderSecondary}`,
                              paddingTop: 12,
                              marginTop: 4,
                            }}
                          >
                            <Flex gap={8} style={{ marginBottom: 6 }}>
                              <Text
                                type="secondary"
                                style={{ fontSize: "0.8rem", fontWeight: 500 }}
                              >
                                รายการหมายเหตุ/รายละเอียด:
                              </Text>
                            </Flex>
                            <div
                              style={{
                                padding: "8px 12px",
                                background: token.colorFillTertiary,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: token.colorTextDescription,
                                  fontStyle: "italic",
                                  lineHeight: 1.6,
                                  fontSize: "0.95rem",
                                  display: "block",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                "{event.content}"
                              </Text>
                            </div>
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
