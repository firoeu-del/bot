import type { Env, ReplyMarkup } from "./types";

interface SendMessageOptions {
  replyMarkup?: ReplyMarkup;
  disableWebPagePreview?: boolean;
}

async function telegramRequest<T>(env: Env, method: string, body: unknown): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function sendMessage(env: Env, chatId: string | number, text: string, options: SendMessageOptions = {}): Promise<void> {
  await telegramRequest(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: options.disableWebPagePreview ?? true,
    reply_markup: options.replyMarkup
  });
}

export async function answerCallbackQuery(env: Env, callbackQueryId: string, text?: string): Promise<void> {
  await telegramRequest(env, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text || undefined,
    show_alert: false
  });
}
