"use client";

import { useMemo, useRef } from "react";
import { Card, Form } from "antd";
import { RocketOutlined } from "@ant-design/icons";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { useDispatch } from "react-redux";

import { HeaderBar } from "@/components/typhography/header-bar-component";

dayjs.extend(isBetween);

export default function Page() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();

  //** ดึงข้อมูล Admin ID จาก Redux Store */
  const authState = useAppSelector((state) => state.callAdminLogin);

  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        {/* หัวข้อ */}
        <HeaderBar
          icon={<RocketOutlined />}
          title="ตรวจสอบการเข้าชั้นเรียน"
          subTitle="รายละเอียดการเข้าชั้นเรียน"
          color="orange"
        />
      </DashboardLayout>

      {/* ส่วนของการฟิลเตอร์ */}
      <Card style={{ margin: 16 }} title="ฟิลเตอร์การค้นหา">
        <Form form={form} layout="vertical">
          {/* ฟิลด์ฟอร์มต่างๆ สำหรับฟิลเตอร์การค้นหา */}
        </Form>
      </Card>
      
    </PermissionLayout>
  );
}
