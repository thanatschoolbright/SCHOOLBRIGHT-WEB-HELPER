"use client";

import { Card, Skeleton, Space } from "antd";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { Filters } from "./components/filters.component";
import { HeaderSection } from "./components/header.component";
import { SummaryCards } from "./components/summary-cards.component";
import { UsersTable } from "./components/users-table.component";
import { CreateUserModal } from "./components/create-user-modal.component";
import { EditUserModal } from "./components/edit-user-modal.component";
import { DeleteUserModal } from "./components/delete-user-modal.component";
import { EmptyState } from "./components/empty-state.component";
import { useUserProfileData } from "./hooks/user-profile.data";

export default function Page() {
  const { t: TRANSLATION } = useTranslation("translate");
  const {
    loading,
    filteredUsers,
    positions,
    filters,
    summaryMetrics,
    modalState,
    selectedUser,
    confirmDeleteText,
    searchTerm,
    pageSize,
    hasError,
    handleSearchChange,
    handlePositionChange,
    handleDateRangeChange,
    handleResetFilters,
    handlePageSizeChange,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
    submitCreateUser,
    submitUpdateUser,
    submitDeleteUser,
    setConfirmDeleteText,
    refreshData,
    handleCopyUser,
  } = useUserProfileData(TRANSLATION);

  const deleteKeyword = TRANSLATION("user_profile_page.delete_keyword");

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <div className="space-y-4">
          {/* Header Section */}
          <HeaderSection
            title={TRANSLATION("user_profile_page.title")}
            subtitle={TRANSLATION("user_profile_page.subtitle")}
            refreshLabel={TRANSLATION("user_profile_page.refresh")}
            onRefresh={refreshData}
          />

          {/* Summary Cards */}
          <SummaryCards metrics={summaryMetrics} />

          {/* Filters */}
          <Filters
            title={TRANSLATION("user_profile_page.filter_title")}
            searchPlaceholder={TRANSLATION(
              "user_profile_page.search_placeholder"
            )}
            positionPlaceholder={TRANSLATION(
              "user_profile_page.position_placeholder"
            )}
            dateRangeLabel={TRANSLATION("user_profile_page.date_range_label")}
            resetLabel={TRANSLATION("user_profile_page.reset_filters")}
            filters={filters}
            positions={positions}
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            onPositionChange={handlePositionChange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetFilters}
          />

          {/* Table Section */}
          <Card
            title={
              <Space className="justify-between">
                {TRANSLATION("user_profile_page.table_title")}
                <span className="text-sm text-slate-500">
                  {TRANSLATION("user_profile_page.total_records", {
                    total: filteredUsers.length,
                  })}
                </span>
              </Space>
            }
            className="border-none shadow-sm"
            extra={
              <Space>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  {TRANSLATION("user_profile_page.add_user")}
                </button>
              </Space>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                title={
                  hasError
                    ? TRANSLATION("user_profile_page.error_title")
                    : TRANSLATION("user_profile_page.empty_title")
                }
                description={
                  hasError
                    ? TRANSLATION("user_profile_page.error_description")
                    : TRANSLATION("user_profile_page.empty_description")
                }
                actionLabel={TRANSLATION("user_profile_page.refresh")}
                onAction={refreshData}
              />
            ) : (
              <UsersTable
                data={filteredUsers}
                loading={loading}
                pageSize={pageSize}
                titles={{
                  index: TRANSLATION("user_profile_page.table_index"),
                  email: TRANSLATION("user_profile_page.table_email"),
                  fullname: TRANSLATION("user_profile_page.table_fullname"),
                  nickname: TRANSLATION("user_profile_page.table_nickname"),
                  position: TRANSLATION("user_profile_page.table_position"),
                  phone: TRANSLATION("user_profile_page.table_phone"),
                  actions: TRANSLATION("user_profile_page.table_actions"),
                  employeeCode: TRANSLATION(
                    "user_profile_page.table_employee_code"
                  ),
                  empty: TRANSLATION("user_profile_page.empty_description"),
                  edit: TRANSLATION("user_profile_page.edit_action"),
                  delete: TRANSLATION("user_profile_page.delete_action"),
                  copy: TRANSLATION("user_profile_page.copy_action"),
                }}
                onPageSizeChange={handlePageSizeChange}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onCopy={handleCopyUser}
              />
            )}
          </Card>

          {/* Modal Section */}
          <CreateUserModal
            open={modalState.type === "create"}
            translation={TRANSLATION}
            onCancel={closeModal}
            onSubmit={submitCreateUser}
          />
          <EditUserModal
            open={modalState.type === "edit"}
            translation={TRANSLATION}
            positions={positions}
            user={selectedUser}
            onCancel={closeModal}
            onSubmit={submitUpdateUser}
          />
          <DeleteUserModal
            open={modalState.type === "delete"}
            translation={TRANSLATION}
            confirmText={confirmDeleteText}
            keyword={deleteKeyword}
            onCancel={closeModal}
            onConfirm={submitDeleteUser}
            onConfirmTextChange={setConfirmDeleteText}
          />
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
