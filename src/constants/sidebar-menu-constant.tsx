"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { PERMISSIONS } from "./permission.constant";
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
  ApartmentOutlined,
} from "@ant-design/icons";

interface SidebarChild {
  label: string;
  href: string;
  news?: boolean;
  revamp?: boolean;
  icon?: JSX.Element;
  permission?: string | string[];
}

interface SidebarItem {
  label: string;
  icon: JSX.Element;
  children?: SidebarChild[];
  href?: string;
  tag?: string;
  permission?: string | string[];
}

export const useSidebarMenu = (): SidebarItem[] => {
  const { t, i18n } = useTranslation("menu");
  const { data: session } = useSession();

  const userPermissions = (session?.user as any)?.permissions || [];
  const isAdminId117 = (session?.user as any)?.admin_id === 117;

  const hasPermission = (required: string | string[] | undefined) => {
    if (!required || isAdminId117) return true;
    const requiredArray = Array.isArray(required) ? required : [required];
    return requiredArray.some((p) => userPermissions.includes(p));
  };

  const menu = useMemo(() => {
    if (!i18n.isInitialized || !i18n.hasResourceBundle(i18n.language, "menu")) {
      return [];
    }

    const rawMenu: SidebarItem[] = [
      {
        label: t("admin_system.title"),
        icon: <CrownOutlined />,
        permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ROLE_MANAGE],
        children: [
          {
            label: t("admin_system.children.user_profile"),
            href: "/admin/user-profile",
            icon: <IdcardOutlined />,
            permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.USER_MANAGE],
          },
          {
            label: t("admin_system.children.role_management"),
            href: "/admin/permission-management",
            icon: <SafetyCertificateOutlined />,
            permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ROLE_MANAGE],
          },
          {
            label: t("admin_system.children.position_management"),
            href: "/admin/position-management",
            icon: <DeploymentUnitOutlined />,
            permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ROLE_MANAGE], // สมมติว่าใช้กลุ่มสิทธิ์เดียวกัน
          },
          {
            label: t("admin_system.children.department_management"),
            href: "/admin/department-management",
            icon: <ApartmentOutlined />,
            permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ROLE_MANAGE],
          },
        ],
      },
      {
        label: t("testing.title"),
        icon: <ExperimentOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("testing.children.load_testing"),
            href: "/testing/load-test",
            icon: <ThunderboltOutlined />, // ปรับให้สื่อถึงความแรง/โหลด
            permission: PERMISSIONS.MENU_TESTING_LOAD,
          },
        ],
      },
      {
        label: t("support.title"),
        icon: <CustomerServiceOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("support.children.bypass_school"),
            href: "/support/bypass",
            icon: <SafetyCertificateOutlined />, // ปรับให้เกี่ยวกับการอนุญาต/Security
            revamp: false,
            permission: PERMISSIONS.MENU_SUPPORT_BYPASS,
          },
          {
            label: t("support.children.test_nfc_card"),
            href: "/support/test/nfc",
            icon: <ScanOutlined />,
            revamp: false,
            permission: PERMISSIONS.MENU_SUPPORT_NFC,
          },
          {
            label: t("support.children.cancel_sales"),
            href: "/support/test/cancel-sales",
            icon: <StopOutlined />,
            permission: PERMISSIONS.MENU_SUPPORT_CANCEL_SALES,
          },
        ],
      },
      {
        label: t("health_check.title"),
        icon: <MedicineBoxOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("health_check.children.server_status"),
            href: "/health-check/v2/server-status",
            icon: <DesktopOutlined />, // ปรับให้เหมือนการตรวจสอบหน้าจอเซิร์ฟเวอร์
            news: false,
            permission: PERMISSIONS.MENU_HEALTH_CHECK,
          },
          {
            label: t("health_check.children.all_server_status"),
            href: "/health-check/all-server-status",
            icon: <MonitorOutlined />, // รายงานรวม
            revamp: false,
            permission: PERMISSIONS.MENU_HEALTH_ALL,
          },
          {
            label: t("health_check.children.online_status"),
            href: "/health-check/online-status",
            icon: <SignalFilled />,
            revamp: false,
            permission: PERMISSIONS.MENU_HEALTH_ONLINE,
          },
          {
            label: t("health_check.children.version_control"),
            href: "/health-check/version-control",
            icon: <DeploymentUnitOutlined />, // ปรับให้สื่อถึงการกระจายเวอร์ชัน/Branch
            revamp: false,
            permission: PERMISSIONS.MENU_HEALTH_VERSION,
          },
          {
            label: t("health_check.children.transaction_log"),
            href: "/health-check/transaction-log",
            icon: <FileSearchOutlined />,
            permission: PERMISSIONS.MENU_HEALTH_LOG,
          },
          {
            label: t("health_check.children.heartbeats"),
            href: "/health-check/heartbeats",
            icon: <HeartFilled />,
            revamp: false,
            permission: PERMISSIONS.MENU_HEALTH_HEARTBEAT,
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
            permission: PERMISSIONS.MENU_MOBILE_NOTI,
          },
          {
            label: t("mobile_app.children.mobile_leave_letter"),
            href: "/mobile/leave-letter",
            icon: <FormOutlined />, // ปรับเป็นไอคอนเอกสาร/ใบลา
            permission: PERMISSIONS.MENU_MOBILE_LEAVE,
          },
          {
            label: t("mobile_app.children.statistics"),
            href: "/mobile/statistic",
            icon: <PieChartOutlined />,
            permission: PERMISSIONS.MENU_MOBILE_STAT,
          },
          {
            label: t("mobile_app.children.qrcode_health_check"),
            href: "/mobile/qrcode-health-check",
            icon: <QrcodeOutlined />,
            news: false,
            permission: PERMISSIONS.MENU_MOBILE_QR,
          },
          {
            label: t("mobile_app.children.mobile_check_attendance"),
            href: "/mobile/check-attendance",
            icon: <CheckCircleOutlined />, // ปรับเป็นไอคอนเช็กชื่อ
            permission: PERMISSIONS.MENU_MOBILE_ATTENDANCE,
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
        permission: PERMISSIONS.TIMESHEET_READ,
        children: [
          {
            label: t("timesheet_system.children.project"),
            href: "/timesheet/project",
            icon: <FundProjectionScreenOutlined />,
            news: false,
            permission: [
              PERMISSIONS.PROJECT_READ,
              PERMISSIONS.MENU_TIMESHEET_PROJECT,
            ],
          },
          {
            label: t("timesheet_system.children.entry"),
            href: "/timesheet/entry",
            icon: <FormOutlined />,
            news: false,
            permission: [
              PERMISSIONS.TIMESHEET_WRITE,
              PERMISSIONS.MENU_TIMESHEET_ENTRY,
            ],
          },
          {
            label: t("timesheet_system.children.timeline"),
            href: "/timesheet/timeline",
            icon: <FieldTimeOutlined />,
            news: false,
            permission: PERMISSIONS.MENU_TIMESHEET_TIMELINE,
          },
          {
            label: t("timesheet_system.children.all"),
            href: "/timesheet/all",
            icon: <SolutionOutlined />, // ปรับเป็นรูปรายงานรวมพนักงาน
            news: false,
            permission: [
              PERMISSIONS.REPORT_VIEW,
              PERMISSIONS.MENU_TIMESHEET_ALL,
            ],
          },
          {
            label: t("timesheet_system.children.overtime"),
            href: "/timesheet/overtime",
            icon: <FireOutlined />,
            news: false,
            permission: PERMISSIONS.MENU_TIMESHEET_OVERTIME,
          },
        ],
      },
      {
        label: t("backlogs.title"),
        icon: <CarryOutOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("backlogs.children.report"),
            href: "/backlogs/report",
            icon: <BugFilled />,
            news: false,
            permission: PERMISSIONS.MENU_BACKLOGS,
          },
        ],
      },
      {
        label: t("logger.title"),
        icon: <CodeOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("logger.children.api_logs"),
            href: "/logger/api-log",
            icon: <ConsoleSqlOutlined />,
            permission: PERMISSIONS.MENU_LOGGER,
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

    // ✅ 1. กรองสิทธิ์ลูกๆ ก่อน (Process children filtering first)
    // ✅ 2. แสดง Parent ถ้า Parent มีสิทธิ์ตรง หรือ มีลูกที่ผ่านการกรองมาแล้ว (Show parent if it has permission OR visible children)
    return rawMenu
      .map((item) => {
        const filteredChildren = item.children?.filter((child) =>
          hasPermission(child.permission),
        );
        return {
          ...item,
          children: filteredChildren,
        };
      })
      .filter((item) => {
        const hasParentPermission = hasPermission(item.permission);
        const hasVisibleChildren = item.children && item.children.length > 0;
        const isDirectLink = !!item.href;

        // ถ้าเป็นลิงก์ตรง ให้เช็คสิทธิ์ตัวเอง (If direct link, check its own permission)
        if (isDirectLink) {
          return hasParentPermission;
        }

        // ถ้าเป็นเมนูแบบมีลูก ให้แสดงถ้าตัวเองมีสิทธิ์ หรือ ลูกมีสิทธิ์ (If group, show if parent has perm OR at least one child is visible)
        return hasParentPermission || hasVisibleChildren;
      });
  }, [t, i18n.isInitialized, i18n.language, userPermissions, isAdminId117]);

  return menu;
};
