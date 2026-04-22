import {
  BankOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import { Col, Row, theme } from "antd";
import { useSchoolLineGroupStore } from "../_state/use-school-line-group-store";
import { motion } from "framer-motion";

/**
 * ส่วนแสดงการ์ดสรุปข้อมูล
 * เพิ่ม Animation แบบ Stagger เพื่อให้การ์ดค่อยๆ ปรากฏขึ้นทีละใบ
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <motion.div variants={item}>
            <SummaryCard
              title="รายการทั้งหมด"
              value={pagination.total}
              unit="รายการ"
              icon={<UnorderedListOutlined />}
              color={token.colorPrimary}
            />
          </motion.div>
        </Col>
        <Col xs={24} sm={8}>
          <motion.div variants={item}>
            <SummaryCard
              title="โรงเรียน (หน้านี้)"
              value={uniqueSchools}
              unit="โรงเรียน"
              icon={<BankOutlined />}
              color="#722ed1"
            />
          </motion.div>
        </Col>
        <Col xs={24} sm={8}>
          <motion.div variants={item}>
            <SummaryCard
              title="มี Token (หน้านี้)"
              value={hasTokenCount}
              unit="รายการ"
              icon={<SendOutlined />}
              color="#06C755"
            />
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};
