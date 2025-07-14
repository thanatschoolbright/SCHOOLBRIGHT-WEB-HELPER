import {callWithLogging} from "@helpers/call-with-logging";
import {API_URL} from "@/services/api-url";
import {NextRequest, NextResponse} from "next/server";
import {convertToCurl} from "@helpers/api/convert-to-curl";

export async function GET(request: NextRequest) {
    const apiUrl = API_URL.PROD_ADMIN_JABJAI_API_URL;
    const endpoint = "/api/school/list";
    const fullURL = `${apiUrl}${endpoint}`;
    const curlCommand = convertToCurl(apiUrl, endpoint);

    try {
        const response = await callWithLogging({
            method: "GET",
            url: fullURL,
            // headers,
            // httpsAgent,
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