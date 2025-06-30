import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { FiGrid } from "react-icons/fi";
import { FaRegLightbulb } from "react-icons/fa";
import { FiActivity } from "react-icons/fi";
import { AiFillMobile } from "react-icons/ai";

export const useSidebarMenu = () => {
  const { t } = useTranslation("menu"); // ชี้ namespace "menu"

  const menu = useMemo(
    () => [
      {
        label: t("testing"),
        icon: <FiGrid />,
        children: [
          { label: t("automated_testing"), href: "/testing/auto" },
          { label: t("load_testing"), href: "/testing/load-test" },
        ],
      },
      {
        label: t("support"),
        icon: <FaRegLightbulb />,
        children: [
          { label: t("bypass_school"), href: "/support/bypass" },
          { label: t("test_nfc_card"), href: "/support/test/nfc" },
          { label: t("cancel_sales"), href: "/support/test/cancel-sales" },
          {
            label: t("upload_student_migration"),
            href: "/support/upload/migrate-student",
          },
        ],
      },
      {
        label: t("health_check"),
        icon: <FiActivity />,
        children: [
          {
            label: t("all_server_status"),
            href: "/health-check/all-server-status",
          },
          {
            label: t("online_status"),
            href: "/health-check/online-status",
          },
          {
            label: t("offline_sync_status"),
            href: "/health-check/offline-sync-status",
          },
        ],
      },
      {
        label: t("mobile_app"),
        icon: <AiFillMobile />,
        children: [
          {
            label: t("mobile_notification"),
            href: "/mobile/notification",
          },
          {
            label: t("mobile_leave_letter"),
            href: "/mobile/leave-letter",
          },
        ],
      },
      // ... เหมือนเดิม
    ],
    [t]
  );

  return menu;
};
