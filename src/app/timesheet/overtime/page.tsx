"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfigProvider } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useOvertimeData } from "./hooks/overtime.data";
import { SummaryCards } from "./components/summary-cards.component";
import { FilterBar } from "./components/filter-bar.component";
import { OvertimeTable } from "./components/overtime-table.component";
import { CreateModal } from "./components/create-modal.component";
import { DetailModal } from "./components/detail-modal.component";
import { BatchStatusModal } from "./components/batch-status-modal.component";

export default function OvertimeManagementPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    loading,
    dataSource,
    paginationState,
    stats,
    visible,
    setVisible,
    detailVisible,
    setDetailVisible,
    selectedDetail,
    selectedRowKeys,
    setSelectedRowKeys,
    batchProcessing,
    processedItems,
    setProcessedItems,
    batchStatusModalVisible,
    setBatchStatusModalVisible,
    batchSelectedStatus,
    setBatchSelectedStatus,
    searchText,
    setSearchText,
    selectedMonth,
    setSelectedMonth,
    userOptions,
    descriptionOptions,
    fetchOvertimeList,
    handleFormSubmit,
    handleTableChange,
    deleteOvertime,
    approveOvertime,
    sendEmailToHR,
    batchApproveOvertime,
    batchSendEmail,
    fetchOvertimeDetail,
  } = useOvertimeData();

  useEffect(() => {
    document.title = t("overtime_page.title");
  }, [t]);

  return (
    <DashboardLayout>
      <ConfigProvider
        theme={{
          components: {
            Table: { borderRadiusLG: 12 },
            Card: { borderRadiusLG: 16 },
          },
        }}
      >
        <div className="w-full space-y-6 animate-fade-in pb-10">
          <HeaderBar
            icon={<TeamOutlined />}
            title={t("overtime_page.title")}
            subTitle={t("overtime_page.subtitle")}
            color="none"
          />

          <SummaryCards stats={stats} loading={loading && !dataSource.length} />

          <FilterBar
            searchText={searchText}
            setSearchText={setSearchText}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            setProcessedItems={setProcessedItems}
            loading={loading}
            batchProcessing={batchProcessing}
            paginationState={paginationState}
            handleTableChange={handleTableChange}
            fetchOvertimeList={fetchOvertimeList}
            setVisible={setVisible}
            setBatchStatusModalVisible={setBatchStatusModalVisible}
            batchSendEmail={batchSendEmail}
            router={router}
          />

          <OvertimeTable
            dataSource={dataSource}
            columns={[]}
            loading={loading}
            paginationState={paginationState}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            setProcessedItems={setProcessedItems}
            batchProcessing={batchProcessing}
            processedItems={processedItems}
            handleTableChange={handleTableChange}
            deleteOvertime={deleteOvertime}
            approveOvertime={approveOvertime}
            sendEmailToHR={sendEmailToHR}
            fetchOvertimeDetail={fetchOvertimeDetail}
            setDetailVisible={setDetailVisible}
            router={router}
          />

          <CreateModal
            visible={visible}
            setVisible={setVisible}
            userOptions={userOptions}
            descriptionOptions={descriptionOptions}
            handleFormSubmit={handleFormSubmit}
            loading={loading}
          />

          <BatchStatusModal
            visible={batchStatusModalVisible}
            setVisible={setBatchStatusModalVisible}
            selectedRowKeys={selectedRowKeys}
            batchSelectedStatus={batchSelectedStatus}
            setBatchSelectedStatus={setBatchSelectedStatus}
            batchApproveOvertime={batchApproveOvertime}
            batchProcessing={batchProcessing}
          />

          <DetailModal
            visible={detailVisible}
            setVisible={setDetailVisible}
            selectedDetail={selectedDetail}
          />
        </div>
      </ConfigProvider>
    </DashboardLayout>
  );
}
