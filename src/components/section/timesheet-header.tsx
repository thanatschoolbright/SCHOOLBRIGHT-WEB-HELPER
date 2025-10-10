import React from "react";
import { 
  Card, 
  Divider, 
  Space, 
  Typography,
  theme 
} from "antd";

//** Interface สำหรับ Props ของ TimesheetHeader */
interface TimesheetHeaderProps {
  /** ข้อมูลสถิติ (เพิ่มในอนาคต) */
  stats?: {
    totalEntries: number;
    totalHours: number;
    activeProjects: number;
  };
}

//** Component Header สำหรับหน้า Timesheet */
const TimesheetHeader: React.FC<TimesheetHeaderProps> = ({ stats }) => {
  const { token } = theme.useToken();

  return (
    <Card 
      style={{
        borderRadius: token.borderRadiusLG,
        marginBottom: token.marginLG,
      }}
    >
      <Space direction="vertical" size="middle" style={{width: "100%"}}>
        {/* หัวข้อหลัก */}
        <div>
          <Typography.Title 
            level={1} 
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "2.5rem",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            การจัดการลงเวลาทำงาน
          </Typography.Title>
          <Typography.Text 
            type="secondary"
            style={{
              fontSize: token.fontSizeLG,
              lineHeight: 1.5,
              marginTop: token.marginXS,
              display: "block",
            }}
          >
            ระบบติดตาม และจัดการเวลาทำงานของทีม
          </Typography.Text>
        </div>
        
        <Divider style={{ 
          margin: `${token.marginSM}px 0`,
        }} />
        
        {/* สถิติ (ถ้ามี) */}
        {stats && (
          <Space size="large">
            <div>
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                รายการทั้งหมด
              </Typography.Text>
              <Typography.Text 
                strong 
                style={{ 
                  display: "block", 
                  fontSize: token.fontSizeLG,
                  fontWeight: 600,
                }}
              >
                {stats.totalEntries.toLocaleString()} รายการ
              </Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                ชั่วโมงรวม
              </Typography.Text>
              <Typography.Text 
                strong 
                style={{ 
                  display: "block", 
                  fontSize: token.fontSizeLG,
                  fontWeight: 600,
                }}
              >
                {stats.totalHours.toLocaleString()} ชั่วโมง
              </Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                โปรเจ็กต์ที่ใช้งาน
              </Typography.Text>
              <Typography.Text 
                strong 
                style={{ 
                  display: "block", 
                  fontSize: token.fontSizeLG,
                  fontWeight: 600,
                }}
              >
                {stats.activeProjects} โปรเจ็กต์
              </Typography.Text>
            </div>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default TimesheetHeader;