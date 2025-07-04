import {NextRequest, NextResponse} from "next/server";
import {API_URL} from "@/services/api-url";
import axios from "axios";
import {RequestRefreshToken} from "@/stores/type";

export async function POST(request: NextRequest) {
    try {
        const {school_id, user_id, token}: RequestRefreshToken["draftValues"] =
            await request.json();
        const apiUrl = `${API_URL.PROD_SB_API_URL}`;
        const endpoint = `/api/v1/tokens/refresh`;
        const callAPI = apiUrl + endpoint;
        // * Example for temporary
        const temp_school_id = "849";
        const temp_user_id = "1230332";
        const temp_token =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjExNTAiLCJlbWFpbCI6InBsdWVtbXR5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3Bvc3RhbGNvZGUiOiI4NDkiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxMjMwMzMyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvaGFzaCI6IjExNTAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI3LzcvMjAyNSA1OjA1OjU3IFBNIiwibmJmIjoxNzUxNTYyMzU3LCJleHAiOjE3NTE5MDc5NTcsImlhdCI6MTc1MTU2MjM1N30.ycsl1K5ZSyi9yTtJh8FToHrWVoml7UXMOjlRcd3Z0zs";
        const payload = {
            SchoolID: temp_school_id,
            OldToken: temp_token,
            sID: temp_user_id,
        };

        const responseFromAPI = await axios.post(callAPI, payload, {});
        console.log("[✅ Response] :", JSON.stringify(responseFromAPI.data, null, 2));

        return NextResponse.json({
            status: responseFromAPI.status,
            data: responseFromAPI.data,
        });
    } catch (error: any) {
        return NextResponse.json({
            message: error.message || "Internal Server Error",
            status: error.response.status || 500,
        });
    }
}
