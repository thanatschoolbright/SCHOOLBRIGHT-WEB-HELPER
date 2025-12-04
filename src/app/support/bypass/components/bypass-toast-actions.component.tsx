import React from "react";
import { Button, Space } from "antd";
import type { TFunction } from "i18next";

type BypassToastActionsProps = {
  finalUrl: string;
  onCopyLink: () => void;
  onCopyToken: () => void;
  TRANSLATION: TFunction;
};

export const BypassToastActions = ({
  finalUrl,
  onCopyLink,
  onCopyToken,
  TRANSLATION,
}: BypassToastActionsProps): React.ReactNode => {
  return (
    <Space direction="vertical" size={4}>
      <Button
        block
        size="small"
        type="default"
        onClick={(e) => {
          e.stopPropagation();
          onCopyLink();
        }}
        style={{
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: 999,
          border: "none",
          height: 28,
          padding: "0 10px",
        }}
      >
        {TRANSLATION("bypass_page.copy_link")}
      </Button>
      <Button
        block
        size="small"
        type="default"
        onClick={(e) => {
          e.stopPropagation();
          onCopyToken();
        }}
        style={{
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: 999,
          border: "none",
          height: 28,
          padding: "0 10px",
        }}
      >
        {TRANSLATION("bypass_page.copy_token")}
      </Button>
    </Space>
  );
};
