"use client";

import { UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Card,
  Flex,
  Progress,
  Space,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
import { usePMDashboardStore } from "../_state/use-pm-dashboard-store";

const { Text } = Typography;

/**
 * ✨ ส่วนวิเคราะห์ภาระงานพนักงาน (Workload)
 */
const WorkloadAnalysis: React.FC = () => {
  const { workloadData, isLoading } = usePMDashboardStore();

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>วิเคราะห์ภาระงาน (Resource Workload)</span>
        </Space>
      }
      loading={isLoading}
      styles={{ body: { overflowY: "auto", maxHeight: 500 } }}
    >
      <Flex vertical gap={20}>
        {workloadData && workloadData.length > 0 ? (
          workloadData.map((user, index) => (
            <div key={index}>
              <Flex
                justify="space-between"
                align="start"
                style={{ marginBottom: 8 }}
              >
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <Flex vertical>
                    <Text strong>{user.name}</Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {user.department}
                    </Text>
                  </Flex>
                </Space>
                <Badge
                  count={`${user.tasks} งาน`}
                  style={{
                    backgroundColor: "#f0f0f0",
                    color: "#595959",
                    boxShadow: "none",
                  }}
                />
              </Flex>
              <Tooltip
                title={`ทำจริง ${user.total_hours} ชม. / สัปดาห์ (ภาระงาน ${user.load}%)`}
              >
                <Progress
                  percent={user.load}
                  strokeColor={user.color}
                  status={user.load > 90 ? "exception" : "active"}
                />
              </Tooltip>
            </div>
          ))
        ) : (
          <Flex justify="center" align="center" style={{ padding: 40 }}>
            <Text type="secondary">ไม่มีข้อมูลการบันทึกงานภาระงาน</Text>
          </Flex>
        )}
        <Divider style={{ margin: "8px 0" }} />
        <Text
          type="secondary"
          style={{ fontSize: "12px", textAlign: "center" }}
        >
          * คำนวณจากภาระงานจริงเทียบกับมาตรฐาน 40 ชม./สัปดาห์
        </Text>
      </Flex>
    </Card>
  );
};

import { Divider } from "antd";
export default WorkloadAnalysis;
