"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
// (removed react-icons usage; using Ant Design icons instead)
import { unwrapResult } from "@reduxjs/toolkit";
import { ResponseGetServerStatusV2 } from "@/stores/type";
import { CallAPI as GET_SERVER_STATUS_V2 } from "@/stores/actions/server/call-get-server-status.v2";
import { Row, Col, Card, Button, Modal, Skeleton, Tag, Avatar, Badge, Typography, Space, Descriptions, Divider, Collapse, Input, Tooltip } from "antd";
import { CloudOutlined, LinkOutlined, CodeOutlined, EyeOutlined, ReloadOutlined, CopyOutlined, EditOutlined } from "@ant-design/icons";
import {toast} from "sonner";


const Page = () => {
  const dispatch = useDispatch<AppDispatch>();
  const GET_SERVER_STATUS_STATE_V2 = useAppSelector(
    (state) => state.callGetServerStatusV2
  );

  const [table, setTable] = useState<
    ResponseGetServerStatusV2["draftValues"]["Array"]
  >([]);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<ResponseGetServerStatusV2["draftValues"]["Array"][number]>();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editValue, setEditValue] = useState<string>('');

  const refresh = useCallback(() => {
    setIsLoading(true);
    dispatch(GET_SERVER_STATUS_V2()).finally(() => {
      setIsLoading(false);
    });
  }, [dispatch]);

  const stats = useMemo(() => {
    const online = (table || []).filter((r) => r.status === "Online").length;
    const offline = (table || []).length - online;
    const avg = (table || []).length
      ? (table || []).reduce((s, r) => s + (Number(r.response_time) || 0), 0) / (table || []).length
      : 0;
    return { online, offline, avg };
  }, [table]);

  const lastChecked = useMemo(() => {
    if (!table || table.length === 0) return "-";
    const sorted = (table || []).slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0]?.timestamp || "-";
  }, [table]);

  useEffect(() => {
    setIsLoading(true);
    dispatch(GET_SERVER_STATUS_V2()).finally(() => {
      setIsLoading(false);
    });
  }, [dispatch]);

  useEffect(() => {
    const response = GET_SERVER_STATUS_STATE_V2?.response?.data?.data;
    setTable(response || []);
  }, [GET_SERVER_STATUS_STATE_V2]);

  const renderResponseTime = useCallback((time: number) => {
    let color = time < 1 ? "green" : time < 2 ? "orange" : "red";
    return <Tag color={color}>{time.toFixed(3)} ms</Tag>;
  }, []);

  // No table columns needed — UI renders each server as a Card in a responsive grid below.

  return (
    <DashboardLayout>
      <Card
        className="mb-4"
        variant="outlined"
        style={{ boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)', borderRadius: 12 }}
        title={
          <Row align="middle" justify="space-between" style={{ width: '100%' }}>
            <Col>
              <Space size={12} align="center">
                <Avatar size={48} icon={<CloudOutlined />} style={{ background: '#f0f5ff', color: '#2f54eb' }} />
                <div>
                  <Typography.Title level={4} style={{ margin: 0 }}>ทดสอบสถานะเซิฟเวอร์อีกครั้ง</Typography.Title>
                  <Typography.Text type="secondary">รายงานสถานะและความหน่วงของเซิร์ฟเวอร์ทั้งหมด</Typography.Text>
                </div>
              </Space>
            </Col>

            <Col>
              <Space size={24} align="end">
                <div style={{ textAlign: 'right' }}>
                  <div>
                    <Typography.Text strong style={{ marginRight: 8 }}>{stats.online}</Typography.Text>
                    <Tag color="green">Online</Tag>
                  </div>
                  <div>
                    <Typography.Text strong style={{ marginRight: 8 }}>{stats.offline}</Typography.Text>
                    <Tag color="red">Offline</Tag>
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <Typography.Text type="secondary" style={{ display: 'block' }}>Avg response</Typography.Text>
                  <Typography.Text strong>{stats.avg.toFixed(3)} ms</Typography.Text>
                  <div style={{ marginTop: 6 }}>
                    <Typography.Text type="secondary">อัพเดตล่าสุด</Typography.Text>
                    <div><Typography.Text>{lastChecked}</Typography.Text></div>
                  </div>
                </div>
              </Space>
            </Col>
          </Row>
        }
        extra={
          <Space size="middle" className="ml-8">
            
            <Button type="primary" onClick={refresh} icon={<ReloadOutlined />}>รีเฟรช</Button>
          </Space>
        }
      >
        <p className="text-sm text-red-500"></p>
      </Card>

      <Card title="การทำงานทุกระบบ" className="w-full" style={{ boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)', borderRadius: 12 }}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          // Full width 4-column grid (wraps as needed)
          <Space direction="vertical" style={{ width: '100%', margin: 0, padding: '16px 0', background: 'linear-gradient(180deg,#fbfdff 0%, #ffffff 100%)' }}>
            <Row gutter={[16, 16]} justify="start" style={{ width: '100%' }}>
            {table && table.length > 0 ? (
              // show all items in a 4-column grid (multiple rows if needed)
              table.map((row) => {
                const isOnline = row.status === "Online";
                const keyId = `${row.server_name_th}-${row.timestamp}`;
                const isHovered = hoveredId === keyId;
                return (
                  <Col key={keyId} span={6} style={{ display: 'flex' }}>
                    <Space style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}>
                      <Badge.Ribbon
                        text={!isOnline ? "ออฟไลน์" : undefined}
                        color={!isOnline ? "red" : "green"}
                        placement="start"
                      >
                        <Card
                          hoverable
                          onMouseEnter={() => setHoveredId(keyId)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{
                            borderRadius: 12,
                            height: '100%',
                            minHeight: 320,
                            display: 'flex',
                            flexDirection: 'column',
                            margin: 0,
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                            transform: isHovered ? 'translateY(-10px)' : 'translateY(0)',
                            boxShadow: isHovered ? '0 18px 40px rgba(15,23,42,0.14)' : '0 8px 22px rgba(15, 23, 42, 0.06)',
                            background: 'linear-gradient(180deg, #ffffff, #fbfdff)'
                          }}
                          bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}
                        >
                        <Row align="middle" gutter={12}>
                          <Col>
                            <Avatar
                              size={56}
                              icon={<CloudOutlined />}
                              style={{
                                backgroundColor: isOnline ? '#f0f9eb' : '#fff1f0',
                                color: isOnline ? '#52c41a' : '#ff4d4f',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)'
                              }}
                            />
                          </Col>

                          <Col flex="1">
                            <div style={{ minWidth: 0 }}>
                              <Typography.Title level={5} style={{ margin: 0 }}>{row.server_name_th}</Typography.Title>
                              <Typography.Text type="secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                                {row.description}
                              </Typography.Text>
                            </div>
                          </Col>

                          <Col style={{ width: 120, textAlign: 'right', minWidth: 92 }}>
                            <div>
                              <Tag color={isOnline ? 'green' : 'red'}>{isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</Tag>
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <Typography.Text type="secondary" style={{ display: 'block' }}>เวลา&nbsp;ตอบสนอง</Typography.Text>
                              {renderResponseTime(row.response_time)}
                            </div>
                          </Col>
                        </Row>

                        <Row style={{ marginTop: 12 }} justify="space-between" align="bottom">
                          <Col flex="1" style={{ minWidth: 0, maxWidth: 'calc(100% - 140px)' }}>
                            <Typography.Text type="secondary">{row.timestamp}</Typography.Text>
                            <Row style={{ marginTop: 6 }} align="middle">
                              <Col style={{ minWidth: 0 }}>
                                <a href={row.url} target="_blank" rel="noreferrer">
                                  <Space align="center">
                                    <LinkOutlined />
                                    <Typography.Text ellipsis={{ tooltip: row.url }} style={{ maxWidth: '100%' }}>{row.url}</Typography.Text>
                                  </Space>
                                </a>
                              </Col>
                            </Row>
                            <Typography.Text code ellipsis={{ tooltip: row.endpoint }} style={{ display: 'block', marginTop: 8, maxWidth: '100%' }}>
                              <CodeOutlined /> {row.endpoint}
                            </Typography.Text>
                          </Col>

                          <Col style={{ width: 140, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                            <Space>
                              <Button size="small" icon={<EditOutlined />} onClick={() => {
                                setSelectedRow(row);
                                setEditValue(row.description || '');
                                setIsEditModalVisible(true);
                              }} />

                              <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => { setSelectedRow(row); setModalVisible(true); }} />
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                      </Badge.Ribbon>
                    </Space>
                  </Col>
                );
              })
            ) : (
              <Col span={24}>
                <Typography.Text type="secondary">ไม่มีข้อมูล</Typography.Text>
              </Col>
            )}
            </Row>
          </Space>
        )}
      </Card>

      <Modal
        title="รายละเอียดเซิร์ฟเวอร์"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={820}
        destroyOnHidden
      >
        {selectedRow ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <Row justify="space-between" style={{ width: '100%' }}>
                  <Col>
                    <Space align="center" size={12}>
                      <Avatar size={52} icon={<CloudOutlined />} style={{ background:'#f0f5ff', color:'#2f54eb' }} />
                      <div>
                        <Typography.Title level={5} style={{ margin: 0 }}>{selectedRow.server_name_th || selectedRow.server_name}</Typography.Title>
                        <Typography.Text type="secondary">{selectedRow.description}</Typography.Text>
                      </div>
                    </Space>
                  </Col>

                  <Col>
                    <div style={{ textAlign: 'right' }}>
                      <Tag color={selectedRow.status === 'Online' ? 'green' : 'red'} style={{ fontSize: 14 }}>
                        {selectedRow.status === 'Online' ? 'ออนไลน์' : 'ออฟไลน์'}
                      </Tag>
                      <div style={{ marginTop: 8 }}>
                        <Typography.Text type="secondary">เวลา ตอบสนอง</Typography.Text>
                        <div>{renderResponseTime(Number(selectedRow.response_time) || 0)}</div>
                      </div>
                    </div>
                  </Col>
                </Row>
            </div>

            <Divider style={{ margin: 0 }} />

            <Descriptions column={1} size="small" bordered={false}>
              <Descriptions.Item label="Server">{selectedRow.server}</Descriptions.Item>
              <Descriptions.Item label="Environment">{selectedRow.environment}</Descriptions.Item>
              <Descriptions.Item label="URL">
                <a href={selectedRow.url} target="_blank" rel="noreferrer">
                  <LinkOutlined /> {selectedRow.url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Endpoint"><code>{selectedRow.endpoint}</code></Descriptions.Item>
              <Descriptions.Item label="เวลาตรวจสอบล่าสุด">{selectedRow.timestamp}</Descriptions.Item>
              <Descriptions.Item label="HTTP Status">{(selectedRow as any)?.status_code ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Severity">{(selectedRow as any)?.response_time_severity_level ?? '-'}</Descriptions.Item>
            </Descriptions>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                icon={<CopyOutlined />}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
                    toast.success('คัดลอกข้อมูลเรียบร้อย');
                  } catch (e) {
                    toast.error('คัดลอกข้อมูลล้มเหลว');
                  }
                }}
              >
                คัดลอก
              </Button>

              <Button type="primary" onClick={() => setModalVisible(false)}>
                ปิด
              </Button>
            </div>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="แก้ไขรายละเอียด"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary">แก้ไขรายละเอียดของเซิร์ฟเวอร์ (ช่องนี้สำหรับ Developer ใส่การทำงานของ Bot)</Typography.Text>
          <Input.TextArea rows={8} value={editValue} onChange={(e) => setEditValue(e.target.value)} />

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setIsEditModalVisible(false)}>ยกเลิก</Button>
            </Col>
            <Col>
              <Button type="primary" onClick={() => {
                // apply changes locally; real save to API can be implemented by developer
                if (!selectedRow) {
                  setIsEditModalVisible(false);
                  return;
                }

                setTable(prev => prev.map(r => {
                  if (r.server_name_th === selectedRow.server_name_th && r.timestamp === selectedRow.timestamp) {
                    return { ...r, description: editValue };
                  }
                  return r;
                }));

                setSelectedRow(prev => prev ? { ...prev, description: editValue } : prev);
                setIsEditModalVisible(false);
                toast.success('บันทึกเรียบร้อย (ยังไม่ได้ส่งไปยัง API)');
              }}>
                บันทึก
              </Button>
            </Col>
          </Row>
        </Space>
      </Modal>
    </DashboardLayout>
  );
};

export default Page;
