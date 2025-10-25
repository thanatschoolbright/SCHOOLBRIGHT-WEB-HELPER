import { Button, Dropdown, Space } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import type { ButtonProps, MenuProps } from "antd";

export interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  isExporting?: boolean;
  onExportTemplate?: () => void;
  onExportTemplate2?: () => void;
  onExportAll?: () => void;
}

/**
 * ปุ่มส่งออกข้อมูลที่มี dropdown เมนูให้เลือกประเภทการส่งออก
 */
export const ExportButton = ({
  isExporting = false,
  onExportTemplate,
  onExportTemplate2,
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
    ...(onExportTemplate2 ? [{
      key: "export-template-2",
      label: "Template Timesheet 2",
      onClick: onExportTemplate2,
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