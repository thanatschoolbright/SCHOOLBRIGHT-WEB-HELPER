"use client";

import {
  ArrowRightOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Flex,
  Input,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text, Title } = Typography;

/**
 * แสดงอันดับปริมาณงานและประสิทธิภาพรายพนักงาน
 */
export const RankingSection = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const { analyticsData, loading, searchName, setSearchName, space } =
    useBacklogDashboardStore();

  const filteredData = [...analyticsData]
    .filter((item) => {
      const name = item.name || "";
      const search = searchName || "";
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.pending_tasks - a.pending_tasks);

  return (
    <Row gutter={[16, 16]}>
      {/* Workload Ranking */}
      <Col xs={24} lg={16}>
        <Card
          title={
            <Flex
              justify="space-between"
              align="center"
              style={{ width: "100%" }}
            >
              <Space>
                <TeamOutlined />
                <span>ปริมาณงานรายรายพนักงาน (Backlog Load)</span>
              </Space>
              <Input
                placeholder="ค้นหาชื่อพนักงาน..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                allowClear
              />
            </Flex>
          }
          variant="borderless"
          styles={{ body: { padding: 16 } }}
        >
          <List
            loading={loading}
            dataSource={filteredData}
            pagination={{ pageSize: 5, size: "small", align: "center" }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Statistic
                    key="total"
                    title="รวม"
                    value={item.total}
                    suffix="งาน"
                    valueStyle={{ fontSize: 16, fontWeight: 700 }}
                  />,
                  <Tooltip key="view" title="ดูรายการงานทั้งหมดของพนักงานคนนี้">
                    <Button
                      type="link"
                      size="small"
                      icon={<ArrowRightOutlined />}
                      onClick={() =>
                        router.push(
                          `/backlogs/issues?space=${space}&assigneeId=${item.id}`,
                        )
                      }
                    >
                      ยอดงาน
                    </Button>
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={item.avatarUrl || null}
                      icon={<UserOutlined />}
                      size={48}
                    />
                  }
                  title={
                    <Text strong style={{ fontSize: 16 }}>
                      {item.name}
                    </Text>
                  }
                  description={
                    <Space
                      direction="vertical"
                      size={2}
                      className="w-full mt-2"
                    >
                      <Flex justify="space-between" align="center">
                        <Space>
                          <Tag
                            color={
                              item.capacity_status === "งานล้นมือ"
                                ? "error"
                                : item.capacity_status === "งานน้อย"
                                  ? "success"
                                  : "processing"
                            }
                          >
                            {item.capacity_status}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            สถานะ: กำลังทำ {item.active_tasks} / ค้าง{" "}
                            {item.pending_tasks}
                          </Text>
                        </Space>
                        <Text strong style={{ color: token.colorSuccess }}>
                          {item.efficiency}% ประสิทธิภาพ
                        </Text>
                      </Flex>
                      <Progress
                        percent={item.efficiency}
                        showInfo={false}
                        strokeColor={
                          item.efficiency >= 80
                            ? token.colorSuccess
                            : item.efficiency >= 50
                              ? token.colorWarning
                              : token.colorError
                        }
                      />
                      <Flex justify="space-between">
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Load Value: {item.load_value}{" "}
                          (ค่าประมาณการที่ต้องใช้จัดการงานค้าง)
                        </Text>
                      </Flex>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>

      {/* Efficiency Award */}
      <Col xs={24} lg={8}>
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: "#faad14" }} />
              <span>รางวัลประสิทธิภาพ (Efficiency Ranking)</span>
            </Space>
          }
          variant="borderless"
          style={{ height: "100%" }}
          styles={{ body: { padding: 16 } }}
        >
          <Flex vertical gap={16}>
            {[...analyticsData]
              .sort((a, b) => b.efficiency - a.efficiency)
              .slice(0, 5)
              .map((item, index) => (
                <Card
                  key={item.id}
                  size="small"
                  styles={{ body: { padding: 12 } }}
                  style={{
                    border:
                      index === 0
                        ? `1px solid ${token.colorSuccess}`
                        : `1px solid ${token.colorBorderSecondary}`,
                    background:
                      index === 0 ? `${token.colorSuccess}08` : "transparent",
                  }}
                >
                  <Flex align="center" gap={12}>
                    <Badge
                      count={index + 1}
                      color={
                        index === 0
                          ? "#faad14"
                          : index === 1
                            ? "#bfbfbf"
                            : index === 2
                              ? "#d46b08"
                              : "#d9d9d9"
                      }
                    />
                    <Avatar src={item.avatarUrl || null} size="large" />
                    <Flex vertical>
                      <Text strong>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ปิดงาน {item.closed} รายการ
                      </Text>
                    </Flex>
                    <Flex flex={1} justify="flex-end">
                      <Title
                        level={4}
                        style={{ margin: 0, color: token.colorSuccess }}
                      >
                        {item.efficiency}%
                      </Title>
                    </Flex>
                  </Flex>
                </Card>
              ))}
          </Flex>
        </Card>
      </Col>
    </Row>
  );
};
