import { activityLabel, goalLabel } from "./calculator";
import { clearSession, deleteUserData, getProfile, getSession, savePlan, saveProfile, setSession } from "./db";
import { makePlan, escapeHtml } from "./diet";
import { activityKeyboard, doneKeyboard, genderKeyboard, goalKeyboard, mealsKeyboard, restrictionsKeyboard } from "./keyboards";
import { answerCallbackQuery, sendMessage } from "./telegram";
import type { Activity, Env, Gender, Goal, Profile, ProfileInput, TelegramCallbackQuery, TelegramMessage, TelegramUpdate } from "./types";

const WEBHOOK_PATH = "/telegram";

type SessionData = Partial<ProfileInput> & { firstName?: string };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return json({ ok: true, service: "dietie telegram bot", webhook: WEBHOOK_PATH });
    }

    if (url.pathname !== WEBHOOK_PATH) {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    let update: TelegramUpdate;
    try {
      update = await request.json() as TelegramUpdate;
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    ctx.waitUntil(handleUpdate(update, env));
    return new Response("ok");
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function handleUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query, env);
      return;
    }

    if (update.message) {
      await handleMessage(update.message, env);
    }
  } catch (error) {
    console.error(error);
    const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
    if (chatId) {
      await sendMessage(env, chatId, "یه خطا پیش اومد. دوباره /start رو بزن یا چند لحظه بعد امتحان کن.");
    }
  }
}

async function handleMessage(message: TelegramMessage, env: Env): Promise<void> {
  const chatId = String(message.chat.id);
  const text = (message.text || "").trim();
  const firstName = message.from?.first_name || message.chat.first_name || "";

  if (!text) {
    await sendMessage(env, chatId, "فعلاً فقط پیام متنی و دکمه‌ها رو پشتیبانی می‌کنم. /start رو بزن.");
    return;
  }

  if (text.startsWith("/start") || text.startsWith("/new")) {
    await startFlow(env, chatId, firstName);
    return;
  }

  if (text.startsWith("/help")) {
    await sendHelp(env, chatId);
    return;
  }

  if (text.startsWith("/profile")) {
    await sendProfile(env, chatId);
    return;
  }

  if (text.startsWith("/plan")) {
    await sendSavedPlan(env, chatId);
    return;
  }

  if (text.startsWith("/reset")) {
    await deleteUserData(env, chatId);
    await sendMessage(env, chatId, "اطلاعاتت پاک شد. برای شروع دوباره /start رو بزن.");
    return;
  }

  const session = await getSession(env, chatId);
  if (!session) {
    await sendMessage(env, chatId, "برای شروع ساخت رژیم، /start رو بزن.");
    return;
  }

  const data = session.data as SessionData;

  switch (session.step) {
    case "age":
      await handleAge(env, chatId, text, data);
      break;
    case "height":
      await handleHeight(env, chatId, text, data);
      break;
    case "weight":
      await handleWeight(env, chatId, text, data);
      break;
    case "restrictions":
      await finishProfile(env, chatId, { ...data, restrictions: text });
      break;
    default:
      await sendMessage(env, chatId, "لطفاً از دکمه‌ها استفاده کن یا /start رو بزن.");
  }
}

async function handleCallback(callback: TelegramCallbackQuery, env: Env): Promise<void> {
  const chatId = callback.message?.chat.id;
  const dataRaw = callback.data || "";

  await answerCallbackQuery(env, callback.id);

  if (!chatId) return;
  const chatIdString = String(chatId);

  if (dataRaw === "action:new") {
    await startFlow(env, chatIdString, callback.from.first_name || "");
    return;
  }

  if (dataRaw === "action:profile") {
    await sendProfile(env, chatIdString);
    return;
  }

  const [kind, value] = dataRaw.split(":");
  const session = await getSession(env, chatIdString);
  const sessionData = (session?.data || {}) as SessionData;

  if (kind === "gender") {
    const gender = value as Gender;
    await setSession(env, chatIdString, "age", { ...sessionData, gender, firstName: callback.from.first_name || "" });
    await sendMessage(env, chatIdString, "چند سالته؟ فقط عدد بفرست. مثال: ۲۲");
    return;
  }

  if (kind === "goal") {
    const goal = value as Goal;
    await setSession(env, chatIdString, "activity", { ...sessionData, goal });
    await sendMessage(env, chatIdString, "سطح فعالیتت چقدره؟", { replyMarkup: activityKeyboard });
    return;
  }

  if (kind === "activity") {
    const activity = value as Activity;
    await setSession(env, chatIdString, "meals", { ...sessionData, activity });
    await sendMessage(env, chatIdString, "روزانه چند وعده می‌خوای؟", { replyMarkup: mealsKeyboard });
    return;
  }

  if (kind === "meals") {
    const meals = Number(value);
    await setSession(env, chatIdString, "restrictions", { ...sessionData, meals });
    await sendMessage(env, chatIdString, "غذای ممنوعه، حساسیت، بیماری یا محدودیت خاصی داری؟ اگر نداری دکمه زیر رو بزن، وگرنه توضیح کوتاه بنویس.", { replyMarkup: restrictionsKeyboard });
    return;
  }

  if (kind === "restrictions" && value === "none") {
    await finishProfile(env, chatIdString, { ...sessionData, restrictions: "ندارم" });
    return;
  }

  await sendMessage(env, chatIdString, "این دکمه رو نشناختم. /start رو بزن.");
}

