const { addonBuilder, serveHTTP } = require("stremio-addon-sdk")
const manifest = require("./manifest")

const builder = new addonBuilder(manifest)

builder.defineStreamHandler(({ type, id }) => {

    let streams = []

    // =========================
    // MOVIES
    // =========================

    if (type === "movie") {

        streams.push({
            name: "Videasy",
            title: "Watch on Videasy",
            externalUrl: `https://videasy.net/movie/${id}`
        })
    }

    // =========================
    // SERIES
    // =========================

    if (type === "series") {

        const parts = id.split(":")
        const imdb = parts[0]
        const season = parts[1]
        const episode = parts[2]

        streams.push({
            name: "Videasy",
            title: `Videasy S${season}E${episode}`,
            externalUrl: `https://videasy.net/tv/${imdb}/${season}/${episode}`
        })
    }

    return Promise.resolve({ streams })
})

const addonInterface = builder.getInterface()

console.log("Starting Stremio addon...")

serveHTTP(addonInterface, {
    port: Number(process.env.PORT) || 7000
})

console.log("HTTP server started")
console.log(`Manifest URL: http://127.0.0.1:${Number(process.env.PORT) || 7000}/manifest.json`)
