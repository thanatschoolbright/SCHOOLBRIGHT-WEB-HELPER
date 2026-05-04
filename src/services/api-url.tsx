// file locate :  src/services/api-url.tsx

export const API_URL = {
  DEV_PAYMENT_API_URL:
    process.env.DEVELOPMENT_PAYMENT_API_URL ?? "error",
  PROD_PAYMENT_API_URL:
    process.env.PRODUCTION_PAYMENT_API_URL ?? "error",
  PROD_SB_API_URL: process.env.PRODUCTION_SB_API_URL ?? "error",
  PROD_SYSTEM_URL: process.env.PRODUCTION_SYSTEM_WEB_URL ?? "error",
  DEV_SB_API_URL: process.env.DEVELOPMENT_SB_API_URL ?? "error",
  PROD_HARDWARE_API_URL:
    process.env.PRODUCTION_HARDWARE_API_URL ?? "error",
  DEV_HARDWARE_API_URL:
    process.env.DEVELOPMENT_HARDWARE_API_URL ?? "error",
  PROD_ADMIN_JABJAI_API_URL:
    process.env.ADMIN_JABJAI_URL ?? "error",
  PROD_ACCOUNTING_WEB_URL:
    process.env.PRODUCTION_ACCOUNTING_WEB_URL ?? "error",
  PROD_ACADEMIC_WEB_URL:
    process.env.PRODUCTION_ACADEMIC_WEB_URL ?? "error",
  PROD_CANTEEN_WEB_URL:
    process.env.PRODUCTION_CANTEEN_WEB_URL ?? "error",
  PROD_SCHOOLBUS_WEB_URL:
    process.env.PRODUCTION_SCHOOLBUS_WEB_URL ?? "error",
  PROD_LIBRARY_WEB_URL:
    process.env.PRODUCTION_LIBRARY_WEB_URL ?? "error",
  PROD_MARK_ACTIVITY_WEB_URL:
    process.env.PRODUCTION_MARK_ACTIVITY_WEB_URL ?? "error",
  PROD_SYSTEM_ALPHA_TUTOR_WEB_URL:
    process.env.PRODUCTION_ALPHA_TUTOR_SYSTEM_WEB_URL ?? "error",
  PROD_PAYMENT_GATEWAY_API_URL:
    process.env.PRODUCTION_PAYMENT_GATEWAY_WEB_URL ?? "error",
  DEV_PAYMENT_GATEWAY_API_URL:
    process.env.DEVELOPMENT_PAYMENT_GATEWAY_API_URL ?? "error",
  SB_HELPER_URL: process.env.SB_HELPER_URL ?? "error",
} as const;

export type ApiUrlKey = keyof typeof API_URL;
