// ✨ Component สำหรับแสดง Gantt Chart ของ Project Timeline
// รองรับ 3 มุมมอง: รายวัน / รายสัปดาห์ / รายเดือน
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
  Radio,
  Space,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTimelineStore } from "../_state/timeline-store";

dayjs.extend(isoWeek);

const { Text } = Typography;

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewScale = "day" | "week" | "month";

// ─── Config ตาม Scale ─────────────────────────────────────────────────────────
const SCALE_CONFIG: Record<
  ViewScale,
  { colWidth: number; minWidth: number; label: string }
> = {
  day:   { colWidth: 32, minWidth: 900, label: "รายวัน" },
  week:  { colWidth: 80, minWidth: 900, label: "รายสัปดาห์" },
  month: { colWidth: 100, minWidth: 900, label: "รายเดือน" },
};

const LABEL_COL_WIDTH = 260;

// ─── สีตามสถานะโครงการ ───────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  open:      "#1677ff",
  active:    "#1677ff",
  closed:    "#8c8c8c",
  on_hold:   "#faad14",
  completed: "#52c41a",
  cancelled: "#ff4d4f",
};

const STATUS_LABELS: Record<string, string> = {
  open:      "กำลังดำเนินการ",
  active:    "กำลังดำเนินการ",
  closed:    "ปิดแล้ว",
  on_hold:   "หยุดชั่วคราว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status?.toLowerCase()] ?? "#1677ff";
}

// ─── คำนวณ "หน่วย" ของแต่ละ scale ───────────────────────────────────────────
interface ScaleUnit {
  key: string;         // unique key
  label: string;       // label บน header แถวที่ 2
  groupLabel: string;  // label บน header แถวที่ 1 (ปี/เดือน)
  groupKey: string;    // key สำหรับ group
  startDay: number;    // offset จาก chartStart (หน่วย = วัน)
  spanDays: number;    // กว้างกี่วัน
  isWeekend?: boolean; // สำหรับ day scale
  isToday?: boolean;   // สำหรับ day scale
}

function buildUnits(
  chartStart: dayjs.Dayjs,
  totalDays: number,
  scale: ViewScale,
): ScaleUnit[] {
  const today = dayjs().startOf("day");
  const units: ScaleUnit[] = [];

  if (scale === "day") {
    for (let i = 0; i < totalDays; i++) {
      const d = chartStart.add(i, "day");
      const dow = d.day(); // 0=Sun 6=Sat
      units.push({
        key: d.format("YYYY-MM-DD"),
        label: d.format("D"),
        groupLabel: d.format("MMM YYYY"),
        groupKey: d.format("YYYY-MM"),
        startDay: i,
        spanDays: 1,
        isWeekend: dow === 0 || dow === 6,
        isToday: d.isSame(today),
      });
    }
    return units;
  }

  if (scale === "week") {
    // เริ่มจากต้นสัปดาห์ (จันทร์) ของ chartStart
    let cursor = chartStart.startOf("isoWeek");
    const chartEnd = chartStart.add(totalDays, "day");
    while (cursor.isBefore(chartEnd)) {
      const weekEnd = cursor.endOf("isoWeek");
      const effectiveStart = cursor.isBefore(chartStart) ? chartStart : cursor;
      const effectiveEnd = weekEnd.isAfter(chartEnd) ? chartEnd : weekEnd;
      const startDay = effectiveStart.diff(chartStart, "day");
      const spanDays = effectiveEnd.diff(effectiveStart, "day") + 1;
      units.push({
        key: cursor.format("YYYY-[W]WW"),
        label: `W${cursor.isoWeek()}`,
        groupLabel: cursor.format("MMM YYYY"),
        groupKey: cursor.format("YYYY-MM"),
        startDay,
        spanDays,
      });
      cursor = cursor.add(1, "week");
    }
    return units;
  }

  // month
  let cursor = chartStart.startOf("month");
  const chartEnd = chartStart.add(totalDays, "day");
  while (cursor.isBefore(chartEnd)) {
    const monthEnd = cursor.endOf("month");
    const effectiveStart = cursor.isBefore(chartStart) ? chartStart : cursor;
    const effectiveEnd = monthEnd.isAfter(chartEnd) ? chartEnd : monthEnd;
    const startDay = effectiveStart.diff(chartStart, "day");
    const spanDays = effectiveEnd.diff(effectiveStart, "day") + 1;
    units.push({
      key: cursor.format("YYYY-MM"),
      label: cursor.format("MMM"),
      groupLabel: cursor.format("YYYY"),
      groupKey: cursor.format("YYYY"),
      startDay,
      spanDays,
    });
    cursor = cursor.add(1, "month");
  }
  return units;
}

