"use client";

import React from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import RoleForm from "@/components/admin/permission/role-form";

/**
 * * Page: Create Role
 * UI for creating a new RBAC Role with detailed permission matrix.
 */
export default function CreateRolePage() {
  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<SafetyCertificateOutlined />}
          title="สร้างบทบาทใหม่"
          subTitle="กำหนดชื่อและสิทธิ์การเข้าถึงสำหรับกลุ่มผู้ใช้งาน"
        />

        <div className="p-6">
          <RoleForm mode="create" />
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
