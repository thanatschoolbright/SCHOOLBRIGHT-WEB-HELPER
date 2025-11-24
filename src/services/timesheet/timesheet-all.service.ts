import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { toast } from "sonner";

import type {
  TimesheetEntry,
  TimesheetExportData,
} from "@/types/timesheet-table.types";
import type { Project, SubProject } from "@/stores/type";

//** Interface สำหรับ Response ของ API */
interface ApiResponse<T> {
  data?: T;
  pagination?: {
    total: number;
    page_size: number;
    current_page: number;
  };
  message_en?: string;
  message_th?: string;
}

interface SubProjectResponse {
  data?: {
    items: SubProject[];
    total: number;
  };
}

//** Service สำหรับจัดการข้อมูล Timesheet Entries */
export const GET_TIMESHEET_ENTRIES = async (params: {
  limit: number;
  page: number;
}): Promise<{
  entries: TimesheetEntry[];
  total: number;
  pageSize: number;
}> => {
  const toastId = toast.loading("กำลังโหลดข้อมูลลงเวลา...");

  try {
    const response = await axios.post<ApiResponse<TimesheetEntry[]>>(
      "/api/v1/timesheet/entry/read/",
      {
        limit: params.limit,
        page: params.page,
      }
    );

    const entries = response.data?.data ?? [];
    const total = response.data?.pagination?.total ?? 0;
    const pageSize = response.data?.pagination?.page_size ?? params.limit;

    toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });

    return {
      entries,
      total,
      pageSize,
    };
  } catch (error: any) {
    toast.error(error?.message ?? "ไม่สามารถโหลดข้อมูลลงเวลาได้", {
      id: toastId,
    });

    return {
      entries: [],
      total: 0,
      pageSize: params.limit,
    };
  }
};

