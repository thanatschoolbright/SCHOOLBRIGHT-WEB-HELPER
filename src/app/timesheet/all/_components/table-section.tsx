"use client";

import {
  selectFilteredRecords,
  selectTotalSummary,
  useTimesheetAllStore,
} from "@/app/timesheet/all/_state/timesheet-all-store";
import { useShallow } from "zustand/react/shallow";
import {
  InfoCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Card,
  Flex,
  Space,
  theme,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import { TimesheetTable } from "../components/timesheet-table.component";
import { TableActions } from "./table-actions";

const { Text } = Typography;

/**
 * ส่วนแสดงตารางไทม์ชีท รวม header, actions, table, footer summary และ notes
 * ดึง state ทั้งหมดจาก useTimesheetAllStore
 */
export const TableSection: React.FC = () => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  const { loading, metadata, fetchSummary, closeModal, autoFillOpen } =
    useTimesheetAllStore(
      useShallow((s) => ({
        loading: s.loading,
        metadata: s.metadata,
        fetchSummary: s.fetchSummary,
        closeModal: s.closeModal,
        autoFillOpen: s.modalFlags.autoFillModal,
      })),
    );

  // ใช้ useShallow เพื่อป้องกัน infinite loop จากการ return array/object ใหม่ทุก render
  const filteredRecords = useTimesheetAllStore(useShallow(selectFilteredRecords));
  const { total, required } = useTimesheetAllStore(useShallow(selectTotalSummary));

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <Flex vertical gap={16}>
        {/* Header ของตาราง + Action buttons */}
        <Flex justify="space-between" align="center">
          <Space size={12}>
            <UnorderedListOutlined
              style={{ fontSize: "1rem", color: token.colorPrimary }}
            />
            <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              ตารางสรุปบันทึกเวลาทำงาน
            </Typography.Title>
            {!loading && (
              <Badge
                count={filteredRecords.length}
                style={{ backgroundColor: token.colorInfo }}
              />
            )}
          </Space>
          <TableActions />
        </Flex>

        {/* ตารางข้อมูล */}
        <TimesheetTable
          records={filteredRecords}
          loading={loading}
          metadata={metadata}
          onRefetch={fetchSummary}
          autoFillOpen={autoFillOpen}
          onAutoFillClose={() => closeModal("autoFillModal")}
        />

        {/* Footer: สรุปผลรวมเวลาทำงาน */}
        {!loading && filteredRecords.length > 0 && (
          <Flex
            justify="flex-end"
            align="center"
            style={{
              padding: "16px 24px",
              background: token.colorFillAlter,
              borderRadius: token.borderRadiusLG,
              border: `1px dashed ${token.colorBorder}`,
            }}
          >
            <Space size={16}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                สรุปผลรวมเวลาทำงาน:
              </Text>
              <Flex align="baseline" gap={4}>
                <Typography.Title
                  level={4}
                  style={{ margin: 0, fontWeight: 800, color: token.colorPrimary }}
                >
                  {total.toLocaleString()}
                </Typography.Title>
                <Text
                  strong
                  style={{ fontSize: 18, color: token.colorTextDescription, opacity: 0.5 }}
                >
                  /
                </Text>
                <Typography.Title
                  level={4}
                  style={{ margin: 0, fontWeight: 800, color: token.colorTextDescription }}
                >
                  {required.toLocaleString()}
                </Typography.Title>
                <Text type="secondary" style={{ marginLeft: 4, fontWeight: 500 }}>
                  ชั่วโมง
                </Text>
              </Flex>
            </Space>
          </Flex>
        )}

        {/* Footer: Notes จาก metadata */}
        {metadata?.notes && (
          <Flex
            gap={8}
            style={{
              padding: "12px 16px",
              background: token.colorFillAlter,
              borderRadius: token.borderRadius,
            }}
          >
            <InfoCircleOutlined style={{ color: token.colorInfo, marginTop: 4 }} />
            <Text type="secondary" italic style={{ fontSize: 13 }}>
              {t("timesheet_page.notes_label")}: {metadata.notes}
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};
