import { Bee, NULL_TOPIC, PrivateKey } from '@ethersphere/bee-js'
import { Dates, Numbers, Strings, System } from 'cafe-utility'

const startedAt = Date.now()
const postageBatch = 'b961413232c96eedae48947a71c99e454e51c4b5bf93a77c59f958af1229a932'
const privateKey = new PrivateKey(Strings.randomHex(64))
const address = privateKey.publicKey().address()
const limoBee = new Bee('https://bzz.limo')
const gatewayBee = new Bee('https://api.gateway.ethswarm.org')
const localBee = new Bee('http://localhost:1633')
const generator = Numbers.createSequence()
const feedWriter = localBee.makeFeedWriter(NULL_TOPIC, privateKey)

main()

async function main() {
    const manifest = await localBee.createFeedManifest(postageBatch, NULL_TOPIC, privateKey.publicKey().address())
    console.log('Manifest:', manifest.represent())

    System.forever(
        async () => {
            const data = `Update number ${generator.next()}`
            await feedWriter.uploadPayload(postageBatch, data, { deferred: false })
            print(`WROTE: ${data}`)
        },
        Dates.seconds(10),
        console.error
    )

    await System.sleepMillis(Dates.seconds(5))

    System.forever(
        async () => {
            const payload = await fetchFeedViaFeedEndpoint(limoBee)
            print(`READ /feeds bzz.limo: ${payload}`)
        },
        Dates.seconds(10),
        console.error
    )

    System.forever(
        async () => {
            const payload = await fetchFeedViaFeedEndpoint(gatewayBee)
            print(`READ /feeds gateway.ethswarm.org: ${payload}`)
        },
        Dates.seconds(10),
        console.error
    )
}

async function fetchFeedViaFeedEndpoint(bee: Bee): Promise<string> {
    const reader = bee.makeFeedReader(NULL_TOPIC, address, { timeout: Dates.seconds(10) })
    const data = await reader.downloadPayload()
    return data.payload.toUtf8()
}

function print(message: string) {
    const delta = Date.now() - startedAt
    console.log(`${(delta / 1000).toFixed(1)}s | ${message}`)
}
