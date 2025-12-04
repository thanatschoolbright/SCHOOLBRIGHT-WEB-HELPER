"use client";
import { Card, Row, Col, Typography, Button, Space, Tag, Divider } from "antd";
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  FireOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TEST_PROFILES } from "../utils/test-profiles";
import { LoadTestProfile } from "../types/load-test.types";

type TestProfileSelectorProps = {
  onSelectProfile: (profile: LoadTestProfile) => void;
  selectedProfile?: string;
};

const PROFILE_ICONS: Record<string, any> = {
  "Smoke Test": ExperimentOutlined,
  "Load Test": ThunderboltOutlined,
  "Stress Test": FireOutlined,
  "Spike Test": RocketOutlined,
  "Soak Test": ClockCircleOutlined,
  "Breakpoint Test": LineChartOutlined,
};

const PROFILE_COLORS: Record<string, string> = {
  "Smoke Test": "green",
  "Load Test": "blue",
  "Stress Test": "orange",
  "Spike Test": "red",
  "Soak Test": "purple",
  "Breakpoint Test": "magenta",
};

export const TestProfileSelectorComponent = ({
  onSelectProfile,
  selectedProfile,
}: TestProfileSelectorProps) => {
  const { t } = useTranslation("translate");

  return (
    <Card
      title={
        <Space>
          <ExperimentOutlined />
          {t("load_test_page.profiles.title")}
        </Space>
      }
      extra={<Tag color="gold">{t("load_test_page.profiles.quick_start")}</Tag>}
    >
      <Typography.Paragraph type="secondary">
        {t("load_test_page.profiles.description")}
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        {TEST_PROFILES.map((profile) => {
          const Icon = PROFILE_ICONS[profile.name] || ThunderboltOutlined;
          const color = PROFILE_COLORS[profile.name] || "blue";
          const isSelected = selectedProfile === profile.name;

          return (
            <Col xs={24} sm={12} lg={8} key={profile.name}>
              <Card
                size="small"
                hoverable
                style={{
                  borderColor: isSelected ? color : undefined,
                  borderWidth: isSelected ? 2 : 1,
                }}
                onClick={() => onSelectProfile(profile)}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <Icon style={{ fontSize: 20, color }} />
                    <Typography.Text strong>{profile.name}</Typography.Text>
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {profile.description}
                  </Typography.Text>
                  <Divider style={{ margin: "8px 0" }} />
                  <Space wrap>
                    <Tag color={color}>
                      {profile.vus} {t("load_test_page.profiles.vus")}
                    </Tag>
                    <Tag color={color}>
                      {profile.duration}s{" "}
                      {t("load_test_page.profiles.duration")}
                    </Tag>
                    {profile.stages && profile.stages.length > 0 && (
                      <Tag color="cyan">
                        {profile.stages.length}{" "}
                        {t("load_test_page.profiles.stages")}
                      </Tag>
                    )}
                    {profile.rps && (
                      <Tag color="purple">
                        {profile.rps} {t("load_test_page.profiles.rps")}
                      </Tag>
                    )}
                  </Space>
                  {isSelected && (
                    <Tag color="success" style={{ marginTop: 8 }}>
                      ✓ {t("load_test_page.profiles.selected")}
                    </Tag>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};
