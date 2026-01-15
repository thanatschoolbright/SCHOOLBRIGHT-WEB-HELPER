import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  SubProject,
  Project,
  SubProjectStats,
  PaginationState,
  FilterState,
} from "../types/sub-project.types";
import {
  calculateWorkingHours,
  determineProjectStatus,
} from "../utils/date-helpers";
import { DEFAULT_PAGE_SIZE, DEFAULT_CURRENT_PAGE } from "../utils/constants";

export const useSubProjectData = (projectId: number, adminId?: number) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [allSubProjects, setAllSubProjects] = useState<SubProject[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: DEFAULT_CURRENT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    assetType: null,
    statusFilter: null,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectRes, subProjectRes] = await Promise.all([
        fetch("/api/v1/timesheet/project/read/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 1, page: 1, id: projectId }),
        }),
        fetch("/api/v1/timesheet/project/sub-project/read/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            limit: DEFAULT_PAGE_SIZE,
            page: pagination.current,
            project_id: projectId,
          }),
        }),
      ]);

      const projectJson = await projectRes.json();
      const subProjectJson = await subProjectRes.json();

      if (projectJson?.data?.items?.length)
        setProjectData(projectJson.data.items[0]);

      const fetchedSubProjects = subProjectJson?.data || [];
      setAllSubProjects(fetchedSubProjects);
      setSubProjects(fetchedSubProjects);
      setPagination((prev) => ({
        ...prev,
        total: fetchedSubProjects.length,
      }));
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, pagination.current]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSubProjects = useMemo(() => {
    let result = [...allSubProjects];

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.name_en?.toLowerCase().includes(searchLower) ||
          item.backlogDescription?.note?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.assetType) {
      result = result.filter(
        (item) => item.assetCaptureType === filters.assetType
      );
    }

    if (filters.statusFilter) {
      result = result.filter((item) => item.status === filters.statusFilter);
    }

    return result;
  }, [allSubProjects, filters]);

  useEffect(() => {
    setSubProjects(filteredSubProjects);
    setPagination((prev) => ({
      ...prev,
      total: filteredSubProjects.length,
    }));
  }, [filteredSubProjects]);

  const stats: SubProjectStats = useMemo(() => {
    return filteredSubProjects.reduce(
      (acc, curr) => {
        const { hours } = calculateWorkingHours(
          curr.startDate || "",
          curr.endDate || ""
        );

        acc.total++;
        acc.totalHours += hours;

        if (curr.status === "ส่งมอบงาน (บนเซิฟเวอร์โปรดักชัน)") {
          acc.completed++;
        } else if (curr.status && curr.status !== "ยังไม่เริ่มต้น") {
          acc.processing++;
        }

        return acc;
      },
      { total: 0, processing: 0, completed: 0, totalHours: 0 }
    );
  }, [filteredSubProjects]);

  const handleSubmit = async (values: any) => {
    setIsActionLoading(true);
    try {
      const payload = {
        ...values,
        project_id: projectId,
        by: adminId,
      };

      const res = await fetch("/api/v1/timesheet/project/sub-project/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      toast.success(values.id ? "อัปเดตข้อมูลสำเร็จ" : "สร้างข้อมูลสำเร็จ");
      await fetchData();
      return true;
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch("/api/v1/timesheet/project/sub-project/delete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, by: adminId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("ลบข้อมูลสำเร็จ");
      await fetchData();
      return true;
    } catch (error) {
      toast.error("ลบข้อมูลล้มเหลว");
      return false;
    }
  };

  return {
    isLoading,
    isActionLoading,
    projectData,
    subProjects,
    pagination,
    stats,
    filters,
    setFilters,
    setPagination,
    handleSubmit,
    handleDelete,
    fetchData,
  };
};
