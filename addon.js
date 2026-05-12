const { addonBuilder, serveHTTP } = require("stremio-addon-sdk")
const manifest = require("./manifest")

const builder = new addonBuilder(manifest)

// =====================================
// STREAM HANDLER
// =====================================

builder.defineStreamHandler(({ type, id }) => {

    let streams = []

    // =========================
    // MOVIES
    // =========================

    if (type === "movie") {

        streams.push({
            name: "VidFast",
            title: "▶ Watch on VidFast",

            externalUrl:
                `https://vidfast.pro/movie/${id}?autoPlay=true`
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
            name: "VidFast",

            title:
                `▶ VidFast S${season}E${episode}`,

            externalUrl:
                `https://vidfast.pro/tv/${imdb}/${season}/${episode}?autoPlay=true&nextButton=true`
        })
    }

    return Promise.resolve({ streams })
})

// =====================================
// START SERVER
// =====================================

const addonInterface = builder.getInterface()

console.log("Starting VidFast addon...")

serveHTTP(addonInterface, {
    port: Number(process.env.PORT) || 7000
})

console.log("VidFast addon running")
console.log(
    `Manifest URL: http://127.0.0.1:${Number(process.env.PORT) || 7000}/manifest.json`
)
