from pydantic import BaseModel, Field
from typing import Dict

class DiagnosisRequest(BaseModel):
    # 拡張性のため、具体的な変数名ではなく辞書型で受け取る
    # 例: {"Overworked": true, "SleepDeprived": false, "NewItem": true}
    evidence: Dict[str, bool] = Field(..., description="観測された証拠の辞書")

class DiagnosisResponse(BaseModel):
    risk_score: float = Field(..., description="リスク発生確率(0-1)")
    risk_level: str = Field(..., description="SAFE, WARNING, DANGER")
    advice: str = Field(..., description="アドバイスメッセージ")