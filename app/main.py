import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import DiagnosisRequest, DiagnosisResponse
from .inference_service import BayesianInferenceService

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
        # サービスを使って推論
        probability = inference_service.predict(request.evidence)
        
        # 結果の整形
        if probability > 0.8:
            level = "DANGER"
            advice = "危険水準です。即座に休息が必要です。"
        elif probability > 0.5:
            level = "WARNING"
            advice = "注意が必要です。リフレッシュを心がけてください。"
        else:
            level = "SAFE"
            advice = "良好な状態です。作業を続けましょう。"

        return DiagnosisResponse(
            risk_score=round(probability, 4),
            risk_level=level,
            advice=advice
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)