//** Service สำหรับจัดการข้อมูลโปรเจ็กต์ */
export const GET_PROJECTS = async (params: {
  limit: number;
  page: number;
}): Promise<Project[]> => {
  const toastId = toast.loading("กำลังโหลดโปรเจ็กต์...");

  try {
    const response = await axios.post<ApiResponse<Project[]>>(
      "/api/v1/timesheet/project/read/",
      {
        limit: params.limit,
        page: params.page,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const projects = response.data?.data ?? [];
    toast.success("โหลดโปรเจ็กต์สำเร็จ", { id: toastId });

    return projects;
  } catch (error: any) {
    toast.error(error?.message ?? "ไม่สามารถโหลดโปรเจ็กต์ได้", {
      id: toastId,
    });

    return [];
  }
};

//** Service สำหรับจัดการข้อมูลโปรเจ็กต์ย่อย */
export const GET_SUB_PROJECTS_BY_PROJECT = async (
  projectId: number
): Promise<SubProject[]> => {
  const toastId = toast.loading("กำลังโหลดโครงการย่อย...");

  try {
    const response = await axios.post<SubProjectResponse>(
      "/api/v1/timesheet/project/sub-project/read/",
      {
        limit: 200,
        page: 1,
        project_id: Number(projectId),
      }
    );

    const subProjects = response.data?.data?.items ?? [];
    toast.success("โหลดโครงการย่อยสำเร็จ", { id: toastId });

    return subProjects;
  } catch (error: any) {
    toast.error(error?.message ?? "ไม่สามารถโหลดโครงการย่อยได้", {
      id: toastId,
    });

    return [];
  }
};

//** Service สำหรับส่งออกไฟล์ Template Excel */
export const POST_EXPORT_TEMPLATE = async (
  exportData: TimesheetExportData
): Promise<void> => {
  const pollIntervalMs = 1500;
  const maxAttempts = 120; // roughly 3 minutes
  let toastId: string | number | undefined;

  try {
    toastId = toast.loading("กำลังจัดเตรียมคำขอส่งออก...");

    const response = await fetch("/api/v1/timesheet/excel/template_1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: exportData.start_date,
        end_date: exportData.end_date,
        project_id: exportData.project_id || "",
        sub_project_id: exportData.sub_project_id || "",
        created_by: exportData.created_by || "",
        investment: exportData.investment,
      }),
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถส่งออกไฟล์ได้");
    }

    if (response.status === 202) {
      const payload = await response.json();
      const statusUrl = payload.statusUrl as string;
      const downloadUrl = payload.downloadUrl as string;

      if (!statusUrl || !downloadUrl) {
        throw new Error("ระบบไม่ได้ส่งข้อมูลสถานะการดาวน์โหลดกลับมา");
      }

      const seenSteps = new Set<string>();
      let attempts = 0;

      while (attempts < maxAttempts) {
        attempts += 1;
        const statusResponse = await fetch(statusUrl, { cache: "no-store" });

        if (!statusResponse.ok) {
          const statusError = await statusResponse.json().catch(() => ({}));
          throw new Error(
            statusError?.message_th ||
              statusError?.message_en ||
              "ส่งออกไฟล์ไม่สำเร็จ"
          );
        }

        const statusData = await statusResponse.json();
        const steps = Array.isArray(statusData.steps) ? statusData.steps : [];

        if (steps.length) {
          const latestStep = steps[steps.length - 1];
          if (latestStep?.key && !seenSteps.has(latestStep.key)) {
            seenSteps.add(latestStep.key);
            toast.loading(latestStep.label ?? "กำลังดำเนินการ...", {
              id: toastId,
            });
          }
        }

        if (statusData.status === "ready") {
          toast.loading("ไฟล์พร้อมแล้ว กำลังเตรียมดาวน์โหลด...", {
            id: toastId,
          });

          const downloadResponse = await fetch(downloadUrl, {
            cache: "no-store",
          });

          if (!downloadResponse.ok) {
            const downloadError = await downloadResponse
              .json()
              .catch(() => ({}));
            throw new Error(
              downloadError?.message_th ||
                downloadError?.message_en ||
                "ไม่สามารถดาวน์โหลดไฟล์ได้"
            );
          }

          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = `timesheet-export_${exportData.start_date.replace(
            /-/g,
            ""
          )}_${exportData.end_date.replace(/-/g, "")}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          toast.success("ส่งออกไฟล์เรียบร้อย", { id: toastId });
          return;
        }

        if (statusData.status === "failed") {
          throw new Error(statusData.error || "ไม่สามารถสร้างไฟล์ได้");
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      throw new Error("ส่งออกไฟล์ใช้เวลานานกว่าที่กำหนด กรุณาลองใหม่อีกครั้ง");
    }

    // Fallback: immediate binary response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `timesheet-export_${exportData.start_date.replace(
      /-/g,
      ""
    )}_${exportData.end_date.replace(/-/g, "")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("ส่งออกไฟล์เรียบร้อย", { id: toastId });
  } catch (error: any) {
    const message = error?.message || "ส่งออกไฟล์ไม่สำเร็จ";
    if (toastId !== undefined) {
      toast.error(message, { id: toastId });
    } else {
      toast.error(message);
    }
    throw error;
  }
};

//** Service สำหรับส่งออกข้อมูลทั้งหมดเป็น Excel */
export const POST_EXPORT_ALL_ENTRIES = async (): Promise<{
  entries: TimesheetEntry[];
}> => {
  const toastId = toast.loading("กำลังส่งออกข้อมูล...");

  try {
    const response = await axios.post<ApiResponse<TimesheetEntry[]>>(
      "/api/v1/timesheet/entry/read/",
      {
        limit: 10000,
        page: 1,
      }
    );

    const entries = response.data?.data ?? [];

    if (!entries.length) {
      toast.info("ไม่มีข้อมูลสำหรับส่งออก", { id: toastId });
      return { entries: [] };
    }

    toast.success("ดึงข้อมูลสำหรับส่งออกสำเร็จ", { id: toastId });
    return { entries };
  } catch (error: any) {
    toast.error(error?.message ?? "ส่งออกข้อมูลล้มเหลว", { id: toastId });
    throw error;
  }
};

//** Interface สำหรับข้อมูลการส่งออกแยกตามโปรเจ็ค */
export interface ProjectExportData {
  start_date: string;
  end_date: string;
  export_type: "project" | "sub_project";
}

//** Service สำหรับส่งออกไฟล์ Template Excel แยกตามโปรเจ็ค */
export const POST_EXPORT_PROJECT_TEMPLATE = async (
  exportData: ProjectExportData
): Promise<void> => {
  let toastId: string | number | undefined;

  try {
    toastId = toast.loading("กำลังสร้างรายงานสรุปโปรเจ็ค...");

    const response = await fetch("/api/v1/timesheet/excel/template_2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: exportData.start_date,
        end_date: exportData.end_date,
        export_type: exportData.export_type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message_th ||
          errorData?.message_en ||
          "ไม่สามารถสร้างรายงานได้"
      );
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    const typeLabel =
      exportData.export_type === "project" ? "project" : "subproject";
    link.download = `timesheet-${typeLabel}-summary_${exportData.start_date.replace(
      /-/g,
      ""
    )}_${exportData.end_date.replace(/-/g, "")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("สร้างรายงานสรุปโปรเจ็คเรียบร้อย", { id: toastId });
  } catch (error: any) {
    const message = error?.message || "สร้างรายงานไม่สำเร็จ";
    if (toastId !== undefined) {
      toast.error(message, { id: toastId });
    } else {
      toast.error(message);
    }
    throw error;
  }
};

//** Service สำหรับส่งออกไฟล์ Template 3: Sub-project week-by-week summary */
export const POST_EXPORT_SUB_PROJECT_WEEK_BY_WEEK = async (params: {
  start_date: string;
  end_date: string;
}): Promise<void> => {
  let toastId: string | number | undefined;

  try {
    toastId = toast.loading("กำลังสร้างรายงานสรุปแบบสัปดาห์ต่อสัปดาห์...");

    const response = await fetch("/api/v1/timesheet/excel/template_3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: params.start_date,
        end_date: params.end_date,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message_th ||
          errorData?.message_en ||
          "ไม่สามารถสร้างรายงานได้"
      );
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `timesheet-subproject-weekly_${params.start_date.replace(
      /-/g,
      ""
    )}_${params.end_date.replace(/-/g, "")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("สร้างรายงานเรียบร้อย", { id: toastId });
  } catch (error: any) {
    const message = error?.message || "สร้างรายงานไม่สำเร็จ";
    if (toastId !== undefined) {
      toast.error(message, { id: toastId });
    } else {
      toast.error(message);
    }
    throw error;
  }
};

//** Service สำหรับส่งออกไฟล์ Template 4: Audit Report with Overview and Evidence */
export const POST_EXPORT_AUDIT_REPORT = async (params: {
  start_date: string;
  end_date: string;
}): Promise<void> => {
  let toastId: string | number | undefined;

  try {
    toastId = toast.loading("กำลังสร้างรายงานสำหรับ Audit...");

    const response = await fetch("/api/v1/timesheet/excel/template_4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: params.start_date,
        end_date: params.end_date,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message_th ||
          errorData?.message_en ||
          "ไม่สามารถสร้างรายงานได้"
      );
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `timesheet-audit-report_${params.start_date.replace(
      /-/g,
      ""
    )}_${params.end_date.replace(/-/g, "")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("สร้างรายงานสำหรับ Audit เรียบร้อย", { id: toastId });
  } catch (error: any) {
    const message = error?.message || "สร้างรายงานไม่สำเร็จ";
    if (toastId !== undefined) {
      toast.error(message, { id: toastId });
    } else {
      toast.error(message);
    }
    throw error;
  }
};
