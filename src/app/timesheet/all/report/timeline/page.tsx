"use client";

//* แสดงสรุปชั่วโมง Timesheet รายบุคคลในช่วงวันที่เลือก

import PermissionLayout from "@/components/layouts/permission-layout";
import {
  AreaChartOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  DatePicker,
} from "antd";

const { RangePicker } = DatePicker;




export default function Page() {


  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          title="Timesheet - Summary"
          subTitle="สรุปชั่วโมงการทำงาน"
          icon={<AreaChartOutlined />}
          color="none"
        />

      </DashboardLayout>
    </PermissionLayout>
  );
}
