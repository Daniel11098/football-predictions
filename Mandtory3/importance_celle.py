import json
from sklearn.inspection import partial_dependence

# 1) Permutation importance: bruker perm (test) og perm_res (trainval) du allerede har
permutation = [
    {"feature": f,
     "trainval_mean": float(perm_res.importances_mean[i]), "trainval_std": float(perm_res.importances_std[i]),
     "test_mean": float(perm.importances_mean[i]), "test_std": float(perm.importances_std[i])}
    for i, f in enumerate(trainval_featuers.columns)
]
permutation.sort(key=lambda r: r["trainval_mean"], reverse=True)

# 2) PDP for fire features (heltall må gjøres om til float, som før)
pdp_features = ["shot_angle_visual", "shot_distance_from_goal",
                "distance_between_shooter_and_keeper", "distance_to_nearest_opponent"]
X_pdp = trainval_featuers.copy()
X_pdp[pdp_features] = X_pdp[pdp_features].astype(float)

pdp = {}
for f in pdp_features:
    r = partial_dependence(calibrated_gb, X_pdp, [f], kind="average", grid_resolution=30)
    pdp[f] = {"x": [float(v) for v in r["grid_values"][0]],
              "y": [float(v) for v in r["average"][0]]}

# 3) SHAP: slå sammen one-hot-kolonner til opprinnelig feature
original = list(trainval_featuers.columns)

def til_original(navn):
    s = navn.split("__", 1)[1]
    if s.startswith("missingindicator_"):
        s = s[len("missingindicator_"):]
    treff = [f for f in original if s == f or s.startswith(f + "_")]
    return max(treff, key=len)

grupper = {}
for i, kolonne in enumerate(X_t_df.columns):
    grupper.setdefault(til_original(kolonne), []).append(i)

sv = shap_values.values
shap_rader = [{"feature": f, "mean_abs": float(np.abs(sv[:, idx].sum(axis=1)).mean())}
              for f, idx in grupper.items()]
shap_rader.sort(key=lambda r: r["mean_abs"], reverse=True)

# Legg inn i model_results.json
with open("model_results.json", encoding="utf-8") as f:
    resultater = json.load(f)
resultater["importance"] = {"permutation": permutation, "pdp": pdp, "shap": shap_rader}
with open("model_results.json", "w", encoding="utf-8") as f:
    json.dump(resultater, f)

print("Lagt inn:", len(permutation), "permutation,", len(pdp), "PDP,", len(shap_rader), "SHAP")
