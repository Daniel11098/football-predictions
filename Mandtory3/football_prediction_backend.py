import pickle as p
import pandas as pd
from flask import Flask
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser
from sklearn.base import BaseEstimator, ClassifierMixin


 

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
#Lastes inn en gang ikke per forespørsel
with open ("GB_XG_model.pickle", "rb") as f:
    model = p.load(f)


class GetPrediction(Resource):
    def __init__(self):
        self.reqparser = RequestParser()
        for name in feature_names:
            arg_type = str if name in categorical_features else float
            self.reqparser.add_argument(name, type=arg_type, required=True, location="args")

    def get(self):
        args = self.reqparser.parse_args()
        inputs = pd.DataFrame([[args[name] for name in feature_names]], columns=feature_names)

        pred = int(model.predict(inputs)[0])
        xg_prob = float(model.predict_proba(inputs)[0, 1])

        return {
            "prediction": pred,
            "xG_probability": round(xg_prob, 4)
        }

api.add_resource(GetPrediction,"/predict")

if __name__ == "__main__":
    app.run(debug=True)
