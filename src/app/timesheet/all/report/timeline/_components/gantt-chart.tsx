// ✨ Component สำหรับแสดง Gantt Chart ของ Project Timeline
"use client";

import {
  BranchesOutlined,
  CalendarOutlined,
  EditOutlined,
  PlusCircleOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Empty,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useTimelineStore } from "../_state/timeline-store";

const { Text } = Typography;

// ─── สีตามสถานะโครงการ ───────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  open: "#52c41a",
  active: "#1677ff",
  closed: "#8c8c8c",
  on_hold: "#faad14",
  completed: "#52c41a",
  cancelled: "#ff4d4f",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status?.toLowerCase()] ?? "#1677ff";
}

// ─── คำนวณตำแหน่งบน Gantt ───────────────────────────────────────────────────
function calcBar(
  startDate: string,
  endDate: string,
  chartStart: dayjs.Dayjs,
  totalDays: number
): { left: string; width: string; valid: boolean } {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) return { left: "0%", width: "0%", valid: false };

  const startOffset = Math.max(0, start.diff(chartStart, "day"));
  const endOffset = Math.min(totalDays, end.diff(chartStart, "day") + 1);
  const barWidth = Math.max(1, endOffset - startOffset);

  return {
    left: `${(startOffset / totalDays) * 100}%`,
    width: `${(barWidth / totalDays) * 100}%`,
    valid: true,
  };
}

// ─── แถบวันเดือนปีด้านบน ─────────────────────────────────────────────────────
function MonthHeader({
  chartStart,
  totalDays,
}: {
  chartStart: dayjs.Dayjs;
  totalDays: number;
}) {
  const months: { label: string; left: string; width: string }[] = [];
  let cursor = chartStart.startOf("month");
  const chartEnd = chartStart.add(totalDays, "day");

  while (cursor.isBefore(chartEnd)) {
    const monthStart = cursor.isBefore(chartStart) ? chartStart : cursor;
    const monthEnd = cursor.endOf("month").isAfter(chartEnd)
      ? chartEnd
      : cursor.endOf("month");

    const startOffset = monthStart.diff(chartStart, "day");
    const width = monthEnd.diff(monthStart, "day") + 1;

    months.push({
      label: cursor.format("MMM YYYY"),
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    });

    cursor = cursor.add(1, "month").startOf("month");
  }

  return (
    <div style={{ position: "relative", height: 28, marginBottom: 4 }}>
      {months.map((m, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: m.left,
            width: m.width,
            textAlign: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#595959",
            overflow: "hidden",
            whiteSpace: "nowrap",
            borderRight: "1px solid #f0f0f0",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {m.label}
        </div>
      ))}
    </div>
  );
}

