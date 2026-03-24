import {
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import { useRouter } from "next/navigation";
import { useUserEditStore } from "../_state/user-edit-store";

const { Title } = Typography;

/**
 * ฟอร์มแก้ไขข้อมูลผู้ใช้งานแบบละเอียด
 */
export const UserEditForm = ({
  form,
  onFinish,
}: {
  form: any;
  onFinish: (values: any) => void;
}) => {
  const { token } = theme.useToken();
  const { roles, positions, departments, submitting } = useUserEditStore();
  const router = useRouter();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      requiredMark="optional"
    >
      {/* Personal Information */}
      <div id="section-personal" style={{ marginBottom: 32 }}>
        <Space size={8} style={{ marginBottom: 16 }}>
          <div
            style={{
              width: 4,
              height: 20,
              backgroundColor: token.colorPrimary,
              borderRadius: 2,
            }}
          />
          <Title level={5} style={{ margin: 0 }}>
            ข้อมูลส่วนตัว
          </Title>
        </Space>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="ชื่อ (ไทย)"
              name="firstname_th"
              rules={[{ required: true, message: "กรุณาระบุชื่อ" }]}
            >
              <Input placeholder="ชื่อ" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="นามสกุล (ไทย)"
              name="lastname_th"
              rules={[{ required: true, message: "กรุณาระบุนามสกุล" }]}
            >
              <Input placeholder="นามสกุล" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="ชื่อ (อังกฤษ)" name="firstname_en">
              <Input placeholder="First Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="นามสกุล (อังกฤษ)" name="lastname_en">
              <Input placeholder="Last Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="ชื่อเล่น" name="nickname">
              <Input placeholder="ชื่อเล่น" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="วันเกิด" name="birth_date">
              <DatePicker
                placeholder="เลือกวันเกิด"
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Account & Contact */}
      <div id="section-account" style={{ marginBottom: 32 }}>
        <Space size={8} style={{ marginBottom: 16 }}>
          <div
            style={{
              width: 4,
              height: 20,
              backgroundColor: token.colorPrimary,
              borderRadius: 2,
            }}
          />
          <Title level={5} style={{ margin: 0 }}>
            ข้อมูลบัญชีผู้ใช้และติดต่อ
          </Title>
        </Space>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="ชื่อผู้ใช้งาน (Username)"
              name="username"
              rules={[{ required: true, message: "กรุณาระบุชื่อผู้ใช้งาน" }]}
            >
              <Input
                prefix={
                  <UserOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="username"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="รหัสพนักงาน" name="employee_code">
              <Input
                prefix={
                  <IdcardOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="รหัสพนักงาน"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="อีเมล"
              name="email"
              rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}
            >
              <Input
                prefix={
                  <MailOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="email@example.com"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="เบอร์โทรศัพท์" name="phone">
              <Input
                prefix={
                  <PhoneOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="08X-XXX-XXXX"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Employment Timeline */}
      <div id="section-employment" style={{ marginBottom: 32 }}>
        <Space size={8} style={{ marginBottom: 16 }}>
          <div
            style={{
              width: 4,
              height: 20,
              backgroundColor: token.colorWarning,
              borderRadius: 2,
            }}
          />
          <Title level={5} style={{ margin: 0 }}>
            ข้อมูลการจ้างงาน (Employment Timeline)
          </Title>
        </Space>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="วันที่เริ่มงาน" name="joined_date">
              <DatePicker
                placeholder="เลือกวันที่เริ่มงาน"
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="วันที่ลาออก" name="resigned_date">
              <DatePicker
                placeholder="เลือกวันที่ลาออก"
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="ประเภทการจ้างงาน" name="employment_type">
              <Select placeholder="เลือกประเภทการจ้างงาน">
                <Select.Option value="FULL_TIME">
                  Full-time (พนักงานประจำ)
                </Select.Option>
                <Select.Option value="PART_TIME">
                  Part-time (พนักงานชั่วคราว)
                </Select.Option>
                <Select.Option value="CONTRACT">
                  Contract (สัญญาจ้าง)
                </Select.Option>
                <Select.Option value="INTERN">Intern (ฝึกงาน)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Role & Position */}
      <div id="section-responsibility">
        <Space size={8} style={{ marginBottom: 16 }}>
          <div
            style={{
              width: 4,
              height: 20,
              backgroundColor: token.colorPrimary,
              borderRadius: 2,
            }}
          />
          <Title level={5} style={{ margin: 0 }}>
            หน้าที่และความรับผิดชอบ
          </Title>
        </Space>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="สิทธิ์การใช้งาน (Role)" name="role_id">
              <Select
                placeholder="เลือกสิทธิ์การใช้งาน"
                options={roles.map((r) => ({
                  label: r.role_name,
                  value: r.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="ตำแหน่ง (Position)" name="position_id">
              <Select
                placeholder="เลือกตำแหน่ง"
                showSearch
                optionFilterProp="label"
                options={positions.map((p) => ({
                  label: p.name_th,
                  value: p.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="แผนก (Department)" name="department_id">
              <Select
                placeholder="เลือกแผนก"
                showSearch
                optionFilterProp="label"
                options={departments.map((d) => ({
                  label: d.name_th,
                  value: d.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="สถานะการใช้งาน" name="status">
              <Select>
                <Select.Option value="ACTIVE">
                  <Tag
                    color="success"
                    style={{
                      border: "none",
                      background: "transparent",
                      margin: 0,
                    }}
                  >
                    ใช้งานปกติ
                  </Tag>
                </Select.Option>
                <Select.Option value="INACTIVE">
                  <Tag
                    color="default"
                    style={{
                      border: "none",
                      background: "transparent",
                      margin: 0,
                    }}
                  >
                    ปิดการใช้งาน
                  </Tag>
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="profile_image" hidden>
          <Input />
        </Form.Item>
      </div>

      <Divider />

      <Space style={{ width: "100%", justifyContent: "flex-end" }} size={12}>
        <Button onClick={() => router.push("/admin/user-profile")}>
          ยกเลิก
        </Button>
        <Button type="primary" htmlType="submit" loading={submitting}>
          ยืนยันการบันทึกข้อมูล
        </Button>
      </Space>
    </Form>
  );
};
