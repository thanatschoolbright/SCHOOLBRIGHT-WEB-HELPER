"use client";

import {
  BookOutlined,
  FileTextOutlined,
  RightOutlined,
  SafetyCertificateFilled,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Modal, Space, Tag, theme, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

interface GuideModalProps {
  /** สถานะการเปิด/ปิด Modal */
  open: boolean;
  /** ฟังก์ชันเมื่อปิด Modal */
  onCancel: () => void;
}

/**
 * Modal แสดงคู่มือและนโยบายการลงเวลา (Timesheet Guide)
 */
export const GuideModal: React.FC<GuideModalProps> = ({ open, onCancel }) => {
  const { token } = theme.useToken();

  const sections = [
    {
      title: "นโยบายการบันทึกต้นทุน (Capitalization Policy)",
      icon: <FileTextOutlined style={{ color: token.colorPrimary }} />,
      links: [
        {
          label: "SB-TS-DOC-001 - นโยบายการบันทึกต้นทุนการพัฒนาซอฟต์แวร์",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?usp=sharing",
          tag: "Core Policy",
        },
      ],
    },
    {
      title: "แนวทางและการปฏิบัติ (Guidelines)",
      icon: <BookOutlined style={{ color: token.colorInfo }} />,
      links: [
        {
          label: "การลงเวลาและแนวทางปฏิบัติทั่วไป",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.7kqb7kp659j6",
        },
      ],
    },
    {
      title: "คำแนะนำแยกตามตำแหน่ง (Role-based Guide)",
      icon: <TeamOutlined style={{ color: token.colorSuccess }} />,
      links: [
        {
          label: "สำหรับตำแหน่ง SA / BA / PM",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.zebafthx8gwb",
        },
        {
          label: "สำหรับตำแหน่ง UX / UI",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.qxwspf2j73ob",
        },
        {
          label: "สำหรับตำแหน่ง Developer",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.nuub3l30rdiw",
        },
        {
          label: "สำหรับตำแหน่ง QA",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.3r566mmsriej",
        },
      ],
    },
    {
      title: "เอกสารเพิ่มเติม",
      icon: <SafetyCertificateFilled style={{ color: token.colorWarning }} />,
      links: [
        {
          label: "เอกสารการยินยอมทำระบบทามชีท",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.be5eobh0l5dp",
        },
      ],
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="close"
          onClick={onCancel}
          type="primary"
          size="large"
          style={{ borderRadius: 8 }}
        >
          เข้าใจแล้ว
        </Button>,
      ]}
      width={700}
      centered
      title={
        <Space size={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: token.colorPrimaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
          </div>
          <Flex vertical gap={0}>
            <Title level={4} style={{ margin: 0 }}>
              คู่มือการลงเวลาทำงาน (Timesheet Guide)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              กรุณาศึกษาข้อมูลเพื่อให้การลงเวลาถูกต้องตามนโยบายบริษัท
            </Text>
          </Flex>
        </Space>
      }
    >
      <div style={{ marginTop: 24 }}>
        <Flex vertical gap={24}>
          {sections.map((section, idx) => (
            <div key={idx}>
              <Space style={{ marginBottom: 12 }}>
                {section.icon}
                <Text strong style={{ fontSize: 16 }}>
                  {section.title}
                </Text>
              </Space>
              <Flex vertical gap={10}>
                {section.links.map((link, lIdx) => (
                  <Card
                    key={lIdx}
                    size="small"
                    hoverable
                    styles={{ body: { padding: "12px 16px" } }}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorFillAlter,
                    }}
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <Flex justify="space-between" align="center">
                      <Space size={12}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: token.colorBgContainer,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1px solid ${token.colorBorderSecondary}`,
                          }}
                        >
                          <BookOutlined
                            style={{
                              fontSize: 14,
                              color: token.colorTextSecondary,
                            }}
                          />
                        </div>
                        <Text style={{ fontWeight: 500 }}>{link.label}</Text>
                      </Space>
                      <Space>
                        {(link as any).tag && (
                          <Tag
                            color="blue"
                            bordered={false}
                            style={{ margin: 0 }}
                          >
                            {(link as any).tag}
                          </Tag>
                        )}
                        <RightOutlined
                          style={{
                            color: token.colorTextQuaternary,
                            fontSize: 12,
                          }}
                        />
                      </Space>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </div>
          ))}
        </Flex>
      </div>
    </Modal>
  );
};
