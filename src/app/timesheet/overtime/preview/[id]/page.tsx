"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@stores/store";
import { Button } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { toast } from "sonner";
import { getUserById } from "@/helpers/local_storage/user.storage";

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
  start_time?: string;
  end_time?: string;
}

const PRINT_STYLES = `
  :root { color-scheme: light; }
  .ot-print, .ot-print .ot-form { background: #ffffff !important; color: #000000 !important; }
  .ot-form { font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
  .ot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .ot-title { text-align: center; font-weight: bold; border: 1px solid #000; padding: 6px; }
  .ot-table { width: 100%; border-collapse: collapse; }
  .ot-table th, .ot-table td { border: 1px solid #000; padding: 6px; background: #ffffff !important; color: #000000 !important; }
  .ot-print * { background-color: transparent !important; }
  .ot-table th, .ot-table td { background-color: #ffffff !important; }
  @media print {
    body * { visibility: hidden; }
    .ot-print, .ot-print * { visibility: visible; }
    .ot-print { position: absolute; left: 0; top: 0; width: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    /* Show full descriptions when printing (disable screen-only ellipsis) */
    .ot-print .ot-desc {
      display: block !important;
      -webkit-line-clamp: unset !important;
      -webkit-box-orient: unset !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
      word-break: break-word !important;
    }
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

const extractIdFromPathname = (pathname: string | null): string => {
  if (!pathname) return "";
  const parts = pathname.split("/");
  return parts[parts.length - 1] || "";
};

const handlePrintDocument = () => {
  const printArea = document.getElementById("print-area");
  if (!printArea) {
    window.print();
    return;
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Preview</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>${printArea.innerHTML}</body>
    </html>
  `;

  try {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  } catch (error) {
    console.error("Print failed:", error);
    window.print();
  }
};

const generateEmptyRows = (count: number) =>
  Array.from({ length: count }).map(() => null);

