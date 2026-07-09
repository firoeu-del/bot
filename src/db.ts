import type { Env, Profile, ProfileRow, SessionRow } from "./types";

export async function getSession(env: Env, chatId: string): Promise<{ step: string; data: Record<string, unknown> } | null> {
  const row = await env.DB.prepare("SELECT chat_id, step, data FROM sessions WHERE chat_id = ?")
    .bind(chatId)
    .first<SessionRow>();

  if (!row) return null;

  try {
    return { step: row.step, data: JSON.parse(row.data || "{}") as Record<string, unknown> };
  } catch {
    return { step: row.step, data: {} };
  }
}

export async function setSession(env: Env, chatId: string, step: string, data: Record<string, unknown>): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO sessions (chat_id, step, data, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(chat_id) DO UPDATE SET
       step = excluded.step,
       data = excluded.data,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(chatId, step, JSON.stringify(data)).run();
}

export async function clearSession(env: Env, chatId: string): Promise<void> {
  await env.DB.prepare("DELETE FROM sessions WHERE chat_id = ?").bind(chatId).run();
}

export async function saveProfile(env: Env, profile: Profile): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO profiles (
      chat_id, first_name, gender, age, height_cm, weight_kg, goal, activity, meals, restrictions, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(chat_id) DO UPDATE SET
      first_name = excluded.first_name,
      gender = excluded.gender,
      age = excluded.age,
      height_cm = excluded.height_cm,
      weight_kg = excluded.weight_kg,
      goal = excluded.goal,
      activity = excluded.activity,
      meals = excluded.meals,
      restrictions = excluded.restrictions,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    profile.chatId,
    profile.firstName || "",
    profile.gender,
    profile.age,
    profile.heightCm,
    profile.weightKg,
    profile.goal,
    profile.activity,
    profile.meals,
    profile.restrictions || ""
  ).run();
}

export async function getProfile(env: Env, chatId: string): Promise<Profile | null> {
  const row = await env.DB.prepare("SELECT * FROM profiles WHERE chat_id = ?")
    .bind(chatId)
    .first<ProfileRow>();

  if (!row) return null;

  return {
    chatId: row.chat_id,
    firstName: row.first_name || undefined,
    gender: row.gender,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    goal: row.goal,
    activity: row.activity,
    meals: row.meals,
    restrictions: row.restrictions || ""
  };
}

export async function savePlan(env: Env, chatId: string, calories: number, proteinG: number, carbsG: number, fatG: number, planText: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO plans (chat_id, calories, protein_g, carbs_g, fat_g, plan_text)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(chatId, calories, proteinG, carbsG, fatG, planText).run();
}

export async function deleteUserData(env: Env, chatId: string): Promise<void> {
  await env.DB.prepare("DELETE FROM sessions WHERE chat_id = ?").bind(chatId).run();
  await env.DB.prepare("DELETE FROM profiles WHERE chat_id = ?").bind(chatId).run();
  await env.DB.prepare("DELETE FROM plans WHERE chat_id = ?").bind(chatId).run();
}
