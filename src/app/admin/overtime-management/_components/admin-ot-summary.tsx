"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Col, Row } from "antd";
import React, { useMemo } from "react";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

/**
 * บัตรสรุปสถิติ OT สำหรับผู้ดูแลระบบ — คำนวณจาก dataSource ที่โหลดมา
 */
const AdminOtSummary: React.FC = () => {
  const { dataSource, isLoading, totalRecords } = useAdminOvertimeStore();

  const stats = useMemo(() => {
    const pending = dataSource.filter((r) => r.status === "pending").length;
    const approved = dataSource.filter((r) => r.status === "approved").length;
    const rejected = dataSource.filter((r) => r.status === "rejected").length;
    const paid = dataSource.filter((r) => r.status === "paid").length;

    // คำนวณชั่วโมง OT รวมที่อนุมัติแล้ว
    const approvedHours = dataSource
      .filter((r) => r.status === "approved" || r.status === "paid")
      .reduce((sum, r) => {
        const hrs = (r.descriptions || []).reduce(
          (s: number, d: any) => s + (Number(d.duration) || 0),
          0,
        );
        return sum + hrs;
      }, 0);

    // นับจำนวนพนักงานที่ไม่ซ้ำกัน
    const uniqueUsers = new Set(
      dataSource.map((r) => r.requester_id).filter(Boolean),
    ).size;

    return { pending, approved, rejected, paid, approvedHours, uniqueUsers };
  }, [dataSource]);

  return (
    <Row gutter={[16, 16]}>
      {/* Row 1 — สถานะคำขอ */}
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="คำขอทั้งหมด"
          value={totalRecords}
          icon={<FileTextOutlined />}
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="รออนุมัติ"
          value={stats.pending}
          icon={<ClockCircleOutlined />}
          isLoading={isLoading}
          color={stats.pending > 0 ? "warning" : undefined}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="อนุมัติแล้ว"
          value={stats.approved}
          icon={<CheckCircleOutlined />}
          isLoading={isLoading}
          color="success"
        />
      </Col>

      {/* Row 2 — ข้อมูลเพิ่มเติม */}
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="ปฏิเสธ"
          value={stats.rejected}
          icon={<CloseCircleOutlined />}
          isLoading={isLoading}
          color={stats.rejected > 0 ? "error" : undefined}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="ชั่วโมง OT รวม"
          value={`${stats.approvedHours.toFixed(1)} ชม.`}
          icon={<DollarOutlined />}
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <SummaryCard
          title="พนักงานที่ขอ OT"
          value={`${stats.uniqueUsers} คน`}
          icon={<TeamOutlined />}
          isLoading={isLoading}
        />
      </Col>
    </Row>
  );
};

export default AdminOtSummary;
