"use client";

import React from "react";
import { Typography, Space, Button, Row, Col, theme } from "antd";
import {
  AreaChartOutlined,
  PieChartOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export const TimesheetHeader: React.FC = () => {
  const { t } = useTranslation("translate");
  const router = useRouter();
  const { token } = theme.useToken();

  return (
    <div className="mb-6">
      {/* ใช้ Row และ Col เพื่อจัดการ Grid System */}
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        {/* ฝั่งซ้าย: Icon และ Title */}
        <Col xs={24} md={12}>
          <Space align="center" size="middle">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
              <AreaChartOutlined className="text-2xl text-white" />
            </div>
            <div>
              <Typography.Title
                level={2}
                style={{ margin: 0, fontSize: "24px", lineHeight: 1.2 }}
              >
                {t("timesheet_page.title")}
              </Typography.Title>
              <Typography.Text type="secondary" className="text-base">
                {t("timesheet_page.subtitle")}
              </Typography.Text>
            </div>
          </Space>
        </Col>

        {/* ฝั่งขวา: Action Buttons */}
        <Col xs={24} md={12} style={{ textAlign: "right" }}>
          <Space wrap size="small">
            <Button
              icon={<PieChartOutlined />}
              size="large"
              onClick={() => router.push("/timesheet/all/report/capturable")}
              className="shadow-sm"
              style={{
                borderRadius: 8,
                height: 42,
              }}
            >
              รายงานตามทรัพย์สิน
            </Button>

            <Button
              type="primary"
              icon={<FileSearchOutlined />}
              size="large"
              onClick={() =>
                router.push("/timesheet/all/report/not-entry/today")
              }
              className="shadow-md shadow-blue-100"
              style={{
                borderRadius: 8,
                height: 42,
              }}
            >
              รายงานผู้ไม่กรอก (วันนี้)
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
