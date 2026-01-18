import { Activity, Moon, Smartphone, AlertOctagon } from "lucide-react";

export const DIAGNOSTIC_QUESTIONS = [
  {
    id: "Overworked",
    label: "過重労働気味",
    subLabel: "最近、残業やタスク量が許容量を超えている",
    icon: Activity,
    colorClass: "bg-blue-500",
    accentClass: "border-blue-500 bg-blue-50"
  },
  {
    id: "SleepDeprived",
    label: "睡眠不足",
    subLabel: "6時間未満の睡眠が続いている",
    icon: Moon,
    colorClass: "bg-indigo-500",
    accentClass: "border-indigo-500 bg-indigo-50"
  },
  // --- 新規追加項目 ---
  {
    id: "SmartphoneDistraction",
    label: "スマホ・SNSの通知",
    subLabel: "作業中に通知が来て気になってしまう",
    icon: Smartphone, // lucide-reactからインポートしてください
    colorClass: "bg-pink-500",
    accentClass: "border-pink-500 bg-pink-50"
  },
  {
    id: "CarelessMistake",
    label: "些細なミスをした",
    subLabel: "入力ミスやバグ発生など、普段しない失敗があった",
    icon: AlertOctagon, // lucide-reactからインポートしてください
    colorClass: "bg-orange-500",
    accentClass: "border-orange-500 bg-orange-50"
  }
];