"use client";

import {Modal} from "antd";
import React from "react";

interface MinimalModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    confirmMode?: boolean;
    onConfirm?: () => void;
    isOpen?: boolean;
    width?: number | string;
    loading?: boolean;
}

/**
 * Component Modal พื้นฐานที่รองรับ Dark Mode
 * @param props - Properties ของ Modal
 */
export const MinimalModal: React.FC<MinimalModalProps> = ({
                                                              title,
                                                              onClose,
                                                              children,
                                                              confirmMode = false,
                                                              onConfirm,
                                                              isOpen = false,
                                                              width = 520,
                                                              loading = false,
                                                          }) => {
    return (
        <Modal
            title={title}
            open={isOpen}
            onCancel={onClose}
            onOk={confirmMode ? onConfirm : undefined}
            width={width}
            confirmLoading={loading}
            okText="ยืนยัน"
            cancelText="ยกเลิก"
            footer={confirmMode ? undefined : null}
        >
            {children}
        </Modal>
    );
};
