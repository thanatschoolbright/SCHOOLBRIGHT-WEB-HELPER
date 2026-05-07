"use client";

/* SUMMARY: 
  หน้านี้คือ Dashboard สำหรับตรวจสอบสถานะการทำงาน (Heartbeat) ของระบบบอท Cronjob และ Worker ทั้งหมด 
  รองรับ Theme Provider โดยไม่มีการ Hardcode สี Background หรือ Text Color ที่ไม่จำเป็น
*/

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { CallAPI as GET_HEARTBEATS } from "@/stores/actions/health-check/heartbeats/action";
import { ResponseHeartbeats } from "@/stores/type";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Alert,
  Timeline,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  NotificationOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  FieldTimeOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import dayjs from "dayjs";

export type HeartbeatRecord = ResponseHeartbeats["data"]["data"][number];

type SearchableColumnKey = "JobName" | "Description" | "Remarks" | "Status";

type TableColumnConfiguration = ColumnType<HeartbeatRecord> & {
  key: keyof HeartbeatRecord | string;
};

const formatIntervalToHumanReadableString = (minutesInput: number) => {
  const totalMinutes = Number(minutesInput) || 0;
  if (totalMinutes === 1440) return "ทุก 1 วัน (24 ชม.)";
  if (totalMinutes === 60) return "ทุก 1 ชั่วโมง";
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `ทุก ${hours} ชม.${
      remainingMinutes > 0 ? ` ${remainingMinutes} นาที` : ""
    }`;
  }
  return `ทุก ${totalMinutes} นาที`;
};

const checkIfHeartbeatIsDelayed = (
  lastUpdatedTimestamp: string,
  intervalMinutes: number
) => {
  if (!lastUpdatedTimestamp) return true;
  const differenceInMinutes = dayjs().diff(
    dayjs(lastUpdatedTimestamp),
    "minute"
  );
  return differenceInMinutes > intervalMinutes + 10;
};

const checkIfActivityIsRecent = (dateString: string) => {
  if (!dateString) return false;
  return dayjs().diff(dayjs(dateString), "hour") < 1;
};

