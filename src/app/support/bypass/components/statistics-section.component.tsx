import {
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  DashboardOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic, Typography, theme } from "antd";
import type { Statistics } from "../types/bypass.types";

const { Text } = Typography;

type StatisticsSectionProps = {
  statistics: Statistics;
};

export default function StatisticsSection({
  statistics,
}: StatisticsSectionProps): JSX.Element {
  const { token } = theme.useToken();

  const statsConfigs = [
    {
      title: "Total Schools",
      value: statistics.total,
      icon: <BankOutlined />,
      color: token.colorPrimary,
      bgColor: token.colorPrimaryBg,
    },
    {
      title: "Active Systems",
      value: statistics.active,
      icon: <CheckCircleOutlined />,
      color: token.colorSuccess,
      bgColor: token.colorSuccessBg,
    },
    {
      title: "Inactive / Pending",
      value: statistics.inactive,
      icon: <CloseCircleOutlined />,
      color: token.colorError,
      bgColor: token.colorErrorBg,
    },
    {
      title: "Grade A Elite",
      value: statistics.gradeA,
      icon: <CrownOutlined />,
      color: "#faad14",
      bgColor: "#fffbe6",
    },
    {
      title: "Total Students",
      value: statistics.totalStudents,
      icon: <TeamOutlined />,
      color: "#722ed1",
      bgColor: "#f9f0ff",
      isNumber: true,
    },
    {
      title: "Avg Students/School",
      value: statistics.averageStudentsPerSchool,
      icon: <DashboardOutlined />,
      color: "#13c2c2",
      bgColor: "#e6fffb",
      precision: 2,
    },
    {
      title: "Active Students",
      value: statistics.activeStudents,
      icon: <CheckCircleOutlined />,
      color: "#237804",
      bgColor: "#f6ffed",
      isNumber: true,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {statsConfigs.map((cfg) => (
        <Col xs={24} sm={12} md={6} xl={cfg.isNumber ? 6 : 4} key={cfg.title}>
          <Card
            variant="borderless"
            styles={{
              body: {
                padding: "20px",
                borderRadius: 16,
                height: "100%",
              },
            }}
            style={{
              background: cfg.bgColor,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ color: cfg.color, fontSize: 13 }}>
                  {cfg.title}
                </Text>
              }
              value={cfg.value}
              precision={cfg.precision}
              prefix={cfg.icon}
              valueStyle={{
                color: token.colorText,
                fontWeight: 700,
                fontSize: 24,
              }}
              formatter={(val) =>
                typeof val === "number" ? val.toLocaleString() : val
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
