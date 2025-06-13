import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { FiGrid } from "react-icons/fi";
import { FaRegLightbulb } from "react-icons/fa";

export const useSidebarMenu = () => {
  const { t } = useTranslation("menu"); // ชี้ namespace "menu"

  const menu = useMemo(
    () => [
      {
        label: t("testing"),
        icon: <FiGrid />,
        children: [
          { label: t("automated_testing"), href: "/testing/auto" },
          { label: t("load_testing"), href: "/testing/load" },
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
      // ... เหมือนเดิม
    ],
    [t]
  );

  return menu;
};
