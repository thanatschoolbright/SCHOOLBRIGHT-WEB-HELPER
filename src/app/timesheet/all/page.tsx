"use client";

import React, { useState, useMemo } from "react";
import { Space, Typography } from "antd";
import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import { TimesheetHeader } from "./components/timesheet-header.component";
import { SummaryCards } from "./components/summary-cards.component";
import { TimesheetFilters } from "./components/timesheet-filters.component";
import { TimesheetTable } from "./components/timesheet-table.component";
import { useTimesheetData } from "./hooks/use-timesheet.data";
import { buildDefaultRange, filterRecords } from "./utils/timesheet.helpers";
import { useTranslation } from "react-i18next";

export default function TimesheetAllPage() {
  const { t } = useTranslation("translate");
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState(buildDefaultRange());

  const { records, metadata, loading, refetch } = useTimesheetData(dateRange);

  const filteredRecords = useMemo(
    () => filterRecords(records, keyword),
    [records, keyword]
  );

  const handleClearFilters = () => {
    setKeyword("");
    setDateRange(buildDefaultRange());
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div className="min-h-screen p-6">
          {/* Page Header */}
          <TimesheetHeader />

          {/* Summary Cards */}
          <SummaryCards
            records={records}
            metadata={metadata}
            loading={loading}
          />

          {/* Filters */}
          <TimesheetFilters
            keyword={keyword}
            onKeywordChange={setKeyword}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onRefresh={refetch}
            onClearFilters={handleClearFilters}
            loading={loading}
          />

          {/* Metadata Info */}
          {metadata && (
            <div className="mb-4">
              <Typography.Text type="secondary" className="text-sm">
                {t("timesheet_page.date_range_label")}:{" "}
                {metadata.range.label_th} |{" "}
                {t("timesheet_page.working_days_label")} {metadata.working_days}{" "}
                {t("timesheet_page.days_unit")}
              </Typography.Text>
            </div>
          )}

          {/* Timesheet Table */}
          <TimesheetTable records={filteredRecords} loading={loading} />

          {/* Notes */}
          {metadata?.notes && (
            <div className="mt-4">
              <Typography.Text type="secondary" className="text-sm">
                {t("timesheet_page.notes_label")}: {metadata.notes}
              </Typography.Text>
            </div>
          )}
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
