import { spawn } from "child_process";
import fs from "fs/promises";
import { NextRequest } from "next/server";
import path from "path";

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
    const {
      script,
      baseURL,
      request: vus,
      second,
      stages,
      thresholds,
      headers,
      timeout,
      maxRedirects,
      thinkTime,
      rps,
      iterations,
      noConnectionReuse,
      noVUConnectionReuse,
      minIterationDuration,
      maxDuration,
      gracefulStop,
      setupTimeout,
      teardownTimeout,
      tags,
    } = await request.json();

    console.log("[INFO] Received K6 load test request");
    console.log("[INFO] Incoming baseURL from request:", baseURL);
    console.log(`[CONFIG] Script: ${script}`);
    console.log(`[CONFIG] baseURL: ${baseURL}`);
    console.log(`[CONFIG] request (vus): ${vus}`);
    console.log(`[CONFIG] second (duration): ${second}`);
    console.log(`[CONFIG] stages:`, stages);
    console.log(`[CONFIG] thresholds:`, thresholds);

    if (!script || typeof script !== "string" || script.trim() === "") {
      console.error("[ERROR] Missing or invalid 'script'");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'script'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const resolvedBaseURL = baseURL?.trim();
    if (!resolvedBaseURL) {
      console.error("[ERROR] Missing or invalid 'baseURL'");
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'baseURL'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const scriptPath = buildScriptPath(script);
      console.log(`[INFO] Script path resolved to: ${scriptPath}`);

      await fs.access(scriptPath);

      const encoder = new TextEncoder();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      const k6Args = ["run"];

      // Base URL
      k6Args.push(`--env=BASE_URL=${resolvedBaseURL}`);

      // VUs and Duration (if not using stages)
      if (!stages || stages.length === 0) {
        const vusCount =
          typeof vus === "number" && Number.isFinite(vus)
            ? Math.floor(vus)
            : 10;
        const durationSeconds =
          typeof second === "number" && Number.isFinite(second)
            ? Math.floor(second)
            : 10;

        k6Args.push(`--vus=${vusCount}`);
        k6Args.push(`--duration=${durationSeconds}s`);
      }

      // Stages (for ramping)
      if (stages && Array.isArray(stages) && stages.length > 0) {
        stages.forEach((stage: any) => {
          if (stage.duration && stage.target !== undefined) {
            k6Args.push(`--stage=${stage.duration}s:${stage.target}`);
          }
        });
      }

      // Iterations
      if (iterations && Number.isFinite(iterations) && iterations > 0) {
        k6Args.push(`--iterations=${iterations}`);
      }

      // RPS (requests per second)
      if (rps && Number.isFinite(rps) && rps > 0) {
        k6Args.push(`--rps=${rps}`);
      }

      // Timeout
      if (timeout && Number.isFinite(timeout) && timeout > 0) {
        k6Args.push(`--env=TIMEOUT=${timeout}s`);
      }

      // Max Redirects
      if (
        maxRedirects !== undefined &&
        Number.isFinite(maxRedirects) &&
        maxRedirects >= 0
      ) {
        k6Args.push(`--env=MAX_REDIRECTS=${maxRedirects}`);
      }

      // Think Time
      if (thinkTime && Number.isFinite(thinkTime) && thinkTime > 0) {
        k6Args.push(`--env=THINK_TIME=${thinkTime}`);
      }

      // Custom Headers
      if (headers && typeof headers === "object") {
        k6Args.push(`--env=CUSTOM_HEADERS=${JSON.stringify(headers)}`);
      }

      // Thresholds
      if (thresholds && typeof thresholds === "object") {
        k6Args.push(`--env=THRESHOLDS=${JSON.stringify(thresholds)}`);
      }

      // No Connection Reuse
      if (noConnectionReuse === true) {
        k6Args.push("--no-connection-reuse");
      }

      // No VU Connection Reuse
      if (noVUConnectionReuse === true) {
        k6Args.push("--no-vu-connection-reuse");
      }

      // Min Iteration Duration
      if (
        minIterationDuration &&
        Number.isFinite(minIterationDuration) &&
        minIterationDuration > 0
      ) {
        k6Args.push(`--min-iteration-duration=${minIterationDuration}s`);
      }

      // Max Duration
      if (maxDuration && Number.isFinite(maxDuration) && maxDuration > 0) {
        k6Args.push(`--max-duration=${maxDuration}s`);
      }

      // Graceful Stop
      if (gracefulStop && Number.isFinite(gracefulStop) && gracefulStop > 0) {
        k6Args.push(`--grace-stop=${gracefulStop}s`);
      }

      // Setup Timeout
      if (setupTimeout && Number.isFinite(setupTimeout) && setupTimeout > 0) {
        k6Args.push(`--setup-timeout=${setupTimeout}s`);
      }

      // Teardown Timeout
      if (
        teardownTimeout &&
        Number.isFinite(teardownTimeout) &&
        teardownTimeout > 0
      ) {
        k6Args.push(`--teardown-timeout=${teardownTimeout}s`);
      }

      // Tags
      if (tags && typeof tags === "object") {
        Object.entries(tags).forEach(([key, value]) => {
          k6Args.push(`--tag=${key}=${value}`);
        });
      }

      // Script path
      k6Args.push(scriptPath);

      console.log("[EXEC] Executing k6 with args:", k6Args.join(" "));

      const child = spawn("k6", k6Args, { shell: true });

      child.stdout.on("data", (chunk) => {
        console.log(`[STDOUT] stdout: ${chunk}`);
        writer.write(encoder.encode(chunk));
      });

      child.stderr.on("data", (chunk) => {
        console.error(`[STDERR] stderr: ${chunk}`);
        writer.write(encoder.encode(chunk));
      });

      child.on("close", (code) => {
        try {
          console.log(`[DONE] Script finished with code ${code}`);
          writer.close();
        } catch (err) {
          console.error("[ERROR] Error closing writer:", err);
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
        console.error("[ERROR] Script not found");
        return new Response(JSON.stringify({ error: "Script not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error instanceof Error && error.message === "Invalid script path") {
        console.error("[ERROR] Invalid script path detected");
        return new Response(JSON.stringify({ error: "Invalid script path" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw error;
    }
  } catch (error: any) {
    console.error("[CRITICAL] Unexpected error in POST handler:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
