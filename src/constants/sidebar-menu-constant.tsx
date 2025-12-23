"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  // --- Admin ---
  CrownOutlined, // Admin System
  IdcardOutlined, // User Profile

  // --- Testing ---
  ExperimentOutlined, // Testing Main
  RocketOutlined, // Load Testing (สื่อถึงความแรง/Performance)

  // --- Support ---
  CustomerServiceOutlined, // Support Main
  UnlockOutlined, // Bypass (ปลดล็อค)
  ScanOutlined, // NFC (การสแกน)
  StopOutlined, // Cancel Sales

  // --- Health Check ---
  MedicineBoxOutlined, // Health Check Main (กล่องพยาบาล)
  CloudServerOutlined, // All Server
  SignalFilled, // Online Status (สัญญาณเน็ต)
  BranchesOutlined, // Version Control (Git Branch)
  FileSearchOutlined, // Transaction Log (ส่องไฟล์)
  HeartFilled, // Heartbeats (หัวใจเต้น)

  // --- Mobile ---
  MobileOutlined,
  NotificationFilled, // Notification (กระดิ่งทึบให้เด่น)
  CoffeeOutlined, // Leave Letter (แก้วกาแฟ = พักผ่อน/ลา)
  PieChartOutlined, // Statistics
  QrcodeOutlined,
  EnvironmentOutlined, // Check Attendance (เช็คชื่อตามพิกัด)

  // --- Hardware ---
  HddOutlined, // Hardware Main
  ApiOutlined, // Control

  // --- Timesheet ---
  HourglassOutlined, // Timesheet Main (นาฬิกาทราย)
  FundProjectionScreenOutlined, // Project (โปรเจคเตอร์)
  FormOutlined, // Entry (กรอกข้อมูล)
  FieldTimeOutlined, // Timeline
  UnorderedListOutlined, // All
  FireOutlined, // Overtime (ไฟลุก/งานร้อน)

  // --- Backlogs ---
  CarryOutOutlined, // Backlogs (Checklist ที่ต้องทำให้เสร็จ)
  BugFilled, // Report (บั๊กตัวทึบ)

  // --- Logger ---
  CodeOutlined, // Logger Main
  ConsoleSqlOutlined, // API Logs (หน้าจอ Console)

  // --- Sheets ---
  FileExcelOutlined, // Sheets Main
  ScheduleOutlined, // Planning
  ReadOutlined, // Training (การอ่าน/เรียนรู้)
  TagsOutlined, // Release Note (ป้ายกำกับเวอร์ชัน)
  GoogleOutlined,
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
        icon: <CrownOutlined />, // เปลี่ยนเป็นมงกุฎให้ดูเป็น Admin
        children: [
          {
            label: t("admin_system.children.user_profile"),
            href: "/admin/user-profile",
            icon: <IdcardOutlined />, // บัตรประจำตัว
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
            icon: <RocketOutlined />, // จรวด สื่อถึงการเทสความเร็ว/โหลด
          },
        ],
      },
      {
        label: t("support.title"),
        icon: <CustomerServiceOutlined />, // หูฟัง Support
        children: [
          {
            label: t("support.children.bypass_school"),
            href: "/support/bypass",
            icon: <UnlockOutlined />, // แม่กุญแจเปิด
            revamp: true,
          },
          {
            label: t("support.children.test_nfc_card"),
            href: "/support/test/nfc",
            icon: <ScanOutlined />, // สัญลักษณ์สแกน
            revamp: true,
          },
          {
            label: t("support.children.cancel_sales"),
            href: "/support/test/cancel-sales",
            icon: <StopOutlined />, // ป้ายหยุด/ยกเลิก
          },
        ],
      },
      {
        label: t("health_check.title"),
        icon: <MedicineBoxOutlined />, // กล่องพยาบาล
        children: [
          {
            label: t("health_check.children.all_server_status"),
            href: "/health-check/all-server-status",
            icon: <CloudServerOutlined />, // Server
            revamp: true,
          },
          {
            label: t("health_check.children.online_status"),
            href: "/health-check/online-status",
            icon: <SignalFilled />, // สัญญาณเน็ตเต็ม
          },
          {
            label: t("health_check.children.version_control"),
            href: "/health-check/version-control",
            icon: <BranchesOutlined />, // กิ่งก้าน Git Branch
          },
          {
            label: t("health_check.children.transaction_log"),
            href: "/health-check/transaction-log",
            icon: <FileSearchOutlined />, // แว่นขยายส่องไฟล์
          },
          {
            label: t("health_check.children.heartbeats"),
            href: "/health-check/heartbeats",
            news: true,
            icon: <HeartFilled />, // หัวใจทึบ
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
            icon: <NotificationFilled />, // กระดิ่ง
          },
          {
            label: t("mobile_app.children.mobile_leave_letter"),
            href: "/mobile/leave-letter",
            icon: <CoffeeOutlined />, // แก้วกาแฟ (ลาพัก)
          },
          {
            label: t("mobile_app.children.statistics"),
            href: "/mobile/statistic",
            icon: <PieChartOutlined />, // กราฟวงกลม
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
            icon: <EnvironmentOutlined />, // ปักหมุดสถานที่
            news: true,
          },
        ],
      },
      {
        label: t("app_hardware.title"),
        icon: <HddOutlined />, // ฮาร์ดดิสก์
        children: [
          {
            label: t("app_hardware.children.app_control"),
            href: "/hardware/canteen",
            icon: <ApiOutlined />, // เชื่อมต่ออุปกรณ์
          },
        ],
      },
      {
        label: t("timesheet_system.title"),
        icon: <HourglassOutlined />, // นาฬิกาทราย
        children: [
          {
            label: t("timesheet_system.children.project"),
            href: "/timesheet/project",
            news: false,
            icon: <FundProjectionScreenOutlined />, // จอพรีเซนต์งาน
          },
          {
            label: t("timesheet_system.children.entry"),
            href: "/timesheet/entry",
            news: false,
            icon: <FormOutlined />, // แบบฟอร์ม
          },
          {
            label: t("timesheet_system.children.timeline"),
            href: "/timesheet/timeline",
            news: true,
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
            icon: <FireOutlined />, // ไฟลุก (งานเดือด/OT)
          },
        ],
      },
      {
        label: t("backlogs.title"),
        icon: <CarryOutOutlined />, // กระดานงานที่ทำเสร็จ
        children: [
          {
            label: t("backlogs.children.report"),
            href: "/backlogs/report",
            news: true,
            icon: <BugFilled />, // แมลง (Bug Report)
          },
        ],
      },
      {
        label: t("logger.title"),
        icon: <CodeOutlined />, // Coding
        children: [
          {
            label: t("logger.children.api_logs"),
            href: "/logger/api-log",
            icon: <ConsoleSqlOutlined />, // หน้าจอ Console
          },
        ],
      },
      {
        label: t("sheets.title"),
        icon: <FileExcelOutlined />, // ไฟล์ Excel
        children: [
          {
            label: t("sheets.children.project_planning"),
            href: "https://docs.google.com/spreadsheets/d/1FUIxwi_hi3DGfzsJokU5EMeKlwPC8DUL0r4wWJabzVQ/edit?gid=1358985470#gid=1358985470",
            icon: <ScheduleOutlined />, // ตารางงาน
          },
          {
            label: t("sheets.children.project_training"),
            href: "https://docs.google.com/document/d/1a5bTQ6zWf15MUnPp4D2BzDEUmwStnaRliBgXp-H32zM",
            icon: <ReadOutlined />, // หนังสือ/การอ่าน
          },
          {
            label: t("sheets.children.project_release_note"),
            href: "https://docs.google.com/document/d/1ux2KLYcsuS4spL1l68xMV6pChDXCukPXwnTyWCGT28I/edit?usp=sharing",
            icon: <TagsOutlined />, // ป้าย Tag
          },
        ],
      },
    ];
  }, [t, i18n.isInitialized, i18n.language]);

  return menu;
};
