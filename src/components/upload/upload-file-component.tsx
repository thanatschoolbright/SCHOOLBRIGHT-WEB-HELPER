"use client";

import {InboxOutlined, UploadOutlined} from "@ant-design/icons";
import {Button, message, Skeleton, Upload, UploadProps} from "antd";
import React, {useState} from "react";
import {toast} from "sonner";

const {Dragger} = Upload;

interface UploadFileComponentProps {
    onChange?: (file: File | null) => void;
    accept?: string;
    maxSize?: number; // MB
    multiple?: boolean;
    disabled?: boolean;
    loading?: boolean;
    listType?: "text" | "picture" | "picture-card";
    showUploadList?: boolean;
    dragAndDrop?: boolean;
}

/**
 * Component สำหรับอัปโหลดไฟล์ พร้อมรองรับ Drag & Drop
 * @param props - Properties ของ Upload Component
 */
export const UploadFileComponent: React.FC<UploadFileComponentProps> = ({
                                                                            onChange,
                                                                            accept = "*",
                                                                            maxSize = 10, // 10MB default
                                                                            multiple = false,
                                                                            disabled = false,
                                                                            loading = false,
                                                                            listType = "text",
                                                                            showUploadList = true,
                                                                            dragAndDrop = false,
                                                                        }) => {
    const [fileList, setFileList] = useState<any[]>([]);
    const TOAST_ID = "upload-file";

    //** จัดการการเปลี่ยนแปลงไฟล์ */
    const handleChange: UploadProps["onChange"] = (info) => {
        let newFileList = [...info.fileList];

        //** จำกัดจำนวนไฟล์หากไม่อนุญาต multiple */
        if (!multiple) {
            newFileList = newFileList.slice(-1);
        }

        setFileList(newFileList);

        //** แจ้งผลการอัปโหลด */
        if (info.file.status === "done") {
            toast.success(`อัปโหลดไฟล์ ${info.file.name} สำเร็จ`, {id: TOAST_ID});
            onChange?.(info.file.originFileObj as File);
        } else if (info.file.status === "error") {
            toast.error(`อัปโหลดไฟล์ ${info.file.name} ล้มเหลว`, {id: TOAST_ID});
        } else if (info.file.status === "uploading") {
            toast.loading(`กำลังอัปโหลดไฟล์ ${info.file.name}...`, {id: TOAST_ID});
        }
    };

    //** ตรวจสอบไฟล์ก่อนอัปโหลด */
    const beforeUpload = (file: File) => {
        //** ตรวจสอบขนาดไฟล์ */
        const isValidSize = file.size / 1024 / 1024 < maxSize;
        if (!isValidSize) {
            message.error(`ขนาดไฟล์ต้องไม่เกิน ${maxSize}MB`);
            return false;
        }

        //** ตรวจสอบประเภทไฟล์ */
        if (accept !== "*") {
            const acceptedTypes = accept.split(",").map((type) => type.trim());
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            const isValidType = acceptedTypes.some((type) => {
                if (type.startsWith(".")) {
                    return fileName.endsWith(type);
                }
                return fileType.includes(type.replace("*", ""));
            });

            if (!isValidType) {
                message.error(`รองรับเฉพาะไฟล์ประเภท: ${accept}`);
                return false;
            }
        }

        return true;
    };

    //** แสดง Loading Skeleton */
    if (loading) {
        return (
            <div>
                <Skeleton.Input active size="large" style={{width: "100%", height: 100}}/>
            </div>
        );
    }

    //** Props สำหรับ Upload Component */
    const uploadProps: UploadProps = {
        name: "file",
        multiple,
        fileList,
        accept,
        disabled,
        listType,
        showUploadList,
        beforeUpload,
        onChange: handleChange,
        customRequest: ({onSuccess}) => {
            //** จำลองการอัปโหลดสำเร็จทันที (สำหรับ local file handling) */
            setTimeout(() => {
                onSuccess?.("ok");
            }, 1000);
        },
    };

    //** แสดง Drag & Drop Upload */
    if (dragAndDrop) {
        return (
            <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{fontSize: 48}}/>
                </p>
                <p className="ant-upload-text">
                    คลิกหรือลากไฟล์มาที่นี่เพื่ออัปโหลด
                </p>
                <p className="ant-upload-hint">
                    รองรับการอัปโหลดไฟล์เดี่ยวหรือหลายไฟล์พร้อมกัน
                    <br/>
                    ขนาดไฟล์สูงสุด: {maxSize}MB
                </p>
            </Dragger>
        );
    }

    //** แสดง Button Upload ปกติ */
    return (
        <Upload {...uploadProps}>
            <Button
                icon={<UploadOutlined/>}
                disabled={disabled}
                loading={loading}
            >
                เลือกไฟล์
            </Button>
        </Upload>
    );
};