// ─── คำนวณตำแหน่ง bar ────────────────────────────────────────────────────────
function calcBar(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  chartStart: dayjs.Dayjs,
  totalDays: number,
): { left: number; width: number; valid: boolean } {
  const start = dayjs(startDate ?? undefined);
  const end = dayjs(endDate ?? undefined);
  if (!start.isValid() || !end.isValid())
    return { left: 0, width: 0, valid: false };

  const startOffset = Math.max(0, start.diff(chartStart, "day"));
  const endOffset = Math.min(totalDays, end.diff(chartStart, "day") + 1);
  const barWidth = Math.max(0.5, endOffset - startOffset);

  return {
    left: (startOffset / totalDays) * 100,
    width: (barWidth / totalDays) * 100,
    valid: endOffset > startOffset || barWidth > 0,
  };
}

// ─── Header Component (2 แถว) ─────────────────────────────────────────────────
function GanttHeader({
  units,
  totalDays,
  scale,
}: {
  units: ScaleUnit[];
  totalDays: number;
  scale: ViewScale;
}) {
  const { token } = theme.useToken();

  // สร้าง group จาก units
  const groups: { key: string; label: string; startDay: number; spanDays: number }[] = [];
  units.forEach((u) => {
    const last = groups[groups.length - 1];
    if (last && last.key === u.groupKey) {
      last.spanDays += u.spanDays;
    } else {
      groups.push({
        key: u.groupKey,
        label: u.groupLabel,
        startDay: u.startDay,
        spanDays: u.spanDays,
      });
    }
  });

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: token.colorFillAlter,
        borderBottom: `2px solid ${token.colorBorderSecondary}`,
        userSelect: "none",
      }}
    >
      {/* แถวที่ 1 — Group (ปี / เดือน) */}
      <div style={{ position: "relative", height: 28, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        {groups.map((g) => (
          <div
            key={g.key}
            style={{
              position: "absolute",
              left: `${(g.startDay / totalDays) * 100}%`,
              width: `${(g.spanDays / totalDays) * 100}%`,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: token.colorText,
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
              whiteSpace: "nowrap",
              paddingInline: 4,
            }}
          >
            {g.label}
          </div>
        ))}
      </div>

      {/* แถวที่ 2 — Unit (วัน / สัปดาห์ / เดือน) */}
      <div style={{ position: "relative", height: 26 }}>
        {units.map((u) => (
          <div
            key={u.key}
            style={{
              position: "absolute",
              left: `${(u.startDay / totalDays) * 100}%`,
              width: `${(u.spanDays / totalDays) * 100}%`,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: scale === "day" ? 10 : 11,
              fontWeight: u.isToday ? 700 : 400,
              color: u.isToday
                ? token.colorPrimary
                : u.isWeekend
                  ? token.colorTextQuaternary
                  : token.colorTextSecondary,
              backgroundColor: u.isToday
                ? `${token.colorPrimary}14`
                : u.isWeekend
                  ? token.colorFillQuaternary
                  : "transparent",
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {u.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grid Lines ───────────────────────────────────────────────────────────────
function GanttGridLines({
  units,
  totalDays,
}: {
  units: ScaleUnit[];
  totalDays: number;
}) {
  const { token } = theme.useToken();
  return (
    <>
      {units.map((u) => (
        <div
          key={u.key}
          style={{
            position: "absolute",
            left: `${((u.startDay + u.spanDays) / totalDays) * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: u.isWeekend
              ? token.colorFillTertiary
              : token.colorBorderSecondary,
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
      ))}
      {/* Weekend shading (day scale) */}
      {units
        .filter((u) => u.isWeekend)
        .map((u) => (
          <div
            key={`shade-${u.key}`}
            style={{
              position: "absolute",
              left: `${(u.startDay / totalDays) * 100}%`,
              width: `${(u.spanDays / totalDays) * 100}%`,
              top: 0,
              bottom: 0,
              backgroundColor: token.colorFillQuaternary,
              pointerEvents: "none",
            }}
          />
        ))}
    </>
  );
}

// ─── Today Line ───────────────────────────────────────────────────────────────
function TodayLine({
  chartStart,
  totalDays,
}: {
  chartStart: dayjs.Dayjs;
  totalDays: number;
}) {
  const { token } = theme.useToken();
  const todayOffset = dayjs().startOf("day").diff(chartStart, "day");
  if (todayOffset < 0 || todayOffset > totalDays) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${(todayOffset / totalDays) * 100}%`,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: token.colorError,
        opacity: 0.7,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {/* หัวสามเหลี่ยม */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -4,
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `8px solid ${token.colorError}`,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

// ─── Gantt Row ────────────────────────────────────────────────────────────────
function GanttRow({
  label,
  startDate,
  endDate,
  color,
  chartStart,
  totalDays,
  units,
  isSubProject = false,
  onEdit,
  onAddSubProject,
  status,
  statusName,
}: {
  label: string;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  color: string;
  chartStart: dayjs.Dayjs;
  totalDays: number;
  units: ScaleUnit[];
  isSubProject?: boolean;
  onEdit?: () => void;
  onAddSubProject?: () => void;
  status?: string;
  statusName?: string;
}) {
  const { token } = theme.useToken();
  const bar = calcBar(startDate, endDate, chartStart, totalDays);
  const ROW_HEIGHT = isSubProject ? 34 : 42;

  const durationDays = startDate && endDate
    ? dayjs(endDate).diff(dayjs(startDate), "day") + 1
    : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: ROW_HEIGHT,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {/* ── Label column (sticky) ── */}
      <div
        style={{
          width: LABEL_COL_WIDTH,
          minWidth: LABEL_COL_WIDTH,
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: isSubProject
            ? token.colorFillTertiary
            : token.colorBgContainer,
          flexShrink: 0,
          position: "sticky",
          left: 0,
          zIndex: 4,
          boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
        }}
      >
        {isSubProject ? (
          <BranchesOutlined
            style={{ fontSize: 11, color: token.colorTextQuaternary, flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
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
            lineHeight: 1.3,
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
              icon={
                <PlusCircleOutlined
                  style={{ fontSize: 13, color: token.colorSuccess }}
                />
              }
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
              icon={
                <EditOutlined style={{ fontSize: 11, color: token.colorLink }} />
              }
              onClick={onEdit}
              style={{ padding: 0, height: "auto", lineHeight: 1, flexShrink: 0 }}
            />
          </Tooltip>
        )}
      </div>

      {/* ── Chart area ── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          backgroundColor: isSubProject
            ? token.colorFillTertiary
            : token.colorBgContainer,
        }}
      >
        <GanttGridLines units={units} totalDays={totalDays} />
        <TodayLine chartStart={chartStart} totalDays={totalDays} />

        {bar.valid && (
          <Tooltip
            title={
              <Space direction="vertical" size={2} style={{ minWidth: 160 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                  {label}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(startDate!).format("DD MMM YYYY")} –{" "}
                  {dayjs(endDate!).format("DD MMM YYYY")}
                </Text>
                {durationDays !== null && (
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                    ระยะเวลา {durationDays} วัน
                  </Text>
                )}
                {statusName && (
                  <Badge
                    color={color}
                    text={
                      <Text
                        style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}
                      >
                        {statusName}
                      </Text>
                    }
                  />
                )}
              </Space>
            }
            placement="top"
          >
            <div
              style={{
                position: "absolute",
                left: `${bar.left}%`,
                width: `${bar.width}%`,
                top: "50%",
                transform: "translateY(-50%)",
                height: isSubProject ? 14 : 20,
                backgroundColor: color,
                borderRadius: isSubProject ? 3 : 4,
                opacity: isSubProject ? 0.65 : 0.88,
                cursor: "default",
                display: "flex",
                alignItems: "center",
                paddingLeft: 6,
                overflow: "hidden",
                minWidth: 3,
                boxShadow: `0 1px 4px ${color}50`,
                transition: "opacity 0.15s",
                zIndex: 1,
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
                  pointerEvents: "none",
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
  const [scale, setScale] = useState<ViewScale>("month");

  // ✨ คำนวณช่วงวันที่จากข้อมูลทั้งหมด
  const { chartStart, totalDays } = useMemo(() => {
    if (!timelineData || timelineData.length === 0) {
      const now = dayjs();
      return { chartStart: now.startOf("month"), totalDays: 180 };
    }

    let minDate = dayjs();
    let maxDate = dayjs();
    let hasDate = false;

    const touch = (d: dayjs.Dayjs, isStart: boolean) => {
      if (!d.isValid()) return;
      if (!hasDate) {
        minDate = d;
        maxDate = d;
        hasDate = true;
        return;
      }
      if (isStart && d.isBefore(minDate)) minDate = d;
      if (!isStart && d.isAfter(maxDate)) maxDate = d;
    };

    timelineData.forEach((p) => {
      touch(dayjs(p.start_date), true);
      touch(dayjs(p.end_date), false);
      (p.children || []).forEach((sub: any) => {
        touch(dayjs(sub.start_date), true);
        touch(dayjs(sub.end_date), false);
      });
    });

    let paddingBefore: dayjs.Dayjs;
    let paddingAfter: dayjs.Dayjs;

    if (scale === "day") {
      paddingBefore = minDate.subtract(7, "day").startOf("day");
      paddingAfter  = maxDate.add(7, "day").endOf("day");
    } else if (scale === "week") {
      paddingBefore = minDate.subtract(2, "week").startOf("isoWeek");
      paddingAfter  = maxDate.add(2, "week").endOf("isoWeek");
    } else {
      paddingBefore = minDate.subtract(1, "month").startOf("month");
      paddingAfter  = maxDate.add(1, "month").endOf("month");
    }

    const days = Math.max(
      scale === "day" ? 30 : scale === "week" ? 60 : 60,
      paddingAfter.diff(paddingBefore, "day") + 1,
    );

    return { chartStart: paddingBefore, totalDays: days };
  }, [timelineData, scale]);

  // ✨ สร้าง units ตาม scale
  const units = useMemo(
    () => buildUnits(chartStart, totalDays, scale),
    [chartStart, totalDays, scale],
  );

  // ✨ คำนวณความกว้างของ chart area
  const chartContentWidth = useMemo(() => {
    const cfg = SCALE_CONFIG[scale];
    return Math.max(cfg.minWidth, units.length * cfg.colWidth + LABEL_COL_WIDTH);
  }, [units, scale]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ✨ Scroll ไปหา "วันนี้" ทุกครั้งที่ scale หรือข้อมูลเปลี่ยน
  useEffect(() => {
    if (!scrollRef.current || chartContentWidth === 0 || totalDays === 0) return;
    const todayOffset = dayjs().startOf("day").diff(chartStart, "day");
    if (todayOffset < 0 || todayOffset > totalDays) return;

    // คำนวณ pixel position ของวันนี้ใน chart area
    const chartAreaWidth = chartContentWidth - LABEL_COL_WIDTH;
    const todayPx = (todayOffset / totalDays) * chartAreaWidth + LABEL_COL_WIDTH;

    // เลื่อนให้วันนี้อยู่ตรงกลางของ viewport
    const viewportWidth = scrollRef.current.clientWidth;
    const scrollLeft = Math.max(0, todayPx - viewportWidth / 2);

    scrollRef.current.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [chartStart, chartContentWidth, totalDays, scale]);

  const handleAddSubProject = (project: any) => {
    const numericId = parseInt(String(project.id).replace("p-", ""), 10);
    setModal({
      open: true,
      mode: "create",
      data: { project_id: numericId, project_name: project.name },
    });
  };

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
        <Space style={{ padding: "4px 0" }}>
          <CalendarOutlined />
          <span>Gantt Chart – ภาพรวม Timeline โครงการ</span>
        </Space>
      }
      extra={
        /* ── Scale Switcher ── */
        <Radio.Group
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="day">รายวัน</Radio.Button>
          <Radio.Button value="week">รายสัปดาห์</Radio.Button>
          <Radio.Button value="month">รายเดือน</Radio.Button>
        </Radio.Group>
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
      {/* ── Scroll wrapper ── */}
      <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "auto", maxHeight: 600 }}>
        <div style={{ width: chartContentWidth, minWidth: chartContentWidth }}>

          {/* ── Sticky Header ── */}
          <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 10 }}>
            {/* Label column header */}
            <div
              style={{
                width: LABEL_COL_WIDTH,
                minWidth: LABEL_COL_WIDTH,
                flexShrink: 0,
                padding: "0 10px",
                display: "flex",
                alignItems: "center",
                backgroundColor: token.colorFillAlter,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                borderBottom: `2px solid ${token.colorBorderSecondary}`,
                position: "sticky",
                left: 0,
                zIndex: 11,
              }}
            >
              <Text strong style={{ fontSize: 11, color: token.colorTextSecondary }}>
                โครงการ / โครงการย่อย
              </Text>
            </div>

            {/* Chart header */}
            <div style={{ flex: 1 }}>
              <GanttHeader units={units} totalDays={totalDays} scale={scale} />
            </div>
          </div>

          {/* ── Data Rows ── */}
          {timelineData.map((project) => {
            const color = project.color_hex || getStatusColor(project.status);
            const featureColor = project.color_hex_feature || "#52c41a";
            const statusName =
              project.status_name ||
              STATUS_LABELS[project.status?.toLowerCase()] ||
              project.status;

            return (
              <React.Fragment key={project.id ?? project.name}>
                <GanttRow
                  label={project.name}
                  startDate={project.start_date}
                  endDate={project.end_date}
                  color={color}
                  chartStart={chartStart}
                  totalDays={totalDays}
                  units={units}
                  status={project.status}
                  statusName={statusName}
                  onAddSubProject={() => handleAddSubProject(project)}
                />

                {(project.children || []).map((sub: any) => (
                  <GanttRow
                    key={sub.id ?? sub.name}
                    label={sub.name}
                    startDate={sub.start_date}
                    endDate={sub.end_date}
                    color={sub.color_hex || featureColor}
                    chartStart={chartStart}
                    totalDays={totalDays}
                    units={units}
                    isSubProject
                    status={sub.status}
                    statusName={
                      sub.status_name ||
                      STATUS_LABELS[sub.status?.toLowerCase()] ||
                      sub.status
                    }
                    onEdit={() =>
                      setModal({ open: true, mode: "edit", data: sub })
                    }
                  />
                ))}
              </React.Fragment>
            );
          })}

          {/* ── Legend ── */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
              backgroundColor: token.colorFillAlter,
            }}
          >
            <Text style={{ fontSize: 11, color: token.colorTextTertiary, fontWeight: 600 }}>
              สี:
            </Text>
            <Space size={5}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: token.colorPrimary,
                }}
              />
              <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                สีโครงการ (กำหนดจากข้อมูลโครงการ)
              </Text>
            </Space>
            <Space size={5}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: token.colorSuccess,
                  opacity: 0.65,
                }}
              />
              <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                สีโครงการย่อย (กำหนดจากข้อมูลโครงการ)
              </Text>
            </Space>
            <Space size={5}>
              <div
                style={{ width: 2, height: 12, backgroundColor: token.colorError, opacity: 0.7 }}
              />
              <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                วันนี้
              </Text>
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GanttChart;
