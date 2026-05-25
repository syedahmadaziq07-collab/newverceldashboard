const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://site--cutprice-api--d8w4sfqmrf5q.code.run";

const TOKEN_KEY = "cutpricebot_admin_token";
const TIMEOUT_MS = 15_000;

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") throw new Error("Request timed out — check your connection.");
    throw new Error(`Network error: ${err?.message ?? "unknown"}`);
  }
  clearTimeout(timer);

  console.log(`[api] ${method} ${path} → ${response.status}`);

  let json: any;
  try {
    json = await response.json();
  } catch {
    console.error(`[api] Non-JSON response from ${path} (status ${response.status})`);
    throw new Error(`Unexpected response from server (${response.status})`);
  }

  if (response.status === 401) {
    const err: any = new Error("Session expired. Please log in again.");
    err.code = 401;
    throw err;
  }

  if (!response.ok) {
    const msg = json?.message || `Request failed (${response.status})`;
    console.error(`[api] ${response.status} ${path}:`, json);
    throw new Error(msg);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
};
