import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

function buildScriptPath(scriptName: string): string {
  return path.join(
    process.cwd(),
    "src",
    "helpers",
    "scripts",
    `${scriptName}.ts`
  );
}

export async function POST(request: NextRequest) {
  try {
    const { script, baseURL } = await request.json();
    console.log("📩 Received K6 load test request");
    console.log("🌐 Incoming baseURL from request:", baseURL);
    console.log(`🔧 Script: ${script}`);
    console.log(`🌐 baseURL: ${baseURL}`);

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

    const scriptPath = buildScriptPath(script);
    console.log(`📂 Script path resolved to: ${scriptPath}`);

    try {
      await fs.access(scriptPath);
    } catch {
      console.error("❌ Script not found");
      return new Response(JSON.stringify({ error: "Script not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const child = spawn(
      "k6",
      ["run", `--env=BASE_URL=${resolvedBaseURL}`, scriptPath],
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
    console.error("🚨 Unexpected error in POST handler:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
