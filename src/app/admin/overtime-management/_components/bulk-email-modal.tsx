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
  Avatar,
  Badge,
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Steps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
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
  const [resultSummary, setResultSummary] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [steps, setSteps] = useState<StepStatus[]>(INITIAL_STEPS);

  // อัปเดต step ตามลำดับ
  const updateStep = (index: number, status: StepStatus["status"]) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s)),
    );
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
      const { callApiService } = await import(
        "@services/axios-instance/sb-helper.axios"
      );
      const dataItems: any[] = [];
      for (const id of selectedKeys) {
        try {
          const response = await callApiService.post(
            "/api/v1/timesheet/overtime/read",
            { id: String(id) },
          );
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
      const { bulkPdfDownloadService } = await import(
        "@/helpers/bulk-pdf-download.helper"
      );
      const itemsForZip: Array<{
        employeeCode: string;
        fileName: string;
        element: HTMLElement[];
      }> = [];

      for (const data of dataItems) {
        const empCode = data?.requester_employee_code || "UNKNOWN";
        const reqName = data?.requester_name || "-";
        const position = data?.requester_position || "-";
        const department =
          data?.requester_department ||
          data?.requester_user?.department?.name_th ||
          "-";

        const totalBudgetHours =
          data.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.startDate || !item?.endDate)
              return acc + (Number(item?.duration) || 0);
            const bStart = dayjs(item.startDate).startOf("hour");
            const bEnd = dayjs(item.endDate).add(1, "hour").startOf("hour");
            const diff = bEnd.diff(bStart, "hour");
            return acc + (diff > 0 ? diff : 0);
          }, 0) || 0;

        const totalActualMinutes =
          data.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.startDate || !item?.endDate) return acc;
            const diff = dayjs(item.endDate).diff(
              dayjs(item.startDate),
              "minute",
            );
            return acc + (diff > 0 ? diff : 0);
          }, 0) || 0;

        const firstDescription = data.descriptions?.[0] || {};
        const proofData = firstDescription.proof || {};
        const headerDate = data.request_date || data.created_at;

        const [
          logoBase64,
          sig1Base64,
          thanatBase64,
          img1Base64,
          img2Base64,
          img3Base64,
          img4Base64,
        ] = await Promise.all([
          fetchImageAsBase64("/sb_logo.webp"),
          proofData.signature_1
            ? fetchImageAsBase64(proofData.signature_1)
            : Promise.resolve(""),
          fetchImageAsBase64("/signatures/THANAT.png"),
          proofData.image_1
            ? fetchImageAsBase64(proofData.image_1)
            : Promise.resolve(""),
          proofData.image_2
            ? fetchImageAsBase64(proofData.image_2)
            : Promise.resolve(""),
          proofData.image_3
            ? fetchImageAsBase64(proofData.image_3)
            : Promise.resolve(""),
          proofData.image_4
            ? fetchImageAsBase64(proofData.image_4)
            : Promise.resolve(""),
        ]);
        const evidenceBase64 = [img1Base64, img2Base64, img3Base64, img4Base64];

        const tempDiv = document.createElement("div");
        tempDiv.className = "ot-print-temp";
        tempDiv.innerHTML = `
          <div class="ot-header-temp">
            <div class="ot-logo" style="width:140px">${
              logoBase64
                ? `<img src="${logoBase64}" style="max-height:45px">`
                : ""
            }</div>
            <div class="ot-doc-title-temp">แบบคำขอทำงานล่วงเวลา (OT)</div>
            <div class="ot-doc-meta-temp">
              <div><strong>ประจำเดือน:</strong> ${
                headerDate
                  ? `${dayjs(headerDate).format("MM")}/${
                      dayjs(headerDate).year() + 543
                    }`
                  : "-"
              }</div>
              <div><strong>วันที่พิมพ์:</strong> ${formatDateThai(
                headerDate,
              )}</div>
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
              ${(data.descriptions || [])
                .map((d: any, i: number) => {
                  const diffMinutes =
                    d.startDate && d.endDate
                      ? dayjs(d.endDate)
                          .add(1, "hour")
                          .startOf("hour")
                          .diff(dayjs(d.startDate).startOf("hour"), "minute")
                      : (Number(d.duration) || 0) * 60;
                  return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                  <td style="text-align:left">${d.description || "-"}</td>
                  <td>${
                    d.startDate ? dayjs(d.startDate).format("HH:00") : "-"
                  }</td>
                  <td>${
                    d.endDate
                      ? dayjs(d.endDate).add(1, "hour").format("HH:00")
                      : "-"
                  }</td>
                  <td style="font-weight:600">${formatDurationToDecimal(
                    diffMinutes,
                  )}</td>
                  <td>-</td>
                </tr>`;
                })
                .join("")}
            </tbody>
          </table>

          <div class="ot-summary-temp">
            <div style="margin-right:auto;color:#64748b;">เหตุผลการขอ: <span style="color:#1e293b">${
              data.reason || "-"
            }</span></div>
            <div class="ot-total-label">รวมเวลาทั้งหมด (Plan):</div>
            <div class="ot-total-value">${formatDurationToDecimal(
              totalBudgetHours * 60,
            )} ชม.</div>
          </div>

          <div class="ot-sign-container-temp">
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ขออนุมัติ</div>
              <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                ${
                  sig1Base64
                    ? `<img src="${sig1Base64}" style="max-height:40px;">`
                    : ""
                }
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px;font-weight:600;color:#334155;">(${reqName
                .replace(/\s*\([^)]*\)/g, "")
                .trim()})</div>
              <div style="font-size:9px;color:#64748b;margin-top:1px;">${position}</div>
              <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(
                headerDate,
                " / ",
              )}</div>
            </div>
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ตรวจสอบ / รับทราบ</div>
              <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                ${
                  thanatBase64
                    ? `<img src="${thanatBase64}" style="max-height:40px;">`
                    : ""
                }
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px;font-weight:600;color:#334155;">ธนัท พรหมพิริยา</div>
              <div style="font-size:9px;color:#64748b;margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
              <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(
                headerDate,
                " / ",
              )}</div>
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
                ${(data.descriptions || [])
                  .map((d: any, i: number) => {
                    const diffM =
                      d.startDate && d.endDate
                        ? dayjs(d.endDate).diff(dayjs(d.startDate), "minute")
                        : 0;
                    return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                    <td style="text-align:left">${d.description || "-"}</td>
                    <td>${
                      d.startDate ? dayjs(d.startDate).format("HH:mm") : "-"
                    }</td>
                    <td>${
                      d.endDate ? dayjs(d.endDate).format("HH:mm") : "-"
                    }</td>
                    <td style="font-weight:600">${formatDurationToDecimal(
                      diffM,
                    )}</td>
                    <td>-</td>
                  </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
            <div class="ot-summary-temp">
              <div style="margin-left:auto" class="ot-total-label">รวมเวลาปฏิบัติงานจริง (Actual):</div>
              <div class="ot-total-value">${formatDurationToDecimal(
                totalActualMinutes,
              )} ชม.</div>
            </div>

            <div class="ot-sign-container-temp">
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้บันทึกการทำงาน</div>
                <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                  ${
                    sig1Base64
                      ? `<img src="${sig1Base64}" style="max-height:40px;">`
                      : ""
                  }
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px;font-weight:600;color:#334155;">(${reqName
                  .replace(/\s*\([^)]*\)/g, "")
                  .trim()})</div>
                <div style="font-size:9px;color:#64748b;margin-top:1px;">${position}</div>
                <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(
                  headerDate,
                  " / ",
                )}</div>
              </div>
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้รับรองการทำงาน</div>
                <div style="height:45px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;">
                  ${
                    thanatBase64
                      ? `<img src="${thanatBase64}" style="max-height:40px;">`
                      : ""
                  }
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px;font-weight:600;color:#334155;">ธนัท พรหมพิริยา</div>
                <div style="font-size:9px;color:#64748b;margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
                <div style="font-size:9px;color:#94a3b8;margin-top:2px;">วันที่ ${formatDateThai(
                  headerDate,
                  " / ",
                )}</div>
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
              ${[0, 1, 2, 3]
                .map(
                  (idx) => `
                <div class="evidence-item-temp">
                  <div class="evidence-label-temp">หลักฐาน #${idx + 1}</div>
                  <div class="evidence-img-wrapper-temp">
                    ${
                      evidenceBase64[idx]
                        ? `<img src="${evidenceBase64[idx]}" class="evidence-img-temp">`
                        : `<div style="color:#999">ไม่มีรูปภาพ</div>`
                    }
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `;
        container.appendChild(evidenceDiv);

        itemsForZip.push({
          employeeCode: empCode,
          fileName: `OT_${empCode}_${reqName}_${dayjs(data.request_date).format(
            "DD-MM-YYYY",
          )}_${data.id}.pdf`,
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

      // สร้าง summary สำหรับแสดงในตาราง email
      const otSummary = dataItems.map((d) => {
        const totalMinutes =
          d.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.startDate || !item?.endDate)
              return acc + (Number(item?.duration) || 0) * 60;
            const diff = dayjs(item.endDate)
              .add(1, "hour")
              .startOf("hour")
              .diff(dayjs(item.startDate).startOf("hour"), "minute");
            return acc + (diff > 0 ? diff : 0);
          }, 0) || 0;
        return {
          id: d.id,
          employee_code: d.requester_employee_code || "-",
          name: d.requester_name || "-",
          position: d.requester_position || "-",
          department:
            d.requester_department ||
            d.requester_user?.department?.name_th ||
            "-",
          request_date: d.request_date || d.created_at || null,
          total_hours: (totalMinutes / 60).toFixed(2),
          status: d.status || "-",
        };
      });

      const formData = new FormData();
      formData.append("zip", zipBlob, zipFileName);
      formData.append("recipients", JSON.stringify(recipients));
      formData.append("zip_filename", zipFileName);
      formData.append("ot_count", String(dataItems.length));
      formData.append("ot_summary", JSON.stringify(otSummary));

      const res = await axios.post(
        "/api/v1/timesheet/overtime/send-email-bulk",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res?.data?.status === 200) {
        updateStep(3, "finish");
        updateStep(4, "finish");
        setResultSummary({
          sent: res.data.data?.sent ?? recipients.length,
          failed: res.data.data?.failed ?? 0,
        });
        setIsDone(true);
        toast.success(
          `ส่งอีเมลสำเร็จ ${res.data.data?.sent ?? recipients.length} รายการ`,
        );
      } else {
        updateStep(3, "error");
        toast.error(res?.data?.message_th || "ส่งอีเมลไม่สำเร็จ");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message_th || "เกิดข้อผิดพลาดในการส่งอีเมล";
      toast.error(msg);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "process" ? { ...s, status: "error" } : s,
        ),
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
  const activeStep =
    currentStepIndex === -1 ? (isDone ? 5 : 0) : currentStepIndex;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={null}
      footer={null}
      width={700}
      closable={!isRunning}
      centered
      maskClosable={false}
      styles={{
        body: { padding: 0, overflow: "hidden", borderRadius: 16 },
        mask: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0,0,0,0.4)",
        },
        content: {
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "none",
        },
      }}
    >
      <Flex
        vertical
        className="dark:bg-[#1f1f1f] bg-white transition-colors duration-300"
      >
        {/* Modern Header */}
        <div className="p-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <Flex align="center" gap={16}>
              <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-xl border border-white/20 shadow-inner">
                <MailOutlined style={{ fontSize: 28, color: "#fff" }} />
              </div>
              <Flex vertical gap={4}>
                <Text className="text-2xl font-extrabold text-white m-0 tracking-tight">
                  ส่ง OT ทางอีเมล
                </Text>
                <Text className="text-blue-100 text-sm opacity-90 leading-relaxed max-w-[400px]">
                  ส่งไฟล์ PDF ทั้งหมดในรูปแบบ ZIP
                  ให้กับผู้รับหลายท่านพร้อมกันอย่างเป็นระเบียบ
                </Text>
              </Flex>
            </Flex>
          </motion.div>
          {/* Decorative elements */}
          <div className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-60px] left-[5%] w-56 h-56 bg-indigo-400/20 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-[15%] w-2 h-2 bg-white/40 rounded-full" />
          <div className="absolute bottom-[20%] right-[10%] w-3 h-3 bg-white/20 rounded-full" />
        </div>

        <div className="p-8 space-y-8 dark:bg-[#141414] bg-slate-50/50">
          {/* Selected OT Files Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              size="small"
              className="border-none shadow-sm dark:bg-[#1c1c1c] dark:border-gray-800 hover:shadow-md transition-all duration-300 overflow-hidden"
              styles={{ body: { padding: 20 } }}
            >
              <Flex vertical gap={16}>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={10}>
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl transition-colors">
                      <PaperClipOutlined className="text-orange-600 dark:text-orange-400 text-lg" />
                    </div>
                    <Text strong className="text-base dark:text-gray-200">
                      รายการ OT ที่พร้อมแนบ ({selectedKeys.length})
                    </Text>
                  </Flex>
                  <Tag
                    color="orange"
                    bordered={false}
                    className="rounded-full px-4 py-0.5 m-0 font-medium"
                  >
                    Auto-ZIP Enabled
                  </Tag>
                </Flex>

                <div className="bg-gray-100/50 dark:bg-white/5 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                  <Flex wrap="wrap" gap={10}>
                    <AnimatePresence>
                      {selectedRecords.slice(0, 5).map((record, index) => {
                        const name =
                          `${record.requester_firstname_th || ""} ${
                            record.requester_lastname_th || ""
                          }`.trim() ||
                          record.requester_name ||
                          `OT #${record.id}`;
                        return (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Tooltip title={name}>
                              <Badge
                                count={index + 1}
                                size="small"
                                offset={[-2, 2]}
                                color="orange"
                              >
                                <Tag className="m-0 py-1.5 px-4 bg-white dark:bg-[#2a2a2a] dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-2 hover:border-blue-400 dark:hover:border-blue-500 cursor-default transition-all shadow-sm">
                                  <UserOutlined className="text-gray-400 dark:text-gray-500 text-xs" />
                                  <Text className="text-[13px] font-medium truncate max-w-[130px] dark:text-gray-300">
                                    {name}
                                  </Text>
                                </Tag>
                              </Badge>
                            </Tooltip>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {selectedRecords.length > 5 && (
                      <div className="flex items-center">
                        <Tooltip
                          title={selectedRecords
                            .slice(5)
                            .map((r) => r.requester_name || `#${r.id}`)
                            .join(", ")}
                        >
                          <div className="bg-gray-200/50 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[12px] px-3 py-1 rounded-full font-medium transition-colors">
                            + อีก {selectedRecords.length - 5} รายการ
                          </div>
                        </Tooltip>
                      </div>
                    )}
                  </Flex>
                </div>
              </Flex>
            </Card>
          </motion.div>

          {/* Recipients Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            <Flex vertical gap={6}>
              <Text
                strong
                className="text-base flex items-center gap-2 dark:text-gray-200"
              >
                <MailOutlined className="text-blue-500" /> ตรวจสอบผู้รับอีเมล
              </Text>
              <Text
                type="secondary"
                className="text-sm dark:text-gray-400 px-1"
              >
                เลือกผู้รับจากรายการแนะนำ หรือระบุอีเมลใหม่ด้านล่าง
              </Text>
            </Flex>

            {/* Quick Presets */}
            <Flex
              gap={10}
              wrap="wrap"
              align="center"
              className="bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/20"
            >
              <span className="text-[11px] font-bold text-blue-400 dark:text-blue-300/60 uppercase tracking-widest pl-1">
                PRESETS:
              </span>
              <AnimatePresence>
                {PRESET_EMAILS.map((email) => (
                  <motion.div
                    key={email}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Tag
                      className={`cursor-pointer rounded-full px-4 py-1.5 text-xs border-none shadow-sm transition-all duration-300 ${
                        recipients.includes(email)
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-400 dark:text-blue-300/40 opacity-50 cursor-default"
                          : "bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                      }`}
                      onClick={() =>
                        !recipients.includes(email) && addPresetEmail(email)
                      }
                    >
                      {email}
                    </Tag>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Flex>

            {/* Input & Form */}
            <div className="relative group">
              <Input
                size="large"
                placeholder="ระบุอีเมลผู้รับที่นี่..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onPressEnter={addEmail}
                className="h-14 rounded-2xl border-gray-200 dark:border-gray-800 dark:bg-[#1c1c1c] dark:text-gray-200 hover:border-blue-400 focus:border-blue-500 transition-all pl-4 pr-32 shadow-sm text-base"
                disabled={isRunning}
                prefix={
                  <div className="mr-2 transition-colors group-focus-within:text-blue-500 text-gray-400 text-lg">
                    <MailOutlined />
                  </div>
                }
                suffix={
                  <Button
                    type="primary"
                    onClick={addEmail}
                    disabled={isRunning || !emailInput}
                    className="h-10 rounded-xl px-6 font-bold text-sm"
                  >
                    เพิ่มรายการ
                  </Button>
                }
              />
            </div>

            {/* Recipients List */}
            <div className="min-h-[60px] bg-slate-100/30 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/50 dark:border-gray-800 transition-colors">
              <Flex wrap="wrap" gap={10}>
                <AnimatePresence mode="popLayout">
                  {recipients.map((email) => (
                    <motion.div
                      key={email}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Tag
                        closable={!isRunning}
                        onClose={() => removeEmail(email)}
                        className="m-0 pl-1.5 pr-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-900/30 rounded-full flex items-center gap-2.5 font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm"
                      >
                        <Avatar
                          size={24}
                          className="bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-none text-[10px]"
                        >
                          {email[0].toUpperCase()}
                        </Avatar>
                        {email}
                      </Tag>
                    </motion.div>
                  ))}
                  {recipients.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex justify-center py-2"
                    >
                      <Text
                        type="secondary"
                        className="italic text-sm opacity-50 dark:text-gray-500"
                      >
                        กรุณาระบุที่อยู่อีเมลอย่างน้อย 1 รายการเพื่อดำเนินการต่อ
                      </Text>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Flex>
            </div>
          </motion.div>

          {/* Progress & Result Tracking */}
          <AnimatePresence>
            {(isRunning || isDone) && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-[#1c1c1c] p-7 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm mt-4">
                  <Steps
                    size="small"
                    current={activeStep}
                    className="mb-8"
                    responsive={false}
                    status={
                      steps.some((s) => s.status === "error")
                        ? "error"
                        : "process"
                    }
                    items={steps.map((s, idx) => ({
                      title: (
                        <span className="text-[12px] font-bold dark:text-gray-300">
                          {s.label}
                        </span>
                      ),
                      icon:
                        s.status === "process" ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                            }}
                          >
                            <LoadingOutlined className="text-blue-500 dark:text-blue-400" />
                          </motion.div>
                        ) : s.status === "finish" ? (
                          <CheckCircleFilled className="text-green-500 dark:text-green-400" />
                        ) : idx < activeStep ? (
                          <CheckCircleFilled className="text-green-500 dark:text-green-400" />
                        ) : undefined,
                    }))}
                  />

                  {isDone && resultSummary && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8"
                    >
                      <Alert
                        className={`rounded-2xl border-none p-5 ${
                          resultSummary.failed === 0
                            ? "bg-green-50 dark:bg-green-900/20 shadow-sm shadow-green-100/50"
                            : "bg-orange-50 dark:bg-orange-900/20 shadow-sm shadow-orange-100/50"
                        }`}
                        icon={
                          resultSummary.failed === 0 ? (
                            <CheckCircleFilled className="text-green-500 dark:text-green-400 text-2xl" />
                          ) : undefined
                        }
                        message={
                          <Flex
                            align="center"
                            justify="space-between"
                            className="px-3"
                          >
                            <Flex vertical gap={4}>
                              <Text
                                strong
                                className={`text-lg ${
                                  resultSummary.failed === 0
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-orange-700 dark:text-orange-400"
                                }`}
                              >
                                {resultSummary.failed === 0
                                  ? `เย้! ส่งอีเมลสำเร็จทั้งหมด ${resultSummary.sent} ท่าน`
                                  : `ดำเนินการสำเร็จ ${resultSummary.sent} ท่าน, พบข้อผิดพลาด ${resultSummary.failed} ท่าน`}
                              </Text>
                              <Text className="text-sm opacity-80 dark:text-gray-400">
                                ประวัติการทำงานถูกบันทึกเข้าระบบเรียบร้อยแล้ว
                              </Text>
                            </Flex>
                            {resultSummary.failed === 0 && (
                              <motion.div
                                animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2.5,
                                  ease: "easeInOut",
                                }}
                                className="text-3xl ml-4"
                              >
                                ✨
                              </motion.div>
                            )}
                          </Flex>
                        }
                        showIcon
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Footer */}
        <div className="p-6 dark:bg-[#1c1c1c] bg-white border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 rounded-b-2xl transition-colors">
          <Button
            onClick={handleClose}
            disabled={isRunning}
            size="large"
            className="rounded-xl h-12 px-8 font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 dark:text-gray-300 transition-all"
          >
            {isDone ? "ปิดหน้าจอ" : "ยกเลิกการส่ง"}
          </Button>
          {!isDone && (
            <motion.div
              whileHover={{
                scale:
                  recipients.length === 0 || selectedKeys.length === 0
                    ? 1
                    : 1.03,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                type="primary"
                size="large"
                icon={
                  isRunning ? (
                    <LoadingOutlined />
                  ) : (
                    <SendOutlined className="rotate-[-15deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )
                }
                onClick={handleSendEmail}
                loading={isRunning}
                disabled={recipients.length === 0 || selectedKeys.length === 0}
                className="rounded-xl h-12 px-10 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-blue-200 dark:shadow-none shadow-xl group transition-all"
              >
                เริ่มต้นส่งข้อมูล ( {recipients.length} ผู้รับ )
              </Button>
            </motion.div>
          )}
        </div>
      </Flex>
    </Modal>
  );
};

export default BulkEmailModal;
