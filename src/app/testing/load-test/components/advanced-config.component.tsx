"use client";
import { useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Collapse,
  Table,
  Tag,
  Divider,
  Typography,
  Row,
  Col,
  Select,
  Tooltip,
} from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { LoadTestStage, LoadTestThreshold } from "../types/load-test.types";

type AdvancedConfigProps = {
  onConfigChange: (config: any) => void;
  initialConfig?: any;
};

export const AdvancedConfigComponent = ({
  onConfigChange,
  initialConfig = {},
}: AdvancedConfigProps) => {
  const { t } = useTranslation("translate");
  const [stages, setStages] = useState<LoadTestStage[]>(
    initialConfig.stages || []
  );
  const [headers, setHeaders] = useState<Record<string, string>>(
    initialConfig.headers || {}
  );
  const [tags, setTags] = useState<Record<string, string>>(
    initialConfig.tags || {}
  );
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  const [config, setConfig] = useState({
    timeout: initialConfig.timeout || undefined,
    maxRedirects: initialConfig.maxRedirects || undefined,
    thinkTime: initialConfig.thinkTime || undefined,
    rps: initialConfig.rps || undefined,
    iterations: initialConfig.iterations || undefined,
    noConnectionReuse: initialConfig.noConnectionReuse || false,
    noVUConnectionReuse: initialConfig.noVUConnectionReuse || false,
    minIterationDuration: initialConfig.minIterationDuration || undefined,
    maxDuration: initialConfig.maxDuration || undefined,
    gracefulStop: initialConfig.gracefulStop || undefined,
    setupTimeout: initialConfig.setupTimeout || undefined,
    teardownTimeout: initialConfig.teardownTimeout || undefined,
  });

  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange({
      ...newConfig,
      stages,
      headers,
      tags,
    });
  };

  const addStage = () => {
    const newStages = [...stages, { duration: 60, target: 10 }];
    setStages(newStages);
    onConfigChange({ ...config, stages: newStages, headers, tags });
  };

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages);
    onConfigChange({ ...config, stages: newStages, headers, tags });
  };

  const updateStage = (
    index: number,
    field: keyof LoadTestStage,
    value: number
  ) => {
    const newStages = [...stages];
    newStages[index][field] = value;
    setStages(newStages);
    onConfigChange({ ...config, stages: newStages, headers, tags });
  };

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      const newHeaders = { ...headers, [newHeaderKey]: newHeaderValue };
      setHeaders(newHeaders);
      setNewHeaderKey("");
      setNewHeaderValue("");
      onConfigChange({ ...config, stages, headers: newHeaders, tags });
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setHeaders(newHeaders);
    onConfigChange({ ...config, stages, headers: newHeaders, tags });
  };

  const addTag = () => {
    if (newTagKey && newTagValue) {
      const newTags = { ...tags, [newTagKey]: newTagValue };
      setTags(newTags);
      setNewTagKey("");
      setNewTagValue("");
      onConfigChange({ ...config, stages, headers, tags: newTags });
    }
  };

  const removeTag = (key: string) => {
    const newTags = { ...tags };
    delete newTags[key];
    setTags(newTags);
    onConfigChange({ ...config, stages, headers, tags: newTags });
  };

  const stageColumns = [
    {
      title: t("load_test_page.advanced.stage_duration"),
      dataIndex: "duration",
      key: "duration",
      render: (_: any, record: LoadTestStage, index: number) => (
        <InputNumber
          min={1}
          value={record.duration}
          onChange={(val) => updateStage(index, "duration", val || 1)}
          addonAfter="s"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: t("load_test_page.advanced.stage_target"),
      dataIndex: "target",
      key: "target",
      render: (_: any, record: LoadTestStage, index: number) => (
        <InputNumber
          min={0}
          value={record.target}
          onChange={(val) => updateStage(index, "target", val || 0)}
          addonAfter="VUs"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: t("load_test_page.advanced.actions"),
      key: "actions",
      render: (_: any, __: LoadTestStage, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeStage(index)}
        />
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          {t("load_test_page.advanced.title")}
        </Space>
      }
      extra={
        <Tag color="purple">{t("load_test_page.advanced.enterprise")}</Tag>
      }
    >
      <Collapse
        items={[
          {
            key: "stages",
            label: (
              <Space>
                <ThunderboltOutlined />
                {t("load_test_page.advanced.ramping_stages")}
                {stages.length > 0 && <Tag color="blue">{stages.length}</Tag>}
              </Space>
            ),
            children: (
              <>
                <Typography.Paragraph type="secondary">
                  {t("load_test_page.advanced.stages_description")}
                </Typography.Paragraph>
                <Table
                  size="small"
                  dataSource={stages.map((s, i) => ({ ...s, key: i }))}
                  columns={stageColumns}
                  pagination={false}
                  locale={{
                    emptyText: t("load_test_page.advanced.no_stages"),
                  }}
                />
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addStage}
                  style={{ marginTop: 12, width: "100%" }}
                >
                  {t("load_test_page.advanced.add_stage")}
                </Button>
              </>
            ),
          },
          {
            key: "performance",
            label: (
              <Space>
                <ClockCircleOutlined />
                {t("load_test_page.advanced.performance_options")}
              </Space>
            ),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t("load_test_page.advanced.timeout")}
                        <Tooltip
                          title={t("load_test_page.advanced.timeout_tooltip")}
                        >
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={1}
                      value={config.timeout}
                      onChange={(val) => updateConfig({ timeout: val })}
                      addonAfter="s"
                      style={{ width: "100%" }}
                      placeholder="60"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t("load_test_page.advanced.think_time")}
                        <Tooltip
                          title={t(
                            "load_test_page.advanced.think_time_tooltip"
                          )}
                        >
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={0}
                      step={0.1}
                      value={config.thinkTime}
                      onChange={(val) => updateConfig({ thinkTime: val })}
                      addonAfter="s"
                      style={{ width: "100%" }}
                      placeholder="1"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t("load_test_page.advanced.rps")}
                        <Tooltip
                          title={t("load_test_page.advanced.rps_tooltip")}
                        >
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={1}
                      value={config.rps}
                      onChange={(val) => updateConfig({ rps: val })}
                      addonAfter="req/s"
                      style={{ width: "100%" }}
                      placeholder="100"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t("load_test_page.advanced.iterations")}
                        <Tooltip
                          title={t(
                            "load_test_page.advanced.iterations_tooltip"
                          )}
                        >
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={1}
                      value={config.iterations}
                      onChange={(val) => updateConfig({ iterations: val })}
                      style={{ width: "100%" }}
                      placeholder="1000"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t("load_test_page.advanced.max_redirects")}
                        <Tooltip
                          title={t(
                            "load_test_page.advanced.max_redirects_tooltip"
                          )}
                        >
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={0}
                      value={config.maxRedirects}
                      onChange={(val) => updateConfig({ maxRedirects: val })}
                      style={{ width: "100%" }}
                      placeholder="10"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t("load_test_page.advanced.graceful_stop")}
                        <Tooltip
                          title={t(
                            "load_test_page.advanced.graceful_stop_tooltip"
                          )}
                        >
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber
                      min={1}
                      value={config.gracefulStop}
                      onChange={(val) => updateConfig({ gracefulStop: val })}
                      addonAfter="s"
                      style={{ width: "100%" }}
                      placeholder="30"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "headers",
            label: (
              <Space>
                <ApiOutlined />
                {t("load_test_page.advanced.custom_headers")}
                {Object.keys(headers).length > 0 && (
                  <Tag color="cyan">{Object.keys(headers).length}</Tag>
                )}
              </Space>
            ),
            children: (
              <>
                <Typography.Paragraph type="secondary">
                  {t("load_test_page.advanced.headers_description")}
                </Typography.Paragraph>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {Object.entries(headers).map(([key, value]) => (
                    <Card key={key} size="small">
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <Typography.Text strong>{key}:</Typography.Text>{" "}
                          <Typography.Text code>{value}</Typography.Text>
                        </div>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeHeader(key)}
                        />
                      </Space>
                    </Card>
                  ))}
                </Space>
                <Divider />
                <Row gutter={8}>
                  <Col span={10}>
                    <Input
                      placeholder={t("load_test_page.advanced.header_key")}
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                    />
                  </Col>
                  <Col span={10}>
                    <Input
                      placeholder={t("load_test_page.advanced.header_value")}
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={addHeader}
                      block
                    >
                      {t("load_test_page.advanced.add")}
                    </Button>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "advanced",
            label: t("load_test_page.advanced.connection_options"),
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Space>
                      <Switch
                        checked={config.noConnectionReuse}
                        onChange={(val) =>
                          updateConfig({ noConnectionReuse: val })
                        }
                      />
                      <Typography.Text>
                        {t("load_test_page.advanced.no_connection_reuse")}
                      </Typography.Text>
                      <Tooltip
                        title={t(
                          "load_test_page.advanced.no_connection_reuse_tooltip"
                        )}
                      >
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  </Col>
                  <Col span={24}>
                    <Space>
                      <Switch
                        checked={config.noVUConnectionReuse}
                        onChange={(val) =>
                          updateConfig({ noVUConnectionReuse: val })
                        }
                      />
                      <Typography.Text>
                        {t("load_test_page.advanced.no_vu_connection_reuse")}
                      </Typography.Text>
                      <Tooltip
                        title={t(
                          "load_test_page.advanced.no_vu_connection_reuse_tooltip"
                        )}
                      >
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  </Col>
                </Row>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
};
