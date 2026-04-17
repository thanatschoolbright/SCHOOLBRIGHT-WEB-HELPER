"use client";

import {
  CheckCircleFilled,
  LoadingOutlined,
  MailOutlined,
  PaperClipOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  Modal,
  Row,
  Steps,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import axios from "axios";
import React, { useState } from "react";
import { toast } from "sonner";

const { Text } = Typography;

const PRESET_EMAILS = [
  "wichuda.korn@schoolbright.co",
  "thanat.light@schoolbright.co",
  "hr@schoolbright.co",
];

interface StepStatus {
  status: "wait" | "process" | "finish" | "error";
  label: string;
}

interface BulkEmailModalProps {
  open: boolean;
  onClose: () => void;
  selectedKeys: React.Key[];
  selectedRecords: any[];
}

const INITIAL_STEPS: StepStatus[] = [
  { status: "wait", label: "ดึงข้อมูล OT" },
  { status: "wait", label: "สร้างไฟล์ PDF" },
  { status: "wait", label: "บีบอัดเป็น ZIP" },
  { status: "wait", label: "ส่งอีเมล" },
  { status: "wait", label: "สำเร็จ" },
];

/**
 * Modal สำหรับส่ง OT PDF รวมเป็นไฟล์ ZIP ผ่านอีเมลหลายผู้รับพร้อมกัน
 */
const BulkEmailModal: React.FC<BulkEmailModalProps> = ({
  open,
  onClose,
  selectedKeys,
  selectedRecords,
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ sent: number; failed: number } | null>(null);
  const [steps, setSteps] = useState<StepStatus[]>(INITIAL_STEPS);

  // อัปเดต step ตามลำดับ
  const updateStep = (index: number, status: StepStatus["status"]) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)));
  };

  // เพิ่มอีเมลเข้ารายชื่อผู้รับ พร้อม validate รูปแบบ
  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.warning("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    if (recipients.includes(trimmed)) {
      toast.warning("อีเมลนี้มีอยู่แล้วในรายการ");
      return;
    }
    setRecipients((prev) => [...prev, trimmed]);
    setEmailInput("");
  };

  // ลบอีเมลออกจากรายชื่อผู้รับ
  const removeEmail = (email: string) => {
    setRecipients((prev) => prev.filter((e) => e !== email));
  };

  // เพิ่ม preset email เข้ารายการ ถ้ายังไม่มี
  const addPresetEmail = (email: string) => {
    if (recipients.includes(email)) return;
    setRecipients((prev) => [...prev, email]);
  };

  // ส่ง OT PDF เป็น ZIP ทางอีเมล โดยใช้ template เดียวกับ handleBulkPdfDownloadZip
  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast.warning("กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการ");
      return;
    }
    if (selectedKeys.length === 0) {
      toast.warning("ไม่มีรายการ OT ที่เลือก");
      return;
    }

    setIsRunning(true);
    setIsDone(false);
    setResultSummary(null);

    // ฟังก์ชันดึงรูปภาพเป็น base64 (เหมือน handleBulkPdfDownloadZip)
    const fetchImageAsBase64 = async (url: string): Promise<string> => {
      try {
        const fetchUrl = url.startsWith("/")
          ? url
          : `/api/v1/proxy/image?url=${encodeURIComponent(url)}`;
        const res = await fetch(fetchUrl);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
    const formatDateThai = (date: string | null | undefined, sep = "/") => {
      if (!date) return "-";
      const d = dayjs(date);
      return `${d.format("DD")}${sep}${d.format("MM")}${sep}${d.year() + 543}`;
    };

    // ฟังก์ชันแปลงเวลาเป็นทศนิยม 2 ตำแหน่ง
    const formatDurationToDecimal = (minutes: number) => {
      if (!minutes || minutes <= 0) return "0.00";
      return (minutes / 60).toFixed(2);
    };

    // เตรียม container + style เหมือน handleBulkPdfDownloadZip ทุกอย่าง
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
      .ot-print-temp {
        font-family: 'Sarabun', sans-serif;
        color: #1a1a1b;
        background: #fff;
        width: 210mm;
        padding: 24px 32px;
        box-sizing: border-box;
        line-height: 1.3;
      }
      .ot-header-temp {
        display: flex;
        align-items: center;
        border: 1px solid #fed7aa;
        padding: 10px;
        margin-bottom: 12px;
        border-radius: 8px;
        background: #fff7ed;
      }
      .ot-doc-title-temp {
        flex: 1;
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        color: #9a3412;
      }
      .ot-doc-meta-temp {
        font-size: 10px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        color: #c2410c;
        text-align: right;
      }
      .ot-info-temp {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 24px;
        margin-bottom: 12px;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
      }
      .ot-label-temp { font-weight: 600; color: #475569; min-width: 80px; font-size: 11px; }
      .ot-value-temp { flex: 1; border-bottom: 1px solid #f1f5f9; padding-bottom: 1px; color: #1e293b; font-size: 11px; }
      .ot-table-temp { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
      .ot-table-temp th, .ot-table-temp td { padding: 6px 8px; vertical-align: middle; text-align: center; border: 1px solid #e2e8f0; }
      .ot-table-temp th { background-color: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 9px; }
      .ot-table-temp td { color: #334155; }
      .ot-section-header {
        margin-bottom: 8px;
        padding: 6px 10px;
        background: #f8fafc;
        border-left: 4px solid #475569;
        color: #1e293b;
        font-size: 11px;
        font-weight: 700;
      }
      .ot-summary-temp {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 16px;
        font-weight: 600;
        font-size: 11px;
        margin-bottom: 16px;
        padding: 8px 12px;
        background: #fcfcfc;
        border: 1px solid #f1f5f9;
        border-radius: 6px;
      }
      .ot-total-label { color: #64748b; }
      .ot-total-value { font-size: 14px; color: #1e293b; font-weight: 700; }
      .ot-sign-container-temp { display: flex; justify-content: space-between; margin-top: 12px; gap: 12px; }
      .ot-sign-box-temp { text-align: center; width: 48%; padding: 8px; border: 1px solid #f8fafc; border-radius: 6px; background: #fafafa; }
      .ot-sign-title-temp { font-weight: 700; margin-bottom: 4px; font-size: 11px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
      .ot-sign-line-temp { border-bottom: 1px solid #e2e8f0; margin: 4px auto 4px; width: 70%; }
      .ot-sub-form-temp { margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
      .evidence-page-temp { padding: 24px 32px; }
      .evidence-grid-temp { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
      .evidence-item-temp { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; height: 500px; display: flex; flex-direction: column; align-items: center; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .evidence-label-temp { font-weight: 700; color: #1e293b; margin-bottom: 12px; text-align: center; font-size: 13px; }
      .evidence-img-wrapper-temp { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; border-radius: 8px; background: #f8fafc; padding: 8px; overflow: hidden; }
      .evidence-img-temp { max-width: 100%; max-height: 100%; object-fit: contain; }
    `;
    container.appendChild(styleElement);

    try {
      // Step 0 — ดึงข้อมูล OT
      updateStep(0, "process");
      const { callApiService } = await import("@services/axios-instance/sb-helper.axios");
      const dataItems: any[] = [];
      for (const id of selectedKeys) {
        try {
          const response = await callApiService.post("/api/v1/timesheet/overtime/read", { id: String(id) });
          if (response?.data?.status === 200 && response.data.data?.[0]) {
            dataItems.push(response.data.data[0]);
          }
        } catch {
          // ข้าม id ที่หาไม่เจอ
        }
      }
      if (dataItems.length === 0) {
        updateStep(0, "error");
        toast.error("ไม่พบข้อมูล OT ที่เลือก");
        return;
      }
      updateStep(0, "finish");

      // Step 1 — สร้าง PDF (render HTML เหมือน handleBulkPdfDownloadZip ทุกอย่าง)
      updateStep(1, "process");
      const { bulkPdfDownloadService } = await import("@/helpers/bulk-pdf-download.helper");
      const itemsForZip: Array<{ employeeCode: string; fileName: string; element: HTMLElement[] }> = [];

      for (const data of dataItems) {
        const empCode = data?.requester_employee_code || "UNKNOWN";
        const reqName = data?.requester_name || "-";
        const position = data?.requester_position || "-";
        const department = data?.department || "IT";

        const totalBudgetHours =
          data.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.start_date || !item?.end_date)
              return acc + (Number(item?.duration) || 0);
            const bStart = dayjs(item.start_date).startOf("hour");
            const bEnd = dayjs(item.end_date).add(1, "hour").startOf("hour");
            const diff = bEnd.diff(bStart, "hour");
            return acc + (diff > 0 ? diff : 0);
          }, 0) || 0;

        const totalActualMinutes =
          data.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.start_date || !item?.end_date) return acc;
            const diff = dayjs(item.end_date).diff(dayjs(item.start_date), "minute");
            return acc + (diff > 0 ? diff : 0);
          }, 0) || 0;

        const firstDescription = data.descriptions?.[0] || {};
        const proofData = firstDescription.proof || {};
        const headerDate = data.request_date || data.created_at;

        const [logoBase64, sig1Base64, thanatBase64, img1Base64, img2Base64, img3Base64, img4Base64] =
          await Promise.all([
            fetchImageAsBase64("/sb_logo.webp"),
            proofData.signature_1 ? fetchImageAsBase64(proofData.signature_1) : Promise.resolve(""),
            fetchImageAsBase64("/signatures/THANAT.png"),
            proofData.image_1 ? fetchImageAsBase64(proofData.image_1) : Promise.resolve(""),
            proofData.image_2 ? fetchImageAsBase64(proofData.image_2) : Promise.resolve(""),
            proofData.image_3 ? fetchImageAsBase64(proofData.image_3) : Promise.resolve(""),
            proofData.image_4 ? fetchImageAsBase64(proofData.image_4) : Promise.resolve(""),
          ]);
        const evidenceBase64 = [img1Base64, img2Base64, img3Base64, img4Base64];

        const tempDiv = document.createElement("div");
        tempDiv.className = "ot-print-temp";
        tempDiv.innerHTML = `
          <div class="ot-header-temp">
            <div class="ot-logo" style="width:140px">${logoBase64 ? `<img src="${logoBase64}" style="max-height:45px">` : ""}</div>
            <div class="ot-doc-title-temp">แบบคำขอทำงานล่วงเวลา (OT)</div>
            <div class="ot-doc-meta-temp">
              <div><strong>ประจำเดือน:</strong> ${headerDate ? `${dayjs(headerDate).format("MM")}/${dayjs(headerDate).year() + 543}` : "-"}</div>
              <div><strong>วันที่พิมพ์:</strong> ${formatDateThai(headerDate)}</div>
            </div>
          </div>

          <div class="ot-info-temp">
            <div style="display:flex"><span class="ot-label-temp">ชื่อ - สกุล:</span><span class="ot-value-temp">${reqName}</span></div>
            <div style="display:flex"><span class="ot-label-temp">รหัสพนักงาน:</span><span class="ot-value-temp">${empCode}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ตำแหน่ง:</span><span class="ot-value-temp">${position}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ฝ่าย/แผนก:</span><span class="ot-value-temp">${department}</span></div>
          </div>

          <div class="ot-section-header">รายละเอียดการทำงานล่วงเวลา (ตามแผน)</div>
          <table class="ot-table-temp">
            <thead>
              <tr>
                <th style="width:5%">ลำดับ</th>
                <th style="width:12%">วันที่</th>
                <th>รายละเอียดงานที่ปฏิบัติจริง</th>
                <th style="width:12%">เวลาเริ่ม</th>
                <th style="width:12%">เวลาสิ้นสุด</th>
                <th style="width:10%">รวม (ชม.)</th>
                <th style="width:15%">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${(data.descriptions || []).map((d: any, i: number) => {
                const diffMinutes = d.start_date && d.end_date
                  ? dayjs(d.end_date).add(1, "hour").startOf("hour").diff(dayjs(d.start_date).startOf("hour"), "minute")
                  : (Number(d.duration) || 0) * 60;
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                  <td style="text-align:left">${d.description || "-"}</td>
                  <td>${d.start_date ? dayjs(d.start_date).format("HH:00") : "-"}</td>
                  <td>${d.end_date ? dayjs(d.end_date).add(1, "hour").format("HH:00") : "-"}</td>
                  <td style="font-weight:600">${formatDurationToDecimal(diffMinutes)}</td>
                  <td>-</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>

          <div class="ot-summary-temp">
            <div style="margin-right:auto;color:#64748b;">เหตุผลการขอ: <span style="color:#1e293b">${data.reason || "-"}</span></div>
            <div class="ot-total-label">รวมเวลาทั้งหมด (Plan):</div>
            <div class="ot-total-value">${formatDurationToDecimal(totalBudgetHours * 60)} ชม.</div>
          </div>

          <div class="ot-sign-container-temp">
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ขออนุมัติ</div>
              <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                ${sig1Base64 ? `<img src="${sig1Base64}" style="max-height:40px;">` : ""}
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px;font-weight:600;color:#334155;">(${reqName.replace(/\s*\([^)]*\)/g, "").trim()})</div>
              <div style="font-size:9px;color:#64748b;margin-top:1px;">${position}</div>
              <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(headerDate, " / ")}</div>
            </div>
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ตรวจสอบ / รับทราบ</div>
              <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                ${thanatBase64 ? `<img src="${thanatBase64}" style="max-height:40px;">` : ""}
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px;font-weight:600;color:#334155;">ธนัท พรหมพิริยา</div>
              <div style="font-size:9px;color:#64748b;margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
              <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(headerDate, " / ")}</div>
            </div>
          </div>

          <div class="ot-sub-form-temp">
            <div class="ot-section-header">ส่วนสำหรับบันทึกการปฏิบัติงานจริง (Actual)</div>
            <table class="ot-table-temp">
              <thead>
                <tr>
                  <th style="width:5%">ลำดับ</th>
                  <th style="width:12%">วันที่</th>
                  <th>รายละเอียดงานที่ปฏิบัติจริง</th>
                  <th style="width:12%">เวลาเริ่ม</th>
                  <th style="width:12%">เวลาสิ้นสุด</th>
                  <th style="width:10%">รวม (ชม.)</th>
                  <th style="width:15%">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                ${(data.descriptions || []).map((d: any, i: number) => {
                  const diffM = d.start_date && d.end_date
                    ? dayjs(d.end_date).diff(dayjs(d.start_date), "minute")
                    : 0;
                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                    <td style="text-align:left">${d.description || "-"}</td>
                    <td>${d.start_date ? dayjs(d.start_date).format("HH:mm") : "-"}</td>
                    <td>${d.end_date ? dayjs(d.end_date).format("HH:mm") : "-"}</td>
                    <td style="font-weight:600">${formatDurationToDecimal(diffM)}</td>
                    <td>-</td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
            <div class="ot-summary-temp">
              <div style="margin-left:auto" class="ot-total-label">รวมเวลาปฏิบัติงานจริง (Actual):</div>
              <div class="ot-total-value">${formatDurationToDecimal(totalActualMinutes)} ชม.</div>
            </div>

            <div class="ot-sign-container-temp">
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้บันทึกการทำงาน</div>
                <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                  ${sig1Base64 ? `<img src="${sig1Base64}" style="max-height:40px;">` : ""}
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px;font-weight:600;color:#334155;">(${reqName.replace(/\s*\([^)]*\)/g, "").trim()})</div>
                <div style="font-size:9px;color:#64748b;margin-top:1px;">${position}</div>
                <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(headerDate, " / ")}</div>
              </div>
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้รับรองการทำงาน</div>
                <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                  ${thanatBase64 ? `<img src="${thanatBase64}" style="max-height:40px;">` : ""}
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px;font-weight:600;color:#334155;">ธนัท พรหมพิริยา</div>
                <div style="font-size:9px;color:#64748b;margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
                <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(headerDate, " / ")}</div>
              </div>
            </div>
          </div>
        `;
        container.appendChild(tempDiv);

        // หน้าที่ 2: หลักฐานการทำงาน (เหมือน handleBulkPdfDownloadZip ทุกอย่าง)
        const evidenceDiv = document.createElement("div");
        evidenceDiv.className = "ot-print-temp";
        evidenceDiv.innerHTML = `
          <div class="evidence-page-temp">
            <div style="font-size:16px;font-weight:700;text-align:center;border:2px solid #000;padding:8px;border-radius:4px;">หลักฐานการทำงาน</div>
            <div class="evidence-grid-temp">
              ${[0, 1, 2, 3].map((idx) => `
                <div class="evidence-item-temp">
                  <div class="evidence-label-temp">หลักฐาน #${idx + 1}</div>
                  <div class="evidence-img-wrapper-temp">
                    ${evidenceBase64[idx] ? `<img src="${evidenceBase64[idx]}" class="evidence-img-temp">` : `<div style="color:#999">ไม่มีรูปภาพ</div>`}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
        container.appendChild(evidenceDiv);

        itemsForZip.push({
          employeeCode: empCode,
          fileName: `OT_${empCode}_${reqName}_${dayjs(data.request_date).format("DD-MM-YYYY")}_${data.id}.pdf`,
          element: [tempDiv, evidenceDiv],
        });
      }
      updateStep(1, "finish");

      // Step 2 — บีบอัดเป็น ZIP
      updateStep(2, "process");
      const zipFileName = `SB_OT_Bulk_${dayjs().format("YYYYMMDD_HHmm")}.zip`;
      const zipBlob = await bulkPdfDownloadService.generateZipBlob(itemsForZip);
      updateStep(2, "finish");

      // Step 3 — ส่งอีเมล
      updateStep(3, "process");
      const formData = new FormData();
      formData.append("zip", zipBlob, zipFileName);
      formData.append("recipients", JSON.stringify(recipients));
      formData.append("zip_filename", zipFileName);
      formData.append("ot_count", String(dataItems.length));

      const res = await axios.post("/api/v1/timesheet/overtime/send-email-bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.status === 200) {
        updateStep(3, "finish");
        updateStep(4, "finish");
        setResultSummary({
          sent: res.data.data?.sent ?? recipients.length,
          failed: res.data.data?.failed ?? 0,
        });
        setIsDone(true);
        toast.success(`ส่งอีเมลสำเร็จ ${res.data.data?.sent ?? recipients.length} รายการ`);
      } else {
        updateStep(3, "error");
        toast.error(res?.data?.message_th || "ส่งอีเมลไม่สำเร็จ");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message_th || "เกิดข้อผิดพลาดในการส่งอีเมล";
      toast.error(msg);
      setSteps((prev) =>
        prev.map((s) => (s.status === "process" ? { ...s, status: "error" } : s)),
      );
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsRunning(false);
    }
  };

  // รีเซ็ต state ทั้งหมดเมื่อปิด modal
  const handleClose = () => {
    if (isRunning) return;
    setEmailInput("");
    setRecipients([]);
    setIsRunning(false);
    setIsDone(false);
    setResultSummary(null);
    setSteps(INITIAL_STEPS);
    onClose();
  };

  const currentStepIndex = steps.findIndex((s) => s.status === "process");
  const activeStep = currentStepIndex === -1 ? (isDone ? 5 : 0) : currentStepIndex;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <Flex align="center" gap={8}>
          <MailOutlined style={{ color: "#1677ff" }} />
          <Text strong>ส่ง OT ทางอีเมล</Text>
        </Flex>
      }
      footer={null}
      width={620}
      closable={!isRunning}
      maskClosable={false}
    >
      <Flex vertical gap={20}>
        {/* รายการ OT ที่เลือก */}
        <Card size="small" styles={{ body: { padding: 12 } }}>
          <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
            <PaperClipOutlined />
            <Text strong style={{ fontSize: 13 }}>
              ไฟล์ PDF ที่จะแนบใน ZIP ({selectedKeys.length} รายการ)
            </Text>
          </Flex>
          <Flex wrap="wrap" gap={6}>
            {selectedRecords.slice(0, 8).map((record) => {
              const name =
                `${record.requester_firstname_th || ""} ${record.requester_lastname_th || ""}`.trim() ||
                record.requester_name ||
                `OT #${record.id}`;
              return (
                <Tag key={record.id} icon={<UserOutlined />}>
                  #{record.id} — {name}
                </Tag>
              );
            })}
            {selectedRecords.length > 8 && (
              <Tag>และอีก {selectedRecords.length - 8} รายการ</Tag>
            )}
          </Flex>
        </Card>

        <Divider style={{ margin: 0 }} />

        {/* ส่วนเพิ่มอีเมลผู้รับ */}
        <Flex vertical gap={10}>
          <Text strong>ผู้รับอีเมล</Text>

          <Flex gap={6} wrap="wrap">
            <Text type="secondary" style={{ fontSize: 12 }}>ใช้บ่อย:</Text>
            {PRESET_EMAILS.map((email) => (
              <Tag
                key={email}
                style={{
                  cursor: recipients.includes(email) ? "default" : "pointer",
                  opacity: recipients.includes(email) ? 0.4 : 1,
                }}
                onClick={() => addPresetEmail(email)}
              >
                {email}
              </Tag>
            ))}
          </Flex>

          <Row gutter={8}>
            <Col flex="auto">
              <Input
                placeholder="กรอกอีเมลผู้รับ เช่น hr@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onPressEnter={addEmail}
                prefix={<MailOutlined style={{ color: "#8c8c8c" }} />}
                disabled={isRunning}
              />
            </Col>
            <Col>
              <Button onClick={addEmail} disabled={isRunning}>เพิ่ม</Button>
            </Col>
          </Row>

          {recipients.length > 0 && (
            <Flex wrap="wrap" gap={6}>
              {recipients.map((email) => (
                <Tag
                  key={email}
                  closable={!isRunning}
                  onClose={() => removeEmail(email)}
                  color="blue"
                  icon={<MailOutlined />}
                >
                  {email}
                </Tag>
              ))}
            </Flex>
          )}

          {recipients.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ยังไม่มีผู้รับ — กรอกอีเมลแล้วกด "เพิ่ม" หรือเลือกจากรายการด้านบน
            </Text>
          )}
        </Flex>

        {/* Delivery Tracker */}
        {(isRunning || isDone) && (
          <>
            <Divider style={{ margin: 0 }} />
            <Steps
              size="small"
              current={activeStep}
              status={steps.some((s) => s.status === "error") ? "error" : "process"}
              items={steps.map((s) => ({
                title: s.label,
                status: s.status,
                icon:
                  s.status === "process" ? <LoadingOutlined /> :
                  s.status === "finish" ? <CheckCircleFilled style={{ color: "#52c41a" }} /> :
                  undefined,
              }))}
            />
          </>
        )}

        {/* ผลลัพธ์หลังส่งสำเร็จ */}
        {isDone && resultSummary && (
          <Alert
            type={resultSummary.failed === 0 ? "success" : "warning"}
            message={
              resultSummary.failed === 0
                ? `ส่งอีเมลสำเร็จทั้งหมด ${resultSummary.sent} รายการ`
                : `ส่งสำเร็จ ${resultSummary.sent} รายการ, ล้มเหลว ${resultSummary.failed} รายการ`
            }
            showIcon
          />
        )}

        {/* ปุ่ม action */}
        <Flex justify="flex-end" gap={8}>
          <Button onClick={handleClose} disabled={isRunning}>
            {isDone ? "ปิด" : "ยกเลิก"}
          </Button>
          {!isDone && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendEmail}
              loading={isRunning}
              disabled={recipients.length === 0 || selectedKeys.length === 0}
            >
              ส่งอีเมล ({selectedKeys.length} ไฟล์ → {recipients.length} ผู้รับ)
            </Button>
          )}
        </Flex>
      </Flex>
    </Modal>
  );
};

export default BulkEmailModal;
