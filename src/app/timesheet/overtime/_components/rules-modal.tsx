"use client";

import { BookOutlined, BulbOutlined, CheckOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Space, theme, Timeline, Typography } from "antd";
import React from "react";

interface RulesModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onAccept: () => void;
}

/**
 * Modal แสดงกฎระเบียบและขั้นตอนการขอทำงานล่วงเวลา
 */
const RulesModal: React.FC<RulesModalProps> = ({
  visible,
  setVisible,
  onAccept,
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      title={
        <Space>
          <BookOutlined /> คู่มือและระเบียบการเบิกจ่ายค่าล่วงเวลา
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button
          key="confirm"
          type="primary"
          size="large"
          onClick={onAccept}
          style={{ fontWeight: 600 }}
        >
          ยอมรับและปฏิบัติตามระเบียบ
        </Button>,
      ]}
      centered
      width={680}
    >
      <Flex vertical align="center" gap={40} style={{ paddingBlock: 48 }}>
        {/* ไอคอนประกอบหัว Modal */}
        <div style={{ position: "relative" }}>
          <Flex
            justify="center"
            align="center"
            style={{
              width: 120,
              height: 120,
              borderRadius: 40,
              background: token.colorPrimaryBg,
              transform: "rotate(10deg)",
            }}
          >
            <BulbOutlined
              style={{
                fontSize: 56,
                color: token.colorPrimary,
                transform: "rotate(-10deg)",
              }}
            />
          </Flex>
          <Flex
            justify="center"
            align="center"
            style={{
              position: "absolute",
              bottom: -5,
              right: -5,
              width: 32,
              height: 32,
              background: token.colorSuccess,
              borderRadius: "50%",
              border: `4px solid ${token.colorBgContainer}`,
            }}
          >
            <CheckOutlined style={{ color: token.colorWhite, fontSize: 14 }} />
          </Flex>
        </div>

        {/* หัวข้อและคำอธิบาย */}
        <Flex vertical align="center" gap={8}>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 600 }}>
            โปรดศึกษาระเบียบการ
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{ textAlign: "center", maxWidth: 460 }}
          >
            พนักงานทุกท่านต้องปฏิบัติตามแนวทางที่บริษัทกำหนด
            เพื่อความถูกต้องรวดเร็วในการเบิกจ่ายผลตอบแทน
          </Typography.Text>
        </Flex>

        {/* ขั้นตอนการขอ OT */}
        <Flex style={{ width: "100%", paddingInline: 40 }}>
          <Timeline
            mode="left"
            items={[
              {
                label: "ขั้นตอนที่ 1",
                color: "blue",
                children: "ได้รับมอบหมายภารกิจจากหัวหน้าทีมงานโดยตรง",
              },
              {
                label: "ขั้นตอนที่ 2",
                color: "green",
                children:
                  "ลงบันทึกเวลาปฏิบัติงานในระบบ SB Helper ทันทีหลังจบงาน",
              },
              {
                label: "ขั้นตอนที่ 3",
                color: "orange",
                children: "ตรวจสอบยอดชั่วโมงงานให้ตรงกับหน้างานจริง",
              },
              {
                label: "ขั้นตอนที่ 4",
                color: "cyan",
                children: "ฝ่ายบุคคล (HR) ตรวจสอบและอนุมัติจ่ายในงวดถัดไป",
              },
            ]}
          />
        </Flex>

        <Button
          type="link"
          size="large"
          onClick={() =>
            window.open(
              "https://docs.google.com/document/d/12eEuCzFtCxE3C_CfhkGZ9J8yo3jiKVD2uANYBMXXnUE/edit?tab=t.0",
              "_blank",
            )
          }
          style={{ fontWeight: 600 }}
        >
          ดูระเบียบการบริษัทฉบับสมบูรณ์
        </Button>
      </Flex>
    </Modal>
  );
};

export default RulesModal;
