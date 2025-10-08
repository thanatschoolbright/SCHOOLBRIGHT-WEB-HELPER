//** Functionality: Email step form component
import {Button, Form, Input} from "antd";
import {UserOutlined} from "@ant-design/icons";

interface Props {
    onNext: (username: string) => void;
}

export default function EmailStepForm({onNext}: Props) {
    const [form] = Form.useForm();

    const handleFinish = (values: any) => {
        onNext(values.username);
    };

    return (
        <Form form={form} onFinish={handleFinish}>
            <Form.Item
                name="username"
                rules={[{required: true, message: "กรุณากรอก username"}]}
            >
                <Input
                    prefix={<UserOutlined/>}
                    placeholder="ระบุ username ของคุณ"
                    size="large"
                />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
                ถัดไป
            </Button>
        </Form>
    );
}
