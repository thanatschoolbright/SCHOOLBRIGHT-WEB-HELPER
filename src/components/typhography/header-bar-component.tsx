//** Component HeaderBar สำหรับแสดงหัวข้อหน้าแบบกำหนด icon, title, subTitle ได้ */
"use client";
import React from "react";
import { Typography, theme } from "antd";

export type HeaderBarProps = {
  icon: React.ReactNode; // icon ที่จะแสดง
  title: string; // หัวข้อหลัก
  subTitle?: string; // หัวข้อรอง (ไม่บังคับ)
  color?: HeaderBarColor; // สีหลักของ HeaderBar (gradient)
};

//** กำหนดชนิดสีที่รองรับ */
export type HeaderBarColor =
  | "purple"
  | "orange"
  | "blue"
  | "green"
  | "red"
  | "pink"
  | "none"
  | "teal";

export const HeaderBar: React.FC<HeaderBarProps> = ({
  icon,
  title,
  subTitle,
  color = "purple", // ค่าเริ่มต้นเป็นม่วง
}) => {
  // get antd theme tokens for light/dark adaptability
  const { token } = theme.useToken();
  //** สร้าง HeaderBar ด้วย icon, title, subTitle, และสี gradient ที่รับมา */
  const gradient =
    color && color !== "none"
      ? headerBarGradients[color] || headerBarGradients["purple"]
      : undefined;
  //** กำหนดสีตัวอักษรแต่ละ theme แบบ Clean ด้วย mapping */
  const titleColorMap: Record<HeaderBarColor, string> = {
    purple: "white",
    orange: "rgba(255,255,255,0.85)",
    blue: "white",
    green: "white",
    red: "white",
    pink: "white",
    teal: "white",
    none: token.colorText, // adapt to light/dark
  };
  const subTitleColorMap: Record<HeaderBarColor, string> = {
    purple: "rgba(255,255,255,0.9)",
    orange: "rgba(255,255,255,0.7)",
    blue: "rgba(255,255,255,0.9)",
    green: "rgba(255,255,255,0.9)",
    red: "rgba(255,255,255,0.9)",
    pink: "rgba(255,255,255,0.9)",
    teal: "rgba(255,255,255,0.9)",
    none: token.colorTextSecondary,
  };
  const titleStyle = { ...headerBarTitle, color: titleColorMap[color] };
  const subTitleStyle = {
    ...headerBarSubTitle,
    color: subTitleColorMap[color],
  };

  const boxStyle: React.CSSProperties =
    color === "none"
      ? { ...headerBarBox, background: "transparent", boxShadow: "none" }
      : { ...headerBarBox, background: gradient };

  const iconStyle: React.CSSProperties =
    color === "none"
      ? {
          ...headerBarIcon,
          background: token.colorBgElevated,
          color: token.colorText,
        }
      : {
          ...headerBarIcon,
          background: "rgba(255,255,255,0.2)",
          color: "white",
        };

  return (
    <div style={headerBarContainer}>
      <div style={boxStyle}>
        <div style={iconStyle}>{icon}</div>
        <div>
          <Typography.Title level={4} style={titleStyle}>
            {title}
          </Typography.Title>
          {subTitle && (
            <Typography.Text style={subTitleStyle}>{subTitle}</Typography.Text>
          )}
        </div>
      </div>
    </div>
  );
};

//** Style Object สำหรับ HeaderBar (แยกไว้ด้านล่างเพื่อความเป็นระเบียบ) */
const headerBarContainer: React.CSSProperties = {
  marginBottom: 24,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const headerBarBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  borderRadius: 16,
  padding: "24px 32px",
  color: "white",
};

//** กำหนด gradient สำหรับแต่ละสี */
const headerBarGradients: Partial<Record<HeaderBarColor, string>> = {
  purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  orange: "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)",
  blue: "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
  green: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
  red: "linear-gradient(135deg, #ff5858 0%, #f857a6 100%)",
  pink: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
  teal: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
};

const headerBarIcon: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  padding: 16,
  borderRadius: 12,
  fontSize: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const headerBarTitle: React.CSSProperties = {
  margin: 0,
  fontWeight: 600,
  fontSize: 24,
  color: "white",
};

const headerBarSubTitle: React.CSSProperties = {
  fontSize: 16,
  color: "rgba(255,255,255,0.9)",
};
