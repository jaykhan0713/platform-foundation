import http from 'k6/http'
import encoding from 'k6/encoding'
import { check, sleep } from 'k6'

const VUS = __ENV.VIRTUAL_USERS ? Number(__ENV.VIRTUAL_USERS) : 10
const DURATION = __ENV.DURATION || '60s'

export const options = {
    vus: VUS,
    duration: DURATION
}

const SLEEP_INTERVAL = __ENV.SLEEP_INTERVAL ? Number(__ENV.SLEEP_INTERVAL) : 0

const apiUrl = __ENV.API_URL
if (!apiUrl) {
    throw new Error('Missing target url')
}

let cachedToken = null
let tokenExpiresAtMs = 0

function getAccessToken() {
    const refreshSkewMs = 30_000

    if (cachedToken && Date.now() + refreshSkewMs < tokenExpiresAtMs) {
        return cachedToken
    }

    const domainUrl = __ENV.COGNITO_DOMAIN_URL
    const clientId = __ENV.COGNITO_CLIENT_ID
    const clientSecret = __ENV.COGNITO_CLIENT_SECRET
    const scope = __ENV.COGNITO_SCOPE || ''

    if (!domainUrl || !clientId || !clientSecret) {
        throw new Error('Missing required Cognito env vars')
    }

    const res = http.post(
        `${domainUrl}/oauth2/token`,
        scope
            ? `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`
            : 'grant_type=client_credentials',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + encoding.b64encode(`${clientId}:${clientSecret}`)
            }
        }
    )

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

const htmlFile = open('../resources/gotenberg/index_test1.html')

export default function () {
    const url = apiUrl + 'public/api/v1/experiments/convert/html'
    const token = getAccessToken()

    const res = http.post(
        url,
        {
            files: http.file(htmlFile, 'index.html', 'text/html')
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )

    check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
        'response is pdf': (r) => r.headers['Content-Type'] === 'application/pdf'
    })

    if (SLEEP_INTERVAL > 0) {
        sleep(SLEEP_INTERVAL)
    }
}