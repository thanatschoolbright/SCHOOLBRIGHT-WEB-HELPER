/**
 * CronJob Script — ตรวจสอบสถานะ Hardware และส่งแจ้งเตือนผ่าน LINE
 * รันโดย Kubernetes CronJob ทุก 1 นาที (Asia/Bangkok)
 * Time Condition: 18:00–06:00 ระงับการแจ้งเตือน
 */

const APP_URL =
  process.env.APP_INTERNAL_URL ?? "http://sb-helper.schoolbright.co";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// ✨ ตรวจสอบ Time Condition — ช่วง 18:00-06:00 ไม่ส่งแจ้งเตือน
function isQuietHours(): boolean {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const hour = bangkokTime.getHours();
  return hour >= 18 || hour < 6;
}

// ✨ ฟังก์ชันหลัก — เรียก API แล้วส่งแจ้งเตือนผ่าน LINE
async function main() {
  const timestamp = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });
  console.log(`[${timestamp}] Starting device monitor...`);

  if (isQuietHours()) {
    console.log(
      `[${timestamp}] Quiet hours (18:00–06:00) — skipping notification`,
    );
    process.exit(0);
  }

  try {
    const response = await fetch(
      `${APP_URL}/api/v1/hardware/machine-monitoring/channel/line`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    const body = await response.json();
    console.log(`[${timestamp}] HTTP Status: ${response.status}`);
    console.log(`[${timestamp}] Response:`, JSON.stringify(body, null, 2));

    if (!response.ok) {
      console.error(`[${timestamp}] FAILED — status ${response.status}`);
      process.exit(1);
    }

    console.log(`[${timestamp}] SUCCESS`);
    process.exit(0);
  } catch (error) {
    console.error(`[${timestamp}] ERROR:`, error);
    process.exit(1);
  }
}

main();
