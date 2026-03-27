"use client";

import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Empty,
  Modal,
  Skeleton,
  Space,
  Timeline,
  Typography,
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
      width={600}
      centered
    >
      {timelineLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : timelineData.length > 0 ? (
        <Timeline
          mode="left"
          items={timelineData.map((event) => ({
            label: dayjs(event.created_at).format("DD/MM/YYYY HH:mm"),
            children: (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar
                    size="small"
                    src={event.updated_by.avatar_url}
                    icon={<UserOutlined />}
                  />
                  <Text strong>{event.updated_by.name}</Text>
                  <Text type="secondary">ดำเนินการส่งต่อ</Text>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "#f5f5f5",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">จาก: </Text>
                    <Text delete={event.from_user === "ไม่มี"}>
                      {event.from_user}
                    </Text>
                    <Text type="secondary"> → </Text>
                    <Text strong style={{ color: "#1677ff" }}>
                      {event.to_user}
                    </Text>
                  </div>
                  {event.content &&
                    event.content !== "ไม่มีข้อความเพิ่มเติม" && (
                      <div
                        style={{
                          borderTop: "1px solid #e8e8e8",
                          paddingTop: 4,
                          marginTop: 4,
                        }}
                      >
                        <Text italic>{event.content}</Text>
                      </div>
                    )}
                </div>
              </div>
            ),
            color: "blue",
          }))}
        />
      ) : (
        <Empty description="ไม่พบประวัติการเปลี่ยนผู้รับผิดชอบ (Assignee) ในรายการนี้" />
      )}
    </Modal>
  );
};
