"use client";

import {
  CheckCircleFilled,
  CloseCircleOutlined,
  DiscordOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Divider, Drawer, Flex, Tag, theme, Typography } from "antd";
import React from "react";
import { useDescriptionStore } from "../_stores/description-store";

const { Text, Title } = Typography;

// ── Row แสดง email recipient 1 คน ──
const RecipientRow: React.FC<{ email: string; index: number }> = ({ email, index }) => {
  const { token } = theme.useToken();
  const [user, domain] = email.split("@");
  return (
    <Flex
      align="center"
      gap={12}
      style={{
        padding: "10px 16px",
        borderRadius: token.borderRadius,
        background: token.colorSuccessBg,
        border: `1px solid ${token.colorSuccessBorder}`,
      }}
    >
      {/* Index badge */}
      <Flex
        align="center"
        justify="center"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: token.colorSuccess,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{index + 1}</Text>
      </Flex>

      {/* Email */}
      <Flex vertical gap={1} style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: 600, color: token.colorText }}>
          <Text style={{ color: token.colorPrimary, fontWeight: 700 }}>{user}</Text>
          <Text style={{ color: token.colorTextDescription }}>@{domain}</Text>
        </Text>
      </Flex>

      <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 16 }} />
    </Flex>
  );
};

// ── Channel status card ──
const ChannelCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  success: boolean;
  error?: string;
  count?: number;
}> = ({ icon, label, sublabel, success, error, count }) => {
  const { token } = theme.useToken();
  return (
    <Flex
      align="center"
      gap={14}
      style={{
        padding: "16px 20px",
        borderRadius: token.borderRadiusLG,
        background: success ? token.colorSuccessBg : token.colorErrorBg,
        border: `1.5px solid ${success ? token.colorSuccessBorder : token.colorErrorBorder}`,
        flex: 1,
      }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: success ? token.colorSuccess : token.colorError,
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: { fontSize: 20, color: "#fff" },
        })}
      </Flex>
      <Flex vertical gap={2} style={{ flex: 1 }}>
        <Flex align="center" gap={8}>
          <Text style={{ fontSize: 14, fontWeight: 700, color: token.colorText }}>{label}</Text>
          {count !== undefined && (
            <Tag
              color={success ? "success" : "error"}
              style={{ fontSize: 11, margin: 0, lineHeight: "18px" }}
            >
              {count} คน
            </Tag>
          )}
        </Flex>
        <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
          {error ? error : sublabel}
        </Text>
      </Flex>
      {success ? (
        <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 20 }} />
      ) : (
        <CloseCircleOutlined style={{ color: token.colorError, fontSize: 20 }} />
      )}
    </Flex>
  );
};

// ====================================================================
// Delivery Result Drawer
// ====================================================================

