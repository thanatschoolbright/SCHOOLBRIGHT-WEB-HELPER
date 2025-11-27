import React, { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Tooltip, Empty, Tag } from "antd";
import {
  ProjectOutlined,
  FileTextOutlined,
  RightOutlined,
  DownOutlined,
  PlusOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TimelineItem } from "../types/timeline.types";
import {
  CELL_WIDTH,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  getProjectColor,
} from "../utils/timeline.helpers";

interface TimelineChartProps {
  data: TimelineItem[];
  onItemClick: (item: TimelineItem) => void;
  onAddSubProject?: (projectId: number) => void;
  loading?: boolean;
  showChildren?: boolean;
}

export const TimelineChartComponent: React.FC<TimelineChartProps> = ({
  data,
  onItemClick,
  onAddSubProject,
  loading,
  showChildren = true,
}) => {
  const { t } = useTranslation("translate");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(data.map((p) => p.id))
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (showChildren) {
      setExpandedProjects(new Set(data.map((p) => p.id)));
    } else {
      setExpandedProjects(new Set());
    }
  }, [showChildren, data]);

  const { startDate, totalDays, days } = useMemo(() => {
    let minDate = dayjs().startOf("month");
    let maxDate = dayjs().endOf("month");

    const allItems = data.flatMap((p) => [p, ...(p.children || [])]);
    const validStarts = allItems
      .map((i) => (i.start ? dayjs(i.start) : null))
      .filter((d) => d) as dayjs.Dayjs[];
    const validEnds = allItems
      .map((i) => (i.end ? dayjs(i.end) : null))
      .filter((d) => d) as dayjs.Dayjs[];

    if (validStarts.length > 0) {
      const min = validStarts.reduce((a, b) => (a.isBefore(b) ? a : b));
      minDate = min.subtract(7, "day");
    }
    if (validEnds.length > 0) {
      const max = validEnds.reduce((a, b) => (a.isAfter(b) ? a : b));
      maxDate = max.add(7, "day");
    }

    const total = maxDate.diff(minDate, "day") + 1;
    const daysArray = Array.from({ length: total }, (_, i) =>
      minDate.add(i, "day")
    );

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: total,
      days: daysArray,
    };
  }, [data]);

  React.useEffect(() => {
    if (scrollContainerRef.current && startDate) {
      const today = dayjs();
      const todayDiff = today.diff(startDate, "day");
      if (todayDiff >= 0) {
        const todayPos = todayDiff * CELL_WIDTH;
        const containerWidth = scrollContainerRef.current.clientWidth;
        const scrollLeft = todayPos - containerWidth / 2 + CELL_WIDTH / 2 + 300;
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: "smooth",
        });
      }
    }
  }, [startDate, data]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedProjects(newSet);
  };

  const getBarPosition = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const s = dayjs(start);
    const e = dayjs(end);
    if (!s.isValid() || !e.isValid()) return null;

    const offsetDays = s.diff(startDate, "day");
    const durationDays = e.diff(s, "day") + 1;

    return {
      left: offsetDays * CELL_WIDTH,
      width: durationDays * CELL_WIDTH,
    };
  };

  if (loading) {
    return (
      <div className="p-8 text-center">{t("timeline_page.chart.loading")}</div>
    );
  }

  if (!data || data.length === 0) {
    return <Empty description={t("timeline_page.chart.no_data")} />;
  }

  const totalWidth = totalDays * CELL_WIDTH;
  const today = dayjs();
  const todayDiff = today.diff(startDate, "day");
  const showTodayLine = todayDiff >= 0 && todayDiff < totalDays;
  const todayLeft = todayDiff * CELL_WIDTH + CELL_WIDTH / 2;

  return (
    <div
      ref={scrollContainerRef}
      className={`border rounded-lg bg-white shadow-sm overflow-auto relative transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-[600px]"
      }`}
    >
      <div className="fixed bottom-8 right-8 z-[60]">
        <Tooltip
          title={
            isFullScreen
              ? t("timeline_page.chart.exit_fullscreen")
              : t("timeline_page.chart.fullscreen")
          }
        >
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="bg-white p-3 rounded-full shadow-lg border hover:bg-gray-50 transition-colors text-gray-600 flex items-center justify-center"
          >
            {isFullScreen ? (
              <FullscreenExitOutlined style={{ fontSize: 20 }} />
            ) : (
              <FullscreenOutlined style={{ fontSize: 20 }} />
            )}
          </button>
        </Tooltip>
      </div>

      <div style={{ minWidth: 300 + totalWidth }}>
        {/* Header Row */}
        <div className="flex sticky top-0 z-30 bg-gray-50 border-b h-[50px]">
          <div className="sticky left-0 z-40 w-[300px] flex-shrink-0 bg-gray-50 border-r p-3 font-bold text-gray-600 flex items-center shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            {t("timeline_page.chart.project_task")}
          </div>
          <div className="flex relative">
            {days.map((day, i) => {
              const isMonthStart = day.date() === 1 || i === 0;
              return (
                <div
                  key={i}
                  className={`flex-shrink-0 border-r text-xs text-center flex flex-col justify-center ${
                    day.day() === 0 || day.day() === 6 ? "bg-gray-100" : ""
                  }`}
                  style={{ width: CELL_WIDTH, height: HEADER_HEIGHT }}
                >
                  {isMonthStart && (
                    <span className="font-bold text-blue-600 block">
                      {day.format("MMM")}
                    </span>
                  )}
                  <span className="text-gray-500">{day.format("D")}</span>
                </div>
              );
            })}
            {showTodayLine && (
              <div
                className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-50"
                style={{ left: todayLeft, transform: "translateX(-50%)" }}
              >
                <div className="bg-red-500 text-white text-[10px] px-1 rounded-sm -mt-8">
                  {t("timeline_page.chart.today")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body Row */}
        <div className="flex">
          {/* Sidebar Column */}
          <div className="sticky left-0 z-20 w-[300px] flex-shrink-0 bg-white border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            {data.map((project) => (
              <React.Fragment key={project.id}>
                {/* Project Row */}
                <div
                  className="flex items-center px-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => toggleExpand(project.id)}
                >
                  <div className="mr-2 text-gray-400">
                    {expandedProjects.has(project.id) ? (
                      <DownOutlined />
                    ) : (
                      <RightOutlined />
                    )}
                  </div>
                  <ProjectOutlined className="mr-2 text-blue-500" />
                  <div className="truncate font-medium flex-grow">
                    {project.name}
                  </div>
                  {onAddSubProject && (
                    <Tooltip title={t("timeline_page.chart.add_sub_project")}>
                      <PlusOutlined
                        className="mr-2 text-gray-400 hover:text-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddSubProject(project.realId);
                        }}
                      />
                    </Tooltip>
                  )}
                  <Tag
                    color={project.status === "open" ? "green" : "red"}
                    className="ml-2"
                  >
                    {project.status === "open"
                      ? t("timeline_page.filters.status_open")
                      : t("timeline_page.filters.status_closed")}
                  </Tag>
                </div>

                {/* SubProjects Sidebar */}
                {expandedProjects.has(project.id) &&
                  project.children?.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center pl-10 pr-4 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => onItemClick(sub)}
                    >
                      <FileTextOutlined className="mr-2 text-gray-400" />
                      <div className="truncate text-sm text-gray-600">
                        {sub.name}
                      </div>
                    </div>
                  ))}
              </React.Fragment>
            ))}
          </div>

          {/* Timeline Column */}
          <div className="relative flex-grow">
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 border-r h-full ${
                    day.day() === 0 || day.day() === 6 ? "bg-gray-50" : ""
                  }`}
                  style={{ width: CELL_WIDTH }}
                />
              ))}
              {showTodayLine && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-red-500 z-0 pointer-events-none opacity-50"
                  style={{ left: todayLeft }}
                />
              )}
            </div>
            <div className="relative z-10">
              {data.map((project, index) => {
                const color = getProjectColor(index);
                return (
                  <React.Fragment key={project.id}>
                    {/* Project Bar Row */}
                    <div
                      className="relative border-b"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {(() => {
                        const pos = getBarPosition(project.start, project.end);
                        if (pos) {
                          return (
                            <Tooltip
                              title={`${project.name}: ${dayjs(
                                project.start
                              ).format("DD/MM")} - ${dayjs(project.end).format(
                                "DD/MM"
                              )}`}
                            >
                              <div
                                className={`absolute top-2 h-8 rounded-md flex items-center px-2 cursor-pointer transition-colors ${color.bg} ${color.border} border`}
                                style={{
                                  left: pos.left,
                                  width: Math.max(pos.width, CELL_WIDTH),
                                }}
                                onClick={() => onItemClick(project)}
                              >
                                <div
                                  className={`h-1.5 rounded-full ${color.bar}`}
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </Tooltip>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* SubProject Bar Rows */}
                    {expandedProjects.has(project.id) &&
                      project.children?.map((sub) => (
                        <div
                          key={sub.id}
                          className="relative border-b"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {(() => {
                            const pos = getBarPosition(sub.start, sub.end);
                            if (pos) {
                              return (
                                <Tooltip
                                  title={`${sub.name}: ${dayjs(
                                    sub.start
                                  ).format("DD/MM")} - ${dayjs(sub.end).format(
                                    "DD/MM"
                                  )}`}
                                >
                                  <div
                                    className={`absolute top-3 h-6 rounded-full flex items-center px-2 cursor-pointer shadow-sm hover:shadow-md transition-all border ${
                                      sub.status === "close"
                                        ? "bg-gray-100 border-gray-300 text-gray-500"
                                        : `${color.bg} ${color.border} ${color.text}`
                                    }`}
                                    style={{
                                      left: pos.left,
                                      width: Math.max(pos.width, CELL_WIDTH),
                                    }}
                                    onClick={() => onItemClick(sub)}
                                  >
                                    <span className="text-xs truncate w-full text-center font-medium">
                                      {sub.name}
                                    </span>
                                  </div>
                                </Tooltip>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ))}
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
