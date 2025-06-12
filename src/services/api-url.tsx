export const API_URL = {
  DEV_PAYMENT_API_URL:
    process.env.NEXT_PUBLIC_DEVELOPMENT_PAYMENT_API_URL ?? "error",
  PROD_PAYMENT_API_URL:
    process.env.NEXT_PUBLIC_PRODUCTION_PAYMENT_API_URL ?? "error",
  PROD_SB_API_URL: process.env.NEXT_PUBLIC_PRODUCTION_SB_API_URL ?? "error",
  DEV_SB_API_URL: process.env.NEXT_PUBLIC_DEVELOPMENT_SB_API_URL ?? "error",
  PROD_HARDWARE_API_URL:
    process.env.NEXT_PUBLIC_PRODUCTION_HARDWARE_API_URL ?? "error",
  DEV_HARDWARE_API_URL:
    process.env.NEXT_PUBLIC_DEVELOPMENT_HARDWARE_API_URL ?? "error",
  PROD_ADMIN_JABJAI_API_URL:
    process.env.NEXT_PUBLIC_ADMIN_JABJAI_URL ?? "error",
} as const;

export type ApiUrlKey = keyof typeof API_URL;
