"use client";

import { TeamOutlined, TrophyOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Card,
  Col,
  Flex,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  theme,
  Typography,
} from "antd";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text, Title } = Typography;

/**
 * แสดงอันดับปริมาณงานและประสิทธิภาพรายพนักงาน
 */
export const RankingSection = () => {
  const { token } = theme.useToken();
  const { analyticsData, loading } = useBacklogDashboardStore();

  return (
    <Row gutter={[16, 16]}>
      {/* Workload Ranking */}
      <Col xs={24} lg={16}>
        <Card
          title={
            <Space>
              <TeamOutlined />
              <span>ปริมาณงานรายรายพนักงาน (Backlog Load)</span>
            </Space>
          }
          variant="borderless"
          styles={{ body: { padding: 16 } }}
        >
          <List
            loading={loading}
            dataSource={analyticsData}
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
                      <Flex justify="space-between">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          สถานะ: เสร็จแล้ว {item.closed} / ค้าง{" "}
                          {item.total - item.closed}
                        </Text>
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
