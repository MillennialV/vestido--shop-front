export const apiClient = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    return response;
  } catch (e: any) {
    throw new Error(e?.message);
  }
};
