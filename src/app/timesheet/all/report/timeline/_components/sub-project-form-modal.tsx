// ✨ Component สำหรับ Modal ฟอร์มสร้าง/แก้ไขโครงการย่อย (Sub-project / Feature)
"use client";

import { axios } from "@/helpers/api/api.log";
import {
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const ASSET_OPTIONS = [
  { value: "CAPTUREABLE", label: "Capitalization", color: "success" },
  { value: "UN_CAPTUREABLE", label: "Expense", color: "default" },
];

const POSITION_OPTIONS = [
  { value: "Project Manager" },
  { value: "Developer" },
  { value: "Tech Lead" },
  { value: "Customer Support" },
  { value: "พนักงาน" },
  { value: "Full-stack Developer" },
  { value: "Frontend Developer" },
  { value: "Backend Developer" },
  { value: "QA / Tester" },
  { value: "UI/UX Designer" },
  { value: "System Analyst" },
  { value: "Head of Technology" },
  { value: "Chief Technology Officer" },
  { value: "DevOps Engineer" },
  { value: "Mobile Developer" },
];

interface SubProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit" | "clone";
  data: any | null;
  loading: boolean;
  onSubmit: (values: any) => Promise<boolean>;
  onCancel: () => void;
  statuses?: any[];
}

export const SubProjectFormModal: React.FC<SubProjectFormModalProps> = ({
  open,
  mode,
  data,
  loading,
  onSubmit,
  onCancel,
  statuses = [],
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [backlogIssues, setBacklogIssues] = useState<any[]>([]);

  const statusOptions = useMemo(() => {
    return (statuses || []).map((s) => ({
      label: s.nameTh,
      value: s.id,
    }));
  }, [statuses]);

  // ฟังก์ชันค้นหารายชื่อพนักงาน
  const handleUserSearch = useCallback((query: string) => {
    debounce(async (q: string) => {
      setIsFetchingUsers(true);
      try {
        const res = await axios.get(
          `/api/v1/timesheet/project/sub-project/assignee-search?q=${q}`,
        );
        if (res.data?.status === 200) {
          setUsers(res.data.data || []);
        }
      } catch (error) {
        console.error("Search user error:", error);
      } finally {
        setIsFetchingUsers(false);
      }
    }, 500)(query);
  }, []);

  // ฟังก์ชันค้นหา Backlog Issue
  const handleBacklogSearch = useCallback((query: string) => {
    debounce(async (q: string) => {
      if (!q || q.length < 2) return;
      try {
        const res = await axios.get("/api/v1/backlog/issues", {
          params: { q, space: "jabjai", count: 10 },
        });
        if (res.status === 200) {
          const items = res.data?.data?.items || [];
          setBacklogIssues(
            items.map((issue: any) => ({
              label: (
                <Flex vertical>
                  <Text strong style={{ fontSize: 13 }}>
                    {issue.issueKey}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                    {issue.summary}
                  </Text>
                </Flex>
              ),
              value: issue.issueKey,
              summary: issue.summary,
            })),
          );
        }
      } catch (error) {
        console.error("Search backlog error:", error);
      }
    }, 500)(query);
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (open) {
        handleUserSearch("");
        if ((mode === "edit" || mode === "clone") && data) {
          const range =
            data.start_date && data.end_date
              ? [dayjs(data.start_date), dayjs(data.end_date)]
              : [];

          form.setFieldsValue({
            id: mode === "clone" ? undefined : data.id,
            name: data.name,
            name_en: data.name_en,
            description: data.description,
            ticket_number: data.ticket_number,
            asset_capture_type: data.assetCaptureType || "CAPTUREABLE",
            projectStatusId: data.projectStatusId,
            estimateWorkhours: data.estimateWorkhours,
            dateRange: range,
            assignees:
              data.projectAssignees?.map((a: any) => ({
                userId: a.userId,
                position: a.position,
              })) || [],
          });
        } else {
          form.resetFields();
        }
      }
    };
    initData();
  }, [open, mode, data, form, handleUserSearch]);

  const handleFinish = async (values: any) => {
    const payload = {
      ...values,
      id: mode === "clone" ? undefined : data?.id,
      startDate: values.dateRange?.[0]?.toISOString(),
      endDate: values.dateRange?.[1]?.toISOString(),
      project_id: data?.project_id,
      status: statuses.find((s) => s.id === values.projectStatusId)?.nameTh,
    };

    const success = await onSubmit(payload);
    if (success) {
      form.resetFields();
      onCancel();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Space>
          <EditOutlined />
          <Title level={4} style={{ margin: 0 }}>
            แจ้งแก้ไขโครงการย่อย
          </Title>
        </Space>
      }
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          ยกเลิก
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          บันทึกข้อมูล
        </Button>,
      ]}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 20 }}
      >
        <Row gutter={24}>
          <Col span={10}>
            <Form.Item
              name="name"
              label="ชื่อฟีเจอร์ย่อย (TH)"
              rules={[{ required: true }]}
            >
              <Input placeholder="ระบุชื่อโครงการย่อย ภาษาไทย" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="name_en" label="ชื่อฟีเจอร์ย่อย (EN)">
              <Input placeholder="English Name" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="ticket_number" label="Backlog Ticket">
              <AutoComplete
                options={backlogIssues}
                onSearch={handleBacklogSearch}
                placeholder="JOB-123"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="dateRange"
              label="ช่วงเวลาดำเนินงาน"
              rules={[{ required: true }]}
            >
              <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="projectStatusId"
              label="สถานะโครงการ"
              rules={[{ required: true }]}
            >
              <Select options={statusOptions} placeholder="เลือกสถานะ" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="estimateWorkhours" label="ประมาณการ (ชั่วโมง)">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="เช่น 40"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={18}>
            <Form.Item name="description" label="รายละเอียดเพิ่มเติม">
              <Input.TextArea
                rows={2}
                placeholder="จุดประสงค์หรือรายละเอียด..."
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="asset_capture_type"
              label="Asset Type"
              rules={[{ required: true }]}
            >
              <Select options={ASSET_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">ผู้รับผิดชอบ</Divider>
        <Form.List name="assignees">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "userId"]}
                      rules={[{ required: true, message: "เลือกผู้รับผิดชอบ" }]}
                    >
                      <Select
                        showSearch
                        placeholder="ค้นหาพนักงาน"
                        onSearch={handleUserSearch}
                        filterOption={false}
                        loading={isFetchingUsers}
                        options={users.map((u) => ({
                          label: `${u.firstname} ${u.lastname} (${u.nickname})`,
                          value: u.admin_id,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item {...restField} name={[name, "position"]}>
                      <AutoComplete
                        options={POSITION_OPTIONS}
                        placeholder="ระบุตำแหน่งในโครงการ"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Button
                      type="text"
                      danger
                      onClick={() => remove(name)}
                      icon={<MinusCircleOutlined />}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                เพิ่มผู้รับผิดชอบ
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
