/*
 * VidFast Pro Stremio Addon
 *
 * Setup:
 * 1) npm i stremio-addon-sdk node-fetch@2
 * 2) export VIDFAST_API_BASE="https://vidfast.pro/api"
 * 3) optional: export VIDFAST_API_KEY="your-token"
 * 4) node addon.js
 * 5) Install in Stremio: http://127.0.0.1:7000/manifest.json
 */

const fetch = require('node-fetch')
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk')
const manifest = require('./manifest')

const API_BASE = process.env.VIDFAST_API_BASE || 'https://vidfast.pro/api'
const API_KEY = process.env.VIDFAST_API_KEY || ''
const API_TIMEOUT_MS = Number(process.env.VIDFAST_TIMEOUT_MS || 10000)

const builder = new addonBuilder(manifest)

function normalizeId(id) {
  if (!id) return ''
  return String(id).replace(/^vf:/, '')
}

async function apiGet(path, params = {}) {
  const url = new URL(path, API_BASE)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })

  const headers = { Accept: 'application/json' }
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), { headers, signal: controller.signal })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`VidFast API ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

function toMeta(type, item) {
  const id = String(item.id || item.tmdbId || item.imdbId || item.slug)
  return {
    id: `vf:${id}`,
    type,
    name: item.title || item.name || 'Untitled',
    poster: item.poster || item.posterUrl || item.image,
    background: item.backdrop || item.backdropUrl,
    description: item.overview || item.description || '',
    releaseInfo: String(item.year || item.releaseDate || '').slice(0, 10),
    genres: item.genres || []
  }
}

builder.defineCatalogHandler(async ({ type, id, extra = {} }) => {
  if (!['vidfast_movies', 'vidfast_series'].includes(id)) return { metas: [] }

  const endpoint = type === 'movie' ? '/movies' : '/tv'
  const page = Math.floor((Number(extra.skip) || 0) / 50) + 1
  const data = await apiGet(endpoint, { search: extra.search || '', page, limit: 50 })

  const items = data.items || data.results || data.data || []
  return { metas: items.map((item) => toMeta(type, item)) }
})

builder.defineMetaHandler(async ({ type, id }) => {
  const vidfastId = normalizeId(id)
  const endpoint = type === 'movie' ? `/movies/${vidfastId}` : `/tv/${vidfastId}`
  const data = await apiGet(endpoint)

  const payload = data.item || data.result || data.data || data
  const meta = toMeta(type, payload)

  if (type === 'series') {
    const episodes = payload.episodes || []
    meta.videos = episodes.map((ep) => ({
      id: `vf:${vidfastId}:${ep.id || `${ep.season}-${ep.episode}`}`,
      title: ep.title || `S${ep.season}E${ep.episode}`,
      season: Number(ep.season),
      episode: Number(ep.episode),
      released: ep.airDate || ep.released,
      thumbnail: ep.still || ep.thumbnail
    }))
  }

  return { meta }
})

builder.defineStreamHandler(async ({ type, id }) => {
  const raw = normalizeId(id)
  const [baseId, episodeId] = raw.split(':')

  let endpoint
  if (type === 'movie') {
    endpoint = `/movies/${baseId}/streams`
  } else {
    endpoint = `/tv/${baseId}/episodes/${episodeId || ''}/streams`
  }

  const data = await apiGet(endpoint)
  const sources = data.streams || data.sources || data.data || []

  const streams = sources
    .filter((s) => s.url || s.magnet || s.infoHash)
    .map((s) => ({
      name: `VidFast${s.quality ? ` ${s.quality}` : ''}`,
      title: [s.language, s.codec, s.size].filter(Boolean).join(' • '),
      url: s.url,
      ytId: s.ytId,
      infoHash: s.infoHash,
      fileIdx: s.fileIdx,
      behaviorHints: {
        notWebReady: Boolean(s.infoHash && !s.url),
        bingeGroup: `vf-${baseId}`
      }
    }))

  return { streams }
})

const addonInterface = builder.getInterface()

console.log('Starting Stremio addon...')

serveHTTP(addonInterface, {
  port: Number(process.env.PORT) || 7000
})

console.log('HTTP server started')
console.log(`Manifest URL: http://127.0.0.1:${Number(process.env.PORT) || 7000}/manifest.json`)
