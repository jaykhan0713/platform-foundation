FROM public.ecr.aws/aws-observability/aws-otel-collector:v0.46.0

COPY otel-config.yaml /otel-config.yaml

ENTRYPOINT ["/awscollector"]
CMD ["--config", "/otel-config.yaml"]