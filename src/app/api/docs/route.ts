import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";

/**
 * GET /api/docs
 * Returns the auto-generated OpenAPI specification document
 * This endpoint dynamically generates the spec from all API routes
 */
export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}

/**
 * Enable dynamic rendering to always get fresh API documentation
 */
export const dynamic = "force-dynamic";
