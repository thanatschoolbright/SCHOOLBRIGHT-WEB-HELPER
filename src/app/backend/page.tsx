"use client";
import React, { useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@stores/store";

export default function DashboardPage() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch();
  const newmanState = useAppSelector((state) => state.newman); // จาก newmanReducer

  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const executions = newmanState.result || [];
  const tableData = mapExecutionToRowData(executions);
  const isLoading = newmanState.loading;
  const headerRow = ["no.", "name", "method", "url", "status", "time", "info"];
  const [rowsPerPage, setRowsPerPage] = useState(10);

  function mapExecutionToRowData(executions: any[]) {
    const result = executions.map((item) => ({
      name: item.item.name,
      method: item.request.method,
      url: `${item.request.url.protocol}://${item.request.url.host.join(
        "."
      )}/${item.request.url.path.join("/")}`,
      status: item.response?.status || "Unknown",
      time: item.response?.responseTime || 0,
      request: item.request,
      response: item.response,
      headers: item.request.header,
      assertions: item.assertions, // ✅ เพิ่มตรงนี้
      code: item?.response?.code || "0",
      raw: item || [],
    }));

    return result;
  }

  React.useEffect(() => {
    console.log("tableData", executions);
  }, [executions]);

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6 w-full">
        {/* บังคับให้ card แรกอยู่เต็มความกว้างใน md และ xl */}
        <ContentCard
          title="Welcome"
          fullWidth
          className="md:col-span-2 xl:col-span-4 w-full"
        >
          {t("welcome")} <p>Hello Support 👋 Welcome back to your dashboard.</p>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
