// Sjekker formlene mot de første radene i XG_Features.csv (tall fra xg_df.head() i notatboken).
import assert from 'node:assert/strict'
import { shotGeometry, buildParams, FEATURE_ORDER, inShotTriangle } from '../src/lib/features.js'

const near = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 1e-4, `${label}: fikk ${actual}, forventet ${expected}`)

const rows = [
  { shooter: { x: 108.6, y: 28.0 }, keeper: { x: 114.5, y: 33.8 }, distance: 16.551737, angle: 46.468801, visual: 19.470701, sk: 8.273452, kg: 8.287943 },
  { shooter: { x: 103.6, y: 51.0 }, keeper: { x: 116.3, y: 41.8 }, distance: 19.747405, angle: 33.85101, visual: 19.332894 },
  { shooter: { x: 104.3, y: 33.9 }, keeper: { x: 118.5, y: 37.8 }, distance: 16.843396, angle: 21.232892, visual: 25.135121 },
  { shooter: { x: 97.9, y: 44.3 }, keeper: { x: 119.6, y: 40.0 }, distance: 22.51444, angle: 11.01048, visual: 19.806729 },
  { shooter: { x: 118.3, y: 42.1 }, keeper: { x: 110.3, y: 44.3 }, distance: 2.701851, angle: 51.009006, visual: 122.607287 },
]

rows.forEach((row, i) => {
  const g = shotGeometry(row.shooter, row.keeper)
  near(g.distance, row.distance, `rad ${i} avstand`)
  near(g.angle, row.angle, `rad ${i} skuddvinkel`)
  near(g.visual, row.visual, `rad ${i} synlig mål`)
  if (row.sk) near(g.shooterToKeeper, row.sk, `rad ${i} skytter-keeper`)
  if (row.kg) near(g.keeperToGoal, row.kg, `rad ${i} keeper-mål`)
})

// Skuddtrekant: en spiller rett mellom skytter og mål er inni, en på siden er utenfor.
const shooter = { x: 100, y: 40 }
assert.equal(inShotTriangle({ x: 110, y: 40 }, shooter), true)
assert.equal(inShotTriangle({ x: 110, y: 60 }, shooter), false)

// Parametrene har riktig rekkefølge og antall.
const form = {
  team: 'Barcelona', position: 'Left Wing', shot_body_part: 'Right Foot', shot_technique: 'Normal', shot_type: 'Open Play',
  under_pressure: true, shot_follows_dribble: false, shot_aerial_won: false, shot_first_time: false, shot_one_on_one: true, shot_open_goal: false,
  minute: 12, goals_for_before: 1, goals_against_before: 0, player_goal_rate_before: 0.1, shots_before: 2,
}
const params = buildParams(form, rows[0].shooter, rows[0].keeper, [])
assert.deepEqual(Object.keys(params), FEATURE_ORDER)
assert.equal(FEATURE_ORDER.length, 31)
assert.equal(params.distance_to_nearest_opponent, 'nan')
assert.equal(params.score_diff_before, 1)
assert.equal(params.under_pressure, 1)

console.log('Alle sjekker OK')
