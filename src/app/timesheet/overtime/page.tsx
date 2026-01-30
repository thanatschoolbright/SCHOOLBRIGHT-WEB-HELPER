"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigProvider, Row, Col, theme, Space, Button } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

import {
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";
import { useOvertimeData } from "./hooks/overtime.data";
import { FilterBar } from "./components/filter-bar.component";
import { ActionBar } from "./components/action-bar.component";
import { OvertimeTable } from "./components/overtime-table.component";
import { CreateModal } from "./components/create-modal.component";
import { DetailModal } from "./components/detail-modal.component";
import { BatchStatusModal } from "./components/batch-status-modal.component";
import { AnalyticsModal } from "./components/analytics-modal.component";
import { RulesModal } from "./components/rules-modal.component";
import { ExportModal } from "./components/export-modal.component";

export default function OvertimeManagementPage() {
  const navigationRouter = useRouter();
  const { t: translate } = useTranslation();
  const { token: themeToken } = theme.useToken();
  const {
    loading: isLoadingOvertimeData,
    dataSource: overtimeDataSource,
    paginationState,
    stats: overtimeStatistics,
    visible: isCreateModalVisible,
    setVisible: setIsCreateModalVisible,
    detailVisible: isDetailModalVisible,
    setDetailVisible: setIsDetailModalVisible,
    selectedDetail: selectedOvertimeDetail,
    selectedRowKeys,
    setSelectedRowKeys,
    batchProcessing: isBatchProcessing,
    processedItems: processedRecordItems,
    setProcessedItems: setProcessedRecordItems,
    batchStatusModalVisible: isBatchStatusModalVisible,
    setBatchStatusModalVisible: setIsBatchStatusModalVisible,
    batchSelectedStatus: selectedBatchStatus,
    setBatchSelectedStatus: setSelectedBatchStatus,
    searchText: filterSearchText,
    setSearchText: setFilterSearchText,
    selectedMonth: filterSelectedMonth,
    setSelectedMonth: setFilterSelectedMonth,
    userOptions: userSelectionOptions,
    descriptionOptions: descriptionSelectionOptions,
    fetchOvertimeList: fetchOvertimeRequestList,
    handleFormSubmit: onFormSubmit,
    handleTableChange: onTableChange,
    deleteOvertime: deleteOvertimeRecord,
    approveOvertime: approveOvertimeRecord,
    sendEmailToHR: sendEmailToHRDepartment,
    batchApproveOvertime: batchApproveOvertimeRecords,
    batchSendEmail: batchSendOvertimeEmail,
    fetchOvertimeDetail: fetchOvertimeRequestDetail,
    exportOvertime: exportOvertimeData,
    exportVisible: isExportModalVisible,
    setExportVisible: setIsExportModalVisible,
    exportStep,
    isExportSuccess,
    setIsExportSuccess,
    form: overtimeForm,
  } = useOvertimeData();

  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] =
    React.useState(false);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(true);

  useEffect(() => {
    document.title = translate("overtime_page.title");
    setIsRulesModalVisible(true);
  }, [translate]);

  return (
    <DashboardLayout>
      <ConfigProvider
        locale={thTH}
        theme={{
          components: {
            Table: { borderRadiusLG: 12 },
            Card: { borderRadiusLG: 16 },
          },
        }}
      >
        <div className="w-full space-y-6 pb-10">
          {/* ส่วนที่ 1: หัวข้อหน้าจอระดับ Enterprise */}
          <HeaderBar
            icon={<TeamOutlined />}
            title="ระบบจัดการการทำงานล่วงเวลา (OT)"
            subTitle="บันทึก ติดตาม และอนุมัติการทำงานนอกเวลาอย่างมีประสิทธิภาพ"
            showBackButton={true}
            extra={
              <Space>
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => setIsRulesModalVisible(true)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  ระเบียบการขอ OT
                </Button>
                <Button
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  สร้างคำขอ OT
                </Button>
              </Space>
            }
          />

          {/* ส่วนที่ 2: การ์ดสรุปข้อมูลสถิติ (Statistics Cards) */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="คำขอทั้งหมด"
                value={overtimeStatistics.total}
                subtitle="ยอดรวมคำขอทั้งหมดในระบบ"
                icon={<FileTextOutlined />}
                suffix="รายการ"
                color={themeToken.colorPrimary}
                percent={100}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="รอการพิจารณา"
                value={overtimeStatistics.pending}
                subtitle="รอหัวหน้างานตรวจสอบ"
                icon={<ClockCircleOutlined />}
                color={themeToken.colorWarning}
                iconBg={themeToken.colorWarningBg}
                percent={
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.pending / overtimeStatistics.total) *
                      100
                    : 0
                }
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="อนุมัติแล้ว"
                value={overtimeStatistics.approved}
                subtitle="ผ่านการพิจารณาแล้ว"
                icon={<CheckCircleOutlined />}
                color={themeToken.colorSuccess}
                iconBg={themeToken.colorSuccessBg}
                percent={
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.approved / overtimeStatistics.total) *
                      100
                    : 0
                }
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="อัตราการอนุมัติ"
                value={
                  overtimeStatistics.total > 0
                    ? Number(
                        (
                          (overtimeStatistics.approved /
                            overtimeStatistics.total) *
                          100
                        ).toFixed(1),
                      )
                    : 0
                }
                subtitle="เปอร์เซ็นต์การอนุมัติ"
                icon={<CheckCircleOutlined />}
                suffix="%"
                color={themeToken.colorInfo}
                percent={
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.approved / overtimeStatistics.total) *
                      100
                    : 0
                }
              />
            </Col>
          </Row>

          {/* ส่วนที่ 3: แถบตัวกรองและจัดการข้อมูล (Filter & Action Bar) */}
          <FilterBar
            filterSearchText={filterSearchText}
            setFilterSearchText={setFilterSearchText}
            filterSelectedMonth={filterSelectedMonth}
            setFilterSelectedMonth={setFilterSelectedMonth}
            isLoading={isLoadingOvertimeData}
            paginationState={paginationState}
            onTableChange={onTableChange}
            fetchOvertimeRequestList={fetchOvertimeRequestList}
          />

          {/* ส่วนที่ 4: แถบเครื่องมือจัดการหลักสำหรับการเลือกหลายรายการ (Action Bar) */}
          {selectedRowKeys.length > 0 && (
            <ActionBar
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              setProcessedRecordItems={setProcessedRecordItems}
              isBatchProcessing={isBatchProcessing}
              setIsCreateModalVisible={setIsCreateModalVisible}
              setIsBatchStatusModalVisible={setIsBatchStatusModalVisible}
              batchSendOvertimeEmail={batchSendOvertimeEmail}
              navigationRouter={navigationRouter}
              setIsAnalyticsModalVisible={setIsAnalyticsModalVisible}
              setIsRulesModalVisible={setIsRulesModalVisible}
            />
          )}

          {/* ส่วนที่ 5: ตารางแสดงรายการข้อมูลหลัก (Main Data Table) */}
          <OvertimeTable
            dataSource={overtimeDataSource}
            isLoading={isLoadingOvertimeData}
            paginationState={paginationState}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            setProcessedRecordItems={setProcessedRecordItems}
            isBatchProcessing={isBatchProcessing}
            processedRecordItems={processedRecordItems}
            onTableChange={onTableChange}
            deleteOvertimeRecord={deleteOvertimeRecord}
            approveOvertimeRecord={approveOvertimeRecord}
            sendEmailToHRDepartment={sendEmailToHRDepartment}
            fetchOvertimeRequestDetail={fetchOvertimeRequestDetail}
            setIsDetailModalVisible={setIsDetailModalVisible}
            navigationRouter={navigationRouter}
            onExport={() => setIsExportModalVisible(true)}
          />

          {/* ส่วนที่ 6: มอดัลสำหรับสร้างรายการใหม่ (Create Modal) */}
          <CreateModal
            visible={isCreateModalVisible}
            setVisible={setIsCreateModalVisible}
            userOptions={userSelectionOptions}
            descriptionOptions={descriptionSelectionOptions}
            handleFormSubmit={onFormSubmit}
            loading={isLoadingOvertimeData}
            form={overtimeForm}
          />

          {/* ส่วนที่ 7: มอดัลสำหรับจัดการสถานะแบบกลุ่ม (Batch Status Modal) */}
          <BatchStatusModal
            visible={isBatchStatusModalVisible}
            setVisible={setIsBatchStatusModalVisible}
            selectedRowKeys={selectedRowKeys}
            batchSelectedStatus={selectedBatchStatus}
            setBatchSelectedStatus={setSelectedBatchStatus}
            batchApproveOvertime={batchApproveOvertimeRecords}
            batchProcessing={isBatchProcessing}
          />

          {/* ส่วนที่ 8: มอดัลสำหรับแสดงรายละเอียดคิว (Detail Modal) */}
          <DetailModal
            visible={isDetailModalVisible}
            setVisible={setIsDetailModalVisible}
            selectedDetail={selectedOvertimeDetail}
          />

          {/* ส่วนที่ 9: มอดัลสำหรับแสดงการวิเคราะห์ข้อมูล (Analytics Modal) */}
          <AnalyticsModal
            visible={isAnalyticsModalVisible}
            setVisible={setIsAnalyticsModalVisible}
            dataSource={overtimeDataSource}
          />

          <RulesModal
            visible={isRulesModalVisible}
            onClose={() => setIsRulesModalVisible(false)}
          />

          {/* ส่วนที่ 11: มอดัลสำหรับเลือกเดือนสส่งออก (Export Modal) */}
          <ExportModal
            visible={isExportModalVisible}
            setVisible={setIsExportModalVisible}
            onExport={exportOvertimeData}
            loading={isLoadingOvertimeData}
            exportStep={exportStep}
            isExportSuccess={isExportSuccess}
            setIsExportSuccess={setIsExportSuccess}
          />
        </div>
      </ConfigProvider>
    </DashboardLayout>
  );
}
