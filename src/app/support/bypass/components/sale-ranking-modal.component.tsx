"use client";

import { useMemo, useState } from "react";

import {
  CrownOutlined,
  DollarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  LockOutlined,
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
      toast.success("ปลดล็อคข้อมูลรายได้เรียบร้อยแล้ว");
    } else {
      toast.error("รหัสผ่านไม่ถูกต้อง");
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
      .sort((a, b) => b.totalSchools - a.totalSchools)
      .slice(0, 5);
  }, [data]);

  const stats = useMemo(() => {
    const calculated = data.reduce(
      (acc, item) => ({
        totalSchools: acc.totalSchools + item.totalSchools,
        activeSchools: acc.activeSchools + item.activeSchools,
        totalStudents: acc.totalStudents + item.totalStudents,
        payingStudents:
          acc.payingStudents + (item.customerStudents + item.contractStudents),
        totalIncome:
          acc.totalIncome +
          (item.customerStudents + item.contractStudents) * INCOME_PER_STUDENT,
        customerStudents: acc.customerStudents + item.customerStudents,
        contractStudents: acc.contractStudents + item.contractStudents,
        testStudents: acc.testStudents + item.testStudents,
        freeStudents: acc.freeStudents + item.freeStudents,
        otherStudents: acc.otherStudents + item.otherStudents,
        gradeA: acc.gradeA + item.gradeACount,
        gradeB: acc.gradeB + item.gradeBCount,
        gradeC: acc.gradeC + item.gradeCCount,
        totalTargetStudents: acc.totalTargetStudents + item.targetStudents,
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
    labels: top5Sales.map((s) => s.saleName),
    datasets: [
      {
        label: "จ่ายเงิน (Customer/Contract)",
        data: top5Sales.map((s) => s.customerCount + s.contractCount),
        backgroundColor: "#3b82f6",
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: "ฟรี/Test (Trial/Free)",
        data: top5Sales.map((s) => s.testCount + s.freeCount),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  // * Doughnut Chart: Overall Grade Distribution managed by Sales
  const doughnutChartData = {
    labels: ["เกรด A (ดีเยี่ยม)", "เกรด B (ดี)", "เกรด C (พอใช้)"],
    datasets: [
      {
        data: [stats.gradeA, stats.gradeB, stats.gradeC],
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
      "ลูกค้า (Paying)",
      "ทำสัญญา (Paying)",
      "Test",
      "ลูกค้าฟรี",
      "หลักสูตรอิสลาม",
    ],
    datasets: [
      {
        data: [
          stats.customerStudents,
          stats.contractStudents,
          stats.testStudents,
          stats.freeStudents,
          stats.otherStudents,
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

  const columns = useMemo<ColumnsType<SaleStatistics>>(
    () => [
      {
        title: "อันดับ",
        key: "rank",
        width: 70,
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
            <span className="font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full w-6 h-6 inline-flex items-center justify-center text-xs">
              {rank}
            </span>
          );
        },
      },
      {
        title: "ชื่อพนักงานขาย",
        dataIndex: "saleName",
        key: "saleName",
        width: 180,
        fixed: "left",
        render: (text) => (
          <Space>
            <UserOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{text}</Text>
          </Space>
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
            onChange={(v) => setViewMode(v as any)}
            options={[
              { label: "ทั้งหมด", value: "all" },
              { label: "ลูกค้า", value: "customer" },
              { label: "สัญญา", value: "contract" },
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
            <Space direction="vertical" size={0}>
              <Text strong>
                {currentSchools} รร. (โหมด:{" "}
                {viewMode === "all"
                  ? "รวม"
                  : viewMode === "customer"
                    ? "ลูกค้า"
                    : "สัญญา"}
                )
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                นร. {currentStudents.toLocaleString()}
              </Text>
            </Space>
          );
        },
      },
      {
        title: (
          <Space>
            <span>KPI (เป้าหมาย)</span>
            <Tooltip title="เทียบจำนวนนักเรียน (จ่ายเงิน) กับเป้าหมายที่ตั้งไว้">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
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
            <div style={{ width: "100%", padding: "0 8px" }}>
              <div className="flex justify-between items-center mb-1">
                <Text type="secondary" style={{ fontSize: 10 }}>
                  เป้า: {record.targetStudents.toLocaleString()}
                </Text>
                <Text strong style={{ fontSize: 10, color }}>
                  {percent.toFixed(1)}%
                </Text>
              </div>
              <Progress
                percent={percent}
                size="small"
                strokeColor={color}
                showInfo={false}
              />
            </div>
          );
        },
      },
      {
        title: (
          <Space>
            <span>ดูแลทั้งหมด</span>
            <Tooltip title="จำนวนโรงเรียนทั้งหมดที่พนักงานคนนี้ดูแล">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 120,
        align: "right",
        sorter: (a, b) => a.totalSchools - b.totalSchools,
        render: (val) => <Text>{val.toLocaleString()}</Text>,
      },
      {
        title: (
          <Space>
            <span>ลูกค้า/สัญญา</span>
            <Tooltip title="โรงเรียนที่เป็น 'ลูกค้า' หรือ 'ทำสัญญา' (นับเป็นรายได้)">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        key: "payingSchools",
        width: 130,
        align: "right",
        sorter: (a, b) =>
          a.customerCount +
          a.contractCount -
          (b.customerCount + b.contractCount),
        render: (_, record) => (
          <Tooltip
            title={
              <div className="text-xs">
                <div>
                  ลูกค้า: {record.customerCount} แห่ง (
                  {record.customerStudents.toLocaleString()} นร.)
                </div>
                <div>
                  ทำสัญญา: {record.contractCount} แห่ง (
                  {record.contractStudents.toLocaleString()} นร.)
                </div>
              </div>
            }
          >
            <Space direction="vertical" size={0} align="end">
              <Text strong className="text-blue-600">
                {(record.customerCount + record.contractCount).toLocaleString()}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                นร.{" "}
                {(
                  record.customerStudents + record.contractStudents
                ).toLocaleString()}
              </Text>
            </Space>
          </Tooltip>
        ),
      },
      {
        title: (
          <Space>
            <span>Test/ฟรี</span>
            <Tooltip title="โรงเรียนที่มีคนใช้แบบ 'Test' หรือ 'ลูกค้าฟรี' (ไม่นับเป็นรายได้)">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        key: "nonPayingSchools",
        width: 120,
        align: "right",
        sorter: (a, b) =>
          a.testCount + a.freeCount - (b.testCount + b.freeCount),
        render: (_, record) => (
          <Tooltip
            title={
              <div className="text-xs">
                <div>
                  Test: {record.testCount} แห่ง (
                  {record.testStudents.toLocaleString()} นร.)
                </div>
                <div>
                  ลูกค้าฟรี: {record.freeCount} แห่ง (
                  {record.freeStudents.toLocaleString()} นร.)
                </div>
                <div>
                  หลักสูตรอิสลาม: {record.otherCount} แห่ง (
                  {record.otherStudents.toLocaleString()} นร.)
                </div>
              </div>
            }
          >
            <Space direction="vertical" size={0} align="end">
              <Text strong className="text-amber-600">
                {(record.testCount + record.freeCount).toLocaleString()}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                นร.{" "}
                {(record.testStudents + record.freeStudents).toLocaleString()}
              </Text>
            </Space>
          </Tooltip>
        ),
      },
      {
        title: (
          <Space>
            <span>รายได้ประมาณการ</span>
            <Tooltip title="คำนวณจาก (ลูกค้า + ทำสัญญา) x 203 บาท/คน">
              {isIncomeVisible ? (
                <EyeOutlined style={{ color: token.colorSuccess }} />
              ) : (
                <EyeInvisibleOutlined
                  style={{ color: token.colorTextSecondary }}
                />
              )}
            </Tooltip>
          </Space>
        ),
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
              XXX,XXX
            </Text>
          ),
      },
      {
        title: (
          <Space>
            <span>Active</span>
            <Tooltip title="จำนวนโรงเรียนที่มีการใช้งานจริง (Active)">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activeSchools",
        key: "activeSchools",
        width: 100,
        align: "right",
        sorter: (a, b) => a.activeSchools - b.activeSchools,
        render: (val) => (
          <Text type="success" strong>
            {val.toLocaleString()}
          </Text>
        ),
      },
      {
        title: (
          <Space>
            <span>อัตราการใช้งาน</span>
            <Tooltip title="% ของโรงเรียนที่ Active เทียบกับทั้งหมดที่ดูแล">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activationRate",
        key: "activationRate",
        width: 150,
        sorter: (a, b) => a.activationRate - b.activationRate,
        render: (val) => (
          <Tooltip title={`${val.toFixed(2)}% อัตราการใช้งาน`}>
            <Progress
              percent={val}
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
        title: (
          <Space>
            <span>นร. ทั้งหมด</span>
            <Tooltip title="จำนวนนักเรียนทั้งหมดในโรงเรียนที่ดูแล">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "totalStudents",
        key: "totalStudents",
        width: 140,
        align: "right",
        sorter: (a, b) => a.totalStudents - b.totalStudents,
        render: (val) => <Tag color="purple">{val.toLocaleString()}</Tag>,
      },
      {
        title: (
          <Space>
            <CrownOutlined style={{ color: token.colorWarning }} />
            <span>เกรด A</span>
          </Space>
        ),
        dataIndex: "gradeACount",
        key: "gradeACount",
        width: 100,
        align: "center",
        sorter: (a, b) => a.gradeACount - b.gradeACount,
        render: (val) => (
          <Tag color="gold" bordered={false} style={{ fontWeight: 600 }}>
            {val} แห่ง
          </Tag>
        ),
      },
      {
        title: "เฉลี่ยต่อ รร.",
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
    [token, isIncomeVisible],
  );

  return (
    <Modal
      title={
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-2 py-1">
          <Space size="middle">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 shadow-sm border border-orange-100/50">
              <TrophyOutlined style={{ fontSize: 24 }} />
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  background: "linear-gradient(to right, #ea580c, #c2410c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                อันดับยอดขายและการเติบโต (Sales Ranking)
              </span>
              <Text type="secondary" className="text-sm">
                วิเคราะห์ประสิทธิภาพทีมขาย เจาะลึกรายบุคคล และดูแนวโน้มการเติบโต
              </Text>
            </div>
          </Space>

          <Space className="mt-4 md:mt-0">
            {showPasscodeInput ? (
              <Space.Compact style={{ width: "100%" }}>
                <Input.Password
                  placeholder="กรอกรหัสลับ (LIGHT)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onPressEnter={handleUnlockIncome}
                  size="middle"
                  className="rounded-l-lg"
                  style={{ width: 180 }}
                />
                <Button
                  type="primary"
                  onClick={handleUnlockIncome}
                  style={{ background: token.colorPrimary }}
                >
                  ยืนยัน
                </Button>
                <Button onClick={() => setShowPasscodeInput(false)}>
                  ยกเลิก
                </Button>
              </Space.Compact>
            ) : (
              <Tooltip
                title={
                  isIncomeVisible
                    ? "ซ่อนข้อมูลรายได้"
                    : "ดูข้อมูลรายได้ (ต้องใช้รหัสผ่าน)"
                }
              >
                <div
                  onClick={handleTogglePasscodeInput}
                  className={`
                    cursor-pointer px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 border
                    ${
                      isIncomeVisible
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-inner"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    }
                  `}
                >
                  {isIncomeVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  <span className="font-medium text-sm">
                    {isIncomeVisible ? "แสดงรายได้อยู่" : "ซ่อนรายได้"}
                  </span>
                </div>
              </Tooltip>
            )}
          </Space>
        </div>
      }
      open={open}
      onCancel={onClose}
      width="98%"
      style={{ top: 10, paddingBottom: 0 }}
      footer={null}
      destroyOnHidden
      centered={false}
      styles={{
        content: {
          borderRadius: 24,
          overflow: "hidden",
          padding: 0,
          background: token.colorBgContainer,
          minHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${token.colorBorderSecondary}`,
        },
        header: {
          padding: "20px 32px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
          zIndex: 10,
        },
        body: {
          padding: "32px",
          backgroundColor: token.colorBgLayout,
          flex: 1,
          overflowY: "auto",
        },
      }}
    >
      <div className="space-y-8 pb-8">
        {/* 1. Enhanced Summary Cards Grid */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              variant="borderless"
              className="h-full shadow-md rounded-3xl border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
              }}
            >
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.08] text-[120px] text-blue-600 rotate-12 group-hover:rotate-[20deg] group-hover:scale-110 transition-all duration-500">
                <UserOutlined />
              </div>
              <Statistic
                title={
                  <span className="text-blue-900 font-semibold text-base">
                    ทีมขายทั้งหมด
                  </span>
                }
                value={data.length}
                prefix={
                  <UserOutlined className="text-blue-500 text-2xl mr-2" />
                }
                valueStyle={{
                  fontWeight: 800,
                  fontSize: 36,
                  color: "#1e3a8a",
                }}
                suffix={
                  <span className="text-base text-blue-400 font-medium ml-1">
                    คน
                  </span>
                }
              />
              <div className="mt-4 flex items-center gap-2">
                <Tag
                  color="geekblue"
                  className="m-0 rounded-full px-3 border-0"
                >
                  ทีมขาย
                </Tag>
                <span className="text-xs text-blue-400">บุคลากรฝ่ายขาย</span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              className="h-full shadow-md rounded-3xl border-0 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #f3e8ff 0%, #ffffff 100%)",
              }}
            >
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.08] text-[120px] text-purple-600 rotate-12 group-hover:rotate-[20deg] group-hover:scale-110 transition-all duration-500">
                <TeamOutlined />
              </div>
              <Statistic
                title={
                  <span className="text-purple-900 font-semibold text-base">
                    จำนวนนักเรียนที่คิดเงิน (Paying)
                  </span>
                }
                value={stats.payingStudents}
                formatter={(val) => val.toLocaleString()}
                prefix={
                  <DollarOutlined className="text-purple-500 text-2xl mr-2" />
                }
                valueStyle={{
                  fontWeight: 800,
                  fontSize: 36,
                  color: "#581c87",
                }}
                suffix={
                  <span className="text-base text-purple-400 font-medium ml-1">
                    คน
                  </span>
                }
              />
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag
                    color="purple"
                    className="m-0 rounded-full px-3 border-0"
                  >
                    ฐานรายได้
                  </Tag>
                  <Tooltip
                    title={`รวมนักเรียนทั้งหมด (จ่ายเงิน + ไม่จ่าย): ${stats.totalStudents.toLocaleString()} คน`}
                  >
                    <span className="text-xs text-purple-400 border-b border-dotted border-purple-200 cursor-help">
                      เทียบกับ {stats.totalStudents.toLocaleString()} นร. รวม
                    </span>
                  </Tooltip>
                </div>
                <Text type="secondary" style={{ fontSize: 10 }}>
                  (
                  {((stats.payingStudents / stats.totalStudents) * 100).toFixed(
                    1,
                  )}
                  %)
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              className="h-full shadow-md rounded-3xl border-0 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{
                background: isIncomeVisible
                  ? "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)"
                  : "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
              }}
            >
              <div
                className={`absolute right-[-20px] top-[-20px] opacity-[0.08] text-[120px] rotate-12 group-hover:rotate-[20deg] group-hover:scale-110 transition-all duration-500 ${
                  isIncomeVisible ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {isIncomeVisible ? <DollarOutlined /> : <LockOutlined />}
              </div>

              {isIncomeVisible ? (
                <>
                  <Statistic
                    title={
                      <span className="text-emerald-900 font-semibold text-base">
                        รายได้รวมต่อเทอม
                      </span>
                    }
                    value={stats.totalIncome}
                    formatter={(val) => val.toLocaleString()}
                    prefix={
                      <DollarOutlined className="text-emerald-500 text-2xl mr-2" />
                    }
                    valueStyle={{
                      fontWeight: 800,
                      fontSize: 36,
                      color: "#064e3b",
                    }}
                    suffix={
                      <span className="text-base text-emerald-400 font-medium ml-1">
                        บ.
                      </span>
                    }
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <Tag
                      color="success"
                      className="m-0 rounded-full px-3 border-0"
                    >
                      ประมาณการ
                    </Tag>
                    <span className="text-xs text-emerald-500">
                      ~{(INCOME_PER_STUDENT / 1000).toFixed(1)}k / คน
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="h-full flex flex-col items-center justify-center cursor-pointer py-4 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPasscodeInput(true)}
                >
                  <div className="bg-slate-200 p-4 rounded-full mb-3">
                    <LockOutlined className="text-3xl text-slate-500" />
                  </div>
                  <Text className="text-slate-500 font-medium">
                    ข้อมูลถูกซ่อนอยู่
                  </Text>
                  <Text className="text-xs text-slate-400">
                    แตะเพื่อปลดล็อค
                  </Text>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              className="h-full shadow-md rounded-3xl border-0 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #ffedd5 0%, #ffffff 100%)",
              }}
            >
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.08] text-[120px] text-orange-600 rotate-12 group-hover:rotate-[20deg] group-hover:scale-110 transition-all duration-500">
                <RocketOutlined />
              </div>
              <Statistic
                title={
                  <span className="text-orange-900 font-semibold text-base">
                    ความสำเร็จตามเป้า (KPI)
                  </span>
                }
                value={(stats.payingStudents / stats.totalTargetStudents) * 100}
                precision={1}
                prefix={
                  <RocketOutlined className="text-orange-500 text-2xl mr-2" />
                }
                valueStyle={{
                  fontWeight: 800,
                  fontSize: 36,
                  color: "#7c2d12",
                }}
                suffix={
                  <span className="text-base text-orange-400 font-bold ml-1">
                    %
                  </span>
                }
              />
              <div className="mt-4 flex items-center gap-2">
                <Tag color="orange" className="m-0 rounded-full px-3 border-0">
                  Total KPI
                </Tag>
                <div className="flex-1 w-full max-w-[80px]">
                  <Progress
                    percent={
                      (stats.payingStudents / stats.totalTargetStudents) * 100
                    }
                    showInfo={false}
                    size="small"
                    strokeColor="#f97316"
                    trailColor="#ffedd5"
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 2. Charts Analysis Section - Side by Side Large */}
        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <LineChartOutlined style={{ fontSize: 18 }} />
                  </div>
                  <span className="font-bold text-lg text-slate-700">
                    5 อันดับยอดดูแลสูงสุด
                  </span>
                </div>
              }
              variant="borderless"
              className="shadow-md rounded-3xl h-full border border-slate-100"
            >
              <div className="h-[350px] w-full p-2">
                <Bar
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                  data={barChartData}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <PieChartOutlined style={{ fontSize: 18 }} />
                  </div>
                  <span className="font-bold text-lg text-slate-700">
                    สัดส่วนประเภทบัญชี (นร.)
                  </span>
                </div>
              }
              variant="borderless"
              className="shadow-md rounded-3xl h-full border border-slate-100"
            >
              <div className="h-[350px] flex items-center justify-center p-2">
                <Doughnut
                  data={typeDoughnutData}
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          padding: 10,
                          boxWidth: 8,
                          font: { size: 10, family: "Kanit" },
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                    <PieChartOutlined style={{ fontSize: 18 }} />
                  </div>
                  <span className="font-bold text-lg text-slate-700">
                    สัดส่วนคุณภาพเกรด
                  </span>
                </div>
              }
              variant="borderless"
              className="shadow-md rounded-3xl h-full border border-slate-100"
            >
              <div className="h-[350px] flex items-center justify-center p-2">
                <Doughnut
                  data={doughnutChartData}
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 3. Detailed Table - Full Width */}
        <Card
          title={
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                <TrophyOutlined style={{ fontSize: 18 }} />
              </div>
              <span className="font-bold text-lg text-slate-700">
                ตารางอันดับและรายละเอียดรายบุคคล
              </span>
            </div>
          }
          variant="borderless"
          className="shadow-md rounded-3xl overflow-hidden border border-slate-100"
          styles={{
            header: {
              borderBottom: "1px solid #f1f5f9",
              padding: "20px 24px",
            },
            body: { padding: 0 },
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
            rowClassName={() => "hover:bg-slate-50 transition-colors"}
          />
        </Card>
      </div>
    </Modal>
  );
}
