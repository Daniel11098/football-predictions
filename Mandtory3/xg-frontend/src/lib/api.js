// Vite sender /api videre til Flask på port 5000 (se vite.config.js).
const BASE = '/api'

export class ApiError extends Error {}

export async function fetchOptions() {
  const res = await fetch(`${BASE}/options`)
  if (!res.ok) throw new ApiError(`options ${res.status}`)
  return res.json()
}

export async function fetchResults() {
  const res = await fetch(`${BASE}/results`)
  if (!res.ok) throw new ApiError(`results ${res.status}`)
  return res.json()
}

// 404 betyr at importance-dataene ikke er lagt inn i model_results.json ennå.
export async function fetchImportance() {
  const res = await fetch(`${BASE}/importance`)
  if (res.status === 404) return null
  if (!res.ok) throw new ApiError(`importance ${res.status}`)
  return res.json()
}

function messageFrom(body, status) {
  if (body && body.message) {
    if (typeof body.message === 'string') return body.message
    return Object.entries(body.message)
      .map(([key, text]) => `${key}: ${text}`)
      .join(', ')
  }
  return `API-et svarte med feil ${status}. Sjekk at Flask kjører på port 5000, og se etter feilmeldingen i terminalen der.`
}

export async function predict(params, signal) {
  const query = new URLSearchParams(params).toString()
  let res
  try {
    res = await fetch(`${BASE}/predict?${query}`, { signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Får ikke kontakt med API-et. Start Flask med python football_prediction_backend.py.')
  }

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  if (!res.ok) throw new ApiError(messageFrom(body, res.status))
  return body
}
