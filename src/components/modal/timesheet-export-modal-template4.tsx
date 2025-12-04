"use client";
import React, { useMemo, useState } from "react";
import { Modal, Select, Space, Button, Typography } from "antd";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

type Props = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onExport: (payload: { from: string; to: string }) => Promise<void> | void;
};

interface WeekOption {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

const formatWeekOption = (weekStart: dayjs.Dayjs): WeekOption => {
  const weekEnd = weekStart.endOf("isoWeek");
  const label = `สัปดาห์ ${weekStart.format("DD/MM/YYYY")} - ${weekEnd.format(
    "DD/MM/YYYY"
  )}`;
  return {
    label,
    value: weekStart.format("YYYY-MM-DD"),
    startDate: weekStart.format("YYYY-MM-DD"),
    endDate: weekEnd.format("YYYY-MM-DD"),
  };
};

export default function ExportModalTemplate4({
  visible,
  loading,
  onClose,
  onExport,
}: Props) {
  const weeks = useMemo(() => {
    const list: WeekOption[] = [];
    const now = dayjs();
    for (let i = 0; i < 52; i++) {
      const weekStart = now.subtract(i, "week").startOf("isoWeek");
      list.push(formatWeekOption(weekStart));
    }
    return list;
  }, []);

  const [selectedFromWeek, setSelectedFromWeek] = useState<string | undefined>(
    weeks[weeks.length - 1]?.value
  );
  const [selectedToWeek, setSelectedToWeek] = useState<string | undefined>(
    weeks[0]?.value
  );

  const handleExport = async () => {
    if (!selectedFromWeek || !selectedToWeek) return;

    const fromWeek = weeks.find((w) => w.value === selectedFromWeek);
    const toWeek = weeks.find((w) => w.value === selectedToWeek);

    if (!fromWeek || !toWeek) return;

    await onExport({
      from: fromWeek.startDate,
      to: toWeek.endDate,
    });
    onClose();
  };

  return (
    <Modal
      title="Export Template 4 - รายงานสำหรับ Audit"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <Typography.Title level={5}>
            รายงานสำหรับการตรวจสอบ (Audit)
          </Typography.Title>
          <Typography.Text type="secondary">
            รายงานนี้จะแสดงข้อมูลภาพรวมและหลักฐานการลงเวลาแยกตามโครงการย่อย
            พร้อมรหัสโครงการ ประเภทสินทรัพย์ และสัดส่วนการใช้เวลา
            (เลือกเป็นรายสัปดาห์)
          </Typography.Text>
        </div>
        <div>
          <Typography.Text strong>
            เลือกช่วงสัปดาห์ (เริ่มต้น - สิ้นสุด)
          </Typography.Text>
        </div>
        <Space style={{ width: "100%" }} direction="vertical">
          <div>
            <Typography.Text type="secondary">สัปดาห์เริ่มต้น:</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              value={selectedFromWeek}
              onChange={(v) => setSelectedFromWeek(v)}
              options={weeks.map((w) => ({ label: w.label, value: w.value }))}
              placeholder="เลือกสัปดาห์เริ่มต้น"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
          <div>
            <Typography.Text type="secondary">สัปดาห์สิ้นสุด:</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 8 }}
              value={selectedToWeek}
              onChange={(v) => setSelectedToWeek(v)}
              options={weeks.map((w) => ({ label: w.label, value: w.value }))}
              placeholder="เลือกสัปดาห์สิ้นสุด"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
        </Space>
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button type="primary" loading={loading} onClick={handleExport}>
            Export
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
