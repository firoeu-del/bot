import type { ReplyMarkup } from "./types";

export const genderKeyboard: ReplyMarkup = {
  inline_keyboard: [
    [
      { text: "آقا", callback_data: "gender:male" },
      { text: "خانم", callback_data: "gender:female" }
    ]
  ]
};

export const goalKeyboard: ReplyMarkup = {
  inline_keyboard: [
    [{ text: "کاهش وزن", callback_data: "goal:lose" }],
    [{ text: "حفظ وزن", callback_data: "goal:maintain" }],
    [{ text: "افزایش وزن", callback_data: "goal:gain" }],
    [{ text: "چربی‌سوزی + عضله‌سازی", callback_data: "goal:recomp" }]
  ]
};

export const activityKeyboard: ReplyMarkup = {
  inline_keyboard: [
    [{ text: "کم‌تحرک", callback_data: "activity:sedentary" }],
    [{ text: "فعالیت سبک", callback_data: "activity:light" }],
    [{ text: "فعالیت متوسط", callback_data: "activity:moderate" }],
    [{ text: "فعال", callback_data: "activity:active" }],
    [{ text: "خیلی فعال / ورزشکار", callback_data: "activity:athlete" }]
  ]
};

export const mealsKeyboard: ReplyMarkup = {
  inline_keyboard: [
    [
      { text: "۳ وعده", callback_data: "meals:3" },
      { text: "۴ وعده", callback_data: "meals:4" }
    ],
    [
      { text: "۵ وعده", callback_data: "meals:5" },
      { text: "۶ وعده", callback_data: "meals:6" }
    ]
  ]
};

export const restrictionsKeyboard: ReplyMarkup = {
  inline_keyboard: [
    [{ text: "محدودیت خاصی ندارم", callback_data: "restrictions:none" }]
  ]
};

export const doneKeyboard: ReplyMarkup = {
  inline_keyboard: [
    [
      { text: "برنامه جدید", callback_data: "action:new" },
      { text: "دیدن پروفایل", callback_data: "action:profile" }
    ]
  ]
};
