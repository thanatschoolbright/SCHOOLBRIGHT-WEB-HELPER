"use client";
import React, {useMemo, useState} from "react";
import {Modal, Select, Space, Button, Typography} from "antd";
import dayjs from "dayjs";

type Props = {
    visible: boolean;
    loading?: boolean;
    onClose: () => void;
    onExport: (payload: {from: string; to: string}) => Promise<void> | void;
};

const formatOption = (d: dayjs.Dayjs) => d.format("MM/YYYY");

export default function ExportModalTemplate3({visible, loading, onClose, onExport}: Props) {
    const months = useMemo(() => {
        const list: string[] = [];
        const now = dayjs();
        // build last 36 months
        for (let i = 0; i < 36; i++) {
            list.push(formatOption(now.subtract(i, "month")));
        }
        return list;
    }, []);

    const [from, setFrom] = useState<string | undefined>(months[months.length - 1]);
    const [to, setTo] = useState<string | undefined>(months[0]);

    const handleExport = async () => {
        if (!from || !to) return;
        await onExport({from, to});
        onClose();
    };

    return (
        <Modal
            title="Export Template 3 - Week by Week"
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Space direction="vertical" style={{width: "100%"}} size="middle">
                <div>
                    <Typography.Text>เลือกช่วง (เริ่มต้น MM/YYYY - สิ้นสุด MM/YYYY)</Typography.Text>
                </div>
                <Space style={{width: "100%"}}>
                    <Select style={{width: 180}} value={from} onChange={(v) => setFrom(v)} options={months.map((m) => ({label: m, value: m}))} />
                    <Select style={{width: 180}} value={to} onChange={(v) => setTo(v)} options={months.map((m) => ({label: m, value: m}))} />
                </Space>
                <Space style={{width: "100%", justifyContent: "flex-end"}}>
                    <Button onClick={onClose}>ยกเลิก</Button>
                    <Button type="primary" loading={loading} onClick={handleExport}>Export</Button>
                </Space>
            </Space>
        </Modal>
    );
}
