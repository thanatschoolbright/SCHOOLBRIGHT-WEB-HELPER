import React, { useMemo } from "react";
import {
  Modal,
  Table,
  Tag,
  Progress,
  Space,
  Statistic,
  Row,
  Col,
  Card,
  Divider,
  Button,
} from "antd";
import {
  TrophyOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  UserOutlined,
  TableOutlined,
  AlertOutlined,
  TeamOutlined,
  DashboardOutlined,
  FundOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import type { SaleStatistics } from "../types/sale-stats.types";

type SaleRankingModalProps = {
  open: boolean;
  onClose: () => void;
  data: SaleStatistics[];
};

export default function SaleRankingModal({
  open,
  onClose,
  data,
}: SaleRankingModalProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  const [showMetrics, setShowMetrics] = React.useState(false);

  const topData = useMemo(() => data, [data]);

  // Metrics Calculation
  const metricsData = useMemo(() => {
    // Top Quality: High Activation Rate (min 5 schools)
    const topQuality = [...data]
      .filter((s) => s.totalSchools >= 5)
      .sort((a, b) => b.activationRate - a.activationRate)
      .slice(0, 3);

    // High Value: Most Grade A Schools
    const highValue = [...data]
      .sort((a, b) => b.gradeACount - a.gradeACount)
      .slice(0, 3);

    // Critical: Most Inactive Schools
    const critical = [...data]
      .sort((a, b) => b.inactiveSchools - a.inactiveSchools)
      .slice(0, 3);

    // Student Reach: Highest student footprint
    const topStudentReach = [...data]
      .filter((s) => s.totalStudents > 0)
      .sort((a, b) => b.totalStudents - a.totalStudents)
      .slice(0, 3);

    // Coverage: % of students in active schools
    const bestCoverage = [...data]
      .filter((s) => s.totalStudents > 0)
      .sort((a, b) => b.studentCoverageRate - a.studentCoverageRate)
      .slice(0, 3);

    return { topQuality, highValue, critical, topStudentReach, bestCoverage };
  }, [data]);

  const totalSchools = useMemo(
    () => data.reduce((sum, item) => sum + item.totalSchools, 0),
    [data]
  );

  const totalActive = useMemo(
    () => data.reduce((sum, item) => sum + item.activeSchools, 0),
    [data]
  );

  const totalGradeA = useMemo(
    () => data.reduce((sum, item) => sum + item.gradeACount, 0),
    [data]
  );

  const totalStudents = useMemo(
    () => data.reduce((sum, item) => sum + item.totalStudents, 0),
    [data]
  );

  const activeStudents = useMemo(
    () => data.reduce((sum, item) => sum + item.activeStudents, 0),
    [data]
  );

  const averageStudentsAll = useMemo(() => {
    const overallSchools = data.reduce(
      (sum, item) => sum + item.totalSchools,
      0
    );
    return overallSchools > 0
      ? Number((totalStudents / overallSchools).toFixed(2))
      : 0;
  }, [data, totalStudents]);

  // ... (Keep existing columns definition)
  const columns = useMemo<ColumnsType<SaleStatistics>>(
    () => [
      {
        title: TRANSLATION("sale_ranking_modal.col_rank"),
        key: "rank",
        width: 80,
        align: "center",
        fixed: "left",
        render: (_value, _record, index) => {
          const icons = [
            <TrophyOutlined style={{ color: "#FFD700", fontSize: 20 }} />,
            <TrophyOutlined style={{ color: "#C0C0C0", fontSize: 18 }} />,
            <TrophyOutlined style={{ color: "#CD7F32", fontSize: 16 }} />,
          ];
          return (
            <Space>
              {index < 3 ? icons[index] : null}
              <span style={{ fontWeight: index < 3 ? "bold" : "normal" }}>
                {index + 1}
              </span>
            </Space>
          );
        },
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_sale_name"),
        dataIndex: "saleName",
        key: "saleName",
        width: 180,
        fixed: "left",
        render: (value, _record, index) => (
          <Space>
            <UserOutlined />
            <span
              style={{
                fontWeight: index < 3 ? "bold" : 500,
                fontSize: index === 0 ? 16 : 14,
              }}
            >
              {value}
            </span>
          </Space>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_total_schools"),
        dataIndex: "totalSchools",
        key: "totalSchools",
        width: 140,
        align: "center",
        sorter: (a, b) => a.totalSchools - b.totalSchools,
        render: (value) => (
          <Tag color="blue" style={{ fontSize: 14, fontWeight: "bold" }}>
            {value.toLocaleString()}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_total_students"),
        dataIndex: "totalStudents",
        key: "totalStudents",
        width: 160,
        align: "center",
        sorter: (a, b) => a.totalStudents - b.totalStudents,
        render: (value) => (
          <Tag color="purple" icon={<TeamOutlined />} style={{ fontSize: 14 }}>
            {value.toLocaleString()}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_active_schools"),
        dataIndex: "activeSchools",
        key: "activeSchools",
        width: 120,
        align: "center",
        sorter: (a, b) => a.activeSchools - b.activeSchools,
        render: (value) => (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            {value}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_active_students"),
        dataIndex: "activeStudents",
        key: "activeStudents",
        width: 150,
        align: "center",
        sorter: (a, b) => a.activeStudents - b.activeStudents,
        render: (value) => (
          <Tag color="success" icon={<TeamOutlined />}>
            {value.toLocaleString()}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_inactive_schools"),
        dataIndex: "inactiveSchools",
        key: "inactiveSchools",
        width: 120,
        align: "center",
        sorter: (a, b) => a.inactiveSchools - b.inactiveSchools,
        render: (value) => (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            {value}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_activation_rate"),
        dataIndex: "activationRate",
        key: "activationRate",
        width: 180,
        align: "center",
        sorter: (a, b) => a.activationRate - b.activationRate,
        render: (value) => (
          <Progress
            percent={Number(value.toFixed(1))}
            size="small"
            status={
              value >= 80 ? "success" : value >= 50 ? "normal" : "exception"
            }
            strokeColor={
              value >= 80 ? "#52c41a" : value >= 50 ? "#1890ff" : "#ff4d4f"
            }
          />
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_student_coverage"),
        dataIndex: "studentCoverageRate",
        key: "studentCoverageRate",
        width: 180,
        align: "center",
        sorter: (a, b) => a.studentCoverageRate - b.studentCoverageRate,
        render: (value) => (
          <Progress
            percent={Number(value.toFixed(1))}
            size="small"
            status={
              value >= 80 ? "success" : value >= 50 ? "normal" : "exception"
            }
            strokeColor={
              value >= 80 ? "#722ed1" : value >= 50 ? "#1890ff" : "#ff4d4f"
            }
          />
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_average_students"),
        dataIndex: "averageStudentsPerSchool",
        key: "averageStudentsPerSchool",
        width: 160,
        align: "center",
        sorter: (a, b) =>
          a.averageStudentsPerSchool - b.averageStudentsPerSchool,
        render: (value) => (
          <Tag color="cyan" icon={<DashboardOutlined />}>
            {value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 0,
            })}
          </Tag>
        ),
      },
      {
        title: (
          <Space>
            <CrownOutlined style={{ color: "#FFD700" }} />
            <span>{TRANSLATION("sale_ranking_modal.col_grade_a")}</span>
          </Space>
        ),
        dataIndex: "gradeACount",
        key: "gradeACount",
        width: 100,
        align: "center",
        sorter: (a, b) => a.gradeACount - b.gradeACount,
        render: (value) => (
          <Tag color="gold" icon={<CrownOutlined />}>
            {value}
          </Tag>
        ),
      },
      {
        title: (
          <Space>
            <StarOutlined style={{ color: "#52c41a" }} />
            <span>{TRANSLATION("sale_ranking_modal.col_grade_b")}</span>
          </Space>
        ),
        dataIndex: "gradeBCount",
        key: "gradeBCount",
        width: 100,
        align: "center",
        sorter: (a, b) => a.gradeBCount - b.gradeBCount,
        render: (value) => (
          <Tag color="green" icon={<StarOutlined />}>
            {value}
          </Tag>
        ),
      },
      {
        title: (
          <Space>
            <RocketOutlined style={{ color: "#1890ff" }} />
            <span>{TRANSLATION("sale_ranking_modal.col_grade_c")}</span>
          </Space>
        ),
        dataIndex: "gradeCCount",
        key: "gradeCCount",
        width: 100,
        align: "center",
        sorter: (a, b) => a.gradeCCount - b.gradeCCount,
        render: (value) => (
          <Tag color="blue" icon={<RocketOutlined />}>
            {value}
          </Tag>
        ),
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_average_grade"),
        dataIndex: "averageGrade",
        key: "averageGrade",
        width: 120,
        align: "center",
        sorter: (a, b) =>
          parseFloat(a.averageGrade) - parseFloat(b.averageGrade),
        render: (value) => {
          const numValue = parseFloat(value);
          const color =
            numValue >= 3.5
              ? "gold"
              : numValue >= 2.5
              ? "green"
              : numValue >= 1.5
              ? "blue"
              : "default";
          return (
            <Tag color={color} style={{ fontWeight: "bold" }}>
              {value}
            </Tag>
          );
        },
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_software_type"),
        dataIndex: "softwareTypeCount",
        key: "softwareTypeCount",
        width: 120,
        align: "center",
        sorter: (a, b) => a.softwareTypeCount - b.softwareTypeCount,
        render: (value) => <Tag color="green">{value}</Tag>,
      },
      {
        title: TRANSLATION("sale_ranking_modal.col_single_authen"),
        dataIndex: "singleAuthenCount",
        key: "singleAuthenCount",
        width: 120,
        align: "center",
        sorter: (a, b) => a.singleAuthenCount - b.singleAuthenCount,
        render: (value) => <Tag color="blue">{value}</Tag>,
      },
    ],
    [TRANSLATION]
  );

  return (
    <Modal
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <Space>
            <TrophyOutlined style={{ color: "#FFD700", fontSize: 24 }} />
            <span style={{ fontSize: 18, fontWeight: "bold" }}>
              {TRANSLATION("sale_ranking_modal.title")}
            </span>
          </Space>
          <Button
            type={showMetrics ? "default" : "primary"}
            icon={showMetrics ? <TableOutlined /> : <RiseOutlined />}
            onClick={() => setShowMetrics(!showMetrics)}
            className={
              showMetrics
                ? ""
                : "bg-gradient-to-r from-blue-500 to-purple-600 border-none"
            }
          >
            {showMetrics
              ? TRANSLATION("sale_ranking_modal.view_table")
              : TRANSLATION("sale_ranking_modal.view_metrics")}
          </Button>
        </div>
      }
      open={open}
      onCancel={onClose}
      width="95%"
      style={{ top: 20 }}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Summary Statistics (Always Visible) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={TRANSLATION("sale_ranking_modal.stat_total_sales")}
                value={data.length}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={TRANSLATION("sale_ranking_modal.stat_total_schools")}
                value={totalSchools}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={TRANSLATION("sale_ranking_modal.stat_active_schools")}
                value={totalActive}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={TRANSLATION("sale_ranking_modal.stat_grade_a_total")}
                value={totalGradeA}
                prefix={<CrownOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={TRANSLATION("sale_ranking_modal.stat_total_students")}
                value={totalStudents}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#722ed1" }}
                formatter={(value) =>
                  typeof value === "number"
                    ? value.toLocaleString("th-TH")
                    : value
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={TRANSLATION("sale_ranking_modal.stat_active_students")}
                value={activeStudents}
                prefix={<FundOutlined />}
                valueStyle={{ color: "#237804" }}
                formatter={(value) =>
                  typeof value === "number"
                    ? value.toLocaleString("th-TH")
                    : value
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title={
                  TRANSLATION("sale_ranking_modal.stat_average_students_per_school")
                }
                value={averageStudentsAll}
                prefix={<DashboardOutlined />}
                precision={2}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">
          {showMetrics
            ? TRANSLATION("sale_ranking_modal.metrics_title")
            : TRANSLATION("sale_ranking_modal.table_title")}
        </Divider>

        {showMetrics ? (
          <div className="animate-fade-in">
            <Row gutter={[24, 24]}>
              {/* Top Quality Sales */}
              <Col xs={24} md={8}>
                <Card
                  title={
                    <Space>
                      <StarOutlined style={{ color: "#52c41a" }} />
                      {TRANSLATION("sale_ranking_modal.metric_top_quality")}
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Space direction="vertical" className="w-full">
                    {metricsData.topQuality.map((sale, index) => (
                      <div
                        key={sale.saleName}
                        className="flex justify-between items-center p-2 bg-green-50 rounded-lg"
                      >
                        <Space>
                          <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">
                            {index + 1}
                          </div>
                          <span className="font-medium">{sale.saleName}</span>
                        </Space>
                        <Tag color="success">
                          {sale.activationRate.toFixed(1)}% Active
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              {/* Student Reach */}
              <Col xs={24} md={8}>
                <Card
                  title={
                    <Space>
                      <TeamOutlined style={{ color: "#722ed1" }} />
                      {TRANSLATION("sale_ranking_modal.metric_student_reach")}
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Space direction="vertical" className="w-full">
                    {metricsData.topStudentReach.map((sale, index) => (
                      <div
                        key={sale.saleName}
                        className="flex justify-between items-center p-2 bg-purple-50 rounded-lg"
                      >
                        <Space>
                          <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-800">
                            {index + 1}
                          </div>
                          <span className="font-medium">{sale.saleName}</span>
                        </Space>
                        <Tag color="purple">
                          {sale.totalStudents.toLocaleString()} {TRANSLATION("sale_ranking_modal.metric_students")}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              {/* Best Coverage */}
              <Col xs={24} md={8}>
                <Card
                  title={
                    <Space>
                      <FundOutlined style={{ color: "#13c2c2" }} />
                      {TRANSLATION("sale_ranking_modal.metric_best_coverage")}
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Space direction="vertical" className="w-full">
                    {metricsData.bestCoverage.map((sale, index) => (
                      <div
                        key={sale.saleName}
                        className="flex justify-between items-center p-2 bg-cyan-50 rounded-lg"
                      >
                        <Space>
                          <div className="w-6 h-6 rounded-full bg-cyan-200 flex items-center justify-center text-xs font-bold text-cyan-800">
                            {index + 1}
                          </div>
                          <span className="font-medium">{sale.saleName}</span>
                        </Space>
                        <Tag color="cyan">
                          {sale.studentCoverageRate.toFixed(1)}% {TRANSLATION("sale_ranking_modal.metric_active_students")}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              {/* High Value Portfolio */}
              <Col xs={24} md={8}>
                <Card
                  title={
                    <Space>
                      <CrownOutlined style={{ color: "#faad14" }} />
                      {TRANSLATION("sale_ranking_modal.metric_high_value")}
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Space direction="vertical" className="w-full">
                    {metricsData.highValue.map((sale, index) => (
                      <div
                        key={sale.saleName}
                        className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg"
                      >
                        <Space>
                          <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-xs font-bold text-yellow-800">
                            {index + 1}
                          </div>
                          <span className="font-medium">{sale.saleName}</span>
                        </Space>
                        <Tag color="gold">{sale.gradeACount} Grade A</Tag>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>

              {/* Critical Attention */}
              <Col xs={24} md={8}>
                <Card
                  title={
                    <Space>
                      <AlertOutlined style={{ color: "#ff4d4f" }} />
                      {TRANSLATION("sale_ranking_modal.metric_critical")}
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Space direction="vertical" className="w-full">
                    {metricsData.critical.map((sale, index) => (
                      <div
                        key={sale.saleName}
                        className="flex justify-between items-center p-2 bg-red-50 rounded-lg"
                      >
                        <Space>
                          <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center text-xs font-bold text-red-800">
                            {index + 1}
                          </div>
                          <span className="font-medium">{sale.saleName}</span>
                        </Space>
                        <Tag color="error">{sale.inactiveSchools} Inactive</Tag>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <Table<SaleStatistics>
            columns={columns}
            dataSource={topData}
            rowKey={(record) => record.saleName}
            pagination={false}
            scroll={{ x: 2000 }}
            size="middle"
            bordered
            rowClassName={(record, index) => {
              if (index === 0) return "bg-yellow-50";
              if (index === 1) return "bg-gray-50";
              if (index === 2) return "bg-orange-50";
              return "";
            }}
          />
        )}
      </Space>
    </Modal>
  );
}
