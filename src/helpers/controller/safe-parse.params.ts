import type { NextRequest } from "next/server";

/**
 * Safely parse JSON body from a NextRequest.
 * Returns the parsed body, or an empty object on parse failure.
 */
export async function safeParseRequestBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (e) {
    // If the body isn't JSON or parsing fails, return an empty object to
    // preserve the existing route behavior.
    return {};
  }
}

export default safeParseRequestBody;
