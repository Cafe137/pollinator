import { Bee, NULL_TOPIC, PrivateKey } from '@ethersphere/bee-js'
import { Dates, Numbers, Strings, System } from 'cafe-utility'

const startedAt = Date.now()

main()

async function main() {
    const postageBatch = 'b961413232c96eedae48947a71c99e454e51c4b5bf93a77c59f958af1229a932'
    const privateKey = new PrivateKey(Strings.randomHex(64))

    const bee = new Bee('http://localhost:1633')
    const manifest = await bee.createFeedManifest(postageBatch, NULL_TOPIC, privateKey.publicKey().address())
    const feedWriter = bee.makeFeedWriter(NULL_TOPIC, privateKey)

    const generator = Numbers.createSequence()

    console.log('Manifest:', manifest.represent())

    System.forever(async () => {
        const data = `Update number ${generator.next()}`
        await feedWriter.uploadPayload(postageBatch, data, { deferred: false })
        print(`WROTE: ${data}`)
    }, Dates.seconds(10))

    System.forever(async () => {
        const bee = new Bee('https://bzz.limo')
        const reader = bee.makeFeedReader(NULL_TOPIC, privateKey.publicKey().address())
        const data = await reader.downloadPayload()
        print(`bzz.limo READ: ${data.payload.toUtf8()}`)
    }, Dates.seconds(10))

    System.forever(async () => {
        const bee = new Bee('https://api.gateway.ethswarm.org')
        const reader = bee.makeFeedReader(NULL_TOPIC, privateKey.publicKey().address())
        const data = await reader.downloadPayload()
        print(`gateway.ethswarm.org READ: ${data.payload.toUtf8()}`)
    }, Dates.seconds(10))
}

function print(message: string) {
    const delta = Date.now() - startedAt
    console.log(`${(delta / 1000).toFixed(1)}s | ${message}`)
}
