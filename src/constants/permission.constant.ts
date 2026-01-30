/**
 * @description Standard Permission Codes (IPO Standard)
 * Pattern: {module}.{resource}.{action}
 */
export const PERMISSIONS = {
  // --- Admin & Core ---
  ADMIN_ACCESS: "admin.all.access", // Super Admin
  ROLE_MANAGE: "admin.role.manage",
  USER_MANAGE: "admin.user.manage",
  AUDIT_VIEW: "admin.audit.view",

  // --- Project Module ---
  PROJECT_READ: "project.item.read",
  PROJECT_WRITE: "project.item.write",
  PROJECT_DELETE: "project.item.delete",

  // --- Timesheet Module ---
  TIMESHEET_READ: "timesheet.entry.read",
  TIMESHEET_WRITE: "timesheet.entry.write",
  TIMESHEET_APPROVE: "timesheet.entry.approve",
  TIMESHEET_EXPORT: "timesheet.entry.export",

  // --- Finance & Reports ---
  REPORT_VIEW: "report.all.view",
  FINANCE_READ: "finance.all.read",

  // --- UI Menu Access (Specific for sidebar visibility) ---
  MENU_HEALTH_CHECK: "menu.health_check.server_status",
  MENU_HEALTH_ALL: "menu.health_check.all_server_status",
  MENU_HEALTH_ONLINE: "menu.health_check.online_status",
  MENU_HEALTH_VERSION: "menu.health_check.version_control",
  MENU_HEALTH_LOG: "menu.health_check.transaction_log",
  MENU_HEALTH_HEARTBEAT: "menu.health_check.heartbeats",

  MENU_MOBILE_NOTI: "menu.mobile.notification",
  MENU_MOBILE_LEAVE: "menu.mobile.leave_letter",
  MENU_MOBILE_STAT: "menu.mobile.statistic",
  MENU_MOBILE_QR: "menu.mobile.qrcode_health_check",
  MENU_MOBILE_ATTENDANCE: "menu.mobile.check_attendance",

  MENU_SUPPORT_BYPASS: "menu.support.bypass_school",
  MENU_SUPPORT_NFC: "menu.support.test_nfc_card",
  MENU_SUPPORT_CANCEL_SALES: "menu.support.cancel_sales",

  MENU_TESTING_LOAD: "menu.testing.load_testing",

  MENU_TIMESHEET_PROJECT: "menu.timesheet.project",
  MENU_TIMESHEET_ENTRY: "menu.timesheet.entry",
  MENU_TIMESHEET_TIMELINE: "menu.timesheet.timeline",
  MENU_TIMESHEET_ALL: "menu.timesheet.all",
  MENU_TIMESHEET_OVERTIME: "menu.timesheet.overtime",

  MENU_BACKLOGS: "menu.backlogs.report",
  MENU_LOGGER: "menu.logger.api_logs",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
