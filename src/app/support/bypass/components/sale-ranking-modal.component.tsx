"use client";

import { useMemo, useState } from "react";

import {
  DollarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  Input,
  Modal,
  Progress,
  Row,
  Segmented,
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
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { toast } from "sonner"; // Import sonner toast
import type { SaleStatistics } from "../types/sale-stats.types";

// * Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler,
);

const { Text } = Typography;

type SaleRankingModalProps = {
  open: boolean;
  onClose: () => void;
  data: SaleStatistics[];
};

const SECRET_CODE = "LIGHT";
const INCOME_PER_STUDENT = 250; // THB per term

/**
 * * SaleRankingModal
 * * --------------------------------------------------------------------------
 * * Displays detailed performance analysis of sales representatives.
 * * Features:
 * * - Top 5 Sales Analysis Chart (Active vs Inactive Schools)
 * * - School Grade Distribution Overview
 * * - Interactive Summary Cards with tooltips
 * * - Comprehensive Data Table
 * * - Secure Income Analysis (Requires "LIGHT" code)
 * * --------------------------------------------------------------------------
 */
export default function SaleRankingModal({
  open,
  onClose,
  data,
}: SaleRankingModalProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const [isIncomeVisible, setIsIncomeVisible] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "customer" | "contract">(
    "all",
  );

  // * ==========================================================================
  // * AUTHENTICATION FOR INCOME
  // * ==========================================================================
  const handleUnlockIncome = () => {
    if (passcode === SECRET_CODE) {
      setIsIncomeVisible(true);
      setShowPasscodeInput(false);
      toast.success(TRANSLATION("bypass_page.ranking.toast_unlock_success"));
    } else {
      toast.error(TRANSLATION("bypass_page.ranking.toast_unlock_error"));
    }
  };

  const handleTogglePasscodeInput = () => {
    if (isIncomeVisible) {
      setIsIncomeVisible(false);
      setPasscode("");
    } else {
      setShowPasscodeInput(!showPasscodeInput);
    }
  };

  // * ==========================================================================
  // * DATA PREPARATION
  // * ==========================================================================

  // Sort by Total Schools desc for Top 5 Chart
  const top5Sales = useMemo(() => {
    return [...data]
      .sort(
        (firstSale, secondSale) =>
          secondSale.totalSchools - firstSale.totalSchools,
      )
      .slice(0, 5);
  }, [data]);

  const statistics = useMemo(() => {
    const calculated = data.reduce(
      (accumulator, item) => ({
        totalSchools: accumulator.totalSchools + item.totalSchools,
        activeSchools: accumulator.activeSchools + item.activeSchools,
        totalStudents: accumulator.totalStudents + item.totalStudents,
        payingStudents:
          accumulator.payingStudents +
          (item.customerStudents + item.contractStudents),
        totalIncome:
          accumulator.totalIncome +
          (item.customerStudents + item.contractStudents) * INCOME_PER_STUDENT,
        customerStudents: accumulator.customerStudents + item.customerStudents,
        contractStudents: accumulator.contractStudents + item.contractStudents,
        testStudents: accumulator.testStudents + item.testStudents,
        freeStudents: accumulator.freeStudents + item.freeStudents,
        otherStudents: accumulator.otherStudents + item.otherStudents,
        gradeA: accumulator.gradeA + item.gradeACount,
        gradeB: accumulator.gradeB + item.gradeBCount,
        gradeC: accumulator.gradeC + item.gradeCCount,
        totalTargetStudents:
          accumulator.totalTargetStudents + item.targetStudents,
      }),
      {
        totalSchools: 0,
        activeSchools: 0,
        totalStudents: 0,
        payingStudents: 0,
        totalIncome: 0,
        customerStudents: 0,
        contractStudents: 0,
        testStudents: 0,
        freeStudents: 0,
        otherStudents: 0,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0,
        totalTargetStudents: 0,
      },
    );
    return calculated;
  }, [data]);

  // * ==========================================================================
  // * CHART CONFIGURATION
  // * ==========================================================================

  // * Bar Chart: Top 5 Sales Performance (Stacked or Grouped)
  const barChartData = {
    labels: top5Sales.map((sale) => sale.saleName),
    datasets: [
      {
        label: `${TRANSLATION("bypass_page.ranking.customers")}/${TRANSLATION("bypass_page.ranking.contracts")}`,
        data: top5Sales.map((sale) => sale.customerCount + sale.contractCount),
        backgroundColor: "#3b82f6",
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: `${TRANSLATION("bypass_page.ranking.trial_test")}/${TRANSLATION("bypass_page.ranking.free_tier")}`,
        data: top5Sales.map((sale) => sale.testCount + sale.freeCount),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  // * Doughnut Chart: Overall Grade Distribution managed by Sales
  const doughnutChartData = {
    labels: [
      TRANSLATION("bypass_page.ranking.grade_a"),
      TRANSLATION("bypass_page.ranking.grade_b"),
      TRANSLATION("bypass_page.ranking.grade_c"),
    ],
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

  // * Doughnut Chart: School Type Distribution
  const typeDoughnutData = {
    labels: [
      TRANSLATION("bypass_page.ranking.customers"),
      TRANSLATION("bypass_page.ranking.contracts"),
      TRANSLATION("bypass_page.ranking.trial_test"),
      TRANSLATION("bypass_page.ranking.free_tier"),
      TRANSLATION("bypass_page.ranking.islamic_cur"),
    ],
    datasets: [
      {
        data: [
          statistics.customerStudents,
          statistics.contractStudents,
          statistics.testStudents,
          statistics.freeStudents,
          statistics.otherStudents,
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
        labels: { color: token.colorText, font: { family: "Google Sans" } },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { family: "Google Sans", size: 14 },
        bodyFont: { family: "Google Sans", size: 13 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: token.colorTextSecondary, font: { family: "Google Sans" } },
        grid: { display: false },
      },
      y: {
        ticks: { color: token.colorTextSecondary, font: { family: "Google Sans" } },
        grid: { color: token.colorBorderSecondary, borderDash: [4, 4] },
      },
    },
  };

  // * ==========================================================================
  // * TABLE COLUMNS (THAI)
  // * ==========================================================================

  const columns = useMemo<ColumnsType<SaleStatistics>>(
    () => [
      {
        title: TRANSLATION("bypass_page.ranking.col_rank"),
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
        title: TRANSLATION("bypass_page.ranking.col_sales_rep"),
        dataIndex: "saleName",
        key: "saleName",
        width: 180,
        fixed: "left",
        render: (text) => (
          <Flex gap="small" align="center">
            <UserOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{text}</Text>
          </Flex>
        ),
      },
      {
        key: "viewModeSwitcher",
        width: 250,
        fixed: "left",
        title: (
          <Segmented
            size="small"
            value={viewMode}
            onChange={(value) => setViewMode(value as any)}
            options={[
              {
                label: TRANSLATION("bypass_page.ranking.view_all"),
                value: "all",
              },
              {
                label: TRANSLATION("bypass_page.ranking.view_sales"),
                value: "customer",
              },
              {
                label: TRANSLATION("bypass_page.ranking.view_contract"),
                value: "contract",
              },
            ]}
          />
        ),
        render: (_, record) => {
          const currentStudents =
            viewMode === "all"
              ? record.customerStudents + record.contractStudents
              : viewMode === "customer"
                ? record.customerStudents
                : record.contractStudents;
          const currentSchools =
            viewMode === "all"
              ? record.customerCount + record.contractCount
              : viewMode === "customer"
                ? record.customerCount
                : record.contractCount;

          return (
            <Flex vertical gap={0}>
              <Text strong>
                {currentSchools}{" "}
                {TRANSLATION("bypass_page.ranking.schools_unit")} (
                {viewMode.toUpperCase()})
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {TRANSLATION("bypass_page.ranking.students")}:{" "}
                {currentStudents.toLocaleString()}
              </Text>
            </Flex>
          );
        },
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_kpi"),
        key: "kpi",
        width: 180,
        align: "center",
        render: (_, record) => {
          const paying = record.customerStudents + record.contractStudents;
          const percent = Math.min(100, (paying / record.targetStudents) * 100);
          const color =
            percent >= 100
              ? token.colorSuccess
              : percent >= 80
                ? token.colorWarning
                : token.colorError;
          return (
            <Flex vertical style={{ width: "100%", padding: "0 8px" }}>
              <Flex
                justify="space-between"
                align="center"
                style={{ marginBottom: 4 }}
              >
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {TRANSLATION("bypass_page.ranking.col_target")}:{" "}
                  {record.targetStudents.toLocaleString()}
                </Text>
                <Text strong style={{ fontSize: 10, color }}>
                  {percent.toFixed(1)}%
                </Text>
              </Flex>
              <Progress
                percent={percent}
                size="small"
                strokeColor={color}
                showInfo={false}
              />
            </Flex>
          );
        },
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_total_managed"),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 120,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.totalSchools - secondSale.totalSchools,
        render: (value) => <Text>{value.toLocaleString()}</Text>,
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_revenue_sources"),
        key: "payingSchools",
        width: 150,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.customerCount +
          firstSale.contractCount -
          (secondSale.customerCount + secondSale.contractCount),
        render: (_, record) => (
          <Tooltip
            title={
              <Flex vertical gap={4}>
                <Text style={{ color: "white", fontSize: 12 }}>
                  {TRANSLATION("bypass_page.ranking.customers")}:{" "}
                  {record.customerCount} (
                  {record.customerStudents.toLocaleString()}{" "}
                  {TRANSLATION("bypass_page.ranking.students")})
                </Text>
                <Text style={{ color: "white", fontSize: 12 }}>
                  {TRANSLATION("bypass_page.ranking.contracts")}:{" "}
                  {record.contractCount} (
                  {record.contractStudents.toLocaleString()}{" "}
                  {TRANSLATION("bypass_page.ranking.students")})
                </Text>
              </Flex>
            }
          >
            <Flex vertical align="end" gap={0}>
              <Text strong style={{ color: token.colorInfo }}>
                {(record.customerCount + record.contractCount).toLocaleString()}{" "}
                {TRANSLATION("bypass_page.ranking.schools_unit")}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {(
                  record.customerStudents + record.contractStudents
                ).toLocaleString()}{" "}
                {TRANSLATION("bypass_page.ranking.students")}
              </Text>
            </Flex>
          </Tooltip>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_trial_free"),
        key: "nonPayingSchools",
        width: 150,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.testCount +
          firstSale.freeCount -
          (secondSale.testCount + secondSale.freeCount),
        render: (_, record) => (
          <Tooltip
            title={
              <Flex vertical gap={4}>
                <Text style={{ color: "white", fontSize: 12 }}>
                  {TRANSLATION("bypass_page.ranking.trial_test")}:{" "}
                  {record.testCount} ({record.testStudents.toLocaleString()}{" "}
                  {TRANSLATION("bypass_page.ranking.students")})
                </Text>
                <Text style={{ color: "white", fontSize: 12 }}>
                  {TRANSLATION("bypass_page.ranking.free_tier")}:{" "}
                  {record.freeCount} ({record.freeStudents.toLocaleString()}{" "}
                  {TRANSLATION("bypass_page.ranking.students")})
                </Text>
              </Flex>
            }
          >
            <Flex vertical align="end" gap={0}>
              <Text strong style={{ color: token.colorWarning }}>
                {(record.testCount + record.freeCount).toLocaleString()}{" "}
                {TRANSLATION("bypass_page.ranking.schools_unit")}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {(record.testStudents + record.freeStudents).toLocaleString()}{" "}
                {TRANSLATION("bypass_page.ranking.students")}
              </Text>
            </Flex>
          </Tooltip>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_est_income"),
        key: "estimatedIncome",
        width: 160,
        align: "right",
        render: (_, record) =>
          isIncomeVisible ? (
            <Text type="success" strong>
              {(
                (record.customerStudents + record.contractStudents) *
                INCOME_PER_STUDENT
              ).toLocaleString()}{" "}
              ฿
            </Text>
          ) : (
            <Text
              type="secondary"
              style={{ filter: "blur(4px)", userSelect: "none" }}
            >
              ••••••
            </Text>
          ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_active"),
        dataIndex: "activeSchools",
        key: "activeSchools",
        width: 100,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.activeSchools - secondSale.activeSchools,
        render: (value) => (
          <Text type="success" strong>
            {value.toLocaleString()}
          </Text>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_rate"),
        dataIndex: "activationRate",
        key: "activationRate",
        width: 150,
        sorter: (firstSale, secondSale) =>
          firstSale.activationRate - secondSale.activationRate,
        render: (value) => (
          <Tooltip
            title={`${value.toFixed(2)}% ${TRANSLATION("bypass_page.ranking.col_rate_desc")}`}
          >
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
        title: TRANSLATION("bypass_page.ranking.col_students"),
        dataIndex: "totalStudents",
        key: "totalStudents",
        width: 120,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.totalStudents - secondSale.totalStudents,
        render: (value) => (
          <Tag color="purple" bordered={false}>
            {value.toLocaleString()}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_grade_a"),
        dataIndex: "gradeACount",
        key: "gradeACount",
        width: 100,
        align: "center",
        sorter: (firstSale, secondSale) =>
          firstSale.gradeACount - secondSale.gradeACount,
        render: (value) => (
          <Tag color="gold" bordered={false} style={{ fontWeight: 600 }}>
            {value} {TRANSLATION("bypass_page.ranking.schools_unit")}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_avg_per_school"),
        dataIndex: "averageStudentsPerSchool",
        key: "averageStudentsPerSchool",
        width: 120,
        align: "center",
        sorter: (a, b) =>
          a.averageStudentsPerSchool - b.averageStudentsPerSchool,
        render: (val) => (
          <Text type="secondary">{Math.round(val).toLocaleString()}</Text>
        ),
      },
    ],
    [token, isIncomeVisible, TRANSLATION, viewMode],
  );

  return (
    <Modal
      title={
        <Flex
          justify="space-between"
          align="center"
          style={{ width: "100%", paddingRight: 32 }}
        >
          <Flex gap="middle" align="center">
            <Flex
              justify="center"
              align="center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: token.colorWarningBg,
                color: token.colorWarning,
              }}
            >
              <TrophyOutlined style={{ fontSize: 24 }} />
            </Flex>
            <Flex vertical>
              <Text strong style={{ fontSize: 20 }}>
                {TRANSLATION("bypass_page.ranking.sale_modal_title")}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {TRANSLATION("bypass_page.ranking.sale_modal_subtitle")}
              </Text>
            </Flex>
          </Flex>

          <Flex gap="small">
            {showPasscodeInput ? (
              <Space.Compact>
                <Input.Password
                  placeholder={TRANSLATION(
                    "bypass_page.ranking.placeholder_passcode",
                  )}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onPressEnter={handleUnlockIncome}
                  style={{ width: 140 }}
                />
                <Button type="primary" onClick={handleUnlockIncome}>
                  {TRANSLATION("bypass_page.ranking.btn_unlock")}
                </Button>
                <Button onClick={() => setShowPasscodeInput(false)}>
                  {TRANSLATION("bypass_page.ranking.btn_cancel")}
                </Button>
              </Space.Compact>
            ) : (
              <Button
                type={isIncomeVisible ? "primary" : "default"}
                icon={
                  isIncomeVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
                onClick={handleTogglePasscodeInput}
                style={{
                  borderRadius: 20,
                  backgroundColor: isIncomeVisible
                    ? token.colorSuccess
                    : undefined,
                  borderColor: isIncomeVisible ? token.colorSuccess : undefined,
                }}
              >
                {isIncomeVisible
                  ? TRANSLATION("bypass_page.ranking.btn_income_visible")
                  : TRANSLATION("bypass_page.ranking.btn_reveal_income")}
              </Button>
            )}
          </Flex>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      width="98%"
      style={{ top: 10 }}
      footer={null}
      destroyOnHidden
      styles={{
        content: {
          borderRadius: 24,
          overflow: "hidden",
          padding: 0,
          minHeight: "95vh",
        },
        header: {
          padding: "20px 32px",
          margin: 0,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        },
        body: {
          padding: "32px",
          backgroundColor: token.colorBgLayout,
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        },
      }}
    >
      <Flex vertical gap={32}>
        {/* 1. Summary Cards */}
        <Row gutter={[20, 20]}>
          {[
            {
              title: TRANSLATION("bypass_page.ranking.stat_total_sales_team"),
              value: data.length,
              icon: <UserOutlined />,
              color: token.colorPrimary,
              bgColor: token.colorPrimaryBg,
              subtitle: TRANSLATION("bypass_page.ranking.stat_active_reps"),
            },
            {
              title: TRANSLATION(
                "bypass_page.ranking.stat_total_active_schools",
              ),
              value: statistics.activeSchools,
              icon: <TeamOutlined />,
              color: token.colorSuccess,
              bgColor: token.colorSuccessBg,
              subtitle: `${TRANSLATION("bypass_page.ranking.stat_across")} ${statistics.totalSchools} ${TRANSLATION("bypass_page.ranking.stat_managed")}`,
            },
            {
              title: TRANSLATION("bypass_page.ranking.stat_student_reach"),
              value: statistics.totalStudents,
              icon: <RocketOutlined />,
              color: "#8b5cf6",
              bgColor: "#f5f3ff",
              subtitle: TRANSLATION(
                "bypass_page.ranking.stat_total_students_impacted",
              ),
            },
            {
              title: TRANSLATION("bypass_page.ranking.stat_est_revenue"),
              value: isIncomeVisible ? statistics.totalIncome : "••••••",
              icon: <DollarOutlined />,
              color: token.colorWarning,
              bgColor: token.colorWarningBg,
              subtitle: TRANSLATION(
                "bypass_page.ranking.stat_projected_income",
              ),
              isMoney: isIncomeVisible,
            },
          ].map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.title}>
              <Card
                variant="borderless"
                styles={{
                  body: {
                    borderRadius: 24,
                    position: "relative",
                    overflow: "hidden",
                    height: "100%",
                  },
                }}
                style={{
                  background: card.bgColor,
                  boxShadow: token.boxShadowTertiary,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: -20,
                    top: -20,
                    opacity: 0.1,
                    fontSize: 100,
                    color: card.color,
                    rotate: "12deg",
                  }}
                >
                  {card.icon}
                </div>
                <Statistic
                  title={
                    <Text strong style={{ color: card.color }}>
                      {card.title}
                    </Text>
                  }
                  value={card.value}
                  formatter={(value) =>
                    typeof value === "number"
                      ? value.toLocaleString() + (card.isMoney ? " ฿" : "")
                      : value
                  }
                  valueStyle={{
                    fontWeight: 800,
                    color: token.colorText,
                    fontSize: 32,
                  }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {card.subtitle}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 2. Charts Analysis Section */}
        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} lg={8}>
            <Card
              variant="borderless"
              title={
                <Flex gap="small" align="center">
                  <LineChartOutlined style={{ color: token.colorPrimary }} />
                  <span>{TRANSLATION("bypass_page.ranking.rep_workload")}</span>
                </Flex>
              }
              style={{ boxShadow: token.boxShadowTertiary, height: "100%" }}
              styles={{ body: { height: 400 } }}
            >
              <Bar options={chartOptions} data={barChartData} />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              variant="borderless"
              title={
                <Flex gap="small" align="center">
                  <PieChartOutlined style={{ color: token.colorInfo }} />
                  <span>
                    {TRANSLATION("bypass_page.ranking.enrollment_distribution")}
                  </span>
                </Flex>
              }
              style={{ boxShadow: token.boxShadowTertiary, height: "100%" }}
              styles={{
                body: {
                  height: 400,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            >
              <Doughnut
                data={typeDoughnutData}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { padding: 10, boxWidth: 8, font: { size: 10 } },
                    },
                  },
                }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              variant="borderless"
              title={
                <Flex gap="small" align="center">
                  <PieChartOutlined style={{ color: token.colorSuccess }} />
                  <span>
                    {TRANSLATION("bypass_page.ranking.quality_scoring")}
                  </span>
                </Flex>
              }
              style={{ boxShadow: token.boxShadowTertiary, height: "100%" }}
              styles={{
                body: {
                  height: 400,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            >
              <Doughnut data={doughnutChartData} options={chartOptions} />
            </Card>
          </Col>
        </Row>

        {/* 3. Detailed Table */}
        <Card
          variant="borderless"
          title={
            <Flex gap="small" align="center">
              <TrophyOutlined style={{ color: token.colorWarning }} />
              <span>
                {TRANSLATION("bypass_page.ranking.comprehensive_table")}
              </span>
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
            dataSource={data}
            rowKey="saleName"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }}
            scroll={{ x: 1400 }}
            size="middle"
          />
        </Card>
      </Flex>
    </Modal>
  );
}
