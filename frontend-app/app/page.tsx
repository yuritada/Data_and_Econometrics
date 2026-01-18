"use client";

import { useState } from "react";
import { Brain, AlertTriangle, CheckCircle, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { DIAGNOSTIC_QUESTIONS } from "./config/questions";

// 型定義
type RiskLevel = "SAFE" | "WARNING" | "DANGER";

interface Improvement {
  factor: string;
  reduction: number;
  advice: string;
}

interface DiagnosticResponse {
  risk_score: number;
  risk_level: RiskLevel;
  advice: string;
  improvements: Improvement[];
}

export default function Home() {
  // 状態管理
  const [answers, setAnswers] = useState<Record<string, any>>(
    DIAGNOSTIC_QUESTIONS.reduce((acc, q) => ({ 
      ...acc, 
      [q.id]: q.type === 'slider' ? q.defaultValue : false 
    }), {})
  );

  const [result, setResult] = useState<DiagnosticResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // 入力値変更ハンドラ
  const handleChange = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleDiagnose = async () => {
    setLoading(true);
    setFeedbackSent(false);
    try {
      const response = await fetch("http://127.0.0.1:8000/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: answers }),
      });
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert("エラーが発生しました。バックエンドが起動しているか確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (isCorrect: boolean) => {
    try {
      await fetch("http://127.0.0.1:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_correct: isCorrect }),
      });
      setFeedbackSent(true);
      alert("フィードバックありがとうございます！AIが学習しました。");
    } catch (err) {
      console.error(err);
    }
  };

  // --- デザイン修正部分 ---

  // ボックス全体の「ベース」となる色（薄い背景 + 濃い文字 + 境界線）
  const getRiskBaseStyle = (level: RiskLevel) => {
    switch (level) {
      case "SAFE": 
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "WARNING": 
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "DANGER": 
        return "bg-rose-50 text-rose-700 border-rose-200";
      default: 
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // アイコン部分などの「アクセント」となる濃い背景色
  const getRiskAccentColor = (level: RiskLevel) => {
    switch (level) {
      case "SAFE": return "bg-emerald-500";
      case "WARNING": return "bg-amber-500";
      case "DANGER": return "bg-rose-600";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <main className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* ヘッダー */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
          <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-3 relative z-10" />
          <h1 className="text-2xl font-bold text-white relative z-10">AI リスク診断 v3</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">学習機能 & 感度分析エンジン搭載</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {DIAGNOSTIC_QUESTIONS.map((q) => {
              const val = answers[q.id];
              
              if (q.type === 'slider') {
                return (
                  <div key={q.id} className={`p-4 rounded-xl border-2 border-slate-100 bg-white`}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`p-2.5 rounded-lg ${q.colorClass} text-white`}>
                        <q.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{q.label}</div>
                        <div className="text-xs text-slate-400">{q.subLabel}</div>
                      </div>
                      <div className="ml-auto font-bold text-xl text-slate-700">{val}h</div>
                    </div>
                    <input 
                      type="range" 
                      min={q.min} max={q.max} step={0.5}
                      value={val} 
                      onChange={(e) => handleChange(q.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                );
              }

              return (
                <div 
                  key={q.id}
                  onClick={() => handleChange(q.id, !val)}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${val ? q.accentClass : 'border-slate-100 hover:border-slate-200 bg-white'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${val ? q.colorClass + ' text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <q.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-semibold transition-colors ${val ? 'text-slate-800' : 'text-slate-600'}`}>
                        {q.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{q.subLabel}</div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${val ? 'border-transparent ' + q.colorClass : 'border-slate-200'}`}>
                    {val && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "高度な推論を実行中..." : "リスクを分析する"}
          </button>

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 border-t border-slate-100">
              
              {/* --- 修正後: メイン結果ボックス --- */}
              <div className={`p-5 rounded-2xl border-2 flex gap-4 mb-6 ${getRiskBaseStyle(result.risk_level)}`}>
                
                {/* アイコン部分: 濃いアクセントカラー */}
                <div className={`mt-1 p-2 rounded-xl text-white h-fit shadow-sm ${getRiskAccentColor(result.risk_level)}`}>
                  {result.risk_level === 'DANGER' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="text-3xl font-black mb-1 flex items-baseline gap-1">
                    {(result.risk_score * 100).toFixed(0)}
                    <span className="text-sm font-bold opacity-70">%</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed opacity-95">
                    {result.advice}
                  </p>
                </div>
              </div>
              {/* ---------------------------------- */}

              {/* 感度分析結果 (What-If) */}
              {result.improvements.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
                  <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> AIからの改善提案
                  </h3>
                  <div className="space-y-2">
                    {result.improvements.map((imp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                        <span className="text-sm text-slate-700">{imp.advice}</span>
                        <span className="text-sm font-bold text-emerald-600 flex items-center">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          -{(imp.reduction * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 学習用フィードバック */}
              {!feedbackSent ? (
                <div className="text-center bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 mb-3">この診断は当たりましたか？ AIの学習にご協力ください</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => sendFeedback(true)} className="flex items-center gap-2 px-4 py-2 bg-white border hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 rounded-lg transition-colors text-sm font-bold">
                      <ThumbsUp className="w-4 h-4" /> 当たっている
                    </button>
                    <button onClick={() => sendFeedback(false)} className="flex items-center gap-2 px-4 py-2 bg-white border hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-lg transition-colors text-sm font-bold">
                      <ThumbsDown className="w-4 h-4" /> 外れている
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded-lg">
                  フィードバックを受け付けました。モデルパラメータ(α, β)を更新しました。
                </div>
              )}
              
            </div>
          )}
        </div>
      </main>
    </div>
  );
}