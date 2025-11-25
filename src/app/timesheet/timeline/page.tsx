"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, Spin, Empty, theme } from "antd";
import { FieldTimeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";

import { StatsCards } from "./components/stats-cards.component";
import { TimelineToolbar } from "./components/timeline-toolbar.component";
import { TimelineHeader } from "./components/timeline-header.component";
import { TimelineRow } from "./components/timeline-row.component";
import { ProjectPopover } from "./components/project-popover.component";

import { useTimelineData } from "./hooks/use-timeline.data";
import {
  calculateStats,
  calculateTimelineRange,
  filterProjectsByDuration,
  filterProjectsBySearch,
  getProjectColor,
  SIDEBAR_WIDTH,
} from "./utils/timeline.helpers";

import { ViewMode, PopupInfo } from "./types/timeline.types";
import { useTranslation } from "react-i18next";

dayjs.extend(isBetween);

export default function TimelinePage() {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");
  const { loading, projects, refetch } = useTimelineData();

  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filterDuration, setFilterDuration] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [popupInfo, setPopupInfo] = useState<PopupInfo>({
    x: 0,
    y: 0,
    project: null,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects.length > 0) {
      setExpandedProjects(new Set(projects.map((p) => p.id)));
    }
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = filterProjectsByDuration(projects, filterDuration);
    result = filterProjectsBySearch(result, searchTerm);
    return result;
  }, [projects, filterDuration, searchTerm]);

  const stats = useMemo(
    () => calculateStats(filteredProjects),
    [filteredProjects]
  );

  const { startDate, endDate, totalDays, months } = useMemo(
    () => calculateTimelineRange(filteredProjects),
    [filteredProjects]
  );

  const toggleProject = (id: number) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedProjects(newSet);
  };

  const PIXELS_PER_DAY = viewMode === "month" ? 15 : 5;
  const TOTAL_WIDTH = totalDays * PIXELS_PER_DAY;

  useEffect(() => {
    if (scrollContainerRef.current && !loading && filteredProjects.length > 0) {
      const todayDiff = dayjs().diff(startDate, "day");
      const todayPos = todayDiff * PIXELS_PER_DAY;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollPos = todayPos + SIDEBAR_WIDTH - containerWidth / 2;

      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }
  }, [loading, filteredProjects, startDate, PIXELS_PER_DAY]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        {/* Header */}
        <HeaderBar
          title={t("timeline_page.title")}
          subTitle={t("timeline_page.subtitle")}
          icon={<FieldTimeOutlined />}
          color="none"
        />

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Main Timeline Card */}
        <Card
          bodyStyle={{ padding: 0, overflow: "hidden" }}
          style={{
            borderRadius: token.borderRadiusLG,
            border: "none",
            boxShadow: token.boxShadowTertiary,
          }}
        >
          {/* Toolbar */}
          <TimelineToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterDuration={filterDuration}
            onFilterDurationChange={setFilterDuration}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={refetch}
            loading={loading}
          />

          {/* Content */}
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 100,
              }}
            >
              <Spin size="large" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <Empty
              description={t("timeline_page.no_data")}
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
              <TimelineHeader
                months={months}
                startDate={startDate}
                pixelsPerDay={PIXELS_PER_DAY}
                totalWidth={TOTAL_WIDTH}
              />

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
                    width: 2,
                    zIndex: 5,
                    pointerEvents: "none",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: "100%",
                      backgroundColor: token.colorError,
                      opacity: 0.8,
                      margin: "0 auto",
                    }}
                  />
                </div>

                {/* Project Rows */}
                {filteredProjects.map((project, index) => (
                  <TimelineRow
                    key={project.id}
                    project={project}
                    index={index}
                    isExpanded={expandedProjects.has(project.id)}
                    projectColor={getProjectColor(index)}
                    startDate={startDate}
                    pixelsPerDay={PIXELS_PER_DAY}
                    onToggle={toggleProject}
                    onHover={setPopupInfo}
                  />
                ))}

                {/* Grid Lines */}
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

        {/* Project Popover */}
        <ProjectPopover popupInfo={popupInfo} />
      </DashboardLayout>
    </PermissionLayout>
  );
}
