"use client";

import { ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect } from "react";
import { useCustomerStore } from "../_stores/use-customer-store";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

const ACTION_LABEL: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  CUSTOMER_UNLOCK_ONE: {
    label: "ปลดล็อกรายเดียว",
    color: "#1890ff",
    icon: <ClockCircleOutlined />,
  },
  CUSTOMER_UNLOCK_ALL: {
    label: "ปลดล็อกทั้งหมด",
    color: "#faad14",
    icon: <ClockCircleOutlined />,
  },
};

// Tab แสดงประวัติการกระทำของ CS/Admin ในหน้าจัดการลูกค้า
export default function ActivityLogTab() {
  const { activityLogs, activityPagination, isLoadingLogs, fetchActivityLogs } =
    useCustomerStore();
  const { token } = theme.useToken();

  useEffect(() => {
    fetchActivityLogs(1);
  }, [fetchActivityLogs]);

  return (
    <Card
      styles={{ body: { padding: "20px" } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${token.colorPrimary}10`,
              color: token.colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <ClockCircleOutlined />
          </div>
          <Flex vertical gap={0}>
            <Typography.Text strong style={{ fontSize: 16 }}>
              ประวัติการดำเนินการ
            </Typography.Text>
            <Typography.Text
              style={{ fontSize: 12, color: token.colorTextTertiary }}
            >
              รวมทั้งหมด {activityPagination.total} รายการ
            </Typography.Text>
          </Flex>
        </Flex>
        <Tooltip title="รีเฟรชข้อมูล">
          <Button
            icon={<ReloadOutlined />}
            loading={isLoadingLogs}
            onClick={() => fetchActivityLogs(activityPagination.page)}
            style={{ borderRadius: 8 }}
          />
        </Tooltip>
      </Flex>

      {activityLogs.length === 0 && !isLoadingLogs ? (
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ padding: "40px 0", opacity: 0.5 }}
        >
          <ClockCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <Typography.Text type="secondary">
            ยังไม่มีประวัติการดำเนินการ
          </Typography.Text>
        </Flex>
      ) : (
        <div
          style={{
            maxHeight: 600,
            overflowY: "auto",
            paddingRight: 8,
            paddingLeft: 4,
          }}
        >
          <Timeline
            mode="left"
            items={activityLogs.map((log) => {
              const action = ACTION_LABEL[log.endpoint] ?? {
                label: log.endpoint,
                color: token.colorTextSecondary,
                icon: <ClockCircleOutlined />,
              };
              const timeStr = dayjs(log.request_time)
                .tz("Asia/Bangkok")
                .format("DD/MM/YYYY HH:mm:ss");
              const relStr = dayjs(log.request_time).fromNow();
              const body = log.request_body ?? {};

              return {
                color: action.color,
                children: (
                  <div style={{ marginBottom: 16, marginLeft: 20 }}>
                    <div style={{ marginBottom: 12 }}>
                      <Typography.Text
                        style={{
                          fontSize: 12,
                          color: token.colorTextTertiary,
                          display: "block",
                          marginTop: "",
                        }}
                      >
                        {relStr} · {timeStr}
                      </Typography.Text>
                    </div>
                    <Card
                      size="small"
                      styles={{ body: { padding: "12px 16px" } }}
                      style={{
                        borderRadius: 12,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      }}
                    >
                      <Flex vertical gap={10}>
                        <Flex justify="space-between" align="center">
                          <Tag
                            color={action.color}
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              borderRadius: 6,
                              paddingInline: 8,
                            }}
                          >
                            {action.label}
                          </Tag>
                          <Typography.Text
                            style={{
                              fontSize: 11,
                              color: token.colorTextQuaternary,
                              fontFamily: "monospace",
                            }}
                          >
                            #{log.id?.toString().slice(-6) ?? "N/A"}
                          </Typography.Text>
                        </Flex>

                        <div
                          style={{
                            padding: "10px",
                            background: token.colorBgContainer,
                            borderRadius: 8,
                            border: `1px solid ${token.colorBorderSecondary}80`,
                          }}
                        >
                          <Flex vertical gap={6}>
                            <Flex align="center" gap={8}>
                              <Typography.Text
                                style={{
                                  fontSize: 13,
                                  color: token.colorTextSecondary,
                                }}
                              >
                                ผู้ดำเนินการ:
                              </Typography.Text>
                              <Typography.Text strong style={{ fontSize: 13 }}>
                                {body.operator_name ?? log.called_by ?? "-"}
                                {body.operator_employee_code
                                  ? ` (${body.operator_employee_code})`
                                  : ""}
                              </Typography.Text>
                            </Flex>

                            <div
                              style={{
                                height: 1,
                                background: token.colorBorderSecondary,
                                opacity: 0.5,
                                margin: "2px 0",
                              }}
                            />

                            <Flex gap={16} wrap="wrap">
                              {log.endpoint === "CUSTOMER_UNLOCK_ONE" && (
                                <>
                                  <Flex vertical>
                                    <Typography.Text
                                      type="secondary"
                                      style={{ fontSize: 11, marginBottom: -2 }}
                                    >
                                      ลูกค้าที่ถูกปลดล็อก
                                    </Typography.Text>
                                    <Typography.Text
                                      strong
                                      style={{ fontSize: 13 }}
                                    >
                                      {body.username ?? "-"}
                                    </Typography.Text>
                                  </Flex>
                                  <Flex vertical>
                                    <Typography.Text
                                      type="secondary"
                                      style={{ fontSize: 11, marginBottom: -2 }}
                                    >
                                      โรงเรียน ID
                                    </Typography.Text>
                                    <Typography.Text
                                      strong
                                      style={{ fontSize: 13 }}
                                    >
                                      {body.school_id ?? "-"}
                                    </Typography.Text>
                                  </Flex>
                                </>
                              )}

                              {log.endpoint === "CUSTOMER_UNLOCK_ALL" && (
                                <>
                                  <Flex vertical>
                                    <Typography.Text
                                      type="secondary"
                                      style={{ fontSize: 11, marginBottom: -2 }}
                                    >
                                      จำนวนที่ปลดล็อก
                                    </Typography.Text>
                                    <Typography.Text
                                      strong
                                      style={{
                                        fontSize: 13,
                                        color: token.colorWarningActive,
                                      }}
                                    >
                                      {body.total_unlocked ?? 0} บัญชี
                                    </Typography.Text>
                                  </Flex>
                                  {body.company_id && (
                                    <Flex vertical>
                                      <Typography.Text
                                        type="secondary"
                                        style={{
                                          fontSize: 11,
                                          marginBottom: -2,
                                        }}
                                      >
                                        โรงเรียน ID
                                      </Typography.Text>
                                      <Typography.Text
                                        strong
                                        style={{ fontSize: 13 }}
                                      >
                                        {body.company_id}
                                      </Typography.Text>
                                    </Flex>
                                  )}
                                </>
                              )}
                            </Flex>
                          </Flex>
                        </div>
                      </Flex>
                    </Card>
                  </div>
                ),
              };
            })}
          />
        </div>
      )}

      {activityPagination.total_pages > 1 && (
        <Flex
          justify="center"
          align="center"
          gap={12}
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button
            size="small"
            disabled={activityPagination.page <= 1}
            onClick={() => fetchActivityLogs(activityPagination.page - 1)}
            style={{ borderRadius: 6 }}
          >
            หน้าก่อน
          </Button>
          <div
            style={{
              padding: "2px 12px",
              background: token.colorFillSecondary,
              borderRadius: 12,
            }}
          >
            <Typography.Text strong style={{ fontSize: 12 }}>
              {activityPagination.page} / {activityPagination.total_pages}
            </Typography.Text>
          </div>
          <Button
            size="small"
            disabled={activityPagination.page >= activityPagination.total_pages}
            onClick={() => fetchActivityLogs(activityPagination.page + 1)}
            style={{ borderRadius: 6 }}
          >
            หน้าถัดไป
          </Button>
        </Flex>
      )}
    </Card>
  );
}
