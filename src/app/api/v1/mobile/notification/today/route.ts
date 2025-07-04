import axios from "axios";
import {NextRequest, NextResponse} from "next/server";
import {API_URL} from "@/services/api-url";
import {getHeaders} from "@/services/api-header";
import {sanitizeForwardHeaders} from "@/services/api-header";
import https from "https";

const agent = new https.Agent({rejectUnauthorized: false});

export async function GET(request: NextRequest) {
    const {searchParams} = new URL(request.url);
    const headers = sanitizeForwardHeaders(request);
    const user_id = searchParams.get("user_id");
    const page = searchParams.get("page");
    const apiUrl = `${API_URL.PROD_SB_API_URL}`;
    const endpoint = `/Notification/today/${user_id}?page=${page}&lang=th`;
    const callAPI = apiUrl + endpoint;
    const curlHeader = `--header 'Content-Type: application/json'`;
    const curlCommand = `curl --location ${curlHeader} \ '${callAPI}' `;
    try {
        const responseFromAPI = await axios.get(callAPI, {
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
        const ERROR = {
            message: error.message || "Internal Server Error",
            raw: error.response?.data || null,
            curl: curlCommand,
        };
        const status = 200;
        console.error(ERROR);
        return NextResponse.json(ERROR, {status});
    }
}
