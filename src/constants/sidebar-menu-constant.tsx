"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CrownOutlined,
  IdcardOutlined,
  ExperimentOutlined,
  RocketOutlined,
  CustomerServiceOutlined,
  UnlockOutlined,
  ScanOutlined,
  StopOutlined,
  MedicineBoxOutlined,
  CloudServerOutlined,
  SignalFilled,
  BranchesOutlined,
  FileSearchOutlined,
  HeartFilled,
  MobileOutlined,
  NotificationFilled,
  CoffeeOutlined,
  PieChartOutlined,
  QrcodeOutlined,
  EnvironmentOutlined,
  HddOutlined,
  ApiOutlined,
  HourglassOutlined,
  FundProjectionScreenOutlined,
  FormOutlined,
  FieldTimeOutlined,
  UnorderedListOutlined,
  FireOutlined,
  CarryOutOutlined,
  BugFilled,
  CodeOutlined,
  ConsoleSqlOutlined,
  FileExcelOutlined,
  ScheduleOutlined,
  ReadOutlined,
  TagsOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  MonitorOutlined,
  SolutionOutlined,
  DeploymentUnitOutlined,
  CheckCircleOutlined,
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
    if (!i18n.isInitialized || !i18n.hasResourceBundle(i18n.language, "menu")) {
      return [];
    }

    return [
      {
        label: t("admin_system.title"),
        icon: <CrownOutlined />,
        children: [
          {
            label: t("admin_system.children.user_profile"),
            href: "/admin/user-profile",
            icon: <IdcardOutlined />,
          },
          {
            label: t("admin_system.children.position_management"),
            href: "/admin/position-management",
            icon: <CrownOutlined />,
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
            icon: <ThunderboltOutlined />, // ปรับให้สื่อถึงความแรง/โหลด
          },
        ],
      },
      {
        label: t("support.title"),
        icon: <CustomerServiceOutlined />,
        children: [
          {
            label: t("support.children.bypass_school"),
            href: "/support/bypass",
            icon: <SafetyCertificateOutlined />, // ปรับให้เกี่ยวกับการอนุญาต/Security
            revamp: false,
          },
          {
            label: t("support.children.test_nfc_card"),
            href: "/support/test/nfc",
            icon: <ScanOutlined />,
            revamp: false,
          },
          {
            label: t("support.children.cancel_sales"),
            href: "/support/test/cancel-sales",
            icon: <StopOutlined />,
          },
        ],
      },
      {
        label: t("health_check.title"),
        icon: <MedicineBoxOutlined />,
        children: [
          {
            label: t("health_check.children.server_status"),
            href: "/health-check/v2/server-status",
            icon: <DesktopOutlined />, // ปรับให้เหมือนการตรวจสอบหน้าจอเซิร์ฟเวอร์
            news: false,
          },
          {
            label: t("health_check.children.all_server_status"),
            href: "/health-check/all-server-status",
            icon: <MonitorOutlined />, // รายงานรวม
            revamp: false,
          },
          {
            label: t("health_check.children.online_status"),
            href: "/health-check/online-status",
            icon: <SignalFilled />,
            revamp: false,
          },
          {
            label: t("health_check.children.version_control"),
            href: "/health-check/version-control",
            icon: <DeploymentUnitOutlined />, // ปรับให้สื่อถึงการกระจายเวอร์ชัน/Branch
            revamp: false,
          },
          {
            label: t("health_check.children.transaction_log"),
            href: "/health-check/transaction-log",
            icon: <FileSearchOutlined />,
          },
          {
            label: t("health_check.children.heartbeats"),
            href: "/health-check/heartbeats",
            icon: <HeartFilled />,
            revamp: false,
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
            icon: <NotificationFilled />,
            revamp: false,
          },
          {
            label: t("mobile_app.children.mobile_leave_letter"),
            href: "/mobile/leave-letter",
            icon: <FormOutlined />, // ปรับเป็นไอคอนเอกสาร/ใบลา
          },
          {
            label: t("mobile_app.children.statistics"),
            href: "/mobile/statistic",
            icon: <PieChartOutlined />,
          },
          {
            label: t("mobile_app.children.qrcode_health_check"),
            href: "/mobile/qrcode-health-check",
            icon: <QrcodeOutlined />,
            news: false,
          },
          {
            label: t("mobile_app.children.mobile_check_attendance"),
            href: "/mobile/check-attendance",
            icon: <CheckCircleOutlined />, // ปรับเป็นไอคอนเช็กชื่อ
          },
        ],
      },
      {
        label: t("app_hardware.title"),
        icon: <HddOutlined />,
        children: [
          {
            label: t("app_hardware.children.app_control"),
            href: "/hardware/canteen",
            icon: <ApiOutlined />,
          },
        ],
      },
      {
        label: t("timesheet_system.title"),
        icon: <HourglassOutlined />,
        children: [
          {
            label: t("timesheet_system.children.project"),
            href: "/timesheet/project",
            icon: <FundProjectionScreenOutlined />,
            news: false,
          },
          {
            label: t("timesheet_system.children.entry"),
            href: "/timesheet/entry",
            icon: <FormOutlined />,
            news: false,
          },
          {
            label: t("timesheet_system.children.timeline"),
            href: "/timesheet/timeline",
            icon: <FieldTimeOutlined />,
            news: false,
          },
          {
            label: t("timesheet_system.children.all"),
            href: "/timesheet/all",
            icon: <SolutionOutlined />, // ปรับเป็นรูปรายงานรวมพนักงาน
            news: false,
          },
          {
            label: t("timesheet_system.children.overtime"),
            href: "/timesheet/overtime",
            icon: <FireOutlined />,
            news: false,
          },
        ],
      },
      {
        label: t("backlogs.title"),
        icon: <CarryOutOutlined />,
        children: [
          {
            label: t("backlogs.children.report"),
            href: "/backlogs/report",
            icon: <BugFilled />,
            news: false,
          },
        ],
      },
      {
        label: t("logger.title"),
        icon: <CodeOutlined />,
        children: [
          {
            label: t("logger.children.api_logs"),
            href: "/logger/api-log",
            icon: <ConsoleSqlOutlined />,
          },
        ],
      },
      {
        label: t("sheets.title"),
        icon: <FileExcelOutlined />,
        children: [
          {
            label: t("sheets.children.project_planning"),
            href: "https://docs.google.com/spreadsheets/d/1FUIxwi_hi3DGfzsJokU5EMeKlwPC8DUL0r4wWJabzVQ/edit?gid=1358985470#gid=1358985470",
            icon: <ScheduleOutlined />,
          },
          {
            label: t("sheets.children.project_training"),
            href: "https://docs.google.com/document/d/1a5bTQ6zWf15MUnPp4D2BzDEUmwStnaRliBgXp-H32zM",
            icon: <ReadOutlined />,
          },
          {
            label: t("sheets.children.project_release_note"),
            href: "https://docs.google.com/document/d/1ux2KLYcsuS4spL1l68xMV6pChDXCukPXwnTyWCGT28I/edit?usp=sharing",
            icon: <TagsOutlined />,
          },
        ],
      },
    ];
  }, [t, i18n.isInitialized, i18n.language]);

  return menu;
};
