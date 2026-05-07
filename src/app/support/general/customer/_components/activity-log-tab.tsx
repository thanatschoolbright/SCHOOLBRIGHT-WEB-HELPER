"use client";

import { ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Badge, Button, Card, Flex, Tag, Timeline, Tooltip, Typography } from "antd";
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

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  CUSTOMER_UNLOCK_ONE: { label: "ปลดล็อกรายเดียว", color: "blue" },
  CUSTOMER_UNLOCK_ALL: { label: "ปลดล็อกทั้งหมด", color: "orange" },
};

// Tab แสดงประวัติการกระทำของ CS/Admin ในหน้าจัดการลูกค้า
export default function ActivityLogTab() {
  const { activityLogs, activityPagination, isLoadingLogs, fetchActivityLogs } =
    useCustomerStore();

  useEffect(() => {
    fetchActivityLogs(1);
  }, [fetchActivityLogs]);

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Flex align="center" gap={8}>
          <ClockCircleOutlined style={{ fontSize: "1rem" }} />
          <Typography.Text strong>ประวัติการดำเนินการ</Typography.Text>
          <Badge count={activityPagination.total} overflowCount={9999} color="blue" />
        </Flex>
        <Tooltip title="รีเฟรช">
          <Button
            icon={<ReloadOutlined />}
            size="small"
            shape="circle"
            loading={isLoadingLogs}
            onClick={() => fetchActivityLogs(activityPagination.page)}
          />
        </Tooltip>
      </Flex>

      {activityLogs.length === 0 && !isLoadingLogs ? (
        <Typography.Text type="secondary">ยังไม่มีประวัติการดำเนินการ</Typography.Text>
      ) : (
        <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
          <Timeline
            mode="left"
            items={activityLogs.map((log) => {
              const action = ACTION_LABEL[log.endpoint] ?? { label: log.endpoint, color: "default" };
              const timeStr = dayjs(log.request_time).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss");
              const relStr = dayjs(log.request_time).fromNow();
              const body = log.request_body ?? {};

              return {
                color: action.color,
                label: (
                  <Tooltip title={timeStr}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {relStr}
                    </Typography.Text>
                  </Tooltip>
                ),
                children: (
                  <Card
                    size="small"
                    styles={{ body: { padding: "8px 12px" } }}
                    style={{ marginBottom: 2 }}
                  >
                    <Flex vertical gap={4}>
                      <Flex gap={8} align="center">
                        <Tag color={action.color} style={{ margin: 0, fontWeight: 600 }}>
                          {action.label}
                        </Tag>
                        <Typography.Text style={{ fontSize: 12 }}>{timeStr}</Typography.Text>
                      </Flex>

                      <Flex gap={12} wrap="wrap">
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          ผู้ดำเนินการ: <strong>{body.operator_name ?? log.called_by ?? "-"}</strong>
                          {body.operator_employee_code ? ` (${body.operator_employee_code})` : ""}
                        </Typography.Text>

                        {log.endpoint === "CUSTOMER_UNLOCK_ONE" && (
                          <>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              ลูกค้า: <strong>{body.username ?? "-"}</strong>
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              โรงเรียน ID: <strong>{body.school_id ?? "-"}</strong>
                            </Typography.Text>
                          </>
                        )}

                        {log.endpoint === "CUSTOMER_UNLOCK_ALL" && (
                          <>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              จำนวน: <strong>{body.total_unlocked ?? 0} บัญชี</strong>
                            </Typography.Text>
                            {body.company_id && (
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                โรงเรียน ID: <strong>{body.company_id}</strong>
                              </Typography.Text>
                            )}
                          </>
                        )}
                      </Flex>
                    </Flex>
                  </Card>
                ),
              };
            })}
          />
        </div>
      )}

      {activityPagination.total_pages > 1 && (
        <Flex justify="center" gap={8} style={{ marginTop: 12 }}>
          <Button
            size="small"
            disabled={activityPagination.page <= 1}
            onClick={() => fetchActivityLogs(activityPagination.page - 1)}
          >
            หน้าก่อน
          </Button>
          <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: "24px" }}>
            {activityPagination.page} / {activityPagination.total_pages}
          </Typography.Text>
          <Button
            size="small"
            disabled={activityPagination.page >= activityPagination.total_pages}
            onClick={() => fetchActivityLogs(activityPagination.page + 1)}
          >
            หน้าถัดไป
          </Button>
        </Flex>
      )}
    </Card>
  );
}
