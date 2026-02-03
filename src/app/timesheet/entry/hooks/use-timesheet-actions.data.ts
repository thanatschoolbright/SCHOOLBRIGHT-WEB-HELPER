import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { Modal } from "antd";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  SubProject,
  TimesheetFormValues,
} from "../types/timesheet-entry.types";

export const useTimesheetActions = (
  adminId: number | undefined,
  isMountedRef: React.MutableRefObject<boolean>,
  refetchEntries: () => void,
  rankBoardRefetch?: () => void,
  onStatusChange?: (status: {
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }) => void,
) => {
  const [actionLoading, setActionLoading] = useState(false);

  const submitTimesheet = useCallback(
    async (
      values: TimesheetFormValues,
      formMode: string,
      activeRecordId?: number,
      options: { showModal?: boolean } = { showModal: true },
    ) => {
      const TOAST_ID = "submit-form";
      try {
        setActionLoading(true);
        if (options.showModal !== false) {
          toast.loading("กำลังบันทึกข้อมูล...", { id: TOAST_ID });
        }

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

        const response = await axios.post(
          "/api/v1/timesheet/entry/insert/",
          payload,
          {
            headers: { "Content-Type": "application/json" },
          },
        );

        if (response.data?.status !== 200) {
          throw response; // Throw to catch block if status in body is not 200
        }

        if (options.showModal !== false) {
          toast.success("บันทึกข้อมูลสำเร็จ", { id: TOAST_ID });

          if (onStatusChange) {
            onStatusChange({
              open: true,
              type: "success",
              title: "บันทึกข้อมูลสำเร็จ",
              message: "ระบบได้ทำการบันทึกเวลาทำงานของคุณเรียบร้อยแล้ว",
            });
          }
        }

        if (isMountedRef.current) {
          refetchEntries();
          rankBoardRefetch?.();
        }
        return true;
      } catch (error: any) {
        if (error?.errorFields) return false;

        const errorMsg =
          error?.response?.data?.message_th ||
          error?.data?.message_th ||
          error?.message ||
          "บันทึกข้อมูลล้มเหลว";

        if (options.showModal !== false) {
          if (onStatusChange) {
            onStatusChange({
              open: true,
              type: "error",
              title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
              message: errorMsg,
            });
          } else {
            Modal.error({
              title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
              content: React.createElement(
                "div",
                null,
                React.createElement("p", null, errorMsg),
                React.createElement(
                  "details",
                  { style: { marginTop: 12 } },
                  React.createElement(
                    "summary",
                    { style: { cursor: "pointer", color: "#1890ff" } },
                    "ดูรายละเอียดเพิ่มเติม",
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
                    JSON.stringify(error?.response?.data || error, null, 2),
                  ),
                ),
              ),
            });
          }

          toast.error("บันทึกข้อมูลล้มเหลว", {
            id: TOAST_ID,
            description: errorMsg,
          });
        }
        return false;
      } finally {
        if (isMountedRef.current) setActionLoading(false);
      }
    },
    [adminId, refetchEntries, rankBoardRefetch, isMountedRef, onStatusChange],
  );

  const deleteTimesheet = useCallback(
    async (
      selectedRowKeys: any[],
      options: { showModal?: boolean } = { showModal: true },
    ) => {
      if (!selectedRowKeys.length) return false;
      const TOAST_ID = "bulk-delete";
      try {
        if (isMountedRef.current) setActionLoading(true);
        if (options.showModal !== false) {
          toast.loading("กำลังลบรายการ...", { id: TOAST_ID });
        }

        await axios.post(
          "/api/v1/timesheet/entry/delete/",
          {
            ids: selectedRowKeys.map((key: any) => Number(key)),
            by: adminId,
          },
          { headers: { "Content-Type": "application/json" } },
        );

        if (options.showModal !== false) {
          toast.success("ลบรายการสำเร็จ", { id: TOAST_ID });

          if (onStatusChange) {
            onStatusChange({
              open: true,
              type: "success",
              title: "ลบข้อมูลสำเร็จ",
              message: `ระบบได้ทำการลบรายการจำนวน ${selectedRowKeys.length} รายการเรียบร้อยแล้ว`,
            });
          }
        }

        if (isMountedRef.current) {
          refetchEntries();
          rankBoardRefetch?.();
        }
        return true;
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.message_th ||
          error?.message ||
          "ลบรายการล้มเหลว";

        if (options.showModal !== false) {
          if (onStatusChange) {
            onStatusChange({
              open: true,
              type: "error",
              title: "เกิดข้อผิดพลาดในการลบข้อมูล",
              message: errorMsg,
            });
          } else {
            Modal.error({
              title: "เกิดข้อผิดพลาดในการลบข้อมูล",
              content: React.createElement(
                "div",
                null,
                React.createElement("p", null, errorMsg),
                React.createElement(
                  "details",
                  { style: { marginTop: 12 } },
                  React.createElement(
                    "summary",
                    { style: { cursor: "pointer", color: "#1890ff" } },
                    "ดูรายละเอียดเพิ่มเติม",
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
                    JSON.stringify(error?.response?.data || error, null, 2),
                  ),
                ),
              ),
            });
          }

          toast.error("ลบรายการล้มเหลว", {
            id: TOAST_ID,
            description: errorMsg,
          });
        }
        return false;
      } finally {
        if (isMountedRef.current) setActionLoading(false);
      }
    },
    [adminId, refetchEntries, rankBoardRefetch, isMountedRef, onStatusChange],
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
  setLoading: any,
) => {
  const fetchProjects = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit: 300,
        page: 1,
      });

      if (!isMountedRef.current) return;

      const rawProjects = response.data?.data ?? [];

      const activeProjects = rawProjects.filter(
        (project: any) => project.is_deleted === false,
      );

      dispatch(setProjects(activeProjects));
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
          { limit: 100, page: 1, project_id: Number(projectId) },
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
    [dispatch, isMountedRef, setSubProjects],
  );

  return {
    fetchProjects,
    fetchSubProjects,
  };
};
