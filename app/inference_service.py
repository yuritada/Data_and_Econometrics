from pgmpy.inference import VariableElimination
from .model_definition import ProductivityRiskModel

class BayesianInferenceService:
    def __init__(self):
        self.model_def = ProductivityRiskModel()
        
    def predict_with_analysis(self, evidence_raw: dict):
        """
        推論に加え、感度分析（What-If）を行う
        """
        # 1. 連続値の前処理
        processed_evidence = {}
        sleep_hours = evidence_raw.get("SleepHours", 7.0)
        
        # 連続値 -> 離散確率への変換 (ソフトエビデンスとして扱うには高度すぎるため、ここでは確率的サンプリングまたは閾値処理を行う)
        # 今回は「確率的にどちらか」を決定するのではなく、
        # 入力された時間から計算された確率が 0.5 を超えていれば True (1) とする
        # (より厳密にはVirtual Evidenceを使うが、pgmpyの制限のため離散化する)
        prob_sleep_deprived = self.model_def.calculate_sleep_prob(sleep_hours)
        is_sleep_deprived = 1 if prob_sleep_deprived > 0.5 else 0
        
        processed_evidence['SleepDeprived'] = is_sleep_deprived
        
        # 他のブール値項目の処理
        for key, val in evidence_raw.items():
            if key == "SleepHours": continue
            processed_evidence[key] = 1 if val else 0

        # 2. 推論実行
        model = self.model_def.get_model()
        inference = VariableElimination(model)
        
        # ターゲット以外のエビデンスのみ抽出
        query_evidence = {k: v for k, v in processed_evidence.items() if k in ['Overworked', 'SleepDeprived', 'SmartphoneDistraction', 'CarelessMistake']}
        
        base_result = inference.query(variables=['ConcentrationDrop'], evidence=query_evidence)
        current_risk = base_result.values[1] # Yesの確率

        # 3. 感度分析 (What-If Analysis)
        # 各「悪い要因(Yes)」を「良い要因(No)」に変えたらどれくらいリスクが下がるか計算
        improvements = []
        
        factors = {
            'Overworked': '過重労働を解消する',
            'SleepDeprived': 'もっと睡眠をとる', # 元がスライダーだが内部では離散
            'SmartphoneDistraction': 'スマホを遠ざける'
        }

        for node, advice_text in factors.items():
            # 現在その要因が「あり(1)」の場合のみ分析
            if processed_evidence.get(node) == 1:
                # 一時的に要因を解消(0)に変更
                temp_evidence = query_evidence.copy()
                temp_evidence[node] = 0
                
                new_result = inference.query(variables=['ConcentrationDrop'], evidence=temp_evidence)
                new_risk = new_result.values[1]
                
                reduction = current_risk - new_risk
                if reduction > 0.01: # 1%以上下がるなら提案する
                    improvements.append({
                        "factor": node,
                        "reduction": reduction,
                        "advice": advice_text
                    })

        # 効果が高い順にソート
        improvements.sort(key=lambda x: x["reduction"], reverse=True)

        return {
            "risk_score": float(current_risk),
            "improvements": improvements
        }

    def learn_feedback(self, is_correct: bool):
        return self.model_def.update_learning(is_correct)