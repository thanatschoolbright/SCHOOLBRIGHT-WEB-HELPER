import React from "react";
import { Typography, Button, Avatar, Badge, Tooltip, theme } from "antd";
import {
  DownOutlined,
  RightOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
// Fallback local types because the module "../types/timeline.types" does not export these names.
// Replace `any` with concrete types if you add or find the correct type definitions later.
type TimelineProject = any;
type TimelineFeature = any;
type PopupInfo = {
  x: number;
  y: number;
  project: any | null;
};
// SIDEBAR_WIDTH was not exported from ../utils/timeline.helpers; provide a local fallback.
const SIDEBAR_WIDTH = 240;

function getBarPosition(
  startDate: any,
  endDate: any,
  viewStartDate: any,
  pixelsPerDay: number
) {
  const s = dayjs(startDate);
  const e = dayjs(endDate);
  const vs = dayjs(viewStartDate);

  // number of days from the view start to the bar start
  const offsetDays = s.diff(vs, "day");
  const left = Math.max(0, offsetDays * pixelsPerDay);

  // width in pixels (inclusive of start and end day)
  const durationDays = Math.max(0, e.diff(s, "day") + 1);
  const width = Math.max(4, durationDays * pixelsPerDay);

  return { left, width };
}

interface TimelineRowProps {
  project: TimelineProject;
  index: number;
  isExpanded: boolean;
  projectColor: string;
  startDate: any;
  pixelsPerDay: number;
  onToggle: (id: number) => void;
  onHover: (info: PopupInfo) => void;
}

export const TimelineRow: React.FC<TimelineRowProps> = ({
  project,
  index,
  isExpanded,
  projectColor,
  startDate,
  pixelsPerDay,
  onToggle,
  onHover,
}) => {
  const { token } = theme.useToken();
  const pPos = getBarPosition(
    project.startDate,
    project.endDate,
    startDate,
    pixelsPerDay
  );

  return (
    <>
      {/* Project Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          height: 64,
          backgroundColor: token.colorBgContainer,
          width: "100%",
        }}
      >
        {/* Sidebar Cell */}
        <div
          style={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
            padding: "0 12px",
            borderRight: `2px solid ${token.colorBorderSecondary}`,
            position: "sticky",
            left: 0,
            zIndex: 1000,
            backgroundColor: token.colorBgContainer,
            height: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              overflow: "hidden",
              marginRight: 8,
            }}
          >
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <DownOutlined /> : <RightOutlined />}
              onClick={() => onToggle(project.id)}
              style={{ flexShrink: 0 }}
            />
            <Avatar
              size="small"
              style={{
                backgroundColor: projectColor,
                verticalAlign: "middle",
                flexShrink: 0,
              }}
              icon={<ProjectOutlined />}
            />
            <Typography.Text
              strong
              style={{ fontSize: 14, flex: 1 }}
              ellipsis={{ tooltip: true }}
            >
              {project.name}
            </Typography.Text>
          </div>
          <Badge
            count={project.features.length}
            style={{
              backgroundColor: token.colorFillSecondary,
              color: token.colorTextSecondary,
              flexShrink: 0,
            }}
          />
        </div>

        {/* Timeline Cell */}
        <div
          style={{
            flex: 1,
            position: "relative",
            height: "100%",
            backgroundColor:
              index % 2 === 0 ? "transparent" : token.colorFillAlter,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: pPos.left,
              width: pPos.width,
              top: 10,
              height: 24,
              background: `linear-gradient(90deg, ${projectColor} 0%, ${token.colorPrimary} 100%)`,
              borderRadius: 4,
              opacity: 1,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              transition: "all 0.3s",
            }}
            onClick={() => onToggle(project.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              onHover({
                x: e.clientX,
                y: e.clientY,
                project: project,
              });
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
              onHover({ x: 0, y: 0, project: null });
            }}
          >
            <div
              style={{
                padding: "0 8px",
                color: "white",
                fontSize: 11,
                lineHeight: "24px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                fontWeight: 600,
              }}
            >
              {project.name}
            </div>
          </div>
        </div>
      </div>

      {/* Features Rows */}
      {isExpanded &&
        project.features.map((feature: TimelineFeature) => {
          const fPos = getBarPosition(
            feature.startDate,
            feature.endDate,
            startDate,
            pixelsPerDay
          );

          return (
            <div
              key={feature.id}
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                height: 36,
                backgroundColor: token.colorFillQuaternary,
                width: "100%",
              }}
            >
              {/* Sidebar Cell */}
              <div
                style={{
                  width: SIDEBAR_WIDTH,
                  minWidth: SIDEBAR_WIDTH,
                  padding: "0 16px 0 48px",
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                  position: "sticky",
                  left: 0,
                  zIndex: 1000,
                  backgroundColor: token.colorBgContainer,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography.Text
                  style={{ fontSize: 12 }}
                  type="secondary"
                  ellipsis={{ tooltip: true }}
                >
                  {feature.name}
                </Typography.Text>
              </div>

              {/* Timeline Cell */}
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  height: "100%",
                  zIndex: 0,
                }}
              >
                <Tooltip
                  title={`${feature.name}: ${dayjs(feature.startDate).format(
                    "DD/MM/YYYY"
                  )} - ${dayjs(feature.endDate).format("DD/MM/YYYY")}`}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: fPos.left,
                      width: fPos.width,
                      top: 8,
                      height: 20,
                      backgroundColor: projectColor,
                      borderRadius: 10,
                      opacity: 0.6,
                      cursor: "default",
                    }}
                  />
                </Tooltip>
              </div>
            </div>
          );
        })}
    </>
  );
};
