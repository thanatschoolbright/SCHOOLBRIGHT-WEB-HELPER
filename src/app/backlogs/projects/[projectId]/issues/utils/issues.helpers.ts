export const buildErrorDetails = (
  error: unknown
): { message: string; details: string } => {
  if (!error) return { message: "Unknown error", details: "No details" };
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack || error.message,
    };
  }
  if (typeof error === "string") {
    return { message: error, details: error };
  }
  try {
    const json = JSON.stringify(error, null, 2);
    return { message: json, details: json };
  } catch {
    return { message: "Unexpected error", details: String(error) };
  }
};
