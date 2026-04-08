"use client";

import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  FileExcelOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Button, Flex, Modal, Result, Steps, Typography, theme } from "antd";
import React, { useEffect, useMemo } from "react";
import { useServerStatusStore } from "../_state/server-status-store";

const { Text } = Typography;

// คอมโพเนนต์ Modal สำหรับแสดงสถานะการส่งออกรายงาน Excel แบบ step-by-step
export const ExportModal: React.FC = () => {
  const { token } = theme.useToken();
  const {
    isExportModalOpen,
    isExporting,
    exportStep,
    isExportSuccess,
    serverHealthData,
    searchQuery,
    statusFilter,
    groupFilter,
    methodFilter,
    closeExportModal,
    setExportSuccess,
    exportExcel,
  } = useServerStatusStore();

  useEffect(() => {
    if (!isExportModalOpen) {
      setTimeout(() => setExportSuccess(false), 300);
    }
  }, [isExportModalOpen, setExportSuccess]);

  // คำนวณ filtered data ตรงนี้เพื่อส่งให้ exportExcel
  const filteredData = useMemo(() => {
    return serverHealthData.filter((item) => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchSearch =
        item.name_th.toLowerCase().includes(lowerQuery) ||
        item.service.toLowerCase().includes(lowerQuery) ||
        item.module.toLowerCase().includes(lowerQuery);
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ONLINE" && ["200", "404"].includes(item.status)) ||
        (statusFilter === "ERROR" && !["200", "404"].includes(item.status));
      const matchGroup = groupFilter === "ALL" || item.group === groupFilter;
      const matchMethod =
        methodFilter === "ALL" ||
        (item.request?.method || "GET") === methodFilter;
      return matchSearch && matchStatus && matchGroup && matchMethod;
    });
  }, [serverHealthData, searchQuery, statusFilter, groupFilter, methodFilter]);

  const renderContent = () => {
    if (isExportSuccess) {
      return (
        <Result
          status="success"
          title={
            <Text strong style={{ fontSize: 22, fontWeight: 600 }}>
              ดาวน์โหลดสำเร็จ
            </Text>
          }
          subTitle="ระบบส่งไฟล์รายงานสถานะเซิร์ฟเวอร์ให้เรียบร้อยแล้ว"
          extra={
            <Button
              type="primary"
              onClick={closeExportModal}
              style={{ fontWeight: 600 }}
            >
              ตกลง
            </Button>
          }
        />
      );
    }

    if (isExporting || exportStep > 0) {
      return (
        <Flex style={{ padding: "20px 0" }}>
          <Steps
            direction="vertical"
            current={exportStep - 1}
            items={[
              {
                title: "รวบรวมข้อมูลสถานะ",
                description: "กำลังเตรียมข้อมูลจากแดชบอร์ดล่าสุด...",
                icon:
                  exportStep === 1 ? <LoadingOutlined /> : <DatabaseOutlined />,
              },
              {
                title: "ประมวลผลรายงาน",
                description: "จัดรูปแบบไฟล์ Excel...",
                icon:
                  exportStep === 2 ? (
                    <LoadingOutlined />
                  ) : (
                    <FileExcelOutlined />
                  ),
              },
              {
                title: "ดาวน์โหลดไฟล์",
                description: "กำลังส่งไฟล์ไปยังอุปกรณ์...",
                icon:
                  exportStep === 3 ? (
                    <LoadingOutlined />
                  ) : (
                    <CloudDownloadOutlined />
                  ),
              },
              {
                title: "เสร็จสมบูรณ์",
                description: "พร้อมสำหรับการตรวจสอบ",
                icon: <CheckCircleOutlined />,
              },
            ]}
          />
        </Flex>
      );
    }

    return (
      <Flex vertical align="center" gap={12} style={{ padding: "24px 0" }}>
        <FileExcelOutlined style={{ fontSize: 48, color: "#1677ff" }} />
        <Text type="secondary" style={{ textAlign: "center" }}>
          ต้องการส่งออกรายงานสถานะ API ทั้งหมด {filteredData.length} รายการ
          ใช่หรือไม่?
        </Text>
      </Flex>
    );
  };

  return (
    <Modal
      title={
        !isExportSuccess && (
          <Flex align="center" gap={10}>
            <Flex
              align="center"
              justify="center"
              style={{ background: token.colorPrimary, borderRadius: 8, padding: 8 }}
            >
              <FileExcelOutlined style={{ color: "#fff" }} />
            </Flex>
            <Text strong style={{ fontSize: 16, fontWeight: 600 }}>
              ส่งออกรายงานสถานะเซิร์ฟเวอร์
            </Text>
          </Flex>
        )
      }
      open={isExportModalOpen}
      onOk={() => exportExcel(filteredData)}
      onCancel={() => !isExporting && closeExportModal()}
      confirmLoading={isExporting}
      okText="เริ่มการส่งออก"
      cancelText="ยกเลิก"
      okButtonProps={{
        style: {
          display: isExporting || isExportSuccess ? "none" : "inline-block",
          fontWeight: 600,
        },
        disabled: filteredData.length === 0,
      }}
      cancelButtonProps={{
        style: {
          display: isExporting || isExportSuccess ? "none" : "inline-block",
        },
      }}
      footer={isExporting || isExportSuccess ? null : undefined}
      width={480}
      centered
    >
      {renderContent()}
    </Modal>
  );
};
