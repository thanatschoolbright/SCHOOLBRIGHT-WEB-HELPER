"use client";

import {
  selectFilteredRecords,
  useTimesheetAllStore,
} from "@/app/timesheet/all/_stores/timesheet-all-store";
import {
  CopyOutlined,
  DownOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import { Button, Dropdown, Flex, MenuProps, Space, theme } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { useExportHandlers } from "../hooks/use-export-handlers.data";

/**
 * Action buttons ด้านบนตาราง: คัดลอก, Auto-fill, รายงาน, Export
 */
export const TableActions: React.FC = () => {
  const { token } = theme.useToken();
  const router = useRouter();

  const metadata = useTimesheetAllStore((s) => s.metadata);
  const openModal = useTimesheetAllStore((s) => s.openModal);
  const filteredRecords = useTimesheetAllStore(selectFilteredRecords);

  const { exportLoading } = useAppSelector((state) => state.timesheetAll);
  const { requestExportAll } = useExportHandlers();

  // ส่งออกข้อมูลที่กรองแล้วเป็น CSV โดยไม่ต้องผ่าน API
  const requestExportCSV = useCallback(() => {
    if (filteredRecords.length === 0) {
      toast.error("ไม่มีข้อมูลในตาราง");
      return;
    }
    const headers = [
      "ลำดับ",
      "ชื่อ-นามสกุล",
      "ชื่อเล่น",
      "รหัสพนักงาน",
      "ตำแหน่ง",
      "แผนก",
      "อีเมล",
      "ชั่วโมงที่บันทึก",
      "ชั่วโมงที่ต้องการ",
      "ชั่วโมงที่ขาด",
      "เปอร์เซ็นต์",
      "สถานะ",
    ];
    const rows = filteredRecords.map((rec, idx) => [
      idx + 1,
      rec.full_name,
      rec.nickname ?? "",
      rec.employee_code ?? "",
      rec.position,
      rec.department,
      rec.email ?? "",
      rec.total_hours,
      rec.required_hours,
      rec.hours_gap,
      `${rec.completion_rate}%`,
      rec.status_label,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet_${dayjs().format("YYYY-MM-DD_HH-mm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`ส่งออก CSV สำเร็จ (${filteredRecords.length} รายการ)`);
  }, [filteredRecords]);

  // คัดลอกสรุปรายงานไปยัง Clipboard สำหรับวาง Discord
  const requestCopyReportToDiscord = useCallback(() => {
    if (filteredRecords.length === 0) {
      toast.error("ไม่มีข้อมูลในตาราง");
      return;
    }

    const title = `รายงานไทม์ชีท ${
      metadata?.range?.label_th ? `ประจำ${metadata.range.label_th}` : ""
    }`;
    const body = filteredRecords
      .map((rec, index) => {
        const gapText =
          rec.hours_gap > 0 ? ` (!) ขาด ${rec.hours_gap} ชม.` : " (v) ครบ";
        return `${index + 1}. ${rec.full_name} (${rec.nickname || "-"}) | ${
          rec.total_hours
        }/${rec.required_hours} ชม.${gapText}`;
      })
      .join("\n");

    navigator.clipboard
      .writeText(`${title}\n${"=".repeat(30)}\n${body}`)
      .then(() => toast.success("คัดลอกรายงานลง Clipboard สำเร็จ"))
      .catch(() => toast.error("ไม่สามารถคัดลอกข้อมูลได้"));
  }, [filteredRecords, metadata]);

  const reportMenuItems: MenuProps["items"] = [
    {
      key: "capturable",
      label: <Space>รายงานแคปทรัพย์สิน</Space>,
      icon: <ProjectOutlined />,
      onClick: () => router.push("/timesheet/all/report/capturable"),
    },
    {
      key: "daily-description",
      label: "รายงานการลงเวลาประจำวัน",
      icon: <FileTextOutlined />,
      onClick: () => router.push("/timesheet/all/description"),
    },
    {
      key: "migrate-project",
      label: "รายงานการโอนย้ายเวลา",
      icon: <SwapOutlined />,
      onClick: () => router.push("/timesheet/all/report/migrate-project"),
    },
  ];

  const exportMenuItems: MenuProps["items"] = [
    {
      key: "4",
      label: "Export Audit Report (Template 4)",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => openModal("exportModal4"),
    },
    { type: "divider" },
    {
      key: "csv",
      label: "ส่งออก CSV (ตารางปัจจุบัน)",
      icon: <FileTextOutlined style={{ color: token.colorWarning }} />,
      onClick: requestExportCSV,
    },
    { type: "divider" },
    {
      key: "all",
      label: "Export All Records (CSV/Excel)",
      icon: <FileTextOutlined style={{ color: token.colorInfo }} />,
      onClick: requestExportAll,
      disabled: exportLoading,
    },
  ];

  return (
    <Flex gap={12}>
      <Button
        icon={<CopyOutlined />}
        onClick={requestCopyReportToDiscord}
        shape="round"
      >
        คัดลอก (Discord)
      </Button>
      <Button
        icon={<ThunderboltOutlined />}
        onClick={() => openModal("autoFillModal")}
        shape="round"
      >
        Auto-fill
      </Button>
      <Dropdown menu={{ items: reportMenuItems }}>
        <Button icon={<FileTextOutlined />} shape="round">
          รายงานตรวจสอบ <DownOutlined style={{ fontSize: 10 }} />
        </Button>
      </Dropdown>
      <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          loading={exportLoading}
          shape="round"
        >
          ส่งออก Excel <DownOutlined style={{ fontSize: 10 }} />
        </Button>
      </Dropdown>
    </Flex>
  );
};
