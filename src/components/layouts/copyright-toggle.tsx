"use client";

import React, { useState } from "react";
import { Popover } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import CopyrightNotice from "@components/layouts/copyright-notice";

export default function CopyrightToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 1200 }}>
      <Popover
        content={<div style={{ maxWidth: 360 }}><CopyrightNotice /></div>}
        trigger="click"
        placement="topRight"
        open={open}
        onOpenChange={(visible) => setOpen(visible)}
        getPopupContainer={() => (typeof window !== "undefined" ? document.body : (null as any)) as any}
      >
        <div
          role="button"
          tabIndex={0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "transparent",
            color: "rgba(55,65,81,0.9)",
            cursor: "pointer",
            opacity: 0.6,
            transition: "opacity 140ms ease, transform 120ms ease",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen((s) => !s);
          }}
        >
          <InfoCircleOutlined style={{ fontSize: 18 }} />
        </div>
      </Popover>
    </div>
  );
}
