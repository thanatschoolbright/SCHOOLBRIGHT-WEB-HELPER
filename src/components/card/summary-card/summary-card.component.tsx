import React from "react";
import {
  Card,
  Row,
  Col,
  Flex,
  Statistic,
  Progress,
  Typography,
  Space,
  Tooltip,
  Skeleton,
} from "antd";
import {
  InfoCircleOutlined,
  PieChartOutlined,
  AppstoreOutlined,
  RocketOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export interface SummaryCardItem {
  label: string;
  value: number;
  percent: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
  suffix: string;
  tooltip: React.ReactNode;
}

export interface SummaryCardsProps {
  stats: any;
  token: any;
  items?: SummaryCardItem[];
  title?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  token,
  items: customItems,
  title = "ภาพรวมโครงการ (Project Health)",
  icon = <PieChartOutlined />,
  loading = false,
}) => {
  const cardStyle = {
    background: token.colorBgContainer,
    borderRadius: 16,
    border: `1px solid ${token.colorBorderSecondary}`,
    height: "100%",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
  };

  const cardHoverStyle = {
    transform: "translateY(-4px)",
    boxShadow: `0 12px 24px -4px ${token.colorPrimary}20, 0 8px 16px -8px ${token.colorPrimary}30`,
    borderColor: token.colorPrimary,
  };

  const iconBoxStyle = (color: string, bg: string) => ({
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    color: color,
    background: bg,
    transition: "all 0.3s ease",
  });

  const tooltipContent = (
    label: string,
    source: string,
    calc: string,
    utility: string,
  ) => (
    <div style={{ padding: "4px" }}>
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
          borderBottom: `1px solid rgba(255,255,255,0.2)`,
          paddingBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ color: "#fff", fontSize: 11 }}>
          ที่มา:
        </Text>{" "}
        <span style={{ fontSize: 11 }}>{source}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ color: "#fff", fontSize: 11 }}>
          การคำนวณ:
        </Text>{" "}
        <span style={{ fontSize: 11 }}>{calc}</span>
      </div>
      <div>
        <Text strong style={{ color: "#fff", fontSize: 11 }}>
          ประโยชน์:
        </Text>{" "}
        <span style={{ fontSize: 11 }}>{utility}</span>
      </div>
    </div>
  );

  if (loading || !stats?.health) {
    return (
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} xl={6} key={i}>
              <Skeleton active />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const { health } = stats;

  const defaultItems: SummaryCardItem[] = [
    {
      label: "โครงการทั้งหมด",
      value: health.total,
      percent: 100,
      color: token.colorPrimary,
      bg: token.colorPrimaryBg,
      icon: <AppstoreOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "โครงการทั้งหมด",
        "ดึงข้อมูลจากฐานข้อมูลโครงการ (ยกเว้นที่ถูกลบ)",
        "นับจำนวนโครงการทั้งหมดที่อยู่ในระบบ",
        "ใช้ดูภาพรวมปริมาณโครงการทั้งหมดที่เคยบริหารจัดการ",
      ),
    },
    {
      label: "กำลังดำเนินการ",
      value: health.active,
      percent: health.total > 0 ? (health.active / health.total) * 100 : 0,
      color: token.colorSuccess,
      bg: token.colorSuccessBg,
      icon: <RocketOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "กำลังดำเนินการ",
        "โครงการที่มีสถานะเป็น 'เปิดใช้งาน'",
        "กรองโครงการที่มีสถานะ Open",
        "ช่วยติดตามความคืบหน้าของงานปัจจุบันที่กำลังทำอยู่",
      ),
    },
    {
      label: "ปิดโครงการแล้ว",
      value: health.closed,
      percent: health.total > 0 ? (health.closed / health.total) * 100 : 0,
      color: token.colorTextSecondary,
      bg: token.colorFillSecondary,
      icon: <CheckCircleOutlined />,
      suffix: "โครงการ",
      tooltip: tooltipContent(
        "ปิดโครงการแล้ว",
        "โครงการที่มีสถานะเป็น 'ปิดโครงการ' หรือเสร็จแล้ว",
        "กรองโครงการที่มีสถานะ Closed",
        "ใช้สำรวจโครงการที่จบไปแล้วเพื่อสรุปยอดหรืองานย้อนหลัง",
      ),
    },
    {
      label: "อัตราความสำเร็จ",
      value: health.success_rate,
      percent: health.success_rate,
      color: token.colorWarning,
      bg: token.colorWarningBg,
      icon: <PieChartOutlined />,
      suffix: "%",
      tooltip: tooltipContent(
        "อัตราความสำเร็จ",
        "คำนวณจากสัดส่วนโครงการที่ปิดแล้ว",
        "(จำนวนที่ปิด / จำนวนทั้งหมด) x 100",
        "วัดประสิทธิภาพการบริหารโครงการให้เสร็จสิ้นตามเป้าหมาย",
      ),
    },
  ];

  const items = customItems || defaultItems;

  return (
    <div className="mb-6">
      <Space className="mb-4">
        {icon}
        <Text strong style={{ fontSize: 15 }}>
          {title}
        </Text>
      </Space>
      <Row gutter={[16, 16]}>
        {items.map((item, idx) => (
          <Col xs={24} sm={12} xl={6} key={idx}>
            <Card
              styles={{ body: { padding: 24 } }}
              className="summary-card-hover"
              style={cardStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
                const iconBox = e.currentTarget.querySelector(
                  ".icon-box",
                ) as HTMLElement;
                if (iconBox) {
                  iconBox.style.transform = "rotate(5deg) scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = token.colorBorderSecondary;
                const iconBox = e.currentTarget.querySelector(
                  ".icon-box",
                ) as HTMLElement;
                if (iconBox) {
                  iconBox.style.transform = "rotate(0deg) scale(1)";
                }
              }}
            >
              <Flex justify="space-between" align="start">
                <Flex vertical gap={4}>
                  <Tooltip title={item.tooltip} placement="topLeft" arrow>
                    <Text
                      type="secondary"
                      style={{ fontSize: 14, cursor: "help", fontWeight: 500 }}
                    >
                      {item.label}{" "}
                      <InfoCircleOutlined
                        style={{ fontSize: 10, opacity: 0.5 }}
                      />
                    </Text>
                  </Tooltip>
                  <Statistic
                    value={item.value}
                    valueStyle={{
                      fontWeight: 700,
                      fontSize: 32,
                      color: token.colorText,
                    }}
                    suffix={
                      <span
                        style={{
                          fontSize: 14,
                          color: token.colorTextQuaternary,
                        }}
                      >
                        {item.suffix}
                      </span>
                    }
                  />
                </Flex>
                <div
                  className="icon-box"
                  style={iconBoxStyle(item.color, item.bg)}
                >
                  {item.icon}
                </div>
              </Flex>
              <div className="mt-4">
                <Progress
                  percent={item.percent}
                  showInfo={false}
                  strokeColor={item.color}
                  trailColor={token.colorFillSecondary}
                  size="small"
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SummaryCards;
