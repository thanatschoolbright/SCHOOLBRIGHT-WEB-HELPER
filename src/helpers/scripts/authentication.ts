import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import http, { Response } from "k6/http";

// ประเภทข้อมูลของผู้ใช้สำหรับ login
type Credential = {
  user: string;
  pass: string;
  schoolid: number;
  imei: string;
};

// รายชื่อ credentials จำลอง (ทั้ง valid และ invalid) สำหรับ load test
const credentials = new SharedArray<Credential>("users", () => [
  { user: "2250", pass: "1", schoolid: 849, imei: "" },
  { user: "2251", pass: "wrong", schoolid: 849, imei: "" },
  { user: "2252", pass: "123456", schoolid: 849, imei: "" },
  { user: "9999", pass: "invalid", schoolid: 849, imei: "" },
]);

const base_url = __ENV.BASE_URL;
if (!base_url) {
  throw new Error("Missing BASE_URL! Please specify via --env BASE_URL=");
}

// ตั้งค่า Virtual Users และระยะเวลา
export const options = {
  vus: 10,
  duration: "10s",
};

// สร้าง URL สำหรับ request login
function buildLoginUrl(cred: Credential): string {
  return `${base_url}/api/Login?user=${cred.user}&pass=${cred.pass}&schoolid=${cred.schoolid}&imei=${cred.imei}`;
}

// สร้าง headers แบบ static (จำลอง session)
function getStaticHeaders(): Record<string, string> {
  return {
    Cookie: "HWWAFSESID=static_session_id; HWWAFSESTIME=1751251207449",
  };
}

// แสดงผล Request และ Response ลงใน Console
function printRequestAndResponse(
  url: string,
  headers: Record<string, string>,
  response: Response,
): void {
  // Console logging removed
}

// ตรวจสอบผลลัพธ์ของ response
function runChecks(response: Response): void {
  check(response, {
    "Status is 200": (r) => r.status === 200,
    "Body is JSON": (r) => {
      try {
        if (typeof r.body === "string") {
          JSON.parse(r.body);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    "Login Success message": (r) => {
      try {
        if (typeof r.body === "string") {
          const json = JSON.parse(r.body);
          return json?.Desc === "Login Success !!";
        }
        return false;
      } catch {
        return false;
      }
    },
  });
}

// main function สำหรับ Virtual User แต่ละตัว
export default function main(): void {
  const totalUsers = credentials.length;
  const index = ((__VU - 1) * 10 + __ITER) % totalUsers;
  const user = credentials[index];

  const url = buildLoginUrl(user);
  const headers = getStaticHeaders();
  const res = http.get(url, { headers });

  printRequestAndResponse(url, headers, res);
  runChecks(res);

  sleep(1); // simulate user wait
}
