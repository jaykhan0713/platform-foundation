import http from 'k6/http'
import encoding from 'k6/encoding'
import { check, fail, sleep } from 'k6'
import { uuidv4 } from '../vendor/k6-utils/index.js'

const VUS = __ENV.VIRTUAL_USERS
    ? Number(__ENV.VIRTUAL_USERS)
    : 1

const DURATION = __ENV.DURATION || '10s'

export const options = {
    vus: VUS,
    duration: DURATION
}

const SLEEP_INTERVAL = __ENV.SLEEP_INTERVAL
    ? Number(__ENV.SLEEP_INTERVAL)
    : 0

const userId = uuidv4()

let cachedToken = null
let tokenExpiresAtMs = 0
const apiUrl = __ENV.API_URL

if (!apiUrl) {
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
    const experimentId = Math.floor(Math.random() * 10) + 1
    const url = apiUrl + `api/v1/experiments/${experimentId}`

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

    if (SLEEP_INTERVAL > 0) {
        sleep(SLEEP_INTERVAL)
    }
    // sleep seconds to avoid spamming

}