"use client";

import React from "react";
import { Modal, Typography, Space, Divider, Button } from "antd";
import {
  InfoCircleOutlined,
  FileTextOutlined,
  RocketOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <div
          className="flex items-center gap-3 p-4 rounded-t-2xl"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            margin: "-20px -24px 0",
            padding: "24px",
          }}
        >
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <InfoCircleOutlined style={{ color: "#fff", fontSize: "24px" }} />
          </div>
          <div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
              📋 ระเบียบการขอทำงานล่วงเวลา (OT)
            </span>
            <div
              style={{
                fontSize: "13px",
                color: "#fff",
                opacity: 0.9,
                marginTop: 4,
              }}
            >
              กรุณาอ่านและทำความเข้าใจก่อนยื่นคำขอ
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
      closeIcon={<span style={{ color: "#fff", fontSize: "20px" }}>✕</span>}
    >
      <Divider style={{ margin: "0 0 24px 0" }} />

      <div
        className="relative overflow-hidden"
        style={{
          textAlign: "center",
          padding: "32px 24px",
          background: "linear-gradient(135deg, #f093fb10 0%, #f5576c10 100%)",
          borderRadius: "16px",
          margin: "0 -24px 24px",
        }}
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #667eea 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />

        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center justify-center p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
            <span style={{ fontSize: "40px" }}>📖</span>
          </div>

          <Title level={3} style={{ marginBottom: 16, color: "#667eea" }}>
            โปรดอ่านรายละเอียดการขอทำงานล่วงเวลา
          </Title>

          <Paragraph
            style={{
              fontSize: 16,
              marginBottom: 32,
              color: "#666",
              lineHeight: 1.8,
            }}
          >
            การทำงานล่วงเวลาต้องปฏิบัติตามระเบียบที่กำหนดไว้
            <br />
            เพื่อให้การดำเนินการเป็นไปอย่างถูกต้องและโปร่งใส
          </Paragraph>

          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() =>
              window.open(
                "https://docs.google.com/document/d/12eEuCzFtCxE3C_CfhkGZ9J8yo3jiKVD2uANYBMXXnUE/edit?usp=sharing",
                "_blank",
              )
            }
            style={{
              height: 56,
              fontSize: 17,
              fontWeight: 700,
              borderRadius: 16,
              padding: "0 40px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
            }}
            className="hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            📚 คลิกที่นี่เพื่ออ่านระเบียบฉบับเต็ม
          </Button>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <FileTextOutlined />
            <span>เอกสารจะเปิดในแท็บใหม่</span>
          </div>
        </div>
      </div>

      {/* Features list */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
          <span style={{ fontSize: "24px" }}>⏰</span>
          <div>
            <div className="font-semibold text-blue-900 mb-1">ระยะเวลา</div>
            <div className="text-xs text-blue-700">ทำงานตามกำหนด</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
          <span style={{ fontSize: "24px" }}>✅</span>
          <div>
            <div className="font-semibold text-green-900 mb-1">การอนุมัติ</div>
            <div className="text-xs text-green-700">ผ่านหัวหน้างาน</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
          <span style={{ fontSize: "24px" }}>💰</span>
          <div>
            <div className="font-semibold text-purple-900 mb-1">ค่าตอบแทน</div>
            <div className="text-xs text-purple-700">คำนวณตามสูตร</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
          <span style={{ fontSize: "24px" }}>📝</span>
          <div>
            <div className="font-semibold text-orange-900 mb-1">บันทึก</div>
            <div className="text-xs text-orange-700">ระบุรายละเอียด</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
