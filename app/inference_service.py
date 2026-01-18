from pgmpy.inference import VariableElimination
from .model_definition import ProductivityRiskModel

class BayesianInferenceService:
    def __init__(self):
        print("推論サービス初期化中...")
        # 定義ファイルからモデルをロード
        self.definition = ProductivityRiskModel()
        self.model = self.definition.get_model()
        self.inference = VariableElimination(self.model)
        print("推論エンジン準備完了")

    def predict(self, evidence: dict, target_variable: str = 'ConcentrationDrop') -> float:
        """
        evidence: { 'Overworked': True, ... } のような辞書
        """
        # Booleanを0/1に変換してpgmpy用の形式にする
        formatted_evidence = {
            key: 1 if value else 0 
            for key, value in evidence.items()
        }

        try:
            # 推論実行
            result = self.inference.query(
                variables=[target_variable], 
                evidence=formatted_evidence
            )
            # Yes(index=1) の確率を返す
            return float(result.values[1])
        except Exception as e:
            print(f"Inference Error: {e}")
            # エビデンスが不足している場合やキーが間違っている場合のハンドリング
            # ここではシンプルに再送出
            raise e