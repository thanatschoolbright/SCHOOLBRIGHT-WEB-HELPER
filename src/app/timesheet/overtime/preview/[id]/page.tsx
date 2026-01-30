"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@stores/store";
import { Button } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { usePathname, useRouter } from "next/navigation";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import { getUserById } from "@/helpers/local_storage/user.storage";

// --- Interfaces ---
interface OvertimeData {
  id?: string;
  request_date?: string;
  created_at?: string;
  requester_id?: string;
  created_by?: string;
  department?: string;
  period?: string;
  reason?: string;
  overtimeType?: string;
  descriptions?: OvertimeDescription[];
}

interface OvertimeDescription {
  id: number;
  date?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  duration?: number;
  type?: string;
  assignee?: string;
  start_time?: string;
  end_time?: string;
  proof?: Record<string, string>;
}

// --- Component: Editable Text Field ---
const EditableField = ({
  initialValue,
  placeholder = ".......................",
  className = "",
  inputStyle = {},
  editHint = null,
}: {
  initialValue?: string | null;
  placeholder?: string;
  className?: string;
  inputStyle?: React.CSSProperties;
  editHint?: string | null;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  if (isEditing) {
    return (
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%", // ให้ Input เต็มพื้นที่ Cell
        }}
      >
        {editHint && (
          <span
            className="no-print"
            style={{
              fontSize: "10px",
              color: "#999",
              marginBottom: "2px",
              whiteSpace: "nowrap",
            }}
          >
            {editHint}
          </span>
        )}
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setIsEditing(false);
          }}
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            textAlign: "center",
            fontWeight: "inherit",
            color: "#000",
            background: "#fff",
            border: "none",
            borderBottom: "1px dashed #000",
            outline: "none",
            padding: "0 4px",
            minWidth: "80px", // ปรับลด Min-width ลงเล็กน้อยเพื่อให้ดูไม่กว้างเกินในบรรทัดเดียวกัน
            width: "auto",
            display: "inline-block",
            ...inputStyle,
          }}
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={className}
      title="คลิกเพื่อแก้ไขข้อความ"
      style={{
        cursor: "pointer",
        padding: "0 4px",
        minWidth: "20px",
        display: "inline-block",
        borderBottom: "1px dashed transparent",
        textAlign: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderBottom = "1px dashed #ccc";
        e.currentTarget.style.backgroundColor = "#f0f8ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderBottom = "1px dashed transparent";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {value ? (
        value
      ) : (
        <span className="no-print" style={{ color: "#a0a0a0" }}>
          {placeholder}
        </span>
      )}
    </span>
  );
};

// --- Component: Editable Signature (Image Upload) ---
const EditableSignature = ({
  initialImageSrc = null,
  descriptionId,
  signatureKey = "signature_1",
  onStatusChange,
  onSuccess,
}: {
  initialImageSrc?: string | null;
  descriptionId?: number;
  signatureKey?: string;
  onStatusChange?: (status: any) => void;
  onSuccess?: () => void;
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageSrc(initialImageSrc);
  }, [initialImageSrc]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // จำกัดขนาดไฟล์ 2MB
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      if (onStatusChange) {
        onStatusChange({
          isOpen: true,
          status: "error",
          message: "ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 2MB)",
        });
        setTimeout(() => {
          onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
        }, 2000);
      } else {
        toast.error("ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 2MB)");
      }
      return;
    }

    if (!descriptionId || !onStatusChange || !onSuccess) {
      // Fallback to local preview if props are missing (e.g. in some contexts)
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    onStatusChange({
      isOpen: true,
      status: "uploading",
      message: "กำลังอัปโหลดลายเซ็น...",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description_id", String(descriptionId));
      formData.append("image_key", signatureKey);
      formData.append("action", "upload");

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/upload-images",
        formData,
      );

      if (response.data.status === 200) {
        setImageSrc(response.data.data.url);
        onStatusChange({
          isOpen: true,
          status: "success",
          message: "อัปโหลดลายเซ็นสำเร็จ",
        });
        setTimeout(() => {
          onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
          onSuccess();
        }, 1500);
      } else {
        throw new Error(response.data.message_th || "Upload failed");
      }
    } catch (error: any) {
      onStatusChange({
        isOpen: true,
        status: "error",
        message: error.message || "ไม่สามารถอัปโหลดลายเซ็นได้",
      });
      setTimeout(() => {
        onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
      }, 2000);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!descriptionId || !onStatusChange || !onSuccess) {
      setImageSrc(null);
      return;
    }

    onStatusChange({
      isOpen: true,
      status: "deleting",
      message: "กำลังลบลายเซ็น...",
    });

    try {
      const formData = new FormData();
      formData.append("description_id", String(descriptionId));
      formData.append("image_key", signatureKey);
      formData.append("action", "delete");

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/upload-images",
        formData,
      );

      if (response.data.status === 200) {
        setImageSrc(null);
        onStatusChange({
          isOpen: true,
          status: "success",
          message: "ลบลายเซ็นสำเร็จ",
        });
        setTimeout(() => {
          onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
          onSuccess();
        }, 1500);
      } else {
        throw new Error(response.data.message_th || "Delete failed");
      }
    } catch (error: any) {
      onStatusChange({
        isOpen: true,
        status: "error",
        message: error.message || "ไม่สามารถลบลายเซ็นได้",
      });
      setTimeout(() => {
        onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
      }, 2000);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      title="คลิกเพื่อจัดการลายเซ็น"
      className="signature-wrapper"
      style={{ position: "relative" }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {imageSrc ? (
        <>
          <img
            src={imageSrc}
            alt="signature"
            style={{
              height: "100%",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <button
            className="no-print"
            onClick={handleRemove}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            ×
          </button>
        </>
      ) : (
        <div
          className="signature-placeholder"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#999",
            border: "1px dashed transparent",
          }}
        >
          <span className="no-print">คลิกเพื่อใส่ลายเซ็น</span>
        </div>
      )}
    </div>
  );
};

