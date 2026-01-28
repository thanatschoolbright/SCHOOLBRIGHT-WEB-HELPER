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
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
