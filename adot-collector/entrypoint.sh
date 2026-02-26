#!/bin/sh
set -e

CONFIG="${OTEL_CONFIG_YAML:+env:OTEL_CONFIG_YAML}"
CONFIG="${CONFIG:-/otel-config.yaml}"

echo "Starting awscollector with config: $CONFIG"

exec /awscollector --config "$CONFIG"