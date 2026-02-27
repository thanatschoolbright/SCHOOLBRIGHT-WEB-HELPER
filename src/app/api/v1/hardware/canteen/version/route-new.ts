import { API_URL } from "@/services/api-url";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// Simple multipart parser function
function parseMultipart(buffer: ArrayBuffer, boundary: string) {
  const decoder = new TextDecoder();
  const data = new Uint8Array(buffer);
  const boundaryBytes = new TextEncoder().encode(`--${boundary}`);

  const formData = new FormData();
  let start = 0;

  while (start < data.length) {
    // Find next boundary
    let boundaryIndex = -1;
    for (let i = start; i <= data.length - boundaryBytes.length; i++) {
      let match = true;
      for (let j = 0; j < boundaryBytes.length; j++) {
        if (data[i + j] !== boundaryBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        boundaryIndex = i;
        break;
      }
    }

    if (boundaryIndex === -1) break;

    // Find headers end (double CRLF)
    let headersEnd = -1;
    for (
      let i = boundaryIndex + boundaryBytes.length;
      i < data.length - 3;
      i++
    ) {
      if (
        data[i] === 13 &&
        data[i + 1] === 10 &&
        data[i + 2] === 13 &&
        data[i + 3] === 10
      ) {
        headersEnd = i + 4;
        break;
      }
    }

    if (headersEnd === -1) break;

    // Parse headers
    const headerSection = decoder.decode(
      data.slice(boundaryIndex + boundaryBytes.length + 2, headersEnd - 4),
    );
    const lines = headerSection.split("\r\n");
    let name = "";
    let filename = "";
    let contentType = "";

    for (const line of lines) {
      if (line.toLowerCase().startsWith("content-disposition:")) {
        const nameMatch = line.match(/name="([^"]+)"/);
        const filenameMatch = line.match(/filename="([^"]+)"/);
        if (nameMatch) name = nameMatch[1];
        if (filenameMatch) filename = filenameMatch[1];
      } else if (line.toLowerCase().startsWith("content-type:")) {
        contentType = line.split(":")[1].trim();
      }
    }

    // Find next boundary to get content
    let nextBoundaryIndex = -1;
    for (let i = headersEnd; i <= data.length - boundaryBytes.length; i++) {
      let match = true;
      for (let j = 0; j < boundaryBytes.length; j++) {
        if (data[i + j] !== boundaryBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        nextBoundaryIndex = i;
        break;
      }
    }

    if (nextBoundaryIndex === -1) nextBoundaryIndex = data.length;

    // Extract content (removing trailing CRLF)
    const contentEnd = nextBoundaryIndex - 2;
    const content = data.slice(headersEnd, contentEnd);

    if (filename) {
      // It's a file
      const blob = new Blob([content], { type: contentType });
      const file = new File([blob], filename, { type: contentType });
      formData.append(name, file);
    } else {
      // It's a text field
      const value = decoder.decode(content);
      formData.append(name, value);
    }

    start = nextBoundaryIndex;
  }

  return formData;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = parseInt(
      request.headers.get("content-length") || "0",
    );

    let formData: FormData;

    if (contentLength > 10 * 1024 * 1024) {
      // > 10MB
      try {
        // Get the full ArrayBuffer (this should work even with large files)
        const arrayBuffer = await request.arrayBuffer();

        // Extract boundary from content-type header
        const contentType = request.headers.get("content-type") || "";
        const boundaryMatch = contentType.match(/boundary=(.+)$/);

        if (!boundaryMatch) {
          throw new Error("No boundary found in content-type header");
        }

        const boundary = boundaryMatch[1].replace(/^-+/, "");

        // Parse multipart data manually
        formData = parseMultipart(arrayBuffer, boundary);
      } catch (parseError) {
        console.error("[ERROR] Manual parsing failed:", parseError);

        return NextResponse.json(
          {
            message: "Failed to parse large multipart data",
            error:
              parseError instanceof Error
                ? parseError.message
                : "Unknown parsing error",
            suggestion:
              "The file might be too large or corrupted. Try with a smaller file.",
          },
          { status: 400 },
        );
      }
    } else {
      // For smaller files, use normal Next.js parsing
      try {
        formData = await request.formData();
      } catch (parseError) {
        console.error("[ERROR] Next.js FormData parse error:", parseError);
        return NextResponse.json(
          {
            message: "Failed to parse FormData",
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

    // Check if file exists
    const file = formData.get("file") as File | null;

    // Prepare FormData for backend API
    const backendFormData = new FormData();

    // Copy all fields to backend FormData
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }

    const apiUrl = API_URL.DEV_HARDWARE_API_URL;
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
