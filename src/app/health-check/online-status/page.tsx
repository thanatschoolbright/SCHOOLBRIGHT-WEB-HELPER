// src/app/health-check/online-status/page.tsx

"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  DesktopOutlined,
  FilterFilled,
  GlobalOutlined,
  SyncOutlined,
  ThunderboltFilled,
  WifiOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { StatusModalComponent } from "@components/modal/status-modal-component";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { CallAPI as fetchSchoolList } from "@stores/actions/call-school-list";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Col,
  Collapse,
  Flex,
  Row,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import DeviceTable from "./_components/device-table";
import FilterSection from "./_components/filter-section";
import { useOnlineStatusStore } from "./_state/online-status-store";

dayjs.extend(relativeTime);
dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Text: AntText } = Typography;

/**
 * หน้าตรวจสอบสถานะอุปกรณ์แบบเรียลไทม์ (Online Status Dashboard)
 */
export default function OnlineDeviceDashboard() {
  const { token } = theme.useToken();
  const { isFetching, deviceList, pagination, fetchData } =
    useOnlineStatusStore();
  const dispatch = useDispatch<AppDispatch>();
  const schoolListState = useAppSelector((state) => state.callSchoolList);

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm" | "delete";
    title?: string;
    message?: string;
  }>({ open: false, type: "success", title: "", message: "" });

  useEffect(() => {
    fetchData(1, 20);

    // โหลดรายชื่อโรงเรียนเข้า Redux เพื่อให้ FilterSection ใช้งาน Dropdown ได้
    const hasSchoolData =
      Array.isArray(schoolListState.response?.data) &&
      (schoolListState.response.data as any[]).length > 0;
    if (!hasSchoolData && !schoolListState.loading) {
      void dispatch(fetchSchoolList());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // หมายเหตุ: onlineCount และ loginCount นับจากรายการในหน้าปัจจุบันเท่านั้น
  // เนื่องจาก API ยังไม่คืน aggregate total สำหรับ online/login
  const summaryStatistics = useMemo(() => ({
    totalDevices: pagination.total,
    onlineCount: deviceList.filter((d) => d.Online).length,
    loginCount: deviceList.filter((d) => d.Login).length,
  }), [deviceList, pagination.total]);

  const collapseItems = [
    {
      key: "1",
      label: (
        <Flex align="center" gap={8}>
          <FilterFilled style={{ color: token.colorPrimary }} />
          <AntText strong style={{ fontSize: 14 }}>
            ตัวกรองข้อมูลขั้นสูง
          </AntText>
        </Flex>
      ),
      children: <FilterSection deviceList={deviceList} />,
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ width: "100%", paddingBottom: 32 }}>
        <HeaderBar
          icon={<GlobalOutlined />}
          title="ตรวจสอบสถานะอุปกรณ์"
          subTitle="ติดตามสถานะการเชื่อมต่อและการใช้งานของเครื่อง POS แบบเรียลไทม์"
          extra={
            <Space direction="vertical" align="end" size={0}>
              <Tag
                icon={<SyncOutlined spin={isFetching} />}
                color={isFetching ? "processing" : "default"}
              >
                {isFetching ? "กำลังอัปเดตข้อมูล..." : "ข้อมูลล่าสุด"}
              </Tag>
              <AntText type="secondary" style={{ fontSize: 11 }}>
                อัปเดตเมื่อ: {dayjs().format("HH:mm:ss")}
              </AntText>
            </Space>
          }
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24, marginTop: 24 }}>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="อุปกรณ์ทั้งหมด"
              value={summaryStatistics.totalDevices}
              unit="เครื่อง"
              icon={<DesktopOutlined />}
              isLoading={isFetching}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="ออนไลน์พร้อมใช้งาน"
              value={summaryStatistics.onlineCount}
              unit="เครื่อง"
              icon={<WifiOutlined />}
              color={token.colorSuccess}
              isLoading={isFetching}
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryCard
              title="กำลังใช้งาน"
              value={summaryStatistics.loginCount}
              unit="เครื่อง"
              icon={<ThunderboltFilled />}
              color={token.colorPrimary}
              isLoading={isFetching}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 24 }}>
          <Collapse
            defaultActiveKey={["1"]}
            ghost
            expandIconPosition="end"
            items={collapseItems}
            destroyOnHidden={false}
            style={{
              background: token.colorBgContainer,
              borderRadius: 16,
              border: "none",
            }}
          />
        </div>

        <DeviceTable />
      </div>

      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
      />
    </DashboardLayout>
  );
}
