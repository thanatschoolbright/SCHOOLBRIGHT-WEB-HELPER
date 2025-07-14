import {NextRequest, NextResponse} from "next/server";
import axios from "axios";
import {API_URL} from "@/services/api-url";
import {sanitizeForwardHeaders} from "@services/api-header";
import https from "https";

const agent = new https.Agent({rejectUnauthorized: false});

export async function GET(request: NextRequest) {
    try {
        const headers = sanitizeForwardHeaders(request);
        const apiUrl = `${API_URL.PROD_HARDWARE_API_URL}/api/v2/applications`;

        const curlHeader = `--header 'Content-Type: application/json'`;
        const curlCommand = `curl --location ${curlHeader} \ '${apiUrl}' `;

        const responseFromAPI = await axios.get(apiUrl, {
            headers,
            httpsAgent: agent,
        });

        return NextResponse.json(
            {data: responseFromAPI.data, curl: curlCommand},
            {
                status: responseFromAPI.status,
            }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.message || "Internal Server Error",
                raw: error.response?.data || null,
            },
            {status: error.response?.status || 500}
        );
    }
}
