import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

// ตรวจสอบ API สิทธิ์การใช้งานของโรงเรียนสำหรับผู้ใช้ในแอปมือถือ
export async function checkPermissionService(
	accessToken?: string,
): Promise<HealthCheckResult> {
	const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

	const PERMISSION_CONFIG = {
		url: `${API_URL.PROD_SB_API_URL}/api/school/permission`,
		method: "GET",
		params: {
			school_id: "849",
		},
		headers: {
			"JabjaiKey-849-1230336": targetToken,
		},
	};

	let domain = "localhost";
	try {
		domain = new URL(PERMISSION_CONFIG.url).hostname;
	} catch {
		domain = "localhost";
	}

	const curlCommand = generateCurlCommand(PERMISSION_CONFIG);

	const baseResult = {
		module: "check-permission",
		group: "user-system",
		name_th: "ระบบผู้ใช้งาน - ตรวจสอบสิทธิ์ของโรงเรียน",
		name_en: "User System - Check School Permission",
		service: domain,
		curl: curlCommand,
		request: PERMISSION_CONFIG,
	};

	const startTime = performance.now();
	try {
		const response = await axios(PERMISSION_CONFIG);
		const response_time_ms = Math.round(performance.now() - startTime);
		return {
			...baseResult,
			status: String(response.status),
			response: response.data,
			response_time_ms,
		};
	} catch (error: unknown) {
		const response_time_ms = Math.round(performance.now() - startTime);
		if (axios.isAxiosError(error)) {
			return {
				...baseResult,
				status: String(error.response?.status ?? 500),
				response: error.response?.data ?? error.message,
				response_time_ms,
			};
		}

		return {
			...baseResult,
			status: "500",
			response: { message: "Unknown Error" },
			response_time_ms,
		};
	}
}