// ─── เส้นแบ่งเดือน (Grid) ───────────────────────────────────────────────────
function MonthGridLines({
  chartStart,
  totalDays,
}: {
  chartStart: dayjs.Dayjs;
  totalDays: number;
}) {
  const lines: number[] = [];
  let cursor = chartStart.startOf("month").add(1, "month");
  const chartEnd = chartStart.add(totalDays, "day");

  while (cursor.isBefore(chartEnd)) {
    lines.push(cursor.diff(chartStart, "day"));
    cursor = cursor.add(1, "month");
  }

  return (
    <>
      {lines.map((offset, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(offset / totalDays) * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "#f0f0f0",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

// ─── แถบ Gantt ────────────────────────────────────────────────────────────────
function GanttBar({
  label,
  startDate,
  endDate,
  color,
  chartStart,
  totalDays,
  isSubProject = false,
  onEdit,
  onAddSubProject,
  status,
}: {
  label: string;
  startDate: string;
  endDate: string;
  color: string;
  chartStart: dayjs.Dayjs;
  totalDays: number;
  isSubProject?: boolean;
  onEdit?: () => void;
  onAddSubProject?: () => void;
  status?: string;
}) {
  const { token } = theme.useToken();
  const bar = calcBar(startDate, endDate, chartStart, totalDays);

  const ROW_HEIGHT = isSubProject ? 36 : 44;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: ROW_HEIGHT,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        backgroundColor: isSubProject ? token.colorFillQuaternary : token.colorBgContainer,
      }}
    >
      {/* ── Label column ── */}
      <div
        style={{
          width: 280,
          minWidth: 280,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: isSubProject ? token.colorFillQuaternary : token.colorBgContainer,
        }}
      >
        {isSubProject ? (
          <BranchesOutlined style={{ fontSize: 12, color: token.colorTextSecondary, flexShrink: 0 }} />
        ) : (
          <ProjectOutlined style={{ fontSize: 13, color: color, flexShrink: 0 }} />
        )}
        <Text
          style={{
            fontSize: isSubProject ? 12 : 13,
            fontWeight: isSubProject ? 400 : 600,
            color: isSubProject ? token.colorTextSecondary : token.colorText,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
          }}
          title={label}
        >
          {label}
        </Text>
        {onAddSubProject && (
          <Tooltip title="เพิ่มโครงการย่อย">
            <Button
              type="text"
              size="small"
              icon={<PlusCircleOutlined style={{ fontSize: 13, color: token.colorSuccess }} />}
              onClick={onAddSubProject}
              style={{ padding: 0, height: "auto", lineHeight: 1, flexShrink: 0 }}
            />
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip title="แก้ไขโครงการย่อย">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 11, color: token.colorLink }} />}
              onClick={onEdit}
              style={{ padding: 0, height: "auto", lineHeight: 1, flexShrink: 0 }}
            />
          </Tooltip>
        )}
      </div>

      {/* ── Chart area ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <MonthGridLines chartStart={chartStart} totalDays={totalDays} />

        {bar.valid && (
          <Tooltip
            title={
              <Space direction="vertical" size={2}>
                <Text style={{ color: "#fff", fontSize: 12 }}>{label}</Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(startDate).format("DD/MM/YYYY")} – {dayjs(endDate).format("DD/MM/YYYY")}
                </Text>
                {status && (
                  <Badge
                    color={color}
                    text={<Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{status}</Text>}
                  />
                )}
              </Space>
            }
          >
            <div
              style={{
                position: "absolute",
                left: bar.left,
                width: bar.width,
                top: "50%",
                transform: "translateY(-50%)",
                height: isSubProject ? 16 : 22,
                backgroundColor: color,
                borderRadius: 4,
                opacity: isSubProject ? 0.7 : 0.9,
                cursor: "default",
                display: "flex",
                alignItems: "center",
                paddingLeft: 6,
                overflow: "hidden",
                minWidth: 4,
                boxShadow: `0 1px 3px ${color}60`,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1,
                  fontWeight: 500,
                }}
              >
                {label}
              </Text>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const GanttChart: React.FC = () => {
  const { token } = theme.useToken();
  const { timelineData, isFetching, setModal } = useTimelineStore();

  const handleAddSubProject = (project: any) => {
    // ดึง numeric id จาก "p-1" → 1
    const numericId = parseInt(String(project.id).replace("p-", ""), 10);
    setModal({
      open: true,
      mode: "create",
      data: { project_id: numericId, project_name: project.name },
    });
  };

  // ✨ คำนวณช่วงวันที่ของ Chart จากข้อมูลทั้งหมด
  const { chartStart, totalDays } = useMemo(() => {
    if (!timelineData || timelineData.length === 0) {
      const now = dayjs();
      return { chartStart: now.startOf("month"), totalDays: 180 };
    }

    let minDate = dayjs();
    let maxDate = dayjs();
    let hasDate = false;

    timelineData.forEach((p) => {
      if (p.start_date) {
        const d = dayjs(p.start_date);
        if (!hasDate || d.isBefore(minDate)) minDate = d;
        hasDate = true;
      }
      if (p.end_date) {
        const d = dayjs(p.end_date);
        if (!hasDate || d.isAfter(maxDate)) maxDate = d;
        hasDate = true;
      }
      (p.children || []).forEach((sub: any) => {
        if (sub.start_date) {
          const d = dayjs(sub.start_date);
          if (d.isBefore(minDate)) minDate = d;
        }
        if (sub.end_date) {
          const d = dayjs(sub.end_date);
          if (d.isAfter(maxDate)) maxDate = d;
        }
      });
    });

    const start = minDate.subtract(1, "month").startOf("month");
    const end = maxDate.add(1, "month").endOf("month");
    const days = Math.max(60, end.diff(start, "day") + 1);

    return { chartStart: start, totalDays: days };
  }, [timelineData]);

  if (!timelineData || timelineData.length === 0) {
    return (
      <Card
        styles={{ body: { padding: 48, textAlign: "center" } }}
        style={{ borderColor: token.colorBorderSecondary }}
        loading={isFetching}
      >
        <Empty description="ไม่พบข้อมูลโครงการสำหรับแสดง Gantt Chart" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space style={{ padding: "8px 0" }}>
          <CalendarOutlined />
          <span>Gantt Chart – ภาพรวม Timeline โครงการ</span>
        </Space>
      }
      styles={{ body: { padding: 0 } }}
      style={{
        borderColor: token.colorBorderSecondary,
        boxShadow: token.boxShadowTertiary,
        marginBottom: 24,
        overflow: "hidden",
      }}
      loading={isFetching}
    >
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 900 }}>
          {/* ── Header row ── */}
          <div
            style={{
              display: "flex",
              backgroundColor: token.colorFillAlter,
              borderBottom: `2px solid ${token.colorBorderSecondary}`,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {/* Label header */}
            <div
              style={{
                width: 280,
                minWidth: 280,
                padding: "8px 12px",
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Text strong style={{ fontSize: 12 }}>โครงการ / โครงการย่อย</Text>
            </div>

            {/* Month header */}
            <div style={{ flex: 1, padding: "8px 0" }}>
              <MonthHeader chartStart={chartStart} totalDays={totalDays} />
            </div>
          </div>

          {/* ── Data rows ── */}
          {timelineData.map((project) => {
            const color = getStatusColor(project.status);
            return (
              <React.Fragment key={project.id ?? project.name}>
                {/* Main project row */}
                <GanttBar
                  label={project.name}
                  startDate={project.start_date}
                  endDate={project.end_date}
                  color={color}
                  chartStart={chartStart}
                  totalDays={totalDays}
                  status={project.status_name || project.status}
                  onAddSubProject={() => handleAddSubProject(project)}
                />

                {/* Sub-project rows */}
                {(project.children || []).map((sub: any) => (
                  <GanttBar
                    key={sub.id ?? sub.name}
                    label={sub.name}
                    startDate={sub.start_date}
                    endDate={sub.end_date}
                    color={getStatusColor(sub.status)}
                    chartStart={chartStart}
                    totalDays={totalDays}
                    isSubProject
                    status={sub.status}
                    onEdit={() => setModal({ open: true, mode: "edit", data: sub })}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {/* ── Legend ── */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <Space key={status} size={4}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: color,
                  }}
                />
                <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                  {status}
                </Text>
              </Space>
            ))}
            <Space size={4}>
              <Tag style={{ fontSize: 11, margin: 0 }}>แถบกว้าง = ระยะเวลานาน</Tag>
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GanttChart;