export const DeliveryResultDrawer: React.FC = () => {
  const { token } = theme.useToken();

  const notifyResult = useDescriptionStore((s) => s.notifyResult);
  const notifyResultDrawerOpen = useDescriptionStore((s) => s.notifyResultDrawerOpen);
  const closeNotifyResultDrawer = useDescriptionStore((s) => s.closeNotifyResultDrawer);

  const emailAccepted: string[] = notifyResult?.email?.accepted ?? [];
  const emailSuccess = notifyResult?.email?.success ?? false;
  const discordSuccess = notifyResult?.discord?.success ?? false;
  const summary = notifyResult?.summary;

  const totalSuccess = (emailSuccess ? 1 : 0) + (discordSuccess ? 1 : 0);

  return (
    <Drawer
      open={notifyResultDrawerOpen}
      onClose={closeNotifyResultDrawer}
      title={null}
      width={480}
      styles={{
        body: { padding: 0 },
        header: { display: "none" },
      }}
    >
      {/* Custom header */}
      <Flex
        vertical
        style={{
          padding: "28px 28px 20px",
          background: `linear-gradient(135deg, ${token.colorSuccessBg}, ${token.colorBgContainer})`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: token.colorSuccess,
              flexShrink: 0,
            }}
          >
            <CheckCircleFilled style={{ fontSize: 22, color: "#fff" }} />
          </Flex>
          <Flex vertical gap={2}>
            <Title level={5} style={{ margin: 0, color: token.colorSuccess }}>
              ผลการส่งแจ้งเตือน
            </Title>
            <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
              Daily Timesheet Notification Report
            </Text>
          </Flex>
        </Flex>

        {/* Summary pills */}
        <Flex gap={8} wrap="wrap" style={{ marginTop: 4 }}>
          <Tag
            color="success"
            style={{ borderRadius: 20, fontWeight: 600, fontSize: 12 }}
          >
            ✅ ส่งสำเร็จ {totalSuccess} / 2 ช่องทาง
          </Tag>
          {summary && (
            <>
              <Tag color="blue" style={{ borderRadius: 20, fontSize: 12 }}>
                <TeamOutlined /> {summary.total} คนทั้งหมด
              </Tag>
              <Tag color="green" style={{ borderRadius: 20, fontSize: 12 }}>
                กรอกครบ {summary.completed} คน
              </Tag>
              {summary.incomplete > 0 && (
                <Tag color="red" style={{ borderRadius: 20, fontSize: 12 }}>
                  ยังไม่ครบ {summary.incomplete} คน
                </Tag>
              )}
            </>
          )}
        </Flex>
      </Flex>

      {/* Body */}
      <Flex vertical gap={0} style={{ padding: "24px 28px" }}>

        {/* Channel status */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: token.colorTextDescription,
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: 12,
          }}
        >
          สถานะช่องทางการส่ง
        </Text>
        <Flex gap={12} style={{ marginBottom: 24 }}>
          <ChannelCard
            icon={<MailOutlined />}
            label="Email"
            sublabel={emailSuccess ? `ส่งสำเร็จ ${emailAccepted.length} ที่อยู่` : "ส่งไม่สำเร็จ"}
            success={emailSuccess}
            error={notifyResult?.email?.error}
            count={emailAccepted.length}
          />
          <ChannelCard
            icon={<DiscordOutlined />}
            label="Discord"
            sublabel={discordSuccess ? "ส่ง Webhook สำเร็จ" : "ส่ง Webhook ไม่สำเร็จ"}
            success={discordSuccess}
            error={notifyResult?.discord?.error}
          />
        </Flex>

        {/* Recipients list */}
        {emailAccepted.length > 0 && (
          <>
            <Divider style={{ margin: "0 0 16px" }} />
            <Flex align="center" justify="space-between" style={{ marginBottom: 12 }}>
              <Flex align="center" gap={8}>
                <MailOutlined style={{ color: token.colorPrimary }} />
                <Text style={{ fontSize: 13, fontWeight: 700, color: token.colorText }}>
                  ผู้รับอีเมล
                </Text>
              </Flex>
              <Tag color="blue" style={{ borderRadius: 20, fontSize: 12, margin: 0 }}>
                {emailAccepted.length} ที่อยู่
              </Tag>
            </Flex>
            <Flex vertical gap={8}>
              {emailAccepted.map((email, i) => (
                <RecipientRow key={email} email={email} index={i} />
              ))}
            </Flex>
          </>
        )}

        {/* Summary stats */}
        {summary && (
          <>
            <Divider style={{ margin: "20px 0 16px" }} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextDescription,
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "block",
                marginBottom: 12,
              }}
            >
              สรุปข้อมูลที่ส่ง
            </Text>
            <Flex gap={8}>
              {[
                { label: "พนักงานทั้งหมด", value: summary.total, color: token.colorPrimary, bg: token.colorPrimaryBg, border: token.colorPrimaryBorder },
                { label: "กรอกครบ", value: summary.completed, color: token.colorSuccess, bg: token.colorSuccessBg, border: token.colorSuccessBorder },
                { label: "ยังไม่ครบ", value: summary.incomplete, color: token.colorError, bg: token.colorErrorBg, border: token.colorErrorBorder },
              ].map((stat) => (
                <Flex
                  key={stat.label}
                  vertical
                  align="center"
                  justify="center"
                  gap={4}
                  style={{
                    flex: 1,
                    padding: "16px 8px",
                    borderRadius: token.borderRadiusLG,
                    background: stat.bg,
                    border: `1px solid ${stat.border}`,
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: token.colorTextDescription, textAlign: "center" }}>
                    {stat.label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}

        {/* Date range */}
        {summary?.date_range && (
          <Flex
            align="center"
            gap={8}
            style={{
              marginTop: 20,
              padding: "10px 16px",
              borderRadius: token.borderRadius,
              background: token.colorFillQuaternary,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text style={{ fontSize: 11, color: token.colorTextDescription }}>ช่วงวันที่รายงาน:</Text>
            <Text style={{ fontSize: 12, fontWeight: 600, color: token.colorText }}>
              {summary.date_range}
            </Text>
          </Flex>
        )}

        {/* Footer credit */}
        <Divider style={{ margin: "24px 0 16px" }} />
        <Flex vertical align="center" gap={2}>
          <Text style={{ fontSize: 10, color: token.colorTextDisabled, textTransform: "uppercase", letterSpacing: "1px" }}>
            System Developed by
          </Text>
          <Text style={{ fontSize: 12, fontWeight: 800, color: token.colorTextDescription, letterSpacing: "0.5px" }}>
            THANAT PROMPIRIYA
          </Text>
          <Text style={{ fontSize: 10, color: token.colorTextDisabled }}>
            Head of Technology · SchoolBright Co., Ltd.
          </Text>
        </Flex>
      </Flex>
    </Drawer>
  );
};
