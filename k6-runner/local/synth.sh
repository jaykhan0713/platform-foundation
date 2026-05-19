#!/usr/bin/env bash
set -euo pipefail

export MSYS_NO_PATHCONV=1

export COGNITO_DOMAIN_URL_PARAM='/jay-platform/prod/gateway/cognito/domain-url'
export COGNITO_CLIENT_ID_PARAM='/jay-platform/prod/gateway/cognito/synth-client-id'
export COGNITO_SCOPE_PARAM='/jay-platform/prod/gateway/cognito/synth-invoke-scope'
export API_URL_PARAM='/jay-platform/prod/gateway/api/api-url'

export COGNITO_CLIENT_SECRET_NAME='jay-platform/prod/gateway/cognito/synth-client-secret'

export AWS_DEFAULT_REGION='us-west-2'

node ./bootstrap/bootstrap.js
#k6 run ./tests/synth.js