# xG-kalkulator for Barcelona

En xG-modell (expected goals) som gir sannsynligheten for at et skudd blir mål, servert som REST-API med Flask og brukt i en React-app der du plasserer skudd på banen og ser resultatet med en gang.

![Demo av xG-kalkulatoren](docs/demo.gif)

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.9.1-F7931E?logo=scikit-learn&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-REST_API-000000?logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)

Prosjektet er en obligatorisk oppgave i ITF31519 Practical Machine Learning (HIOF). Det består av modellen, API-et, appen og en rapport om etikk, pålitelighet og bruk.

## Hva appen gjør

- **Plasser skuddet på banen.** Klikk og dra skytter, keeper og motstandere. Avstand, skuddvinkel, synlig mål og antall motstandere regnes ut fra banen.
- **Se xG.** Sannsynligheten for mål vises som et tall og som 100 prikker («av 100 slike skudd blir omtrent N mål»).
- **Juster terskelen selv.** En slider flytter terskelen for «farlig skudd», og precision, recall og F1 oppdateres på testdata og på treningsdata (out-of-fold). Appen forklarer hva JA og NEI betyr ved valgt terskel.
- **Se hva som påvirker modellen.** Permutation importance, SHAP og partial dependence, med markør for ditt eget skudd.

## Modellen

| Del | Beskrivelse |
|---|---|
| Data | 12 985 skudd fra 525 kamper med Barcelona (StatsBomb), 2004/05–2020/21 |
| Test | 2018/19–2020/21: 2 478 skudd, 322 mål (102 kamper) |
| Modell | Gradient Boosting (scikit-learn), kryssvalidert i grupper per kamp |
| Vekting | Mål vekt 4, ikke-mål vekt 1 under trening |
| Kalibrering | Sigmoid (`CalibratedClassifierCV`), siden vektingen blåste opp sannsynlighetene |
| Terskel | 0,25, valgt på treningsdata (out-of-fold) og ikke på testsettet |

**Resultater på testsettet**

| Mål | Verdi |
|---|---|
| ROC-AUC | 0,780 |
| Brier | 0,094 |
| Log-loss | 0,321 |
| Predikerte mål | 339,5 (faktisk: 322) |
| Ved terskel 0,25 | precision 0,364, recall 0,509 |

Før kalibreringen predikerte modellen 860,7 mål mot 322 faktiske. Etter kalibreringen ligger summen nær det faktiske antallet.

## Kom i gang

Du trenger Python og Node.js.

```bash
# 1. Backend (port 5000)
pip install -r requirements.txt
python football_prediction_backend.py

# 2. Frontend (port 5173), i et nytt terminalvindu
cd xg-frontend
npm install
npm run dev
```

Åpne <http://localhost:5173>. Vite sender alle kall til `/api` videre til Flask på port 5000.

> `GB_XG_model.pickle` krever samme scikit-learn-versjon som modellen ble trent med. Den er låst til 1.9.1 i `requirements.txt`. Backenden definerer også klassen `ThresholdClassifier`, som pickle-filen trenger for å laste modellen.

## API

| Endepunkt | Beskrivelse |
|---|---|
| `GET /predict` | Tar 31 features som query-parametere og en valgfri `threshold`. Returnerer `xG_probability`, `threshold` og `prediction` (1 hvis xG er over terskelen). |
| `GET /options` | Lag, posisjoner og andre kategorier slik modellen så dem under trening. |
| `GET /results` | Testresultater, tabell over terskler og kurvene (ROC, precision-recall, kalibrering). |
| `GET /importance` | Permutation importance, partial dependence og SHAP. |

Navnene på de 31 featurene står i `feature_names` i `football_prediction_backend.py`.

## Prosjektstruktur

```
.
├── football_prediction_backend.py   Flask-API
├── footballPredictionBestModel.ipynb  Trening, kalibrering, evaluering
├── GB_XG_model.pickle               Trent og kalibrert modell
├── model_results.json               Resultater og importance, lest av API-et
├── requirements.txt
├── data/XG_Features.csv             Skuddene modellen er trent på
├── xg-frontend/                     React-appen (Vite)
└── docs/demo.gif
```

## Bruk og begrensninger

- **Bruk xG som sum, ikke som ja/nei for ett skudd.** Utfallet av ett skudd er alltid usikkert. Verdien ligger i summen over mange skudd, for eksempel de siste 5–10 kampene. Terskelen finnes bare for ja/nei-visningen i appen.
- **Bare for Barcelona.** Alle kampene har Barcelona med, så modellen bør ikke brukes på andre lag eller ligaer uten ny validering. For motstanderne er summen av xG på testsettet ca. 15 % for høy, men det er usikkert siden det bare er 96 mål.
- **Testsettet er ikke ekstern validering.** Det er nye kamper, men fra samme kilde og med samme lag.
- **Terskelen er et verdivalg.** Ved 0,25 er 64 % av de flaggede skuddene falske alarmer, men modellen fanger 51 % av målene. Brukeren kan flytte terskelen.
- **Lagsammenligninger er ikke testet.** Testene måler skuddene og ikke om summene treffer på kampresultater.

## Data

Dataene er basert på hendelsesdata fra StatsBomb. Sjekk StatsBombs vilkår før du deler dataene videre.
