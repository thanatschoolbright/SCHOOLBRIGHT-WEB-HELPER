import { useState, useEffect, useCallback } from "react";
import { Modal } from "antd";
import React from "react";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { TimelineProject } from "../types/timeline.types";

export const useTimelineData = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<TimelineProject[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/v1/timesheet/timeline");
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch timeline:", error);

      Modal.error({
        title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        content: React.createElement(
          "div",
          null,
          React.createElement(
            "p",
            null,
            error?.message || "ไม่สามารถโหลดข้อมูลไทม์ไลน์ได้"
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    projects,
    refetch: fetchData,
  };
};
