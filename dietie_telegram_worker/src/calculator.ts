import type { Activity, DietResult, Goal, ProfileInput } from "./types";

const activityFactors: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9
};

const goalCalorieDelta: Record<Goal, number> = {
  lose: -450,
  maintain: 0,
  gain: 350,
  recomp: -150
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateDiet(profile: ProfileInput): DietResult {
  const { gender, age, heightCm, weightKg, activity, goal } = profile;

  // Mifflin-St Jeor BMR
  const bmr = gender === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * activityFactors[activity];
  const targetCalories = clamp(roundTo(tdee + goalCalorieDelta[goal], 25), 1200, 4500);

  // Devine ideal body weight. Useful only as a rough planning helper.
  const heightInches = heightCm / 2.54;
  const overFiveFeet = Math.max(0, heightInches - 60);
  const ibwKg = gender === "male" ? 50 + 2.3 * overFiveFeet : 45.5 + 2.3 * overFiveFeet;
  const aibwKg = weightKg > ibwKg * 1.2 ? ibwKg + 0.4 * (weightKg - ibwKg) : weightKg;
  const macroWeight = weightKg > ibwKg * 1.2 ? aibwKg : weightKg;

  const proteinPerKg = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : goal === "recomp" ? 2.0 : 1.6;
  const proteinG = Math.round(macroWeight * proteinPerKg);
  const fatG = Math.round((targetCalories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4));
  const bmi = weightKg / Math.pow(heightCm / 100, 2);

  return {
    bmi: Number(bmi.toFixed(1)),
    ibwKg: Number(ibwKg.toFixed(1)),
    aibwKg: Number(aibwKg.toFixed(1)),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    proteinG,
    carbsG,
    fatG
  };
}

export function activityLabel(activity: Activity): string {
  return {
    sedentary: "کم‌تحرک",
    light: "فعالیت سبک",
    moderate: "فعالیت متوسط",
    active: "فعال",
    athlete: "خیلی فعال / ورزشکار"
  }[activity];
}

export function goalLabel(goal: Goal): string {
  return {
    lose: "کاهش وزن",
    maintain: "حفظ وزن",
    gain: "افزایش وزن",
    recomp: "چربی‌سوزی همراه عضله‌سازی"
  }[goal];
}
