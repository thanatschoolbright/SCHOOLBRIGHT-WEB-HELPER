"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
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
  date?: string;
  description?: string;
  duration?: number;
  type?: string;
  assignee?: string;
  start_date?: string;
  end_date?: string;
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
}: {
  initialImageSrc?: string | null;
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      title="คลิกเพื่ออัปโหลดลายเซ็น"
      className="signature-wrapper"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {imageSrc ? (
        <img
          src={imageSrc}
          alt="signature"
          style={{
            height: "100%",
            width: "auto",
            objectFit: "contain",
          }}
        />
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

// --- CSS Styles ---
const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

  :root { 
    --border-color: #000;
    --header-bg: #fff;
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
  .page-break { page-break-after: always; }

  /* Header */
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
    color: #000;
  }

  .ot-doc-meta {
    width: auto;
    font-size: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    white-space: nowrap;
    color: #000;
  }

  .ot-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #fff;
    border: 1px solid #000;
    border-radius: 4px;
  }
  .ot-info-item { display: flex; align-items: baseline; }
  .ot-label { font-weight: 600; margin-right: 8px; min-width: 90px; color: #000; }
  .ot-value { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 2px; color: #000; }

  .ot-table {
    width: 100%;
    table-layout: fixed; 
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 12px;
  }
  .ot-table th, .ot-table td {
    border: 1px solid #000;
    padding: 6px 8px;
    vertical-align: middle;
    color: #000;
  }
  .ot-table th {
    background-color: #fff !important;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
  }
  .ot-table td.center { text-align: center; }
  .ot-desc {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    max-width: 100%;
    line-height: 1.6;
    color: #000;
  }

  .ot-summary {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: #fff;
    border: 1px solid #000;
    color: #000;
  }

  .ot-signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    page-break-inside: avoid;
  }
  .ot-sign-box { width: 45%; text-align: center; }
  .ot-sign-title { font-weight: 600; margin-bottom: 8px; font-size: 13px; color: #000; }
  .ot-sign-line { 
    border-bottom: 1px dotted #000; 
    height: 1px; 
    margin: 0 auto 4px; 
    width: 85%; 
  }
  .ot-sign-date { margin-top: 4px; font-size: 11px; color: #000; }

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
    border: 1px dashed #000 !important;
    background-color: #fff;
  }

  .ot-sub-form {
    margin-top: 20px;
    border-top: 2px solid #000;
    padding-top: 16px;
  }
  .ot-sub-title {
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 12px;
    padding: 6px;
    background: #fff;
    border: 1px solid #000;
    color: #000;
  }

  @media print {
    @page { size: A4; margin: 10mm; }
    body { margin: 0; }
    .ot-print, .ot-print * { visibility: visible; }
    .ot-print { 
      position: absolute; left: 0; top: 0; 
      width: 100%; margin: 0; padding: 0;
      transform: scale(1); /* No scaling for A4 */
    }
    .ot-print { font-size: 11px; }
    .ot-doc-title { font-size: 14px; }
    .ot-sign-title { font-size: 11px; }
    .ot-table { font-size: 10px; margin-bottom: 8px; }
    
    .ot-info-grid, .ot-summary, .ot-sub-title { background-color: #fff !important; border-color: #000 !important; }
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
  }
`;

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

const handlePrintDocument = () => {
  window.print();
};

export default function BulkOTPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsString = searchParams.get("ids");
  const ids = idsString?.split(",") || [];

  const [dataList, setDataList] = useState<OvertimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllOvertimeData = async () => {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const requesterId = getAdminIdFromLocalStorage() ?? "system";
      const results: OvertimeData[] = [];

      for (const id of ids) {
        try {
          const response = await callApiService.post(
            "/api/v1/timesheet/overtime/read",
            { id: String(id), request_id: String(requesterId) }
          );
          const body = response?.data;
          if (body && body.status === 200) {
            const items = Array.isArray(body.data) ? body.data : [];
            if (items.length > 0) {
              results.push(items[0]);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch OT ${id}:`, error);
        }
      }

      setDataList(results);
      setLoading(false);
    };

    fetchAllOvertimeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsString]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
    );
  }

  if (dataList.length === 0) {
    return <div className="p-8 text-center text-red-500">ไม่พบข้อมูล</div>;
  }

  return (
    <div style={{ padding: "24px", background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Action Header */}
      <div
        className="no-print"
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
          พรีวิวเอกสารโอที ({dataList.length} รายการ)
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button onClick={() => router.back()}>กลับ</Button>
          <Button type="primary" onClick={handlePrintDocument}>
            พิมพ์ / ดาวน์โหลด PDF
          </Button>
        </div>
      </div>

      {/* Main Paper Preview */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <style>{PRINT_STYLES}</style>
        {dataList.map((data, pageIndex) => {
          const totalHours =
            data.descriptions?.reduce((acc, item) => {
              const raw = item?.duration ?? 0;
              const parsed = Number(String(raw));
              return Number.isNaN(parsed) ? acc : acc + parsed;
            }, 0) || 0;

          const userData = getUserById(data?.requester_id ?? "");
          const requesterName =
            userData && (userData.firstname || userData.lastname)
              ? `${userData.firstname ?? ""} ${userData.lastname ?? ""}`.trim()
              : data?.requester_id ?? "-";
          const employeeCode =
            userData?.employee_code ?? data?.created_by ?? "-";
          const position =
            userData?.position ?? getPositionFromLocalStorage() ?? "-";
          const department = data?.department ?? "IT";
          const headerDate = data?.request_date ?? data?.created_at ?? null;

          return (
            <div
              key={data.id || pageIndex}
              className={pageIndex < dataList.length - 1 ? "page-break" : ""}
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: "#fff",
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)",
                padding: "0",
              }}
            >
              <div className="ot-print">
                <div className="ot-container">
                  {/* HEADER SECTION */}
                  <div className="ot-header-box">
                    <div className="ot-logo">
                      <img
                        src="/sb_logo.webp"
                        alt="School Bright"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    </div>
                    <div className="ot-doc-title">
                      แบบคำขอทำงานล่วงเวลา (OT)
                    </div>
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
                            headerDate
                              ? dayjs(headerDate).format("DD/MM/YYYY")
                              : ""
                          }
                          placeholder="......./......./.........."
                        />
                      </div>
                    </div>
                  </div>

                  {/* INFO GRID */}
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

                  {/* REQUEST TABLE */}
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
                        {(data.descriptions || []).map((row, idx) => {
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td
                                className="center"
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                {row?.date
                                  ? dayjs(row.date).format("DD/MM/YYYY")
                                  : "-"}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                <div className="ot-desc">
                                  {row?.description ?? ""}
                                </div>
                              </td>
                              <td
                                className="center"
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                <EditableField
                                  initialValue={String(row?.duration || "")}
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                <EditableField
                                  initialValue=""
                                  placeholder="-"
                                  inputStyle={{
                                    minWidth: "80px",
                                    color: "#000",
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div
                      className="ot-summary"
                      style={{
                        border: "1px solid #000",
                        backgroundColor: "#fff",
                      }}
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

                    {/* SIGNATURES */}
                    <div className="ot-signature-section">
                      <div className="ot-sign-box">
                        <div className="ot-sign-title">ผู้ขออนุมัติ</div>
                        <EditableSignature />
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
                        <div className="ot-sign-title">
                          ผู้อนุมัติ (หัวหน้างาน)
                        </div>
                        <EditableSignature initialImageSrc="/signatures/THANAT.png" />
                        <div className="ot-sign-line"></div>
                        <div className="ot-sign-name">
                          <EditableField placeholder="(หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ)" />
                        </div>
                        <div className="ot-sign-date">
                          วันที่{" "}
                          <EditableField placeholder="....... / ....... / ..........." />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* APPROVAL TABLE */}
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
                        {(data.descriptions || []).map((row, idx) => {
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td
                                className="center"
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                {row?.date
                                  ? dayjs(row.date).format("DD/MM/YYYY")
                                  : "-"}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                <div className="ot-desc">
                                  {row?.description ?? ""}
                                </div>
                              </td>
                              <td
                                className="center"
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                <EditableField
                                  initialValue={String(row?.duration || "")}
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
                                style={{
                                  border: "1px solid #000",
                                  color: "#000",
                                }}
                              >
                                <EditableField
                                  initialValue=""
                                  placeholder="-"
                                  inputStyle={{
                                    minWidth: "80px",
                                    color: "#000",
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ height: "20px" }}></div>

                    {/* SIGNATURES */}
                    <div className="ot-signature-section">
                      <div className="ot-sign-box">
                        <div className="ot-sign-title">ผู้ขออนุมัติ</div>
                        <EditableSignature />
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
                        <div className="ot-sign-title">
                          ผู้อนุมัติ (หัวหน้างาน)
                        </div>
                        <EditableSignature initialImageSrc="/signatures/THANAT.png" />
                        <div className="ot-sign-line"></div>
                        <div className="ot-sign-name">
                          <EditableField placeholder="(หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ)" />
                        </div>
                        <div className="ot-sign-date">
                          วันที่{" "}
                          <EditableField placeholder="....... / ....... / ..........." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
