import { useEffect, useState } from 'react'
import { fetchImportance } from '../lib/api.js'

const TABS = [
  ['permutation', 'Permutation importance'],
  ['shap', 'SHAP'],
  ['pdp', 'Partial dependence'],
]
const TOP = 12
const nice = (name) => name.replaceAll('_', ' ')

function Bars({ rows, keys }) {
  const max = Math.max(...rows.flatMap((r) => keys.map(([k]) => r[k])), 1e-9)
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.feature}>
          <span className="bar-label">{nice(r.feature)}</span>
          <span className="bar-tracks">
            {keys.map(([k, , color]) => (
              <span
                key={k}
                className="bar"
                style={{ width: `${Math.max(0, (r[k] / max) * 100)}%`, background: color }}
                title={r[k].toFixed(4)}
              />
            ))}
          </span>
          <span className="bar-value">{r[keys[0][0]].toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

function Pdp({ feature, curve, marker }) {
  const W = 300
  const H = 170
  const P = { l: 36, r: 8, t: 8, b: 24 }
  const xs = curve.x
  const ys = curve.y
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  const sx = (v) => P.l + ((v - x0) / (x1 - x0 || 1)) * (W - P.l - P.r)
  const sy = (v) => P.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - P.t - P.b)
  const showMarker = Number.isFinite(marker) && marker >= x0 && marker <= x1

  return (
    <figure className="pdp">
      <figcaption>{nice(feature)}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Partial dependence for ${nice(feature)}`}>
        <line x1={P.l} x2={P.l} y1={P.t} y2={H - P.b} stroke="#c3ccc4" />
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="#c3ccc4" />
        <text x={P.l - 4} y={P.t + 8} textAnchor="end" fontSize="10" fill="#55645c">{y1.toFixed(2)}</text>
        <text x={P.l - 4} y={H - P.b} textAnchor="end" fontSize="10" fill="#55645c">{y0.toFixed(2)}</text>
        <text x={P.l} y={H - 8} fontSize="10" fill="#55645c">{x0.toFixed(1)}</text>
        <text x={W - P.r} y={H - 8} textAnchor="end" fontSize="10" fill="#55645c">{x1.toFixed(1)}</text>
        <polyline fill="none" stroke="#1d4a37" strokeWidth="2.5" points={xs.map((v, i) => `${sx(v)},${sy(ys[i])}`).join(' ')} />
        {showMarker && <line x1={sx(marker)} x2={sx(marker)} y1={P.t} y2={H - P.b} stroke="#e5584b" strokeWidth="2" strokeDasharray="4 3" />}
      </svg>
    </figure>
  )
}

export default function Importance({ shotParams }) {
  const [data, setData] = useState(undefined) // undefined = laster, null = mangler
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('permutation')

  useEffect(() => {
    fetchImportance().then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <section className="panel" aria-labelledby="importance-heading">
      <h2 id="importance-heading">Hva påvirker modellen?</h2>

      {error && <p className="notice" role="alert">{error}</p>}
      {data === null && (
        <p className="notice" role="alert">
          Ingen importance-data ennå. Kjør cellen i notebooken som legger dem inn i model_results.json, og start Flask på nytt.
        </p>
      )}

      {data && (
        <>
          <div className="segmented" role="group" aria-label="Metode">
            {TABS.map(([key, label]) => (
              <button key={key} type="button" className="seg" aria-pressed={tab === key} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'permutation' && (
            <>
              <p className="panel-text">
                Hvor mye ROC-AUC faller når en feature stokkes. Større fall betyr at modellen bruker den mer.
              </p>
              <ul className="legend">
                <li><span className="swatch" style={{ background: '#1d4a37' }} />Treningsdata</li>
                <li><span className="swatch" style={{ background: '#f5b83d' }} />Testdata</li>
              </ul>
              <Bars
                rows={data.permutation.slice(0, TOP)}
                keys={[['trainval_mean', 'Trening', '#1d4a37'], ['test_mean', 'Test', '#f5b83d']]}
              />
            </>
          )}

          {tab === 'shap' && (
            <>
              <p className="panel-text">
                Gjennomsnittlig størrelse på SHAP-verdien per feature (før kalibrering, i log-odds). Kategorier er slått sammen per opprinnelige feature.
              </p>
              <Bars rows={data.shap.slice(0, TOP)} keys={[['mean_abs', 'SHAP', '#1d4a37']]} />
            </>
          )}

          {tab === 'pdp' && (
            <>
              <p className="panel-text">
                Gjennomsnittlig xG når bare denne featuren endres. Den røde streken er verdien i skuddet ditt.
              </p>
              <div className="pdp-grid">
                {Object.entries(data.pdp).map(([feature, curve]) => (
                  <Pdp key={feature} feature={feature} curve={curve} marker={Number(shotParams[feature])} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
