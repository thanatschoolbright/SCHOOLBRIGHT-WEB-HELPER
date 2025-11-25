import { useCallback, useEffect, useState } from "react";
import { message, Modal } from "antd";
import { Dayjs } from "dayjs";
import React from "react";
import {
  ApiResponse,
  SummaryMetadata,
  SummaryRecord,
} from "../types/timesheet.types";

export const useTimesheetData = (dateRange: [Dayjs, Dayjs]) => {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [start, end] = dateRange;
      const response = await fetch("/api/v1/timesheet/entry/check/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: start.format("YYYY-MM-DD"),
          end_date: end.format("YYYY-MM-DD"),
        }),
      });

      if (!response.ok) {
        const messageBody = await response.json().catch(() => ({}));
        throw new Error(
          messageBody?.message_th ||
            messageBody?.message_en ||
            "โหลดข้อมูลล้มเหลว"
        );
      }

      const body: ApiResponse = await response.json();
      setRecords(body.data?.records ?? []);
      setMetadata(body.data?.metadata ?? null);
    } catch (error: any) {
      console.error("[Timesheet][summary]", error);

      Modal.error({
        title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        content: React.createElement(
          "div",
          null,
          React.createElement(
            "p",
            null,
            error?.message || "ไม่สามารถโหลดข้อมูลได้"
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

      message.error(error?.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    records,
    metadata,
    loading,
    refetch: loadData,
  };
};
