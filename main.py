from pgmpy.models import DiscreteBayesianNetwork  # 変更: クラス名の変更
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination

# 1. モデルの構造を定義
# BayesianNetwork から DiscreteBayesianNetwork に変更
model = DiscreteBayesianNetwork([('Overworked', 'ConcentrationDrop'), 
                                 ('SleepDeprived', 'ConcentrationDrop')])

# 2. 条件付き確率表 (CPD) の設定
# (ここは変更なし)
cpd_o = TabularCPD(variable='Overworked', variable_card=2, values=[[0.8], [0.2]])
cpd_s = TabularCPD(variable='SleepDeprived', variable_card=2, values=[[0.7], [0.3]])

cpd_c = TabularCPD(variable='ConcentrationDrop', variable_card=2,
                   values=[[0.95, 0.4, 0.5, 0.1],  # ConcentrationDrop = No
                           [0.05, 0.6, 0.5, 0.9]], # ConcentrationDrop = Yes
                   evidence=['Overworked', 'SleepDeprived'],
                   evidence_card=[2, 2])

# 3. モデルにCPDを追加し、妥当性をチェック
model.add_cpds(cpd_o, cpd_s, cpd_c)
assert model.check_model()

# 4. 推論エンジンの実行
inference = VariableElimination(model)

def diagnose(evidence_dict):
    """
    ユーザーの状況（エビデンス）を入力すると、リスクの事後確率を返す関数
    """
    result = inference.query(variables=['ConcentrationDrop'], evidence=evidence_dict)
    return result

# 実行例
print("--- 診断結果 ---")
evidence = {'Overworked': 1} # 1は「Yes」を意味する
risk_prob = diagnose(evidence)
print(risk_prob)