// 10 x 10 prikker: hvor mange av 100 like skudd som ville endt som mål.
// Prikkene fylles nedenfra og opp.
const rows = Array.from({ length: 10 }, (_, r) => r)
const cols = Array.from({ length: 10 }, (_, c) => c)

export default function Result({ result, status, error, threshold, row }) {
  const probability = result ? result.xG_probability : null
  const goals = probability === null ? 0 : Math.round(probability * 100)
  const busy = status === 'loading'

  return (
    <section className="result" aria-labelledby="result-heading" aria-busy={busy}>
      <h2 id="result-heading">Sjansen for mål</h2>

      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}

      <div className={`result-body${busy || error ? ' is-stale' : ''}`}>
        <div className="waffle" role="img" aria-label={probability === null ? 'Ingen prediksjon ennå' : `${goals} av 100 skudd blir mål`}>
          {rows.map((r) =>
            cols.map((c) => {
              const index = (9 - r) * 10 + c
              return <span key={`${r}-${c}`} className={index < goals ? 'dot is-goal' : 'dot'} />
            }),
          )}
        </div>

        <div className="result-text" aria-live="polite">
          <p className="xg-number">{probability === null ? '–' : probability.toFixed(2)}</p>
          <p className="xg-explain">
            {probability === null
              ? 'Venter på svar fra modellen.'
              : `Av 100 slike skudd blir omtrent ${goals} mål.`}
          </p>
          {result && (
            <p className="verdict">
              {result.prediction === 1
                ? `Modellen sier: JA (xG over ${threshold.toFixed(2)})`
                : `Modellen sier: NEI (xG under ${threshold.toFixed(2)})`}
            </p>
          )}
          {row && (
            <p className="xg-explain">
              Med denne terskelen sier modellen JA til {Math.round(row.recall * 100)} av 100 faktiske mål, og{' '}
              {Math.round(row.precision * 100)} av 100 JA-svar blir faktisk mål.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
