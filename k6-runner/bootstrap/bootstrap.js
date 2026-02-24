// /opt/bootstrap/bootstrap.js
import { spawn } from 'node:child_process'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const requireEnv = (name) => {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
    }
    return value
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const withRetries = async (fn, label) => {
    const maxAttempts = 5
    let lastError

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (err) {
            lastError = err
            const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000)
            console.error(`${label} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${backoff}ms`)
            await sleep(backoff)
        }
    }

    throw new Error(`${label} failed after retries: ${String(lastError)}`)
}

const getParameter = async (ssm, name) => {
    const response = await withRetries(
        () =>
            ssm.send(
                new GetParameterCommand({
                    Name: name,
                    WithDecryption: true
                })
            ),
        `SSM:GetParameter:${name}`
    )

    const value = response.Parameter?.Value
    if (!value) {
        throw new Error(`SSM parameter has no value: ${name}`)
    }

    return value
}

const getSecret = async (secretsManager, secretId) => {
    const response = await withRetries(
        () =>
            secretsManager.send(
                new GetSecretValueCommand({
                    SecretId: secretId
                })
            ),
        `SecretsManager:GetSecretValue:${secretId}`
    )

    if (response.SecretString) {
        return response.SecretString
    }

    throw new Error(`Secret has no SecretString: ${secretId}`)
}

const main = async () => {
    const region =
        process.env.AWS_DEFAULT_REGION ||
        process.env.AWS_REGION

    const ssm = new SSMClient({ region })
    const secretsManager = new SecretsManagerClient({ region })

    // These are baked into task definition env
    const apiUrlParam = requireEnv('API_URL_PARAM')
    const cognitoDomainUrlParam = requireEnv('COGNITO_DOMAIN_URL_PARAM')
    const cognitoClientIdParam = requireEnv('COGNITO_CLIENT_ID_PARAM')
    const cognitoScopeParam = requireEnv('COGNITO_SCOPE_PARAM')
    const cognitoSecretName = requireEnv('COGNITO_CLIENT_SECRET_NAME')

    const [apiUrl, domainUrl, clientId, scope, clientSecret] = await Promise.all([
        getParameter(ssm, apiUrlParam),
        getParameter(ssm, cognitoDomainUrlParam),
        getParameter(ssm, cognitoClientIdParam),
        getParameter(ssm, cognitoScopeParam),
        getSecret(secretsManager, cognitoSecretName)
    ])

    // Inject resolved values for k6 to consume via __ENV
    process.env.API_URL = apiUrl
    process.env.COGNITO_DOMAIN_URL = domainUrl
    process.env.COGNITO_CLIENT_ID = clientId
    process.env.COGNITO_SCOPE = scope
    process.env.COGNITO_CLIENT_SECRET = clientSecret

    const testPath = 'tests/synth.js'

    console.log('Starting k6 with resolved configuration')

    const child = spawn('k6', ['run', testPath], {
        stdio: 'inherit',
        env: process.env
    })

    child.on('exit', (code, signal) => {
        if (signal) {
            console.error(`k6 exited due to signal ${signal}`)
            process.exit(1)
        }

        process.exit(code ?? 1)
    })
}

main().catch((err) => {
    console.error('Bootstrap failed:', err)
    process.exit(1)
})