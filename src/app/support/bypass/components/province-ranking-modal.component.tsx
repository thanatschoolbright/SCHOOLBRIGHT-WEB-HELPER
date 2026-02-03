"use client";

import {
  BankOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  ExperimentOutlined,
  FileDoneOutlined,
  GiftOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PieChartOutlined,
  StarFilled,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Flex,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  Title,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { ProvinceStatistics } from "../types/province-stats.types";

// * Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
);

const { Text, Title: AntTitle } = Typography;

type ProvinceRankingModalProps = {
  open: boolean;
  onClose: () => void;
  data: ProvinceStatistics[];
};

/**
 * * ProvinceRankingModal
 * * --------------------------------------------------------------------------
 * * Diplays detailed ranking and analysis of schools by province.
 * * Features detailed charts, summary cards, and a data table.
 * * --------------------------------------------------------------------------
 */
export default function ProvinceRankingModal({
  open,
  onClose,
  data,
}: ProvinceRankingModalProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();

  // * ==========================================================================
  // * DATA PREPARATION
  // * ==========================================================================

  const top10Data = useMemo(() => data.slice(0, 10), [data]);

  const statistics = useMemo(() => {
    return data.reduce(
      (accumulator, item) => ({
        totalSchools: accumulator.totalSchools + item.totalSchools,
        activeSchools: accumulator.activeSchools + item.activeSchools,
        gradeA: accumulator.gradeA + item.gradeACount,
        gradeB: accumulator.gradeB + item.gradeBCount,
        gradeC: accumulator.gradeC + item.gradeCCount,
        customerCount: accumulator.customerCount + (item.customerCount || 0),
        contractCount: accumulator.contractCount + (item.contractCount || 0),
        testCount: accumulator.testCount + (item.testCount || 0),
        freeCount: accumulator.freeCount + (item.freeCount || 0),
        otherCount: accumulator.otherCount + (item.otherCount || 0),
      }),
      {
        totalSchools: 0,
        activeSchools: 0,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0,
        customerCount: 0,
        contractCount: 0,
        testCount: 0,
        freeCount: 0,
        otherCount: 0,
      },
    );
  }, [data]);

  // * ==========================================================================
  // * CHART CONFIGURATION
  // * ==========================================================================

  const barChartData = {
    labels: top10Data.map((record) => record.province),
    datasets: [
      {
        label: "Active Schools",
        data: top10Data.map((record) => record.activeSchools),
        backgroundColor: token.colorSuccess,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: "Inactive Schools",
        data: top10Data.map((record) => record.inactiveSchools),
        backgroundColor: token.colorError,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const doughnutChartData = {
    labels: ["Grade A (Excellent)", "Grade B (Good)", "Grade C (Fair)"],
    datasets: [
      {
        data: [statistics.gradeA, statistics.gradeB, statistics.gradeC],
        backgroundColor: [
          token.colorWarning,
          token.colorSuccess,
          token.colorInfo,
        ],
        borderColor: token.colorBgContainer,
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const schoolDataTypeChartData = {
    labels: ["Customers", "Contract", "Test", "Free", "Islamic"],
    datasets: [
      {
        data: [
          statistics.customerCount,
          statistics.contractCount,
          statistics.testCount,
          statistics.freeCount,
          statistics.otherCount,
        ],
        backgroundColor: [
          "#3b82f6", // Blue
          "#10b981", // Emerald
          "#f59e0b", // Amber
          "#8b5cf6", // Violet
          "#6366f1", // Indigo
        ],
        borderColor: token.colorBgContainer,
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: token.colorText, font: { family: "Kanit" } },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { family: "Kanit", size: 14 },
        bodyFont: { family: "Kanit", size: 13 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: token.colorTextSecondary, font: { family: "Kanit" } },
        grid: { display: false },
      },
      y: {
        ticks: { color: token.colorTextSecondary, font: { family: "Kanit" } },
        grid: { color: token.colorBorderSecondary, borderDash: [4, 4] },
      },
    },
  };

  // * ==========================================================================
  // * TABLE COLUMNS (THAI)
  // * ==========================================================================

  const columns = useMemo<ColumnsType<ProvinceStatistics>>(
    () => [
      {
        title: "RANK",
        key: "rank",
        width: 80,
        align: "center",
        fixed: "left",
        render: (_value, _record, index) => {
          const rank = index + 1;
          if (rank === 1)
            return (
              <TrophyOutlined
                style={{
                  color: "#FFD700",
                  fontSize: 24,
                  filter: "drop-shadow(0 2px 4px rgba(255, 215, 0, 0.4))",
                }}
              />
            );
          if (rank === 2)
            return (
              <TrophyOutlined style={{ color: "#C0C0C0", fontSize: 20 }} />
            );
          if (rank === 3)
            return (
              <TrophyOutlined style={{ color: "#CD7F32", fontSize: 18 }} />
            );
          return (
            <Flex
              justify="center"
              align="center"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: token.colorFillSecondary,
                color: token.colorTextSecondary,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {rank}
            </Flex>
          );
        },
      },
      {
        title: "PROVINCE",
        dataIndex: "province",
        key: "province",
        width: 150,
        fixed: "left",
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: (
          <Space>
            <span>TOTAL</span>
            <Tooltip title="Total institutions in this province">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 100,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.totalSchools - secondRecord.totalSchools,
        render: (value) => <Text>{value.toLocaleString()}</Text>,
      },
      {
        title: (
          <Space>
            <span>ACTIVE</span>
            <Tooltip title="Schools with active systems">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activeSchools",
        key: "activeSchools",
        width: 100,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.activeSchools - secondRecord.activeSchools,
        render: (value) => (
          <Text type="success" strong>
            {value.toLocaleString()}
          </Text>
        ),
      },
      {
        title: (
          <Space>
            <span>RATE</span>
            <Tooltip title="System activation percentage">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activationRate",
        key: "activationRate",
        width: 150,
        sorter: (firstRecord, secondRecord) =>
          firstRecord.activationRate - secondRecord.activationRate,
        render: (value) => (
          <Tooltip title={`${value.toFixed(2)}% Active Rate`}>
            <Progress
              percent={value}
              size="small"
              strokeColor={{
                "0%": token.colorPrimary,
                "100%": token.colorSuccess,
              }}
              format={(percent) => (
                <span style={{ fontSize: 12 }}>{percent?.toFixed(0)}%</span>
              )}
            />
          </Tooltip>
        ),
      },
      {
        title: "CLIENTS",
        dataIndex: "customerCount",
        key: "customerCount",
        width: 100,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.customerCount - secondRecord.customerCount,
        render: (value) => <Text style={{ color: "#3b82f6" }}>{value}</Text>,
      },
      {
        title: "CONTRACTS",
        dataIndex: "contractCount",
        key: "contractCount",
        width: 110,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.contractCount - secondRecord.contractCount,
        render: (value) => <Text style={{ color: "#10b981" }}>{value}</Text>,
      },
      {
        title: "TEST",
        dataIndex: "testCount",
        key: "testCount",
        width: 100,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.testCount - secondRecord.testCount,
        render: (value) => <Text style={{ color: "#f59e0b" }}>{value}</Text>,
      },
      {
        title: "FREE",
        dataIndex: "freeCount",
        key: "freeCount",
        width: 100,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.freeCount - secondRecord.freeCount,
        render: (value) => <Text style={{ color: "#8b5cf6" }}>{value}</Text>,
      },
      {
        title: (
          <Space>
            <CrownOutlined style={{ color: token.colorWarning }} />
            <span>GRADE A</span>
          </Space>
        ),
        dataIndex: "gradeACount",
        key: "gradeACount",
        width: 100,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.gradeACount - secondRecord.gradeACount,
        render: (value) => (
          <Tag color="gold" bordered={false} style={{ fontWeight: 600 }}>
            {value} Schools
          </Tag>
        ),
      },
      {
        title: (
          <Space>
            <span>AVG GRADE</span>
            <Tooltip title="Average quality score across the province">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "averageGrade",
        key: "averageGrade",
        width: 120,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          parseFloat(firstRecord.averageGrade) -
          parseFloat(secondRecord.averageGrade),
        render: (value) => {
          const num = parseFloat(value);
          const color =
            num >= 3.5 ? "success" : num >= 2.5 ? "processing" : "error";
          return <Tag color={color}>{value}</Tag>;
        },
      },
    ],
    [token],
  );

  return (
    <Modal
      title={
        <Flex gap="middle" align="center">
          <Flex
            justify="center"
            align="center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: token.colorHighlight,
              color: token.colorPrimary,
            }}
          >
            <TrophyOutlined style={{ fontSize: 20 }} />
          </Flex>
          <Flex vertical>
            <Text strong style={{ fontSize: 18 }}>
              Province Rankings
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Top 10 provinces by school volume and quality analysis
            </Text>
          </Flex>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      width="95vw"
      style={{ top: 20 }}
      footer={null}
      destroyOnHidden
      centered
      styles={{
        content: {
          borderRadius: 24,
          overflow: "hidden",
          padding: 0,
        },
        header: {
          padding: "24px 32px",
          margin: 0,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
        body: {
          padding: "32px",
          backgroundColor: token.colorBgLayout,
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
        },
      }}
    >
      <Flex vertical gap={24}>
        {/* 1. Enhanced Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              variant="borderless"
              styles={{
                body: {
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                },
              }}
              style={{
                boxShadow: token.boxShadowTertiary,
              }}
            >
              <BankOutlined
                style={{
                  position: "absolute",
                  right: -20,
                  bottom: -20,
                  opacity: 0.05,
                  fontSize: 100,
                  color: token.colorInfo,
                  rotate: "12deg",
                }}
              />
              <Statistic
                title={
                  <Space>
                    <span>Total Schools</span>
                    <Tooltip title="All schools in database">
                      <InfoCircleOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      />
                    </Tooltip>
                  </Space>
                }
                value={statistics.totalSchools}
                prefix={<BankOutlined style={{ color: token.colorInfo }} />}
                valueStyle={{
                  fontWeight: 800,
                  color: token.colorText,
                  fontSize: 32,
                }}
                suffix={
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    Schools
                  </Text>
                }
              />
              <Tag color="blue" bordered={false} style={{ marginTop: 8 }}>
                Core Systems
              </Tag>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              variant="borderless"
              styles={{
                body: {
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                },
              }}
              style={{
                boxShadow: token.boxShadowTertiary,
              }}
            >
              <CheckCircleOutlined
                style={{
                  position: "absolute",
                  right: -20,
                  bottom: -20,
                  opacity: 0.05,
                  fontSize: 100,
                  color: token.colorSuccess,
                  rotate: "12deg",
                }}
              />
              <Statistic
                title={
                  <Space>
                    <span>Active Usage</span>
                    <Tooltip title="Schools with recent activity">
                      <InfoCircleOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      />
                    </Tooltip>
                  </Space>
                }
                value={statistics.activeSchools}
                prefix={
                  <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                }
                valueStyle={{
                  fontWeight: 800,
                  color: token.colorSuccess,
                  fontSize: 32,
                }}
                suffix={
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    (
                    {(
                      (statistics.activeSchools / statistics.totalSchools) *
                      100
                    ).toFixed(1)}
                    %)
                  </Text>
                }
              />
              <Tag color="green" bordered={false} style={{ marginTop: 8 }}>
                Online Now
              </Tag>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              variant="borderless"
              styles={{
                body: {
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                },
              }}
              style={{
                boxShadow: token.boxShadowTertiary,
              }}
            >
              <StarFilled
                style={{
                  position: "absolute",
                  right: -20,
                  bottom: -20,
                  opacity: 0.05,
                  fontSize: 100,
                  color: token.colorWarning,
                  rotate: "12deg",
                }}
              />
              <Statistic
                title={
                  <Space>
                    <span>Grade A Quality</span>
                    <Tooltip title="Schools meeting excellence criteria">
                      <InfoCircleOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      />
                    </Tooltip>
                  </Space>
                }
                value={statistics.gradeA}
                prefix={<CrownOutlined style={{ color: token.colorWarning }} />}
                valueStyle={{
                  fontWeight: 800,
                  color: token.colorWarning,
                  fontSize: 32,
                }}
                suffix={
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    Excellence
                  </Text>
                }
              />
              <Tag color="warning" bordered={false} style={{ marginTop: 8 }}>
                Top Performers
              </Tag>
            </Card>
          </Col>
        </Row>

        {/* 2. School Data Type Summary Cards */}
        <Flex vertical gap="middle">
          <AntTitle level={5} style={{ margin: 0 }}>
            <Flex gap="small" align="center">
              <InfoCircleOutlined style={{ color: token.colorPrimary }} />
              <span>School Category Statistics</span>
            </Flex>
          </AntTitle>
          <Row gutter={[16, 16]}>
            {[
              {
                title: "Customers",
                value: statistics.customerCount,
                icon: <TeamOutlined />,
                color: "#3b82f6",
              },
              {
                title: "Contracts",
                value: statistics.contractCount,
                icon: <FileDoneOutlined />,
                color: "#10b981",
              },
              {
                title: "Trial/Test",
                value: statistics.testCount,
                icon: <ExperimentOutlined />,
                color: "#f59e0b",
              },
              {
                title: "Free Tier",
                value: statistics.freeCount,
                icon: <GiftOutlined />,
                color: "#8b5cf6",
              },
              {
                title: "Islamic Cur.",
                value: statistics.otherCount,
                icon: <GlobalOutlined />,
                color: "#6366f1",
              },
            ].map((item, index) => (
              <Col
                xs={24}
                sm={12}
                lg={index === 4 ? 4.8 : 4.8}
                style={{ flex: "1 0 18%" }}
                key={item.title}
              >
                <Card
                  variant="borderless"
                  styles={{
                    body: {
                      borderRadius: 16,
                      position: "relative",
                      overflow: "hidden",
                    },
                  }}
                  style={{
                    boxShadow: token.boxShadowTertiary,
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: -10,
                      bottom: -10,
                      opacity: 0.05,
                      fontSize: 60,
                      color: item.color,
                      rotate: "12deg",
                    }}
                  >
                    {item.icon}
                  </div>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.title}
                      </Text>
                    }
                    value={item.value}
                    valueStyle={{
                      fontWeight: 800,
                      color: item.color,
                      fontSize: 28,
                    }}
                    suffix={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Units
                      </Text>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Flex>

        {/* 3. Charts Analysis Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              title={
                <Flex gap="small" align="center">
                  <BarChartOutlined style={{ color: token.colorPrimary }} />
                  <span>Top 10 Comparison</span>
                </Flex>
              }
              style={{ boxShadow: token.boxShadowTertiary, height: "100%" }}
              styles={{ body: { height: 450 } }}
            >
              <Bar options={chartOptions} data={barChartData} />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              variant="borderless"
              title={
                <Flex gap="small" align="center">
                  <PieChartOutlined style={{ color: token.colorSuccess }} />
                  <span>Quality Ratio</span>
                </Flex>
              }
              style={{ boxShadow: token.boxShadowTertiary, height: "100%" }}
              styles={{
                body: {
                  height: 450,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            >
              <Doughnut
                data={doughnutChartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: token.colorText,
                        padding: 10,
                        font: { size: 10 },
                      },
                    },
                  },
                }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              variant="borderless"
              title={
                <Flex gap="small" align="center">
                  <PieChartOutlined style={{ color: token.colorInfo }} />
                  <span>Category Ratio</span>
                </Flex>
              }
              style={{ boxShadow: token.boxShadowTertiary, height: "100%" }}
              styles={{
                body: {
                  height: 450,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            >
              <Doughnut
                data={schoolDataTypeChartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: token.colorText,
                        padding: 10,
                        font: { size: 10 },
                      },
                    },
                  },
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 4. Detailed Table */}
        <Card
          variant="borderless"
          title={
            <Flex gap="small" align="center">
              <TrophyOutlined style={{ color: token.colorWarning }} />
              <span>Province Rankings Table</span>
            </Flex>
          }
          style={{
            boxShadow: token.boxShadowTertiary,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          styles={{
            body: { padding: 0 },
            header: { borderBottom: `1px solid ${token.colorBorderSecondary}` },
          }}
        >
          <Table
            columns={columns}
            dataSource={top10Data}
            rowKey="province"
            pagination={false}
            scroll={{ x: 1400, y: "calc(100vh - 450px)" }}
            size="middle"
          />
        </Card>
      </Flex>
    </Modal>
  );
}
