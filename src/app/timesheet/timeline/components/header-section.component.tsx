import React from "react";
import { FilterOutlined } from "@ant-design/icons";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { useTranslation } from "react-i18next";

export const HeaderSectionComponent: React.FC = () => {
  const { t } = useTranslation("translate");

  return (
    <HeaderBar
      title={t("timeline_page.title")}
      subTitle={t("timeline_page.subtitle")}
      icon={<FilterOutlined />}
      color="none"
    />
  );
};
