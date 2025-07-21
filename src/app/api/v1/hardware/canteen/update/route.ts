import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import { callWithLogging } from "@helpers/call-with-logging";
import { convertToCurl } from "@helpers/api/convert-to-curl";

/**
 * Proxy endpoint for creating application version (canteen hardware).
 * Forwards multipart/form-data to DEV_HARDWARE_API_URL.
 */
export async function POST(request: NextRequest) {
    const apiUrl = API_URL.DEV_HARDWARE_API_URL;
    let appIdFromForm: string | null = null;

    try {
        const contentType = request.headers.get("content-type") || "";
        let data: any;
        let headers: Record<string, string> = {};

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            appIdFromForm = formData.get("version_id")?.toString() || null;

            const entries = [...formData.entries()];
            const debugData: Record<string, any> = {};
            entries.forEach(([key, value]) => {
                debugData[key] =
                    typeof value === "object" &&
                    value !== null &&
                    "name" in value &&
                    "size" in value &&
                    "type" in value
                        ? {
                              name: (value as any).name,
                              size: (value as any).size,
                              type: (value as any).type,
                          }
                        : value;
            });
            console.log("📥 [DEBUG] Parsed FormData Entries:", debugData);

            data = formData;
            headers = {}; // Let fetch/axios handle Content-Type + boundary
        } else if (contentType.includes("application/json")) {
            data = await request.json();
            headers = { "Content-Type": "application/json" };
        } else {
            data = request.body;
        }

        const endpoint = `/api/v2/applications/version/update/${appIdFromForm}`;
        const fullURL = `${apiUrl}${endpoint}`;
        const curlCommand = convertToCurl(apiUrl, endpoint);

        const apiResponse = await callWithLogging(
            {
                method: "POST",
                url: fullURL,
                data,
                headers,
            },
            {
                requestPath: request.nextUrl.pathname,
                method: "POST",
                curl: curlCommand,
            }
        );

        console.log("📦 [DEBUG] API Response:", apiResponse.data);

        return NextResponse.json(
            {
                data: apiResponse.data,
                curl: curlCommand,
            },
            { status: apiResponse.status }
        );
    } catch (error: any) {
        const statusCode = error?.response?.status || 500;
        console.error("❌ [ERROR] API Proxy Error:", error?.message);
        return NextResponse.json(
            {
                message: error?.message || "Internal Server Error",
                raw: error?.response?.data || null,
            },
            { status: statusCode }
        );
    }
}