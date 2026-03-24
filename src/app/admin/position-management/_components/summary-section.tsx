import SummaryCard from "@/components/card/summary-card";
import {
  CheckCircleOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Col, Row, theme } from "antd";
import { usePositionStore } from "../_state/position-store";

/**
 * ส่วนสรุปข้อมูลสถิติ ด้านบนของหน้า
 */
export const SummarySection = () => {
  const { token } = theme.useToken();
  const { positions, loading } = usePositionStore();

  const totalPositions = positions.length;
  const activePositions = positions.filter((p) => p.is_active).length;
  const totalEmployees = positions.reduce(
    (acc, curr) => acc + (curr._count?.users || 0),
    0,
  );

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      <Col xs={24} sm={12} md={8}>
        <SummaryCard
          title="จำนวนตำแหน่งทั้งหมด"
          value={totalPositions}
          unit="รายการ"
          icon={<SolutionOutlined />}
          color={token.colorPrimary}
          isLoading={loading}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <SummaryCard
          title="ตำแหน่งที่เปิดใช้งาน"
          value={activePositions}
          unit="รายการ"
          icon={<CheckCircleOutlined />}
          color={token.colorSuccess}
          isLoading={loading}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <SummaryCard
          title="จำนวนพนักงานรวม"
          value={totalEmployees}
          unit="คน"
          icon={<UserOutlined />}
          color={token.colorInfo}
          isLoading={loading}
        />
      </Col>
    </Row>
  );
};
