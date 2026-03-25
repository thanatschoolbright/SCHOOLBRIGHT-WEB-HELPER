import {
  HistoryOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
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
      <div id="section-personal" style={{ marginBottom: 40 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>ชื่อ (ภาษาไทย)</span>}
              name="firstname_th"
              rules={[{ required: true, message: "กรุณาระบุชื่อ" }]}
            >
              <Input
                placeholder="กรอกชื่อภาษาไทย"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>นามสกุล (ภาษาไทย)</span>}
              name="lastname_th"
              rules={[{ required: true, message: "กรุณาระบุนามสกุล" }]}
            >
              <Input
                placeholder="กรอกนามสกุลภาษาไทย"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>ชื่อ (ภาษาอังกฤษ)</span>}
              name="firstname_en"
            >
              <Input
                placeholder="First Name"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600 }}>นามสกุล (ภาษาอังกฤษ)</span>
              }
              name="lastname_en"
            >
              <Input
                placeholder="Last Name"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>ชื่อเล่น</span>}
              name="nickname"
            >
              <Input
                placeholder="ชื่อเล่น"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>เพศ</span>}
              name="gender"
            >
              <Select
                placeholder="เลือกเพศ"
                size="large"
                style={{ borderRadius: 12 }}
                allowClear
              >
                <Select.Option value="MALE">ชาย</Select.Option>
                <Select.Option value="FEMALE">หญิง</Select.Option>
                <Select.Option value="OTHER">ไม่ระบุ</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>วันเกิด</span>}
              name="birth_date"
            >
              <DatePicker
                placeholder="วว/ดด/ปปปป"
                format="DD/MM/YYYY"
                size="large"
                style={{ width: "100%", borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Account & Contact */}
      <div id="section-account" style={{ marginBottom: 40 }}>
        <Divider orientation="left" style={{ margin: "24px 0 32px 0" }}>
          <Space>
            <MailOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              ข้อมูลบัญชีและช่องทางการติดต่อ
            </span>
          </Space>
        </Divider>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>ชื่อผู้ใช้งาน</span>}
              name="username"
              rules={[{ required: true, message: "กรุณาระบุชื่อผู้ใช้งาน" }]}
            >
              <Input
                prefix={
                  <UserOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="Username สำหรับเข้าสู่ระบบ"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>รหัสพนักงาน</span>}
              name="employee_code"
            >
              <Input
                prefix={
                  <IdcardOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="รหัสพนักงานภายในองค์กร"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>อีเมล</span>}
              name="email"
              rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}
            >
              <Input
                prefix={
                  <MailOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="example@schoolbright.co"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>เบอร์โทรศัพท์</span>}
              name="phone"
            >
              <Input
                prefix={
                  <PhoneOutlined style={{ color: token.colorTextDisabled }} />
                }
                placeholder="0XX-XXX-XXXX"
                size="large"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Employment Timeline */}
      <div id="section-employment" style={{ marginBottom: 40 }}>
        <Divider orientation="left" style={{ margin: "24px 0 32px 0" }}>
          <Space>
            <HistoryOutlined style={{ color: token.colorWarning }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              ข้อมูลการจ้างงาน
            </span>
          </Space>
        </Divider>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>วันที่เริ่มงาน</span>}
              name="joined_date"
            >
              <DatePicker
                placeholder="วว/ดด/ปปปป"
                size="large"
                style={{ width: "100%", borderRadius: 12 }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>วันที่ลาออก</span>}
              name="resigned_date"
            >
              <DatePicker
                placeholder="วว/ดด/ปปปป"
                size="large"
                style={{ width: "100%", borderRadius: 12 }}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>ประเภทการจ้างงาน</span>}
              name="employment_type"
            >
              <Select
                placeholder="เลือกประเภท"
                size="large"
                style={{ borderRadius: 12 }}
              >
                <Select.Option value="FULL_TIME">Full-time</Select.Option>
                <Select.Option value="PART_TIME">Part-time</Select.Option>
                <Select.Option value="CONTRACT">Contract</Select.Option>
                <Select.Option value="INTERN">Intern</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Role & Position */}
      <div id="section-responsibility" style={{ marginBottom: 40 }}>
        <Divider orientation="left" style={{ margin: "24px 0 32px 0" }}>
          <Space>
            <IdcardOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              บทบาทและความรับผิดชอบ
            </span>
          </Space>
        </Divider>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>สิทธิ์การใช้งาน</span>}
              name="role_id"
            >
              <Select
                placeholder="ระบุสิทธิ์ในระบบ"
                size="large"
                style={{ borderRadius: 12 }}
                options={roles.map((r) => ({
                  label: r.role_name,
                  value: r.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>ตำแหน่งงาน</span>}
              name="position_id"
            >
              <Select
                placeholder="ระบุตำแหน่งงาน"
                size="large"
                style={{ borderRadius: 12 }}
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
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>หน่วยงาน / แผนก</span>}
              name="department_id"
            >
              <Select
                placeholder="ระบุหน่วยงาน"
                size="large"
                style={{ borderRadius: 12 }}
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
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>สถานะการใช้งาน</span>}
              name="status"
            >
              <Select size="large" style={{ borderRadius: 12 }}>
                <Select.Option value="ACTIVE">
                  <Badge status="success" text="ใช้งานปกติ (Active)" />
                </Select.Option>
                <Select.Option value="INACTIVE">
                  <Badge status="default" text="ระงับการใช้งาน (Inactive)" />
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="profile_image" hidden>
          <Input />
        </Form.Item>
      </div>

      <Divider style={{ margin: "24px 0" }} />

      <Row justify="end">
        <Col>
          <Space size={12}>
            <Button
              size="large"
              style={{ borderRadius: 12, minWidth: 120 }}
              onClick={() => router.push("/admin/user-profile")}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              style={{
                borderRadius: 12,
                minWidth: 180,
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.25)",
              }}
            >
              บันทึกการแก้ไข
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};
