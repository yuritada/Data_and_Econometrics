from pydantic import BaseModel, Field
from typing import Dict, Union, List, Any

class DiagnosisRequest(BaseModel):
    # 値は bool だけでなく float (睡眠時間) も許容する
    evidence: Dict[str, Union[bool, float]] = Field(...)

class ImprovementItem(BaseModel):
    factor: str
    reduction: float
    advice: str

class DiagnosisResponse(BaseModel):
    risk_score: float
    risk_level: str
    advice: str
    improvements: List[ImprovementItem] # 追加: 改善提案リスト

class FeedbackRequest(BaseModel):
    is_correct: bool