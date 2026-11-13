import { useState } from 'react'

const W = 600
const H = 260
const PAD = { l: 40, r: 12, t: 12, b: 30 }
const T_MIN = 0.05
const T_MAX = 0.8

const x = (t) => PAD.l + ((t - T_MIN) / (T_MAX - T_MIN)) * (W - PAD.l - PAD.r)
const y = (v) => PAD.t + (1 - v) * (H - PAD.t - PAD.b)

const LINES = [
  ['precision', 'Precision', '#e5584b', ''],
  ['recall', 'Recall', '#2a7fb8', '6 4'],
  ['f1', 'F1', '#1d4a37', ''],
]

const SETS = [
  ['test', 'Testdata'],
  ['trainval_oof', 'Trening (out-of-fold)'],
]

export default function ThresholdPanel({ results, threshold, onThreshold }) {
  const [set, setSet] = useState('test')

  if (!results) return null
  const rows = results.threshold_table[set]
  const row = rows.find((r) => Math.abs(r.threshold - threshold) < 0.005)
  const m = results.test_metrics

  return (
    <section className="panel" aria-labelledby="threshold-heading">
      <h2 id="threshold-heading">Terskel</h2>
      <p className="panel-text">
        xG er sannsynligheten for mål. Terskelen avgjør bare når modellen kaller et skudd «over terskelen».
        Lav terskel fanger flere mål (høy recall) men flere falske alarmer (lav precision).
      </p>

      <label className="slider" htmlFor="threshold">
        <span>Terskel: <strong>{threshold.toFixed(2)}</strong></span>
        <input
          id="threshold"
          type="range"
          min={T_MIN}
          max={T_MAX}
          step="0.01"
          value={threshold}
          onChange={(e) => onThreshold(Number(e.target.value))}
        />
      </label>

      <div className="segmented" role="group" aria-label="Datasett for kurvene">
        {SETS.map(([key, label]) => (
          <button key={key} type="button" className="seg" aria-pressed={set === key} onClick={() => setSet(key)}>
            {label}
          </button>
        ))}
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Precision, recall og F1 mot terskel">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#c3ccc4" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#55645c">{v.toFixed(2)}</text>
          </g>
        ))}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((t) => (
          <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#55645c">{t.toFixed(1)}</text>
        ))}
        {LINES.map(([key, , color, dash]) => (
          <polyline
            key={key}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={dash}
            points={rows.map((r) => `${x(r.threshold)},${y(r[key])}`).join(' ')}
          />
        ))}
        <line x1={x(threshold)} x2={x(threshold)} y1={PAD.t} y2={H - PAD.b} stroke="#14201a" strokeWidth="1.5" />
      </svg>

      <ul className="legend">
        {LINES.map(([key, label, color, dash]) => (
          <li key={key}>
            <svg width="28" height="10" aria-hidden="true">
              <line x1="0" x2="28" y1="5" y2="5" stroke={color} strokeWidth="3" strokeDasharray={dash} />
            </svg>
            {label}
            {row && <strong> {row[key].toFixed(2)}</strong>}
          </li>
        ))}
        {row && <li>Flagget: <strong>{row.flagged}</strong> skudd, <strong>{row.true_positives}</strong> mål</li>}
      </ul>

      <h3>Testresultater</h3>
      <dl className="metrics">
        <div><dt>ROC-AUC</dt><dd>{m.roc_auc.toFixed(3)}</dd></div>
        <div><dt>Average precision</dt><dd>{m.average_precision.toFixed(3)}</dd></div>
        <div><dt>Brier</dt><dd>{m.brier.toFixed(3)}</dd></div>
        <div><dt>Log-loss</dt><dd>{m.log_loss.toFixed(3)}</dd></div>
        <div><dt>Predikerte mål</dt><dd>{m.predicted_goals.toFixed(0)}</dd></div>
        <div><dt>Faktiske mål</dt><dd>{m.actual_goals}</dd></div>
      </dl>
      <p className="panel-text">
        {results.meta.n_test} skudd i testsettet ({results.meta.test_seasons}), {results.meta.goals_test} mål.
      </p>
    </section>
  )
}
