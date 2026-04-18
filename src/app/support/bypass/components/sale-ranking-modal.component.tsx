"use client";

import { useMemo, useState } from "react";

import SummaryCard from "@/components/card/summary-card";
import {
  DollarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LineChartOutlined,
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
import { motion } from "framer-motion";
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
  const isDarkModeActive = useMemo(
    () => token.colorBgBase !== "#ffffff",
    [token.colorBgBase],
  );
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

  const chartPlugins = useMemo(
    () => ({
      legend: {
        position: "bottom" as const,
        labels: {
          color: token.colorText,
          font: { family: token.fontFamily, size: 11, weight: 600 },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDarkModeActive ? "#1f2937" : "rgba(0,0,0,0.8)",
        titleFont: { family: token.fontFamily, size: 14, weight: 600 },
        bodyFont: { family: token.fontFamily, size: 13 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 8,
        usePointStyle: true,
        borderColor: isDarkModeActive ? "rgba(255,255,255,0.1)" : "transparent",
        borderWidth: 1,
      },
    }),
    [token, isDarkModeActive],
  );

  const chartScales = useMemo(
    () => ({
      x: {
        ticks: {
          color: token.colorTextSecondary,
          font: { family: token.fontFamily, size: 10 },
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: token.colorTextSecondary,
          font: { family: token.fontFamily, size: 10 },
          callback: (value: any) =>
            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value,
        },
        grid: {
          color: isDarkModeActive
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.03)",
          drawTicks: false,
        },
        border: { display: false },
      },
    }),
    [token, isDarkModeActive],
  );

  // * Bar Chart: Top 5 Sales Performance
  const barChartData = {
    labels: top5Sales.map((sale) => sale.saleName),
    datasets: [
      {
        label: `${TRANSLATION("bypass_page.ranking.customers")}/${TRANSLATION(
          "bypass_page.ranking.contracts",
        )}`,
        data: top5Sales.map((sale) => sale.customerCount + sale.contractCount),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
        barPercentage: 0.5,
      },
      {
        label: `${TRANSLATION("bypass_page.ranking.trial_test")}/${TRANSLATION(
          "bypass_page.ranking.free_tier",
        )}`,
        data: top5Sales.map((sale) => sale.testCount + sale.freeCount),
        backgroundColor: isDarkModeActive ? "#f59e0b" : "#fbbf24",
        borderRadius: 6,
        barPercentage: 0.5,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: chartPlugins,
    scales: chartScales,
  };

  // * Doughnut Chart: Overall Grade Distribution
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
        borderColor: isDarkModeActive ? "#1f2937" : "#fff",
        borderWidth: 2,
        hoverOffset: 12,
        cutout: "75%",
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
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#6366f1",
        ],
        borderColor: isDarkModeActive ? "#1f2937" : "#fff",
        borderWidth: 2,
        hoverOffset: 12,
        cutout: "75%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...chartPlugins,
      legend: { display: false },
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
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                </div>
              ) : rank === 2 ? (
                <TrophyOutlined
                  className="text-2xl"
                  style={{
                    color: "#C0C0C0",
                  }}
                />
              ) : rank === 3 ? (
                <TrophyOutlined
                  className="text-xl"
                  style={{
                    color: "#CD7F32",
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
        title: TRANSLATION("bypass_page.ranking.col_sales_rep"),
        dataIndex: "saleName",
        key: "saleName",
        width: 200,
        fixed: "left",
        render: (text) => (
          <div className="group flex items-center gap-3 p-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <UserOutlined className="text-lg" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            </div>
            <Flex vertical gap={0}>
              <Text
                strong
                className="text-[14px] group-hover:text-primary transition-colors no-wrap dark:text-white"
              >
                {text}
              </Text>
              <Text
                type="secondary"
                className="text-[11px] opacity-60 dark:text-white/50"
              >
                Sales Executive
              </Text>
            </Flex>
          </div>
        ),
      },
      {
        key: "viewModeSwitcher",
        width: 280,
        fixed: "left",
        title: (
          <div className="px-2">
            <Segmented
              size="small"
              block
              value={viewMode}
              onChange={(value) => setViewMode(value as any)}
              className="p-0.5 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10"
              options={[
                {
                  label: (
                    <span className="text-[11px] font-bold px-1">
                      {TRANSLATION("bypass_page.ranking.view_all")}
                    </span>
                  ),
                  value: "all",
                },
                {
                  label: (
                    <span className="text-[11px] font-bold px-1">
                      {TRANSLATION("bypass_page.ranking.view_sales")}
                    </span>
                  ),
                  value: "customer",
                },
                {
                  label: (
                    <span className="text-[11px] font-bold px-1">
                      {TRANSLATION("bypass_page.ranking.view_contract")}
                    </span>
                  ),
                  value: "contract",
                },
              ]}
            />
          </div>
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
            <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-3 border border-slate-100 dark:border-white/5 hover:border-primary/30 transition-all group">
              <Flex vertical gap={4}>
                <Flex justify="space-between" align="center">
                  <Text className="text-[13px] font-black tracking-tight dark:text-white">
                    {currentSchools.toLocaleString()}{" "}
                    <span className="text-[11px] opacity-40 font-bold ml-0.5 dark:text-white/50">
                      {TRANSLATION("bypass_page.ranking.schools_unit")}
                    </span>
                  </Text>
                  <Tag className="m-0 border-none rounded-lg text-[9px] font-black uppercase px-1.5 py-0.5 bg-primary/10 text-primary">
                    {viewMode}
                  </Tag>
                </Flex>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    className="h-full bg-primary"
                  />
                </div>
                <Text className="text-[10px] uppercase font-bold tracking-wider opacity-40 dark:text-white/50">
                  {TRANSLATION("bypass_page.ranking.students")}:{" "}
                  {currentStudents.toLocaleString()}
                </Text>
              </Flex>
            </div>
          );
        },
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_kpi"),
        key: "kpi",
        width: 200,
        align: "center",
        render: (_, record) => {
          const paying = record.customerStudents + record.contractStudents;
          const percent = Math.min(100, (paying / record.targetStudents) * 100);
          const colorClass =
            percent >= 100
              ? "from-green-500 to-emerald-600"
              : percent >= 80
              ? "from-amber-400 to-orange-500"
              : "from-rose-500 to-red-600";

          return (
            <div className="px-3 py-1">
              <Flex vertical gap={6}>
                <Flex justify="space-between" align="end">
                  <Flex vertical align="start">
                    <Text className="text-[10px] uppercase font-black opacity-30 tracking-widest dark:text-white/50">
                      Performance
                    </Text>
                    <Text className="text-[14px] font-black leading-none dark:text-white">
                      {percent.toFixed(1)}%
                    </Text>
                  </Flex>
                  <Text className="text-[10px] font-bold opacity-40 mb-0.5 dark:text-white/40">
                    {paying.toLocaleString()} /{" "}
                    {record.targetStudents.toLocaleString()}
                  </Text>
                </Flex>
                <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full p-0.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                  />
                </div>
              </Flex>
            </div>
          );
        },
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_total_managed"),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 140,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.totalSchools - secondSale.totalSchools,
        render: (value) => (
          <div className="px-2">
            <div className="flex flex-col items-end">
              <Text className="text-[16px] font-black tracking-tighter tabular-nums underline decoration-primary/20 decoration-2 underline-offset-4 dark:text-white">
                {value.toLocaleString()}
              </Text>
              <Text className="text-[10px] uppercase font-bold opacity-30 tracking-widest dark:text-white/40">
                {TRANSLATION("bypass_page.ranking.schools_unit")}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_revenue_sources"),
        key: "payingSchools",
        width: 180,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.customerCount +
          firstSale.contractCount -
          (secondSale.customerCount + secondSale.contractCount),
        render: (_, record) => (
          <Tooltip
            overlayInnerStyle={{ borderRadius: 16, padding: 12 }}
            title={
              <Flex vertical gap={6}>
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <Text className="text-white text-[11px] font-bold">
                    REVENUE ANALYSIS
                  </Text>
                </div>
                <Flex justify="space-between" align="center">
                  <Text className="text-white/60 text-[11px]">
                    {TRANSLATION("bypass_page.ranking.customers")}
                  </Text>
                  <Text className="text-white font-black text-[11px]">
                    {record.customerCount}{" "}
                    {TRANSLATION("bypass_page.ranking.schools_unit")}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text className="text-white/60 text-[11px]">
                    {TRANSLATION("bypass_page.ranking.contracts")}
                  </Text>
                  <Text className="text-white font-black text-[11px]">
                    {record.contractCount}{" "}
                    {TRANSLATION("bypass_page.ranking.schools_unit")}
                  </Text>
                </Flex>
              </Flex>
            }
          >
            <div className="p-2 rounded-2xl bg-blue-50/30 dark:bg-blue-500/5 group hover:bg-blue-500/10 transition-all cursor-help border border-transparent hover:border-blue-500/20">
              <Flex vertical align="end" gap={0}>
                <Text className="text-[14px] font-black text-blue-600 dark:text-blue-400">
                  {(
                    record.customerCount + record.contractCount
                  ).toLocaleString()}{" "}
                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                    {TRANSLATION("bypass_page.ranking.schools_unit")}
                  </span>
                </Text>
                <Text className="text-[10px] font-bold opacity-40 tabular-nums dark:text-white/40">
                  {(
                    record.customerStudents + record.contractStudents
                  ).toLocaleString()}{" "}
                  {TRANSLATION("bypass_page.ranking.students")}
                </Text>
              </Flex>
            </div>
          </Tooltip>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_trial_free"),
        key: "nonPayingSchools",
        width: 180,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.testCount +
          firstSale.freeCount -
          (secondSale.testCount + secondSale.freeCount),
        render: (_, record) => (
          <Tooltip
            overlayInnerStyle={{ borderRadius: 16, padding: 12 }}
            title={
              <Flex vertical gap={6}>
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <Text className="text-white text-[11px] font-bold">
                    NON-PAID ANALYSIS
                  </Text>
                </div>
                <Flex justify="space-between" align="center">
                  <Text className="text-white/60 text-[11px]">
                    {TRANSLATION("bypass_page.ranking.trial_test")}
                  </Text>
                  <Text className="text-white font-black text-[11px]">
                    {record.testCount}{" "}
                    {TRANSLATION("bypass_page.ranking.schools_unit")}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text className="text-white/60 text-[11px]">
                    {TRANSLATION("bypass_page.ranking.free_tier")}
                  </Text>
                  <Text className="text-white font-black text-[11px]">
                    {record.freeCount}{" "}
                    {TRANSLATION("bypass_page.ranking.schools_unit")}
                  </Text>
                </Flex>
              </Flex>
            }
          >
            <div className="p-2 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 group hover:bg-amber-500/10 transition-all cursor-help border border-transparent hover:border-amber-500/20">
              <Flex vertical align="end" gap={0}>
                <Text className="text-[14px] font-black text-amber-600 dark:text-amber-400">
                  {(record.testCount + record.freeCount).toLocaleString()}{" "}
                  <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                    {TRANSLATION("bypass_page.ranking.schools_unit")}
                  </span>
                </Text>
                <Text className="text-[10px] font-bold opacity-40 tabular-nums dark:text-white/40">
                  {(record.testStudents + record.freeStudents).toLocaleString()}{" "}
                  {TRANSLATION("bypass_page.ranking.students")}
                </Text>
              </Flex>
            </div>
          </Tooltip>
        ),
      },
      {
        title: (
          <Flex align="center" gap={4}>
            <DollarOutlined className="text-primary" />
            <span>{TRANSLATION("bypass_page.ranking.col_est_income")}</span>
          </Flex>
        ),
        key: "estimatedIncome",
        width: 180,
        align: "right",
        render: (_, record) =>
          isIncomeVisible ? (
            <div className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20">
              <Text className="text-[15px] font-black text-green-600 dark:text-green-400 tabular-nums">
                {(
                  (record.customerStudents + record.contractStudents) *
                  INCOME_PER_STUDENT
                ).toLocaleString()}
                <span className="ml-1 text-[10px] font-bold">฿</span>
              </Text>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 group-hover:bg-primary/5 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              <Text
                type="secondary"
                className="text-[12px] font-black tracking-widest blur-[3px] select-none opacity-40"
              >
                999,999
              </Text>
            </div>
          ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_active"),
        dataIndex: "activeSchools",
        key: "activeSchools",
        width: 120,
        align: "right",
        sorter: (firstSale, secondSale) =>
          firstSale.activeSchools - secondSale.activeSchools,
        render: (value) => (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <Text className="text-[15px] font-black text-green-600 dark:text-green-400 tabular-nums">
                {value.toLocaleString()}
              </Text>
            </div>
            <Text className="text-[9px] uppercase font-bold opacity-30 mt-px dark:text-white/30 text-right">
              {TRANSLATION("bypass_page.ranking.active_schools")}
            </Text>
          </div>
        ),
      },
      {
        title: TRANSLATION("bypass_page.ranking.col_grade_a"),
        dataIndex: "gradeACount",
        key: "gradeACount",
        width: 140,
        align: "center",
        sorter: (firstSale, secondSale) =>
          firstSale.gradeACount - secondSale.gradeACount,
        render: (value) => (
          <div className="relative inline-block group">
            <div
              className={`
              px-4 py-1.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300
              ${
                value > 0
                  ? "bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-105"
                  : "bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 opacity-40"
              }
            `}
            >
              <Text
                className={`font-black text-[14px] ${
                  value > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-400 dark:text-white/20"
                }`}
              >
                {value}
              </Text>
              <div
                className={`
                px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase
                ${
                  value > 0
                    ? "bg-amber-500 text-white shadow-lg"
                    : "bg-slate-300 dark:bg-white/20 text-white/50"
                }
              `}
              >
                {TRANSLATION("bypass_page.ranking.grade_a")}
              </div>
            </div>
            {value > 5 && (
              <div className="absolute -top-1.5 -right-1.5">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <RocketOutlined className="text-amber-500 text-xs drop-shadow-md" />
                </motion.div>
              </div>
            )}
          </div>
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
          <div className="flex flex-col items-center">
            <Text className="font-bold tabular-nums dark:text-white/70">
              {Math.round(val).toLocaleString()}
            </Text>
            <Text className="text-[8px] opacity-30 font-black uppercase dark:text-white/30">
              {TRANSLATION("bypass_page.ranking.students")}
            </Text>
          </div>
        ),
      },
    ],
    [isIncomeVisible, TRANSLATION, viewMode, isDarkModeActive],
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
              subtitle: TRANSLATION("bypass_page.ranking.stat_active_reps"),
              unit: TRANSLATION("bypass_page.ranking.stat_total_sales_team"),
            },
            {
              title: TRANSLATION(
                "bypass_page.ranking.stat_total_active_schools",
              ),
              value: statistics.activeSchools,
              icon: <TeamOutlined />,
              color: token.colorSuccess,
              subtitle: `${TRANSLATION("bypass_page.ranking.stat_across")} ${
                statistics.totalSchools
              } ${TRANSLATION("bypass_page.ranking.stat_managed")}`,
              unit: TRANSLATION("bypass_page.ranking.schools_unit"),
            },
            {
              title: TRANSLATION("bypass_page.ranking.stat_student_reach"),
              value: (statistics.totalStudents / 1000).toFixed(1),
              icon: <RocketOutlined />,
              color: "#8b5cf6",
              subtitle: TRANSLATION(
                "bypass_page.ranking.stat_total_students_impacted",
              ),
              unit: `k ${TRANSLATION("bypass_page.ranking.students")}`,
            },
            {
              title: TRANSLATION("bypass_page.ranking.stat_est_revenue"),
              value: isIncomeVisible
                ? (statistics.totalIncome / 1000000).toFixed(2)
                : "******",
              icon: <DollarOutlined />,
              color: token.colorWarning,
              subtitle: TRANSLATION(
                "bypass_page.ranking.stat_projected_income",
              ),
              unit: isIncomeVisible ? `M ฿` : "",
            },
          ].map((card, index) => (
            <Col xs={24} sm={12} lg={6} key={card.title}>
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
                  subtitle={card.subtitle}
                  unit={card.unit}
                />
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* 2. Charts Analysis Section */}
        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} lg={12}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="h-full"
            >
              <Card
                variant="borderless"
                className="overflow-hidden relative group shadow-sm"
                title={
                  <Flex gap="small" align="center">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <LineChartOutlined />
                    </div>
                    <span className="font-bold text-base">
                      {TRANSLATION("bypass_page.ranking.rep_workload")}
                    </span>
                  </Flex>
                }
                style={{
                  borderRadius: 24,
                  height: "100%",
                }}
                styles={{ body: { height: 450, padding: 24 } }}
              >
                <Bar data={barChartData} options={barChartOptions} />
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} lg={12}>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card
                    variant="borderless"
                    className="overflow-hidden shadow-sm"
                    style={{
                      borderRadius: 24,
                    }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <Flex gap="large" align="center" wrap="wrap">
                      <div className="w-full sm:w-[200px] h-[200px] flex items-center justify-center relative mx-auto">
                        <Doughnut
                          data={typeDoughnutData}
                          options={doughnutOptions}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <Text
                            type="secondary"
                            className="text-[10px] uppercase font-black tracking-widest leading-none dark:text-white/30"
                          >
                            {TRANSLATION("bypass_page.ranking.students")}
                          </Text>
                          <Text className="text-xl font-bold dark:text-white">
                            {(statistics.totalStudents / 1000).toFixed(1)}k
                          </Text>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                        <Text
                          strong
                          className="text-xs mb-1 uppercase tracking-wider text-slate-400 dark:text-white/30"
                        >
                          {TRANSLATION(
                            "bypass_page.ranking.distribution_overview",
                          )}
                        </Text>
                        {typeDoughnutData.labels?.map((label, i) => (
                          <Flex
                            key={label}
                            justify="space-between"
                            align="center"
                          >
                            <Flex align="center" gap={8}>
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: (
                                    typeDoughnutData.datasets?.[0]
                                      ?.backgroundColor as string[]
                                  )?.[i],
                                }}
                              />
                              <Text className="text-xs text-slate-500 dark:text-white/50">
                                {label}
                              </Text>
                            </Flex>
                            <Text strong className="text-xs dark:text-white/70">
                              {(
                                ((typeDoughnutData.datasets?.[0]?.data?.[i] ||
                                  0) /
                                  statistics.totalStudents) *
                                100
                              ).toFixed(1)}
                              %
                            </Text>
                          </Flex>
                        ))}
                      </div>
                    </Flex>
                  </Card>
                </motion.div>
              </Col>
              <Col span={24}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card
                    variant="borderless"
                    className="overflow-hidden shadow-sm"
                    style={{
                      borderRadius: 24,
                    }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <Flex
                      justify="space-between"
                      align="center"
                      className="mb-4"
                    >
                      <Text
                        strong
                        className="text-xs uppercase tracking-wider text-slate-400 dark:text-white/30"
                      >
                        {TRANSLATION("bypass_page.ranking.quality_scoring")}
                      </Text>
                      <Tag
                        color="gold"
                        className="m-0 border-none font-bold dark:bg-amber-500/20 dark:text-amber-400"
                      >
                        {TRANSLATION("bypass_page.ranking.grade_a")}:{" "}
                        {statistics.gradeA}
                      </Tag>
                    </Flex>
                    <div className="space-y-4">
                      {doughnutChartData.labels?.map((label, i) => {
                        const val =
                          doughnutChartData.datasets?.[0]?.data?.[i] || 0;
                        const total =
                          statistics.gradeA +
                          statistics.gradeB +
                          statistics.gradeC;
                        const pct = (val / total) * 100;
                        return (
                          <div key={label} className="space-y-1">
                            <Flex
                              justify="space-between"
                              style={{ fontSize: 11 }}
                            >
                              <Text className="dark:text-white/60">
                                {label}
                              </Text>
                              <Text strong className="dark:text-white/80">
                                {val}{" "}
                                {TRANSLATION(
                                  "bypass_page.ranking.schools_unit",
                                )}
                              </Text>
                            </Flex>
                            <Progress
                              percent={pct}
                              showInfo={false}
                              strokeColor={
                                (
                                  doughnutChartData.datasets?.[0]
                                    ?.backgroundColor as string[]
                                )?.[i]
                              }
                              strokeWidth={6}
                              className="m-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* 3. Detailed Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card
            variant="borderless"
            className="shadow-sm"
            title={
              <Flex gap="small" align="center">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <TrophyOutlined />
                </div>
                <span className="font-bold text-base">
                  {TRANSLATION("bypass_page.ranking.comprehensive_table")}
                </span>
              </Flex>
            }
            style={{
              borderRadius: 24,
              overflow: "hidden",
            }}
            styles={{
              body: { padding: 0 },
              header: {
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                padding: "16px 24px",
              },
            }}
          >
            <Table
              columns={columns}
              dataSource={data}
              rowKey="saleName"
              className="custom-premium-table"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                position: ["bottomCenter"],
              }}
              rowClassName={(_record, index) => `
                group hover:bg-primary/5 transition-all duration-300
                ${
                  index % 2 === 0
                    ? "bg-white dark:bg-slate-900/50"
                    : "bg-slate-50/30 dark:bg-white/5"
                }
              `}
              scroll={{ x: 1600, y: "calc(100vh - 450px)" }}
              size="middle"
            />
            <style jsx global>{`
              .custom-premium-table .ant-table {
                background: transparent !important;
                border-radius: 0 0 24px 24px !important;
              }
              .custom-premium-table .ant-table-thead > tr > th {
                background: ${isDarkModeActive
                  ? "rgba(255,255,255,0.03)"
                  : "#f8fafc"} !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                font-size: 11px !important;
                color: ${isDarkModeActive
                  ? "rgba(255,255,255,0.4)"
                  : "#64748b"} !important;
                border-bottom: 2px solid
                  ${isDarkModeActive ? "rgba(255,255,255,0.05)" : "#f1f5f9"} !important;
                padding: 18px 16px !important;
              }
              .custom-premium-table .ant-table-tbody > tr > td {
                border-bottom: 1px solid
                  ${isDarkModeActive ? "rgba(255,255,255,0.03)" : "#f1f5f9"} !important;
                transition: all 0.3s ease !important;
              }
              .custom-premium-table .ant-table-row:hover > td {
                background: ${isDarkModeActive
                  ? "rgba(59,130,246,0.08)"
                  : "rgba(59,130,246,0.04)"} !important;
              }
              .custom-premium-table .ant-table-cell-fix-left,
              .custom-premium-table .ant-table-cell-fix-right {
                background-color: inherit !important;
              }
            `}</style>
          </Card>
        </motion.div>
      </Flex>
    </Modal>
  );
}
