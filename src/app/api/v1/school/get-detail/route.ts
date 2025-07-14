import {callWithLogging} from "@helpers/call-with-logging";
import {API_URL} from "@/services/api-url";
import {NextRequest, NextResponse} from "next/server";
import {convertToCurl} from "@helpers/api/convert-to-curl";
import {sanitizeForwardHeaders} from "@services/api-header";
import https from "https";

const agent = new https.Agent({rejectUnauthorized: false});

export async function GET(request: NextRequest) {
    const headers = sanitizeForwardHeaders(request);
    const apiUrl = API_URL.PROD_HARDWARE_API_URL;
    const endpoint = "/api/v2/applications";
    const fullURL = `${apiUrl}${endpoint}`;
    const curlCommand = convertToCurl(apiUrl, endpoint);

    try {
        const response = await callWithLogging({
            method: "GET",
            url: fullURL,
            headers,
            httpsAgent: agent,
        }, {
            requestPath: request.nextUrl.pathname,
            method: "GET",
            curl: curlCommand,
        });

        return NextResponse.json(
            {
                data: response.data,
                curl: curlCommand,
            },
            {status: response.status}
        );
    } catch (error: any) {
        const statusCode = error.response?.status || 500;
        return NextResponse.json({message: error.message}, {status: statusCode});
    }
}