"use client";

import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  FileTextOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getUserById } from "@helpers/local_storage/user.storage";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Table,
  Tag,
  theme,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import React, { useMemo } from "react";
import { useOvertimeTableColumns } from "../hooks/overtime-table-columns.hook";
import type { OvertimeRecord, PaginationState } from "../types/overtime.types";

const { Text, Title } = Typography;

interface OvertimeTableProps {
  dataSource: OvertimeRecord[];
  isLoading: boolean;
  paginationState: PaginationState;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setProcessedRecordItems: (items: Set<React.Key>) => void;
  isBatchProcessing: boolean;
  processedRecordItems: Set<React.Key>;
  onTableChange: (pagination: any, filters: any) => void;
  deleteOvertimeRecord: (overtimeRecordId?: string | number) => void;
  approveOvertimeRecord: (
    overtimeRecordId?: string | number,
    selectedStatus?: string,
  ) => void;
  sendEmailToHRDepartment: (overtimeRecordId?: string | number) => void;
  fetchOvertimeRequestDetail: (overtimeRecordId: string | number) => void;
  setIsDetailModalVisible: (visible: boolean) => void;
  navigationRouter: any;
  onExport: () => void;
}

export const OvertimeTable: React.FC<OvertimeTableProps> = ({
  dataSource,
  isLoading,
  paginationState,
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedRecordItems,
  isBatchProcessing,
  processedRecordItems,
  onTableChange,
  deleteOvertimeRecord,
  approveOvertimeRecord,
  sendEmailToHRDepartment,
  fetchOvertimeRequestDetail,
  navigationRouter,
  onExport,
}) => {
  // เรียกใช้ Hook สำหรับ Columns
  const columns = useOvertimeTableColumns({
    processedItems: processedRecordItems,
    deleteOvertime: deleteOvertimeRecord,
    approveOvertime: approveOvertimeRecord,
    sendEmailToHR: sendEmailToHRDepartment,
    fetchOvertimeDetail: fetchOvertimeRequestDetail,
    router: navigationRouter,
  });

  const { token } = theme.useToken();

  // ส่วนขยายแสดงรายละเอียดงานภายในตาราง (Expanded Row)
  const expandedRowRender = (record: any) => {
    const descriptions = record.descriptions || [];
    const totalHours = descriptions.reduce(
      (sum: number, desc: any) => sum + Number(desc.duration || 0),
      0,
    );

    if (descriptions.length === 0) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            background: token.colorFillAlter,
            borderRadius: "0 0 12px 12px",
          }}
        >
          <Empty
            description="ไม่พบข้อมูลรายละเอียดการปฏิบัติงาน"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          padding: "24px",
          background: token.colorBgContainer, // Use container background
          borderRadius: "0 0 12px 12px",
          borderTop: `1px solid ${token.colorSplit}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Space size="middle">
            <div
              style={{
                background: token.colorPrimary,
                padding: "8px",
                borderRadius: "8px",
              }}
            >
              <SolutionOutlined style={{ color: "#fff", fontSize: "18px" }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                รายละเอียดงานที่ปฏิบัติ
              </Title>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ข้อมูลบันทึกรายกิจกรรม (Timeline)
              </Text>
            </div>
            <Badge
              count={descriptions.length}
              style={{ backgroundColor: token.colorPrimary }}
            />
          </Space>

          <Tooltip title="รวมเวลาปฏิบัติงานทั้งหมดในใบคำขอนี้">
            <div
              style={{
                background: token.colorBgElevated,
                padding: "8px 16px",
                borderRadius: "20px",
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Space>
                <ClockCircleOutlined style={{ color: token.colorPrimary }} />
                <Text strong>รวมเวลาทั้งหมด:</Text>
                <Text type="danger" strong style={{ fontSize: "16px" }}>
                  {totalHours.toFixed(2)} ชม.
                </Text>
              </Space>
            </div>
          </Tooltip>
        </div>

        <Timeline
          mode="left"
          items={descriptions.map((desc: any, index: number) => {
            const hasTimeRange = desc.start_date && desc.end_date;
            const startTime = hasTimeRange
              ? dayjs(desc.start_date)
              : desc.date
                ? dayjs(desc.date)
                : null;
            const endTime = hasTimeRange ? dayjs(desc.end_date) : null;
            const assigneeUser = getUserById(desc.assignee);

            return {
              color: "blue",
              label: (
                <div style={{ paddingRight: "12px" }}>
                  <Text strong style={{ color: token.colorPrimary }}>
                    ลำดับที่ {index + 1}
                  </Text>
                  {startTime && (
                    <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                      <CalendarOutlined />{" "}
                      {startTime.locale("th").format("DD MMM BBBB")}
                    </div>
                  )}
                  {hasTimeRange && (
                    <Tag
                      color="processing"
                      style={{ marginTop: "4px", borderRadius: "10px" }}
                    >
                      {startTime?.format("HH:mm")} - {endTime?.format("HH:mm")}
                    </Tag>
                  )}
                </div>
              ),
              children: (
                <Card
                  hoverable
                  size="small"
                  style={{
                    marginBottom: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                  styles={{ body: { padding: "12px 16px" } }}
                >
                  <Descriptions column={{ xs: 1, sm: 1, md: 2 }} size="small">
                    <Descriptions.Item
                      label={
                        <Text type="secondary">
                          <FileTextOutlined /> เนื้องาน
                        </Text>
                      }
                      span={2}
                    >
                      <Text strong>
                        {desc.description || "ไม่ได้ระบุรายละเอียด"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={
                        <Text type="secondary">
                          <ClockCircleOutlined /> ระยะเวลา
                        </Text>
                      }
                    >
                      <Badge
                        color="blue"
                        text={`${Number(desc.duration || 0).toFixed(
                          2,
                        )} ชั่วโมง`}
                      />
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={
                        <Text type="secondary">
                          <UserOutlined /> ผู้ได้รับมอบหมาย
                        </Text>
                      }
                    >
                      <Space>
                        <Avatar
                          size="small"
                          src={
                            assigneeUser?.profile_image ||
                            assigneeUser?.image_profile
                          }
                          icon={<UserOutlined />}
                        />
                        <Text>
                          {assigneeUser
                            ? `${assigneeUser.firstname} ${assigneeUser.lastname}`
                            : desc.assignee_name || desc.assignee || "-"}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ),
            };
          })}
        />
      </div>
    );
  };

  const enhancedDataSource = useMemo(() => {
    return dataSource.map((record) => ({
      ...record,
      totalHours: (record.descriptions || []).reduce(
        (sum: number, desc: any) => sum + Number(desc.duration || 0),
        0,
      ),
      descriptionCount: (record.descriptions || []).length,
    }));
  }, [dataSource]);

  return (
    <div>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <Text strong>รายการคำขอทำงานล่วงเวลา</Text>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={onExport}
            style={{ borderRadius: "8px" }}
          >
            ส่งออกรายการ
          </Button>
        }
        className="border-none shadow-sm overflow-hidden"
        styles={{ body: { padding: 16 } }}
      >
        <Table
          columns={columns}
          dataSource={enhancedDataSource}
          rowKey="id"
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) => (
              <Tooltip
                title={expanded ? "ปิดรายละเอียด" : "ดูรายละเอียดเนื้องาน"}
              >
                <div
                  onClick={(e) => onExpand(record, e)}
                  style={{
                    cursor: "pointer",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "6px",
                    background: expanded
                      ? token.colorError
                      : token.colorPrimary,
                    color: "#fff",
                    transition: "all 0.3s",
                  }}
                >
                  {expanded ? (
                    <ArrowRightOutlined rotate={90} />
                  ) : (
                    <ArrowRightOutlined />
                  )}
                </div>
              </Tooltip>
            ),
            rowExpandable: (record) =>
              !!(record.descriptions && record.descriptions.length > 0),
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => {
              setSelectedRowKeys(keys);
              setProcessedRecordItems(new Set());
            },
            getCheckboxProps: () => ({ disabled: isBatchProcessing }),
          }}
          pagination={{
            current: paginationState.current,
            pageSize: paginationState.pageSize,
            total: paginationState.total,
            showSizeChanger: true,
            position: ["bottomRight"],
            showTotal: (total, range) => (
              <Space>
                <Text type="secondary">
                  แสดง {range[0]}-{range[1]} จากทั้งหมด
                </Text>
                <Tag color="blue" style={{ borderRadius: "10px" }}>
                  {total} รายการ
                </Tag>
              </Space>
            ),
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          loading={isLoading}
          onChange={onTableChange}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>ไม่พบข้อมูลการขอ OT ในช่วงเวลาที่เลือก</span>
                }
              />
            ),
            triggerDesc: "คลิกเพื่อเรียงจากมากไปน้อย",
            triggerAsc: "คลิกเพื่อเรียงจากน้อยไปมาก",
            cancelSort: "คลิกเพื่อยกเลิกการเรียงลำดับ",
          }}
          onRow={(record) => ({
            style: {
              background: selectedRowKeys.includes(record.id)
                ? token.colorPrimaryBg
                : undefined,
              transition: "background 0.3s",
            },
          })}
        />
      </Card>
    </div>
  );
};
