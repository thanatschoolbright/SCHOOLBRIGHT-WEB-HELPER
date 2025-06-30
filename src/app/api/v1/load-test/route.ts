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
  const { script, baseURL } = await request.json();
  console.log("📩 : Received POST request for K6 load test");

  if (!script) {
    console.error("❌ : Missing 'script' parameter in request body");
    return new Response(
      JSON.stringify({ error: "Missing 'script' parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const scriptPath = buildScriptPath(script);
  console.log(`📂 : Resolved script path: ${scriptPath}`);

  try {
    await fs.access(scriptPath); // Ensure the script exists
  } catch {
    console.error("❌ : Script not found");
    return new Response(JSON.stringify({ error: "Script not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const child = spawn("k6", [
    "run",
    "--env",
    `BASE_URL=${baseURL || "https://sbapi.schoolbright.co"}`,
    scriptPath,
  ]);

  child.stdout.on("data", (chunk) => {
    console.log(`📥 stdout: ${chunk}`);
    writer.write(encoder.encode(chunk));
  });

  child.stderr.on("data", (chunk) => {
    console.error(`❗ stderr: ${chunk}`);
    writer.write(encoder.encode(chunk));
  });

  child.on("close", (code) => {
    console.log(`🚪 : Script exited with code ${code}`);
    writer.close();
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
