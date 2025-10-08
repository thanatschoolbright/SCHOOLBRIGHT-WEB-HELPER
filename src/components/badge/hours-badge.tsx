import { Tag } from "antd";
import type { TagProps } from "antd";

export interface HoursBadgeProps extends Omit<TagProps, 'color'> {
  /** จำนวนชั่วโมงที่ทำงาน */
  hours: number;
}

/**
 * แสดงป้ายจำนวนชั่วโมงที่มีสีสันตามระดับ
 * >= 8 ชม. = สีแดง, < 4 ชม. = สีเขียว, อื่นๆ = สีทอง
 */
export const HoursBadge = ({ 
  hours, 
  ...props 
}: HoursBadgeProps) => {
  //** การกำหนดสีตามจำนวนชั่วโมงทำงาน */
  const getHourTagColor = (hours: number): TagProps['color'] => {
    if (hours >= 8) return "red";
    if (hours < 4) return "green"; 
    return "gold";
  };

  return (
    <Tag 
      color={getHourTagColor(hours)} 
      {...props}
    >
      {hours}
    </Tag>
  );
};

export default HoursBadge;