export default function OTPreviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const authentication = useAppSelector((state) => state.callAdminLogin);

  const [data, setData] = useState<OvertimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const idParam = extractIdFromPathname(pathname);

  const totalHours = useMemo(() => {
    if (!data?.descriptions) return 0;

    const sum = data.descriptions.reduce((acc, item) => {
      // Ensure duration is treated as a number. This avoids string concatenation
      // when durations are stored as strings like "02.5" and removes leading zeros.
      const raw = item?.duration ?? 0;
      const parsed = Number(String(raw));
      if (Number.isNaN(parsed)) return acc;
      return acc + parsed;
    }, 0);

    // Normalize to 1 decimal place when needed (e.g. 2.5 stays 2.5, 8.0 becomes 8)
    const normalized = Math.round(sum * 10) / 10;
    return Number.isInteger(normalized) ? normalized : normalized;
  }, [data]);

  const userData = getUserById(data?.requester_id ?? "");
  console.info("Overtime requester data:", userData);

  const requesterId =
    userData?.admin_id ?? getAdminIdFromLocalStorage() ?? "system";
  const requesterName =
    userData && (userData.firstname || userData.lastname)
      ? `${userData.firstname ?? ""} ${userData.lastname ?? ""}`.trim()
      : data?.requester_id ?? "-";
  const employeeCode = userData?.employee_code ?? data?.created_by ?? "-";
  const position = userData?.position ?? getPositionFromLocalStorage() ?? "-";
  const department = data?.department ?? "IT";
  const headerDate = data?.request_date ?? data?.created_at ?? null;

  useEffect(() => {
    const fetchOvertimeData = async () => {
      if (!idParam) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          {
            id: String(idParam),
            request_id: String(requesterId),
          }
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

    fetchOvertimeData();
  }, [idParam, requesterId]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>กำลังโหลดข้อมูล...</div>
    );
  }

  if (notFound) {
    return <div style={{ padding: 24, textAlign: "center" }}>ไม่พบข้อมูล</div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}>ไม่มีข้อมูลสำหรับพรีวิว</div>;
  }

  const hasDescriptions =
    Array.isArray(data.descriptions) && data.descriptions.length > 0;
  const requestRows = hasDescriptions
    ? data.descriptions!
    : generateEmptyRows(6);
  const approvalRows = hasDescriptions
    ? data.descriptions!
    : generateEmptyRows(5);

  return (
    <div style={{ padding: 24, backgroundColor: "#ffffff", color: "#000000" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>แบบคำขอ ทำงานล่วงเวลา (โอที) — Preview</h2>
        <div>
          <Button style={{ marginRight: 8 }} onClick={() => router.back()}>
            กลับ
          </Button>
          <Button type="primary" onClick={handlePrintDocument}>
            พิมพ์ / ดาวน์โหลด
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            maxWidth: "100%",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            border: "1px solid #ccc",
            backgroundColor: "#ffffff",
            padding: 8,
          }}
        >
          <div
            id="print-area"
            className="ot-print"
            style={{
              padding: 16,
              backgroundColor: "#ffffff",
              color: "#000000",
            }}
          >
            <style>{PRINT_STYLES}</style>

            <div className="ot-form">
              <div style={{ border: "2px solid #000", padding: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ width: 180 }}>
                    <img
                      src="/sb_logo.webp"
                      alt="School Bright"
                      style={{ height: 36 }}
                    />
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        border: "2px solid #000",
                        padding: 6,
                        fontWeight: 700,
                      }}
                    >
                      แบบคำขอ ทำงานล่วงเวลา (โอที)
                    </div>
                  </div>
                  <div style={{ width: 220, textAlign: "right" }}>
                    <div>
                      ประจำเดือน: {data.period ?? "......................."}
                    </div>
                    <div>
                      วันที่:{" "}
                      {headerDate
                        ? dayjs(headerDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div>
                      <strong>ชื่อ - สกุล:</strong> {requesterName}
                    </div>
                    <div>
                      <strong>ตำแหน่ง:</strong> {position}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>
                      <strong>รหัสพนักงาน:</strong> {employeeCode}
                    </div>
                    <div>
                      <strong>ฝ่าย:</strong> {department}
                    </div>
                  </div>
                </div>

                <table
                  className="ot-table"
                  style={{
                    width: "100%",
                    border: "2px solid #000",
                    marginBottom: 8,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "10%", border: "2px solid #000" }}>
                        วันที่
                      </th>
                      <th style={{ border: "2px solid #000" }}>
                        รายละเอียดงาน
                      </th>
                      <th style={{ width: "10%", border: "2px solid #000" }}>
                        จำนวน โอที
                      </th>
                      <th style={{ width: "18%", border: "2px solid #000" }}>
                        ประเภท ทำงานล่วงเวลา (โอที)
                      </th>
                      <th style={{ width: "14%", border: "2px solid #000" }}>
                        ผู้มอบหมาย
                      </th>
                      <th style={{ width: "18%", border: "2px solid #000" }}>
                        หมายเหตุ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestRows.map(
                      (row: OvertimeDescription | null, index: number) => (
                        <tr key={index}>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.date
                              ? dayjs(row.date).format("DD/MM/YYYY")
                              : "-"}
                          </td>
                          <td style={{ border: "1px solid #000", padding: 8 }}>
                            {row?.description ? (
                              <div
                                className="ot-desc"
                                style={{
                                  maxWidth: "100%",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  // Ensure content can expand vertically but won't force container wider
                                  display: "block",
                                }}
                              >
                                {/^https?:\/\//.test(
                                  String(row.description)
                                ) ? (
                                  <a
                                    href={String(row.description)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: "#096dd9",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    {String(row.description)}
                                  </a>
                                ) : (
                                  String(row.description)
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.duration ?? "0"} ชั่วโมง
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.type ??
                              (data.overtimeType === "holiday"
                                ? "วันหยุด"
                                : "วันทำงาน")}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {(getUserById(row?.assignee ?? "")?.firstname ??
                              "") +
                              " " +
                              (getUserById(row?.assignee ?? "")?.lastname ??
                                "")}
                          </td>
                          <td style={{ border: "1px solid #000", padding: 8 }}>
                            -
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <div>
                    <strong>รวมชั่วโมง:</strong> {totalHours} ชั่วโมง
                  </div>
                  <div>
                    <strong>เหตุผล:</strong> {data.reason ?? "-"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 28,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div>ผู้ขอ</div>
                    <div style={{ marginTop: 48 }}>
                      __________________________
                    </div>
                    <div>
                      วันที่:{" "}
                      {headerDate
                        ? dayjs(headerDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div>ผู้อนุมัติ</div>
                    <div style={{ marginTop: 48 }}>
                      __________________________
                    </div>
                    <div>วันที่: ___________________</div>
                  </div>
                </div>
              </div>

              <div
                style={{ border: "2px solid #000", padding: 8, marginTop: 12 }}
              >
                <div style={{ textAlign: "center", fontWeight: 700 }}>
                  แบบฟอร์ม อนุมัติทำงานล่วงเวลา (โอที)
                </div>

                <table
                  style={{
                    width: "100%",
                    border: "2px solid #000",
                    marginTop: 8,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "12%", border: "2px solid #000" }}>
                        วันที่
                      </th>
                      <th style={{ border: "2px solid #000" }}>
                        รายละเอียดงาน
                      </th>
                      <th style={{ width: "12%", border: "2px solid #000" }}>
                        เริ่มต้น
                      </th>
                      <th style={{ width: "12%", border: "2px solid #000" }}>
                        สิ้นสุด
                      </th>
                      <th style={{ width: "12%", border: "2px solid #000" }}>
                        จำนวนชั่วโมง
                      </th>
                      <th style={{ width: "20%", border: "2px solid #000" }}>
                        หมายเหตุ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalRows.map(
                      (row: OvertimeDescription | null, index: number) => (
                        <tr key={index}>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.date
                              ? dayjs(row.date).format("DD/MM/YYYY")
                              : "-"}
                          </td>
                          <td style={{ border: "1px solid #000", padding: 8 }}>
                            {row?.description ? (
                              <div
                                className="ot-desc"
                                style={{
                                  maxWidth: "100%",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  display: "block",
                                }}
                              >
                                {/^https?:\/\//.test(
                                  String(row.description)
                                ) ? (
                                  <a
                                    href={String(row.description)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: "#096dd9",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    {String(row.description)}
                                  </a>
                                ) : (
                                  String(row.description)
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.start_time ??
                              (data.request_date
                                ? dayjs(data.request_date).format("DD/MM/YYYY")
                                : "-")}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.end_time ??
                              (data.request_date
                                ? dayjs(data.request_date).format("DD/MM/YYYY")
                                : "-")}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              border: "1px solid #000",
                              padding: 8,
                            }}
                          >
                            {row?.duration ?? "-"}
                          </td>
                          <td style={{ border: "1px solid #000", padding: 8 }}>
                            -
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div>ผู้รับ</div>
                    <div style={{ marginTop: 48 }}>
                      __________________________
                    </div>
                    <div>
                      วันที่:{" "}
                      {headerDate
                        ? dayjs(headerDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div>ผู้อนุมัติ</div>
                    <div style={{ marginTop: 48 }}>
                      __________________________
                    </div>
                    <div>
                      วันที่:{" "}
                      {headerDate
                        ? dayjs(headerDate).format("DD/MM/YYYY")
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
