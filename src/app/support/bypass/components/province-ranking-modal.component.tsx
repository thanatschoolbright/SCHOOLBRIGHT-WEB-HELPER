"use client";

import SummaryCard from "@/components/card/summary-card";
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
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Flex,
  Modal,
  Row,
  Space,
  Table,
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
import { motion } from "framer-motion";
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
  const isDarkModeActive = useMemo(
    () => token.colorBgBase !== "#ffffff",
    [token.colorBgBase],
  );

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
        label: TRANSLATION("bypass_page.ranking.active_schools"),
        data: top10Data.map((record) => record.activeSchools),
        backgroundColor: token.colorSuccess,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: TRANSLATION("bypass_page.ranking.inactive_schools"),
        data: top10Data.map((record) => record.inactiveSchools),
        backgroundColor: token.colorError,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

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

  const schoolDataTypeChartData = {
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
        title: TRANSLATION("bypass_page.ranking.col_rank"),
        key: "rank",
        width: 80,
        align: "center",
        fixed: "left",
        render: (_value, _record, index) => {
          const rank = index + 1;
          return (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex justify-center items-center"
            >
              {rank === 1 ? (
                <div className="relative">
                  <TrophyOutlined
                    className="text-3xl"
                    style={{
                      color: "#FFD700",
                      filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))",
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                </div>
              ) : rank === 2 ? (
                <TrophyOutlined
                  className="text-2xl"
                  style={{
                    color: "#C0C0C0",
                    filter: "drop-shadow(0 0 6px rgba(192, 192, 192, 0.4))",
                  }}
                />
              ) : rank === 3 ? (
                <TrophyOutlined
                  className="text-xl"
                  style={{
                    color: "#CD7F32",
                    filter: "drop-shadow(0 0 4px rgba(205, 127, 50, 0.3))",
                  }}
                />
              ) : (
                <div
                  className={`
                    w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all
                    ${
                      isDarkModeActive
                        ? "bg-white/5 text-white/40 border border-white/10"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }
                  `}
                >
                  {rank}
                </div>
              )}
            </motion.div>
          );
        },
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_province"),
        dataIndex: "province",
        key: "province",
        width: 180,
        fixed: "left",
        render: (text) => (
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <GlobalOutlined />
            </div>
            <Text
              strong
              className="text-[14px] group-hover:text-primary transition-colors"
            >
              {text}
            </Text>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <span>{TRANSLATION("bypass_page.ranking.col_total")}</span>
            <Tooltip title={TRANSLATION("bypass_page.ranking.col_total_desc")}>
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 120,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.totalSchools - secondRecord.totalSchools,
        render: (value) => (
          <div className="flex flex-col items-end px-2">
            <Text className="text-[15px] font-black tabular-nums transition-colors duration-300 dark:text-white">
              {value.toLocaleString()}
            </Text>
            <Text className="text-[9px] uppercase font-bold opacity-30 dark:text-white/50">
              {TRANSLATION("bypass_page.ranking.total_institutions")}
            </Text>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <span>{TRANSLATION("bypass_page.ranking.col_active")}</span>
            <Tooltip title={TRANSLATION("bypass_page.ranking.col_active_desc")}>
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activeSchools",
        key: "activeSchools",
        width: 120,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.activeSchools - secondRecord.activeSchools,
        render: (value) => (
          <div className="flex flex-col items-end px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <Text className="text-[15px] font-black text-green-600 dark:text-green-400 tabular-nums">
                {value.toLocaleString()}
              </Text>
            </div>
            <Text className="text-[9px] uppercase font-bold opacity-30 mt-px dark:text-white/50">
              {TRANSLATION("bypass_page.ranking.active_schools")}
            </Text>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <span>{TRANSLATION("bypass_page.ranking.col_rate")}</span>
            <Tooltip title={TRANSLATION("bypass_page.ranking.col_rate_desc")}>
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activationRate",
        key: "activationRate",
        width: 180,
        sorter: (firstRecord, secondRecord) =>
          firstRecord.activationRate - secondRecord.activationRate,
        render: (value) => (
          <Tooltip
            title={`${value.toFixed(2)}% ${TRANSLATION(
              "bypass_page.ranking.col_rate",
            )}`}
          >
            <div className="px-3">
              <Flex justify="space-between" align="center" className="mb-1">
                <Text className="text-[10px] uppercase font-bold opacity-40">
                  {TRANSLATION("bypass_page.ranking.market_desc")}
                </Text>
                <Text className="text-[11px] font-black text-primary">
                  {value.toFixed(1)}%
                </Text>
              </Flex>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
                />
              </div>
            </div>
          </Tooltip>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_clients"),
        dataIndex: "customerCount",
        key: "customerCount",
        width: 110,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.customerCount - secondRecord.customerCount,
        render: (value) => (
          <div className="px-3 py-1 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <Text className="text-blue-600 dark:text-blue-400 font-black tabular-nums">
              {value}
            </Text>
          </div>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_contracts"),
        dataIndex: "contractCount",
        key: "contractCount",
        width: 110,
        align: "right",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.contractCount - secondRecord.contractCount,
        render: (value) => (
          <div className="px-3 py-1 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <Text className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums">
              {value}
            </Text>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <CrownOutlined className="text-amber-500" />
            <span>{TRANSLATION("bypass_page.ranking.col_grade_a")}</span>
          </Space>
        ),
        dataIndex: "gradeACount",
        key: "gradeACount",
        width: 140,
        align: "center",
        sorter: (firstRecord, secondRecord) =>
          firstRecord.gradeACount - secondRecord.gradeACount,
        render: (value) => (
          <div
            className={`
            px-4 py-1.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300
            ${
              value > 0
                ? "bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:scale-105"
                : "bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 opacity-40"
            }
          `}
          >
            <Text className="font-black text-[14px] text-amber-600 dark:text-amber-400 transition-colors duration-300">
              {value}
            </Text>
            <div
              className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase transition-colors duration-300 ${
                value > 0
                  ? "bg-amber-500 text-white"
                  : "bg-slate-300 dark:bg-white/20 dark:text-white/50"
              }`}
            >
              {TRANSLATION("bypass_page.ranking.grade_a")}
            </div>
          </div>
        ),
      },
      {
        title: (
          <Space>
            <span>{TRANSLATION("bypass_page.ranking.col_avg_grade")}</span>
            <Tooltip
              title={TRANSLATION("bypass_page.ranking.col_avg_grade_desc")}
            >
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
          const colorClass =
            num >= 3.5
              ? "from-green-500 to-emerald-600"
              : num >= 2.5
              ? "from-blue-500 to-indigo-600"
              : "from-rose-500 to-red-600";
          return (
            <div
              className={`px-4 py-1 rounded-full bg-gradient-to-r ${colorClass} text-white font-black text-[13px] shadow-sm`}
            >
              {value}
            </div>
          );
        },
      },
    ],
    [token, TRANSLATION, isDarkModeActive],
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
              {TRANSLATION("bypass_page.ranking.modal_title")}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {TRANSLATION("bypass_page.ranking.modal_subtitle")}
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
        <Row gutter={[20, 20]}>
          {[
            {
              title: TRANSLATION("bypass_page.ranking.stat_total_schools"),
              value: statistics.totalSchools,
              icon: <BankOutlined />,
              color: token.colorInfo,
              unit: TRANSLATION("bypass_page.ranking.schools_unit"),
            },
            {
              title: TRANSLATION("bypass_page.ranking.stat_active_usage"),
              value: statistics.activeSchools,
              icon: <CheckCircleOutlined />,
              color: token.colorSuccess,
              unit: TRANSLATION("bypass_page.ranking.schools_unit"),
              suffix: `(${(
                (statistics.activeSchools / statistics.totalSchools) *
                100
              ).toFixed(1)}%)`,
            },
            {
              title: TRANSLATION("bypass_page.ranking.stat_excellence"),
              value: statistics.gradeA,
              icon: <CrownOutlined />,
              color: token.colorWarning,
              unit: TRANSLATION("bypass_page.ranking.units"),
            },
          ].map((card, index) => (
            <Col xs={24} sm={8} key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <SummaryCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  unit={card.unit}
                  suffix={card.suffix}
                />
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* 2. School Data Type Summary Cards */}
        <Flex vertical gap={24} className="mt-4">
          <AntTitle
            level={5}
            style={{ margin: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-1.5 h-6 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
            <span className="font-black tracking-tight text-lg">
              {TRANSLATION("bypass_page.ranking.school_category_stats")}
            </span>
          </AntTitle>
          <Row gutter={[16, 16]}>
            {[
              {
                title: TRANSLATION("bypass_page.ranking.customers"),
                value: statistics.customerCount,
                icon: <TeamOutlined />,
                color: "#3b82f6",
              },
              {
                title: TRANSLATION("bypass_page.ranking.contracts"),
                value: statistics.contractCount,
                icon: <FileDoneOutlined />,
                color: "#10b981",
              },
              {
                title: TRANSLATION("bypass_page.ranking.trial_test"),
                value: statistics.testCount,
                icon: <ExperimentOutlined />,
                color: "#f59e0b",
              },
              {
                title: TRANSLATION("bypass_page.ranking.free_tier"),
                value: statistics.freeCount,
                icon: <GiftOutlined />,
                color: "#8b5cf6",
              },
              {
                title: TRANSLATION("bypass_page.ranking.islamic_cur"),
                value: statistics.otherCount,
                icon: <GlobalOutlined />,
                color: "#6366f1",
              },
            ].map((item, index) => (
              <Col
                xs={12}
                sm={12}
                lg={4}
                className="flex-grow"
                key={item.title}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card
                    variant="borderless"
                    className="overflow-hidden shadow-sm hover:shadow-md transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    style={{ borderRadius: 20 }}
                    styles={{ body: { padding: "20px 24px" } }}
                  >
                    <Flex vertical gap={12}>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 group-hover:bg-white transition-colors"
                        style={{ color: item.color }}
                      >
                        {item.icon}
                      </div>
                      <Flex vertical gap={2}>
                        <Text className="text-[12px] uppercase font-bold opacity-30 tracking-widest dark:text-white/50">
                          {item.title}
                        </Text>
                        <Flex align="baseline" gap={4}>
                          <Text
                            className="text-2xl font-black tabular-nums transition-colors duration-300 dark:text-white"
                            style={{ color: item.color }}
                          >
                            {item.value.toLocaleString()}
                          </Text>
                          <Text className="text-[10px] opacity-20 font-bold uppercase dark:text-white/40">
                            {TRANSLATION("bypass_page.ranking.units")}
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Flex>

        {/* 3. Charts Analysis Section */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card
                variant="borderless"
                title={
                  <Flex gap="small" align="center">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <BarChartOutlined />
                    </div>
                    <span className="font-bold text-base">
                      {TRANSLATION("bypass_page.ranking.top_10_comparison")}
                    </span>
                  </Flex>
                }
                style={{ borderRadius: 24, boxShadow: token.boxShadowTertiary }}
                styles={{ body: { height: 450, padding: 24 } }}
              >
                <Bar
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: true,
                        position: "top",
                        align: "end",
                        labels: {
                          usePointStyle: true,
                          pointStyle: "rectRounded",
                          font: { size: 11, weight: "bold" },
                        },
                      },
                    },
                  }}
                  data={{
                    ...barChartData,
                    datasets: barChartData.datasets.map((ds, i) => ({
                      ...ds,
                      backgroundColor:
                        i === 0
                          ? "rgba(34, 197, 94, 0.8)"
                          : "rgba(244, 63, 94, 0.8)",
                      borderRadius: 12,
                      borderSkipped: false,
                      barPercentage: 0.5,
                    })),
                  }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} lg={12}>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card
                    variant="borderless"
                    title={
                      <Flex gap="small" align="center">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                          <PieChartOutlined />
                        </div>
                        <span className="font-bold text-sm">
                          {TRANSLATION("bypass_page.ranking.quality_ratio")}
                        </span>
                      </Flex>
                    }
                    style={{
                      borderRadius: 24,
                      boxShadow: token.boxShadowTertiary,
                    }}
                    styles={{
                      body: {
                        height: 350,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    }}
                  >
                    <Doughnut
                      data={doughnutChartData}
                      options={{
                        ...chartOptions,
                        cutout: "70%",
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              boxWidth: 8,
                              usePointStyle: true,
                              font: { size: 10 },
                            },
                          },
                        },
                      }}
                    />
                  </Card>
                </motion.div>
              </Col>
              <Col span={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card
                    variant="borderless"
                    title={
                      <Flex gap="small" align="center">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                          <PieChartOutlined />
                        </div>
                        <span className="font-bold text-sm">
                          {TRANSLATION("bypass_page.ranking.category_ratio")}
                        </span>
                      </Flex>
                    }
                    style={{
                      borderRadius: 24,
                      boxShadow: token.boxShadowTertiary,
                    }}
                    styles={{
                      body: {
                        height: 350,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    }}
                  >
                    <Doughnut
                      data={schoolDataTypeChartData}
                      options={{
                        ...chartOptions,
                        cutout: "70%",
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              boxWidth: 8,
                              usePointStyle: true,
                              font: { size: 10 },
                            },
                          },
                        },
                      }}
                    />
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* 4. Detailed Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card
            variant="borderless"
            title={
              <Flex gap="small" align="center">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <RocketOutlined />
                </div>
                <span className="font-bold text-base">
                  {TRANSLATION("bypass_page.ranking.table_title")}
                </span>
              </Flex>
            }
            style={{ borderRadius: 24, overflow: "hidden" }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={columns}
              dataSource={top10Data}
              rowKey="province"
              pagination={false}
              className="premium-province-table"
              scroll={{ x: 1400, y: 400 }}
              size="middle"
              rowClassName={(_record, index) => `
                transition-colors duration-300
                ${
                  index % 2 === 0
                    ? "bg-white dark:bg-slate-900/40"
                    : "bg-slate-50/50 dark:bg-white/5"
                }
              `}
            />
            <style jsx global>{`
              .premium-province-table .ant-table-thead > tr > th {
                background: ${isDarkModeActive
                  ? "rgba(255,255,255,0.03)"
                  : "#f8fafc"} !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                font-size: 11px !important;
                padding: 18px 16px !important;
              }
              .premium-province-table .ant-table-row:hover > td {
                background: ${isDarkModeActive
                  ? "rgba(59,130,246,0.08)"
                  : "rgba(59,130,246,0.04)"} !important;
              }
            `}</style>
          </Card>
        </motion.div>
      </Flex>
    </Modal>
  );
}
