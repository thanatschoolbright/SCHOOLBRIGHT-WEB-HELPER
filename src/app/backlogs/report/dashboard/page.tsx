"use client";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import BackendLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  List,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  theme,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface AnalyticsItem {
  id: number;
  name: string;
  total: number;
  closed: number;
  open: number;
  in_progress: number;
  efficiency: number;
  avatarUrl: string;
}

export default function DashboardPage(): JSX.Element {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsItem[]>([]);
  const [space, setSpace] = useState<string>("jabjai");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    [dayjs("2026-03-23"), dayjs("2026-03-27")],
  );

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params: any = {
        space,
      };

      if (dateRange) {
        params.createdSince = dateRange[0].format("YYYY-MM-DD");
        params.createdUntil = dateRange[1].format("YYYY-MM-DD");
      }

      const response = await axios.get("/api/v1/backlog/dashboard/analytics", {
        params,
      });
      setAnalyticsData(response.data?.data || []);
      toast.success("ดึงข้อมูลการทำงานพนักงานสำเร็จ");
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูล Dashboard ได้");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [space]);

  const totalStats = analyticsData.reduce(
    (acc, curr) => ({
      total: acc.total + curr.total,
      closed: acc.closed + curr.closed,
      open: acc.open + (curr.open || 0),
    }),
    { total: 0, closed: 0, open: 0 },
  );

  return (
    <BackendLayout>
      <HeaderBar
        title="แดชบอร์ดติดตามประสิทธิภาพงาน (Backlog)"
        subTitle="วิเคราะห์ปริมาณงานรายพนักงานและประสิทธิภาพการปิดงานในช่วงเวลาที่กำหนด"
        icon={<AppstoreOutlined />}
      />

      <div className="mt-6 flex w-full flex-col gap-6">
        {/* ส่วนที่ 1: ตัวเลือกเงื่อนไข (Filters) */}
        <Card variant="borderless" className="shadow-sm">
          <Row gutter={[24, 16]} align="bottom">
            <Col xs={24} md={8}>
              <Space direction="vertical" className="w-full" size={4}>
                <Text strong style={{ fontSize: "0.85rem" }}>
                  ชื่อ Space (Sub-domain)
                </Text>
                <Select
                  className="w-full"
                  size="large"
                  value={space}
                  onChange={setSpace}
                  options={[
                    { label: "Jabjai (jabjai)", value: "jabjai" },
                    {
                      label: "School Bright (schoolbright)",
                      value: "schoolbright",
                    },
                  ]}
                />
              </Space>
            </Col>
            <Col xs={24} md={10}>
              <Space direction="vertical" className="w-full" size={4}>
                <Text strong style={{ fontSize: "0.85rem" }}>
                  ช่วงเวลาที่ต้องการตรวจสอบ (Tracking Period)
                </Text>
                <RangePicker
                  className="w-full"
                  size="large"
                  format="DD/MM/YYYY"
                  value={dateRange}
                  onChange={(dates: any) => setDateRange(dates)}
                />
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                block
                onClick={fetchAnalytics}
                loading={loading}
              >
                อัปเดตข้อมูล
              </Button>
            </Col>
          </Row>
        </Card>

        {/* ส่วนที่ 2: สรุปภาพรวม (Summary Cards) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="จำนวนงานที่พบทั้งหมด"
              value={totalStats.total}
              icon={<FileTextOutlined />}
              color={token.colorPrimary}
              suffix="งาน"
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="ปิดงานแล้ว (Closed)"
              value={totalStats.closed}
              icon={<CheckCircleOutlined />}
              color={token.colorSuccess}
              suffix="งาน"
              isLoading={loading}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="งานคงค้าง (Open/Pending)"
              value={totalStats.total - totalStats.closed}
              icon={<ClockCircleOutlined />}
              color={token.colorError}
              suffix="งาน"
              isLoading={loading}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: อันดับปริมาณงาน (Workload Ranking) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <TeamOutlined />
                  <span>ปริมาณงานรายรายพนักงาน (Backlog Load)</span>
                </Space>
              }
              variant="borderless"
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

          {/* ส่วนที่ 4: Top Performer (วัดผลประเมิน) */}
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
            >
              <Flex vertical gap={16}>
                {analyticsData
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
                          index === 0
                            ? `${token.colorSuccess}08`
                            : "transparent",
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
      </div>
    </BackendLayout>
  );
}
