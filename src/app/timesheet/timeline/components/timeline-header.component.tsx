import React from "react";
import { Typography, theme } from "antd";
import { useTranslation } from "react-i18next";
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from "../utils/timeline.helpers";
import dayjs from "dayjs";

interface TimelineHeaderProps {
  months: any[];
  startDate: any;
  pixelsPerDay: number;
  totalWidth: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  months,
  startDate,
  pixelsPerDay,
  totalWidth,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");

  return (
    <div
      style={{
        display: "flex",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        backgroundColor: token.colorBgLayout,
        position: "sticky",
        top: 0,
        zIndex: 200,
        width: "fit-content",
        minWidth: "100%",
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          padding: "12px 16px",
          borderRight: `2px solid ${token.colorBorderSecondary}`,
          position: "sticky",
          left: 0,
          zIndex: 300,
          backgroundColor: token.colorBgLayout,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography.Text strong>
          {t("timeline_page.header_project_name")}
        </Typography.Text>
      </div>

      {/* Timeline Header */}
      <div
        style={{
          width: totalWidth,
          height: HEADER_HEIGHT,
          position: "relative",
        }}
      >
        {/* Months */}
        {months.map((month, index) => {
          const left = month.diff(startDate, "day") * pixelsPerDay;
          const width = month.daysInMonth() * pixelsPerDay;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left,
                width,
                height: "100%",
                borderLeft: `1px solid ${token.colorBorderSecondary}`,
                padding: "4px 8px",
              }}
            >
              <Typography.Text
                strong
                style={{
                  fontSize: 12,
                  color: token.colorTextSecondary,
                }}
              >
                {month.format("MM/YYYY")}
              </Typography.Text>
            </div>
          );
        })}

        {/* Today Label */}
        <div
          style={{
            position: "absolute",
            left: dayjs().diff(startDate, "day") * pixelsPerDay,
            top: 0,
            bottom: 0,
            zIndex: 10,
            transform: "translateX(-50%)",
          }}
        >
          <div
            style={{
              backgroundColor: token.colorError,
              color: "white",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              marginTop: 4,
              fontWeight: "bold",
            }}
          >
            {t("timeline_page.today_label")}
          </div>
          <div
            style={{
              width: 2,
              backgroundColor: token.colorError,
              height: "100%",
              margin: "0 auto",
            }}
          />
        </div>
      </div>
    </div>
  );
};
