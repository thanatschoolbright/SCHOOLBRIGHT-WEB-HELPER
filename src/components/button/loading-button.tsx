"use client";

import {LoadingOutlined} from "@ant-design/icons";
import {Button} from "antd";
import React from "react";

interface LoadingButtonProps {
    children: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    type?: "primary" | "default" | "dashed" | "link" | "text";
    size?: "small" | "middle" | "large";
    danger?: boolean;
    ghost?: boolean;
    onClick?: () => void;
    htmlType?: "button" | "submit" | "reset";
    icon?: React.ReactNode;
    block?: boolean;
}

/**
 * Component ปุ่มที่รองรับสถานะ Loading พร้อม Dark Mode
 * @param props - Properties ของปุ่ม
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
                                                                children,
                                                                loading = false,
                                                                disabled = false,
                                                                type = "default",
                                                                size = "middle",
                                                                danger = false,
                                                                ghost = false,
                                                                onClick,
                                                                htmlType = "button",
                                                                icon,
                                                                block = false,
                                                            }) => {
    //** ไอคอนที่จะแสดงในปุ่ม */
    const buttonIcon = loading ? <LoadingOutlined spin/> : icon;

    return (
        <Button
            type={type}
            size={size}
            loading={loading}
            disabled={disabled || loading}
            danger={danger}
            ghost={ghost}
            onClick={onClick}
            htmlType={htmlType}
            icon={buttonIcon}
            block={block}
        >
            {children}
        </Button>
    );
};
