"use client";

import {
  ApartmentOutlined,
  ApiOutlined,
  BugFilled,
  CarryOutOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  ConsoleSqlOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  DeploymentUnitOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FileExcelOutlined,
  FileSearchOutlined,
  FireOutlined,
  FormOutlined,
  FundProjectionScreenOutlined,
  HddOutlined,
  HeartFilled,
  HourglassOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  MobileOutlined,
  MonitorOutlined,
  NotificationFilled,
  PieChartOutlined,
  QrcodeOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  ScanOutlined,
  ScheduleOutlined,
  SignalFilled,
  SolutionOutlined,
  StopOutlined,
  SwapOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PERMISSIONS } from "./permission.constant";

interface SidebarChild {
  label: string;
  href?: string;
  news?: boolean;
  revamp?: boolean;
  maintenance?: boolean;
  icon?: JSX.Element;
  permission?: string | string[];
  children?: SidebarChild[];
}

interface SidebarItem {
  label: string;
  icon: JSX.Element;
  children?: SidebarChild[];
  href?: string;
  tag?: string;
  maintenance?: boolean;
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
        label: t("departments.admin"),
        icon: <CrownOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("admin_system.title"),
            icon: <SolutionOutlined />,
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
                permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ROLE_MANAGE],
              },
              {
                label: t("admin_system.children.department_management"),
                href: "/admin/department-management",
                icon: <ApartmentOutlined />,
                permission: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ROLE_MANAGE],
              },
            ],
          },
        ],
      },
      {
        label: t("departments.support"),
        icon: <CustomerServiceOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
          {
            label: t("support.title"),
            icon: <CustomerServiceOutlined />,
            children: [
              {
                label: t("support.children.bypass_school"),
                href: "/support/bypass",
                icon: <SafetyCertificateOutlined />,
                permission: PERMISSIONS.MENU_SUPPORT_BYPASS,
              },
              {
                label: t("support.children.test_nfc_card"),
                href: "/support/test/nfc",
                icon: <ScanOutlined />,
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
            children: [
              {
                label: t("health_check.children.server_status"),
                href: "/health-check/v2/server-status",
                icon: <DesktopOutlined />,
                permission: PERMISSIONS.MENU_HEALTH_CHECK,
              },
              {
                label: t("health_check.children.all_server_status"),
                href: "/health-check/all-server-status",
                icon: <MonitorOutlined />,
                permission: PERMISSIONS.MENU_HEALTH_ALL,
              },
              {
                label: t("health_check.children.online_status"),
                href: "/health-check/online-status",
                icon: <SignalFilled />,
                permission: PERMISSIONS.MENU_HEALTH_ONLINE,
              },
              {
                label: t("health_check.children.version_control"),
                href: "/health-check/version-control",
                icon: <DeploymentUnitOutlined />,
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
                permission: PERMISSIONS.MENU_HEALTH_HEARTBEAT,
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
                permission: PERMISSIONS.MENU_BACKLOGS,
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
                news: true,
                permission: PERMISSIONS.MENU_MOBILE_NOTI,
              },
              {
                label: t("mobile_app.children.mobile_leave_letter"),
                href: "/mobile/leave-letter",
                icon: <FormOutlined />,
                permission: PERMISSIONS.MENU_MOBILE_LEAVE,
                maintenance: true,
              },
              {
                label: t("mobile_app.children.statistics"),
                href: "/mobile/statistic",
                icon: <PieChartOutlined />,
                permission: PERMISSIONS.MENU_MOBILE_STAT,
                maintenance: true,
              },
              {
                label: t("mobile_app.children.qrcode_health_check"),
                href: "/mobile/qrcode-health-check",
                icon: <QrcodeOutlined />,
                permission: PERMISSIONS.MENU_MOBILE_QR,
                maintenance: true,
              },
              {
                label: t("mobile_app.children.mobile_check_attendance"),
                href: "/mobile/check-attendance",
                icon: <CheckCircleOutlined />,
                permission: PERMISSIONS.MENU_MOBILE_ATTENDANCE,
                maintenance: true,
              },
            ],
          },
        ],
      },
      {
        label: t("departments.testing"),
        icon: <ExperimentOutlined />,
        permission: PERMISSIONS.ADMIN_ACCESS,
        children: [
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
            label: t("testing.title"),
            icon: <ExperimentOutlined />,
            children: [
              {
                label: t("testing.children.load_testing"),
                href: "/testing/load-test",
                icon: <ThunderboltOutlined />,
                permission: PERMISSIONS.MENU_TESTING_LOAD,
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
                permission: PERMISSIONS.MENU_LOGGER,
              },
            ],
          },

          {
            label: t("api_docs.title"),
            icon: <ApiOutlined />,
            children: [
              {
                label: t("api_docs.children.spec"),
                href: "/api-spec",
                icon: <FileSearchOutlined />,
                news: true,
              },
              {
                label: t("api_docs.children.raw"),
                href: "/api/docs",
                icon: <CodeOutlined />,
              },
            ],
          },
        ],
      },
      {
        label: t("departments.timesheet"),
        icon: <HourglassOutlined />,
        permission: PERMISSIONS.TIMESHEET_READ,
        children: [
          {
            label: t("timesheet_system.children.entry"),
            href: "/timesheet/entry",
            icon: <FormOutlined />,
            permission: [
              PERMISSIONS.TIMESHEET_WRITE,
              PERMISSIONS.MENU_TIMESHEET_ENTRY,
            ],
          },
          {
            label: t("timesheet_system.children.overtime"),
            href: "/timesheet/overtime",
            icon: <FireOutlined />,
            permission: PERMISSIONS.MENU_TIMESHEET_OVERTIME,
          },

          {
            label: t("timesheet_system.children.timeline"),
            href: "/timesheet/timeline",
            icon: <FieldTimeOutlined />,
            permission: PERMISSIONS.MENU_TIMESHEET_TIMELINE,
          },
          {
            label: t("timesheet_system.children.all"),
            href: "/timesheet/all",
            icon: <SolutionOutlined />,
            permission: [
              PERMISSIONS.REPORT_VIEW,
              PERMISSIONS.MENU_TIMESHEET_ALL,
            ],
          },
          {
            label: t("timesheet_system.children.project"),
            href: "/timesheet/project",
            icon: <FundProjectionScreenOutlined />,
            permission: [
              PERMISSIONS.PROJECT_READ,
              PERMISSIONS.MENU_TIMESHEET_PROJECT,
            ],
          },
          {
            label: t("timesheet_system.children.migrate_person"),
            href: "/timesheet/all/report/migrate-person",
            icon: <SwapOutlined />,
            news: true,
            permission: PERMISSIONS.TIMESHEET_WRITE,
          },
        ],
      },
      {
        label: t("departments.others"),
        icon: <FileExcelOutlined />,
        children: [
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
        ],
      },
    ];

    const filterMenu = (items: any[]): any[] => {
      return items
        .map((item) => {
          if (item.children) {
            const filteredChildren = filterMenu(item.children);
            return { ...item, children: filteredChildren };
          }
          return item;
        })
        .filter((item) => {
          const hasOwnPermission = hasPermission(item.permission);
          const hasVisibleChildren = item.children && item.children.length > 0;
          const isLink = !!item.href;

          if (isLink) return hasOwnPermission;
          return hasOwnPermission || hasVisibleChildren;
        });
    };

    return filterMenu(rawMenu);
  }, [t, i18n.isInitialized, i18n.language, userPermissions, isAdminId117]);

  return menu;
};
