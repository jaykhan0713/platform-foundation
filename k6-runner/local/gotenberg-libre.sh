#!/usr/bin/env bash
set -euo pipefail

export MSYS_NO_PATHCONV=1

export COGNITO_DOMAIN_URL_PARAM='/jay-platform/prod/gateway/cognito/domain-url'
export COGNITO_CLIENT_ID_PARAM='/jay-platform/prod/gateway/cognito/synth-client-id'
export COGNITO_SCOPE_PARAM='/jay-platform/prod/gateway/cognito/synth-invoke-scope'
export API_URL_PARAM='/jay-platform/prod/gateway/api/api-url'

export COGNITO_CLIENT_SECRET_NAME='jay-platform/prod/gateway/cognito/synth-client-secret'

export AWS_DEFAULT_REGION='us-west-2'

# ENV vars for test itself
export VIRTUAL_USERS='1'
export DURATION='5m'
export SLEEP_INTERVAL='0.05'
export TEST='gotenberg-libre'

node ./bootstrap/bootstrap.js
#k6 run ./tests/gotenberg.js
