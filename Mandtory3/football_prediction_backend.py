import json
import os
import pickle as p
import pandas as pd
from flask import Flask
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

HERE = os.path.dirname(os.path.abspath(__file__))


# Må hete det samme som i notebooken, ellers får ikke pickle lastet modellen.
class ThresholdClassifier(BaseEstimator, ClassifierMixin):
    def __init__(self, estimator, threshold=0.5):
        self.estimator = estimator
        self.threshold = threshold

    def fit(self, x, y):
        if hasattr(self.estimator, 'classes_'):
            self.classes_ = self.estimator.classes_
            return self
        self.estimator.fit(x, y)
        return self

    def predict(self, x):
        probabilities = self.predict_proba(x)
        return (probabilities[:, 1] >= self.threshold).astype(int)

    def predict_proba(self, x):
        return self.estimator.predict_proba(x)


app = Flask("My Backend")
api = Api(app)

categorical_features = ["team", "position", "shot_body_part", "shot_technique", "shot_type"]

feature_names = [
    'team', 'position', 'shot_body_part', 'shot_technique', 'shot_type',
    'under_pressure', 'shot_follows_dribble', 'shot_aerial_won',
    'shot_first_time', 'shot_one_on_one', 'shot_open_goal',
    'minute', 'location_x', 'location_y', 'keeper_x', 'keeper_y',
    'shot_distance_from_goal', 'shot_angle', 'shot_angle_visual',
    'distance_between_shooter_and_keeper', 'distance_between_keeper_and_goal',
    'opponents_within_2_5_yards', 'opponents_2_5_to_5_yards', 'opponents_5_to_10_yards',
    'distance_to_nearest_opponent', 'opponents_in_shot_triangle',
    'goals_for_before', 'goals_against_before', 'score_diff_before',
    'player_goal_rate_before', 'shots_before',
]

# Lastes inn en gang, ikke per forespørsel
with open(os.path.join(HERE, "GB_XG_model.pickle"), "rb") as f:
    model = p.load(f)

with open(os.path.join(HERE, "model_results.json"), encoding="utf-8") as f:
    results = json.load(f)

DEFAULT_THRESHOLD = results["meta"]["default_threshold"]


class GetPrediction(Resource):
    def __init__(self):
        self.reqparser = RequestParser()
        for name in feature_names:
            arg_type = str if name in categorical_features else float
            self.reqparser.add_argument(name, type=arg_type, required=True, location="args")
        # Valgfri: brukeren kan justere terskelen selv
        self.reqparser.add_argument("threshold", type=float, required=False,
                                    default=DEFAULT_THRESHOLD, location="args")

    def get(self):
        args = self.reqparser.parse_args()
        inputs = pd.DataFrame([[args[name] for name in feature_names]], columns=feature_names)

        xg_prob = float(model.predict_proba(inputs)[0, 1])
        threshold = args["threshold"]

        return {
            "prediction": int(xg_prob >= threshold),
            "xG_probability": round(xg_prob, 4),
            "threshold": threshold,
        }


class GetOptions(Resource):
    """Lag, posisjoner osv. slik modellen så dem under trening."""

    def get(self):
        pipeline = model.estimator.calibrated_classifiers_[0].estimator
        pre = pipeline.steps[0][1]  # ColumnTransformer
        options = {}
        for _, transformer, columns in pre.transformers_:
            if isinstance(transformer, Pipeline):
                transformer = next((s for _, s in transformer.steps if isinstance(s, OneHotEncoder)), None)
            if isinstance(transformer, OneHotEncoder):
                for column, categories in zip(columns, transformer.categories_):
                    options[column] = [str(c) for c in categories]
        return options


class GetResults(Resource):
    """Testresultater: metrikker, tabell over terskler og kurvene (ROC, PR, kalibrering)."""

    def get(self):
        return results


class GetImportance(Resource):
    """Permutation importance, PDP og SHAP (ligger i model_results.json under 'importance')."""

    def get(self):
        if "importance" not in results:
            return {"message": "Ingen importance-data i model_results.json ennå."}, 404
        return results["importance"]


api.add_resource(GetPrediction, "/predict")
api.add_resource(GetOptions, "/options")
api.add_resource(GetResults, "/results")
api.add_resource(GetImportance, "/importance")

if __name__ == "__main__":
    app.run(debug=False)
