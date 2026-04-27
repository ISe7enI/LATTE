const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveAuthHeaders(path: string): Record<string, string> {
  const userId = localStorage.getItem("latte.userId");
  if (!userId) return {};
  const isCoachApi = path.startsWith("/coach/");
  if (isCoachApi) {
    return { "x-user-id": userId, "x-user-role": "coach" };
  }
  return { "x-user-id": userId, "x-user-role": "user" };
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...resolveAuthHeaders(path),
          ...(init?.headers ?? {}),
        },
        ...init,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.message === "string") {
            message = parsed.message;
          }
        } catch {
          // Keep raw text when response body is not JSON.
        }
        const error = new Error(message || `Request failed: ${response.status}`);
        if (response.status >= 500 && attempt < maxAttempts) {
          lastError = error;
          await sleep(250 * attempt);
          continue;
        }
        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }
      return response.json() as Promise<T>;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await sleep(250 * attempt);
        continue;
      }
    }
  }

  throw lastError ?? new Error("Request failed");
}
