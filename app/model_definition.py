import numpy as np
from scipy.stats import norm
from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from .learning_store import LearningStore

class ProductivityRiskModel:
    def __init__(self):
        self.store = LearningStore()
        self.model = None
        self._build_model()

    def _build_model(self):
        """モデルの再構築（学習データ反映のため毎回呼べるようにする）"""
        self.model = DiscreteBayesianNetwork([
            ('Overworked', 'ConcentrationDrop'),
            ('SleepDeprived', 'ConcentrationDrop'),
            ('SmartphoneDistraction', 'ConcentrationDrop'),
            ('ConcentrationDrop', 'CarelessMistake')
        ])
        
        # --- 第5回：学習機能の反映 ---
        # 学習データ(alpha, beta)から、「集中力低下のしやすさ」の基準確率を計算
        # ベータ分布の期待値 E[X] = alpha / (alpha + beta)
        alpha, beta = self.store.get_params()
        base_prob = alpha / (alpha + beta)
        
        # 学習が進むにつれて、モデルの「基本傾向」が変化する
        # ここでは簡易的に、base_prob をLikelihoodの重みとして使用
        
        # 1. 親ノード定義
        cpd_o = TabularCPD('Overworked', 2, [[0.8], [0.2]])
        cpd_s = TabularCPD('SleepDeprived', 2, [[0.7], [0.3]]) # ここは後で連続値から上書きされるが形式上定義
        cpd_p = TabularCPD('SmartphoneDistraction', 2, [[0.5], [0.5]])

        # 2. 集中力低下 (Likelihood)
        # 親3つ (2^3=8通り)
        # ベース確率(base_prob)を使ってCPTを動的に調整
        # base_probが高ければ、少しの原因でもConcentrationDrop=Yesになりやすくなる
        
        # ロジック: 要因が多いほど確率は上がるが、その「上がりやすさ」が学習される
        w = base_prob * 2 # 重み係数
        
        # 組み合わせごとの[No, Yes]確率を生成（シグモイド関数風に計算）
        cpt_values = []
        for p in range(2): # Smartphone
            for s in range(2): # Sleep
                for o in range(2): # Overwork
                    score = (o + s + p) * w
                    prob_yes = 1 / (1 + np.exp(-score + 2)) # 簡易ロジック
                    # 確率として正規化
                    if prob_yes > 0.99: prob_yes = 0.99
                    if prob_yes < 0.01: prob_yes = 0.01
                    cpt_values.append([1 - prob_yes, prob_yes])
        
        # pgmpyの形式 ([Noの列...], [Yesの列...]) に変換
        flat_values = np.array(cpt_values).T.tolist()

        cpd_c = TabularCPD(
            variable='ConcentrationDrop', variable_card=2,
            values=flat_values,
            evidence=['Overworked', 'SleepDeprived', 'SmartphoneDistraction'],
            evidence_card=[2, 2, 2]
        )

        # 3. ミス (結果)
        cpd_m = TabularCPD('CarelessMistake', 2, [[0.9, 0.4], [0.1, 0.6]], 
                           evidence=['ConcentrationDrop'], evidence_card=[2])

        self.model.add_cpds(cpd_o, cpd_s, cpd_p, cpd_c, cpd_m)
        self.model.check_model()

    def get_model(self):
        # 毎回最新の学習状態を反映してモデルを返す
        self._build_model()
        return self.model

    # --- 第6回：連続変数の導入（分布の活用） ---
    def calculate_sleep_prob(self, hours: float) -> float:
        """
        睡眠時間(連続値)から、SleepDeprived=True(1) になる確率を計算する
        正規分布の累積分布関数(CDF)を使用
        - 平均: 6時間
        - 標準偏差: 1.5時間
        6時間より少なければ少ないほど、Deprivedの確率は1.0に近づく
        """
        # 6時間以下なら確率が高い -> 逆向きのCDF (Survival Function)
        prob_deprived = norm.sf(hours, loc=6.0, scale=1.5)
        # 確率なので0-1に収まるが、念のためclip
        return float(np.clip(prob_deprived, 0.01, 0.99))

    def update_learning(self, correct: bool):
        return self.store.update(correct)