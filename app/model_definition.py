from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.factors.discrete import TabularCPD

class ProductivityRiskModel:
    def __init__(self):
        # 構造定義：親ノードを3つに増やし、子ノード(Mistake)を追加
        self.model = DiscreteBayesianNetwork([
            ('Overworked', 'ConcentrationDrop'),
            ('SleepDeprived', 'ConcentrationDrop'),
            ('SmartphoneDistraction', 'ConcentrationDrop'), # 新規: スマホ
            ('ConcentrationDrop', 'CarelessMistake')        # 新規: ミス(結果)
        ])
        
        # --- 1. 親ノードの事前確率 ---
        
        # 過重労働 (Yes: 0.2)
        cpd_o = TabularCPD('Overworked', 2, [[0.8], [0.2]])
        # 睡眠不足 (Yes: 0.3)
        cpd_s = TabularCPD('SleepDeprived', 2, [[0.7], [0.3]])
        # [新規] スマホの誘惑 (Yes: 0.5 - ついつい見てしまう確率は高め)
        cpd_p = TabularCPD('SmartphoneDistraction', 2, [[0.5], [0.5]])

        # --- 2. 集中力低下 (条件付き確率) ---
        # 親が3つあるため、組み合わせは 2^3 = 8通り
        # 順序: O(過労), S(睡眠), P(スマホ)
        # [0,0,0], [1,0,0], [0,1,0], [1,1,0], [0,0,1], [1,0,1], [0,1,1], [1,1,1]
        
        cpd_c = TabularCPD(
            variable='ConcentrationDrop', variable_card=2,
            values=[
                # ConcentrationDrop = No の確率 (健康な確率)
                [0.95, 0.60, 0.70, 0.30, 0.60, 0.20, 0.30, 0.05],
                # ConcentrationDrop = Yes の確率 (低下する確率)
                # スマホ(P=1)が加わると、さらに確率は上がる設定
                [0.05, 0.40, 0.30, 0.70, 0.40, 0.80, 0.70, 0.95]
            ],
            evidence=['Overworked', 'SleepDeprived', 'SmartphoneDistraction'],
            evidence_card=[2, 2, 2]
        )

        # --- 3. [新規] ミスの発生 (条件付き確率) ---
        # 集中力が低下していると、ミスをする確率が跳ね上がる
        # 親: ConcentrationDrop
        cpd_m = TabularCPD(
            variable='CarelessMistake', variable_card=2,
            values=[
                # Mistake = No
                [0.90, 0.40], 
                # Mistake = Yes (集中してれば10%しかミスしないが、低下してると60%ミスる)
                [0.10, 0.60] 
            ],
            evidence=['ConcentrationDrop'],
            evidence_card=[2]
        )

        self.model.add_cpds(cpd_o, cpd_s, cpd_p, cpd_c, cpd_m)
        
        if not self.model.check_model():
            raise ValueError("モデル定義に矛盾があります")

    def get_model(self):
        return self.model