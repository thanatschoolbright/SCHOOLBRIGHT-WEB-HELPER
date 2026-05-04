import { OvertimeManagementPage } from "./overtime-page-client";

/**
 * Server Component เพื่อดึงค่า Environment Variables ที่จำเป็นส่งให้ Client Component
 */
export default function Page() {
  const hrEmail = process.env.HR_EMAIL || "manager.hr@schoolbright.co";

  return <OvertimeManagementPage hrEmail={hrEmail} />;
}
