"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { AreaChartOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { Card, theme } from "antd";
import FilterSection from "./_components/filter-section";
import SummarySection from "./_components/summary-section";
import TimelineChart from "./_components/timeline-chart";

export default function Page() {
  const { token } = theme.useToken();

  return (
    <DashboardLayout>
      <PermissionLayout permissions={["ADMIN_TIMESHEET_VIEW"]}>
        <HeaderBar
          title="รายงานภาพรวมโครงการ (Project Timeline)"
          subTitle="แสดงรายละเอียดความคืบหน้าโครงการและโครงการย่อยในรูปแบบ Gantt Chart"
          icon={<AreaChartOutlined />}
        />

        <div style={{ padding: 16 }}>
          <Card
            styles={{ body: { padding: 16 } }}
            style={{
              marginBottom: 24,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <FilterSection />
          </Card>

          <SummarySection />

          <TimelineChart />
        </div>
      </PermissionLayout>
    </DashboardLayout>
  );
}