export default function HeartbeatMonitoringPage() {
  const reduxDispatch = useDispatch<AppDispatch>();
  const heartbeatReduxState = useAppSelector((state) => state.heartbeatReducer);

  const [descriptionForm] = Form.useForm<{ description: string }>();
  const [currentlyEditingRecord, setCurrentlyEditingRecord] =
    useState<HeartbeatRecord | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isTestingDiscordNotification, setIsTestingDiscordNotification] =
    useState(false);
  const searchInputReferences = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const isDataLoading = Boolean(heartbeatReduxState.loading);

  const tableDataSource = useMemo(() => {
    const rawData = heartbeatReduxState?.response?.data?.data;
    return Array.isArray(rawData) ? (rawData as HeartbeatRecord[]) : [];
  }, [heartbeatReduxState?.response?.data?.data]);

  const timelineFeedData = useMemo(() => {
    return [...tableDataSource]
      .sort(
        (firstItem, secondItem) =>
          new Date(secondItem.LastUpdatedTime).getTime() -
          new Date(firstItem.LastUpdatedTime).getTime()
      )
      .slice(0, 10);
  }, [tableDataSource]);

  const dashboardStatistics = useMemo(() => {
    const totalCount = tableDataSource.length;
    const onlineCount = tableDataSource.filter(
      (item) => item.Status === "Online"
    ).length;
    const offlineCount = tableDataSource.filter(
      (item) => item.Status !== "Online"
    ).length;
    return { totalCount, onlineCount, offlineCount };
  }, [tableDataSource]);

  const refreshHeartbeatData = useCallback(async () => {
    try {
      await reduxDispatch(GET_HEARTBEATS()).unwrap();
      toast.success("อัปเดตข้อมูลล่าสุดเรียบร้อย");
    } catch (error: any) {
      toast.error("ไม่สามารถดึงข้อมูลได้", {
        description: error?.message,
      });
    }
  }, [reduxDispatch]);

  useEffect(() => {
    reduxDispatch(GET_HEARTBEATS());
  }, [reduxDispatch]);

  const closeDescriptionEditModal = useCallback(() => {
    setCurrentlyEditingRecord(null);
    descriptionForm.resetFields();
  }, [descriptionForm]);

  const openDescriptionEditModal = useCallback(
    (record: HeartbeatRecord) => {
      setCurrentlyEditingRecord(record);
      setTimeout(() => {
        descriptionForm.setFieldsValue({
          description: record.Description ?? "",
        });
      }, 0);
    },
    [descriptionForm]
  );

  const handleUpdateHeartbeatDescription = useCallback(async () => {
    if (!currentlyEditingRecord) return;

    try {
      setIsSubmittingForm(true);
      const formValues = await descriptionForm.validateFields();
      const response = await fetch(
        `/api/v1/health-check/server/heartbeats/update/${currentlyEditingRecord.ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Description: formValues.description }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      toast.success("บันทึกคำอธิบายเรียบร้อย");
      closeDescriptionEditModal();
      await reduxDispatch(GET_HEARTBEATS());
    } catch (error: any) {
      toast.error("บันทึกไม่สำเร็จ", { description: error?.message });
    } finally {
      setIsSubmittingForm(false);
    }
  }, [
    closeDescriptionEditModal,
    reduxDispatch,
    currentlyEditingRecord,
    descriptionForm,
  ]);

  const handleTestDiscordNotification = useCallback(async () => {
    try {
      setIsTestingDiscordNotification(true);
      const response = await fetch(
        "/api/v1/health-check/server/heartbeats/notification/discord"
      );
      if (!response.ok) throw new Error("Failed");
      toast.success("ส่งแจ้งเตือนเข้า Discord แล้ว");
    } catch (error: any) {
      toast.error("ส่งแจ้งเตือนล้มเหลว");
    } finally {
      setIsTestingDiscordNotification(false);
    }
  }, []);

  const generateColumnSearchProperties = useCallback(
    (
      dataIndex: SearchableColumnKey,
      title: string
    ): TableColumnConfiguration => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div
          style={{ padding: 12 }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Input
            ref={(node) => {
              searchInputReferences.current[dataIndex] = node;
            }}
            placeholder={`ค้นหา ${title}`}
            value={selectedKeys[0]}
            onChange={(event) =>
              setSelectedKeys(event.target.value ? [event.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
            >
              ค้นหา
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                confirm({ closeDropdown: true });
              }}
              size="small"
            >
              ล้าง
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record: HeartbeatRecord) => {
        const rawValue = record[dataIndex as keyof HeartbeatRecord];
        return String(rawValue ?? "")
          .toLowerCase()
          .includes(String(value).toLowerCase());
      },
    }),
    []
  );

  const tableColumns = useMemo<ColumnsType<HeartbeatRecord>>(
    () => [
      {
        title: (
          <Tooltip title="ชื่อทางเทคนิคของ Job ในระบบ">
            ชื่อระบบ/บอท <QuestionCircleOutlined />
          </Tooltip>
        ),
        dataIndex: "JobName",
        width: 250,
        render: (jobName: string, record: HeartbeatRecord) => (
          <div className="flex flex-col">
            <Typography.Text strong>{jobName}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              ID: {record.ID}
            </Typography.Text>
          </div>
        ),
        ...generateColumnSearchProperties("JobName", "ชื่อบอท"),
      },
      {
        title: (
          <Tooltip title="หน้าที่การทำงานของบอท เพื่อให้คนทั่วไปเข้าใจ">
            หน้าที่รับผิดชอบ <QuestionCircleOutlined />
          </Tooltip>
        ),
        dataIndex: "Description",
        render: (description: string, record: HeartbeatRecord) => (
          <div className="group relative">
            {description ? (
              <Typography.Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: "อ่านเพิ่ม" }}
                style={{ margin: 0 }}
              >
                {description}
              </Typography.Paragraph>
            ) : (
              <Typography.Text type="secondary" italic>
                (ยังไม่มีคำอธิบาย)
              </Typography.Text>
            )}
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openDescriptionEditModal(record)}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0"
            >
              แก้ไข
            </Button>
          </div>
        ),
        ...generateColumnSearchProperties("Description", "รายละเอียด"),
      },
      {
        title: (
          <Tooltip title="ความถี่ที่บอทควรจะทำงาน">
            รอบการทำงาน <QuestionCircleOutlined />
          </Tooltip>
        ),
        dataIndex: "Interval",
        width: 150,
        align: "center",
        render: (interval: number, record: HeartbeatRecord) => {
          const isAlwaysRunning = record.Remarks === "Always Running";
          return (
            <div className="flex flex-col items-center">
              <Tag bordered={false} style={{ margin: 0 }}>
                <FieldTimeOutlined />{" "}
                {formatIntervalToHumanReadableString(interval)}
              </Tag>
              {isAlwaysRunning && (
                <Typography.Text
                  type="success"
                  style={{ fontSize: 10, marginTop: 4 }}
                >
                  (ทำงานตลอดเวลา)
                </Typography.Text>
              )}
            </div>
          );
        },
        sorter: (firstItem, secondItem) =>
          firstItem.Interval - secondItem.Interval,
      },
      {
        title: "สถานะ",
        dataIndex: "Status",
        width: 120,
        align: "center",
        render: (status: string) => {
          const isOnline = status === "Online";
          return (
            <Badge
              status={isOnline ? "success" : "error"}
              text={isOnline ? "ปกติ" : "หยุด"}
            />
          );
        },
        filters: [
          { text: "ทำงานปกติ (Online)", value: "Online" },
          { text: "หยุดทำงาน (Offline)", value: "Offline" },
        ],
        onFilter: (value, record) => record.Status === value,
      },
      {
        title: "อัปเดตเมื่อ",
        dataIndex: "LastUpdatedTime",
        width: 180,
        align: "end",
        render: (lastUpdatedTime: string, record: HeartbeatRecord) => {
          const isDelayed = checkIfHeartbeatIsDelayed(
            lastUpdatedTime,
            record.Interval
          );
          return (
            <div className="flex flex-col items-end">
              <Tooltip
                title={dayjs(lastUpdatedTime).format("DD/MM/YYYY HH:mm:ss")}
              >
                <Typography.Text strong>
                  {dayjs(lastUpdatedTime).locale("th").fromNow()}
                </Typography.Text>
              </Tooltip>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(lastUpdatedTime).format("HH:mm")} น.
              </Typography.Text>
              {record.Status === "Online" && isDelayed && (
                <Tag
                  color="warning"
                  style={{ marginTop: 4, marginRight: 0, fontSize: 10 }}
                  bordered={false}
                >
                  <WarningOutlined /> ล่าช้า
                </Tag>
              )}
            </div>
          );
        },
        sorter: (firstItem, secondItem) =>
          new Date(firstItem.LastUpdatedTime).getTime() -
          new Date(secondItem.LastUpdatedTime).getTime(),
        defaultSortOrder: "descend",
      },
    ],
    [generateColumnSearchProperties, openDescriptionEditModal]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* ส่วนหัวของ Dashboard Summary สำหรับดูภาพรวมสถิติ และปุ่มกด Refresh/Test */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <Space>
                  <RobotOutlined />
                  สถานะบอทและการทำงานเบื้องหลัง
                </Space>
              </Typography.Title>
              <Typography.Text type="secondary">
                ตรวจสอบสถานะ Heartbeat ของระบบ Cronjob และ Worker ทั้งหมด
              </Typography.Text>
            </div>
            <Space>
              <Button
                icon={<NotificationOutlined />}
                onClick={handleTestDiscordNotification}
                loading={isTestingDiscordNotification}
              >
                ทดสอบแจ้งเตือน Discord
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={isDataLoading}
                onClick={() => void refreshHeartbeatData()}
              >
                อัปเดตข้อมูล
              </Button>
            </Space>
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="บอททั้งหมด"
                value={dashboardStatistics.totalCount}
                prefix={<RobotOutlined />}
                suffix="ตัว"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="ทำงานปกติ"
                value={dashboardStatistics.onlineCount}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
                suffix="ตัว"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="หยุดทำงาน"
                value={dashboardStatistics.offlineCount}
                valueStyle={{
                  color:
                    dashboardStatistics.offlineCount > 0
                      ? "#cf1322"
                      : "#cf1322",
                }}
                prefix={<CloseCircleOutlined />}
                suffix="ตัว"
              />
            </Col>
          </Row>
        </Card>

        {/* ส่วน Alert แจ้งเตือนเมื่อมีระบบ Offline ให้เห็นชัดเจน */}
        {dashboardStatistics.offlineCount > 0 && (
          <Alert
            message="พบระบบหยุดทำงาน"
            description={`มีบอทจำนวน ${dashboardStatistics.offlineCount} ตัว ที่ไม่มีการส่งสัญญาณ Heartbeat เข้ามาตามกำหนด โปรดตรวจสอบ`}
            type="error"
            showIcon
            closable
          />
        )}

        {/* Layout หลักแบ่งเป็น 2 ส่วน: ตารางข้อมูลรายตัว (ซ้าย) และ Timeline Feed (ขวา) */}
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={16}>
            <Card
              title={
                <Space>
                  <FieldTimeOutlined /> รายละเอียดการทำงานรายตัว
                </Space>
              }
              className="h-full"
            >
              <Table<HeartbeatRecord>
                columns={tableColumns}
                dataSource={tableDataSource}
                loading={isDataLoading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                }}
                rowKey={(record) => String(record.ID)}
              />
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  <Typography.Text strong>
                    ฟีดการทำงานล่าสุด (Live)
                  </Typography.Text>
                </Space>
              }
              className="h-full"
            >
              <Alert
                message={
                  <Space align="start">
                    <ClockCircleOutlined />
                    <span>
                      แสดงลำดับบอทที่เพิ่งส่งสัญญาณเข้ามาล่าสุด 10 อันดับแรก
                    </span>
                  </Space>
                }
                type="info"
                showIcon={false}
                style={{ marginBottom: 16 }}
              />

              <Timeline
                mode="left"
                items={timelineFeedData.map((item) => {
                  const isOnline = item.Status === "Online";
                  const isNew = checkIfActivityIsRecent(item.LastUpdatedTime);

                  return {
                    color: isOnline ? "green" : "red",
                    dot:
                      isNew && isOnline ? (
                        <div className="animate-pulse w-3 h-3 rounded-full bg-green-500 border border-green-200" />
                      ) : undefined,
                    children: (
                      <div className="pb-4 group cursor-default">
                        <div className="flex justify-between items-start">
                          <Typography.Text strong style={{ fontSize: 13 }}>
                            {item.JobName}
                          </Typography.Text>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 11 }}
                          >
                            {dayjs(item.LastUpdatedTime).locale("th").fromNow()}
                          </Typography.Text>

                          {isOnline ? (
                            <Tag
                              bordered={false}
                              color="success"
                              style={{ marginRight: 0, fontSize: 10 }}
                            >
                              ทำงานปกติ
                            </Tag>
                          ) : (
                            <Tag
                              bordered={false}
                              color="error"
                              style={{ marginRight: 0, fontSize: 10 }}
                            >
                              หยุดทำงาน
                            </Tag>
                          )}
                        </div>

                        {/* แจ้งเตือนใน Timeline กรณี Online แต่มาช้ากว่าปกติ */}
                        {isOnline &&
                          checkIfHeartbeatIsDelayed(
                            item.LastUpdatedTime,
                            item.Interval
                          ) && (
                            <div className="mt-1">
                              <Typography.Text
                                type="warning"
                                style={{ fontSize: 10 }}
                              >
                                <Space size={4}>
                                  <WarningOutlined /> ทำงานช้ากว่ารอบปกติ
                                </Space>
                              </Typography.Text>
                            </div>
                          )}
                      </div>
                    ),
                  };
                })}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      {/* Modal สำหรับแก้ไขคำอธิบาย Description */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>แก้ไขคำอธิบายของบอท</span>
          </Space>
        }
        open={Boolean(currentlyEditingRecord)}
        onCancel={closeDescriptionEditModal}
        footer={[
          <Button key="cancel" onClick={closeDescriptionEditModal}>
            ยกเลิก
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpdateHeartbeatDescription}
            loading={isSubmittingForm}
          >
            บันทึกการแก้ไข
          </Button>,
        ]}
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary">Bot Name:</Typography.Text>
            <Typography.Text strong>
              {currentlyEditingRecord?.JobName}
            </Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">ID: </Typography.Text>
              <Typography.Text>{currentlyEditingRecord?.ID}</Typography.Text>
            </div>
          </Space>
        </Card>

        <Form form={descriptionForm} layout="vertical">
          <Form.Item
            label="คำอธิบาย (เพื่อให้ทีมงานเข้าใจว่าบอทตัวนี้ทำอะไร)"
            name="description"
            rules={[{ required: true, message: "กรุณากรอกคำอธิบาย" }]}
          >
            <Input.TextArea
              placeholder="เช่น ตัดยอดบัญชีทุกสิ้นวัน, ส่งอีเมลแจ้งเตือนลูกค้า..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              showCount
              maxLength={255}
            />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
