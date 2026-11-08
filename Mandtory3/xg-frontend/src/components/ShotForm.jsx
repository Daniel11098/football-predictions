import { TOGGLES, labelFor } from '../lib/constants.js'

function Select({ id, label, group, value, values, onChange }) {
  const list = values.includes(value) || value === '' ? values : [value, ...values]
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {list.map((v) => (
          <option key={v} value={v}>
            {labelFor(group, v)}
          </option>
        ))}
      </select>
    </div>
  )
}

function NumberField({ id, label, value, onChange, min = 0, max, step = 1 }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </div>
  )
}

export default function ShotForm({ form, options, usingFallback, onField }) {
  const set = (key) => (value) => onField(key, value)
  const scoreDiff = (Number(form.goals_for_before) || 0) - (Number(form.goals_against_before) || 0)

  return (
    <div className="form-block">
      <section className="section" aria-labelledby="shot-heading">
        <h2 id="shot-heading">Skuddet</h2>

        {usingFallback && (
          <p className="notice notice-soft">
            Fant ikke /options i backend, så lagnavn må skrives inn for hånd og må stå akkurat som i datasettet.
            Legg til /options (se README) for å få lister fra modellen.
          </p>
        )}

        <div className="grid">
          {options.team.length ? (
            <Select id="team" label="Lag" group="team" value={form.team} values={options.team} onChange={set('team')} />
          ) : (
            <div className="field">
              <label htmlFor="team">Lag</label>
              <input id="team" type="text" value={form.team} placeholder="Barcelona" onChange={(e) => set('team')(e.target.value)} />
            </div>
          )}
          <Select id="position" label="Posisjon" group="position" value={form.position} values={options.position} onChange={set('position')} />
          <Select id="body" label="Kroppsdel" group="shot_body_part" value={form.shot_body_part} values={options.shot_body_part} onChange={set('shot_body_part')} />
          <Select id="technique" label="Teknikk" group="shot_technique" value={form.shot_technique} values={options.shot_technique} onChange={set('shot_technique')} />
          <Select id="type" label="Skuddtype" group="shot_type" value={form.shot_type} values={options.shot_type} onChange={set('shot_type')} />
        </div>

        <fieldset className="toggles">
          <legend>Situasjon i skuddet</legend>
          {TOGGLES.map(([key, label]) => (
            <label key={key} className="toggle">
              <input type="checkbox" checked={form[key]} onChange={(e) => onField(key, e.target.checked)} />
              <span className="toggle-box" aria-hidden="true" />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="section" aria-labelledby="game-heading">
        <h2 id="game-heading">Kampen</h2>

        <div className="field field-range">
          <label htmlFor="minute">
            Minutt <output htmlFor="minute">{form.minute}</output>
          </label>
          <input
            id="minute"
            type="range"
            min="0"
            max="120"
            value={form.minute}
            onChange={(e) => set('minute')(Number(e.target.value))}
          />
        </div>

        <div className="grid">
          <NumberField id="gf" label="Mål for laget før skuddet" value={form.goals_for_before} onChange={set('goals_for_before')} />
          <NumberField id="ga" label="Mål mot laget før skuddet" value={form.goals_against_before} onChange={set('goals_against_before')} />
          <NumberField id="rate" label="Spillerens målrate før" value={form.player_goal_rate_before} step={0.01} max={1} onChange={set('player_goal_rate_before')} />
          <NumberField id="shots" label="Spillerens skudd før" value={form.shots_before} onChange={set('shots_before')} />
        </div>
        <p className="hint">
          Målforskjell: {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}. Regnes ut av målene over.
        </p>
      </section>
    </div>
  )
}
