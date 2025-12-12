"use client";

import React, { useMemo } from "react";
import {
  Card,
  Table,
  Empty,
  Tag,
  Space,
  Typography,
  Tooltip,
  Badge,
  Descriptions,
  Timeline,
} from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { OvertimeRecord, PaginationState } from "../types/overtime.types";
import { useOvertimeTableColumns } from "../hooks/overtime-table-columns.hook";
import dayjs from "dayjs";
import { getUserById } from "@helpers/local_storage/user.storage";

const { Text, Title } = Typography;

interface OvertimeTableProps {
  dataSource: OvertimeRecord[];
  columns: any[];
  loading: boolean;
  paginationState: PaginationState;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setProcessedItems: (items: Set<React.Key>) => void;
  batchProcessing: boolean;
  processedItems: Set<React.Key>;
  handleTableChange: (pagination: any, filters: any) => void;
  deleteOvertime: (id?: string | number) => void;
  approveOvertime: (id?: string | number, status?: string) => void;
  sendEmailToHR: (id?: string | number) => void;
  fetchOvertimeDetail: (id: string | number) => void;
  setDetailVisible: (visible: boolean) => void;
  router: any;
}

export const OvertimeTable: React.FC<OvertimeTableProps> = ({
  dataSource,
  loading,
  paginationState,
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedItems,
  batchProcessing,
  processedItems,
  handleTableChange,
  deleteOvertime,
  approveOvertime,
  sendEmailToHR,
  fetchOvertimeDetail,
  router,
}) => {
  const { t } = useTranslation();
  const columns = useOvertimeTableColumns({
    processedItems,
    deleteOvertime,
    approveOvertime,
    sendEmailToHR,
    fetchOvertimeDetail,
    router,
  });

  const expandedRowRender = (record: any) => {
    const descriptions = record.descriptions || [];
    const totalHours = descriptions.reduce(
      (sum: number, desc: any) => sum + Number(desc.duration || 0),
      0
    );

    if (descriptions.length === 0) {
      return (
        <div className="p-4 text-center">
          <Text type="secondary">{t("overtime_page.no_descriptions")}</Text>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <Space>
            <FileTextOutlined className="text-blue-500" />
            <Title level={5} className="m-0">
              {t("overtime_page.work_details")}
            </Title>
            <Badge
              count={descriptions.length}
              style={{ backgroundColor: "#1890ff" }}
            />
          </Space>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <ClockCircleOutlined className="text-blue-600" />
            <Text strong className="text-blue-600">
              {t("overtime_page.total_hours")}: {totalHours.toFixed(2)}{" "}
              {t("overtime_page.hours")}
            </Text>
          </div>
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
              dot: (
                <div className="bg-blue-500 w-3 h-3 rounded-full border-2  shadow-md" />
              ),
              label: (
                <div className="text-right pr-4">
                  <div className="font-semibold text-gray-700">
                    {t("overtime_page.item")} {index + 1}
                  </div>
                  {hasTimeRange && startTime && endTime ? (
                    <>
                      <div className="text-xs text-gray-500">
                        <CalendarOutlined className="mr-1" />
                        {startTime.format("DD/MM/YYYY")}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {startTime.format("HH:mm")} - {endTime.format("HH:mm")}
                      </div>
                    </>
                  ) : startTime ? (
                    <div className="text-xs text-gray-500">
                      <CalendarOutlined className="mr-1" />
                      {startTime.format("DD/MM/YYYY")}
                    </div>
                  ) : null}
                </div>
              ),
              children: (
                <Card
                  size="small"
                  className="mb-2 shadow-sm hover:shadow-md transition-shadow"
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item
                      label={
                        <Space>
                          <FileTextOutlined className="text-gray-400" />
                          <Text type="secondary">
                            {t("overtime_page.description")}
                          </Text>
                        </Space>
                      }
                    >
                      <Text strong>{desc.description || "-"}</Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={
                        <Space>
                          <ClockCircleOutlined className="text-blue-400" />
                          <Text type="secondary">
                            {t("overtime_page.duration")}
                          </Text>
                        </Space>
                      }
                    >
                      <Tag color="blue" className="font-semibold">
                        {Number(desc.duration || 0).toFixed(2)}{" "}
                        {t("overtime_page.hours")}
                      </Tag>
                    </Descriptions.Item>

                    {assigneeUser && (
                      <Descriptions.Item
                        label={
                          <Space>
                            <UserOutlined className="text-green-400" />
                            <Text type="secondary">
                              {t("overtime_page.assignee")}
                            </Text>
                          </Space>
                        }
                      >
                        <Space>
                          <Badge status="success" />
                          <Text>
                            {assigneeUser.firstname} {assigneeUser.lastname}
                          </Text>
                          {assigneeUser.position && (
                            <Text type="secondary" className="text-xs">
                              ({assigneeUser.position})
                            </Text>
                          )}
                        </Space>
                      </Descriptions.Item>
                    )}
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
        0
      ),
      descriptionCount: (record.descriptions || []).length,
    }));
  }, [dataSource]);

  return (
    <Card
      className="shadow-sm rounded-xl overflow-hidden"
      bodyStyle={{ padding: 0 }}
    >
      <Table
        columns={columns}
        dataSource={enhancedDataSource}
        rowKey="id"
        expandable={{
          expandedRowRender,
          expandIcon: ({ expanded, onExpand, record }) => (
            <Tooltip
              title={
                expanded
                  ? t("overtime_page.collapse_details")
                  : t("overtime_page.expand_details")
              }
            >
              <div
                onClick={(e) => onExpand(record, e)}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 transition-colors"
              >
                {expanded ? (
                  <span className="text-blue-500 font-bold">−</span>
                ) : (
                  <span className="text-blue-500 font-bold">+</span>
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
            setProcessedItems(new Set());
          },
          getCheckboxProps: () => ({ disabled: batchProcessing }),
        }}
        pagination={{
          current: paginationState.current,
          pageSize: paginationState.pageSize,
          total: paginationState.total,
          showSizeChanger: true,
          showTotal: (total) => (
            <Space>
              <CheckCircleOutlined className="text-green-500" />
              <Text strong>{t("overtime_page.total_items", { total })}</Text>
            </Space>
          ),
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        locale={{
          emptyText: (
            <Empty
              description={t("overtime_page.no_data")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        rowClassName={(record) =>
          selectedRowKeys.includes(record.id)
            ? "bg-blue-50"
            : "hover:bg-gray-50"
        }
      />
    </Card>
  );
};