async function startFlow(env: Env, chatId: string, firstName: string): Promise<void> {
  await setSession(env, chatId, "gender", { firstName });
  await sendMessage(
    env,
    chatId,
    `سلام ${escapeHtml(firstName || "")} 👋\nبه <b>dietie</b> خوش اومدی.\n\nمن چندتا سوال می‌پرسم و بعد بر اساس اطلاعاتت کالری، ماکرو و یک برنامه غذایی روزانه می‌دم.\n\nاول جنسیتت رو انتخاب کن:`,
    { replyMarkup: genderKeyboard }
  );
}

async function handleAge(env: Env, chatId: string, text: string, data: SessionData): Promise<void> {
  const age = toNumber(text);
  if (!age || age < 13 || age > 90) {
    await sendMessage(env, chatId, "سن رو به عدد بین ۱۳ تا ۹۰ بفرست. مثال: ۲۲");
    return;
  }
  await setSession(env, chatId, "height", { ...data, age });
  await sendMessage(env, chatId, "قدت چند سانتی‌متره؟ مثال: ۱۷۸");
}

async function handleHeight(env: Env, chatId: string, text: string, data: SessionData): Promise<void> {
  const heightCm = toNumber(text);
  if (!heightCm || heightCm < 120 || heightCm > 230) {
    await sendMessage(env, chatId, "قد رو به سانتی‌متر و عدد بین ۱۲۰ تا ۲۳۰ بفرست. مثال: ۱۷۸");
    return;
  }
  await setSession(env, chatId, "weight", { ...data, heightCm });
  await sendMessage(env, chatId, "وزنت چند کیلوئه؟ مثال: ۷۶");
}

async function handleWeight(env: Env, chatId: string, text: string, data: SessionData): Promise<void> {
  const weightKg = toNumber(text);
  if (!weightKg || weightKg < 30 || weightKg > 250) {
    await sendMessage(env, chatId, "وزن رو به کیلو و عدد بین ۳۰ تا ۲۵۰ بفرست. مثال: ۷۶");
    return;
  }
  await setSession(env, chatId, "goal", { ...data, weightKg });
  await sendMessage(env, chatId, "هدفت چیه؟", { replyMarkup: goalKeyboard });
}

async function finishProfile(env: Env, chatId: string, data: SessionData): Promise<void> {
  if (!isCompleteProfileData(data)) {
    await sendMessage(env, chatId, "یه بخشی از اطلاعات ناقصه. لطفاً /start رو بزن و دوباره کاملش کن.");
    return;
  }

  const profile: Profile = {
    chatId,
    firstName: data.firstName,
    gender: data.gender,
    age: data.age,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    goal: data.goal,
    activity: data.activity,
    meals: data.meals,
    restrictions: data.restrictions || ""
  };

  await saveProfile(env, profile);
  await clearSession(env, chatId);

  const { result, text } = makePlan(profile);
  await savePlan(env, chatId, result.targetCalories, result.proteinG, result.carbsG, result.fatG, text);
  await sendMessage(env, chatId, text, { replyMarkup: doneKeyboard });
}

function isCompleteProfileData(data: SessionData): data is ProfileInput & { firstName?: string } {
  return Boolean(
    data.gender &&
    data.age &&
    data.heightCm &&
    data.weightKg &&
    data.goal &&
    data.activity &&
    data.meals
  );
}

function toNumber(text: string): number | null {
  const normalized = text
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(",", ".");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  return Number(match[0]);
}

async function sendProfile(env: Env, chatId: string): Promise<void> {
  const profile = await getProfile(env, chatId);
  if (!profile) {
    await sendMessage(env, chatId, "هنوز پروفایلی نداری. برای ساخت برنامه /start رو بزن.");
    return;
  }

  await sendMessage(env, chatId, `👤 <b>پروفایل dietie</b>

جنسیت: ${profile.gender === "male" ? "آقا" : "خانم"}
سن: ${profile.age}
قد: ${profile.heightCm} cm
وزن: ${profile.weightKg} kg
هدف: ${goalLabel(profile.goal)}
فعالیت: ${activityLabel(profile.activity)}
وعده‌ها: ${profile.meals}
محدودیت: ${escapeHtml(profile.restrictions || "ندارم")}

برای برنامه جدید /new رو بزن.`);
}

async function sendSavedPlan(env: Env, chatId: string): Promise<void> {
  const profile = await getProfile(env, chatId);
  if (!profile) {
    await sendMessage(env, chatId, "اول باید اطلاعاتت رو ثبت کنی. /start رو بزن.");
    return;
  }

  const { result, text } = makePlan(profile);
  await savePlan(env, chatId, result.targetCalories, result.proteinG, result.carbsG, result.fatG, text);
  await sendMessage(env, chatId, text, { replyMarkup: doneKeyboard });
}

async function sendHelp(env: Env, chatId: string): Promise<void> {
  await sendMessage(env, chatId, `🤖 <b>راهنمای dietie</b>

/start شروع ساخت برنامه
/new ساخت برنامه جدید
/plan ساخت دوباره برنامه با پروفایل فعلی
/profile دیدن اطلاعات ثبت‌شده
/reset پاک کردن اطلاعات
/help راهنما

این بات جایگزین پزشک یا متخصص تغذیه نیست؛ برای شرایط پزشکی خاص حتماً با متخصص مشورت کن.`);
}
