import { Activity, Moon, Smartphone, AlertOctagon } from "lucide-react";

export type InputType = "toggle" | "slider";

export const DIAGNOSTIC_QUESTIONS = [
  {
    id: "Overworked",
    type: "toggle" as InputType,
    label: "過重労働気味",
    subLabel: "許容量を超えている",
    icon: Activity,
    colorClass: "bg-blue-500",
    accentClass: "border-blue-500 bg-blue-50"
  },
  {
    id: "SleepHours", // ID変更: SleepDeprived -> SleepHours
    type: "slider" as InputType,
    label: "昨晩の睡眠時間",
    subLabel: "スライダーで調整 (時間)",
    min: 0,
    max: 12,
    defaultValue: 7,
    icon: Moon,
    colorClass: "bg-indigo-500",
    accentClass: "border-indigo-500 bg-indigo-50"
  },
  {
    id: "SmartphoneDistraction",
    type: "toggle" as InputType,
    label: "スマホの誘惑",
    subLabel: "通知が気になってしまう",
    icon: Smartphone,
    colorClass: "bg-pink-500",
    accentClass: "border-pink-500 bg-pink-50"
  },
  {
    id: "CarelessMistake",
    type: "toggle" as InputType,
    label: "些細なミス",
    subLabel: "入力ミスなどがあった",
    icon: AlertOctagon,
    colorClass: "bg-orange-500",
    accentClass: "border-orange-500 bg-orange-50"
  }
];