"use client";

import React, { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import {
  Tooltip,
  Empty,
  Tag,
  Typography,
  Button,
  Space,
  Badge,
  theme,
} from "antd";
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
  const { token } = theme.useToken();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(data.map((p) => p.id))
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const x =
      e.clientX - rect.left + scrollContainerRef.current.scrollLeft - 420;
    if (x >= 0) {
      setHoverX(x);
    } else {
      setHoverX(null);
    }
  };

  const hoverDate = useMemo(() => {
    if (hoverX === null) return null;
    const dayOffset = Math.floor(hoverX / currentCellWidth);
    return startDate.add(dayOffset, "day");
  }, [hoverX, startDate, currentCellWidth]);

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

  // ** Auto Scroll to Today on Mount **
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      // Small timeout to ensure everything is rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const containerWidth = scrollContainerRef.current.clientWidth;
          // Scroll so Today is roughly in the center of the viewport
          const scrollTarget = 420 + todayLeft - containerWidth / 2;
          scrollContainerRef.current.scrollTo({
            left: scrollTarget,
            behavior: "smooth",
          });
        }
      }, 500);
    }
  }, [data, startDate, todayLeft]);

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
      className={`bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-auto relative border-2 border-blue-100 transition-all duration-500 custom-scrollbar ${
        isFullScreen
          ? "fixed inset-0 z-[100] h-screen w-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50"
          : "h-[calc(100vh-200px)] min-h-[600px] shadow-2xl"
      }`}
    >
      <div className="fixed bottom-12 right-12 z-[110]">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={
            isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="shadow-2xl hover:scale-110 transition-transform"
          style={{ width: 64, height: 64, fontSize: 24 }}
        />
      </div>

      <div
        className="relative"
        style={{ minWidth: 420 + totalDays * currentCellWidth }}
      >
        <div className="sticky top-0 z-[80] bg-gradient-to-r from-blue-700 to-indigo-800 backdrop-blur-xl border-b-4 border-blue-400 shadow-xl">
          <div className="flex">
            <div className="sticky left-0 z-[90] w-[420px] flex-shrink-0 bg-gradient-to-r from-blue-700 to-indigo-800 border-r-2 border-blue-400 p-6 flex items-center">
              <Space size="large">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/30">
                  <CalendarOutlined style={{ fontSize: 28 }} />
                </div>
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "20px",
                      color: "white",
                      display: "block",
                      lineHeight: "1.2",
                    }}
                  >
                    แดชบอร์ดไทม์ไลน์โครงการ
                  </Text>
                  <Text
                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}
                  >
                    ติดตามสถานะและระยะเวลาโครงการ
                  </Text>
                </div>
              </Space>
            </div>
            <div className="flex flex-col flex-grow">
              <div
                className="flex border-b-2 border-blue-400/50"
                style={{ height: HEADER_HEIGHT }}
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
                        fontSize: "15px",
                        color: "white",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
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
                        ? "bg-blue-800/40"
                        : "bg-blue-700/20"
                    }`}
                    style={{ width: currentCellWidth }}
                  >
                    <Text
                      style={{
                        fontSize: "13px",
                        color: day.isSame(today, "day")
                          ? "#fcd34d"
                          : "rgba(255,255,255,0.95)",
                        fontWeight: day.isSame(today, "day") ? 900 : 700,
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
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.7)",
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

        <div className="flex">
          <div
            className="absolute top-0 bottom-0 border-l-4 border-yellow-400 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.5)]"
            style={{ left: 420 + todayLeft, opacity: 1, zIndex: 60 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-3 py-1 rounded-full absolute -top-4 -left-7 shadow-xl font-black">
              TODAY
            </div>
          </div>

          <div
            className="sticky left-0 z-[70] w-[420px] flex-shrink-0 shadow-2xl"
            style={{
              backgroundColor: token.colorBgContainer,
              borderRight: `2px solid ${token.colorBorderSecondary}`,
            }}
          >
            {data.map((project, index) => {
              const color = getProjectColorPalette(index);
              const childrenCount = project.children?.length || 0;
              const completedChildren =
                project.children?.filter((c) => c.status === "close").length ||
                0;

              return (
                <React.Fragment key={project.id}>
                  <div
                    className="flex items-center px-6 border-b border-gray-100 hover:bg-blue-50/10 transition-all cursor-pointer group"
                    style={{
                      height: ROW_HEIGHT,
                      backgroundColor: token.colorBgContainer,
                      borderColor: token.colorBorderSecondary,
                    }}
                    onClick={() => toggleExpand(project.id)}
                  >
                    <div className="mr-4 text-gray-400 group-hover:text-blue-600 transition-colors">
                      {expandedProjects.has(project.id) ? (
                        <DownOutlined style={{ fontSize: 16 }} />
                      ) : (
                        <RightOutlined style={{ fontSize: 16 }} />
                      )}
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg border"
                      style={{
                        backgroundColor: color.light,
                        borderColor: token.colorBorderSecondary,
                      }}
                    >
                      <ProjectOutlined
                        style={{ fontSize: 22, color: color.bar }}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <Text
                        strong
                        className="truncate block"
                        style={{
                          fontSize: "16px",
                          color: token.colorText,
                          lineHeight: "1.2",
                        }}
                      >
                        {project.name}
                      </Text>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Tag
                          color={
                            project.status === "open" ? "processing" : "default"
                          }
                          bordered={false}
                          className="rounded-full px-4 text-[10px] font-bold m-0 h-5 flex items-center"
                        >
                          {project.status === "open" ? "Active" : "Closed"}
                        </Tag>
                        {childrenCount > 0 && (
                          <div className="flex items-center">
                            <Badge
                              count={`${completedChildren}/${childrenCount}`}
                              style={{
                                backgroundColor: token.colorSuccess,
                                fontSize: "10px",
                                height: "20px",
                                padding: "0 8px",
                                lineHeight: "20px",
                                borderRadius: "10px",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedProjects.has(project.id) &&
                    project.children?.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center pl-16 pr-6 border-b transition-all cursor-pointer group"
                        style={{
                          height: ROW_HEIGHT,
                          backgroundColor: token.colorFillTertiary,
                          borderColor: token.colorBorderSecondary,
                        }}
                        onClick={() => onItemClick(sub)}
                      >
                        <div
                          className="w-4 h-4 rounded-full mr-5 shadow-inner border-[3px]"
                          style={{
                            backgroundColor: color.bar,
                            borderColor: token.colorBgContainer,
                          }}
                        />
                        <div className="flex-grow min-w-0">
                          <Text
                            className="truncate text-[15px] block"
                            style={{
                              color:
                                sub.status === "close"
                                  ? token.colorTextTertiary
                                  : token.colorTextSecondary,
                              fontWeight: 600,
                            }}
                          >
                            {sub.name}
                          </Text>
                        </div>
                        {sub.status === "close" && (
                          <CheckCircleOutlined
                            style={{ color: token.colorSuccess, fontSize: 20 }}
                          />
                        )}
                      </div>
                    ))}
                </React.Fragment>
              );
            })}
          </div>

          <div
            className="relative flex-grow"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverX(null)}
          >
            {/* ** Hover Vertical Guide Line ** */}
            {hoverX !== null && (
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400/50 pointer-events-none z-[65]"
                style={{ left: hoverX }}
              >
                {hoverDate && (
                  <div className="absolute top-0 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-bold">
                    {hoverDate.locale("th").format("DD MMM YYYY")}
                  </div>
                )}
              </div>
            )}

            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 border-r ${
                    day.day() === 0 || day.day() === 6
                      ? "bg-blue-50/50 border-blue-100"
                      : "bg-white border-gray-100"
                  }`}
                  style={{ width: currentCellWidth }}
                />
              ))}
            </div>

            <div className="relative z-[60]">
              {data.map((project, index) => {
                const color = getProjectColorPalette(index);
                const pos = getBarPosition(project.start, project.end);
                return (
                  <React.Fragment key={project.id}>
                    <div
                      className="relative border-b border-gray-100"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {pos && (
                        <Tooltip
                          title={
                            <div className="p-1">
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: "14px",
                                  marginBottom: 4,
                                }}
                              >
                                {project.name}
                              </div>
                              <div style={{ fontSize: "12px", opacity: 0.9 }}>
                                <CalendarOutlined className="mr-1" />{" "}
                                {pos.startDay.format("DD MMM YYYY")} -{" "}
                                {pos.endDay.format("DD MMM YYYY")}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  marginTop: "4px",
                                  fontWeight: 700,
                                }}
                              >
                                ความคืบหน้า: {project.progress || 0}%
                              </div>
                            </div>
                          }
                          color={color.bar}
                          overlayInnerStyle={{ borderRadius: 12 }}
                          mouseEnterDelay={0.05}
                          getPopupContainer={() =>
                            scrollContainerRef.current || document.body
                          }
                        >
                          <div
                            className="absolute top-3 h-10 rounded-2xl flex items-center overflow-hidden transition-all hover:scale-[1.01] hover:shadow-2xl cursor-pointer shadow-xl border-2"
                            style={{
                              left: pos.left,
                              width: Math.max(pos.width, currentCellWidth * 2),
                              backgroundColor: color.bar,
                              borderColor: color.dark,
                            }}
                            onClick={() => onItemClick(project)}
                          >
                            <div
                              className="h-full rounded-r-2xl shadow-[4px_0_20px_rgba(0,0,0,0.2)] relative"
                              style={{
                                width: `${project.progress || 0}%`,
                                backgroundColor: color.dark,
                              }}
                            >
                              {(project.progress || 0) > 10 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-[11px] font-black tracking-wider">
                                  {project.progress || 0}%
                                </div>
                              )}
                            </div>
                            <div
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/50"
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
                            className="relative border-b border-gray-50"
                            style={{ height: ROW_HEIGHT }}
                          >
                            {subPos && (
                              <Tooltip
                                title={
                                  <div className="p-1">
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: "13px",
                                      }}
                                    >
                                      {sub.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        marginTop: "4px",
                                      }}
                                    >
                                      {subPos.startDay.format("DD/MM/YYYY")} -{" "}
                                      {subPos.endDay.format("DD/MM/YYYY")}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        marginTop: "4px",
                                        fontWeight: 700,
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
                                  sub.status === "close" ? "#10b981" : color.bar
                                }
                                overlayInnerStyle={{ borderRadius: 10 }}
                                mouseEnterDelay={0.05}
                                getPopupContainer={() =>
                                  scrollContainerRef.current || document.body
                                }
                              >
                                <div
                                  className="absolute top-4 h-8 rounded-xl flex items-center px-5 cursor-pointer transition-all hover:shadow-2xl shadow-lg border-2"
                                  style={{
                                    left: subPos.left,
                                    width: Math.max(
                                      subPos.width,
                                      currentCellWidth * 1.5
                                    ),
                                    backgroundColor:
                                      sub.status === "close"
                                        ? "#10b981"
                                        : color.bar,
                                    borderColor:
                                      sub.status === "close"
                                        ? "#065f46"
                                        : color.dark,
                                    color: "#ffffff",
                                    zIndex: 5,
                                  }}
                                  onClick={() => onItemClick(sub)}
                                >
                                  <span
                                    className="text-[12px] truncate font-black tracking-tight"
                                    style={{
                                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                    }}
                                  >
                                    {sub.name}
                                  </span>
                                  {sub.status === "close" && (
                                    <CheckCircleOutlined className="ml-2 text-[14px]" />
                                  )}
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
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 3px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};
