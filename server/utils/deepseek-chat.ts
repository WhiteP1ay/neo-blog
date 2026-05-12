const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/v1/chat/completions';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * 调用 DeepSeek Chat（OpenAI 兼容接口）。API Key 仅服务端读取。
 */
export async function deepseekChat(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number; signal?: AbortSignal },
): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    throw new Error('未配置环境变量 DEEPSEEK_API_KEY');
  }

  const res = await fetch(DEEPSEEK_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.25,
      max_tokens: options?.maxTokens ?? 8192,
    }),
    signal: options?.signal,
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`DeepSeek 请求失败（${res.status}）：${raw.slice(0, 500)}`);
  }

  let json: { choices?: Array<{ message?: { content?: unknown } }> };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error('DeepSeek 返回非 JSON');
  }

  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('DeepSeek 响应内容为空');
  }
  return content.trim();
}
