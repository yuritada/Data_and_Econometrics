import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict

# ご指摘に基づき DiscreteBayesianNetwork をインポート
# 環境によっては from pgmpy.models import BayesianModel を使う場合もありますが
# ここでは動作確認のとれた DiscreteBayesianNetwork を使用します。
from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# 1. ベイジアンネットワークモデルの構築クラス
# ==========================================
class BayesianRiskModel:
    def __init__(self):
        print("モデルを初期化中...")
        # モデル構造の定義: 過重労働(O)と睡眠不足(S) -> 集中力低下(C)
        self.model = DiscreteBayesianNetwork([
            ('Overworked', 'ConcentrationDrop'),
            ('SleepDeprived', 'ConcentrationDrop')
        ])
        
        # 条件付き確率表 (CPD) の設定
        # 0: No (False), 1: Yes (True)
        
        # Prior: 過重労働 (Overworked)
        # Yesの確率 20%
        cpd_o = TabularCPD(variable='Overworked', variable_card=2, values=[[0.8], [0.2]])
        
        # Prior: 睡眠不足 (SleepDeprived)
        # Yesの確率 30%
        cpd_s = TabularCPD(variable='SleepDeprived', variable_card=2, values=[[0.7], [0.3]])
        
        # Likelihood: 集中力低下 (ConcentrationDrop)
        # 親ノードの組み合わせ: [O=0,S=0], [O=1,S=0], [O=0,S=1], [O=1,S=1]
        # 結果(C=Yes)の確率:       5%         60%        50%        90%
        cpd_c = TabularCPD(
            variable='ConcentrationDrop', variable_card=2,
            values=[
                [0.95, 0.40, 0.50, 0.10], # C=No の確率
                [0.05, 0.60, 0.50, 0.90]  # C=Yes の確率
            ],
            evidence=['Overworked', 'SleepDeprived'],
            evidence_card=[2, 2]
        )
        
        # モデルにCPDを追加
        self.model.add_cpds(cpd_o, cpd_s, cpd_c)
        
        # モデルの整合性チェック
        if not self.model.check_model():
            raise ValueError("モデルの定義に矛盾があります")
            
        # 推論エンジンの初期化
        self.inference = VariableElimination(self.model)
        print("モデル構築完了。")

    def predict_risk(self, overworked: bool, sleep_deprived: bool) -> float:
        """
        エビデンスを受け取り、集中力低下(Yes=1)の確率を返す
        """
        # 入力をpgmpy用の形式(0 or 1)に変換
        evidence = {
            'Overworked': 1 if overworked else 0,
            'SleepDeprived': 1 if sleep_deprived else 0
        }
        
        try:
            # 推論実行 query=['ConcentrationDrop']
            result = self.inference.query(variables=['ConcentrationDrop'], evidence=evidence)
            
            # 結果から C=1 (Yes) の確率を取得
            # result.values は [P(No), P(Yes)] の配列
            risk_probability = result.values[1]
            return float(risk_probability)
            
        except Exception as e:
            print(f"推論エラー: {e}")
            raise e

# ==========================================
# 2. Web API (FastAPI) の定義
# ==========================================

# リクエストボディの定義
class DiagnosticInput(BaseModel):
    overworked: bool = Field(..., description="最近、過重労働気味ですか？")
    sleep_deprived: bool = Field(..., description="睡眠不足を感じていますか？")

# レスポンスの定義
class DiagnosticResponse(BaseModel):
    risk_score: float = Field(..., description="集中力が低下している確率(0.0〜1.0)")
    risk_level: str = Field(..., description="リスクの定性的な評価")
    advice: str = Field(..., description="システムからのアドバイス")

# アプリケーションのインスタンス化
app = FastAPI(
    title="Bayesian Risk Diagnostics API",
    description="ベイジアンネットワークを用いたリスク診断API",
    version="1.0.0"
)


# ▼▼▼ ここを追加してください ▼▼▼
# フロントエンド(http://localhost:3000)からのアクセスを許可する設定
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 本番環境では特定のドメインのみに絞る
    allow_credentials=True,
    allow_methods=["*"],    # すべてのメソッド(POST, GETなど)を許可
    allow_headers=["*"],    # すべてのヘッダーを許可
)

# モデルをグローバル変数として保持（起動時に一度だけロード）
risk_model = BayesianRiskModel()

@app.post("/diagnose", response_model=DiagnosticResponse)
async def diagnose_risk(input_data: DiagnosticInput):
    """
    ユーザーの状況を受け取り、集中力低下リスクを診断します。
    """
    # 推論を実行
    probability = risk_model.predict_risk(
        overworked=input_data.overworked,
        sleep_deprived=input_data.sleep_deprived
    )
    
    # 確率に応じたメッセージ生成
    if probability > 0.8:
        level = "DANGER"
        msg = "極めて危険な状態です。直ちに休息を取ってください。"
    elif probability > 0.5:
        level = "WARNING"
        msg = "集中力が低下しています。適度な休憩が必要です。"
    else:
        level = "SAFE"
        msg = "状態は良好です。この調子で進めましょう。"

    return DiagnosticResponse(
        risk_score=round(probability, 4),
        risk_level=level,
        advice=msg
    )

@app.get("/")
def root():
    return {"message": "Bayesian Diagnostics API is running."}

# ==========================================
# 3. 実行エントリーポイント
# ==========================================
if __name__ == "__main__":
    # python main.py で実行した時にサーバーが立ち上がる設定
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)