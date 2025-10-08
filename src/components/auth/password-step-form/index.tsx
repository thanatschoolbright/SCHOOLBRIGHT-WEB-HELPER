//** Functionality: Password step form component
import {Button, Form, Input, Space, Typography} from "antd";
import {LockOutlined} from "@ant-design/icons";

const {Text} = Typography;

interface Props {
    onBack: () => void;
    onLogin: (password: string) => void;
    loading: boolean;
    username: string;
}

export default function PasswordStepForm({onBack, onLogin, loading, username}: Props) {
    const [form] = Form.useForm();

    const handleFinish = (values: any) => {
        onLogin(values.password);
    };

    return (
        <>
            <Text strong style={{display: 'block', marginBottom: 16}}>{username}</Text>
            <Form form={form} onFinish={handleFinish}>
                <Form.Item
                    name="password"
                    rules={[{required: true, message: "กรุณากรอกรหัสผ่าน"}]}
                >
                    <Input.Password
                        prefix={<LockOutlined/>}
                        placeholder="รหัสผ่าน"
                        size="large"
                    />
                </Form.Item>
                <Space style={{width: "100%", justifyContent: "space-between"}}>
                    <Button onClick={onBack} size="large"
                            style={{height: 56, width: 100, fontSize: 16, borderRadius: 12}}>ย้อนกลับ</Button>
                    <Button type="primary" htmlType="submit" loading={loading} size="large"
                            style={{height: 56, width: 200, fontSize: 16, borderRadius: 12}}>
                        เข้าสู่ระบบ
                    </Button>
                </Space>
            </Form>
        </>
    );
}
