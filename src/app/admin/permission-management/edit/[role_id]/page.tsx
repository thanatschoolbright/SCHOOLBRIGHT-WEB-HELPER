"use client";

import React from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { EditOutlined } from "@ant-design/icons";
import RoleForm from "@/components/admin/permission/role-form";
import { useParams } from "next/navigation";

/**
 * * Page: Edit Role
 * UI for editing an existing role's name and its permission matrix.
 */
export default function EditRolePage() {
  const params = useParams();
  const roleId = params.role_id ? Number(params.role_id) : undefined;

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<EditOutlined />}
          title="แก้ไขบทบาท"
          subTitle={`จัดการข้อมูลและสิทธิ์สำหรับรหัสบทบาท: ${roleId}`}
        />

        <div className="p-6">
          <RoleForm mode="edit" roleId={roleId} />
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
