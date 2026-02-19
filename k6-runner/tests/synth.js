import http from 'k6/http'
import encoding from 'k6/encoding'
import { check, fail, sleep } from 'k6'
import { uuidv4 } from '../vendor/k6-utils/index.js'

export const options = {
    vus: 2,
    duration: '10s'
}

const userId = uuidv4()

let cachedToken = null
let tokenExpiresAtMs = 0
const targetUrl = __ENV.TARGET_URL
if (!targetUrl) {
    throw new Error('Missing target url')
}

function getAccessToken() {
    const refreshSkewMs = 30_000

    if (cachedToken && Date.now() + refreshSkewMs < tokenExpiresAtMs) {
        return cachedToken
    }

    const domain = __ENV.COGNITO_DOMAIN
    const clientId = __ENV.COGNITO_CLIENT_ID
    const clientSecret = __ENV.COGNITO_CLIENT_SECRET
    const scope = __ENV.COGNITO_SCOPE || ''

    if (!domain || !clientId || !clientSecret) {
        throw new Error('Missing required Cognito env vars')
    }

    const url = `${domain}/oauth2/token`

    const body = scope
        ? `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`
        : 'grant_type=client_credentials'

    const res = http.post(url, body, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization:
                'Basic ' + encoding.b64encode(`${clientId}:${clientSecret}`)
        }
    })

    if (res.status !== 200) {
        throw new Error(`Token request failed: ${res.status} ${res.body}`)
    }

    const json = res.json()
    if (!json?.access_token) {
        throw new Error(`Token response missing access_token: ${res.body}`)
    }
    cachedToken = json.access_token
    tokenExpiresAtMs = Date.now() + Number(json.expires_in) * 1000

    return cachedToken
}


export default function () {
    const id = Math.floor(Math.random() * 10) + 1
    const url = `${targetUrl}/${id}`

    const token = getAccessToken()

    const res = http.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'x-user-id': `${userId}`
        }
    })

    check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300
    })

    // sleep seconds to avoid spamming
    sleep(0.03)
}