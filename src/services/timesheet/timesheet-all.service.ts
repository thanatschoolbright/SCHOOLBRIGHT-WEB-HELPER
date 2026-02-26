import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { toast } from "sonner";

import type { Project, SubProject } from "@/stores/type";
import type { TimesheetEntry } from "@/types/timesheet-table.types";

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
      },
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
      },
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
  projectId: number,
): Promise<SubProject[]> => {
  const toastId = toast.loading("กำลังโหลดโครงการย่อย...");

  try {
    const response = await axios.post<ApiResponse<SubProject[]>>(
      "/api/v1/timesheet/project/sub-project/read/",
      {
        limit: 200,
        page: 1,
        project_id: Number(projectId),
      },
    );

    const subProjects = response.data?.data ?? [];
    toast.success("โหลดโครงการย่อยสำเร็จ", { id: toastId });

    return subProjects;
  } catch (error: any) {
    toast.error(error?.message ?? "ไม่สามารถโหลดโครงการย่อยได้", {
      id: toastId,
    });

    return [];
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
      },
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

//** Service สำหรับส่งออกไฟล์ Template 4: Audit Report with Overview and Evidence */
export const POST_EXPORT_AUDIT_REPORT = async (params: {
  start_date: string;
  end_date: string;
}): Promise<void> => {
  let toastId: string | number | undefined;

  try {
    toastId = toast.loading("กำลังสร้างรายงานสำหรับ Audit...");

    // ใช้ axios (callApiService) เพื่อให้ได้ interceptors, auth headers และ logging ที่ถูกต้อง
    const response = await axios.post(
      "/api/v1/timesheet/excel/template_4",
      {
        start_date: params.start_date,
        end_date: params.end_date,
      },
      {
        responseType: "blob", // สำคัญมากสำหรับการดาวน์โหลดไฟล์
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      },
    );

    // สร้าง Blob จากข้อมูลที่ได้ (axios จะใส่ข้อมูลไว้ใน response.data)
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Helper to format date as DD/MM/YYYY (Buddhist Era)
    const formatDateThai = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-");
      const thYear = parseInt(year, 10) + 543;
      return `${day}/${month}/${thYear}`;
    };

    link.href = url;
    link.download = `รายงานการทำงานของพนักงาน วันที่ ${formatDateThai(
      params.start_date,
    )} ถึง ${formatDateThai(params.end_date)}.xlsx`;

    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    toast.success("สร้างรายงานสำหรับ Audit เรียบร้อย", { id: toastId });
  } catch (error: any) {
    console.error("[POST_EXPORT_AUDIT_REPORT][Error]", error);
    const message = error?.message || "สร้างรายงานไม่สำเร็จ";
    if (toastId !== undefined) {
      toast.error(message, { id: toastId });
    } else {
      toast.error(message);
    }
    throw error;
  }
};
