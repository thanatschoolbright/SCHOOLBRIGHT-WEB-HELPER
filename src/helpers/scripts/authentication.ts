import http, { Response } from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

type Credential = {
  user: string;
  pass: string;
  schoolid: number;
  imei: string;
};

// 👥 Load real or test credentials (some valid, some invalid)
const credentials = new SharedArray<Credential>("users", () => [
  { user: "2250", pass: "1", schoolid: 849, imei: "" },
  { user: "2251", pass: "wrong", schoolid: 849, imei: "" },
  { user: "2252", pass: "123456", schoolid: 849, imei: "" },
  { user: "9999", pass: "invalid", schoolid: 849, imei: "" },
]);

export const options = {
  vus: 10,
  duration: "10s",
};

function buildUrl(cred: Credential): string {
  return `https://sbapi.schoolbright.co/api/Login?user=${cred.user}&pass=${cred.pass}&schoolid=${cred.schoolid}&imei=${cred.imei}`;
}

function buildHeaders(): Record<string, string> {
  return {
    Cookie: "HWWAFSESID=static_session_id; HWWAFSESTIME=1751251207449",
  };
}

function logRequestResponse(
  url: string,
  headers: Record<string, string>,
  response: Response
): void {
  console.log("🌐 Request:");
  console.log(`🔹 URL: ${url}`);
  console.log(`🔹 Headers: ${JSON.stringify(headers)}`);
  console.log("📥 Response:");
  console.log(`🔸 Status: ${response.status}`);
  console.log(`🔸 Body: ${response.body}`);
}

export default function () {
  const total = credentials.length;
  const index = ((__VU - 1) * 10 + __ITER) % total;
  const credential = credentials[index];

  console.log(
    `🌀 VU: ${__VU}, Iteration: ${__ITER}, Using user: ${credential.user}, pass: ${credential.pass}`
  );

  const url = buildUrl(credential);
  const headers = buildHeaders();
  const response = http.get(url, { headers });

  logRequestResponse(url, headers, response);

  check(response, {
    "✅ Status is 200": (r) => r.status === 200,
    "✅ Body is JSON": (r) => {
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
    "✅ Login Success message": (r) => {
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

  sleep(1);
}
