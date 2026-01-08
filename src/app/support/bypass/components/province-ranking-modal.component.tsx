"use client";

import React, { useMemo } from "react";
import {
  Modal,
  Table,
  Tag,
  Progress,
  Space,
  Row,
  Col,
  Card,
  theme,
  Typography,
  Tooltip,
  Statistic,
} from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  BankOutlined,
  InfoCircleOutlined,
  PieChartOutlined,
  BarChartOutlined,
  StarFilled,
  TeamOutlined,
  FileDoneOutlined,
  ExperimentOutlined,
  GiftOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { ProvinceStatistics } from "../types/province-stats.types";

// * Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
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

  const stats = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        totalSchools: acc.totalSchools + item.totalSchools,
        activeSchools: acc.activeSchools + item.activeSchools,
        gradeA: acc.gradeA + item.gradeACount,
        gradeB: acc.gradeB + item.gradeBCount,
        gradeC: acc.gradeC + item.gradeCCount,
        customerCount: acc.customerCount + (item.customerCount || 0),
        contractCount: acc.contractCount + (item.contractCount || 0),
        testCount: acc.testCount + (item.testCount || 0),
        freeCount: acc.freeCount + (item.freeCount || 0),
        otherCount: acc.otherCount + (item.otherCount || 0),
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
      }
    );
  }, [data]);

  // * ==========================================================================
  // * CHART CONFIGURATION
  // * ==========================================================================

  const barChartData = {
    labels: top10Data.map((d) => d.province),
    datasets: [
      {
        label: "ใช้งานอยู่",
        data: top10Data.map((d) => d.activeSchools),
        backgroundColor: token.colorSuccess,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: "ไม่ได้ใช้งาน",
        data: top10Data.map((d) => d.inactiveSchools),
        backgroundColor: token.colorError,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

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

  const schoolDataTypeChartData = {
    labels: ["ลูกค้า", "ทำสัญญา", "Test", "ลูกค้าฟรี", "หลักสูตรอิสลาม"],
    datasets: [
      {
        data: [
          stats.customerCount,
          stats.contractCount,
          stats.testCount,
          stats.freeCount,
          stats.otherCount,
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
        title: "จังหวัด",
        dataIndex: "province",
        key: "province",
        width: 150,
        fixed: "left",
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: (
          <Space>
            <span>ทั้งหมด</span>
            <Tooltip title="จำนวนโรงเรียนทั้งหมดในจังหวัดนี้ที่มีในระบบ">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 100,
        align: "right",
        sorter: (a, b) => a.totalSchools - b.totalSchools,
        render: (val) => <Text>{val.toLocaleString()}</Text>,
      },
      {
        title: (
          <Space>
            <span>ใช้งาน</span>
            <Tooltip title="จำนวนโรงเรียนที่มีสถานะ Active (กำลังใช้งาน)">
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
            <span>อัตราส่วน</span>
            <Tooltip title="สัดส่วนโรงเรียนที่ใช้งานจริงเทียบกับทั้งหมด (%)">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "activationRate",
        key: "activationRate",
        width: 150,
        sorter: (a, b) => a.activationRate - b.activationRate,
        render: (val) => (
          <Tooltip title={`${val.toFixed(2)}% Active Rate`}>
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
        title: "ลูกค้า",
        dataIndex: "customerCount",
        key: "customerCount",
        width: 100,
        align: "right",
        sorter: (a, b) => a.customerCount - b.customerCount,
        render: (val) => <Text style={{ color: "#3b82f6" }}>{val}</Text>,
      },
      {
        title: "ทำสัญญา",
        dataIndex: "contractCount",
        key: "contractCount",
        width: 110,
        align: "right",
        sorter: (a, b) => a.contractCount - b.contractCount,
        render: (val) => <Text style={{ color: "#10b981" }}>{val}</Text>,
      },
      {
        title: "Test",
        dataIndex: "testCount",
        key: "testCount",
        width: 100,
        align: "right",
        sorter: (a, b) => a.testCount - b.testCount,
        render: (val) => <Text style={{ color: "#f59e0b" }}>{val}</Text>,
      },
      {
        title: "ฟรี",
        dataIndex: "freeCount",
        key: "freeCount",
        width: 100,
        align: "right",
        sorter: (a, b) => a.freeCount - b.freeCount,
        render: (val) => <Text style={{ color: "#8b5cf6" }}>{val}</Text>,
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
        title: (
          <Space>
            <span>เกรดเฉลี่ย</span>
            <Tooltip title="เกรดเฉลี่ยภาพรวมคุณภาพโรงเรียนในจังหวัด">
              <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
            </Tooltip>
          </Space>
        ),
        dataIndex: "averageGrade",
        key: "averageGrade",
        width: 120,
        align: "center",
        sorter: (a, b) =>
          parseFloat(a.averageGrade) - parseFloat(b.averageGrade),
        render: (val) => {
          const num = parseFloat(val);
          const color =
            num >= 3.5 ? "success" : num >= 2.5 ? "processing" : "error";
          return <Tag color={color}>{val}</Tag>;
        },
      },
    ],
    [token]
  );

  return (
    <Modal
      title={
        <Space>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <TrophyOutlined style={{ fontSize: 20 }} />
          </div>
          <div className="flex flex-col">
            <span style={{ fontSize: 18, fontWeight: 700 }}>อันดับจังหวัด</span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              วิเคราะห์ข้อมูล 10 อันดับจังหวัดที่มีจำนวนโรงเรียนมากที่สุด
            </Text>
          </div>
        </Space>
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
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
        header: {
          padding: "24px 32px",
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
      <div className="space-y-6">
        {/* 1. Enhanced Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              className="shadow-sm rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
              style={{ background: token.colorBgContainer }}
            >
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-[100px] text-indigo-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                <BankOutlined />
              </div>
              <Statistic
                title={
                  <Space>
                    <span>โรงเรียนทั้งหมด</span>
                    <Tooltip title="นับรวมทุกโรงเรียนที่มีในฐานข้อมูล">
                      <InfoCircleOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      />
                    </Tooltip>
                  </Space>
                }
                value={stats.totalSchools}
                prefix={<BankOutlined className="text-indigo-500" />}
                valueStyle={{
                  fontWeight: 800,
                  color: token.colorText,
                  fontSize: 32,
                }}
                suffix={
                  <span className="text-sm text-slate-400 font-normal">
                    แห่ง
                  </span>
                }
              />
              <div className="mt-2 text-xs text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded">
                โรงเรียนทั้งหมด
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="shadow-sm rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
              style={{ background: token.colorBgContainer }}
            >
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-[100px] text-emerald-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                <CheckCircleOutlined />
              </div>
              <Statistic
                title={
                  <Space>
                    <span>ใช้งานอยู่</span>
                    <Tooltip title="โรงเรียนที่มีการล็อกอินหรือใช้งานในช่วงเวลาที่กำหนด">
                      <InfoCircleOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      />
                    </Tooltip>
                  </Space>
                }
                value={stats.activeSchools}
                prefix={<CheckCircleOutlined className="text-emerald-500" />}
                valueStyle={{
                  fontWeight: 800,
                  color: token.colorSuccess,
                  fontSize: 32,
                }}
                suffix={
                  <span className="text-sm font-normal text-emerald-600/80 ml-1">
                    (
                    {((stats.activeSchools / stats.totalSchools) * 100).toFixed(
                      1
                    )}
                    %)
                  </span>
                }
              />
              <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                ออนไลน์ขณะนี้
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="shadow-sm rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
              style={{ background: token.colorBgContainer }}
            >
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-[100px] text-amber-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                <StarFilled />
              </div>
              <Statistic
                title={
                  <Space>
                    <span>คุณภาพระดับ A</span>
                    <Tooltip title="โรงเรียนที่ได้รับการประเมินคุณภาพระดับดีเยี่ยม (Grade A)">
                      <InfoCircleOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorTextSecondary,
                        }}
                      />
                    </Tooltip>
                  </Space>
                }
                value={stats.gradeA}
                prefix={<CrownOutlined className="text-amber-500" />}
                valueStyle={{
                  fontWeight: 800,
                  color: token.colorWarning,
                  fontSize: 32,
                }}
                suffix={
                  <span className="text-sm text-slate-400 font-normal">
                    แห่ง
                  </span>
                }
              />
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded">
                ประสิทธิภาพสูงสุด
              </div>
            </Card>
          </Col>
        </Row>

        {/* 2. School Data Type Summary Cards */}
        <div style={{ marginBottom: 16 }}>
          <AntTitle
            level={5}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <InfoCircleOutlined style={{ color: token.colorPrimary }} />
            <span>สรุปประเภทข้อมูลโรงเรียน</span>
          </AntTitle>
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              sm={12}
              lg={4.8}
              style={{ flex: "0 0 20%", maxWidth: "20%" }}
            >
              <Card
                className="shadow-sm rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ background: token.colorBgContainer }}
              >
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px] text-blue-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <TeamOutlined />
                </div>
                <Statistic
                  title="ลูกค้า"
                  value={stats.customerCount}
                  valueStyle={{
                    fontWeight: 800,
                    color: "#3b82f6",
                    fontSize: 28,
                  }}
                  suffix={
                    <span className="text-xs text-slate-400 font-normal">
                      แห่ง
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4.8}
              style={{ flex: "0 0 20%", maxWidth: "20%" }}
            >
              <Card
                className="shadow-sm rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ background: token.colorBgContainer }}
              >
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px] text-emerald-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <FileDoneOutlined />
                </div>
                <Statistic
                  title="ทำสัญญา"
                  value={stats.contractCount}
                  valueStyle={{
                    fontWeight: 800,
                    color: "#10b981",
                    fontSize: 28,
                  }}
                  suffix={
                    <span className="text-xs text-slate-400 font-normal">
                      แห่ง
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4.8}
              style={{ flex: "0 0 20%", maxWidth: "20%" }}
            >
              <Card
                className="shadow-sm rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ background: token.colorBgContainer }}
              >
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px] text-amber-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <ExperimentOutlined />
                </div>
                <Statistic
                  title="Test"
                  value={stats.testCount}
                  valueStyle={{
                    fontWeight: 800,
                    color: "#f59e0b",
                    fontSize: 28,
                  }}
                  suffix={
                    <span className="text-xs text-slate-400 font-normal">
                      แห่ง
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4.8}
              style={{ flex: "0 0 20%", maxWidth: "20%" }}
            >
              <Card
                className="shadow-sm rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ background: token.colorBgContainer }}
              >
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px] text-violet-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <GiftOutlined />
                </div>
                <Statistic
                  title="ลูกค้าฟรี"
                  value={stats.freeCount}
                  valueStyle={{
                    fontWeight: 800,
                    color: "#8b5cf6",
                    fontSize: 28,
                  }}
                  suffix={
                    <span className="text-xs text-slate-400 font-normal">
                      แห่ง
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col
              xs={24}
              sm={12}
              lg={4.8}
              style={{ flex: "0 0 20%", maxWidth: "20%" }}
            >
              <Card
                className="shadow-sm rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full"
                style={{ background: token.colorBgContainer }}
              >
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[60px] text-indigo-500 rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <GlobalOutlined />
                </div>
                <Statistic
                  title="หลักสูตรอิสลาม"
                  value={stats.otherCount}
                  valueStyle={{
                    fontWeight: 800,
                    color: "#6366f1",
                    fontSize: 28,
                  }}
                  suffix={
                    <span className="text-xs text-slate-400 font-normal">
                      แห่ง
                    </span>
                  }
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* 3. Charts Analysis Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: token.colorPrimary }} />
                  <span>เปรียบเทียบการใช้งาน 10 อันดับแรก</span>
                </Space>
              }
              className="shadow-sm rounded-2xl h-full"
            >
              <div style={{ height: 450 }}>
                <Bar options={chartOptions} data={barChartData} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              title={
                <Space>
                  <PieChartOutlined style={{ color: token.colorSuccess }} />
                  <span>สัดส่วนคุณภาพ</span>
                </Space>
              }
              className="shadow-sm rounded-2xl h-full"
            >
              <div
                style={{
                  height: 400,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
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
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              title={
                <Space>
                  <PieChartOutlined style={{ color: token.colorInfo }} />
                  <span>สัดส่วนประเภทข้อมูล</span>
                </Space>
              }
              className="shadow-sm rounded-2xl h-full"
            >
              <div
                style={{
                  height: 400,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
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
              </div>
            </Card>
          </Col>
        </Row>

        {/* 3. Detailed Table */}
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: token.colorWarning }} />
              <span>ตารางอันดับรายจังหวัด</span>
            </Space>
          }
          className="shadow-sm rounded-2xl border"
          style={{ borderColor: token.colorBorderSecondary }}
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
      </div>
    </Modal>
  );
}
