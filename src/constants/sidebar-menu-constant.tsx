"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiActivity, FiFolder, FiGrid } from "react-icons/fi";
import { FaRegLightbulb } from "react-icons/fa";
import { AiFillMobile } from "react-icons/ai";
interface SidebarChild {
  label: string;
  href: string;
  news?: boolean;
}

interface SidebarItem {
  label: string;
  icon: JSX.Element;
  children?: SidebarChild[];
  href?: string;
  tag?: string;
}
export const useSidebarMenu = (): SidebarItem[] => {
  const { t } = useTranslation("menu"); // ชี้ namespace "menu"

  const menu = useMemo(
    () => [
      {
        label: t("admin_system.title"),
        icon: <FiFolder />,
        children: [
          {
            label: t("admin_system.children.user_profile"),
            href: "/admin/user-profile",
            news: false,
            children: [
              {
                label: t("admin_system.children.user_profile"),
                href: "/admin/user-profile",
                news: false,
              },
            ],
          },
        ],
      },
      {
        label: t("testing.title"),
        icon: <FiGrid />,
        children: [
          // { label: t("testing.children.automated_testing"), href: "/testing/auto" },
          {
            label: t("testing.children.load_testing"),
            href: "/testing/load-test",
          },
        ],
      },
      {
        label: t("support.title"),
        icon: <FaRegLightbulb />,
        children: [
          {
            label: t("support.children.bypass_school"),
            href: "/support/bypass",
          },
          {
            label: t("support.children.test_nfc_card"),
            href: "/support/test/nfc",
          },
          {
            label: t("support.children.cancel_sales"),
            href: "/support/test/cancel-sales",
          },
          {
            label: t("support.children.upload_student_migration"),
            href: "/support/upload/migrate-student",
            news: true,
          },
        ],
      },

      {
        label: t("health_check.title"),
        icon: <FiActivity />,
        children: [
          {
            label: t("health_check.children.all_server_status"),
            href: "/health-check/all-server-status",
          },
          {
            label: t("health_check.children.online_status"),
            href: "/health-check/online-status",
          },
          {
            label: t("health_check.children.offline_sync_status"),
            href: "/health-check/offline-sync-status",
          },
          {
            label: t("health_check.children.version_control"),
            href: "/health-check/version-control",
          },
          {
            label: t("health_check.children.transaction_log"),
            href: "/health-check/transaction-log",
          },
          {
            label: t("health_check.children.heartbeats"),
            href: "/health-check/heartbeats",
            news: true,
          },
        ],
      },
      {
        label: t("mobile_app.title"),
        icon: <AiFillMobile />,
        children: [
          {
            label: t("mobile_app.children.mobile_notification"),
            href: "/mobile/notification",
          },
          {
            label: t("mobile_app.children.mobile_leave_letter"),
            href: "/mobile/leave-letter",
          },
          {
            label: t("mobile_app.children.statistics"),
            href: "/mobile/statistic",
          },
          {
            label: t("mobile_app.children.qrcode_health_check"),
            href: "/mobile/qrcode-health-check",
            news: false,
          },
        ],
      },
      {
        label: t("app_hardware.title"),
        icon: <FiGrid />,
        children: [
          {
            label: t("app_hardware.children.app_control"),
            href: "/hardware/canteen",
          },
        ],
      },
      {
        label: t("timesheet_system.title"),
        icon: <FiFolder />, // ใช้ Folder แทนเพื่อสื่อถึงโปรเจกต์
        children: [
          {
            label: t("timesheet_system.children.project"),
            href: "/timesheet/project",
            news: false,
            children: [
              {
                label: t("timesheet_system.children.sub_project"),
                href: "/timesheet/project/sub-project",
              },
            ],
          },
          {
            label: t("timesheet_system.children.entry"),
            href: "/timesheet/entry",
            news: false,
          },
          {
            label: t("timesheet_system.children.all"),
            href: "/timesheet/all",
            news: false,
          },
        ],
      },
      {
        label: t("backlogs.title"),
        icon: <FiFolder />, // ใช้ Folder แทนเพื่อสื่อถึงโปรเจกต์
        children: [
          {
            label: t("backlogs.children.report"),
            href: "/backlogs/report",
            news: true,
            children: [],
          },
        ],
      },
      // ... เหมือนเดิม
    ],
    [t]
  );

  return menu;
};
