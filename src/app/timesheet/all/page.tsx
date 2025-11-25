"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Space, Typography, Modal } from "antd";
import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import { TimesheetHeader } from "./components/timesheet-header.component";
import { SummaryCards } from "./components/summary-cards.component";
import { TimesheetFilters } from "./components/timesheet-filters.component";
import { TimesheetTable } from "./components/timesheet-table.component";
import { ExportControls } from "./components/export-controls.component";
import { useTimesheetData } from "./hooks/use-timesheet.data";
import { useExportHandlers } from "./hooks/use-export-handlers.data";
import { buildDefaultRange, filterRecords } from "./utils/timesheet.helpers";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@stores/store";
import { getUserData } from "@helpers/local_storage/user.storage";
import { useDispatch } from "react-redux";
import { setUsers } from "@stores/reducers/timesheet.reducer";

import ExportModal from "@components/modal/timesheet-export-modal";
import ExportModalByProject from "@components/modal/timesheet-export-modal-by-project";
import ExportModalTemplate3 from "@components/modal/timesheet-export-modal-template3";
import ExportModalTemplate4 from "@components/modal/timesheet-export-modal-template4";

export default function TimesheetAllPage() {
  const { t } = useTranslation("translate");
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState(buildDefaultRange());

  const { records, metadata, loading, refetch } = useTimesheetData(dateRange);

  const timesheetState = useAppSelector((state) => state.timesheetAll);
  const { users, exportLoading, exportStep } = timesheetState;

  const [modalStates, setModalStates] = useState({
    exportModal: false,
    exportModal2: false,
    exportModal3: false,
    exportModal4: false,
  });

  const {
    projects,
    subProjects,
    handleExportTemplate,
    handleExportTemplate2,
    handleExportTemplate3,
    handleExportTemplate4,
    handleExportAll,
  } = useExportHandlers();

  const filteredRecords = useMemo(
    () => filterRecords(records, keyword),
    [records, keyword]
  );

  const handleClearFilters = () => {
    setKeyword("");
    setDateRange(buildDefaultRange());
  };

  const handleOpenModal = useCallback((modalType: keyof typeof modalStates) => {
    setModalStates((prev) => ({ ...prev, [modalType]: true }));
  }, []);

  const handleCloseModal = useCallback(
    (modalType: keyof typeof modalStates) => {
      setModalStates((prev) => ({ ...prev, [modalType]: false }));
    },
    []
  );

  React.useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) {
      dispatch(setUsers(allUsers));
    }
  }, [dispatch]);

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

          {/* Export Controls */}
          <ExportControls
            isExporting={exportLoading}
            exportStep={exportStep}
            onExportTemplate={() => handleOpenModal("exportModal")}
            onExportTemplate2={() => handleOpenModal("exportModal2")}
            onExportTemplate3={() => handleOpenModal("exportModal3")}
            onExportTemplate4={() => handleOpenModal("exportModal4")}
            onExportAll={handleExportAll}
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
          <TimesheetTable
            records={filteredRecords}
            loading={loading}
            metadata={metadata}
            onRefetch={refetch}
          />

          {/* Notes */}
          {metadata?.notes && (
            <div className="mt-4">
              <Typography.Text type="secondary" className="text-sm">
                {t("timesheet_page.notes_label")}: {metadata.notes}
              </Typography.Text>
            </div>
          )}
        </div>

        {/* Export Modals */}
        <ExportModal
          visible={modalStates.exportModal}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal")}
          onExport={handleExportTemplate}
          projects={projects}
          subProjects={subProjects}
          users={users}
        />

        <ExportModalByProject
          visible={modalStates.exportModal2}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal2")}
          onExport={handleExportTemplate2}
          projects={projects}
          subProjects={subProjects}
          users={users}
        />

        <ExportModalTemplate3
          visible={modalStates.exportModal3}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal3")}
          onExport={handleExportTemplate3}
        />

        <ExportModalTemplate4
          visible={modalStates.exportModal4}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal4")}
          onExport={handleExportTemplate4}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
