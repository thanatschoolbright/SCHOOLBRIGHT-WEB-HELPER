import { useCallback, useState } from "react";
import { Modal } from "antd";
import { toast } from "sonner";
import React from "react";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Project,
  SubProject,
  TimesheetFormValues,
} from "../types/timesheet-entry.types";

export const useTimesheetActions = (
  adminId: number | undefined,
  isMountedRef: React.MutableRefObject<boolean>,
  refetchEntries: () => void,
  rankBoardRefetch?: () => void
) => {
  const [actionLoading, setActionLoading] = useState(false);

  const submitTimesheet = useCallback(
    async (
      values: TimesheetFormValues,
      formMode: string,
      activeRecordId?: number
    ) => {
      const TOAST_ID = "submit-form";
      try {
        setActionLoading(true);
        toast.loading("กำลังบันทึกข้อมูล...", { id: TOAST_ID });

        const payload = {
          id: formMode === "edit" ? activeRecordId : undefined,
          project_id: values.project_id,
          sub_project_id: values.sub_project_id,
          description: values.description ?? "",
          work_hour: values.work_hour,
          status: values.status,
          date: values.date ? values.date.toDate() : undefined,
          by: adminId,
        };

        await axios.post("/api/v1/timesheet/entry/insert/", payload, {
          headers: { "Content-Type": "application/json" },
        });

        toast.success("บันทึกข้อมูลสำเร็จ", { id: TOAST_ID });
        if (isMountedRef.current) {
          refetchEntries();
          rankBoardRefetch?.();
        }
        return true;
      } catch (error: any) {
        if (error?.errorFields) return false;

        Modal.error({
          title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          content: React.createElement(
            "div",
            null,
            React.createElement(
              "p",
              null,
              error?.message || "บันทึกข้อมูลล้มเหลว"
            ),
            React.createElement(
              "details",
              { style: { marginTop: 12 } },
              React.createElement(
                "summary",
                { style: { cursor: "pointer", color: "#1890ff" } },
                "ดูรายละเอียดเพิ่มเติม"
              ),
              React.createElement(
                "pre",
                {
                  style: {
                    marginTop: 8,
                    padding: 8,
                    background: "#f5f5f5",
                    borderRadius: 4,
                    fontSize: 12,
                    maxHeight: 200,
                    overflow: "auto",
                  },
                },
                error?.stack || JSON.stringify(error, null, 2)
              )
            )
          ),
        });

        toast.error("บันทึกข้อมูลล้มเหลว", {
          id: TOAST_ID,
          description: error?.message,
        });
        return false;
      } finally {
        if (isMountedRef.current) setActionLoading(false);
      }
    },
    [adminId, refetchEntries, rankBoardRefetch, isMountedRef]
  );

  const deleteTimesheet = useCallback(
    async (selectedRowKeys: any[]) => {
      if (!selectedRowKeys.length) return false;
      const TOAST_ID = "bulk-delete";
      try {
        setActionLoading(true);
        toast.loading("กำลังลบรายการ...", { id: TOAST_ID });

        await axios.post(
          "/api/v1/timesheet/entry/delete/",
          {
            ids: selectedRowKeys.map((key: any) => Number(key)),
            by: adminId,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        toast.success("ลบรายการสำเร็จ", { id: TOAST_ID });
        if (isMountedRef.current) {
          refetchEntries();
          rankBoardRefetch?.();
        }
        return true;
      } catch (error: any) {
        Modal.error({
          title: "เกิดข้อผิดพลาดในการลบข้อมูล",
          content: React.createElement(
            "div",
            null,
            React.createElement("p", null, error?.message || "ลบรายการล้มเหลว"),
            React.createElement(
              "details",
              { style: { marginTop: 12 } },
              React.createElement(
                "summary",
                { style: { cursor: "pointer", color: "#1890ff" } },
                "ดูรายละเอียดเพิ่มเติม"
              ),
              React.createElement(
                "pre",
                {
                  style: {
                    marginTop: 8,
                    padding: 8,
                    background: "#f5f5f5",
                    borderRadius: 4,
                    fontSize: 12,
                    maxHeight: 200,
                    overflow: "auto",
                  },
                },
                error?.stack || JSON.stringify(error, null, 2)
              )
            )
          ),
        });

        toast.error("ลบรายการล้มเหลว", {
          id: TOAST_ID,
          description: error?.message,
        });
        return false;
      } finally {
        if (isMountedRef.current) setActionLoading(false);
      }
    },
    [adminId, refetchEntries, rankBoardRefetch, isMountedRef]
  );

  return {
    actionLoading,
    submitTimesheet,
    deleteTimesheet,
  };
};

export const useProjectData = (
  isMountedRef: React.MutableRefObject<boolean>,
  dispatch: any,
  setProjects: any,
  setSubProjects: any,
  setLoading: any
) => {
  const fetchProjects = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit: 100,
        page: 1,
      });
      if (!isMountedRef.current) return;
      dispatch(setProjects(response.data?.data ?? []));
    } catch (error: any) {
      console.error("fetchProjects", error);
      Modal.error({
        title: "เกิดข้อผิดพลาดในการโหลดโครงการ",
        content: error?.message || "ไม่สามารถโหลดรายการโครงการได้",
      });
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, isMountedRef, setProjects, setLoading]);

  const fetchSubProjects = useCallback(
    async (projectId: number): Promise<SubProject[]> => {
      if (!projectId) {
        dispatch(setSubProjects([]));
        return [];
      }
      const TOAST_ID = "fetch-sub-projects";
      try {
        toast.loading("กำลังโหลดรายการฟีเจอร์...", { id: TOAST_ID });
        const response = await axios.post(
          "/api/v1/timesheet/project/sub-project/read/",
          { limit: 100, page: 1, project_id: Number(projectId) }
        );
        // API returns { data: [...] } not { data: { items: [...] } }
        const items = response.data?.data ?? [];
        if (isMountedRef.current) dispatch(setSubProjects(items));
        toast.success("โหลดรายการฟีเจอร์สำเร็จ", { id: TOAST_ID });
        return items;
      } catch (error: any) {
        console.error("fetchSubProjects", error);
        if (isMountedRef.current) dispatch(setSubProjects([]));
        toast.error("โหลดรายการฟีเจอร์ไม่สำเร็จ", {
          id: TOAST_ID,
          description: error?.message,
        });
        return [];
      }
    },
    [dispatch, isMountedRef, setSubProjects]
  );

  return {
    fetchProjects,
    fetchSubProjects,
  };
};
