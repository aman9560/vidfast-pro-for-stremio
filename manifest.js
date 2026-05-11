module.exports = {
  id: 'org.vidfast.pro',
  version: '1.0.0',
  name: 'VidFast Pro',
  description: 'Stremio addon that exposes VidFast movie and series metadata + streams.',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'series'],
  idPrefixes: ['vf:', 'tt'],
  catalogs: [
    {
      type: 'movie',
      id: 'vidfast_movies',
      name: 'VidFast Movies',
      extra: [{ name: 'search', isRequired: false }, { name: 'skip' }]
    },
    {
      type: 'series',
      id: 'vidfast_series',
      name: 'VidFast TV Shows',
      extra: [{ name: 'search', isRequired: false }, { name: 'skip' }]
    }
  ],
  behaviorHints: {
    configurable: false,
    adult: false
  }
}
