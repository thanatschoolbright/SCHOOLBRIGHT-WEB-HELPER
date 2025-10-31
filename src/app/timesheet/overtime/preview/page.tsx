"use client";

import React, { useEffect, useState } from "react";
import { Button } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function OTPreviewPage() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ot_preview");
      if (raw) setData(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to read preview data", e);
    }
  }, []);

  if (!data) return <div style={{ padding: 24 }}>ไม่มีข้อมูลสำหรับพรีวิว</div>;

  const handlePrint = () => {
    window.print();
  };

  const totalHours = (data.descriptions || []).reduce(
    (s: number, it: any) => s + Number(it.duration || 0),
    0
  );

  return (
    // Force a light background/color for the preview area so dark-mode UI doesn't invert the printed form
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
          <Button
            type="primary"
            onClick={handlePrint}
            style={{ marginRight: 8 }}
          >
            พิมพ์ / ดาวน์โหลด
          </Button>
        </div>
      </div>

      <div
        id="print-area"
        className="ot-print"
        style={{ padding: 16, backgroundColor: "#ffffff", color: "#000000" }}
      >
        <style>{`
          :root { color-scheme: light; }
          @media print {
            body * { visibility: hidden; }
            .ot-print, .ot-print * { visibility: visible; }
            .ot-print { position: absolute; left: 0; top: 0; width: 100%; }
            /* prefer exact colors when printing */
            .ot-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          /* Force light theme colors for preview area to avoid dark-mode overrides */
          .ot-print, .ot-print .ot-form { background: #ffffff !important; color: #000000 !important; }
          .ot-form { font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
          .ot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .ot-title { text-align: center; font-weight: bold; border: 1px solid #000; padding: 6px; }
          .ot-table { width: 100%; border-collapse: collapse; }
          .ot-table th, .ot-table td { border: 1px solid #000; padding: 6px; background: #ffffff !important; color: #000000 !important; }
          /* Ensure any inherited dark-mode backgrounds don't bleed through */
          .ot-print * { background-color: transparent !important; }
          .ot-table th, .ot-table td { background-color: #ffffff !important; }
        `}</style>

        <div className="ot-form">
          <div className="ot-header">
            <div>
              <img
                src="/sb_logo.webp"
                alt="School Bright"
                style={{ height: 36 }}
              />
            </div>
            <div style={{ flex: 1, marginLeft: 12 }}>
              <div className="ot-title">แบบคำขอ ทำงานล่วงเวลา (โอที)</div>
            </div>
            <div style={{ width: 160, textAlign: "right" }}>
              วันที่:{" "}
              {data.submittedAt
                ? dayjs(data.submittedAt).format("DD/MM/YYYY")
                : "-"}
            </div>
          </div>

          <div
            style={{ display: "flex", gap: 12, marginTop: 8, marginBottom: 12 }}
          >
            <div style={{ flex: 1 }}>
              <strong>ชื่อ - สกุล:</strong> {data.firstname ?? "-"}{" "}
              {data.lastname ?? ""}
            </div>
            <div style={{ flex: 1 }}>
              <strong>รหัสพนักงาน:</strong> {data.employee_code ?? "-"}
            </div>
            <div style={{ flex: 1 }}>
              <strong>ตำแหน่ง:</strong> {data.role ?? "-"}
            </div>
            <div style={{ flex: 1 }}>
              <strong>ฝ่าย:</strong> {data.department ?? "-"}
            </div>
          </div>

          <table className="ot-table" style={{ marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={{ width: "12%" }}>วันที่</th>
                <th>รายละเอียดงาน</th>
                <th style={{ width: "12%" }}>จำนวน โอที</th>
                <th style={{ width: "12%" }}>ประเภท</th>
                <th style={{ width: "14%" }}>ผู้มอบหมาย</th>
                <th style={{ width: "14%" }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {(data.descriptions && data.descriptions.length > 0
                ? data.descriptions
                : Array.from({ length: 6 }).map(() => null)
              ).map((d: any, i: number) => (
                <tr key={i}>
                  <td style={{ textAlign: "center" }}>
                    {data.date ? dayjs(data.date).format("DD/MM/YYYY") : "-"}
                  </td>
                  <td>{d?.description ?? ""}</td>
                  <td style={{ textAlign: "right" }}>{d?.duration ?? ""}</td>
                  <td style={{ textAlign: "center" }}>
                    {data.overtimeType === "holiday" ? "วันหยุด" : "วันทำงาน"}
                  </td>
                  <td style={{ textAlign: "center" }}>{data.assignee ?? ""}</td>
                  <td></td>
                </tr>
              ))}
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
              <strong>รวมชั่วโมง:</strong> {totalHours}
            </div>
            <div>
              <strong>เหตุผล:</strong> {data.reason ?? "-"}
            </div>
          </div>

          <div
            style={{
              marginTop: 36,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div>ผู้ขอ</div>
              <div style={{ marginTop: 48 }}>__________________________</div>
              <div>
                วันที่:{" "}
                {data.submittedAt
                  ? dayjs(data.submittedAt).format("DD/MM/YYYY")
                  : "-"}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div>ผู้อนุมัติ</div>
              <div style={{ marginTop: 48 }}>__________________________</div>
              <div>วันที่: ___________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
