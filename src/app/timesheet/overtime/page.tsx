"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfigProvider, Row, Col, theme } from "antd";
import {
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import SummaryCards from "@components/card/summary-card/summary-card-component";
import { useOvertimeData } from "./hooks/overtime.data";
import { FilterBar } from "./components/filter-bar.component";
import { ActionBar } from "./components/action-bar.component";
import { OvertimeTable } from "./components/overtime-table.component";
import { CreateModal } from "./components/create-modal.component";
import { DetailModal } from "./components/detail-modal.component";
import { BatchStatusModal } from "./components/batch-status-modal.component";
import { AnalyticsModal } from "./components/analytics-modal.component";
import { RulesModal } from "./components/rules-modal.component";

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
        theme={{
          components: {
            Table: { borderRadiusLG: 12 },
            Card: { borderRadiusLG: 16 },
          },
        }}
      >
        <div className="w-full space-y-6 pb-10">
          {/* ส่วนที่ 1: ส่วนหัวของหน้าจอ พร้อมเอฟเฟกต์ Gradient และพื้นหลังเคลื่อนไหว */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 shadow-2xl animate-fade-in"
            style={{
              background:
                "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%)",
            }}
          >
            {/* วงกลมพื้นหลังเพื่อความสวยงาม */}
            <div
              className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse"
              style={{ transform: "translate(30%, -30%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl animate-pulse"
              style={{
                transform: "translate(-30%, 30%)",
                animationDelay: "1s",
              }}
            />

            <div className="relative z-10 flex items-center gap-4">
              <div className="p-4 rounded-2xl shadow-lg bg-white/20 backdrop-blur-sm">
                <TeamOutlined style={{ fontSize: 40, color: "#fff" }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                  ระบบจัดการการทำงานล่วงเวลา (OT)
                </h1>
                <p className="text-white/90 text-lg">
                  บันทึก ติดตาม และอนุมัติการทำงานนอกเวลาอย่างมีประสิทธิภาพ
                </p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    อนุมัติรวดเร็ว
                  </div>
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    รายงานครบถ้วน
                  </div>
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    แจ้งเตือนอัตโนมัติ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: การ์ดสรุปข้อมูลสถิติ (Statistics Cards) */}
          <SummaryCards
            stats={{
              health: {
                total: overtimeStatistics.total,
                active: overtimeStatistics.pending,
                closed: overtimeStatistics.approved,
                success_rate:
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.approved / overtimeStatistics.total) *
                      100
                    : 0,
              },
            }}
            token={themeToken}
            title="ภาพรวมการทำงานล่วงเวลา (OT Overview)"
            icon={<TeamOutlined />}
            items={[
              {
                label: "คำขอทั้งหมด",
                value: overtimeStatistics.total,
                percent: 100,
                color: themeToken.colorPrimary,
                bg: themeToken.colorPrimaryBg,
                icon: <FileTextOutlined />,
                suffix: "รายการ",
                tooltip: (
                  <div style={{ padding: "4px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      คำขอทั้งหมด
                    </div>
                    <div>ยอดรวมคำขอทำงานล่วงเวลาทั้งหมดที่บันทึกในระบบ</div>
                  </div>
                ),
              },
              {
                label: "รอการพิจารณา",
                value: overtimeStatistics.pending,
                percent:
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.pending / overtimeStatistics.total) *
                      100
                    : 0,
                color: themeToken.colorWarning,
                bg: themeToken.colorWarningBg,
                icon: <ClockCircleOutlined />,
                suffix: "รายการ",
                tooltip: (
                  <div style={{ padding: "4px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      รอการพิจารณา
                    </div>
                    <div>คำขอที่กำลังรอหัวหน้างานตรวจสอบและอนุมัติ</div>
                  </div>
                ),
              },
              {
                label: "อนุมัติแล้ว",
                value: overtimeStatistics.approved,
                percent:
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.approved / overtimeStatistics.total) *
                      100
                    : 0,
                color: themeToken.colorSuccess,
                bg: themeToken.colorSuccessBg,
                icon: <CheckCircleOutlined />,
                suffix: "รายการ",
                tooltip: (
                  <div style={{ padding: "4px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      อนุมัติแล้ว
                    </div>
                    <div>คำขอที่ผ่านการอนุมัติเรียบร้อยแล้ว</div>
                  </div>
                ),
              },
              {
                label: "อัตราการอนุมัติ",
                value:
                  overtimeStatistics.total > 0
                    ? Number(
                        (
                          (overtimeStatistics.approved /
                            overtimeStatistics.total) *
                          100
                        ).toFixed(1),
                      )
                    : 0,
                percent:
                  overtimeStatistics.total > 0
                    ? (overtimeStatistics.approved / overtimeStatistics.total) *
                      100
                    : 0,
                color: themeToken.colorInfo,
                bg: themeToken.colorInfoBg,
                icon: <CheckCircleOutlined />,
                suffix: "%",
                tooltip: (
                  <div style={{ padding: "4px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      อัตราการอนุมัติ
                    </div>
                    <div>เปอร์เซ็นต์ของคำขอที่ได้รับการอนุมัติ</div>
                  </div>
                ),
              },
            ]}
            loading={isLoadingOvertimeData && !overtimeDataSource.length}
          />

          {/* ส่วนที่ 3: แถบเครื่องมือจัดการหลัก (Action Bar) */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <ActionBar
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                setProcessedItems={setProcessedRecordItems}
                batchProcessing={isBatchProcessing}
                setVisible={setIsCreateModalVisible}
                setBatchStatusModalVisible={setIsBatchStatusModalVisible}
                batchSendEmail={batchSendOvertimeEmail}
                router={navigationRouter}
                setAnalyticsVisible={setIsAnalyticsModalVisible}
                setRulesVisible={setIsRulesModalVisible}
              />
            </Col>
          </Row>

          {/* ส่วนที่ 4: แถบตัวกรองข้อมูล (Filter Bar) */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <FilterBar
                searchText={filterSearchText}
                setSearchText={setFilterSearchText}
                selectedMonth={filterSelectedMonth}
                setSelectedMonth={setFilterSelectedMonth}
                loading={isLoadingOvertimeData}
                paginationState={paginationState}
                handleTableChange={onTableChange}
                fetchOvertimeList={fetchOvertimeRequestList}
              />
            </Col>
          </Row>

          {/* ส่วนที่ 5: ตารางแสดงรายการข้อมูลหลัก (Main Data Table) */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
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
              />
            </Col>
          </Row>

          {/* ส่วนที่ 6: มอดัลสำหรับสร้างรายการใหม่ (Create Modal) */}
          <CreateModal
            visible={isCreateModalVisible}
            setVisible={setIsCreateModalVisible}
            userOptions={userSelectionOptions}
            descriptionOptions={descriptionSelectionOptions}
            handleFormSubmit={onFormSubmit}
            loading={isLoadingOvertimeData}
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

          {/* ส่วนที่ 10: มอดัลสำหรับแสดงระเบียบการ (Rules Modal) */}
          <RulesModal
            visible={isRulesModalVisible}
            onClose={() => setIsRulesModalVisible(false)}
          />
        </div>
      </ConfigProvider>
    </DashboardLayout>
  );
}
