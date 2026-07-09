export interface Env {
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  DB: D1Database;
}

export type Gender = "male" | "female";
export type Goal = "lose" | "maintain" | "gain" | "recomp";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";

export interface ProfileInput {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activity: Activity;
  meals: number;
  restrictions?: string;
}

export interface Profile extends ProfileInput {
  chatId: string;
  firstName?: string;
}

export interface DietResult {
  bmi: number;
  ibwKg: number;
  aibwKg: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

export interface InlineButton {
  text: string;
  callback_data: string;
}

export interface ReplyMarkup {
  inline_keyboard: InlineButton[][];
}

export interface SessionRow {
  chat_id: string;
  step: string;
  data: string;
}

export interface ProfileRow {
  chat_id: string;
  first_name: string | null;
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: Goal;
  activity: Activity;
  meals: number;
  restrictions: string | null;
}
