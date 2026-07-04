import { API_BASE_URL } from "./config";

export class ApiUnavailableError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new ApiUnavailableError(`Request to ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetches live data from the MergeFi backend, falling back to the provided
 * mock value when the backend is unreachable (e.g. during frontend-only demos).
 */
export async function fetchWithFallback<T>(
  path: string,
  fallback: T,
): Promise<T> {
  try {
    return await request<T>(path);
  } catch {
    return fallback;
  }
}

export { request };
