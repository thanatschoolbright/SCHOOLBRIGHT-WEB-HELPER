import React, { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Tooltip, Empty, Tag, Avatar } from "antd";
import {
  ProjectOutlined,
  FileTextOutlined,
  RightOutlined,
  DownOutlined,
  PlusOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";

interface TimelineItem {
  id: string;
  realId: number;
  type: "project" | "sub-project";
  name: string;
  start: string | null;
  end: string | null;
  status: string;
  progress?: number;
  children?: TimelineItem[];
  projectId?: number; // For sub-projects
}

interface TimelineChartProps {
  data: TimelineItem[];
  onItemClick: (item: TimelineItem) => void;
  onAddSubProject?: (projectId: number) => void;
  loading?: boolean;
  showChildren?: boolean;
}

const CELL_WIDTH = 40; // Width of one day in pixels
const HEADER_HEIGHT = 50;
const ROW_HEIGHT = 48;

const COLORS = [
  {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    bar: "bg-blue-400",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    bar: "bg-emerald-400",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    bar: "bg-violet-400",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-400",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    bar: "bg-rose-400",
  },
  {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    bar: "bg-cyan-400",
  },
  {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-700",
    bar: "bg-fuchsia-400",
  },
  {
    bg: "bg-lime-50",
    border: "border-lime-200",
    text: "text-lime-700",
    bar: "bg-lime-400",
  },
];

const getProjectColor = (index: number) => COLORS[index % COLORS.length];

export const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  onItemClick,
  onAddSubProject,
  loading,
  showChildren = true,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(data.map((p) => p.id)) // Default expand all
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Effect to handle showChildren prop changes
  React.useEffect(() => {
    if (showChildren) {
      setExpandedProjects(new Set(data.map((p) => p.id)));
    } else {
      setExpandedProjects(new Set());
    }
  }, [showChildren, data]);

  // 1. Calculate Date Range
  const { startDate, endDate, totalDays, days } = useMemo(() => {
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
      minDate = min.subtract(7, "day"); // Buffer
    }
    if (validEnds.length > 0) {
      const max = validEnds.reduce((a, b) => (a.isAfter(b) ? a : b));
      maxDate = max.add(7, "day"); // Buffer
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

  // Effect to scroll to today
  React.useEffect(() => {
    if (scrollContainerRef.current && startDate) {
      const today = dayjs();
      const todayDiff = today.diff(startDate, "day");
      if (todayDiff >= 0) {
        const todayPos = todayDiff * CELL_WIDTH;
        const containerWidth = scrollContainerRef.current.clientWidth;
        // Center today
        const scrollLeft = todayPos - containerWidth / 2 + CELL_WIDTH / 2 + 300; // +300 for sidebar
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

  // Helper to get position
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
    return <div className="p-8 text-center">Loading Timeline...</div>;
  }

  if (!data || data.length === 0) {
    return <Empty description="No projects found" />;
  }

  const totalWidth = totalDays * CELL_WIDTH;

  // Calculate Today Position
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
      {/* Full Screen Button */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <Tooltip title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
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
          {/* Corner */}
          <div className="sticky left-0 z-40 w-[300px] flex-shrink-0 bg-gray-50 border-r p-3 font-bold text-gray-600 flex items-center shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            Project / Task
          </div>
          {/* Timeline Header */}
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
            {/* Today Label */}
            {showTodayLine && (
              <div
                className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-50"
                style={{ left: todayLeft, transform: "translateX(-50%)" }}
              >
                <div className="bg-red-500 text-white text-[10px] px-1 rounded-sm -mt-8">
                  Today
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
                    <Tooltip title="Add Sub-Project">
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
                    {project.status === "open" ? "Open" : "Closed"}
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
            {/* Grid Background */}
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
              {/* Today Line */}
              {showTodayLine && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-red-500 z-0 pointer-events-none opacity-50"
                  style={{ left: todayLeft }}
                />
              )}
            </div>
            {/* Bars Container */}
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
                                  width: Math.max(pos.width, CELL_WIDTH), // Min width
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
