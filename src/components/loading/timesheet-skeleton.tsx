import React from "react";
import { 
  Card, 
  Skeleton, 
  Space,
  theme 
} from "antd";

//** Interface สำหรับ Props ของ TimesheetTableSkeleton */
interface TimesheetTableSkeletonProps {
  /** จำนวนแถวที่ต้องการแสดง */
  rows?: number;
}

//** Component Skeleton สำหรับตาราง Timesheet */
const TimesheetTableSkeleton: React.FC<TimesheetTableSkeletonProps> = ({ 
  rows = 8 
}) => {
  const { token } = theme.useToken();

  return (
    <Card
      title={<Skeleton.Input style={{ width: 200 }} />}
      style={{
        borderRadius: token.borderRadiusLG,
      }}
      styles={{
        header: {
          borderBottom: `1px solid ${token.colorBorder}`,
        },
      }}
    >
      <div style={{ padding: token.paddingLG }}>
        {/* สร้าง Skeleton Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div 
            key={index} 
            style={{ 
              marginBottom: token.marginMD,
              padding: token.paddingSM,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
            }}
          >
            <Space size="middle" style={{ width: '100%' }}>
              {/* วันที่ */}
              <Skeleton.Button size="small" style={{ width: 80 }} />
              
              {/* ชื่อโปรเจ็กต์ */}
              <Skeleton.Input size="small" style={{ width: 150 }} />
              
              {/* ชื่อฟีเจอร์ */}
              <Skeleton.Input size="small" style={{ width: 120 }} />
              
              {/* ชื่อผู้จัดทำ */}
              <Skeleton.Input size="small" style={{ width: 100 }} />
              
              {/* สถานะ */}
              <Skeleton.Button size="small" style={{ width: 60 }} />
              
              {/* ชั่วโมง */}
              <Skeleton.Button size="small" style={{ width: 50 }} />
              
              {/* คำอธิบาย */}
              <Skeleton.Input size="small" style={{ width: 200 }} />
              
              {/* ปุ่มจัดการ */}
              <Skeleton.Button size="small" style={{ width: 80 }} />
            </Space>
          </div>
        ))}
        
        {/* Pagination Skeleton */}
        <div 
          style={{ 
            marginTop: token.marginLG,
            textAlign: 'right',
            paddingTop: token.paddingMD,
            borderTop: `1px solid ${token.colorBorder}`,
          }}
        >
          <Space>
            <Skeleton.Button size="small" style={{ width: 60 }} />
            <Skeleton.Button size="small" style={{ width: 30 }} />
            <Skeleton.Button size="small" style={{ width: 30 }} />
            <Skeleton.Button size="small" style={{ width: 30 }} />
            <Skeleton.Button size="small" style={{ width: 60 }} />
          </Space>
        </div>
      </div>
    </Card>
  );
};

//** Component Skeleton สำหรับ Header */
const TimesheetHeaderSkeleton: React.FC = () => {
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
          <Skeleton.Input 
            style={{ 
              width: 400, 
              height: 40,
              marginBottom: token.marginXS 
            }} 
          />
          <Skeleton.Input 
            style={{ 
              width: 300, 
              height: 20 
            }} 
          />
        </div>
        
        {/* สถิติ */}
        <Space size="large" style={{ marginTop: token.marginMD }}>
          <div>
            <Skeleton.Input style={{ width: 80, height: 16 }} />
            <Skeleton.Input 
              style={{ 
                width: 100, 
                height: 20, 
                marginTop: token.marginXXS,
                display: "block" 
              }} 
            />
          </div>
          <div>
            <Skeleton.Input style={{ width: 60, height: 16 }} />
            <Skeleton.Input 
              style={{ 
                width: 80, 
                height: 20, 
                marginTop: token.marginXXS,
                display: "block" 
              }} 
            />
          </div>
          <div>
            <Skeleton.Input style={{ width: 90, height: 16 }} />
            <Skeleton.Input 
              style={{ 
                width: 70, 
                height: 20, 
                marginTop: token.marginXXS,
                display: "block" 
              }} 
            />
          </div>
        </Space>
      </Space>
    </Card>
  );
};

//** Component Skeleton สำหรับ Controls */
const TimesheetControlsSkeleton: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      style={{
        borderRadius: token.borderRadius,
        marginBottom: token.marginMD,
      }}
    >
      <Space size="small" wrap>
        <Skeleton.Button style={{ width: 180 }} />
        <Skeleton.Button style={{ width: 100 }} />
        <Skeleton.Button style={{ width: 120 }} />
        <Skeleton.Button style={{ width: 140 }} />
      </Space>
    </Card>
  );
};

export { 
  TimesheetTableSkeleton,
  TimesheetHeaderSkeleton,
  TimesheetControlsSkeleton 
};