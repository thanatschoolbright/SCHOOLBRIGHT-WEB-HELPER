"use client";

import {
  FilterOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text } = Typography;

/**
 * ตารางแสดงรายการงานที่ยังทำไม่เสร็จ (Pending Tasks) พร้อมตัวกรองรายพนักงาน
 */
export const PendingTasksTable = () => {
  const { analyticsData, loading, selectedAssigneeId, setSelectedAssigneeId } =
    useBacklogDashboardStore();

  const currentAssigneeData = selectedAssigneeId
    ? analyticsData.find((a) => a.id === selectedAssigneeId)
    : null;

  const tableData = selectedAssigneeId
    ? currentAssigneeData?.issues || []
    : analyticsData.flatMap((a) =>
        (a.issues || []).map((i) => ({
          ...i,
          assigneeName: a.name,
          assigneeAvatar: a.avatarUrl,
        })),
      );

  return (
    <Card
      title={
        <Flex justify="space-between" align="center">
          <Space>
            <FilterOutlined style={{ fontSize: "1rem" }} />
            <span style={{ fontWeight: 600 }}>ตัวกรองงานค้างรายบุคคล</span>
          </Space>
        </Flex>
      }
      variant="borderless"
      className="shadow-sm"
      styles={{ body: { padding: 16 } }}
    >
      <Flex vertical gap={24}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={12}>
            <Space direction="vertical" className="w-full" size={4}>
              <Text strong style={{ fontSize: "0.85rem" }}>
                เลือกพนักงานเพื่อดูงานค้าง
              </Text>
              <Select
                className="w-full"
                placeholder="ค้นหาชื่อพนักงาน..."
                size="large"
                allowClear
                showSearch
                optionFilterProp="label"
                value={selectedAssigneeId}
                onChange={setSelectedAssigneeId}
                options={analyticsData.map((emp) => ({
                  label: `${emp.name} (ค้าง ${emp.total - emp.closed} งาน)`,
                  value: emp.id,
                }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Flex justify="end">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setSelectedAssigneeId(null)}
              >
                ล้างตัวกรอง
              </Button>
            </Flex>
          </Col>
        </Row>

        <Divider style={{ margin: 0 }} />

        <div className="relative">
          <Space style={{ marginBottom: 16 }}>
            <UnorderedListOutlined style={{ fontSize: "1rem" }} />
            <Text strong>รายการงานค้าง (Pending Tasks)</Text>
          </Space>

          <Table
            loading={loading}
            dataSource={tableData}
            pagination={{ pageSize: 10 }}
            rowKey="key"
            columns={[
              {
                title: "เลข Task",
                dataIndex: "key",
                key: "key",
                sorter: (a, b) => a.key.localeCompare(b.key),
                render: (key) => <Tag color="blue">{key}</Tag>,
              },
              {
                title: "หัวข้องาน",
                dataIndex: "summary",
                key: "summary",
                sorter: (a, b) => a.summary.localeCompare(b.summary),
                ellipsis: true,
              },
              {
                title: "พนักงาน",
                key: "assignee",
                render: (_, record: any) => {
                  const name = record.assigneeName || currentAssigneeData?.name;
                  const avatar =
                    record.assigneeAvatar || currentAssigneeData?.avatarUrl;
                  return (
                    <Space>
                      <Avatar size="small" src={avatar || null} />
                      <Text>{name || "-"}</Text>
                    </Space>
                  );
                },
              },
              {
                title: "สถานะ",
                dataIndex: "status",
                key: "status",
                render: (status) => (
                  <Tag
                    color={
                      status.toLowerCase().includes("progress")
                        ? "orange"
                        : "default"
                    }
                  >
                    {status}
                  </Tag>
                ),
              },
            ]}
          />
        </div>
      </Flex>
    </Card>
  );
};
