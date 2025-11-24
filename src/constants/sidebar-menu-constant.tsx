"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AppstoreOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  MobileOutlined,
  MonitorOutlined,
  TableOutlined,
  UserOutlined,
  // Sub-menu icons
  ProfileOutlined,
  TeamOutlined,
  SafetyOutlined,
  HistoryOutlined,
  LoadingOutlined,
  ToolOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  SyncOutlined,
  DesktopOutlined,
  FileExcelOutlined,
  HeartOutlined,
  BellOutlined,
  FileTextOutlined as FileIconOutlined,
  BarChartOutlined,
  QrcodeOutlined,
  ControlOutlined,
  ProjectOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  BugOutlined,
  ApiOutlined,
  GoogleOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";

interface SidebarChild {
  label: string;
  href: string;
  news?: boolean;
  revamp?: boolean;
  icon?: JSX.Element;
}

interface SidebarItem {
  label: string;
  icon: JSX.Element;
  children?: SidebarChild[];
  href?: string;
  tag?: string;
}

export const useSidebarMenu = (): SidebarItem[] => {
  const { t, i18n } = useTranslation("menu");

  const menu = useMemo(() => {
    // ตรวจสอบว่า translation พร้อมใช้งานหรือไม่
    if (!i18n.isInitialized || !i18n.hasResourceBundle(i18n.language, "menu")) {
      return []; // ส่งคืน array ว่างถ้า translation ยังไม่พร้อม
    }

    return [
      {
        label: t("admin_system.title"),
        icon: <UserOutlined />,
        children: [
          {
            label: t("admin_system.children.user_profile"),
            href: "/admin/user-profile",
            icon: <ProfileOutlined />,
          },
          {
            label: t("admin_system.children.user_management"),
            href: "/admin/user-management",
            icon: <TeamOutlined />,
          },
          {
            label: t("admin_system.children.role_management"),
            href: "/admin/role-management",
            icon: <SafetyOutlined />,
          },
          {
            label: t("admin_system.children.system_log"),
            href: "/admin/system-log",
            icon: <HistoryOutlined />,
          },
        ],
      },
      {
        label: t("testing.title"),
        icon: <ExperimentOutlined />,
        children: [
          {
            label: t("testing.children.load_testing"),
            href: "/testing/load-test",
            icon: <LoadingOutlined />,
          },
        ],
      },
      {
        label: t("support.title"),
        icon: <BulbOutlined />,
        children: [
          {
            label: t("support.children.bypass_school"),
            href: "/support/bypass",
            icon: <ToolOutlined />,
            revamp: true,
          },
          {
            label: t("support.children.test_nfc_card"),
            href: "/support/test/nfc",
            icon: <CreditCardOutlined />,
            revamp: true,
          },
          {
            label: t("support.children.cancel_sales"),
            href: "/support/test/cancel-sales",
            icon: <ShoppingCartOutlined />,
          },
        ],
      },
      {
        label: t("health_check.title"),
        icon: <MonitorOutlined />,
        children: [
          {
            label: t("health_check.children.all_server_status"),
            href: "/health-check/all-server-status",
            icon: <DatabaseOutlined />,
            revamp: true,
          },
          {
            label: t("health_check.children.online_status"),
            href: "/health-check/online-status",
            icon: <GlobalOutlined />,
          },
          {
            label: t("health_check.children.offline_sync_status"),
            href: "/health-check/offline-sync-status",
            icon: <SyncOutlined />,
          },
          {
            label: t("health_check.children.version_control"),
            href: "/health-check/version-control",
            icon: <DesktopOutlined />,
          },
          {
            label: t("health_check.children.transaction_log"),
            href: "/health-check/transaction-log",
            icon: <FileExcelOutlined />,
          },
          {
            label: t("health_check.children.heartbeats"),
            href: "/health-check/heartbeats",
            news: true,
            icon: <HeartOutlined />,
          },
        ],
      },
      {
        label: t("mobile_app.title"),
        icon: <MobileOutlined />,
        children: [
          {
            label: t("mobile_app.children.mobile_notification"),
            href: "/mobile/notification",
            icon: <BellOutlined />,
          },
          {
            label: t("mobile_app.children.mobile_leave_letter"),
            href: "/mobile/leave-letter",
            icon: <FileIconOutlined />,
          },
          {
            label: t("mobile_app.children.statistics"),
            href: "/mobile/statistic",
            icon: <BarChartOutlined />,
          },
          {
            label: t("mobile_app.children.qrcode_health_check"),
            href: "/mobile/qrcode-health-check",
            news: false,
            icon: <QrcodeOutlined />,
          },
          {
            label: t("mobile_app.children.mobile_check_attendance"),
            href: "/mobile/check-attendance",
            icon: <DesktopOutlined />,
            news: true,
          },
        ],
      },
      {
        label: t("app_hardware.title"),
        icon: <AppstoreOutlined />,
        children: [
          {
            label: t("app_hardware.children.app_control"),
            href: "/hardware/canteen",
            icon: <ControlOutlined />,
          },
        ],
      },
      {
        label: t("timesheet_system.title"),
        icon: <ClockCircleOutlined />,
        children: [
          {
            label: t("timesheet_system.children.project"),
            href: "/timesheet/project",
            news: false,
            icon: <ProjectOutlined />,
          },
          {
            label: t("timesheet_system.children.entry"),
            href: "/timesheet/entry",
            news: false,
            icon: <PlusOutlined />,
          },
          {
            label: t("timesheet_system.children.timeline"),
            href: "/timesheet/timeline",
            news: false,
            icon: <FieldTimeOutlined />,
          },
          {
            label: t("timesheet_system.children.all"),
            href: "/timesheet/all",
            news: false,
            icon: <UnorderedListOutlined />,
          },
          {
            label: t("timesheet_system.children.overtime"),
            href: "/timesheet/overtime",
            news: true,
            icon: <ClockCircleOutlined />,
          },
        ],
      },
      {
        label: t("backlogs.title"),
        icon: <FileTextOutlined />,
        children: [
          {
            label: t("backlogs.children.report"),
            href: "/backlogs/report",
            news: true,
            icon: <BugOutlined />,
          },
        ],
      },
      {
        label: t("logger.title"),
        icon: <FileTextOutlined />,
        children: [
          {
            label: t("logger.children.api_logs"),
            href: "/logger/api-log",
            icon: <ApiOutlined />,
          },
        ],
      },
      {
        label: t("sheets.title"),
        icon: <TableOutlined />,
        children: [
          {
            label: t("sheets.children.project_planning"),
            href: "https://docs.google.com/spreadsheets/d/1FUIxwi_hi3DGfzsJokU5EMeKlwPC8DUL0r4wWJabzVQ/edit?gid=1358985470#gid=1358985470",
            icon: <GoogleOutlined />,
          },
          {
            label: t("sheets.children.project_training"),
            href: "https://docs.google.com/document/d/1a5bTQ6zWf15MUnPp4D2BzDEUmwStnaRliBgXp-H32zM",
            icon: <GoogleOutlined />,
          },
          {
            label: t("sheets.children.project_release_note"),
            href: "https://docs.google.com/document/d/1ux2KLYcsuS4spL1l68xMV6pChDXCukPXwnTyWCGT28I/edit?usp=sharing",
            icon: <GoogleOutlined />,
          },
        ],
      },
    ];
  }, [t, i18n.isInitialized, i18n.language]);

  return menu;
};
