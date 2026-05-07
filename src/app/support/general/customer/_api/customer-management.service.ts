import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

const BASE = "/api/v1/support/customer-management";

// ค้นหาลูกค้าที่ถูกล็อกบัญชี
export const GET_LOCKED_CUSTOMERS = async (params: {
  keyword?: string;
  company_id?: number;
  page?: number;
  page_size?: number;
}) => {
  const sp = new URLSearchParams();
  if (params.keyword) sp.set("keyword", params.keyword);
  if (params.company_id) sp.set("company_id", String(params.company_id));
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const response = await axios.get(`${BASE}/search?${sp.toString()}`);
  return response.data;
};

// ดึงรายชื่อโรงเรียนทั้งหมดสำหรับ dropdown
export const GET_COMPANIES = async () => {
  const response = await axios.get(`${BASE}/companies`);
  return response.data;
};

// ปลดล็อกบัญชีลูกค้ารายเดียว
export const POST_UNLOCK_CUSTOMER = async (user_id: number) => {
  const response = await axios.post(`${BASE}/unlock`, { user_id });
  return response.data;
};

export interface UnlockAllProgressEvent {
  type: "start" | "progress" | "done" | "error";
  unlocked?: number;
  total?: number;
  percent?: number;
  message?: string;
}

// ปลดล็อกทั้งหมด — SSE stream รับ callback progress
export const POST_UNLOCK_ALL = (
  company_id: number | undefined,
  onProgress: (event: UnlockAllProgressEvent) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    fetch(`${BASE}/unlock-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id }),
    })
      .then((res) => {
        if (!res.ok) { reject(new Error(`HTTP ${res.status}`)); return; }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) { resolve(); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const dataLine = line.replace(/^data: /, "").trim();
              if (!dataLine) continue;
              try {
                const ev: UnlockAllProgressEvent = JSON.parse(dataLine);
                onProgress(ev);
                if (ev.type === "error") reject(new Error(ev.message));
              } catch { /* ignore malformed */ }
            }
            return pump();
          });
        pump().catch(reject);
      })
      .catch(reject);
  });

// ดึง activity log
export const GET_ACTIVITY_LOGS = async (params: { page?: number; page_size?: number }) => {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  const response = await axios.get(`${BASE}/activity-log?${sp.toString()}`);
  return response.data;
};
