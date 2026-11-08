# xG-kalkulator (React)

Frontend til xG-modellen din. Du klikker et skudd inn på en bane, og siden kaller `/predict` i Flask-backenden din og viser sjansen for mål.

## Kjør det

Du trenger to terminaler.

**1. Backend** (som før, fra mappen med pickle-filen):

```
python football_prediction_backend.py
```

**2. Frontend** (fra denne mappen):

```
npm install
npm run dev
```

Åpne adressen Vite skriver ut, vanligvis http://localhost:5173.

Vite sender alle kall som starter med `/api` videre til Flask på port 5000, så du trenger ikke CORS i backend.

## Valgfritt, men anbefalt: /options i backend

Uten dette må lagnavn skrives inn for hånd. Legg dette i backend-filen, under `GetPrediction` og før `api.add_resource`-linjene:

```python
class GetOptions(Resource):
    def get(self):
        pipe = model.estimator.estimator   # ThresholdClassifier -> FrozenEstimator -> Pipeline
        ct = pipe.named_steps["transformer"]
        options = {}
        for name, enc, cols in ct.transformers_:
            if name == "cat":
                for col, cats in zip(cols, enc.categories_):
                    options[col] = [str(c) for c in cats]
        return options

api.add_resource(GetOptions, '/options')
```

Den leser kategoriene ut av `OneHotEncoder` i pipelinen din, så nedtrekkslistene har akkurat de verdiene modellen kjenner.

## Hva frontend regner ut selv

Fra skytter- og keeperposisjonen på banen:
avstand til mål, skuddvinkel, synlig mål, avstand skytter–keeper, keeper–mål, og alt som handler om motstandere.
Formlene for de fem første er sjekket mot de fem første radene i datasettet ditt (`npm test`).

Tre antagelser er IKKE sjekket mot datasettet, og du bør sjekke dem før du bruker dem i innleveringen:

- motstandere telles uten keeper
- grensene er innen 2,5 / over 2,5 til 5 / over 5 til 10 yard
- skuddtrekanten er trekanten mellom skytteren og de to stolpene

`player_goal_rate_before` og `shots_before` legges inn for hånd. Bruk samme definisjon som i datasettet ditt.

## Filer

- `src/lib/features.js`: utregninger og bygging av de 31 parameterne
- `src/lib/api.js`: kall til Flask
- `src/components/Pitch.jsx`: banen (SVG) med dra og slipp
- `src/components/Result.jsx`: resultatet med 100 prikker
- `src/components/ShotForm.jsx`: skjemaet
