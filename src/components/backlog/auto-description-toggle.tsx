"use client";

import {Space, Switch, Typography} from "antd";
import {memo} from "react";

export type AutoAiDescriptionToggleComponentProps = {
    disabled?: boolean;
    enabled: boolean;
    onChange: (checked: boolean) => void;
};

//** ปุ่มสลับสำหรับสั่งให้ Gemini จัด Category ให้โดยอัตโนมัติ
function AutoAiDescriptionToggleComponent({disabled, enabled, onChange}: AutoAiDescriptionToggleComponentProps) {
    return (
        <Space direction="vertical" size={4} style={{minWidth: 220}}>
            <Typography.Text strong>สรุปรายละเอียด Gemini</Typography.Text>
            <Space align="center" size={12}>
                <Switch
                    checked={enabled}
                    disabled={disabled}
                    onChange={onChange}
                    checkedChildren="เปิด"
                    unCheckedChildren="ปิด"
                    style={{backgroundColor: enabled ? "#0c7ff2" : undefined}}
                />
                <Typography.Text type="secondary">
                    เมื่อเปิด ระบบจะสรุปรายละเอียดให้อัตโนมัติ
                </Typography.Text>
            </Space>
        </Space>
    );
}

const AutoAiDescriptionToggle = memo(AutoAiDescriptionToggleComponent);

export default AutoAiDescriptionToggle;
