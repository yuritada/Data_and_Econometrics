import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import DiagnosisRequest, DiagnosisResponse
from .inference_service import BayesianInferenceService

from .schemas import DiagnosisRequest, DiagnosisResponse, FeedbackRequest


app = FastAPI(title="Bayesian Diagnostics API v2")

# CORS設定
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# サービスのインスタンス化（シングルトンとして保持）
inference_service = BayesianInferenceService()

@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(request: DiagnosisRequest):
    try:
        # 感度分析付きの推論を実行
        result = inference_service.predict_with_analysis(request.evidence)
        risk = result["risk_score"]
        
        # リスクレベル判定
        if risk > 0.8:
            level = "DANGER"
            msg = "かなり危険な状態です。"
        elif risk > 0.5:
            level = "WARNING"
            msg = "注意が必要です。"
        else:
            level = "SAFE"
            msg = "良好です。"

        return DiagnosisResponse(
            risk_score=round(risk, 4),
            risk_level=level,
            advice=msg,
            improvements=result["improvements"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def feedback(request: FeedbackRequest):
    """ユーザーからのフィードバックを受け取り、モデルを学習させる"""
    new_params = inference_service.learn_feedback(request.is_correct)
    return {"message": "Learning updated", "current_params": new_params}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)