"use client";

import { Form, Space, Tag } from "antd";
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
  setModalType,
} from "@stores/reducers/timesheet/timesheet-reducer";
import { useAppSelector } from "@stores/store";

import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import { CreateModalForm } from "./_components/create-modal-form";
import { FilterSection } from "./_components/filter-section";
import { GuideModal } from "./_components/guide-modal";
import { MonthlyRankBoardRef } from "./_components/monthly-rank-board";
import { MyWorkModal } from "./_components/my-work-modal";
import { PageHeader } from "./_components/page-header";
import { StatsGrid } from "./_components/stats-grid";
import { TimesheetTable } from "./_components/timesheet-table";
import { useTimesheetStore } from "./_state/use-timesheet-store";

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
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetRedux = useAppSelector((state) => state.timesheet);

  // Zustand Store
  const {
    entries,
    loading,
    totalItems,
    currentPage,
    pageSize,
    projects,
    subProjects,
    monthlySummary,
    monthlyStats,
    summaryLoading,
    actionLoading,
    fetchEntries,
    fetchProjects,
    fetchSubProjects,
    fetchMonthlySummary,
    fetchWeeklySummary,
    saveTimesheet,
    deleteTimesheet,
    setPagination,
    clearSubProjects,
    setFilters,
    resetFilters,
  } = useTimesheetStore();

  // Local State
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [myWorkModalOpen, setMyWorkModalOpen] = useState(false);
  const [selected_summary_date, set_selected_summary_date] =
    useState<dayjs.Dayjs>(dayjs());

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

  // Initial Data Fetching
  useEffect(() => {
    isMountedRef.current = true;
    fetchProjects();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchProjects]);

  useEffect(() => {
    if (admin_id) {
      fetchEntries(admin_id);
    }
  }, [admin_id, fetchEntries, currentPage, pageSize]);

  useEffect(() => {
    if (admin_id) {
      // ใช้ fetchMonthlySummary เพียงอย่างเดียวเพื่อข้อมูลสรุปรายเดือนที่ถูกต้อง
      fetchMonthlySummary(admin_id, selected_summary_date);
    }
  }, [admin_id, fetchMonthlySummary, selected_summary_date]);

  const closeModal = useCallback(() => {
    dispatch(setModalType(null));
    dispatch(setActiveRecord(null));
    dispatch(setFormMode("create"));
  }, [dispatch]);

  const handleAfterClose = useCallback(() => {
    // No-op
  }, []);

  const openCreateForm = useCallback(() => {
    dispatch(setFormMode("create"));
    dispatch(setActiveRecord(null));
    clearSubProjects();
    dispatch(setModalType("form"));
  }, [dispatch, clearSubProjects]);

  const openEditForm = useCallback(
    async (record: any) => {
      dispatch(setFormMode("edit"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;
      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects],
  );

  const openCopyForm = useCallback(
    async (record: any) => {
      dispatch(setFormMode("copy"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;
      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects],
  );

  const openDetailModal = useCallback(
    (record: any) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("detail"));
    },
    [dispatch],
  );

  const openDeleteModal = useCallback(
    (record: any) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("delete"));
    },
    [dispatch],
  );

  const handleSubmitTimesheet = useCallback(
    async (values: any) => {
      try {
        const finalValues =
          values && typeof values === "object" && !values.nativeEvent
            ? values
            : await form.validateFields();

        const payload = {
          id:
            timesheetRedux.formMode === "edit"
              ? timesheetRedux.activeRecord?.id
              : undefined,
          project_id: finalValues.project_id,
          sub_project_id: finalValues.sub_project_id,
          description: finalValues.description ?? "",
          work_hour: finalValues.work_hour,
          status: finalValues.status,
          date: finalValues.date ? finalValues.date.toDate() : undefined,
          by: admin_id,
        };

        const success = await saveTimesheet(payload);
        if (success && isMountedRef.current) {
          closeModal();
          fetchEntries(admin_id);
          fetchMonthlySummary(admin_id, selected_summary_date);
          rankBoardRef.current?.refetch();
        }
      } catch (error) {
        console.error("Form validation failed:", error);
      }
    },
    [
      form,
      saveTimesheet,
      timesheetRedux,
      closeModal,
      admin_id,
      fetchEntries,
      fetchMonthlySummary,
      selected_summary_date,
    ],
  );

  const handleDeleteTimesheet = useCallback(async () => {
    if (!timesheetRedux.activeRecord?.id || !admin_id) return;
    const success = await deleteTimesheet(
      [Number(timesheetRedux.activeRecord.id)],
      Number(admin_id),
    );
    if (success && isMountedRef.current) {
      closeModal();
      fetchEntries(admin_id);
      fetchMonthlySummary(admin_id, selected_summary_date);
      rankBoardRef.current?.refetch();
    }
  }, [
    deleteTimesheet,
    timesheetRedux.activeRecord,
    closeModal,
    admin_id,
    fetchEntries,
    fetchMonthlySummary,
    selected_summary_date,
  ]);

  const handlePageChange = useCallback(
    (page: number, size?: number) => {
      setPagination(page, size);
    },
    [setPagination],
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
              monthly_summary={monthlySummary as any}
              on_add_click={openCreateForm}
              on_guide_click={() => {
                setGuideModalOpen(true);
              }}
              on_my_work_click={() => {
                setMyWorkModalOpen(true);
              }}
            />
            <StatsGrid
              admin_id={admin_id}
              rank_board_ref={rankBoardRef}
              monthly_summary={monthlySummary as any}
              loading={loading}
              monthly_summary_loading={summaryLoading}
              monthly_stats={monthlyStats}
              selected_date={selected_summary_date}
              on_date_change={set_selected_summary_date}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <FilterSection
                projects={projects}
                projectsLoading={loading}
                onSearch={async (values) => {
                  setFilters(values);
                  await fetchEntries(admin_id);
                }}
                onReset={async () => {
                  resetFilters();
                  await fetchEntries(admin_id);
                }}
                loading={loading}
              />
              <TimesheetTable
                entries={entries}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                actionLoading={actionLoading}
                onPageChange={handlePageChange}
                onRowClick={openDetailModal}
                onEdit={openEditForm}
                onCopy={openCopyForm}
                onDeleteSingle={openDeleteModal}
                onRefresh={() => fetchEntries(admin_id)}
                onAdd={openCreateForm}
              />
            </motion.div>
          </Space>

          <CreateModalForm
            open={timesheetRedux?.modalType === "form"}
            onCancel={closeModal}
            onSubmit={handleSubmitTimesheet}
            form={form}
            projects={projects}
            subProject={subProjects}
            fetchSubProjects={(id) => fetchSubProjects(Number(id))}
            i18n={i18n}
            disabled={actionLoading}
            formMode={timesheetRedux.formMode}
            record={timesheetRedux.activeRecord}
            afterClose={handleAfterClose}
            statusOptions={useMemo(
              () =>
                STATUS_OPTIONS.map((s) => ({
                  label: (
                    <Tag
                      color={
                        s.value === "S"
                          ? "success"
                          : s.value === "P"
                            ? "processing"
                            : "default"
                      }
                    >
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
              timesheetRedux.modalType === "detail" &&
              !!timesheetRedux.activeRecord
            }
            onCancel={closeModal}
            record={timesheetRedux.activeRecord}
          />
          <DeleteConfirmationModal
            open={timesheetRedux.modalType === "delete"}
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
