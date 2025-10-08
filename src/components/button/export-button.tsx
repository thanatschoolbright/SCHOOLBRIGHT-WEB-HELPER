import { Button, Dropdown, Space } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import type { ButtonProps, MenuProps } from "antd";

export interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** สถานะการโหลดของการส่งออก */
  isExporting?: boolean;
  /** ฟังก์ชันสำหรับเปิด modal ส่งออก template */
  onExportTemplate?: () => void;
  /** ฟังก์ชันสำหรับส่งออกข้อมูลทั้งหมด */
  onExportAll?: () => void;
}

/**
 * ปุ่มส่งออกข้อมูลที่มี dropdown เมนูให้เลือกประเภทการส่งออก
 */
export const ExportButton = ({
  isExporting = false,
  onExportTemplate,
  onExportAll,
  ...props
}: ExportButtonProps) => {
  //** รายการเมนูสำหรับการส่งออกข้อมูล */
  const exportMenuItems: MenuProps['items'] = [
    ...(onExportTemplate ? [{
      key: "export-template",
      label: "Template Timesheet",
      onClick: onExportTemplate,
    }] : []),
    ...(onExportAll ? [{
      key: "export-all", 
      label: "ส่งออกข้อมูลทั้งหมด",
      onClick: onExportAll,
    }] : []),
  ];

  return (
    <Dropdown
      menu={{
        items: exportMenuItems,
      }}
    >
      <Button
        type="primary"
        size="middle"
        icon={<ExportOutlined />}
        loading={isExporting}
        {...props}
      >
        ส่งออกข้อมูล
      </Button>
    </Dropdown>
  );
};

export default ExportButton;