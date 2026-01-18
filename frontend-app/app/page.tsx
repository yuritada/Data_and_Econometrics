"use client";

import { useState } from "react";
import { Brain, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { DIAGNOSTIC_QUESTIONS } from "./config/questions";

type RiskLevel = "SAFE" | "WARNING" | "DANGER";

interface DiagnosticResponse {
  risk_score: number;
  risk_level: RiskLevel;
  advice: string;
}

export default function Home() {
  // 状態を動的に管理（キーは質問ID、値はboolean）
  const [answers, setAnswers] = useState<Record<string, boolean>>(
    // 初期値はすべてfalse
    DIAGNOSTIC_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: false }), {})
  );

  const [result, setResult] = useState<DiagnosticResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // トグル変更時の処理
  const toggleAnswer = (id: string) => {
    setAnswers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      // バックエンドの仕様変更に合わせて payload を { evidence: { ... } } にする
      const response = await fetch("http://127.0.0.1:8000/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: answers }),
      });

      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert("診断に失敗しました");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white relative z-10">AI リスク診断 v2</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">拡張モジュール対応版</p>
        </div>

        <div className="p-8 space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Diagnostic Parameters
          </h2>

          {/* 設定ファイルから自動生成されるフォーム */}
          <div className="space-y-3">
            {DIAGNOSTIC_QUESTIONS.map((q) => {
              const isActive = answers[q.id];
              return (
                <div 
                  key={q.id}
                  onClick={() => toggleAnswer(q.id)}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${isActive ? q.accentClass : 'border-slate-100 hover:border-slate-200 bg-white'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${isActive ? q.colorClass + ' text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <q.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-semibold transition-colors ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                        {q.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{q.subLabel}</div>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'border-transparent ' + q.colorClass : 'border-slate-200'}`}>
                    {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
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
            {loading ? "分析中..." : "リスクを診断する"}
          </button>

          {/* 結果表示（前回と同じロジックですがデザインを統一） */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 border-t border-slate-100">
              {/* 外枠：getRiskBaseStyle を使用 */}
              <div className={`p-5 rounded-2xl border-2 flex gap-4 ${getRiskBaseStyle(result.risk_level)}`}>
                
                {/* アイコン：getRiskAccentColor で濃い背景を作る */}
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
                    <span className="text-sm font-bold">%</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed opacity-95">
                    {result.advice}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}