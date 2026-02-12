"use client";

import { Button, Col, DatePicker, Form, Input, Row, Space, Switch } from "antd";
import type { FormInstance } from "antd/es/form";
import React from "react";
import type { MilestoneFormValues } from "../types/milestones.types";

type MilestoneFormProps = {
  form: FormInstance<MilestoneFormValues>;
  onSubmit: (values: MilestoneFormValues) => void;
  onCancelEdit: () => void;
  saving: boolean;
  isEditing: boolean;
  labels: {
    name: string;
    description: string;
    start: string;
    due: string;
    archived: string;
    saveNew: string;
    saveEdit: string;
    cancelEdit: string;
  };
};

export const MilestoneForm: React.FC<MilestoneFormProps> = ({
  form,
  onSubmit,
  onCancelEdit,
  saving,
  isEditing,
  labels,
}) => (
  <Form
    form={form}
    layout="vertical"
    onFinish={onSubmit}
    style={{ display: "grid", gap: 12 }}
  >
    <Form.Item
      label={labels.name}
      name="name"
      rules={[{ required: true, message: labels.name }]}
    >
      <Input placeholder={labels.name} />
    </Form.Item>
    <Form.Item label={labels.description} name="description">
      <Input.TextArea rows={3} placeholder={labels.description} />
    </Form.Item>
    <Row gutter={12} wrap>
      <Col span={12}>
        <Form.Item label={labels.start} name="startDate">
          <DatePicker
            allowClear
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={labels.due} name="releaseDueDate">
          <DatePicker
            allowClear
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item label={labels.archived} name="archived" valuePropName="checked">
      <Switch />
    </Form.Item>
    <Space size={10}>
      <Button htmlType="submit" loading={saving} type="primary">
        {isEditing ? labels.saveEdit : labels.saveNew}
      </Button>
      {isEditing ? (
        <Button onClick={onCancelEdit} disabled={saving}>
          {labels.cancelEdit}
        </Button>
      ) : null}
    </Space>
  </Form>
);
