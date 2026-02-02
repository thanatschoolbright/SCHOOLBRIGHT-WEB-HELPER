import { useCallback, useEffect, useState } from "react";
import { Modal } from "antd";
import { toast } from "sonner";
import { Dayjs } from "dayjs";
import React from "react";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  ApiResponse,
  SummaryMetadata,
  SummaryRecord,
} from "../types/timesheet.types";

/**
 * Hook สำหรับจัดการข้อมูลสรุปการบันทึกเวลาทำงานทั้งหมด
 */
export const useTimesheetData = (
  dateRange: [Dayjs, Dayjs],
  departmentIds: number[] = [],
) => {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * ดึงข้อมูลสรุปการบันทึกเวลาจาก API ตามช่วงวันที่ที่กำหนด
   */
  const requestTimesheetSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [start, end] = dateRange;

      const response = await callApiService.post(
        "/api/v1/timesheet/entry/check/summary",
        {
          start_date: start.format("YYYY-MM-DD"),
          end_date: end.format("YYYY-MM-DD"),
          department_ids: departmentIds,
        },
      );

      const body: ApiResponse = response.data;
      setRecords(body.data?.records ?? []);
      setMetadata(body.data?.metadata ?? null);
    } catch (error: any) {
      console.error("[Timesheet][summary]", error);

      const errorMessage =
        error?.response?.data?.message_th ||
        error?.message ||
        "ไม่สามารถโหลดข้อมูลได้";

      Modal.error({
        title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        content: React.createElement(
          "div",
          null,
          React.createElement("p", null, errorMessage),
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
              error?.stack || JSON.stringify(error, null, 2),
            ),
          ),
        ),
      });

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, departmentIds]);

  useEffect(() => {
    requestTimesheetSummary();
  }, [requestTimesheetSummary]);

  return {
    records,
    metadata,
    loading,
    refetch: requestTimesheetSummary,
  };
};
