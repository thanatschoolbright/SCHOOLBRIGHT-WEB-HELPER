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
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = theme.useToken();
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

  const [analyticsVisible, setAnalyticsVisible] = React.useState(false);
  const [rulesVisible, setRulesVisible] = useState(true);

  useEffect(() => {
    document.title = t("overtime_page.title");
    // แสดง Modal ระเบียบการทุกครั้งที่เข้าหน้า
    setRulesVisible(true);
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
        <div className="w-full space-y-6 pb-10">
          {/* Enhanced Header with Gradient */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 shadow-2xl animate-fade-in"
            style={{
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            }}
          >
            {/* Animated background circles */}
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

          <SummaryCards
            stats={{
              health: {
                total: stats.total,
                active: stats.pending,
                closed: stats.approved,
                success_rate:
                  stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
              },
            }}
            token={token}
            title="ภาพรวมการทำงานล่วงเวลา (OT Overview)"
            icon={<TeamOutlined />}
            items={[
              {
                label: "คำขอทั้งหมด",
                value: stats.total,
                percent: 100,
                color: token.colorPrimary,
                bg: token.colorPrimaryBg,
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
                value: stats.pending,
                percent:
                  stats.total > 0 ? (stats.pending / stats.total) * 100 : 0,
                color: token.colorWarning,
                bg: token.colorWarningBg,
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
                value: stats.approved,
                percent:
                  stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
                color: token.colorSuccess,
                bg: token.colorSuccessBg,
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
                  stats.total > 0
                    ? Number(((stats.approved / stats.total) * 100).toFixed(1))
                    : 0,
                percent:
                  stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
                color: token.colorInfo,
                bg: token.colorInfoBg,
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
            loading={loading && !dataSource.length}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <ActionBar
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                setProcessedItems={setProcessedItems}
                batchProcessing={batchProcessing}
                setVisible={setVisible}
                setBatchStatusModalVisible={setBatchStatusModalVisible}
                batchSendEmail={batchSendEmail}
                router={router}
                setAnalyticsVisible={setAnalyticsVisible}
                setRulesVisible={setRulesVisible}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <FilterBar
                searchText={searchText}
                setSearchText={setSearchText}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                loading={loading}
                paginationState={paginationState}
                handleTableChange={handleTableChange}
                fetchOvertimeList={fetchOvertimeList}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
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
            </Col>
          </Row>

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

          <AnalyticsModal
            visible={analyticsVisible}
            setVisible={setAnalyticsVisible}
            dataSource={dataSource}
          />

          <RulesModal
            visible={rulesVisible}
            onClose={() => setRulesVisible(false)}
          />
        </div>
      </ConfigProvider>
    </DashboardLayout>
  );
}
