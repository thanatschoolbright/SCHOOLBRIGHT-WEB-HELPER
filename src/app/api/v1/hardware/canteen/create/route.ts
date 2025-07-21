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
    const endpoint = "/api/v2/applications/version";
    const fullURL = `${apiUrl}${endpoint}`;
    const curlCommand = convertToCurl(apiUrl, endpoint);

    try {
        // Read the incoming request as a FormData (multipart/form-data)
        const contentType = request.headers.get("content-type") || "";
        let data: any;
        let headers: Record<string, string> = {};

        if (contentType.includes("multipart/form-data")) {
            // Use the experimental formData() API from Next.js
            // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#parsing-form-data
            const formData = await request.formData();

            // Convert FormData to a format suitable for axios/fetch
            // We'll use node-fetch's FormData if available, otherwise fallback to undici's
            // But for callWithLogging, we assume it can handle FormData directly
            
            data = formData;
            console.log("📥 [DEBUG] Parsed FormData Entries:", data);
            // Remove content-type so fetch/axios can set the correct boundary
            headers = {};
        } else if (contentType.includes("application/json")) {
            data = await request.json();
            headers = { "Content-Type": "application/json" };
        } else {
            // Fallback: just pass the raw body
            data = request.body;
        }

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

        return NextResponse.json(
            {
                data: apiResponse.data,
                curl: curlCommand,
            },
            { status: apiResponse.status }
        );
    } catch (error: any) {
        const statusCode = error?.response?.status || 500;
        return NextResponse.json(
            {
                message: error?.message || "Internal Server Error",
                raw: error?.response?.data || null,
            },
            { status: statusCode }
        );
    }
}