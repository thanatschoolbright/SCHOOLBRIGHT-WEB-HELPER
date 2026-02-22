import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

/**
 * @swagger
 * /api/version:
 *   get:
 *     summary: Get system version
 *     description: Returns the current version of Next.js being used from package.json
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Successfully retrieved version
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 nextVersion:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
export async function GET(request: NextRequest) {
  try {
    // อ่าน package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // ดึงเวอร์ชัน Next.js
    const nextVersion =
      packageJson.dependencies?.next?.replace("^", "") || "16.0.0";

    return NextResponse.json({
      success: true,
      nextVersion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        nextVersion: "16.0.0", // fallback
        error: "Could not read package.json",
      },
      { status: 500 },
    );
  }
}
