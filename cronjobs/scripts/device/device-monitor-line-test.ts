/**
 * TEST SCRIPT — ทดสอบส่งรายงานสถานะเครื่องเฉพาะโรงเรียนทดสอบ (school_id=849, GroupType=test)
 * ใช้สำหรับ verify ก่อน deploy จริง — ไม่ส่งไปโรงเรียนจริง
 *
 * Run: bun run cronjobs/scripts/device-monitor-line-test.ts
 */

const APP_URL = process.env.APP_INTERNAL_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// school_id ทดสอบ (GroupType=test, GroupId=Cf98092bd75efb8c297ae0132ea663afb)
const TEST_SCHOOL_ID = 849;

async function main() {
  const timestamp = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
  });

  console.log(`[${timestamp}] === TEST MODE — school_id=${TEST_SCHOOL_ID} ===`);
  console.log(`[${timestamp}] APP_URL: ${APP_URL}`);
  console.log(`[${timestamp}] CRON_SECRET: ${CRON_SECRET ? "SET" : "NOT SET"}`);

  try {
    const url = `${APP_URL}/api/v2/hardware/school-device/cronjob/${TEST_SCHOOL_ID}`;
    console.log(`[${timestamp}] Calling: GET ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(30_000),
    });

    const body = await response.json();
    console.log(`[${timestamp}] HTTP Status: ${response.status}`);
    console.log(`[${timestamp}] Response:`, JSON.stringify(body, null, 2));

    if (!response.ok) {
      console.error(`[${timestamp}] FAILED — status ${response.status}`);
      process.exit(1);
    }

    const data = body?.data;
    console.log(`\n[${timestamp}] === SUMMARY ===`);
    console.log(`  School   : ${data?.school_name} (${data?.school_id})`);
    console.log(`  Total    : ${data?.total} เครื่อง`);
    console.log(`  Online   : ${data?.online}`);
    console.log(`  Offline  : ${data?.offline}`);
    console.log(
      `  LINE     : ${data?.line?.success ? "SUCCESS" : "FAILED"} — group_id=${
        data?.line?.group_id
      }`,
    );
    if (data?.line?.error) {
      console.error(`  LINE Err : ${data.line.error}`);
    }

    console.log(`[${timestamp}] SUCCESS`);
    process.exit(0);
  } catch (error) {
    console.error(`[${timestamp}] ERROR:`, error);
    process.exit(1);
  }
}

main();
