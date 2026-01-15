import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

import type { Project, PaginationState } from "../types/project.types";

export const useProjectData = (adminId: number) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 1000,
    total: 0,
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, statusRes] = await Promise.all([
        axios.post("/api/v1/timesheet/project/read/", {
          limit: pagination.pageSize,
          page: pagination.current,
        }),
        axios.post("/api/v1/timesheet/project/status/read/"),
      ]);

      setProjects(projectRes.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: projectRes.data.pagination?.total || 0,
      }));

      if (statusRes.data.status === 200) {
        setStatuses(statusRes.data.data);
      }
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโครงการได้");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  const createProject = async (values: any) => {
    try {
      await axios.post("/api/v1/timesheet/project/insert/", {
        ...values,
        by: adminId,
      });
      toast.success("สร้างโครงการสำเร็จ");
      await fetchProjects();
      return true;
    } catch {
      toast.error("ทำรายการล้มเหลว กรุณาลองใหม่");
      return false;
    }
  };

  const updateProject = async (id: number, values: any) => {
    try {
      await axios.post("/api/v1/timesheet/project/insert/", {
        ...values,
        id,
        by: adminId,
      });
      toast.success("อัปเดตโครงการสำเร็จ");
      await fetchProjects();
      return true;
    } catch {
      toast.error("ทำรายการล้มเหลว กรุณาลองใหม่");
      return false;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await axios.post("/api/v1/timesheet/project/delete/", {
        id,
        by: adminId,
      });
      toast.success("ลบโครงการเรียบร้อยแล้ว");
      await fetchProjects();
      return true;
    } catch {
      toast.error("ลบข้อมูลล้มเหลว");
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    loading,
    projects,
    statuses,
    pagination,
    setPagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};
