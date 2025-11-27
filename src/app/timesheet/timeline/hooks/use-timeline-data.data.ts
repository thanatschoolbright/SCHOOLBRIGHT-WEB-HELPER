import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import {
  TimelineItem,
  TimelineMetrics,
  TimelineFilters,
} from "../types/timeline.types";

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
        `/api/v1/timesheet/project/timeline?${params.toString()}`
      );
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setMetrics(json.metrics);
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
