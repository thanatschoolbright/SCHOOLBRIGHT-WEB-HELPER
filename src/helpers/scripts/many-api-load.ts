import http, { Response } from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

// ✅ Credential type definition
type Credential = {
  user: string;
  pass: string;
  schoolid: number;
  imei: string;
};

// 📦 Load test users (valid + invalid credentials)
const credentials = new SharedArray<Credential>("users", () => [
  { user: "2250", pass: "1", schoolid: 849, imei: "" },
  { user: "2251", pass: "wrong", schoolid: 849, imei: "" },
  { user: "2252", pass: "123456", schoolid: 849, imei: "" },
  { user: "9999", pass: "invalid", schoolid: 849, imei: "" },
]);

// 🌐 Read base URL from environment variable
const base_url = __ENV.BASE_URL;
if (!base_url) {
  throw new Error("❌ Missing BASE_URL! Please specify via --env BASE_URL=");
}

// 🔧 Load test configuration
export const options = {
  vus: 500,
  duration: "60s",
};

export default function main(): void {
  // 👤 Select test user for this VU
  const user = credentials[__VU % credentials.length];
  console.log(
    `🌀 VU: ${__VU}, Iteration: ${__ITER}, Testing with user: ${user.user}`
  );

  // 🧾 Common headers for all requests
  const headers = {
    Cookie: "HWWAFSESID=static_session_id; HWWAFSESTIME=1751251207449",
    "Content-Type": "application/json",
    "JabjaiKey-849-1230336":
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjIyNTAiLCJlbWFpbCI6IjIyNTBfODQ5XzFAc2Nob29sYnJpZ2h0LmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3Bvc3RhbGNvZGUiOiI4NDkiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxMjMwMzM2IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvaGFzaCI6IjEiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI3LzMvMjAyNSA1OjA1OjM4IFBNIiwibmJmIjoxNzUxMjE2NzM4LCJleHAiOjE3NTE1NjIzMzgsImlhdCI6MTc1MTIxNjczOH0.8HC01zOi1LGmAH0ho1t4XJiCS52o2MkkieC9ThFtVGM",
  };

  // 🔗 API endpoints to test
  const endpoints = {
    verification: `${base_url}/api/verification`,
    school: `${base_url}/api/school`,
    apiurls: `${base_url}/api/device/system/apiurls?applicationtype=all`,
  };

  // 🚀 Batch GET requests to all endpoints
  const responses = http.batch([
    [
      "POST",
      endpoints.verification,
      JSON.stringify({
        Token:
          "cSrMB-xlukcWpFFw1Ll8in:APA91bGPiRUwDoC1hNeYq2PG9eMN7nQ_EJrK5warxaWe1GyZi3e8Zd1VdPyNOqPwbMc3m6wWHzCVvwgwuIku3JpHDjdPBfvTtKvWGNqRsRQIuNyn4nYKxAQ",
        UserID: user.user,
        SchoolID: user.schoolid,
        Imei: "B1199AF3-36D9-416F-BB0D-4D334E3BE43B",
        IPAddress: "",
        Location: "test",
        model: "",
        System: "",
        Type: "",
        Mode: "",
        appVersion: "1",
      }),
      { headers },
    ],
    ["GET", endpoints.school, null, { headers }],
    ["GET", endpoints.apiurls, null, { headers }],
  ]);

  // ✅ Validate and log each response
  Object.values(responses).forEach((res, index) => {
    const name = Object.keys(endpoints)[index];
    console.log(`🌐 Request: ${name}`);
    console.log(`🔸 Status: ${res.status}`);
    console.log(`🔸 Body: ${res.body}`);

    check(res, {
      [`✅ ${name} - status 200`]: (r) => r.status === 200,
    });
  });

  //   sleep(1); // 💤 Simulate user think time
}
