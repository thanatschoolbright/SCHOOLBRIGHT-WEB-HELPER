import type { TimesheetEntry } from "@/types/timesheet-table.types";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  POST_EXPORT_ALL_ENTRIES,
  POST_EXPORT_AUDIT_REPORT,
} from "@services/timesheet/timesheet-all.service";
import {
  setExportLoading,
  setExportStep,
} from "@stores/reducers/timesheet.reducer";
import { useAppSelector } from "@stores/store";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";

export const useExportHandlers = () => {
  const dispatch = useDispatch();
  const timesheetState = useAppSelector((state) => state.timesheetAll);
  const { users } = timesheetState;

  const [statusLabelMap, setStatusLabelMap] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const map = STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label_th;
      return acc;
    }, {});
    setStatusLabelMap(map);
  }, []);

  const handleExportTemplate4 = useCallback(
    async (payloads: { from: string; to: string }[]) => {
      dispatch(setExportLoading(true));
      dispatch(setExportStep(0));

      try {
        const total = payloads.length;
        let count = 0;

        for (const payload of payloads) {
          count++;
          dispatch(setExportStep(1)); // กำลังเตรียมข้อมูล

          await POST_EXPORT_AUDIT_REPORT({
            start_date: payload.from,
            end_date: payload.to,
          });

          // อัปเดตสถานะถ้ามีหลายไฟล์ และหน่วงเวลาเล็กน้อยเพื่อไม่ให้ Browser บล็อกการดาวน์โหลด
          if (total > 1) {
            toast.info(`ดาวน์โหลดแล้ว ${count}/${total} ไฟล์`, {
              duration: 1500,
            });
            if (count < total) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        dispatch(setExportStep(2));
        setTimeout(() => dispatch(setExportStep(3)), 800);

        toast.success(`ส่งออก Template 4 สำเร็จ (${total} ไฟล์)`);

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
    [dispatch],
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
          (u) => String(u.admin_id) === String(entry.created_by),
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
        "YYYYMMDD-HHmmss",
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
    handleExportTemplate4,
    handleExportAll,
    requestExportTemplate4: handleExportTemplate4,
    requestExportAll: handleExportAll,
  };
};
