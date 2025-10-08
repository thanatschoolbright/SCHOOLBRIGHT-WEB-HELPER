"use client";

import {DeleteOutlined} from "@ant-design/icons";
import {Button, Input, Modal, Space, Typography} from "antd";
import React, {useState} from "react";

interface DeleteConfirmationModalProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    selectedCount: number;
    loading?: boolean;
}

/**
 * Component Modal ยืนยันการลบรายการ
 * @param props - Props ของ Component
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
                                                                                    open,
                                                                                    onCancel,
                                                                                    onConfirm,
                                                                                    selectedCount,
                                                                                    loading = false,
                                                                                }) => {
    const [confirmText, setConfirmText] = useState("");

    //** รีเซ็ตค่าเมื่อปิด Modal */
    const handleCancel = () => {
        setConfirmText("");
        onCancel();
    };

    //** ตรวจสอบและยืนยันการลบ */
    const handleConfirm = () => {
        if (confirmText === "Delete" && selectedCount > 0) {
            onConfirm();
            setConfirmText("");
        }
    };

    return (
        <Modal
            title="ยืนยันการลบ"
            open={open}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel} disabled={loading}>
                    ยกเลิก
                </Button>,
                <Button
                    key="delete"
                    danger
                    type="primary"
                    icon={<DeleteOutlined/>}
                    disabled={confirmText !== "Delete" || !selectedCount || loading}
                    loading={loading}
                    onClick={handleConfirm}
                >
                    ลบ
                </Button>,
            ]}
        >
            <Space direction="vertical" size="middle" style={{width: "100%"}}>
                <Typography.Text type="danger" strong>
                    พิมพ์คำว่า Delete เพื่อยืนยันการลบ {selectedCount} รายการ
                </Typography.Text>
                <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="พิมพ์ Delete เพื่อยืนยัน"
                    disabled={loading}
                />
            </Space>
        </Modal>
    );
};
