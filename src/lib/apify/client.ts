const APIFY_API_BASE_URL = "https://api.apify.com/v2";

export class ApifyApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApifyApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apifyFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new ApifyApiError(
      "APIFY_API_TOKEN is not configured on the server. Please add your token in .env.local or settings.",
      401
    );
  }

  const url = `${APIFY_API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    throw new ApifyApiError(
      `Apify API request failed (${response.status}): ${typeof errorData === 'object' && errorData && 'error' in errorData ? JSON.stringify((errorData as { error: unknown }).error) : response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json() as Promise<T>;
}
