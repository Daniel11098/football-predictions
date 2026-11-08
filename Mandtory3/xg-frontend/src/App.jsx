import { useEffect, useMemo, useState } from 'react'
import Pitch from './components/Pitch.jsx'
import Result from './components/Result.jsx'
import Derived from './components/Derived.jsx'
import ShotForm from './components/ShotForm.jsx'
import { fetchOptions, predict } from './lib/api.js'
import { DEFAULT_FORM, FALLBACK_OPTIONS } from './lib/constants.js'
import { buildParams, opponentFeatures, shotGeometry } from './lib/features.js'

const TOOLS = [
  ['shooter', 'Skytter'],
  ['keeper', 'Keeper'],
  ['opponent', 'Motstander'],
]

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [options, setOptions] = useState(FALLBACK_OPTIONS)
  const [usingFallback, setUsingFallback] = useState(false)

  const [shooter, setShooter] = useState({ x: 106.5, y: 38.5 })
  const [keeper, setKeeper] = useState({ x: 118.6, y: 40 })
  const [opponents, setOpponents] = useState([
    { x: 111.5, y: 34 },
    { x: 109, y: 44.5 },
  ])
  const [tool, setTool] = useState('shooter')

  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  // Hent lister over lag, posisjoner osv. fra modellen. Finnes ikke /options, brukes standardlister.
  useEffect(() => {
    let cancelled = false
    fetchOptions()
      .then((fromModel) => {
        if (cancelled) return
        const merged = { ...FALLBACK_OPTIONS, ...fromModel }
        setOptions(merged)
        setUsingFallback(false)
        setForm((f) => {
          const next = { ...f }
          for (const key of Object.keys(FALLBACK_OPTIONS)) {
            const list = merged[key]
            if (list.length && !list.includes(next[key])) next[key] = list[0]
          }
          return next
        })
      })
      .catch(() => {
        if (!cancelled) setUsingFallback(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const geometry = useMemo(() => shotGeometry(shooter, keeper), [shooter, keeper])
  const opponentInfo = useMemo(() => opponentFeatures(shooter, opponents), [shooter, opponents])
  const params = useMemo(
    () => buildParams(form, shooter, keeper, opponents),
    [form, shooter, keeper, opponents],
  )

  // Kall API-et mens du drar og endrer. Ventetiden hindrer at hvert piksel blir et kall.
  useEffect(() => {
    if (!params.team) {
      setStatus('idle')
      setError('Skriv inn et lag for å få en prediksjon.')
      return undefined
    }
    const controller = new AbortController()
    setStatus('loading')
    const timer = setTimeout(async () => {
      try {
        const data = await predict(params, controller.signal)
        setResult(data)
        setError(null)
        setStatus('ok')
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message)
        setStatus('error')
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [params])

  return (
    <div className="app">
      <header className="masthead">
        <h1>xG-kalkulator</h1>
        <p>
          Plasser et skudd på banen. Modellen din regner ut sjansen for at det ender som mål.
        </p>
      </header>

      <main className="layout">
        <div className="board">
          <div className="pitch-block">
          <Pitch
            shooter={shooter}
            keeper={keeper}
            opponents={opponents}
            tool={tool}
            onShooter={setShooter}
            onKeeper={setKeeper}
            onOpponents={setOpponents}
          />

          <div className="tools">
            <div className="segmented" role="group" aria-label="Hva skal plasseres når du klikker på banen">
              {TOOLS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`seg seg-${key}`}
                  aria-pressed={tool === key}
                  onClick={() => setTool(key)}
                >
                  <span className="seg-dot" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="link-button"
              disabled={!opponents.length}
              onClick={() => setOpponents([])}
            >
              Fjern alle motstandere ({opponents.length})
            </button>
          </div>
          <p className="hint">
            Klikk på banen for å plassere. Dra for å flytte. Dobbeltklikk på en motstander fjerner den.
            Piltaster flytter en markør du har valgt med Tab.
          </p>
          </div>

          <Derived shooter={shooter} geometry={geometry} opponentInfo={opponentInfo} />
        </div>

        <div className="side">
          <Result result={result} status={status} error={error} />
          <ShotForm form={form} options={options} usingFallback={usingFallback} onField={onField} />
        </div>
      </main>

      <footer className="footer">
        Modellen er en gradient boosting-klassifiserer trent på La Liga-skudd. xG er sannsynligheten for mål.
      </footer>
    </div>
  )
}
