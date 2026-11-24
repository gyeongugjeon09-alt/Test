export async function parseJsonResponse<T = Record<string, any>>(res: Response): Promise<T> {
  const rawText = await res.text();
  if (!rawText.trim()) {
    if (!res.ok) {
      throw new Error(`서버 응답이 비어 있습니다. (HTTP ${res.status})`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    const trimmed = rawText.trim();
    if (trimmed.startsWith('<')) {
      throw new Error(
        `API 서버가 JSON 대신 HTML 응답을 반환했습니다. (HTTP ${res.status})`
      );
    }
    throw new Error(`서버 응답 형식을 해석할 수 없습니다. (HTTP ${res.status})`);
  }
}
