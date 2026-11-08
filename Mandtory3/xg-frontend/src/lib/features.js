// Koordinater som i datasettet: banen er 120 x 80, og målet vi skyter mot står
// på x = 120 med stolpene på y = 36 og y = 44. Formlene for avstand og vinkler
// er sjekket mot de fem første radene i XG_Features.csv (se test/check-features.mjs).
//
// Antagelser som IKKE er sjekket mot datasettet ditt:
//  - motstandere telles uten keeper
//  - grensene for avstandsgruppene er: <= 2,5 / > 2,5 til 5 / > 5 til 10
//  - skuddtrekanten er trekanten mellom skytter og de to stolpene

export const GOAL_X = 120
export const GOAL_Y = 40
export const POST_LO = 36
export const POST_HI = 44
export const MAX_OPPONENTS = 10

// Rekkefølgen er den samme som i feature_names i backend.
export const FEATURE_ORDER = [
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

export const BINARY_KEYS = [
  'under_pressure', 'shot_follows_dribble', 'shot_aerial_won',
  'shot_first_time', 'shot_one_on_one', 'shot_open_goal',
]

const toDeg = (rad) => (rad * 180) / Math.PI
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// Banen tegnes med målet øverst: skjerm-x = y og skjerm-y = 120 - x.
export const toScreen = (p) => ({ sx: p.y, sy: GOAL_X - p.x })
export const fromScreen = (sx, sy) => ({ x: GOAL_X - sy, y: sx })
export const clampPoint = (p) => ({
  x: Math.min(GOAL_X, Math.max(60, p.x)),
  y: Math.min(80, Math.max(0, p.y)),
})

export function shotGeometry(shooter, keeper) {
  const dx = GOAL_X - shooter.x
  const dy = GOAL_Y - shooter.y
  return {
    distance: Math.hypot(dx, dy),
    // vinkel mellom skuddlinjen mot målmidten og mållinjens normal
    angle: toDeg(Math.atan2(Math.abs(dy), dx)),
    // vinkelen målet spenner opp sett fra skytteren
    visual: toDeg(
      Math.abs(Math.atan2(POST_HI - shooter.y, dx) - Math.atan2(POST_LO - shooter.y, dx)),
    ),
    shooterToKeeper: dist(shooter, keeper),
    keeperToGoal: dist(keeper, { x: GOAL_X, y: GOAL_Y }),
  }
}

const side = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)

export function inShotTriangle(p, shooter) {
  const a = shooter
  const b = { x: GOAL_X, y: POST_LO }
  const c = { x: GOAL_X, y: POST_HI }
  const d1 = side(p, a, b)
  const d2 = side(p, b, c)
  const d3 = side(p, c, a)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

export function opponentFeatures(shooter, opponents) {
  const d = opponents.map((o) => dist(shooter, o))
  return {
    within25: d.filter((v) => v <= 2.5).length,
    from25to5: d.filter((v) => v > 2.5 && v <= 5).length,
    from5to10: d.filter((v) => v > 5 && v <= 10).length,
    nearest: d.length ? Math.min(...d) : null,
    inTriangle: opponents.filter((o) => inShotTriangle(o, shooter)).length,
  }
}

const num = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
const r4 = (v) => Number(v.toFixed(4))

// Bygger de 31 parameterne API-et forventer. Ja/nei sendes som 1/0.
// Uten motstandere finnes ingen nærmeste avstand: da sendes 'nan', og
// imputeren i pipelinen fyller inn medianen.
export function buildParams(form, shooter, keeper, opponents) {
  const g = shotGeometry(shooter, keeper)
  const o = opponentFeatures(shooter, opponents)
  const goalsFor = num(form.goals_for_before)
  const goalsAgainst = num(form.goals_against_before)

  const values = {
    team: form.team,
    position: form.position,
    shot_body_part: form.shot_body_part,
    shot_technique: form.shot_technique,
    shot_type: form.shot_type,
    under_pressure: form.under_pressure ? 1 : 0,
    shot_follows_dribble: form.shot_follows_dribble ? 1 : 0,
    shot_aerial_won: form.shot_aerial_won ? 1 : 0,
    shot_first_time: form.shot_first_time ? 1 : 0,
    shot_one_on_one: form.shot_one_on_one ? 1 : 0,
    shot_open_goal: form.shot_open_goal ? 1 : 0,
    minute: num(form.minute),
    location_x: r4(shooter.x),
    location_y: r4(shooter.y),
    keeper_x: r4(keeper.x),
    keeper_y: r4(keeper.y),
    shot_distance_from_goal: r4(g.distance),
    shot_angle: r4(g.angle),
    shot_angle_visual: r4(g.visual),
    distance_between_shooter_and_keeper: r4(g.shooterToKeeper),
    distance_between_keeper_and_goal: r4(g.keeperToGoal),
    opponents_within_2_5_yards: o.within25,
    opponents_2_5_to_5_yards: o.from25to5,
    opponents_5_to_10_yards: o.from5to10,
    distance_to_nearest_opponent: o.nearest === null ? 'nan' : r4(o.nearest),
    opponents_in_shot_triangle: o.inTriangle,
    goals_for_before: goalsFor,
    goals_against_before: goalsAgainst,
    score_diff_before: goalsFor - goalsAgainst,
    player_goal_rate_before: num(form.player_goal_rate_before),
    shots_before: num(form.shots_before),
  }

  const ordered = {}
  for (const key of FEATURE_ORDER) ordered[key] = values[key]
  return ordered
}
