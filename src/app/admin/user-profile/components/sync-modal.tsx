import React, { useState } from "react";
import {
  Modal,
  Table,
  Button,
  Badge,
  Space,
  Typography,
  Checkbox,
  Progress,
  Steps,
  Alert,
  Divider,
  Row,
  Col,
  Card,
  theme,
} from "antd";
import {
  ReloadOutlined,
  CloudSyncOutlined,
  DiffOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

interface SyncModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

type SyncStep = "selection" | "syncing" | "result";

export const SyncModal: React.FC<SyncModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // Delivery Tracking State
  const [syncStep, setSyncStep] = useState<SyncStep>("selection");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [syncResults, setSyncResults] = useState<any[]>([]);
  const [errorDetail, setErrorDetail] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/v2/admin/user-management/sync/check");
      const { diffs, total_legacy, total_local, synced_count } = res.data.data;
      const safeDiffs = (diffs || []).map((item: any, index: number) => ({
        ...item,
        row_key: item.key ? `${item.key}_${item.type}` : `idx_${index}`,
      }));
      setData(safeDiffs);
      setStats({ total_legacy, total_local, synced_count });
      setSyncStep("selection");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      fetchData();
      setSelectedKeys([]);
      setSyncResults([]);
      setCurrentIdx(0);
    }
  }, [open]);

  const handleSync = async () => {
    if (selectedKeys.length === 0) return;

    setSyncStep("syncing");
    const itemsToSync = data.filter((item) =>
      selectedKeys.includes(item.row_key),
    );

    const results: any[] = itemsToSync.map((item) => ({
      ...item,
      status: "pending",
    }));
    setSyncResults(results);

    for (let i = 0; i < itemsToSync.length; i++) {
      setCurrentIdx(i);
      const item = itemsToSync[i];

      try {
        await axios.post("/api/v2/admin/user-management/sync/execute", {
          items: [item],
        });

        results[i].status = "success";
        setSyncResults([...results]);
      } catch (error: any) {
        results[i].status = "error";
        // Extract error message from API response
        const errorData = error?.response?.data;
        results[i].errorMessage =
          errorData?.message_th ||
          errorData?.message_en ||
          error?.message ||
          "Internal Server Error";
        results[i].errorStack =
          errorData?.error?.message ||
          errorData?.error?.name ||
          JSON.stringify(errorData?.error);

        // Store full error for "Details" button
        results[i].fullError = errorData || {
          message: error.message,
          error: error.stack,
        };

        setSyncResults([...results]);
      }
      // Small delay for visual effect
      await new Promise((r) => setTimeout(r, 300));
    }

    setSyncStep("result");
    onSuccess();
  };

  const columns: any = [
    {
      title: "สถานะ",
      dataIndex: "type",
      width: 150,
      render: (type: string) => {
        return type === "MISSING_IN_LOCAL" ? (
          <Badge status="warning" text="ข้อมูลใหม่ (External)" />
        ) : (
          <Badge status="processing" text="ข้อมูลไม่ตรงกัน" />
        );
      },
    },
    {
      title: "Admin ID",
      dataIndex: "key",
      width: 100,
    },
    {
      title: "เปรียบเทียบข้อมูล (Legacy vs Local)",
      render: (_: any, record: any) => {
        const remote = record.remote || {};
        const local = record.local || {};

        const DiffText = ({ label, r, l }: any) => {
          const isDifferent = (r || "") !== (l || "");
          if (!isDifferent) return null;
          return (
            <div
              className="flex justify-between text-xs mb-1 pb-1 border-b"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              <Typography.Text
                type="secondary"
                strong
                style={{ width: 80, fontSize: 11 }}
              >
                {label}:
              </Typography.Text>
              <Typography.Text
                type="danger"
                className="flex-1 text-right truncate pl-2"
              >
                {l || "-"}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                className="px-2"
                style={{ opacity: 0.5 }}
              >
                <ArrowRightOutlined />
              </Typography.Text>
              <Typography.Text
                type="success"
                className="flex-1 truncate font-medium"
              >
                {r || "-"}
              </Typography.Text>
            </div>
          );
        };

        if (record.type === "MISSING_IN_LOCAL") {
          return (
            <div
              className="p-2 rounded border"
              style={{
                backgroundColor: token.colorInfoBg,
                borderColor: token.colorInfoBorder,
              }}
            >
              <div
                className="font-bold text-sm"
                style={{ color: token.colorInfoText }}
              >
                {remote.firstname_th} {remote.lastname_th}
              </div>
              <div className="text-[10px] mb-1">
                <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                  Username:{" "}
                  <code
                    className="px-1 rounded"
                    style={{
                      backgroundColor: token.colorInfoBgHover,
                      color: token.colorInfoText,
                    }}
                  >
                    {remote.username}
                  </code>
                </Typography.Text>
              </div>
              <div className="text-xs">
                <Typography.Text type="secondary">
                  {remote.email}
                </Typography.Text>
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mt-1"
                style={{ color: token.colorInfo }}
              >
                {remote.position || "ไม่ระบุตำแหน่ง"}
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col">
            <div className="font-bold mb-2 text-sm">
              <Typography.Text strong>
                {remote.firstname_th} {remote.lastname_th}
              </Typography.Text>
            </div>
            <DiffText label="Username" r={remote.username} l={local.username} />
            <DiffText
              label="ชื่อ"
              r={remote.firstname_th}
              l={local.firstname_th}
            />
            <DiffText
              label="นามสกุล"
              r={remote.lastname_th}
              l={local.lastname_th}
            />
            <DiffText label="อีเมล" r={remote.email} l={local.email} />
            <DiffText label="เบอร์โทร" r={remote.tel} l={local.phone} />
            <DiffText label="ตำแหน่ง" r={remote.position} l={local.position} />
          </div>
        );
      },
    },
  ];

  const successCount = syncResults.filter((r) => r.status === "success").length;
  const errorCount = syncResults.filter((r) => r.status === "error").length;

  return (
    <>
    <Modal
      open={open}
      title={
        <Space>
          <CloudSyncOutlined style={{ color: token.colorPrimary }} />
          <Typography.Text strong style={{ fontSize: 18 }}>
            ระบบซิงค์ข้อมูลผู้ใช้งาน (User Data Sync)
          </Typography.Text>
        </Space>
      }
      onCancel={syncStep === "syncing" ? undefined : onCancel}
      closable={syncStep !== "syncing"}
      width={1200}
      footer={
        syncStep === "selection"
          ? [
              <Button key="cancel" onClick={onCancel}>
                ยกเลิก
              </Button>,
              <Button
                key="sync"
                type="primary"
                icon={<CloudSyncOutlined />}
                loading={loading}
                onClick={handleSync}
                disabled={selectedKeys.length === 0}
              >
                เริ่มซิงค์ข้อมูล ({selectedKeys.length} รายการ)
              </Button>,
            ]
          : syncStep === "result"
            ? [
                <Button key="close" type="primary" onClick={onCancel}>
                  เสร็จสิ้น
                </Button>,
              ]
            : null
      }
    >
      {syncStep === "selection" && (
        <>
          <div
            className="mb-6 border p-4 rounded-xl flex justify-between items-center"
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <Space size={40}>
              <Statistic
                label="Legacy (ต้นทาง)"
                value={stats?.total_legacy || 0}
              />
              <Statistic
                label="Local (ปัจจุบัน)"
                value={stats?.total_local || 0}
              />
              <Statistic
                label="ข้อมูลตรงกันแล้ว"
                value={stats?.synced_count || 0}
                valueStyle={{ color: token.colorSuccess }}
              />
              <Statistic
                label="พบความแตกต่าง"
                value={data.length}
                valueStyle={{ color: token.colorError }}
              />
            </Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              className="rounded-lg"
            >
              ตรวจสอบใหม่
            </Button>
          </div>

          <Alert
            message="กรุณาเลือกรายการที่ต้องการปรับปรุงข้อมูล"
            description="รายการที่เลือกจะถูกนำเข้าหรืออัปเดตข้อมูลในระบบปัจจุบันให้ตรงกับฐานข้อมูลต้นทาง"
            type="info"
            showIcon
            className="mb-4 rounded-lg"
          />

          <Table
            dataSource={data}
            columns={columns}
            rowKey="row_key"
            loading={loading}
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys),
            }}
            pagination={false}
            scroll={{ y: 500 }}
            className="border rounded-lg overflow-hidden"
          />
        </>
      )}

      {(syncStep === "syncing" || syncStep === "result") && (
        <div className="py-2">
          <div className="text-center mb-8">
            <Typography.Title level={4}>
              {syncStep === "syncing"
                ? "กำลังซิงค์ข้อมูล..."
                : "สรุปผลการดำเนินการ"}
            </Typography.Title>
            <Progress
              percent={Math.round(
                ((currentIdx + (syncStep === "result" ? 1 : 0)) /
                  syncResults.length) *
                  100,
              )}
              status={syncStep === "result" ? "success" : "active"}
              strokeColor={{
                "0%": token.colorPrimary,
                "100%": token.colorSuccess,
              }}
              style={{ maxWidth: 600, margin: "0 auto" }}
            />
          </div>

          <Row gutter={24}>
            <Col span={16}>
              <div
                className="rounded-xl p-4 border h-[450px] overflow-hidden flex flex-col"
                style={{
                  backgroundColor: token.colorFillAlter,
                  borderColor: token.colorBorderSecondary,
                }}
              >
                <Typography.Text strong className="mb-3 block">
                  ประวัติการดำเนินการ (Execution Log)
                </Typography.Text>
                <div className="flex-1 overflow-y-auto pr-2">
                  <Steps
                    direction="vertical"
                    size="small"
                    current={currentIdx}
                    items={syncResults.map((item, idx) => ({
                      title: (
                        <div className="flex items-center gap-2">
                          <Typography.Text className="text-sm font-medium">
                            {item.remote?.firstname_th}{" "}
                            {item.remote?.lastname_th}
                          </Typography.Text>
                          <Typography.Text type="secondary" className="text-xs">
                            (ID: {item.key})
                          </Typography.Text>
                        </div>
                      ),
                      description: (
                        <div className="text-xs">
                          {item.status === "pending" && idx === currentIdx ? (
                            <Typography.Text style={{ color: token.colorInfo }}>
                              กำลังประมวลผล...
                            </Typography.Text>
                          ) : item.status === "success" ? (
                            <Typography.Text
                              style={{ color: token.colorSuccess }}
                            >
                              สำเร็จ
                            </Typography.Text>
                          ) : item.status === "error" ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <Typography.Text
                                  style={{ color: token.colorError }}
                                >
                                  {item.errorMessage}
                                </Typography.Text>
                                <Button
                                  type="link"
                                  size="small"
                                  danger
                                  icon={<InfoCircleOutlined />}
                                  onClick={() => setErrorDetail(item.fullError)}
                                  className="h-auto p-0 text-[10px]"
                                >
                                  รายละเอียด
                                </Button>
                              </div>
                              {item.errorStack && (
                                <div
                                  className="text-[10px] p-1 rounded border font-mono overflow-x-auto"
                                  style={{
                                    backgroundColor: token.colorErrorBg,
                                    color: token.colorErrorText,
                                    borderColor: token.colorErrorBorder,
                                    maxWidth: "100%",
                                  }}
                                >
                                  {item.errorStack}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Typography.Text type="secondary">
                              รอคิว...
                            </Typography.Text>
                          )}
                        </div>
                      ),
                      status:
                        item.status === "success"
                          ? "finish"
                          : item.status === "error"
                            ? "error"
                            : idx === currentIdx && syncStep === "syncing"
                              ? "process"
                              : "wait",
                      icon:
                        item.status === "success" ? (
                          <CheckCircleOutlined
                            style={{ color: token.colorSuccess }}
                          />
                        ) : item.status === "error" ? (
                          <CloseCircleOutlined
                            style={{ color: token.colorError }}
                          />
                        ) : idx === currentIdx && syncStep === "syncing" ? (
                          <LoadingOutlined
                            style={{ color: token.colorPrimary }}
                          />
                        ) : undefined,
                    }))}
                  />
                </div>
              </div>
            </Col>
            <Col span={8}>
              {syncStep === "result" && (
                <div className="space-y-4">
                  <Card className="rounded-xl border-green-100 bg-green-50/30">
                    <Statistic
                      label="สำเร็จทั้งหมด"
                      value={successCount}
                      valueStyle={{ color: "#3f8600" }}
                    />
                  </Card>
                  <Card className="rounded-xl border-red-100 bg-red-50/30">
                    <Statistic
                      label="ผิดพลาด"
                      value={errorCount}
                      valueStyle={{ color: "#cf1322" }}
                    />
                  </Card>

                  {errorCount > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      message="พบรายการผิดพลาด"
                      description="บางรายการไม่สามารถดำเนินการได้ เนื่องด้วยข้อจำกัดของข้อมูลหรือปัญหาการเชื่อมต่อ"
                      className="rounded-lg"
                    />
                  )}

                  <Alert
                    type="success"
                    showIcon
                    message="ดำเนินการเสร็จสิ้น"
                    description={`ซิงค์ข้อมูลเสร็จเรียบร้อยแล้ว รวมทั้งสิ้น ${syncResults.length} รายการ`}
                    className="rounded-lg"
                  />
                </div>
              )}
            </Col>
          </Row>
        </div>
      )}
    </Modal>

    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: token.colorError }} />
          <span>รายละเอียดข้อผิดพลาด (Error Detail)</span>
        </Space>
      }
      open={!!errorDetail}
      onCancel={() => setErrorDetail(null)}
      footer={[
        <Button key="close" onClick={() => setErrorDetail(null)}>
          ปิด
        </Button>,
      ]}
      width={700}
      centered
    >
      <div
        className="p-4 rounded-lg font-mono text-xs overflow-auto max-h-[500px]"
        style={{
          backgroundColor: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <pre>{JSON.stringify(errorDetail, null, 2)}</pre>
      </div>
    </Modal>
  </>
  );
};

const Statistic = ({ label, value, valueStyle }: any) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 mb-1">{label}</span>
    <span className="text-2xl font-bold font-mono" style={valueStyle}>
      {value}
    </span>
  </div>
);
