"use client";

import { useState } from "react";
import { Activity, Brain, Moon, AlertTriangle, CheckCircle, Info } from "lucide-react";

// 型定義
type RiskLevel = "SAFE" | "WARNING" | "DANGER";

interface DiagnosticResponse {
  risk_score: number;
  risk_level: RiskLevel;
  advice: string;
}

export default function Home() {
  // 状態管理
  const [overworked, setOverworked] = useState(false);
  const [sleepDeprived, setSleepDeprived] = useState(false);
  const [result, setResult] = useState<DiagnosticResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 診断実行関数
  const handleDiagnose = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          overworked: overworked,
          sleep_deprived: sleepDeprived,
        }),
      });

      if (!response.ok) {
        throw new Error("サーバーとの通信に失敗しました");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("診断中にエラーが発生しました。バックエンドが起動しているか確認してください。");
    } finally {
      setLoading(false);
    }
  };

  // リスクレベルに応じた色設定
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case "SAFE": return "bg-emerald-500";
      case "WARNING": return "bg-amber-500";
      case "DANGER": return "bg-rose-600";
      default: return "bg-gray-400";
    }
  };

  const getRiskTextColor = (level: RiskLevel) => {
    switch (level) {
      case "SAFE": return "text-emerald-700 bg-emerald-50";
      case "WARNING": return "text-amber-700 bg-amber-50";
      case "DANGER": return "text-rose-700 bg-rose-50";
      default: return "text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* ヘッダーエリア */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
          <Brain className="w-12 h-12 text-blue-400 mx-auto mb-3 relative z-10" />
          <h1 className="text-2xl font-bold text-white relative z-10">AI リスク診断</h1>
          <p className="text-slate-400 text-sm mt-1 relative z-10">ベイズ推論による集中力低下予測</p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* 入力フォーム */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">現在の状況を入力</h2>
            
            {/* スイッチ1: 過重労働 */}
            <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${overworked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${overworked ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">過重労働気味</div>
                  <div className="text-xs text-slate-500">最近、仕事量が多すぎる</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={overworked} 
                onChange={(e) => setOverworked(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
            </label>

            {/* スイッチ2: 睡眠不足 */}
            <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${sleepDeprived ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${sleepDeprived ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700">睡眠不足</div>
                  <div className="text-xs text-slate-500">十分な睡眠が取れていない</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={sleepDeprived} 
                onChange={(e) => setSleepDeprived(e.target.checked)}
                className="w-5 h-5 accent-indigo-600"
              />
            </label>
          </div>

          {/* 診断ボタン */}
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-300/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                推論実行中...
              </>
            ) : (
              "リスクを診断する"
            )}
          </button>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* 結果表示エリア */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-t border-slate-100 my-6"></div>
              
              <div className="text-center mb-6">
                <div className="text-sm text-slate-500 mb-1">推定された集中力低下確率</div>
                <div className="text-5xl font-black text-slate-800">
                  {(result.risk_score * 100).toFixed(1)}
                  <span className="text-2xl text-slate-400 ml-1">%</span>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="w-full bg-slate-100 rounded-full h-4 mb-6 overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${getRiskColor(result.risk_level)}`}
                  style={{ width: `${result.risk_score * 100}%` }}
                ></div>
              </div>

              {/* 結果カード */}
              <div className={`p-5 rounded-xl border ${getRiskTextColor(result.risk_level)} flex gap-4 items-start`}>
                <div className="mt-1">
                  {result.risk_level === 'SAFE' && <CheckCircle className="w-6 h-6" />}
                  {result.risk_level === 'WARNING' && <Info className="w-6 h-6" />}
                  {result.risk_level === 'DANGER' && <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-lg mb-1 flex items-center gap-2">
                    判定: {result.risk_level}
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {result.advice}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-8 text-slate-400 text-xs text-center">
        Powered by Bayesian Network Inference Engine<br />
        (pgmpy & FastAPI)
      </footer>
    </div>
  );
}