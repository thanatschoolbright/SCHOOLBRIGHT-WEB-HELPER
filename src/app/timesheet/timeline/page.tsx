"use client";
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  FieldTimeOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Card,
  Spin,
  Empty,
  Typography,
  Space,
  Button,
  Tooltip,
  Badge,
  Tag,
  theme,
  Radio,
  RadioChangeEvent,
  Flex,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

dayjs.extend(isBetween);

// Types
interface TimelineFeature {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  assetCaptureType: string;
}

interface TimelineProject {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  categoryType: string;
  features: TimelineFeature[];
}

const HEADER_HEIGHT = 50;
const SIDEBAR_WIDTH = 320;

export default function TimelinePage() {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<"month" | "quarter">("month");
  const [filterDuration, setFilterDuration] = useState<number | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.post("/api/v1/timesheet/timeline");
        if (response.data.success) {
          setProjects(response.data.data);
          // Expand all by default
          setExpandedProjects(
            new Set(response.data.data.map((p: any) => p.id))
          );
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter projects based on duration
  const filteredProjects = useMemo(() => {
    if (!filterDuration) return projects;

    const now = dayjs().startOf("day");
    const end = now.add(filterDuration, "month").endOf("day");

    return projects
      .map((project) => {
        // Check features overlap
        const visibleFeatures = project.features.filter((f) => {
          const fStart = dayjs(f.startDate);
          const fEnd = dayjs(f.endDate);
          // Overlap: start <= rangeEnd AND end >= rangeStart
          return (
            (fStart.isBefore(end) || fStart.isSame(end)) &&
            (fEnd.isAfter(now) || fEnd.isSame(now))
          );
        });

        // Check project overlap
        const pStart = dayjs(project.startDate);
        const pEnd = dayjs(project.endDate);
        const isProjectVisible =
          (pStart.isBefore(end) || pStart.isSame(end)) &&
          (pEnd.isAfter(now) || pEnd.isSame(now));

        if (visibleFeatures.length > 0 || isProjectVisible) {
          return {
            ...project,
            features: visibleFeatures,
          };
        }
        return null;
      })
      .filter(Boolean) as TimelineProject[];
  }, [projects, filterDuration]);

  // Calculate timeline range
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    // Use filteredProjects instead of projects
    if (filteredProjects.length === 0) {
      const start = dayjs().startOf("year");
      const end = dayjs().endOf("year");
      return {
        startDate: start,
        endDate: end,
        totalDays: end.diff(start, "day") + 1,
        months: [],
      };
    }

    const allStartDates = filteredProjects.map((p) =>
      new Date(p.startDate).getTime()
    );
    const allEndDates = filteredProjects.map((p) =>
      new Date(p.endDate).getTime()
    );

    // Include Today in the range
    const today = dayjs();
    allStartDates.push(today.toDate().getTime());
    allEndDates.push(today.toDate().getTime());

    // Add buffer
    let minDate = dayjs(Math.min(...allStartDates))
      .subtract(1, "month")
      .startOf("month");
    let maxDate = dayjs(Math.max(...allEndDates))
      .add(1, "month")
      .endOf("month");

    const days = maxDate.diff(minDate, "day") + 1;

    // Generate month headers
    const monthList = [];
    let current = minDate.clone();
    while (current.isBefore(maxDate)) {
      monthList.push(current);
      current = current.add(1, "month");
    }

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: days,
      months: monthList,
    };
  }, [filteredProjects]);

  const toggleProject = (id: number) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedProjects(newSet);
  };

  // Dynamic scale based on view mode
  const PIXELS_PER_DAY = viewMode === "month" ? 15 : 5;
  const TOTAL_WIDTH = totalDays * PIXELS_PER_DAY;

  // Auto-scroll to Today
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current && !loading && filteredProjects.length > 0) {
      // Calculate position of Today
      const todayDiff = dayjs().diff(startDate, "day");
      const todayPos = todayDiff * PIXELS_PER_DAY;

      // Center it: TodayPos + SidebarWidth - (ContainerWidth / 2)
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollPos = todayPos + SIDEBAR_WIDTH - containerWidth / 2;

      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }
  }, [loading, filteredProjects, startDate, PIXELS_PER_DAY]);

  const PROJECT_COLORS = [
    "#1890ff", // blue
    "#52c41a", // green
    "#faad14", // gold
    "#f5222d", // red
    "#722ed1", // purple
    "#13c2c2", // cyan
    "#eb2f96", // magenta
    "#fa8c16", // orange
    "#a0d911", // lime
    "#2f54eb", // geekblue
    "#fa541c", // volcano
    "#1677ff", // daybreak
  ];

  const getProjectColor = (index: number) => {
    return PROJECT_COLORS[index % PROJECT_COLORS.length];
  };

  // Helper to calculate bar position
  const getBarPosition = (start: string, end: string) => {
    const s = dayjs(start);
    const e = dayjs(end);

    const offsetDays = s.diff(startDate, "day");
    const durationDays = e.diff(s, "day") + 1; // +1 to include the last day

    return {
      left: offsetDays * PIXELS_PER_DAY,
      width: Math.max(durationDays * PIXELS_PER_DAY, 4), // Min width 4px
    };
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          title="Project Timeline"
          subTitle="แผนภาพไทม์ไลน์โครงการ (Enterprise View)"
          icon={<FieldTimeOutlined />}
          color="none"
        />

        <Card
          bodyStyle={{ padding: 0, overflow: "hidden" }}
          style={{
            borderRadius: token.borderRadiusLG,
            border: "none",
            boxShadow: token.boxShadowTertiary,
          }}
        >
          {/* Toolbar */}
          <Flex
            justify="space-between"
            align="center"
            style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Space>
              <Button
                type={viewMode === "month" ? "primary" : "default"}
                onClick={() => setViewMode("month")}
              >
                Month View
              </Button>
              <Button
                type={viewMode === "quarter" ? "primary" : "default"}
                onClick={() => setViewMode("quarter")}
              >
                Quarter View (Zoom Out)
              </Button>
            </Space>
            <Space>
              <Typography.Text strong>Focus:</Typography.Text>
              <Radio.Group
                value={filterDuration}
                onChange={(e: RadioChangeEvent) =>
                  setFilterDuration(e.target.value)
                }
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value={null}>All</Radio.Button>
                <Radio.Button value={1}>1 Month</Radio.Button>
                <Radio.Button value={3}>3 Months</Radio.Button>
                <Radio.Button value={6}>6 Months</Radio.Button>
              </Radio.Group>
            </Space>
            <Space>
              <Tag color="blue">Project</Tag>
              <Tag color="orange">Feature</Tag>
              <Tag color="green">Today</Tag>
            </Space>
          </Flex>

          {loading ? (
            <Flex justify="center" align="center" style={{ padding: 100 }}>
              <Spin size="large" />
            </Flex>
          ) : filteredProjects.length === 0 ? (
            <Empty
              description="ไม่พบข้อมูลโครงการในช่วงเวลานี้"
              style={{ margin: 50 }}
            />
          ) : (
            <div
              ref={scrollContainerRef}
              style={{
                height: "calc(100vh - 250px)",
                overflow: "auto",
                position: "relative",
              }}
            >
              {/* Header Row */}
              <Flex
                style={{
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  backgroundColor: token.colorBgLayout,
                  position: "sticky",
                  top: 0,
                  zIndex: 200,
                  width: "fit-content",
                  minWidth: "100%",
                }}
              >
                {/* Sidebar Header (Corner) */}
                <Flex
                  align="center"
                  style={{
                    width: SIDEBAR_WIDTH,
                    minWidth: SIDEBAR_WIDTH,
                    padding: "12px 16px",
                    borderRight: `2px solid ${token.colorBorderSecondary}`,
                    position: "sticky",
                    left: 0,
                    zIndex: 300,
                    backgroundColor: token.colorBgLayout,
                  }}
                >
                  <Typography.Text strong>Project Name</Typography.Text>
                </Flex>

                {/* Timeline Header */}
                <div
                  style={{
                    width: TOTAL_WIDTH,
                    height: HEADER_HEIGHT,
                    position: "relative",
                  }}
                >
                  {/* Months */}
                  {months.map((month, index) => {
                    const left = month.diff(startDate, "day") * PIXELS_PER_DAY;
                    const width = month.daysInMonth() * PIXELS_PER_DAY;
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

                  {/* Today Label in Header */}
                  <div
                    style={{
                      position: "absolute",
                      left: dayjs().diff(startDate, "day") * PIXELS_PER_DAY,
                      top: 0,
                      bottom: 0,
                      zIndex: 10,
                      transform: "translateX(-50%)", // Center the label
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
                      วันนี้
                    </div>
                    {/* Vertical line connecting label to bottom of header */}
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
              </Flex>

              {/* Body */}
              <div
                style={{
                  position: "relative",
                  width: SIDEBAR_WIDTH + TOTAL_WIDTH,
                }}
              >
                {/* Today Marker Line */}
                <div
                  style={{
                    position: "absolute",
                    left:
                      SIDEBAR_WIDTH +
                      dayjs().diff(startDate, "day") * PIXELS_PER_DAY,
                    top: 0,
                    bottom: 0,
                    width: 2, // Base width
                    zIndex: 5,
                    pointerEvents: "none",
                    transform: "translateX(-50%)", // Center the line
                  }}
                >
                  {/* Visual Line */}
                  <div
                    style={{
                      width: 4, // Visual width requested by user
                      height: "100%",
                      backgroundColor: token.colorError,
                      opacity: 0.8,
                      margin: "0 auto",
                    }}
                  />
                </div>

                {filteredProjects.map((project, index) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const projectColor = getProjectColor(index);
                  const pPos = getBarPosition(
                    project.startDate,
                    project.endDate
                  );
                  const pLeft = pPos.left;
                  const pWidth = pPos.width;

                  return (
                    <React.Fragment key={project.id}>
                      {/* Project Row */}
                      <Flex
                        align="center"
                        style={{
                          borderBottom: `1px solid ${token.colorBorderSecondary}`,
                          height: 44,
                          backgroundColor: token.colorBgContainer,
                          width: "100%",
                        }}
                      >
                        {/* Sidebar Cell */}
                        <Flex
                          justify="space-between"
                          align="center"
                          style={{
                            width: SIDEBAR_WIDTH,
                            minWidth: SIDEBAR_WIDTH,
                            padding: "0 16px",
                            borderRight: `2px solid ${token.colorBorderSecondary}`,
                            position: "sticky",
                            left: 0,
                            zIndex: 1000,
                            backgroundColor: token.colorBgContainer,
                            height: "100%",
                          }}
                        >
                          <Space>
                            <Button
                              type="text"
                              size="small"
                              icon={
                                isExpanded ? (
                                  <DownOutlined />
                                ) : (
                                  <RightOutlined />
                                )
                              }
                              onClick={() => toggleProject(project.id)}
                            />
                            <Typography.Text
                              strong
                              style={{ fontSize: 14 }}
                              ellipsis={{ tooltip: true }}
                            >
                              {project.name}
                            </Typography.Text>
                          </Space>
                          <Badge
                            count={project.features.length}
                            style={{
                              backgroundColor: token.colorFillSecondary,
                              color: token.colorTextSecondary,
                            }}
                          />
                        </Flex>

                        {/* Timeline Cell */}
                        <div
                          style={{
                            flex: 1,
                            position: "relative",
                            height: "100%",
                          }}
                        >
                          <Tooltip
                            title={`${project.name}: ${dayjs(
                              project.startDate
                            ).format("DD/MM/YYYY")} - ${dayjs(
                              project.endDate
                            ).format("DD/MM/YYYY")}`}
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: pLeft,
                                width: pWidth,
                                top: 10,
                                height: 24,
                                backgroundColor: projectColor,
                                borderRadius: 4,
                                opacity: 1,
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                              onClick={() => toggleProject(project.id)}
                            >
                              <div
                                style={{
                                  padding: "0 8px",
                                  color: "white",
                                  fontSize: 11,
                                  lineHeight: "24px",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {project.name}
                              </div>
                            </div>
                          </Tooltip>
                        </div>
                      </Flex>

                      {/* Features Rows */}
                      {isExpanded &&
                        project.features.map((feature) => {
                          const fPos = getBarPosition(
                            feature.startDate,
                            feature.endDate
                          );
                          const fLeft = fPos.left;
                          const fWidth = fPos.width;

                          return (
                            <Flex
                              key={feature.id}
                              align="center"
                              style={{
                                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                height: 36,
                                backgroundColor: token.colorFillQuaternary,
                                width: "100%",
                              }}
                            >
                              {/* Sidebar Cell */}
                              <Flex
                                align="center"
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
                                }}
                              >
                                <Typography.Text
                                  style={{ fontSize: 12 }}
                                  type="secondary"
                                  ellipsis={{ tooltip: true }}
                                >
                                  {feature.name}
                                </Typography.Text>
                              </Flex>

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
                                  title={`${feature.name}: ${dayjs(
                                    feature.startDate
                                  ).format("DD/MM/YYYY")} - ${dayjs(
                                    feature.endDate
                                  ).format("DD/MM/YYYY")}`}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: fLeft,
                                      width: fWidth,
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
                            </Flex>
                          );
                        })}
                    </React.Fragment>
                  );
                })}

                {/* Grid Lines (Vertical) */}
                {months.map((month, index) => {
                  const left =
                    SIDEBAR_WIDTH +
                    month.diff(startDate, "day") * PIXELS_PER_DAY;
                  return (
                    <div
                      key={`line-${index}`}
                      style={{
                        position: "absolute",
                        left,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: token.colorBorderSecondary,
                        zIndex: 0,
                        pointerEvents: "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </DashboardLayout>
    </PermissionLayout>
  );
}
