import React from "react";
import { Popover, Typography, Divider, Space, Avatar, Tag, theme } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface PopupInfo {
  x: number;
  y: number;
  project:
    | {
        name: string;
        description?: string | null;
        startDate: string | Date;
        endDate: string | Date;
        features: unknown[];
      }
    | null;
}

interface ProjectPopoverProps {
  popupInfo: PopupInfo;
}

export const ProjectPopover: React.FC<ProjectPopoverProps> = ({
  popupInfo,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");

  if (!popupInfo.project) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: popupInfo.x,
        top: popupInfo.y,
        width: 1,
        height: 1,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <Popover
        open={true}
        content={
          <div style={{ width: 300 }}>
            <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
              {popupInfo.project.description ||
                t("timeline_page.no_description")}
            </Typography.Paragraph>
            <Divider style={{ margin: "12px 0" }} />
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Space>
                  <CalendarOutlined />
                  <Typography.Text type="secondary">
                    {t("timeline_page.popup_start")}:
                  </Typography.Text>
                </Space>
                <Typography.Text>
                  {dayjs(popupInfo.project.startDate).format("DD MMM YYYY")}
                </Typography.Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Space>
                  <CalendarOutlined />
                  <Typography.Text type="secondary">
                    {t("timeline_page.popup_end")}:
                  </Typography.Text>
                </Space>
                <Typography.Text>
                  {dayjs(popupInfo.project.endDate).format("DD MMM YYYY")}
                </Typography.Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Space>
                  <ClockCircleOutlined />
                  <Typography.Text type="secondary">
                    {t("timeline_page.popup_duration")}:
                  </Typography.Text>
                </Space>
                <Typography.Text>
                  {dayjs(popupInfo.project.endDate).diff(
                    dayjs(popupInfo.project.startDate),
                    "day"
                  ) + 1}{" "}
                  {t("timeline_page.popup_days")}
                </Typography.Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Space>
                  <ProjectOutlined />
                  <Typography.Text type="secondary">
                    {t("timeline_page.popup_features")}:
                  </Typography.Text>
                </Space>
                <Tag>{popupInfo.project.features.length}</Tag>
              </div>
            </Space>
          </div>
        }
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              shape="square"
              size="small"
              style={{ backgroundColor: token.colorPrimary }}
              icon={<ProjectOutlined />}
            />
            <Typography.Text strong>{popupInfo.project.name}</Typography.Text>
          </div>
        }
        placement="topLeft"
        arrow={false}
      >
        <div />
      </Popover>
    </div>
  );
};
