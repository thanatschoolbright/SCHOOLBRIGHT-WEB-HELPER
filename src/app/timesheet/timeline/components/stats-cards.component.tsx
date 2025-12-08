import React from "react";
import { Row, Col, Card, Statistic, theme } from "antd";
import { useTranslation } from "react-i18next";

type TimelineStats = {
  total: number;
  active: number;
  upcoming: number;
  ended: number;
};

interface StatsCardsProps {
  stats: TimelineStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card  style={{ boxShadow: token.boxShadowTertiary }}>
          <Statistic
            title={t("timeline_page.stats_total")}
            value={stats.total}
            valueStyle={{ color: token.colorText }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card  style={{ boxShadow: token.boxShadowTertiary }}>
          <Statistic
            title={t("timeline_page.stats_active")}
            value={stats.active}
            valueStyle={{ color: token.colorSuccess }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card  style={{ boxShadow: token.boxShadowTertiary }}>
          <Statistic
            title={t("timeline_page.stats_upcoming")}
            value={stats.upcoming}
            valueStyle={{ color: token.colorWarning }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card  style={{ boxShadow: token.boxShadowTertiary }}>
          <Statistic
            title={t("timeline_page.stats_ended")}
            value={stats.ended}
            valueStyle={{ color: token.colorTextDisabled }}
          />
        </Card>
      </Col>
    </Row>
  );
};
