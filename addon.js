const { addonBuilder, serveHTTP } = require("stremio-addon-sdk")
const manifest = require("./manifest")

const builder = new addonBuilder(manifest)

builder.defineStreamHandler(({ type, id }) => {

    let streams = []

    if (type === "movie") {

        streams.push({
            name: "VidFast",
            title: "Watch on VidFast",
            externalUrl: `https://vidfast.pro/movie/${id}`
        })
    }

    if (type === "series") {

        const parts = id.split(":")
        const imdb = parts[0]
        const season = parts[1]
        const episode = parts[2]

        streams.push({
            name: "VidFast",
            title: `VidFast S${season}E${episode}`,
            externalUrl: `https://vidfast.pro/tv/${imdb}/${season}/${episode}`
        })
    }

    return Promise.resolve({ streams })
})

const addonInterface = builder.getInterface()

serveHTTP(addonInterface, {
    port: Number(process.env.PORT) || 7000
})
