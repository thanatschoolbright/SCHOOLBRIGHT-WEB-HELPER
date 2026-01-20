import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {
  TimelineItem,
  TimelineMetrics,
  TimelineFilters,
} from "../types/timeline.types";

dayjs.extend(isBetween);

export const useTimelineData = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TimelineItem[]>([]);
  const [metrics, setMetrics] = useState<TimelineMetrics>({
    totalProjects: 0,
    totalSubProjects: 0,
    overdue: 0,
    completed: 0,
    inProgress: 0,
  });

  const [filters, setFilters] = useState<TimelineFilters>({
    status: "All",
    keyword: "",
    viewType: "all",
    dateRange: [dayjs().startOf("month"), dayjs().endOf("month")],
    zoomLevel: "day",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "All") params.append("status", filters.status);
      if (filters.keyword) params.append("keyword", filters.keyword);

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append("startDate", filters.dateRange[0].toISOString());
        params.append("endDate", filters.dateRange[1].toISOString());
      }

      const res = await fetch(
        `/api/v1/timesheet/project/timeline?${params.toString()}`,
      );
      const json = await res.json();

      // Handle new response format: json.data.timeline and json.data.metrics
      if (json.data && json.data.timeline) {
        const today = dayjs();
        const sortedData = json.data.timeline.sort(
          (a: TimelineItem, b: TimelineItem) => {
            // Rule 1: สถานะปิดแล้ว (closed) ให้แสดงท้ายสุดเสมอ
            const aIsClosed = a.status === "close";
            const bIsClosed = b.status === "close";

            if (aIsClosed && !bIsClosed) return 1; // a ไปท้าย
            if (!aIsClosed && bIsClosed) return -1; // b ไปท้าย

            // Rule 2: ถ้าทั้งคู่เปิดอยู่ หรือ ทั้งคู่ปิดแล้ว -> เรียงตามจำนวน sub_project เยอะที่สุด
            const aSubCount = a.children?.length || 0;
            const bSubCount = b.children?.length || 0;

            if (aSubCount !== bSubCount) {
              return bSubCount - aSubCount; // เยอะกว่าก่อน
            }

            // Rule 3 (optional): ถ้าจำนวน sub เท่ากัน ให้เรียงตามโครงการที่อยู่ในช่วงวันปัจจุบันก่อน
            const aStart = a.start ? dayjs(a.start) : null;
            const aEnd = a.end ? dayjs(a.end) : null;
            const bStart = b.start ? dayjs(b.start) : null;
            const bEnd = b.end ? dayjs(b.end) : null;

            const isAToday =
              aStart && aEnd && today.isBetween(aStart, aEnd, "day", "[]");
            const isBToday =
              bStart && bEnd && today.isBetween(bStart, bEnd, "day", "[]");

            if (isAToday && !isBToday) return -1;
            if (!isAToday && isBToday) return 1;

            return 0;
          },
        );
        setData(sortedData);
        setMetrics(
          json.data.metrics || {
            totalProjects: 0,
            totalSubProjects: 0,
            overdue: 0,
            completed: 0,
            inProgress: 0,
          },
        );
      }
    } catch (error) {
      console.error("Failed to fetch timeline data", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    data,
    metrics,
    filters,
    setFilters,
    fetchData,
  };
};
