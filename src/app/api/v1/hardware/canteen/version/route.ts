import {NextRequest, NextResponse} from "next/server";
import {API_URL} from "@/services/api-url";
import axios from "axios";
import {convertToCurl} from "@helpers/api/convert-to-curl";

export async function POST(request: NextRequest) {
    try {
        console.log("=== API ROUTE DEBUG ===");
        console.log("Content-Type:", request.headers.get('content-type'));
        console.log("Request method:", request.method);
        console.log("Content-Length:", request.headers.get('content-length'));

        // Alternative approach: Read request as stream to bypass 10MB limit
        let formData: FormData;
        try {
            // Try to get the request body as array buffer first
            const contentLength = parseInt(request.headers.get('content-length') || '0');
            console.log("Request content length:", contentLength);

            if (contentLength > 10 * 1024 * 1024) { // > 10MB
                console.log("⚠️ Large file detected, using alternative parsing method");

                // For large files, we need to handle this differently
                // Since Next.js limits FormData parsing, we'll read as stream
                const arrayBuffer = await request.arrayBuffer();
                console.log("ArrayBuffer size:", arrayBuffer.byteLength);

                // Convert ArrayBuffer back to FormData
                const blob = new Blob([arrayBuffer], {
                    type: request.headers.get('content-type') || 'multipart/form-data'
                });
                
                // Create a new Request with the blob to parse FormData
                const newRequest = new Request('http://dummy', {
                    method: 'POST',
                    body: blob,
                    headers: {
                        'Content-Type': request.headers.get('content-type') || 'multipart/form-data'
                    }
                });

                formData = await newRequest.formData();
                console.log("✅ Large FormData parsed successfully using alternative method");
            } else {
                // For smaller files, use normal parsing
                formData = await request.formData();
                console.log("✅ FormData parsed successfully");
            }
        } catch (parseError) {
            console.error("❌ FormData parse error:", parseError);

            // Last resort: Try to parse as text and handle manually
            try {
                console.log("🔧 Attempting manual parsing...");
                const text = await request.text();
                console.log("Request text length:", text.length);

                return NextResponse.json(
                    {
                        message: "FormData parsing failed, but request received",
                        error: parseError instanceof Error ? parseError.message : "Unknown parsing error",
                        requestSize: text.length,
                        suggestion: "Try using a smaller file or check server configuration"
                    },
                    {status: 400}
                );
            } catch (textError) {
                return NextResponse.json(
                    {
                        message: "Failed to parse FormData from request",
                        error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
                    },
                    {status: 400}
                );
            }
        }

        // Extract and validate app_id
        const app_id = formData.get('app_id') as string;
        if (!app_id) {
            return NextResponse.json(
                {message: "app_id is required"},
                {status: 400}
            );
        }

        // Log received data for debugging
        console.log("=== API RECEIVED DATA ===");
        console.log("app_id:", app_id);
        console.log("version_name:", formData.get('version_name'));
        console.log("env:", formData.get('env'));
        console.log("note:", formData.get('note'));
        console.log("is_lastest_version:", formData.get('is_lastest_version'));
        console.log("force_update:", formData.get('force_update'));
        console.log("school_id:", formData.get('school_id'));

        // Check if file exists
        const file = formData.get('file') as File | null;
        console.log("file exists:", !!file);
        console.log("file name:", file?.name);
        console.log("file size:", file?.size);
        console.log("file type:", file?.type);
        console.log("========================");

        // Prepare FormData for backend API
        const backendFormData = new FormData();

        // Copy all fields to backend FormData
        for (const [key, value] of formData.entries()) {
            console.log(`Copying field: ${key} = ${value instanceof File ? `File(${value.name})` : value}`);
            backendFormData.append(key, value);
        }

        const apiUrl = API_URL.DEV_HARDWARE_API_URL;
        const endpoint = "/api/v2/applications/version";
        const fullURL = `${apiUrl}${endpoint}`;

        console.log("Sending to backend:", fullURL);

        // Send to backend API with multipart/form-data
        const response = await axios.post(fullURL, backendFormData, {
            headers: {
                // Don't set Content-Type manually, let axios handle it for FormData
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000, // 60 seconds timeout for file uploads
        });

        console.log("✅ Backend response received");

        const curlCommand = convertToCurl(apiUrl, endpoint, 'POST', Object.fromEntries(formData));

        return NextResponse.json(
            {
                data: response.data,
                curl: curlCommand,
            },
            {status: response.status}
        );
    } catch (error: any) {
        console.error('❌ Error in POST /api/v1/hardware/canteen/version:', error);

        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message || "Internal Server Error";

        return NextResponse.json(
            {
                message: errorMessage,
                raw: error.response?.data || null,
                details: error.toString(),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            {status: statusCode}
        );
    }
}
