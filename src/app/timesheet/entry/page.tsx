"use client";

import { Form, Space, Tag, theme } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import isBetween from "dayjs/plugin/isBetween";
import { motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import StatusModal from "@components/modal/status-modal";
import { DetailModal } from "@components/timesheet/detail-modal";

import {
  setActiveRecord,
  setFormMode,
  setLoading,
  setModalType,
  setProjects,
  setSubProjects,
} from "@stores/reducers/timesheet/timesheet-reducer";
import { useAppSelector } from "@stores/store";

import {
  useMonthlySummaryAPI,
  useTimesheetEntries,
} from "@/hooks/use-timesheet-data";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  useProjectData,
  useTimesheetActions,
} from "./hooks/use-timesheet-actions.data";
import { TimesheetEntry } from "./types/timesheet-entry.types";
import { getStatusConfig } from "./utils/timesheet-entry.helpers";

import { CreateModalForm } from "./_components/create-modal-form";
import { GuideModal } from "./_components/guide-modal";
import { MyWorkModal } from "./_components/my-work-modal";
import { PageHeader } from "./_components/page-header";
import { StatsGrid } from "./_components/stats-grid";
import { TimesheetTable } from "./_components/timesheet-table";

dayjs.extend(isBetween);
dayjs.extend(buddhistEra);
dayjs.locale("th");

// ==========================================
// 1. HELPER COMPONENTS (Now Imported)
// ==========================================

// --- Page Header (Moved to _components/page-header.tsx) ---

// --- Monthly Rank Board Component Imported Above ---

// ==========================================
// 2. MAIN PAGE COMPONENT
// ==========================================

export default function TimesheetEntryPage() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();
  const isMountedRef = useRef(true);
  const rankBoardRef = useRef<MonthlyRankBoardRef>(null);
  const { token } = theme.useToken();
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  // State
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [myWorkModalOpen, setMyWorkModalOpen] = useState(false);

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const admin_id = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id],
  );
  const admin_name = authState?.response?.data?.user_data?.firstname || "User";

  const {
    entries,
    loading: table_loading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    refetch: refetch_entries,
  } = useTimesheetEntries(admin_id);

  const [selected_summary_date, set_selected_summary_date] =
    useState<dayjs.Dayjs>(dayjs());

  const {
    monthlySummary: monthly_summary,
    stats: monthly_stats,
    loading: monthly_summary_loading,
    refetch: refetch_monthly_summary,
  } = useMonthlySummaryAPI(
    admin_id,
    selected_summary_date.month() + 1,
    selected_summary_date.year(),
  );

  const { actionLoading, submitTimesheet, deleteTimesheet } =
    useTimesheetActions(
      admin_id,
      isMountedRef,
      () => {
        refetch_entries();
        refetch_monthly_summary();
      },
      () => rankBoardRef.current?.refetch(),
      setStatusModal,
    );
  const { fetchProjects, fetchSubProjects } = useProjectData(
    isMountedRef,
    dispatch,
    setProjects,
    setSubProjects,
    setLoading,
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
  }, [dispatch]);

  const handleAfterClose = useCallback(() => {
    // No-op: form reset is handled by useEffect in CreateModalForm
  }, []);

  const openCreateForm = useCallback(() => {
    dispatch(setFormMode("create"));
    dispatch(setActiveRecord(null));
    dispatch(setSubProjects([]));
    // form.setFieldsValue removed - handled by CreateModalForm useEffect
    dispatch(setModalType("form"));
  }, [dispatch]);

  const openEditForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("edit"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;

      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects],
  );

  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("copy"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;

      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects],
  );

  const openDetailModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("detail"));
    },
    [dispatch],
  );
  const openDeleteModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("delete"));
    },
    [dispatch],
  );

  const handleSubmitTimesheet = useCallback(
    async (values: any) => {
      try {
        // Use values from onFinish if available, otherwise validate
        const finalValues =
          values && typeof values === "object" && !values.nativeEvent
            ? values
            : await form.validateFields();

        const success = await submitTimesheet(
          finalValues,
          timesheetState.formMode,
          timesheetState.activeRecord?.id,
        );
        if (success && isMountedRef.current) closeModal();
      } catch (error) {
        console.error("Form validation failed:", error);
      }
    },
    [form, submitTimesheet, timesheetState, closeModal],
  );

  const handleDeleteTimesheet = useCallback(async () => {
    if (!timesheetState.activeRecord?.id) return;
    const success = await deleteTimesheet([
      String(timesheetState.activeRecord.id),
    ]);
    if (success && isMountedRef.current) {
      closeModal();
    }
  }, [deleteTimesheet, timesheetState.activeRecord, closeModal]);

  const handlePageChange = useCallback(
    (page: number, size?: number) => {
      setCurrentPage(page);
      if (size && size !== pageSize) setPageSize(size);
    },
    [pageSize, setCurrentPage, setPageSize],
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" size={32} style={{ width: "100%" }}>
            <PageHeader
              admin_name={admin_name}
              admin_id={admin_id}
              on_add_click={openCreateForm}
              on_guide_click={() => {
                setGuideModalOpen(true);
              }}
              on_my_work_click={() => {
                setMyWorkModalOpen(true);
              }}
              token={token}
            />
            <StatsGrid
              admin_id={admin_id}
              rank_board_ref={rankBoardRef}
              monthly_summary={monthly_summary as any}
              loading={table_loading}
              monthly_summary_loading={monthly_summary_loading}
              monthly_stats={monthly_stats}
              selected_date={selected_summary_date}
              on_date_change={set_selected_summary_date}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TimesheetTable
                entries={entries}
                loading={table_loading}
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                actionLoading={actionLoading}
                onPageChange={handlePageChange}
                onRowClick={openDetailModal}
                onEdit={openEditForm}
                onCopy={openCopyForm}
                onDeleteSingle={openDeleteModal}
                onRefresh={refetch_entries}
                onAdd={openCreateForm}
              />
            </motion.div>
          </Space>

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
            formMode={timesheetState.formMode}
            record={timesheetState.activeRecord}
            afterClose={handleAfterClose}
            statusOptions={useMemo(
              () =>
                STATUS_OPTIONS.map((s) => ({
                  label: (
                    <Tag color={getStatusConfig(s.value).color}>
                      {i18n.language === "th" ? s.label_th : s.label_en}
                    </Tag>
                  ),
                  value: s.value,
                })),
              [i18n.language],
            )}
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
            selectedCount={1}
            loading={actionLoading}
          />
          <MyWorkModal
            open={myWorkModalOpen}
            onCancel={() => {
              setMyWorkModalOpen(false);
            }}
            userId={admin_id}
          />
          <GuideModal
            open={guideModalOpen}
            onCancel={() => {
              setGuideModalOpen(false);
            }}
          />

          <StatusModal
            open={statusModal.open}
            type={statusModal.type}
            title={statusModal.title}
            message={statusModal.message}
            onClose={() => {
              setStatusModal((prev) => ({ ...prev, open: false }));
            }}
          />
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
