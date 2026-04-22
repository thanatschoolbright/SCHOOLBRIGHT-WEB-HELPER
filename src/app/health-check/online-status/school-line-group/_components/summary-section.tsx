import {
  BankOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import { Col, Row, theme } from "antd";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";

/**
 * ส่วนแสดงการ์ดสรุปข้อมูล
 */
export const SummarySection = () => {
  const { token } = theme.useToken();
  const { pagination, items } = useSchoolLineGroupStore();

  // คำนวณสรุปจากข้อมูลใน Store ตามมาตรฐาน
  const hasTokenCount = items.filter(
    (i) => !!i.LineNotificationAccessToken,
  ).length;
  const uniqueSchools = new Set(items.map((i) => i.SchoolId).filter(Boolean))
    .size;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="รายการทั้งหมด"
          value={pagination.total}
          unit="รายการ"
          icon={<UnorderedListOutlined />}
          color={token.colorPrimary}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="โรงเรียน (หน้านี้)"
          value={uniqueSchools}
          unit="โรงเรียน"
          icon={<BankOutlined />}
          color="#722ed1"
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="มี Token (หน้านี้)"
          value={hasTokenCount}
          unit="รายการ"
          icon={<SendOutlined />}
          color="#06C755"
        />
      </Col>
    </Row>
  );
};
