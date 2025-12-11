"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Form, Space, Divider, theme } from "antd";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";
import { useDispatch } from "react-redux";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { DetailModal } from "@components/timesheet/detail-modal";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import { CreateModalForm } from "./create";
import { MonthlyRankBoardRef } from "./monthly-rank-board";

import { PageHeader } from "./components/page-header.component";
import { StatsGrid } from "./components/stats-grid.component";
import { TimesheetTable } from "./components/timesheet-table.component";

import {
  useDailySummary,
  useTimesheetEntries,
  useTopUsage,
  useWeeklySummary,
} from "@/hooks/use-timesheet-data";
import {
  useTimesheetActions,
  useProjectData,
} from "./hooks/use-timesheet-actions.data";

import { useAppSelector } from "@stores/store";
import {
  setActiveRecord,
  setFormMode,
  setLoading,
  setModalType,
  setProjects,
  setSelectedRowKeys,
  setSubProjects,
} from "@stores/reducers/timesheet/timesheet-reducer";

import { TimesheetEntry } from "./types/timesheet-entry.types";

dayjs.extend(isBetween);

export default function TimesheetEntryPage() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();
  const isMountedRef = useRef(true);
  const rankBoardRef = useRef<MonthlyRankBoardRef>(null);

  const { token } = theme.useToken();

  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );
  const adminName = authState?.response?.data?.user_data?.firstname || "User";

  const {
    entries,
    loading: tableLoading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    refetch: refetchEntries,
  } = useTimesheetEntries(adminId);

  const dailySummary = useDailySummary(entries);
  const weeklySummary = useWeeklySummary(dailySummary);
  const { topProjectUsage, topFeatureUsage } = useTopUsage(entries);

  const { actionLoading, submitTimesheet, deleteTimesheet } =
    useTimesheetActions(adminId, isMountedRef, refetchEntries, () =>
      rankBoardRef.current?.refetch()
    );

  const { fetchProjects, fetchSubProjects } = useProjectData(
    isMountedRef,
    dispatch,
    setProjects,
    setSubProjects,
    setLoading
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const closeModal = useCallback(() => {
    dispatch(setModalType(null));
    dispatch(setActiveRecord(null));
    dispatch(setFormMode("create"));
    form.resetFields();
  }, [dispatch, form]);

  const openCreateForm = useCallback(() => {
    dispatch(setFormMode("create"));
    dispatch(setActiveRecord(null));
    dispatch(setSubProjects([]));
    form.setFieldsValue({
      project_id: undefined,
      sub_project_id: undefined,
      description: "",
      work_hour: undefined,
      status: "IN_PROGRESS",
      date: dayjs(),
    });
    dispatch(setModalType("form"));
  }, [dispatch, form]);

  const openEditForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("edit"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;
      form.setFieldsValue({
        project_id: Number(record.project_id),
        sub_project_id: record.feature_id
          ? Number(record.feature_id)
          : undefined,
        description: record.description ?? "",
        work_hour: Number(record.hours) || undefined,
        status: record.status,
        date: dayjs(record.date),
      });
      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects, form]
  );

  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("copy"));
      dispatch(setActiveRecord(null));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;
      form.setFieldsValue({
        project_id: Number(record.project_id),
        sub_project_id: record.feature_id
          ? Number(record.feature_id)
          : undefined,
        description: record.description ?? "",
        work_hour: Number(record.hours) || undefined,
        status: record.status,
        date: dayjs(),
      });
      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects, form]
  );

  const openDetailModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("detail"));
    },
    [dispatch]
  );

  const openDeleteModal = useCallback(() => {
    dispatch(setModalType("delete"));
  }, [dispatch]);

  const handleSubmitTimesheet = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const success = await submitTimesheet(
        values,
        timesheetState.formMode,
        timesheetState.activeRecord?.id
      );
      if (success && isMountedRef.current) {
        closeModal();
      }
    } catch (error) {
      // Validation error handled by form
    }
  }, [form, submitTimesheet, timesheetState, closeModal]);

  const handleDeleteTimesheet = useCallback(async () => {
    const success = await deleteTimesheet(timesheetState.selectedRowKeys);
    if (success && isMountedRef.current) {
      dispatch(setSelectedRowKeys([]));
      closeModal();
    }
  }, [deleteTimesheet, timesheetState.selectedRowKeys, dispatch, closeModal]);

  const handlePageChange = useCallback(
    (page: number, size?: number) => {
      setCurrentPage(page);
      if (size && size !== pageSize) setPageSize(size);
    },
    [pageSize, setCurrentPage, setPageSize]
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: "24px 32px",
            minHeight: "100vh",
            background: token.colorBgLayout,
          }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Header Section */}
            <PageHeader
              adminName={adminName}
              onAddClick={openCreateForm}
              token={token}
            />

            {/* Stats Section */}
            <StatsGrid
              adminId={adminId}
              rankBoardRef={rankBoardRef}
              weeklySummary={weeklySummary as any}
              topProjectUsage={topProjectUsage}
              topFeatureUsage={topFeatureUsage}
              loading={tableLoading}
            />

            <Divider dashed style={{ margin: "8px 0" }} />

            {/* Main Data Table */}
            <TimesheetTable
              entries={entries}
              loading={tableLoading}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              selectedRowKeys={timesheetState?.selectedRowKeys}
              actionLoading={actionLoading}
              onPageChange={handlePageChange}
              onRowSelect={(keys) => dispatch(setSelectedRowKeys(keys))}
              onRowClick={openDetailModal}
              onEdit={openEditForm}
              onCopy={openCopyForm}
              onRefresh={refetchEntries}
              onAdd={openCreateForm}
              onDelete={openDeleteModal}
            />
          </Space>

          {/* Modals */}
          <CreateModalForm
            open={timesheetState?.modalType === "form"}
            onCancel={closeModal}
            onSubmit={handleSubmitTimesheet}
            form={form}
            projects={timesheetState.projects}
            subProject={timesheetState.subProjects}
            fetchSubProjects={(id) => fetchSubProjects(Number(id))}
            i18n={i18n}
            disabled={actionLoading}
            formMode={timesheetState.formMode} // ✅ เพิ่ม prop นี้
          />

          <DetailModal
            open={
              timesheetState.modalType === "detail" &&
              !!timesheetState.activeRecord
            }
            onCancel={closeModal}
            record={timesheetState.activeRecord}
          />

          <DeleteConfirmationModal
            open={timesheetState.modalType === "delete"}
            onCancel={closeModal}
            onConfirm={handleDeleteTimesheet}
            selectedCount={timesheetState.selectedRowKeys.length}
            loading={actionLoading}
          />
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
