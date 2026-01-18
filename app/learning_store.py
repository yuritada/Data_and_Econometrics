import json
import os
from pathlib import Path

DATA_FILE = Path("learning_data.json")

class LearningStore:
    """
    第5回講義：共役事前分布（ベータ分布）のパラメータを管理するクラス
    ユーザーのフィードバックに基づいて alpha, beta を更新し、
    「経験からの学習」を実現する。
    """
    def __init__(self):
        self._load()

    def _load(self):
        if not DATA_FILE.exists():
            # 初期状態: 理由不十分の原則に少し「事前知識」を加えた状態
            # Alpha=10, Beta=10 -> 確率0.5 (確信度はまだ低い)
            self.data = {"alpha": 10.0, "beta": 10.0}
        else:
            with open(DATA_FILE, "r") as f:
                self.data = json.load(f)

    def _save(self):
        with open(DATA_FILE, "w") as f:
            json.dump(self.data, f)

    def get_params(self):
        return self.data["alpha"], self.data["beta"]

    def update(self, is_correct: bool):
        """
        フィードバックによる学習
        - 当たっていた(is_correct=True) -> alpha を加算
        - 外れていた(is_correct=False) -> beta を加算
        """
        if is_correct:
            self.data["alpha"] += 1.0
        else:
            self.data["beta"] += 1.0
        self._save()
        return self.get_params()