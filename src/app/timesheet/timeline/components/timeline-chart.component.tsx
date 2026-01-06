"use client";

import React, { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { Tooltip, Empty, Tag, Typography, Button, Space, Badge } from "antd";
import {
  ProjectOutlined,
  RightOutlined,
  DownOutlined,
  PlusOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { TimelineItem } from "../types/timeline.types";
import {
  CELL_WIDTH,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  getProjectColor,
} from "../utils/timeline.helpers";

const { Text } = Typography;

interface TimelineChartProps {
  data: TimelineItem[];
  onItemClick: (item: TimelineItem) => void;
  onAddSubProject?: (projectId: number) => void;
  loading?: boolean;
  showChildren?: boolean;
  zoomLevel: "day" | "week" | "month";
}

const PROJECT_COLORS = [
  { bar: "#3b82f6", light: "#dbeafe", dark: "#1e40af" }, // Blue
  { bar: "#8b5cf6", light: "#ede9fe", dark: "#5b21b6" }, // Purple
  { bar: "#ec4899", light: "#fce7f3", dark: "#be185d" }, // Pink
  { bar: "#f59e0b", light: "#fef3c7", dark: "#b45309" }, // Amber
  { bar: "#10b981", light: "#d1fae5", dark: "#047857" }, // Green
  { bar: "#06b6d4", light: "#cffafe", dark: "#0e7490" }, // Cyan
  { bar: "#ef4444", light: "#fee2e2", dark: "#b91c1c" }, // Red
  { bar: "#6366f1", light: "#e0e7ff", dark: "#4338ca" }, // Indigo
];

export const TimelineChartComponent: React.FC<TimelineChartProps> = ({
  data,
  onItemClick,
  onAddSubProject,
  loading,
  showChildren = true,
  zoomLevel,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(data.map((p) => p.id))
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentCellWidth = useMemo(() => {
    switch (zoomLevel) {
      case "week":
        return 28;
      case "month":
        return 12;
      default:
        return CELL_WIDTH;
    }
  }, [zoomLevel]);

  const { startDate, totalDays, days } = useMemo(() => {
    let minDate = dayjs().startOf("month");
    let maxDate = dayjs().endOf("month");
    const allItems = data.flatMap((p) => [p, ...(p.children || [])]);
    const validStarts = allItems
      .map((i) => (i.start ? dayjs(i.start) : null))
      .filter(Boolean) as dayjs.Dayjs[];
    const validEnds = allItems
      .map((i) => (i.end ? dayjs(i.end) : null))
      .filter(Boolean) as dayjs.Dayjs[];

    if (validStarts.length > 0)
      minDate = validStarts
        .reduce((a, b) => (a.isBefore(b) ? a : b))
        .subtract(7, "day");
    if (validEnds.length > 0)
      maxDate = validEnds
        .reduce((a, b) => (a.isAfter(b) ? a : b))
        .add(21, "day");

    const total = maxDate.diff(minDate, "day") + 1;
    const daysArray = Array.from({ length: total }, (_, i) =>
      minDate.add(i, "day")
    );
    return { startDate: minDate, totalDays: total, days: daysArray };
  }, [data]);

  const monthBlocks = useMemo(() => {
    const blocks: { date: dayjs.Dayjs; width: number; label: string }[] = [];
    if (days.length === 0) return blocks;
    let currentMonth = days[0];
    let count = 0;
    days.forEach((day) => {
      if (
        day.month() !== currentMonth.month() ||
        day.year() !== currentMonth.year()
      ) {
        blocks.push({
          date: currentMonth,
          width: count * currentCellWidth,
          label: currentMonth.locale("th").format("MMMM YYYY"),
        });
        currentMonth = day;
        count = 0;
      }
      count++;
    });
    if (count > 0)
      blocks.push({
        date: currentMonth,
        width: count * currentCellWidth,
        label: currentMonth.locale("th").format("MMMM YYYY"),
      });
    return blocks;
  }, [days, currentCellWidth]);

  const getBarPosition = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const s = dayjs(start);
    const e = dayjs(end);
    const offsetDays = s.diff(startDate, "day");
    const durationDays = e.diff(s, "day") + 1;
    return {
      left: offsetDays * currentCellWidth,
      width: durationDays * currentCellWidth,
      startDay: s,
      endDay: e,
    };
  };

  const today = dayjs();
  const todayLeft =
    today.diff(startDate, "day") * currentCellWidth + currentCellWidth / 2;

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getProjectColorPalette = (index: number) => {
    return PROJECT_COLORS[index % PROJECT_COLORS.length];
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-auto relative border-2 border-blue-100 transition-all duration-500 ${
        isFullScreen
          ? "fixed inset-0 z-50 h-screen w-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50"
          : "h-[720px] shadow-2xl"
      }`}
    >
      <div className="fixed bottom-8 right-8 z-[60]">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={
            isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="shadow-2xl hover:scale-110 transition-transform"
          style={{ width: 56, height: 56 }}
        />
      </div>

      <div style={{ minWidth: 380 + totalDays * currentCellWidth }}>
        <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 backdrop-blur-xl border-b-4 border-blue-400 shadow-xl">
          <div className="flex">
            <div className="sticky left-0 z-40 w-[380px] flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 border-r-2 border-blue-400 p-6 flex items-center">
              <Space size="large">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                  <CalendarOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "18px",
                      color: "white",
                      display: "block",
                    }}
                  >
                    Timeline Dashboard
                  </Text>
                  <Text
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}
                  >
                    Project Management Tracking
                  </Text>
                </div>
              </Space>
            </div>
            <div className="flex flex-col flex-grow">
              <div
                className="flex border-b-2 border-blue-400/50"
                style={{ height: HEADER_HEIGHT + 10 }}
              >
                {monthBlocks.map((block, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-blue-400/30 flex items-center justify-center"
                    style={{ width: block.width }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: "13px",
                        color: "white",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {block.label}
                    </Text>
                  </div>
                ))}
              </div>
              <div className="flex" style={{ height: HEADER_HEIGHT }}>
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 border-r border-blue-400/30 text-center flex flex-col items-center justify-center ${
                      day.day() === 0 || day.day() === 6
                        ? "bg-blue-700/30"
                        : "bg-blue-600/20"
                    }`}
                    style={{ width: currentCellWidth }}
                  >
                    <Text
                      style={{
                        fontSize: "11px",
                        color: day.isSame(today, "day")
                          ? "#fbbf24"
                          : "rgba(255,255,255,0.9)",
                        fontWeight: day.isSame(today, "day") ? 900 : 600,
                      }}
                    >
                      {zoomLevel === "day"
                        ? day.format("D")
                        : day.day() === 1
                        ? day.format("D")
                        : ""}
                    </Text>
                    {zoomLevel === "day" && (
                      <Text
                        style={{
                          fontSize: "8px",
                          color: "rgba(255,255,255,0.6)",
                          marginTop: "-2px",
                        }}
                      >
                        {day.locale("th").format("dd")}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex relative">
          <div
            className="absolute top-0 bottom-0 border-l-4 border-yellow-400 pointer-events-none shadow-lg"
            style={{ left: 380 + todayLeft, opacity: 0.95, zIndex: 15 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-4 py-1.5 rounded-full absolute -top-6 -left-8 shadow-xl font-bold">
              TODAY
            </div>
          </div>

          <div className="sticky left-0 z-50 w-[380px] flex-shrink-0 bg-white border-r-2 border-blue-100 shadow-xl">
            {data.map((project, index) => {
              const color = getProjectColorPalette(index);
              const childrenCount = project.children?.length || 0;
              const completedChildren =
                project.children?.filter((c) => c.status === "close").length ||
                0;

              return (
                <React.Fragment key={project.id}>
                  <div
                    className="flex items-center px-6 border-b-2 border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer group"
                    style={{ height: ROW_HEIGHT + 4 }}
                    onClick={() => toggleExpand(project.id)}
                  >
                    <div className="mr-4 text-gray-400 group-hover:text-blue-600 transition-colors">
                      {expandedProjects.has(project.id) ? (
                        <DownOutlined
                          style={{ fontSize: 14, fontWeight: "bold" }}
                        />
                      ) : (
                        <RightOutlined
                          style={{ fontSize: 14, fontWeight: "bold" }}
                        />
                      )}
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-md"
                      style={{ backgroundColor: color.light }}
                    >
                      <ProjectOutlined
                        style={{ fontSize: 18, color: color.bar }}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <Text
                        strong
                        className="truncate block"
                        style={{ fontSize: "15px", color: "#1e293b" }}
                      >
                        {project.name}
                      </Text>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag
                          color={
                            project.status === "open" ? "processing" : "default"
                          }
                          bordered={false}
                          className="rounded-full px-3 text-[10px] m-0"
                        >
                          {project.status === "open" ? "Active" : "Closed"}
                        </Tag>
                        {childrenCount > 0 && (
                          <Badge
                            count={`${completedChildren}/${childrenCount}`}
                            style={{
                              backgroundColor: "#52c41a",
                              fontSize: "10px",
                              height: "18px",
                              lineHeight: "18px",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedProjects.has(project.id) &&
                    project.children?.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center pl-16 pr-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer group"
                        style={{ height: ROW_HEIGHT }}
                        onClick={() => onItemClick(sub)}
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-4 shadow-sm border-2 border-white"
                          style={{ backgroundColor: color.bar }}
                        />
                        <div className="flex-grow min-w-0">
                          <Text
                            className="truncate text-sm block"
                            style={{
                              color:
                                sub.status === "close" ? "#94a3b8" : "#475569",
                              fontWeight: 500,
                            }}
                          >
                            {sub.name}
                          </Text>
                        </div>
                        {sub.status === "close" && (
                          <CheckCircleOutlined
                            style={{ color: "#52c41a", fontSize: 16 }}
                          />
                        )}
                      </div>
                    ))}
                </React.Fragment>
              );
            })}
          </div>

          <div className="relative flex-grow">
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 border-r ${
                    day.day() === 0 || day.day() === 6
                      ? "bg-blue-50/40 border-blue-100"
                      : "bg-white border-gray-100"
                  }`}
                  style={{ width: currentCellWidth }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {data.map((project, index) => {
                const color = getProjectColorPalette(index);
                const pos = getBarPosition(project.start, project.end);
                return (
                  <React.Fragment key={project.id}>
                    <div
                      className="relative border-b-2 border-gray-100"
                      style={{ height: ROW_HEIGHT + 4 }}
                    >
                      {pos && (
                        <Tooltip
                          title={
                            <div>
                              <div
                                style={{ fontWeight: "bold", fontSize: "13px" }}
                              >
                                {project.name}
                              </div>
                              <div
                                style={{ fontSize: "11px", marginTop: "4px" }}
                              >
                                เริ่ม: {pos.startDay.format("DD/MM/YYYY")}
                              </div>
                              <div style={{ fontSize: "11px" }}>
                                สิ้นสุด: {pos.endDay.format("DD/MM/YYYY")}
                              </div>
                              <div
                                style={{ fontSize: "11px", marginTop: "4px" }}
                              >
                                ความคืบหน้า: {project.progress}%
                              </div>
                            </div>
                          }
                          color={color.bar}
                        >
                          <div
                            className="absolute top-4 h-10 rounded-2xl flex items-center overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl cursor-pointer shadow-lg"
                            style={{
                              left: pos.left,
                              width: Math.max(pos.width, currentCellWidth * 2),
                              backgroundColor: color.bar,
                              border: `3px solid ${color.dark}`,
                            }}
                            onClick={() => onItemClick(project)}
                          >
                            <div
                              className="h-full rounded-r-2xl shadow-[4px_0_15px_rgba(0,0,0,0.15)] relative"
                              style={{
                                width: `${project.progress}%`,
                                backgroundColor: color.dark,
                              }}
                            >
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                                {project.progress}%
                              </div>
                            </div>
                            <div
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg"
                              style={{ backgroundColor: color.dark }}
                            />
                            <div
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg"
                              style={{ backgroundColor: color.dark }}
                            />
                          </div>
                        </Tooltip>
                      )}
                    </div>

                    {expandedProjects.has(project.id) &&
                      project.children?.map((sub) => {
                        const subPos = getBarPosition(sub.start, sub.end);
                        return (
                          <div
                            key={sub.id}
                            className="relative border-b border-gray-100"
                            style={{ height: ROW_HEIGHT }}
                          >
                            {subPos && (
                              <Tooltip
                                title={
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {sub.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        marginTop: "4px",
                                      }}
                                    >
                                      เริ่ม:{" "}
                                      {subPos.startDay.format("DD/MM/YYYY")}
                                    </div>
                                    <div style={{ fontSize: "10px" }}>
                                      สิ้นสุด:{" "}
                                      {subPos.endDay.format("DD/MM/YYYY")}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        marginTop: "4px",
                                      }}
                                    >
                                      สถานะ:{" "}
                                      {sub.status === "close"
                                        ? "เสร็จสิ้น"
                                        : "กำลังดำเนินการ"}
                                    </div>
                                  </div>
                                }
                                color={
                                  sub.status === "close" ? "#52c41a" : color.bar
                                }
                              >
                                <div
                                  className="absolute top-3 h-7 rounded-full flex items-center px-4 cursor-pointer transition-all hover:shadow-xl shadow-md"
                                  style={{
                                    left: subPos.left,
                                    width: Math.max(
                                      subPos.width,
                                      currentCellWidth * 1.5
                                    ),
                                    backgroundColor:
                                      sub.status === "close"
                                        ? "#52c41a"
                                        : color.bar,
                                    border: `2px solid ${
                                      sub.status === "close"
                                        ? "#22c55e"
                                        : color.dark
                                    }`,
                                    color: "#ffffff",
                                    zIndex: 5,
                                  }}
                                  onClick={() => onItemClick(sub)}
                                >
                                  <div
                                    className="absolute left-1 w-2 h-2 rounded-full shadow-sm border border-white"
                                    style={{
                                      backgroundColor:
                                        sub.status === "close"
                                          ? "#dcfce7"
                                          : color.light,
                                    }}
                                  />
                                  <span
                                    className="text-[11px] truncate font-bold ml-3"
                                    style={{
                                      textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                    }}
                                  >
                                    {sub.name}
                                  </span>
                                  <div
                                    className="absolute right-1 w-2 h-2 rounded-full shadow-sm border border-white"
                                    style={{
                                      backgroundColor:
                                        sub.status === "close"
                                          ? "#dcfce7"
                                          : color.light,
                                    }}
                                  />
                                </div>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
