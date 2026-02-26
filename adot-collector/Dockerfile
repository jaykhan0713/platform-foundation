FROM public.ecr.aws/aws-observability/aws-otel-collector:v0.46.0

COPY otel-config.yaml /otel-config.yaml
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]