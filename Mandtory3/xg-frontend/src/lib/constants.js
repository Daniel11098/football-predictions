// Brukes bare hvis backend ikke har /options. Da kan lagnavn ikke velges fra
// en liste, og verdiene her må stemme med det modellen ble trent på.
export const FALLBACK_OPTIONS = {
  team: [],
  position: [
    'Center Forward', 'Left Center Forward', 'Right Center Forward', 'Striker', 'Secondary Striker',
    'Left Wing', 'Right Wing', 'Left Attacking Midfield', 'Center Attacking Midfield',
    'Right Attacking Midfield', 'Left Midfield', 'Center Midfield', 'Right Midfield',
    'Left Center Midfield', 'Right Center Midfield', 'Left Defensive Midfield',
    'Center Defensive Midfield', 'Right Defensive Midfield', 'Left Wing Back', 'Right Wing Back',
    'Left Back', 'Right Back', 'Left Center Back', 'Center Back', 'Right Center Back',
  ],
  shot_body_part: ['Right Foot', 'Left Foot', 'Head', 'Other'],
  shot_technique: ['Normal', 'Volley', 'Half Volley', 'Lob', 'Overhead Kick', 'Backheel', 'Diving Header'],
  shot_type: ['Open Play', 'Free Kick', 'Penalty', 'Corner'],
}

// Visningsnavn. Verdien som sendes til modellen er alltid den engelske.
const LABELS = {
  shot_body_part: {
    'Right Foot': 'Høyre fot',
    'Left Foot': 'Venstre fot',
    Head: 'Hode',
    Other: 'Annet',
  },
  shot_technique: {
    Normal: 'Vanlig',
    Volley: 'Volley',
    'Half Volley': 'Halvvolley',
    Lob: 'Lobb',
    'Overhead Kick': 'Saksespark',
    Backheel: 'Hælspark',
    'Diving Header': 'Stupheading',
  },
  shot_type: {
    'Open Play': 'Åpent spill',
    'Free Kick': 'Frispark',
    Penalty: 'Straffe',
    Corner: 'Corner',
  },
}

export const labelFor = (group, value) => LABELS[group]?.[value] ?? value

export const DEFAULT_FORM = {
  team: '',
  position: 'Center Forward',
  shot_body_part: 'Right Foot',
  shot_technique: 'Normal',
  shot_type: 'Open Play',
  under_pressure: false,
  shot_follows_dribble: false,
  shot_aerial_won: false,
  shot_first_time: false,
  shot_one_on_one: false,
  shot_open_goal: false,
  minute: 45,
  goals_for_before: 0,
  goals_against_before: 0,
  player_goal_rate_before: 0.1,
  shots_before: 0,
}

export const TOGGLES = [
  ['under_pressure', 'Under press'],
  ['shot_first_time', 'Førstegangsskudd'],
  ['shot_follows_dribble', 'Etter dribling'],
  ['shot_aerial_won', 'Etter vunnet luftduell'],
  ['shot_one_on_one', 'En mot en med keeper'],
  ['shot_open_goal', 'Åpent mål'],
]
