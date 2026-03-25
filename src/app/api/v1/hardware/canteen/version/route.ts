import { API_URL } from "@/services/api-url";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Alternative approach: Read request as stream to bypass 10MB limit
    let formData: FormData;
    try {
      // Try to get the request body as array buffer first
      const contentLength = parseInt(
        request.headers.get("content-length") || "0",
      );

      if (contentLength > 10 * 1024 * 1024) {
        // > 10MB
        // For large files, we need to handle this differently
        // Since Next.js limits FormData parsing, we'll read as stream
        const arrayBuffer = await request.arrayBuffer();

        // Convert ArrayBuffer back to FormData
        const blob = new Blob([arrayBuffer], {
          type: request.headers.get("content-type") || "multipart/form-data",
        });

        // Create a new Request with the blob to parse FormData
        const newRequest = new Request("http://dummy", {
          method: "POST",
          body: blob,
          headers: {
            "Content-Type":
              request.headers.get("content-type") || "multipart/form-data",
          },
        });

        formData = await newRequest.formData();
      } else {
        // For smaller files, use normal parsing
        formData = await request.formData();
      }
    } catch (parseError) {
      console.error("[ERROR] FormData parse error:", parseError);

      // Last resort: Try to parse as text and handle manually
      try {
        const text = await request.text();

        return NextResponse.json(
          {
            message: "FormData parsing failed, but request received",
            error:
              parseError instanceof Error
                ? parseError.message
                : "Unknown parsing error",
            requestSize: text.length,
            suggestion:
              "Try using a smaller file or check server configuration",
          },
          { status: 400 },
        );
      } catch (textError) {
        return NextResponse.json(
          {
            message: "Failed to parse FormData from request",
            error:
              parseError instanceof Error
                ? parseError.message
                : "Unknown parsing error",
          },
          { status: 400 },
        );
      }
    }

    // Extract and validate app_id
    const app_id = formData.get("app_id") as string;
    if (!app_id) {
      return NextResponse.json(
        { message: "app_id is required" },
        { status: 400 },
      );
    }

    const file = formData.get("file") as File | null;

    // Prepare FormData for backend API
    const backendFormData = new FormData();

    // Copy all fields to backend FormData
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }

    const apiUrl = API_URL.PROD_HARDWARE_API_URL;
    const endpoint = "/api/v2/applications/version";
    const fullURL = `${apiUrl}${endpoint}`;

    // Send to backend API with multipart/form-data
    const response = await axios.post(fullURL, backendFormData, {
      headers: {
        // Don't set Content-Type manually, let axios handle it for FormData
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000, // 60 seconds timeout for file uploads
    });

    const curlCommand = convertToCurl(
      apiUrl,
      endpoint,
      "POST",
      Object.fromEntries(formData),
    );

    return NextResponse.json(
      {
        data: response.data,
        curl: curlCommand,
      },
      { status: response.status },
    );
  } catch (error: any) {
    console.error(
      "[ERROR] Error in POST /api/v1/hardware/canteen/version:",
      error,
    );

    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.message || error.message || "Internal Server Error";

    return NextResponse.json(
      {
        message: errorMessage,
        raw: error.response?.data || null,
        details: error.toString(),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode },
    );
  }
}
