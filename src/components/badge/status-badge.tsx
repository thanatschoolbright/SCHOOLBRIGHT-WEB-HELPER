import { Tag } from "antd";
import type { TagProps } from "antd";

export interface StatusBadgeProps extends Omit<TagProps, 'color'> {
  /** สถานะของงาน */
  status: string;
  /** การแปลสถานะเป็นข้อความที่แสดง */
  statusLabelMap?: Record<string, string>;
}

/**
 * แสดงป้ายสถานะงานที่มีสีสันตามประเภทของสถานะ
 * เช่น DONE = สีเขียว, IN_PROGRESS = สีส้ม, REVIEW = สีน้ำเงิน
 */
export const StatusBadge = ({ 
  status, 
  statusLabelMap = {},
  ...props 
}: StatusBadgeProps) => {
  //** การกำหนดสีตามสถานะของงาน */
  const getStatusColor = (status: string): TagProps['color'] => {
    switch (status) {
      case "DONE":
        return "green";
      case "IN_PROGRESS": 
        return "orange";
      case "REVIEW":
        return "blue";
      case "CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <Tag 
      color={getStatusColor(status)} 
      {...props}
    >
      {statusLabelMap[status] ?? status}
    </Tag>
  );
};

export default StatusBadge;