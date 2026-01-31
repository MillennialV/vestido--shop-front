import { ApiResponse } from "@/interfaces/apiResponse";

export async function apiResponse<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('authToken');

    let headers: Record<string, string> = {
      ...(options.headers as Record<string, string>) || {},
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        data: null as T,
        message: errorData.message || `HTTP Error: ${res.status}`,
        error: errorData.error || res.statusText
      };
    }

    const json = await res.json();

    return {
      success: json.success ?? true,
      data: json.data,
      message: json.message,
      error: json.error
    };

  } catch (e: any) {
    return {
      success: false,
      data: null as T,
      message: e.name === 'AbortError' ? 'Request timeout' : 'Network error',
      error: e?.message || 'Unknown error'
    };
  }
}
