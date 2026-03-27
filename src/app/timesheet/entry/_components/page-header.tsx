"use client";

import {
  AlertFilled,
  BookOutlined,
  CloudOutlined,
  MoonOutlined,
  MoreOutlined,
  PlusOutlined,
  ReadOutlined,
  RocketOutlined,
  SafetyCertificateFilled,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Divider,
  Dropdown,
  Flex,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  admin_name: string;
  admin_id?: number;
  on_add_click: () => void;
  on_my_work_click: () => void;
  on_guide_click: () => void;
  monthly_summary?: any[];
}

/**
 * ส่วนหัวของหน้า (Header Section) สำหรับแสดงคำทักทายและปุ่มจัดการหลัก
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  admin_name,
  admin_id,
  on_add_click,
  on_my_work_click,
  on_guide_click,
  monthly_summary = [],
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { Text, Title } = Typography;

  // ค้นหาวันที่กรอกไม่ครบใน 7 วันล่าสุด
  const incompleteDays = useMemo(() => {
    if (!monthly_summary?.length) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) =>
      dayjs()
        .subtract(i + 1, "day")
        .format("YYYY-MM-DD"),
    );

    return last7Days
      .filter((dateKey) => {
        const record = monthly_summary.find(
          (s) => dayjs(s.dateKey).format("YYYY-MM-DD") === dateKey,
        );
        const isWeekend =
          dayjs(dateKey).day() === 0 || dayjs(dateKey).day() === 6;

        // ถ้าเป็นวันทำงานแต่ไม่มี record หรือชั่วโมงไม่ครบ 8
        if (!isWeekend) {
          return !record || record.totalHours < 8;
        }
        return false;
      })
      .map((d) => dayjs(d).format("D MMM"));
  }, [monthly_summary]);

  // คำทักทายตามช่วงเวลา
  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12)
      return t("timesheet_entry_page.good_morning", "สวัสดีตอนเช้า");
    if (hour < 17)
      return t("timesheet_entry_page.good_afternoon", "สวัสดีตอนบ่าย");
    return t("timesheet_entry_page.good_evening", "สวัสดีตอนเย็น");
  }, [t]);

  // Icon ตามช่วงเวลา
  const timeIcon = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12) return <SunOutlined style={{ color: token.colorWarning }} />;
    if (hour < 18) return <CloudOutlined style={{ color: token.colorInfo }} />;
    return <MoonOutlined style={{ color: token.colorInfo }} />;
  }, [token]);

  return (
    <Card
      styles={{ body: { padding: token.paddingLG } }}
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: `0 4px 12px ${token.colorShadowQuaternary}`,
      }}
    >
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={token.paddingLG}
      >
        <Flex vertical gap={token.marginXS} style={{ flex: 1 }}>
          <Space align="center" size={token.marginSM}>
            <Flex align="center" justify="center" style={{ fontSize: 32 }}>
              {timeIcon}
            </Flex>
            <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
              {greeting}, คุณ{admin_name}
            </Title>
          </Space>

          <Space split={<Text type="secondary">-</Text>} wrap>
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              {t(
                "timesheet_entry_page.manage_your_work_time_here",
                "จัดการเวลาทำงานของคุณได้ที่นี่",
              )}
            </Text>
            <Text type="success" style={{ fontSize: token.fontSizeLG }}>
              {t(
                "timesheet_entry_page.ready_to_work",
                "พร้อมลุยงานวันนี้หรือยัง?",
              )}{" "}
              <RocketOutlined />
            </Text>
          </Space>

          <Flex align="center" gap={token.marginSM} wrap="wrap">
            {admin_id && (
              <Flex
                align="center"
                gap={token.marginSM}
                style={{
                  width: "fit-content",
                  background: token.colorFillAlter,
                  padding: `${token.paddingXXS}px ${token.paddingSM}px`,
                  borderRadius: token.borderRadiusSM,
                  border: `1px dashed ${token.colorBorder}`,
                }}
              >
                <Space split={<Divider type="vertical" />}>
                  <Space size={token.paddingXXS}>
                    <SafetyCertificateFilled
                      style={{ color: token.colorSuccess, fontSize: 14 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      admin_id: <Text strong>{admin_id}</Text>
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t(
                      "timesheet_entry_page.connected_from_profile",
                      "ข้อมูลเชื่อมต่อจาก Profile",
                    )}
                  </Text>
                </Space>
              </Flex>
            )}

            {incompleteDays.length > 0 && (
              <Tooltip
                title={`วันที่ยังกรอกไม่ครบ: ${incompleteDays.join(", ")}`}
              >
                <Tag
                  icon={<AlertFilled />}
                  color="warning"
                  style={{
                    borderRadius: 12,
                    padding: "0 12px",
                    cursor: "help",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(250, 173, 20, 0.15)",
                  }}
                >
                  กรอกเวลาไม่ครบ {incompleteDays.length} วัน (ใน 7 วันล่าสุด)
                </Tag>
              </Tooltip>
            )}
          </Flex>
        </Flex>

        <Space size={token.marginMD} wrap>
          <Button
            size="large"
            icon={<BookOutlined />}
            onClick={on_guide_click}
            style={{
              height: 48,
              borderRadius: token.borderRadiusLG,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${token.colorBorder}`,
              background: token.colorBgContainer,
            }}
          >
            {t("timesheet_entry_page.guide", "คู่มือการลงเวลา")}
          </Button>

          <Tooltip title={t("timesheet_entry_page.my_work", "งานของฉัน")}>
            <Badge
              count={t("timesheet_entry_page.new", "ใหม่")}
              color={token.colorInfo}
              offset={[-5, 5]}
            >
              <Button
                size="large"
                shape="circle"
                icon={<UserOutlined />}
                onClick={on_my_work_click}
                style={{
                  height: 48,
                  width: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </Badge>
          </Tooltip>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={on_add_click}
            style={{
              height: 48,
              borderRadius: token.borderRadiusLG * 2,
              fontWeight: 600,
              paddingInline: token.paddingLG * 1.5,
              boxShadow: `0 4px 10px ${token.colorPrimary}40`,
            }}
          >
            {t("timesheet_entry_page.log_time", "ลงเวลาทำงาน")}
          </Button>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: "guide",
                  label: t(
                    "timesheet_entry_page.view_guide_modal",
                    "คู่มือและข้อควรปฏิบัติ",
                  ),
                  icon: <ReadOutlined />,
                  onClick: on_guide_click,
                },
              ],
            }}
          >
            <Button
              size="large"
              shape="circle"
              icon={<MoreOutlined />}
              style={{
                height: 48,
                width: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Dropdown>
        </Space>
      </Flex>
    </Card>
  );
};