// --- Component: Status Modal ---
const StatusModal = ({
  isOpen,
  status,
  message,
}: {
  isOpen: boolean;
  status: "uploading" | "deleting" | "success" | "error";
  message: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "24px",
              textAlign: "center",
              minWidth: "320px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              {status === "uploading" && (
                <div className="relative flex justify-center">
                  <LoadingOutlined
                    style={{ fontSize: "56px", color: "#3B82F6" }}
                  />
                  <CloudUploadOutlined
                    style={{
                      fontSize: "24px",
                      color: "#3B82F6",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
              )}
              {status === "deleting" && (
                <div className="relative flex justify-center">
                  <LoadingOutlined
                    style={{ fontSize: "56px", color: "#EF4444" }}
                  />
                  <DeleteOutlined
                    style={{
                      fontSize: "24px",
                      color: "#EF4444",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <CheckCircleOutlined
                    style={{ fontSize: "64px", color: "#10B981" }}
                  />
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <CloseCircleOutlined
                    style={{ fontSize: "64px", color: "#EF4444" }}
                  />
                </motion.div>
              )}
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#1F2937",
                margin: "0 0 8px 0",
              }}
            >
              {status === "uploading"
                ? "กำลังอัปโหลด..."
                : status === "deleting"
                  ? "กำลังลบข้อมูล..."
                  : status === "success"
                    ? "ดำเนินการสำเร็จ"
                    : "เกิดข้อผิดพลาด"}
            </h3>
            <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Component: Evidence Upload (Drag & Drop Image Upload) ---
const EvidenceUpload = ({
  label,
  descriptionId,
  imageKey,
  initialSrc,
  onStatusChange,
  onSuccess,
}: {
  label: string;
  descriptionId?: number;
  imageKey: string;
  initialSrc?: string | null;
  onStatusChange: (status: any) => void;
  onSuccess: () => void;
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialSrc || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageSrc(initialSrc || null);
  }, [initialSrc]);

  const handleImageUpload = async (file: File) => {
    if (!descriptionId) {
      toast.error("ไม่สามารถระบุรายการ OT ได้");
      return;
    }

    // จำกัดขนาดไฟล์ 2MB
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      onStatusChange({
        isOpen: true,
        status: "error",
        message: "ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 2MB)",
      });
      setTimeout(() => {
        onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
      }, 2000);
      return;
    }

    if (file && file.type.startsWith("image/")) {
      onStatusChange({
        isOpen: true,
        status: "uploading",
        message: `กำลังอัปโหลดรูปภาพหลักฐาน ${label}`,
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("description_id", String(descriptionId));
        formData.append("image_key", imageKey);
        formData.append("action", "upload");

        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/upload-images",
          formData,
        );

        if (response.data.status === 200) {
          const newUrl = response.data.data.url;
          setImageSrc(newUrl);
          onStatusChange({
            isOpen: true,
            status: "success",
            message: "อัปโหลดรูปภาพหลักฐานเรียบร้อยแล้ว",
          });
          setTimeout(() => {
            onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
            onSuccess();
          }, 1500);
        } else {
          throw new Error(response.data.message_th || "Upload failed");
        }
      } catch (error: any) {
        console.error("Upload Error:", error);
        onStatusChange({
          isOpen: true,
          status: "error",
          message: error.message || "ไม่สามารถอัปโหลดรูปภาพได้",
        });
        setTimeout(() => {
          onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
        }, 2000);
      }
    } else {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!descriptionId) return;

    onStatusChange({
      isOpen: true,
      status: "deleting",
      message: `กำลังลบรูปภาพหลักฐาน ${label}`,
    });

    try {
      const formData = new FormData();
      formData.append("description_id", String(descriptionId));
      formData.append("image_key", imageKey);
      formData.append("action", "delete");

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/upload-images",
        formData,
      );

      if (response.data.status === 200) {
        setImageSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        onStatusChange({
          isOpen: true,
          status: "success",
          message: "ลบรูปภาพหลักฐานเรียบร้อยแล้ว",
        });
        setTimeout(() => {
          onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
          onSuccess();
        }, 1500);
      } else {
        throw new Error(response.data.message_th || "Delete failed");
      }
    } catch (error: any) {
      onStatusChange({
        isOpen: true,
        status: "error",
        message: error.message || "ไม่สามารถลบรูปภาพได้",
      });
      setTimeout(() => {
        onStatusChange((prev: any) => ({ ...prev, isOpen: false }));
      }, 2000);
    }
  };

  return (
    <div className="evidence-item">
      <div className="evidence-label">{label}</div>
      <div
        className={`evidence-dropzone ${imageSrc ? "has-image" : ""} ${
          isDragging ? "dragging" : ""
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        {imageSrc ? (
          <>
            <img src={imageSrc} alt={label} className="evidence-image" />
            <button
              className="evidence-remove no-print"
              onClick={handleRemove}
              title="ลบรูปภาพ"
            >
              ×
            </button>
          </>
        ) : (
          <div className="evidence-placeholder">
            <div style={{ fontSize: "24px" }}>📁</div>
            <div style={{ marginTop: "8px" }}>
              <strong>คลิกเพื่ออัปโหลด</strong>
            </div>
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              หรือลากไฟล์มาวางที่นี่
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CSS Styles ---
const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

  :root { 
    --border-color: #333;
    --header-bg: #f0f0f0;
  }

  .ot-print { 
    font-family: 'Sarabun', Arial, sans-serif; 
    font-size: 13px; 
    line-height: 1.3;
    color: #000;
    background: #fff;
    box-sizing: border-box;
  }

  .ot-container { padding: 24px 32px; }
  .ot-section { margin-bottom: 20px; }

  /* Header - ปรับปรุง Meta Data ให้อยู่บรรทัดเดียวกัน */
  .ot-header-box {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color);
    padding: 10px;
    margin-bottom: 16px;
    border-radius: 4px;
  }
  .ot-logo { width: 140px; }
  .ot-logo img { max-height: 40px; object-fit: contain; }
  
  .ot-doc-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
  }

  /* จุดสำคัญ: ปรับ CSS ให้เรียงแนวนอน */
  .ot-doc-meta {
    width: auto; /* ปล่อยให้กว้างตามเนื้อหา */
    font-size: 12px;
    display: flex;
    flex-direction: row; /* เรียงแนวนอน */
    align-items: center; /* จัดกึ่งกลางแนวตั้ง */
    gap: 16px; /* เว้นระยะห่างระหว่าง "ประจำเดือน" กับ "วันที่" */
    white-space: nowrap; /* ห้ามตัดบรรทัด */
  }

  .ot-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  .ot-info-item { display: flex; align-items: baseline; }
  .ot-label { font-weight: 600; margin-right: 8px; min-width: 90px; color: #444; }
  .ot-value { flex: 1; border-bottom: 1px dotted #999; padding-bottom: 2px; }

  .ot-table {
    width: 100%;
    table-layout: fixed; 
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 12px;
  }
  .ot-table th, .ot-table td {
    border: 1px solid var(--border-color);
    padding: 6px 8px;
    vertical-align: middle;
  }
  .ot-table th {
    background-color: var(--header-bg) !important;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ot-table td.center { text-align: center; }
  .ot-desc {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    max-width: 100%;
    line-height: 1.2;
  }

  .ot-summary {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: #fafafa;
    border: 1px dashed #ccc;
  }

  .ot-signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    page-break-inside: avoid;
  }
  .ot-sign-box { width: 45%; text-align: center; }
  .ot-sign-title { font-weight: 600; margin-bottom: 8px; font-size: 13px; }
  .ot-sign-line { 
    border-bottom: 1px dotted #000; 
    height: 1px; 
    margin: 0 auto 4px; 
    width: 85%; 
  }
  .ot-sign-date { margin-top: 4px; font-size: 11px; }

  .signature-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    height: 55px;
    margin-bottom: -5px;
    cursor: pointer;
    position: relative;
  }
  .signature-wrapper:hover .signature-placeholder {
    border: 1px dashed #ccc !important;
    background-color: #f0f8ff;
  }

  .ot-sub-form {
    margin-top: 20px;
    border-top: 2px dashed #999;
    padding-top: 16px;
  }
  .ot-sub-title {
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 12px;
    padding: 6px;
    background: var(--header-bg);
    border: 1px solid var(--border-color);
    -webkit-print-color-adjust: exact;
  }

  /* Evidence Pages */
  .evidence-page {
    page-break-before: always;
    height: 297mm;
    max-height: 297mm;
    padding: 16px 32px;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .evidence-title {
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 12px;
    padding: 8px;
    background: var(--header-bg);
    border: 2px solid var(--border-color);
    border-radius: 4px;
    flex-shrink: 0;
  }
  .evidence-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 12px;
    row-gap: 10px;
    flex: 1;
    max-height: calc(297mm - 80px);
    overflow: hidden;
  }
  .evidence-item {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 10px;
    background: #fafafa;
    height: 100%;
    max-height: calc((297mm - 120px) / 2);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .evidence-label {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 12px;
    color: #444;
    text-align: center;
  }
  .evidence-dropzone {
    flex: 1;
    border: 2px dashed #999;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background: #fff;
    transition: all 0.3s ease;
  }
  .evidence-dropzone:hover {
    border-color: #666;
    background: #f0f8ff;
  }
  .evidence-dropzone.has-image {
    border-style: solid;
    border-color: #4CAF50;
  }
  .evidence-dropzone.dragging {
    border-color: #2196F3;
    background: #E3F2FD;
  }
  .evidence-placeholder {
    text-align: center;
    color: #999;
    font-size: 13px;
    padding: 20px;
  }
  .evidence-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .evidence-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 16px;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .evidence-dropzone:hover .evidence-remove {
    display: flex;
  }

  @media print {
    @page { size: A4; margin: 10mm; }
    body { margin: 0; }
    .ot-print, .ot-print * { visibility: visible; }
    .ot-print { 
      position: absolute; left: 0; top: 0; 
      width: 100%; margin: 0; padding: 0;
      transform: scale(0.98); transform-origin: top center;
    }
    .ot-print { font-size: 11px; }
    .ot-doc-title { font-size: 14px; }
    .ot-sign-title { font-size: 11px; }
    .ot-table { font-size: 10px; margin-bottom: 8px; }
    
    .ot-info-grid, .ot-summary, .ot-sub-title { background-color: transparent !important; border-color: #000 !important; }
    .ot-header-box, .ot-table th, .ot-table td { border-color: #000 !important; }
    
    .ot-container { padding: 0 10px; }
    .ot-header-box { padding: 6px; margin-bottom: 10px; }
    .ot-info-grid { padding: 6px; margin-bottom: 10px; gap: 4px 16px; }
    .ot-section { margin-bottom: 10px; }
    .ot-sub-form { margin-top: 10px; padding-top: 10px; }
    .ot-sub-title { margin-bottom: 8px; padding: 4px; }
    .ot-table th, .ot-table td { padding: 3px 4px; }
    .signature-wrapper { height: 40px !important; } 
    .ot-signature-section { margin-top: 10px; }

    .no-print { display: none !important; }
    span[title="คลิกเพื่อแก้ไขข้อความ"] { background-color: transparent !important; border-bottom: none !important; }
    
    /* Evidence pages print styles */
    .evidence-page { padding: 10px 15px; }
    .evidence-title { margin-bottom: 12px; padding: 8px; font-size: 16px; }
    .evidence-grid { gap: 15px; height: calc(100% - 60px); }
    .evidence-item { padding: 12px; }
    .evidence-remove { display: none !important; }
  }
`;

// --- Helpers ---
const getAdminIdFromLocalStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const rawData =
      localStorage.getItem("AUTHENTICATION") ||
      localStorage.getItem("authentication");
    if (!rawData) return null;
    const parsed = JSON.parse(rawData);
    return (
      parsed?.response?.data?.user_data?.admin_id ??
      parsed?.user_data?.admin_id ??
      null
    );
  } catch {
    return null;
  }
};

const getPositionFromLocalStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const rawData =
      localStorage.getItem("AUTHENTICATION") ||
      localStorage.getItem("authentication");
    if (!rawData) return null;
    const parsed = JSON.parse(rawData);
    return (
      parsed?.user_data?.position ??
      parsed?.response?.data?.user_data?.position ??
      null
    );
  } catch {
    return null;
  }
};

const extractIdFromPathname = (pathname: string | null): string => {
  if (!pathname) return "";
  const parts = pathname.split("/");
  return parts[parts.length - 1] || "";
};

const handlePrintDocument = (
  date?: string | null,
  empCode?: string,
  fullName?: string,
) => {
  const printArea = document.getElementById("print-area");
  if (!printArea) return;

  // 1. จัดการชื่อไฟล์: เปลี่ยน / เป็น - เพื่อป้องกันปัญหาชื่อไฟล์ในระบบปฏิบัติการ
  let documentTitle = "แบบคำขอทำงานล่วงเวลา";
  if (date && empCode && fullName) {
    const formattedDate = dayjs(date).format("DD-MM-YYYY"); // เปลี่ยน / เป็น -
    documentTitle = `OT_${formattedDate}_${empCode}_${fullName}`;
  }

  // 2. เก็บชื่อ Title เดิมไว้ก่อน
  const originalTitle = document.title;
  // ตั้ง Title ของหน้าเว็บหลักใหม่ (Browser มักจะใช้ชื่อนี้เป็นชื่อไฟล์ PDF)
  document.title = documentTitle;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <div class="ot-print">${printArea.innerHTML}</div>
      </body>
    </html>
  `;

  try {
    const existing = document.getElementById("print-iframe");
    if (existing) document.body.removeChild(existing);

    const iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    // ซ่อน iframe ไว้
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "none",
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          // 3. คืนค่าชื่อ Title เดิมหลังจากสั่ง Print (ใส่ delay นิดหน่อย)
          setTimeout(() => {
            document.title = originalTitle;
          }, 1000);
        }
      }, 500);
    }
  } catch (error) {
    console.error("Print failed:", error);
    document.title = originalTitle; // คืนค่าหาก error
  }
};

const generateEmptyRows = (count: number) =>
  Array.from({ length: count }).map(() => null);

// --- Main Component ---
export default function OTPreviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const authentication = useAppSelector((state) => state.callAdminLogin);

  const [data, setData] = useState<OvertimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modalStatus, setModalStatus] = useState<{
    isOpen: boolean;
    status: "uploading" | "deleting" | "success" | "error";
    message: string;
  }>({ isOpen: false, status: "uploading", message: "" });

  const idParam = extractIdFromPathname(pathname);

  const totalHours = useMemo(() => {
    if (!data?.descriptions) return 0;
    const sum = data.descriptions.reduce((acc, item) => {
      if (!item?.start_date || !item?.end_date) {
        const raw = item?.duration ?? 0;
        const parsed = Number(String(raw));
        return Number.isNaN(parsed) ? acc : acc + parsed;
      }

      // Budget calculation: Floor(start) and Floor(end + 1 hour)
      const budgetStart = dayjs(item.start_date).startOf("hour");
      const budgetEnd = dayjs(item.end_date).add(1, "hour").startOf("hour");
      const duration = budgetEnd.diff(budgetStart, "hour");

      return acc + (duration > 0 ? duration : 0);
    }, 0);
    return sum;
  }, [data]);

  const userData = getUserById(data?.requester_id ?? "");
  const requesterId =
    userData?.admin_id ?? getAdminIdFromLocalStorage() ?? "system";
  const requesterName =
    userData && (userData.firstname || userData.lastname)
      ? `${userData.firstname ?? ""} ${userData.lastname ?? ""}`.trim()
      : (data?.requester_id ?? "-");
  const employeeCode = userData?.employee_code ?? data?.created_by ?? "-";
  const position = userData?.position ?? getPositionFromLocalStorage() ?? "-";
  const department = data?.department ?? "IT";
  const headerDate = data?.request_date ?? data?.created_at ?? null;

  const fetchOvertimeData = async () => {
    if (!idParam) {
      setLoading(false);
      return;
    }
    try {
      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/read",
        { id: String(idParam), request_id: String(requesterId) },
      );
      const body = response?.data;
      if (!body || body.status !== 200) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
        setData(null);
        setNotFound(false);
        return;
      }
      const items = Array.isArray(body.data) ? body.data : [];
      if (items.length === 0) {
        setData(null);
        setNotFound(true);
      } else {
        setData(items[0] ?? null);
        setNotFound(false);
      }
    } catch (error) {
      console.error("Failed to fetch overtime data:", error);
      toast.error("เกิดข้อผิดพลาดขณะโหลดข้อมูล");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimeData();
  }, [idParam, requesterId]);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
    );
  if (notFound)
    return <div className="p-8 text-center text-red-500">ไม่พบข้อมูล</div>;
  if (!data)
    return <div className="p-8 text-center">ไม่มีข้อมูลสำหรับพรีวิว</div>;

  const requestRows = data?.descriptions || [];
  const approvalRows = data?.descriptions || [];

  return (
    <div style={{ padding: "24px", background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Action Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          maxWidth: "210mm",
          margin: "0 auto 20px auto",
        }}
      >
        <h2
          style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}
        >
          พรีวิวเอกสารโอที
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button onClick={() => router.back()}>กลับ</Button>
          <Button
            type="primary"
            onClick={() =>
              handlePrintDocument(headerDate, employeeCode, requesterName)
            }
          >
            พิมพ์ / ดาวน์โหลด PDF
          </Button>
        </div>
      </div>

      {/* Main Paper Preview */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            backgroundColor: "#fff",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)",
            padding: "0",
          }}
        >
          <div id="print-area" className="ot-print">
            <style>{PRINT_STYLES}</style>
            <div className="ot-container">
              {/* --- HEADER SECTION --- */}
              <div className="ot-header-box">
                <div className="ot-logo">
                  <img
                    src="/sb_logo.webp"
                    alt="School Bright"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
                <div className="ot-doc-title">แบบคำขอทำงานล่วงเวลา (OT)</div>

                {/* --- META DATA SECTION (ปรับปรุงใหม่) --- */}
                <div className="ot-doc-meta">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <p style={{ marginRight: "4px" }}>ประจำเดือน:</p>
                    <EditableField
                      initialValue={
                        headerDate
                          ? dayjs(headerDate).locale("th").format("MMMM")
                          : ""
                      }
                      placeholder="......................."
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <p style={{ marginRight: "4px" }}>วันที่:</p>
                    <EditableField
                      initialValue={
                        headerDate ? dayjs(headerDate).format("DD/MM/YYYY") : ""
                      }
                      placeholder="......./......./.........."
                    />
                  </div>
                </div>
                {/* ------------------------------------- */}
              </div>

              {/* --- INFO GRID --- */}
              <div className="ot-info-grid">
                <div className="ot-info-item">
                  <span className="ot-label">ชื่อ - สกุล:</span>
                  <span className="ot-value">{requesterName}</span>
                </div>
                <div className="ot-info-item">
                  <span className="ot-label">รหัสพนักงาน:</span>
                  <span className="ot-value">{employeeCode}</span>
                </div>
                <div className="ot-info-item">
                  <span className="ot-label">ตำแหน่ง:</span>
                  <span className="ot-value">{position}</span>
                </div>
                <div className="ot-info-item">
                  <span className="ot-label">ฝ่าย/แผนก:</span>
                  <span className="ot-value">{department}</span>
                </div>
              </div>

              {/* --- REQUEST TABLE --- */}
              <div className="ot-section">
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "8px",
                    border: "1px solid #000",
                    borderLeft: "4px solid #000",
                  }}
                >
                  <strong style={{ color: "#000" }}>
                    รายละเอียดการทำงานล่วงเวลา
                  </strong>
                </div>
                <table className="ot-table">
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: "5%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        ลำดับ
                      </th>
                      <th
                        style={{
                          width: "12%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        วันที่
                      </th>
                      <th
                        style={{
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                      >
                        รายละเอียดงานที่ปฏิบัติจริง
                      </th>
                      <th
                        style={{
                          width: "12%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        เวลาเริ่ม
                      </th>
                      <th
                        style={{
                          width: "12%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        เวลาสิ้นสุด
                      </th>
                      <th
                        style={{
                          width: "10%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        รวม (ชม.)
                      </th>
                      <th
                        style={{
                          width: "15%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        หมายเหตุ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalRows.map((row, idx) => {
                      const hasTimeRange = row?.start_date && row?.end_date;
                      const startTimeStr = hasTimeRange
                        ? dayjs(row.start_date).format("HH:00")
                        : "";
                      const endTimeStr = hasTimeRange
                        ? dayjs(row.end_date).add(1, "hour").format("HH:00")
                        : "";
                      const rowBudgetDuration = hasTimeRange
                        ? dayjs(row.end_date)
                            .add(1, "hour")
                            .startOf("hour")
                            .diff(dayjs(row.start_date).startOf("hour"), "hour")
                        : 0;

                      return (
                        <tr key={`app-${idx}`}>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            {row?.date
                              ? dayjs(row.date).format("DD/MM/YYYY")
                              : "-"}
                          </td>
                          <td
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <div className="ot-desc">
                              {row?.description ?? ""}
                            </div>
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <span style={{ display: "none" }}>
                              {startTimeStr}
                            </span>
                            <EditableField
                              initialValue={startTimeStr}
                              placeholder="xx:xx"
                              inputStyle={{
                                minWidth: "50px",
                                textAlign: "center",
                                color: "#000",
                              }}
                              editHint="เวลาเริ่ม"
                            />
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <span style={{ display: "none" }}>
                              {endTimeStr}
                            </span>
                            <EditableField
                              initialValue={endTimeStr}
                              placeholder="xx:xx"
                              inputStyle={{
                                minWidth: "50px",
                                textAlign: "center",
                                color: "#000",
                              }}
                              editHint="เวลาสิ้นสุด"
                            />
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <EditableField
                              initialValue={String(rowBudgetDuration || "")}
                              placeholder="-"
                              inputStyle={{
                                minWidth: "40px",
                                textAlign: "center",
                                color: "#000",
                              }}
                            />
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <EditableField
                              initialValue=""
                              placeholder="-"
                              inputStyle={{ minWidth: "80px", color: "#000" }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div
                  className="ot-summary"
                  style={{ border: "1px solid #000", backgroundColor: "#fff" }}
                >
                  <div>
                    เหตุผลการขอ:{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        borderBottom: "1px dotted #000",
                        padding: "0 8px",
                        color: "#000",
                      }}
                    >
                      {data.reason || "-"}
                    </span>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    รวมเวลาทั้งหมด:{" "}
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#000",
                        fontWeight: "bold",
                      }}
                    >
                      {totalHours}
                    </span>{" "}
                    ชั่วโมง
                  </div>
                </div>

                {/* --- SIGNATURES (ROW 1) --- */}
                <div className="ot-signature-section">
                  <div className="ot-sign-box">
                    <div className="ot-sign-title">ผู้ขออนุมัติ</div>
                    <EditableSignature
                      descriptionId={data?.descriptions?.[0]?.id}
                      signatureKey="signature_1"
                      initialImageSrc={
                        data?.descriptions?.[0]?.proof?.signature_1
                      }
                      onStatusChange={setModalStatus}
                      onSuccess={fetchOvertimeData}
                    />
                    <div className="ot-sign-line"></div>
                    <div className="ot-sign-name">
                      <EditableField
                        initialValue={`(${requesterName})`}
                        placeholder="(.......................................................)"
                      />
                    </div>
                    <div className="ot-sign-date">
                      วันที่{" "}
                      <EditableField
                        initialValue={
                          headerDate
                            ? dayjs(headerDate).format("DD / MM / YYYY")
                            : ""
                        }
                        placeholder="....... / ....... / ..........."
                      />
                    </div>
                  </div>
                  <div className="ot-sign-box">
                    <div className="ot-sign-title">ผู้อนุมัติ (หัวหน้างาน)</div>
                    <EditableSignature initialImageSrc="/signatures/THANAT.png" />
                    <div className="ot-sign-line"></div>
                    <div className="ot-sign-name">
                      <EditableField placeholder="(หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ)" />
                    </div>
                    <div className="ot-sign-date">
                      วันที่{" "}
                      <EditableField
                        placeholder="....... / ....... / ..........."
                        initialValue={
                          headerDate
                            ? dayjs(headerDate).format("DD / MM / YYYY")
                            : ""
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- APPROVAL TABLE --- */}
              <div
                className="ot-sub-form"
                style={{ borderTop: "2px solid #000" }}
              >
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "8px",
                    border: "1px solid #000",
                    borderLeft: "4px solid #000",
                  }}
                >
                  <strong style={{ color: "#000" }}>
                    ส่วนสำหรับบันทึกการปฏิบัติงานจริง
                  </strong>
                </div>
                <table className="ot-table">
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: "5%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        ลำดับ
                      </th>
                      <th
                        style={{
                          width: "12%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        วันที่
                      </th>
                      <th
                        style={{
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                      >
                        รายละเอียดงานที่ปฏิบัติจริง
                      </th>
                      <th
                        style={{
                          width: "12%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        เวลาเริ่ม
                      </th>
                      <th
                        style={{
                          width: "12%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        เวลาสิ้นสุด
                      </th>
                      <th
                        style={{
                          width: "10%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        รวม (ชม.)
                      </th>
                      <th
                        style={{
                          width: "15%",
                          color: "#000",
                          backgroundColor: "#fff",
                          border: "1px solid #000",
                        }}
                        className="center"
                      >
                        หมายเหตุ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalRows.map((row, idx) => {
                      const hasTimeRange = row?.start_date && row?.end_date;
                      const startTimeStr = hasTimeRange
                        ? dayjs(row.start_date).format("HH:mm")
                        : "";
                      const endTimeStr = hasTimeRange
                        ? dayjs(row.end_date).format("HH:mm")
                        : "";

                      return (
                        <tr key={`app-${idx}`}>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            {row?.date
                              ? dayjs(row.date).format("DD/MM/YYYY")
                              : "-"}
                          </td>
                          <td
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <div className="ot-desc">
                              {row?.description ?? ""}
                            </div>
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <EditableField
                              initialValue={startTimeStr}
                              placeholder="xx:xx"
                              inputStyle={{
                                minWidth: "50px",
                                textAlign: "center",
                                color: "#000",
                              }}
                              editHint="เวลาเริ่ม"
                            />
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <EditableField
                              initialValue={endTimeStr}
                              placeholder="xx:xx"
                              inputStyle={{
                                minWidth: "50px",
                                textAlign: "center",
                                color: "#000",
                              }}
                              editHint="เวลาสิ้นสุด"
                            />
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <EditableField
                              initialValue={
                                row?.duration
                                  ? Number(row.duration).toFixed(2)
                                  : ""
                              }
                              placeholder="-"
                              inputStyle={{
                                minWidth: "40px",
                                textAlign: "center",
                                color: "#000",
                              }}
                            />
                          </td>
                          <td
                            className="center"
                            style={{ border: "1px solid #000", color: "#000" }}
                          >
                            <EditableField
                              initialValue=""
                              placeholder="-"
                              inputStyle={{ minWidth: "80px", color: "#000" }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* --- SIGNATURES (ROW 2) --- */}
                <div className="ot-signature-section">
                  <div className="ot-sign-box">
                    <div className="ot-sign-title">ผู้ขออนุมัติ</div>
                    <EditableSignature
                      descriptionId={data?.descriptions?.[0]?.id}
                      signatureKey="signature_1"
                      initialImageSrc={
                        data?.descriptions?.[0]?.proof?.signature_1
                      }
                      onStatusChange={setModalStatus}
                      onSuccess={fetchOvertimeData}
                    />
                    <div className="ot-sign-line"></div>
                    <div className="ot-sign-name">
                      <EditableField
                        initialValue={`(${requesterName})`}
                        placeholder="(.......................................................)"
                      />
                    </div>
                    <div className="ot-sign-date">
                      วันที่{" "}
                      <EditableField
                        initialValue={
                          headerDate
                            ? dayjs(headerDate).format("DD / MM / YYYY")
                            : ""
                        }
                        placeholder="....... / ....... / ..........."
                      />
                    </div>
                  </div>
                  <div className="ot-sign-box">
                    <div className="ot-sign-title">ผู้ตรวจสอบ / รับทราบ</div>
                    <EditableSignature initialImageSrc="/signatures/THANAT.png" />
                    <div className="ot-sign-line"></div>
                    <div className="ot-sign-name">
                      <EditableField placeholder="(หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ)" />
                    </div>
                    <div className="ot-sign-date">
                      วันที่{" "}
                      <EditableField
                        placeholder="....... / ....... / ..........."
                        initialValue={
                          headerDate
                            ? dayjs(headerDate).format("DD / MM / YYYY")
                            : ""
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- EVIDENCE PAGE (SINGLE PAGE ONLY) --- */}
              <div className="evidence-page">
                <div className="evidence-title">หลักฐานการทำงาน</div>
                <div className="evidence-grid">
                  <EvidenceUpload
                    label="หลักฐาน #1"
                    descriptionId={data?.descriptions?.[0]?.id}
                    imageKey="image_1"
                    initialSrc={data?.descriptions?.[0]?.proof?.image_1}
                    onStatusChange={setModalStatus}
                    onSuccess={fetchOvertimeData}
                  />
                  <EvidenceUpload
                    label="หลักฐาน #2"
                    descriptionId={data?.descriptions?.[0]?.id}
                    imageKey="image_2"
                    initialSrc={data?.descriptions?.[0]?.proof?.image_2}
                    onStatusChange={setModalStatus}
                    onSuccess={fetchOvertimeData}
                  />
                  <EvidenceUpload
                    label="หลักฐาน #3"
                    descriptionId={data?.descriptions?.[0]?.id}
                    imageKey="image_3"
                    initialSrc={data?.descriptions?.[0]?.proof?.image_3}
                    onStatusChange={setModalStatus}
                    onSuccess={fetchOvertimeData}
                  />
                  <EvidenceUpload
                    label="หลักฐาน #4"
                    descriptionId={data?.descriptions?.[0]?.id}
                    imageKey="image_4"
                    initialSrc={data?.descriptions?.[0]?.proof?.image_4}
                    onStatusChange={setModalStatus}
                    onSuccess={fetchOvertimeData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        isOpen={modalStatus.isOpen}
        status={modalStatus.status}
        message={modalStatus.message}
      />
    </div>
  );
}
