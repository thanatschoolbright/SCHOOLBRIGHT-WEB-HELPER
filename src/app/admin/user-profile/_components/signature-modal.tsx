"use client";

import {
  DeleteOutlined,
  FileImageOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Image,
  Modal,
  Space,
  Spin,
  Typography,
  Upload,
  type UploadFile,
} from "antd";
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { StatusModalComponent } from "@components/modal/status-modal-component";
import {
  requestDeleteSignature,
  requestUploadSignature,
  responseUserSignature,
} from "../_api/user-profile-api";

interface SignatureModalProps {
  open: boolean;
  userId: number;
  userName: string;
  onClose: () => void;
}

// ตรวจสอบและกรองไฟล์ก่อน Upload — รับเฉพาะรูปภาพไม่เกิน 5 MB
function validateSignatureFile(file: RcFile): boolean {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    toast.error("รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG, WEBP) เท่านั้น");
    return false;
  }
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    toast.error(`ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB} MB`);
    return false;
  }
  return true;
}

export function SignatureModal({
  open,
  userId,
  userName,
  onClose,
}: SignatureModalProps) {
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(
    null,
  );
  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "confirm" | "delete" | "success" | "error";
    title?: string;
    message?: string;
    loading?: boolean;
    onConfirm?: () => void;
  }>({ open: false, type: "confirm" });

  // ดึงลายเซ็นปัจจุบันของ user เมื่อเปิด Modal
  const fetchCurrentSignature = useCallback(async () => {
    if (!userId) return;
    setIsFetching(true);
    try {
      const res = await responseUserSignature(userId);
      setCurrentSignatureUrl(res.data?.data?.signature_url ?? null);
    } catch {
      setCurrentSignatureUrl(null);
    } finally {
      setIsFetching(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      fetchCurrentSignature();
      setFileList([]);
      setPreviewUrl(null);
    }
  }, [open, fetchCurrentSignature]);

  // สร้าง preview URL จากไฟล์ที่เลือก
  const handleFileChange = (info: UploadChangeParam<UploadFile>) => {
    const latest = info.fileList.slice(-1);
    setFileList(latest);

    const raw = latest[0]?.originFileObj;
    if (raw) {
      const objectUrl = URL.createObjectURL(raw);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  // อัปโหลดลายเซ็นใหม่ไปยัง OBS
  const handleUpload = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      toast.error("กรุณาเลือกไฟล์ลายเซ็นก่อนอัปโหลด");
      return;
    }

    setIsUploading(true);
    try {
      const res = await requestUploadSignature(
        file,
        userId,
        currentSignatureUrl ?? undefined,
      );

      const newUrl: string = res.data?.data?.signature_url;
      setCurrentSignatureUrl(newUrl);
      setFileList([]);
      setPreviewUrl(null);
      toast.success("บันทึกลายเซ็นสำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsUploading(false);
    }
  };

  // เปิด confirm modal ก่อนลบลายเซ็น
  const handleDeleteIntent = () => {
    setConfirmModal({
      open: true,
      type: "delete",
      title: "ยืนยันการลบลายเซ็น",
      message: `ลายเซ็นของ ${userName} จะถูกลบออกจากระบบถาวร ดำเนินการต่อหรือไม่`,
      onConfirm: handleDeleteConfirm,
    });
  };

  // ลบลายเซ็นออกจาก OBS และฐานข้อมูล
  const handleDeleteConfirm = async () => {
    if (!currentSignatureUrl) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      await requestDeleteSignature(userId, currentSignatureUrl);
      setCurrentSignatureUrl(null);
      setConfirmModal({ open: false, type: "confirm" });
      toast.success("ลบลายเซ็นสำเร็จ");
    } catch {
      setConfirmModal({ open: false, type: "confirm" });
      toast.error("เกิดข้อผิดพลาดในการลบลายเซ็น");
    }
  };

  const handleClose = () => {
    setFileList([]);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>จัดการลายเซ็นประจำตัว — {userName}</span>
          </Space>
        }
        onCancel={handleClose}
        width={560}
        footer={null}
        centered
        destroyOnHidden
      >
        <Flex vertical gap={24} className="py-2">
          {/* ลายเซ็นปัจจุบัน */}
          <div>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: 12 }}
            >
              ลายเซ็นที่บันทึกไว้
            </Typography.Text>

            {isFetching ? (
              <Flex justify="center" align="center" style={{ height: 120 }}>
                <Spin />
              </Flex>
            ) : currentSignatureUrl ? (
              <Flex vertical gap={12} align="start">
                <Image
                  src={currentSignatureUrl}
                  alt="ลายเซ็นปัจจุบัน"
                  height={120}
                  style={{
                    objectFit: "contain",
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                    padding: 8,
                    background: "#fff",
                  }}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={handleDeleteIntent}
                >
                  ลบลายเซ็น
                </Button>
              </Flex>
            ) : (
              <Flex
                align="center"
                justify="center"
                style={{
                  height: 100,
                  border: "1px dashed #d9d9d9",
                  borderRadius: 8,
                }}
              >
                <Space direction="vertical" align="center">
                  <FileImageOutlined
                    style={{ fontSize: 24, color: "#bfbfbf" }}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    ยังไม่มีลายเซ็นที่บันทึกไว้
                  </Typography.Text>
                </Space>
              </Flex>
            )}
          </div>

          {/* อัปโหลดลายเซ็นใหม่ */}
          <div>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: 12 }}
            >
              {currentSignatureUrl ? "เปลี่ยนลายเซ็น" : "อัปโหลดลายเซ็น"}
            </Typography.Text>

            <Upload.Dragger
              accept="image/png,image/jpeg,image/jpg,image/webp"
              fileList={fileList}
              beforeUpload={(file) => {
                const valid = validateSignatureFile(file);
                return valid ? false : Upload.LIST_IGNORE;
              }}
              onChange={handleFileChange}
              maxCount={1}
              showUploadList={false}
            >
              <Flex
                vertical
                align="center"
                gap={8}
                style={{ padding: "16px 0" }}
              >
                <InboxOutlined style={{ fontSize: 36, color: "#1677ff" }} />
                <Typography.Text>คลิกหรือลากไฟล์มาวางที่นี่</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  รองรับ PNG, JPG, WEBP ขนาดไม่เกิน 5 MB
                </Typography.Text>
              </Flex>
            </Upload.Dragger>

            {/* Preview ไฟล์ที่เลือก */}
            {previewUrl && (
              <Flex vertical gap={8} style={{ marginTop: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ตัวอย่างไฟล์ที่เลือก
                </Typography.Text>
                <Image
                  src={previewUrl}
                  alt="ตัวอย่างลายเซ็น"
                  height={100}
                  style={{
                    objectFit: "contain",
                    border: "1px solid #91caff",
                    borderRadius: 8,
                    padding: 8,
                    background: "#fff",
                  }}
                />
              </Flex>
            )}
          </div>

          {/* ปุ่มดำเนินการ */}
          <Flex justify="end" gap={8}>
            <Button onClick={handleClose}>ปิดหน้าต่าง</Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={isUploading}
              disabled={fileList.length === 0}
            >
              บันทึกลายเซ็น
            </Button>
          </Flex>
        </Flex>
      </Modal>

      <StatusModalComponent
        open={confirmModal.open}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        loading={confirmModal.loading}
        onClose={() => setConfirmModal({ open: false, type: "confirm" })}
        onConfirm={confirmModal.onConfirm}
        confirmLabel="ยืนยันการลบ"
      />
    </>
  );
}
