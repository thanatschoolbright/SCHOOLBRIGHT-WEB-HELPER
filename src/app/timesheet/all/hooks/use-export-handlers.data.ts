import { useCallback, useState, useEffect } from "react";
import { utils, writeFile } from "xlsx";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@stores/store";
import {
  setExportLoading,
  setExportStep,
  setProjects,
  setSubProjects,
  setProjectsLoading,
  setSubProjectsLoading,
} from "@stores/reducers/timesheet.reducer";
import {
  GET_PROJECTS,
  GET_SUB_PROJECTS_BY_PROJECT,
  POST_EXPORT_ALL_ENTRIES,
  POST_EXPORT_TEMPLATE,
  POST_EXPORT_PROJECT_TEMPLATE,
  POST_EXPORT_SUB_PROJECT_WEEK_BY_WEEK,
  POST_EXPORT_AUDIT_REPORT,
} from "@services/timesheet/timesheet-all.service";
import type { ProjectExportData } from "@services/timesheet/timesheet-all.service";
import type { TimesheetExportData } from "@/types/timesheet-table.types";
import type { TimesheetEntry } from "@/types/timesheet-table.types";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";

export const useExportHandlers = () => {
  const dispatch = useDispatch();
  const timesheetState = useAppSelector((state) => state.timesheetAll);
  const { users, projects, subProjects } = timesheetState;

  const [statusLabelMap, setStatusLabelMap] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const map = STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label_th;
      return acc;
    }, {});
    setStatusLabelMap(map);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = useCallback(async () => {
    dispatch(setProjectsLoading(true));
    try {
      const projectsData = await GET_PROJECTS({ limit: 50, page: 1 });
      dispatch(setProjects(projectsData));
    } catch (error) {
      dispatch(setProjects([]));
    } finally {
      dispatch(setProjectsLoading(false));
    }
  }, [dispatch]);

  const loadSubProjects = useCallback(
    async (projectId: number) => {
      dispatch(setSubProjectsLoading(true));
      try {
        const subProjectsData = await GET_SUB_PROJECTS_BY_PROJECT(projectId);
        dispatch(setSubProjects(subProjectsData));
      } catch (error) {
        dispatch(setSubProjects([]));
      } finally {
        dispatch(setSubProjectsLoading(false));
      }
    },
    [dispatch]
  );

  const handleExportTemplate = useCallback(
    async (exportData: TimesheetExportData) => {
      dispatch(setExportLoading(true));
      try {
        await POST_EXPORT_TEMPLATE(exportData);
        toast.success("ส่งออก Template 1 สำเร็จ");
      } catch (error: any) {
        toast.error("ส่งออกล้มเหลว: " + (error?.message || ""));
      } finally {
        dispatch(setExportLoading(false));
      }
    },
    [dispatch]
  );

  const handleExportTemplate2 = useCallback(
    async (exportData: ProjectExportData) => {
      dispatch(setExportLoading(true));
      try {
        await POST_EXPORT_PROJECT_TEMPLATE(exportData);
        toast.success("ส่งออก Template 2 สำเร็จ");
      } catch (error: any) {
        toast.error("ส่งออกล้มเหลว: " + (error?.message || ""));
      } finally {
        dispatch(setExportLoading(false));
      }
    },
    [dispatch]
  );

  const handleExportTemplate3 = useCallback(
    async ({ from, to }: { from: string; to: string }) => {
      dispatch(setExportLoading(true));
      try {
        const fromDate = dayjs(from, "MM/YYYY")
          .startOf("month")
          .format("YYYY-MM-DD");
        const toDate = dayjs(to, "MM/YYYY").endOf("month").format("YYYY-MM-DD");

        await POST_EXPORT_SUB_PROJECT_WEEK_BY_WEEK({
          start_date: fromDate,
          end_date: toDate,
        });
        toast.success("ส่งออก Template 3 สำเร็จ");
      } catch (error: any) {
        toast.error("ส่งออกล้มเหลว: " + (error?.message || ""));
      } finally {
        dispatch(setExportLoading(false));
      }
    },
    [dispatch]
  );

  const handleExportTemplate4 = useCallback(
    async ({ from, to }: { from: string; to: string }) => {
      dispatch(setExportLoading(true));
      dispatch(setExportStep(0));

      try {
        setTimeout(() => dispatch(setExportStep(1)), 500);

        const fromDate = dayjs(from, "MM/YYYY")
          .startOf("month")
          .format("YYYY-MM-DD");
        const toDate = dayjs(to, "MM/YYYY").endOf("month").format("YYYY-MM-DD");

        await POST_EXPORT_AUDIT_REPORT({
          start_date: fromDate,
          end_date: toDate,
        });

        dispatch(setExportStep(2));
        setTimeout(() => dispatch(setExportStep(3)), 800);

        toast.success("ส่งออก Template 4 สำเร็จ");

        setTimeout(() => {
          dispatch(setExportLoading(false));
          dispatch(setExportStep(0));
        }, 3000);
      } catch (error: any) {
        toast.error("ส่งออกล้มเหลว: " + (error?.message || ""));
        dispatch(setExportLoading(false));
        dispatch(setExportStep(0));
      }
    },
    [dispatch]
  );

  const handleExportAll = useCallback(async () => {
    dispatch(setExportLoading(true));
    dispatch(setExportStep(0));
    try {
      setTimeout(() => dispatch(setExportStep(1)), 500);
      const { entries: allEntries } = await POST_EXPORT_ALL_ENTRIES();

      if (!allEntries.length) {
        toast.warning("ไม่มีข้อมูลให้ส่งออก");
        dispatch(setExportLoading(false));
        dispatch(setExportStep(0));
        return;
      }

      dispatch(setExportStep(2));

      const dataset = allEntries.map((entry: TimesheetEntry) => {
        const user = users.find(
          (u) => String(u.admin_id) === String(entry.created_by)
        );
        return {
          วันที่: entry.date ? dayjs(entry.date).format("DD/MM/YYYY") : "-",
          ชื่อโปรเจ็กต์: entry.project_name ?? "-",
          ชื่อฟีเจอร์: entry.feature_name ?? "-",
          ชื่อผู้จัดทำ: user
            ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "-"
            : "-",
          สถานะ: statusLabelMap[entry.status] ?? entry.status ?? "-",
          ชั่วโมง: Number(entry.hours ?? 0),
          คำอธิบาย: entry.description ?? "-",
        };
      });

      const worksheet = utils.json_to_sheet(dataset);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Timesheet");
      const filename = `timesheet-report-${dayjs().format(
        "YYYYMMDD-HHmmss"
      )}.xlsx`;
      writeFile(workbook, filename);

      dispatch(setExportStep(3));
      toast.success("ส่งออกข้อมูลสำเร็จ");

      setTimeout(() => {
        dispatch(setExportLoading(false));
        dispatch(setExportStep(0));
      }, 2000);
    } catch (error: any) {
      toast.error("ส่งออกล้มเหลว: " + (error?.message || ""));
      dispatch(setExportLoading(false));
      dispatch(setExportStep(0));
    }
  }, [dispatch, users, statusLabelMap]);

  return {
    projects,
    subProjects,
    handleExportTemplate,
    handleExportTemplate2,
    handleExportTemplate3,
    handleExportTemplate4,
    handleExportAll,
    loadSubProjects,
  };
};
