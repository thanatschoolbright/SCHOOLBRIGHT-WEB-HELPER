import {Button, Col, DatePicker, Form, FormInstance, Input, InputNumber, Modal, Row, Select, Space,} from "antd";
import {useEffect} from "react";
import {
  ApartmentOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  ProjectOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {STATUS_OPTIONS} from "@constants/timesheet.constants";

interface CreateModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    form: FormInstance;
    projects: any[];
    subProject: any[];
    fetchSubProjects: (id: string) => void;
    i18n: any;
    disabled: boolean;
}

export function CreateModalForm({
                                    open,
                                    onCancel,
                                    onSubmit,
                                    form,
                                    projects,
                                    subProject,
                                    fetchSubProjects,
                                    i18n,
                                    disabled,
                                }: CreateModalProps) {
    
    // Set default status value when modal opens
    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                status: "IN_PROGRESS"
            });
        }
    }, [open, form]);

    return (
        <Modal
            open={open}
            title="เพิ่มรายการลงเวลาทำงาน"
            footer={null}
            onCancel={onCancel}
            forceRender
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                {/* Row 1: โครงการหลัก และ โครงการย่อย */}
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="โครงการหลัก"
                            name="project_id"
                            rules={[{required: true, message: "กรุณาเลือกโครงการหลัก"}]}
                        >
                            <Select
                                showSearch
                                placeholder="เลือกโครงการหลัก"
                                onChange={(value) => {
                                    fetchSubProjects(String(value));
                                    form.setFieldsValue({sub_project_id: undefined});
                                }}
                                options={projects.map((p) => ({
                                    label: p.name + " (" + "รหัส" + +p.id + ")",
                                    value: Number(p.id),
                                }))}
                                size="large"
                                style={{width: "100%"}}
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                suffixIcon={<ProjectOutlined/>}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="โครงการย่อย"
                            name="sub_project_id"
                            rules={[{required: true, message: "กรุณาเลือกโครงการย่อย"}]}
                        >
                            <Select
                                showSearch
                                placeholder="เลือกโครงการย่อย"
                                options={subProject.map((s) => ({
                                    label: `${s.name} (รหัส${s.id})`,
                                    value: Number(s.id),
                                }))}
                                size="large"
                                style={{width: "100%"}}
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                suffixIcon={<ApartmentOutlined/>}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Row 2: วันที่ และ ชั่วโมง */}
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="วันที่"
                            name="date"
                            rules={[{required: true, message: "กรุณาเลือกวันที่"}]}
                        >
                            <DatePicker
                                format="DD/MM/YYYY"
                                style={{width: "100%"}}
                                size="large"
                                suffixIcon={<CalendarOutlined/>}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="ชั่วโมง"
                            name="work_hour"
                            rules={[
                                {required: true, message: "กรุณากรอกชั่วโมง"},
                                {type: "number", min: 0, message: "ชั่วโมงต้องมากกว่า 0"},
                                {type: "number", max: 8, message: "ชั่วโมงต้องน้อยกว่าหรือเท่ากับ 8"}
                            ]}
                        >
                            <InputNumber
                                type="number"
                                min={0}
                                placeholder="จำนวนชั่วโมง"
                                size="large"
                                style={{width: "100%"}}
                                addonAfter={<FieldTimeOutlined/>}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Row 3: คำอธิบาย และ สถานะ */}
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="คำอธิบาย" name="description">
                            <Input.TextArea
                                rows={3}
                                placeholder="คำอธิบาย"
                                size="large"
                                style={{padding: "8px"}}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="สถานะ"
                            name="status"
                            rules={[{required: true, message: "กรุณาเลือกสถานะ"}]}
                        >
                            <Select
                                options={STATUS_OPTIONS.map((s) => ({
                                    label: i18n.language === "th" ? s.label_th : s.label_en,
                                    value: s.value,
                                }))}
                                
                                placeholder="เลือกสถานะ"
                                size="large"
                                style={{width: "100%"}}
                                suffixIcon={<TagsOutlined/>}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                {/* Footer Buttons */}
                <Row>
                    <Col span={24}>
                        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
                            <Space
                                style={{
                                    display: "flex", 
                                    justifyContent: "flex-end", 
                                    gap: 12,
                                    width: "100%"
                                }}
                            >
                                <Button 
                                    onClick={onCancel} 
                                    size="large"
                                    style={{ minWidth: 100 }}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={disabled}
                                    disabled={disabled}
                                    style={{ minWidth: 100 }}
                                >
                                    บันทึก
                                </Button>
                            </Space>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
