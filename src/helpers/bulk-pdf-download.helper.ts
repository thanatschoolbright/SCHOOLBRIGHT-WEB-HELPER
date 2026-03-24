"use client";

import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

/**
 * Service สำหรับการสร้างไฟล์ PDF จาก HTML Element และรวมเป็นไฟล์ ZIP
 * โดยออกแบบมาเพื่อรองรับภาษาไทยผ่านการแปลง HTML เป็น Canvas (Image) แล้วค่อยวางลงใน PDF
 */
export const bulkPdfDownloadService = {
  /**
   * สร้างไฟล์ PDF จาก HTML Element
   * @param element HTML Element ที่ต้องการแปลงเป็น PDF
   * @param fileName ชื่อไฟล์ PDF
   * @returns Blob ของไฟล์ PDF
   */
  async generatePdfBlob(elements: HTMLElement | HTMLElement[]): Promise<Blob> {
    const elementList = Array.isArray(elements) ? elements : [elements];

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm

    for (let i = 0; i < elementList.length; i++) {
      const el = elementList[i];
      if (!el) continue;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // แต่ละ element เริ่มหน้าใหม่เสมอ (ยกเว้น element แรก)
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // กรณีข้อมูลยาวเกิน 1 หน้า A4
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    return pdf.output("blob");
  },

  /**
   * สร้างไฟล์ ZIP ที่บรรจุ PDF แยกตามโฟลเดอร์รหัสพนักงาน
   * @param items รายการข้อมูล { employeeCode, fileName, element }
   * @param zipFileName ชื่อไฟล์ ZIP หลัก
   * @param onProgress Callback สำหรับแจ้งความคืบหน้า (index, total, status, fileName)
   */
  async generateZip(
    items: Array<{
      employeeCode: string;
      fileName: string;
      element: HTMLElement | HTMLElement[];
    }>,
    zipFileName: string = `OT_Reports_${new Date().getTime()}.zip`,
    onProgress?: (
      index: number,
      total: number,
      status: string,
      fileName: string,
    ) => void,
  ): Promise<void> {
    const zip = new JSZip();
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const item = items[i];
      if (!item) continue;
      const { employeeCode, fileName, element } = item;

      if (onProgress) {
        onProgress(i, total, "processing", fileName);
      }

      try {
        const pdfBlob = await this.generatePdfBlob(element);

        // แยกโฟลเดอร์ตามรหัสพนักงาน
        const folder = zip.folder(employeeCode);
        if (folder) {
          folder.file(fileName, pdfBlob);
        }

        if (onProgress) {
          onProgress(i, total, "completed", fileName);
        }
      } catch (error) {
        console.error(`Failed to generate PDF for ${employeeCode}:`, error);
        if (onProgress) {
          onProgress(i, total, "failed", fileName);
        }
      }
    }

    if (onProgress) {
      onProgress(total, total, "zipping", zipFileName);
    }

    const content = await zip.generateAsync({ type: "blob" });

    saveAs(content, zipFileName);

    if (onProgress) {
      onProgress(total, total, "finished", zipFileName);
    }
  },
};
