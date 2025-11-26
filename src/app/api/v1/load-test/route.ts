import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

function buildScriptPath(scriptName: string): string {
  const scriptsDir = path.join(process.cwd(), "public", "scripts");
  const normalizedScriptName = scriptName.trim();
  const scriptWithExtension = path.extname(normalizedScriptName)
    ? normalizedScriptName
    : `${normalizedScriptName}.js`;
  const resolvedPath = path.resolve(scriptsDir, scriptWithExtension);

  if (!resolvedPath.startsWith(`${scriptsDir}${path.sep}`)) {
    throw new Error("Invalid script path");
  }

  return resolvedPath;
}

export async function POST(request: NextRequest) {
  try {
    const { script, baseURL, request: vus, second } = await request.json();
    console.log("📩 Received K6 load test request");
    console.log("🌐 Incoming baseURL from request:", baseURL);
    console.log(`🔧 Script: ${script}`);
    console.log(`🌐 baseURL: ${baseURL}`);
    console.log(`👥 request (vus): ${vus}`);
    console.log(`⏱️ second (duration): ${second}`);

    if (!script || typeof script !== "string" || script.trim() === "") {
      console.error("❌ Missing or invalid 'script'");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'script'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const resolvedBaseURL = baseURL?.trim();
    if (!resolvedBaseURL) {
      console.error("❌ Missing or invalid 'baseURL'");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'baseURL'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      const vusCount =
        typeof vus === "number" && Number.isFinite(vus) ? Math.floor(vus) : NaN;
      const durationSeconds =
        typeof second === "number" && Number.isFinite(second)
          ? Math.floor(second)
          : NaN;

      if (!vusCount || vusCount < 1) {
        console.error("❌ Missing or invalid 'request' (vus)");
        return new Response(
          JSON.stringify({ error: "Missing or invalid 'request' (vus)" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!durationSeconds || durationSeconds < 1) {
        console.error("❌ Missing or invalid 'second' (duration)");
        return new Response(
          JSON.stringify({ error: "Missing or invalid 'second' (duration)" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const scriptPath = buildScriptPath(script);
      console.log(`📂 Script path resolved to: ${scriptPath}`);

      await fs.access(scriptPath);

      const encoder = new TextEncoder();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      const child = spawn(
        "k6",
        [
          "run",
          `--env=BASE_URL=${resolvedBaseURL}`,
          `--vus=${vusCount}`,
          `--duration=${durationSeconds}s`,
          scriptPath,
        ],
        { shell: true }
      );

      child.stdout.on("data", (chunk) => {
        console.log(`📥 stdout: ${chunk}`);
        writer.write(encoder.encode(chunk));
      });

      child.stderr.on("data", (chunk) => {
        console.error(`❗ stderr: ${chunk}`);
        writer.write(encoder.encode(chunk));
      });

      child.on("close", (code) => {
        try {
          console.log(`✅ Script finished with code ${code}`);
          writer.close();
        } catch (err) {
          console.error("🚨 Error closing writer:", err);
        }
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error("❌ Script not found");
        return new Response(JSON.stringify({ error: "Script not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error instanceof Error && error.message === "Invalid script path") {
        console.error("❌ Invalid script path detected");
        return new Response(JSON.stringify({ error: "Invalid script path" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }
  } catch (error: any) {
    console.error("🚨 Unexpected error in POST handler:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
