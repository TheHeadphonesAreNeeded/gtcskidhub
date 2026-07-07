import type { HandlerResponse } from "@netlify/functions";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export function json(
  statusCode: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): HandlerResponse {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

export const ok = (body: unknown, headers?: Record<string, string>) =>
  json(200, body, headers);

export const badRequest = (message: string) =>
  json(400, { error: message });

export const unauthorized = (message = "Not authenticated") =>
  json(401, { error: message });

export const forbidden = (message = "You do not have permission to do that") =>
  json(403, { error: message });

export const notFound = (message = "Not found") =>
  json(404, { error: message });

export const methodNotAllowed = (allowed: string[]) =>
  json(405, { error: "Method not allowed" }, { Allow: allowed.join(", ") });

export const serverError = (message = "Something went wrong") =>
  json(500, { error: message });

// Wrap a handler so uncaught errors return a clean 500 instead of a raw
// stack trace, while still logging the details to the function logs.
export function safe<T extends (...args: any[]) => Promise<HandlerResponse>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[skidhub] unhandled function error:", err);
      const message =
        err instanceof Error && err.message.startsWith("Missing required")
          ? err.message
          : "Something went wrong";
      return serverError(message);
    }
  }) as T;
}
